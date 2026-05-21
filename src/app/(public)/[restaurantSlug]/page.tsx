// src/app/(public)/[restaurantSlug]/page.tsx
// Restoran mini web sitesi — SEO, Open Graph, JSON-LD schema

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/db";
import { restaurants, restaurantSettings, websiteSettings, products, campaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cacheFirst, CacheKeys } from "@/lib/cache";
import { formatPrice } from "@/lib/qr";
import { UtensilsCrossed, MessageCircle, Navigation, Tag, MapPin, Phone, Star, Camera, ChevronRight, Megaphone } from "lucide-react";

interface Props {
  params: Promise<{ restaurantSlug: string }>;
}

// ─────────────────────────────────────────────────────────
// Veri çekme helpers
// ─────────────────────────────────────────────────────────

async function getRestaurantData(slug: string) {
  const db = getDb();
  return cacheFirst(
    CacheKeys.restaurant(slug),
    async () => {
      const restaurant = await db
        .select()
        .from(restaurants)
        .where(and(eq(restaurants.slug, slug), eq(restaurants.isActive, true)))
        .get();

      if (!restaurant) return null;

      const [settings, website, featuredProducts, activeCampaigns] = await Promise.all([
        db.select().from(restaurantSettings)
          .where(eq(restaurantSettings.restaurantId, restaurant.id)).get(),
        db.select().from(websiteSettings)
          .where(eq(websiteSettings.restaurantId, restaurant.id)).get(),
        db.select().from(products)
          .where(and(
            eq(products.restaurantId, restaurant.id),
            eq(products.isFeatured, true),
            eq(products.isActive, true)
          )).limit(6),
        db.select().from(campaigns)
          .where(and(
            eq(campaigns.restaurantId, restaurant.id),
            eq(campaigns.isActive, true)
          )).limit(3),
      ]);

      return { restaurant, settings, website, featuredProducts, activeCampaigns };
    },
    300
  );
}

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const data = await getRestaurantData(restaurantSlug);
  if (!data) return { title: "Sayfa bulunamadı" };

  const { restaurant, settings, website } = data;
  const title = `${restaurant.name} — Menü & Kampanyalar`;
  const description = settings?.description ?? website?.heroDescription ?? `${restaurant.name} dijital menüsü`;
  const imageUrl = settings?.coverUrl ?? settings?.logoUrl;
  const canonicalUrl = `${process.env.PUBLIC_URL ?? "https://menu.org.tr"}/${restaurant.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: restaurant.name,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      type: "website",
      locale: "tr_TR",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────
// Çalışma saatleri parser
// ─────────────────────────────────────────────────────────

const DAY_LABELS: Record<string, string> = {
  mon: "Pazartesi",
  tue: "Salı",
  wed: "Çarşamba",
  thu: "Perşembe",
  fri: "Cuma",
  sat: "Cumartesi",
  sun: "Pazar",
};

function parseWorkingHours(json: string | null | undefined) {
  if (!json) return null;
  try {
    const hours = JSON.parse(json) as Record<string, string>;
    return Object.entries(hours).map(([day, time]) => ({
      day: DAY_LABELS[day] ?? day,
      time,
    }));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Sayfa
// ─────────────────────────────────────────────────────────

export default async function RestaurantPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const data = await getRestaurantData(restaurantSlug);
  if (!data) notFound();

  const { restaurant, settings, website, featuredProducts, activeCampaigns } = data;
  const workingHours = parseWorkingHours(settings?.workingHoursJson);
  const primaryColor = website?.primaryColor ?? "#c5a880";
  const baseUrl = process.env.PUBLIC_URL ?? "https://menu.org.tr";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: settings?.description ?? "",
    url: `${baseUrl}/${restaurant.slug}`,
    ...(settings?.logoUrl && { logo: settings.logoUrl }),
    ...(settings?.coverUrl && { image: settings.coverUrl }),
    ...(settings?.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address,
        addressCountry: "TR",
      },
    }),
    ...(settings?.phone && { telephone: settings.phone }),
    ...(settings?.googleMapsUrl && { hasMap: settings.googleMapsUrl }),
    ...(workingHours && {
      openingHours: workingHours.map((h) => `${h.day.slice(0, 2)} ${h.time}`),
    }),
    sameAs: [
      settings?.instagram && `https://instagram.com/${settings.instagram}`,
      settings?.googleMapsUrl,
    ].filter(Boolean),
    servesCuisine: "Türk Mutfağı",
    menu: `${baseUrl}/${restaurant.slug}/menu`,
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ fontFamily: "var(--font-sans)", minHeight: "100dvh", paddingBottom: 100, background: "var(--surface-subtle)" }}>
        {/* ── Hero Section ── */}
        <section
          style={{
            position: "relative",
            minHeight: "42dvh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
            background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}11 100%)`,
          }}
        >
          {/* Cover image */}
          {settings?.coverUrl && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${settings.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                zIndex: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, var(--surface-subtle) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)",
                }}
              />
            </div>
          )}

          {/* Logo + Name */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "0 20px 24px",
              color: settings?.coverUrl ? "white" : "var(--text-primary)",
            }}
          >
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={`${restaurant.name} logo`}
                width={68}
                height={68}
                style={{
                  borderRadius: "var(--radius-xl)",
                  marginBottom: 12,
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.4)",
                  boxShadow: "var(--shadow-md)",
                }}
              />
            )}
            <h1
              style={{
                fontSize: "clamp(26px, 6.5vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: "0 0 8px",
                textShadow: settings?.coverUrl ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
                fontFamily: "var(--font-display)",
              }}
            >
              {restaurant.name}
            </h1>
            {settings?.description && (
              <p
                style={{
                  fontSize: 14,
                  opacity: 0.9,
                  margin: 0,
                  maxWidth: 420,
                  lineHeight: 1.5,
                  textShadow: settings?.coverUrl ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
                }}
              >
                {settings.description}
              </p>
            )}
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section
          style={{
            padding: "20px 20px 0",
            display: "flex",
            gap: 10,
          }}
          className="no-select"
        >
          {/* Menüye Git */}
          <Link
            href={`/${restaurant.slug}/menu`}
            id="btn-go-to-menu"
            className="tap-active"
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "16px 20px",
              borderRadius: "var(--radius-xl)",
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <UtensilsCrossed size={18} strokeWidth={2.5} />
            Menüyü Gör
          </Link>

          {/* WhatsApp */}
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              id="btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="tap-active"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px",
                borderRadius: "var(--radius-xl)",
                background: "oklch(96% 0.12 145)",
                color: "oklch(35% 0.15 145)",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
                border: "1px solid oklch(90% 0.12 145)",
                textAlign: "center",
              }}
            >
              <MessageCircle size={18} strokeWidth={2.5} />
              Sipariş
            </a>
          )}

          {/* Yol Tarifi */}
          {settings?.googleMapsUrl && (
            <a
              href={settings.googleMapsUrl}
              id="btn-directions"
              target="_blank"
              rel="noopener noreferrer"
              className="tap-active"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px",
                borderRadius: "var(--radius-xl)",
                background: "oklch(96% 0.01 240)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
                border: "1px solid var(--border-default)",
                textAlign: "center",
              }}
            >
              <Navigation size={18} strokeWidth={2.5} />
              Konum
            </a>
          )}
        </section>

        {/* ── Aktif Kampanyalar ── */}
        {activeCampaigns && activeCampaigns.length > 0 && (
          <section style={{ padding: "32px 20px 0" }}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 12,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Megaphone size={16} color={primaryColor} strokeWidth={2} />
              Güncel Kampanyalar
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-xl)",
                    border: `1px solid ${primaryColor}22`,
                    background: "white",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {campaign.imageUrl && (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      width={64}
                      height={64}
                      style={{ borderRadius: "var(--radius-lg)", objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: "var(--text-primary)" }}>
                      {campaign.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {campaign.description}
                    </div>
                  </div>
                  <Link
                    href={`/${restaurant.slug}/kampanyalar`}
                    className="tap-active"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-full)",
                      background: `${primaryColor}12`,
                      color: primaryColor,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Detay
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Öne Çıkan Ürünler (Yatay Snap-Scroll) ── */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section style={{ padding: "32px 20px 0" }}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 12,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Star size={16} color={primaryColor} strokeWidth={2} fill={primaryColor} />
              Öne Çıkan Ürünler
            </h2>
            <div
              className="custom-scrollbar scroll-fade-right"
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 10,
                scrollSnapType: "x mandatory",
                margin: "0 -20px",
                paddingLeft: 20,
                paddingRight: 20,
              }}
            >
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/${restaurant.slug}/menu?product=${product.id}`}
                  className="tap-active"
                  style={{
                    textDecoration: "none",
                    flexShrink: 0,
                    width: 140,
                    scrollSnapAlign: "start",
                  }}
                >
                  <div
                    className="product-card"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "white",
                      borderRadius: "var(--radius-xl)",
                      overflow: "hidden",
                      height: "100%",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          width: "100%",
                          aspectRatio: "1.1",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1.1",
                          background: `${primaryColor}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <UtensilsCrossed size={28} color={primaryColor} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ padding: "10px" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.name}
                      </div>
                      <div style={{ fontWeight: 800, color: primaryColor, fontSize: 14 }}>
                        {formatPrice(product.priceKurus)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── İletişim & Çalışma Saatleri (iOS style) ── */}
        {(settings?.address || settings?.phone || workingHours) && (
          <section style={{ padding: "32px 20px 24px" }} className="no-select">
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                paddingLeft: 4,
              }}
            >
              İletişim & Çalışma Saatleri
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
              {settings?.address && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "oklch(96% 0.01 240)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <MapPin size={16} color="var(--text-secondary)" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Adres</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.4 }}>{settings.address}</div>
                  </div>
                </div>
              )}

              {settings?.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="tap-active"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "inherit",
                    borderBottom: workingHours ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "oklch(96% 0.01 240)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Phone size={16} color="var(--text-secondary)" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 2 }}>Telefon</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 600 }}>{settings.phone}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </a>
              )}

              {workingHours && (
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 8 }}>Çalışma Saatleri</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {workingHours.map((h) => {
                      const today = new Date().toLocaleDateString("tr-TR", { weekday: "long" });
                      const isToday = h.day.toLowerCase() === today.toLowerCase();

                      return (
                        <div
                          key={h.day}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            color: isToday ? "var(--text-primary)" : "var(--text-secondary)",
                            fontWeight: isToday ? 700 : 400,
                            padding: isToday ? "6px 10px" : "0px",
                            background: isToday ? `${primaryColor}12` : "transparent",
                            borderRadius: isToday ? "var(--radius-md)" : "0px",
                            border: isToday ? `1px solid ${primaryColor}22` : "none",
                          }}
                        >
                          <span>{h.day} {isToday && <span style={{ fontSize: 9, fontWeight: 800, background: primaryColor, color: "white", padding: "1px 5px", borderRadius: 4, marginLeft: 6, verticalAlign: "middle" }}>BUGÜN</span>}</span>
                          <span>{h.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Sosyal Medya ve Yorumlar (iOS style) ── */}
        {(settings?.googleReviewUrl || settings?.instagram) && (
          <section style={{ padding: "0 20px 32px" }} className="no-select">
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                paddingLeft: 4,
              }}
            >
              Sosyal Medya & Yorumlar
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
              {settings?.googleReviewUrl && (
                <a
                  href={settings.googleReviewUrl}
                  id="btn-google-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-active"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    borderBottom: settings?.instagram ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Star size={16} color="#f59e0b" fill="#f59e0b" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Google&apos;da Puan Verin</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </a>
              )}

              {settings?.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  id="btn-instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-active"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Camera size={16} color="#c026d3" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Instagram&apos;da takip edin</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer
          style={{
            textAlign: "center",
            padding: "24px 16px 40px",
            fontSize: 12,
            color: "var(--text-tertiary)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <a
            href="https://menu.org.tr"
            style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}
          >
            menu.org.tr ile güçlendirilmiştir
          </a>
        </footer>
      </main>
    </>
  );
}
