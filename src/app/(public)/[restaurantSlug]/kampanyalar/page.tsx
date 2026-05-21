// src/app/(public)/[restaurantSlug]/kampanyalar/page.tsx
// Aktif kampanyalar listesi — public, KV cache-first

import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { restaurants, campaigns, restaurantSettings, websiteSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, MessageCircle, Star, Camera, Compass, Clock, Sparkles, Tag } from "lucide-react";

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
    title: `Kampanyalar — ${restaurant.name}`,
    description: `${restaurant.name} restoran kampanyaları ve özel teklifler`,
  };
}

export default async function CampaignsPublicPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const db = getDb();

  const restaurant = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      isActive: restaurants.isActive,
    })
    .from(restaurants)
    .where(and(eq(restaurants.slug, restaurantSlug), eq(restaurants.isActive, true)))
    .get();

  if (!restaurant) notFound();

  const now = Date.now();
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.restaurantId, restaurant.id),
        eq(campaigns.isActive, true),
        sql`(${campaigns.endDate} IS NULL OR ${campaigns.endDate} > ${now})`
      )
    );

  const settings = await db
    .select({
      googleReviewUrl: restaurantSettings.googleReviewUrl,
      whatsapp: restaurantSettings.whatsapp,
    })
    .from(restaurantSettings)
    .where(eq(restaurantSettings.restaurantId, restaurant.id))
    .get();

  const website = await db
    .select({ primaryColor: websiteSettings.primaryColor })
    .from(websiteSettings)
    .where(eq(websiteSettings.restaurantId, restaurant.id))
    .get();

  const primaryColor = website?.primaryColor ?? "#c5a880";

  const CTA_CONFIG: Record<string, { label: string; icon: React.ReactNode; buildHref: (val: string | null) => string | null }> = {
    whatsapp: {
      label: "WhatsApp ile Katıl",
      icon: <MessageCircle size={15} strokeWidth={2.5} />,
      buildHref: (val) =>
        `https://wa.me/${settings?.whatsapp ?? ""}${val ? `?text=${encodeURIComponent(val)}` : ""}`,
    },
    google_review: {
      label: "Google'da Puan Ver",
      icon: <Star size={15} strokeWidth={2.5} fill="currentColor" />,
      buildHref: () => settings?.googleReviewUrl ?? null,
    },
    instagram: {
      label: "Instagram'da Takip Et",
      icon: <Camera size={15} strokeWidth={2.5} />,
      buildHref: () => null,
    },
    menu: {
      label: "Menüyü İncele",
      icon: <Compass size={15} strokeWidth={2.5} />,
      buildHref: () => `/${restaurantSlug}/menu`,
    },
  };

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
            <Megaphone size={18} color={primaryColor} strokeWidth={2.5} />
            <span>Fırsatlar & Kampanyalar</span>
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
        {activeCampaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-tertiary)" }} className="no-select">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${primaryColor}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Tag size={28} color={primaryColor} strokeWidth={1.8} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", margin: "0 0 4px" }}>Aktif Kampanya Bulunmuyor</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Yeni kampanyalar eklendiğinde burada görünecek.</p>
            <Link
              href={`/${restaurantSlug}/menu`}
              className="tap-active"
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "10px 24px",
                borderRadius: "var(--radius-full)",
                background: primaryColor,
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "var(--shadow-md)",
              }}
            >
              Menüye Göz At
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeCampaigns.map((campaign) => {
              const ctaConfig = CTA_CONFIG[campaign.ctaType];
              const ctaHref = ctaConfig?.buildHref(campaign.ctaValue ?? null) ?? null;

              return (
                <div
                  key={campaign.id}
                  style={{
                    background: "white",
                    borderRadius: "var(--radius-xl)",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {campaign.imageUrl && (
                    <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden" }}>
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: primaryColor }}>
                        <Sparkles size={11} fill={primaryColor} strokeWidth={1} />
                        <span>ÖZEL</span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "20px" }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {campaign.title}
                    </h2>
                    <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
                      {campaign.description}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: ctaHref ? 12 : 0, borderTop: ctaHref ? "1px solid var(--border-subtle)" : "none" }}>
                      {campaign.endDate ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
                          <Clock size={13} strokeWidth={2} />
                          <span>Son gün: {new Date(campaign.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span>
                        </div>
                      ) : (
                        <div />
                      )}

                      {ctaHref && ctaConfig && (
                        <a
                          href={ctaHref}
                          target={campaign.ctaType !== "menu" ? "_blank" : undefined}
                          rel="noreferrer"
                          className="tap-active"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 18px",
                            borderRadius: "var(--radius-full)",
                            background: primaryColor,
                            color: "white",
                            fontWeight: 700,
                            fontSize: 13,
                            textDecoration: "none",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          {ctaConfig.icon}
                          <span>{ctaConfig.label}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
