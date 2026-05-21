// src/app/(public)/[restaurantSlug]/iletisim/page.tsx
// İletişim sayfası — harita, telefon, sosyal linkler, çalışma saatleri

import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { restaurants, restaurantSettings, websiteSettings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, MessageCircle, Camera, Star, Clock, ChevronRight, Compass } from "lucide-react";

interface Props {
  params: Promise<{ restaurantSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const db = getDb();
  const restaurant = await db.select({ name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.slug, restaurantSlug))
    .get();
  if (!restaurant) return { title: "Bulunamadı" };
  return {
    title: `İletişim — ${restaurant.name}`,
    description: `${restaurant.name} adres, telefon ve iletişim bilgileri`,
  };
}

const DAYS = [
  { key: "monday", label: "Pazartesi" },
  { key: "tuesday", label: "Salı" },
  { key: "wednesday", label: "Çarşamba" },
  { key: "thursday", label: "Perşembe" },
  { key: "friday", label: "Cuma" },
  { key: "saturday", label: "Cumartesi" },
  { key: "sunday", label: "Pazar" },
];

function parseWorkingHours(json: string | null | undefined) {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Object.keys(parsed).length === 0) return null;

    // Check if the format is simple string: {"monday": "09:00 - 22:00", ...}
    if (typeof Object.values(parsed)[0] === "string") {
      return DAYS.map(({ key, label }) => {
        const shortKey = key.slice(0, 3);
        const timeStr = parsed[key] ?? parsed[shortKey] ?? "";
        const isClosed = timeStr.toLowerCase().includes("kapal") || !timeStr;
        return {
          key,
          label,
          displayTime: isClosed ? "Kapalı" : timeStr,
          closed: isClosed,
        };
      });
    }

    // Check if the format is nested object: {"monday": {"open": "09:00", "close": "22:00", "closed": false}}
    return DAYS.map(({ key, label }) => {
      const shortKey = key.slice(0, 3);
      const dayData = parsed[key] ?? parsed[shortKey];
      if (!dayData) return { key, label, displayTime: "—", closed: true };
      if (dayData.closed) return { key, label, displayTime: "Kapalı", closed: true };
      return {
        key,
        label,
        displayTime: `${dayData.open} – ${dayData.close}`,
        closed: false,
      };
    });
  } catch {
    return null;
  }
}

export default async function ContactPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const db = getDb();

  const restaurant = await db
    .select({ id: restaurants.id, name: restaurants.name, slug: restaurants.slug, isActive: restaurants.isActive })
    .from(restaurants)
    .where(and(eq(restaurants.slug, restaurantSlug), eq(restaurants.isActive, true)))
    .get();

  if (!restaurant) notFound();

  const settings = await db
    .select()
    .from(restaurantSettings)
    .where(eq(restaurantSettings.restaurantId, restaurant.id))
    .get();

  const website = await db
    .select({ primaryColor: websiteSettings.primaryColor })
    .from(websiteSettings)
    .where(eq(websiteSettings.restaurantId, restaurant.id))
    .get();

  const primaryColor = website?.primaryColor ?? "#c5a880";
  const workingHours = parseWorkingHours(settings?.workingHoursJson);

  // Bugün hangi gün? (0: Pazar, 1: Pazartesi, ...)
  const dayIndex = new Date().getDay();
  const todayKey = DAYS[dayIndex === 0 ? 6 : dayIndex - 1]?.key;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-subtle)", fontFamily: "var(--font-sans)", paddingBottom: 100 }}>
      {/* ── Top Bar ── */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
        className="no-select"
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={18} color={primaryColor} strokeWidth={2.5} />
            <span>İletişim & Konum</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{restaurant.name}</div>
        </div>
        <Link
          href={`/${restaurant.slug}`}
          className="tap-active"
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            textDecoration: "none",
            padding: "6px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontWeight: 500,
          }}
        >
          ← Ana Sayfa
        </Link>
      </div>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>
        {/* ── İletişim & Sosyal Grouped List ── */}
        <section className="no-select" style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            İletişim Kanalları
          </h2>
          <div
            style={{
              borderRadius: "var(--radius-xl)",
              background: "white",
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Adres */}
            {settings?.address && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "oklch(96% 0.01 240)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <MapPin size={18} color="var(--text-secondary)" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Adres</div>
                  <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{settings.address}</div>
                  {settings.googleMapsUrl && (
                    <a
                      href={settings.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-active"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 13, color: primaryColor, fontWeight: 700, textDecoration: "none" }}
                    >
                      Haritada Aç ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Telefon */}
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="tap-active"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px",
                  borderBottom: settings?.whatsapp || settings?.instagram || settings?.googleReviewUrl ? "1px solid var(--border-subtle)" : "none",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "oklch(96% 0.01 240)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Phone size={18} color="var(--text-secondary)" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Telefon</div>
                  <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700 }}>{settings.phone}</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </a>
            )}

            {/* WhatsApp */}
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="tap-active"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px",
                  borderBottom: settings?.instagram || settings?.googleReviewUrl ? "1px solid var(--border-subtle)" : "none",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "oklch(96% 0.12 145)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageCircle size={18} color="oklch(40% 0.18 145)" strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>WhatsApp</div>
                  <div style={{ fontSize: 14, color: "oklch(38% 0.18 145)", fontWeight: 700 }}>Sohbet Başlat</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </a>
            )}

            {/* Instagram */}
            {settings?.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="tap-active"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px",
                  borderBottom: settings?.googleReviewUrl ? "1px solid var(--border-subtle)" : "none",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Camera size={18} color="#c026d3" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Instagram</div>
                  <div style={{ fontSize: 14, color: "#c026d3", fontWeight: 700 }}>@{settings.instagram}</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </a>
            )}

            {/* Google Yorum */}
            {settings?.googleReviewUrl && (
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="tap-active"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Star size={18} color="#f59e0b" fill="#f59e0b" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Google Yorumları</div>
                  <div style={{ fontSize: 14, color: "#b45309", fontWeight: 700 }}>Bizi Google'da Değerlendirin</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </a>
            )}
          </div>
        </section>

        {/* ── Çalışma Saatleri (iOS style) ── */}
        {workingHours && (
          <section className="no-select">
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                paddingLeft: 4,
              }}
            >
              Çalışma Saatleri
            </h2>
            <div
              style={{
                background: "white",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-subtle)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                padding: "8px 0",
              }}
            >
              {workingHours.map(({ key, label, displayTime, closed }) => {
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: isToday ? `${primaryColor}12` : "transparent",
                      borderLeft: isToday ? `4px solid ${primaryColor}` : "none",
                      paddingLeft: isToday ? 12 : 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {label} {isToday && <span style={{ fontSize: 9, fontWeight: 800, background: primaryColor, color: "white", padding: "1px 5px", borderRadius: 4, marginLeft: 6, verticalAlign: "middle" }}>BUGÜN</span>}
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: closed ? "var(--text-tertiary)" : "var(--text-primary)",
                      }}
                    >
                      {displayTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
