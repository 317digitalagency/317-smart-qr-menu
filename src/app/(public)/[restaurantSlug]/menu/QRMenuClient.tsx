"use client";
// src/app/(public)/[restaurantSlug]/menu/QRMenuClient.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  trackMenuView, trackCategoryView, trackProductClick,
  trackProductView, trackCampaignClick, trackButtonClick, trackRecommendationClick,
} from "@/lib/analytics-client";
import { formatPrice } from "@/lib/qr";
import { UtensilsCrossed, TriangleAlert, Handshake, Star, MessageCircle, ChevronRight, X, Tag as TagIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types (inline — server'dan geldiği için schema import yok)
// ─────────────────────────────────────────────────────────

interface Restaurant { id: string; name: string; slug: string }
interface Settings {
  logoUrl?: string | null;
  coverUrl?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  googleReviewUrl?: string | null;
  phone?: string | null;
}
interface WebsiteSettings { primaryColor?: string | null; theme?: string | null }
interface Category { id: string; name: string; coverUrl?: string | null }
interface Product {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  longDescription?: string | null;
  priceKurus: number;
  discountedPriceKurus?: number | null;
  imageUrl?: string | null;
  tagsJson?: string | null;
  allergensJson?: string | null;
  isPopular: boolean;
  isNew: boolean;
  isFeatured: boolean;
}
interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  ctaType: string;
  ctaValue?: string | null;
}

interface QRMenuClientProps {
  restaurant: Restaurant;
  settings: Settings | null;
  website: WebsiteSettings | null;
  categories: Category[];
  products: Product[];
  recommendationMap: Record<string, string[]>;
  campaigns: Campaign[];
}

// ─────────────────────────────────────────────────────────
// Tag parsers
// ─────────────────────────────────────────────────────────

function parseTags(json: string | null | undefined): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

// ─────────────────────────────────────────────────────────
// Product Detail Sheet (bottom drawer)
// ─────────────────────────────────────────────────────────

function ProductSheet({
  product,
  recommendations,
  primaryColor,
  onClose,
  onRecommendationClick,
  restaurantId,
}: {
  product: Product;
  recommendations: Product[];
  primaryColor: string;
  onClose: () => void;
  onRecommendationClick: (p: Product) => void;
  restaurantId: string;
}) {
  const tags = parseTags(product.tagsJson);
  const allergens = parseTags(product.allergensJson);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Sadece en üstte ise kaydırmaya izin ver
    if (e.currentTarget.scrollTop > 0) return;
    
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartY.current;

    if (diffY > 0) {
      setDragY(diffY);
      // Sürüklerken sayfa kaydırmasını engelle
      if (e.cancelable) e.preventDefault();
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 140) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const backdropOpacity = Math.max(0, 0.5 - (dragY / 400) * 0.5);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,0,0,${dragY > 0 ? backdropOpacity * 2 : 0.5})`,
          backdropFilter: `blur(${Math.max(0, 4 - (dragY / 100))}px)`,
          WebkitBackdropFilter: `blur(${Math.max(0, 4 - (dragY / 100))}px)`,
          transition: isDragging ? "none" : "background 200ms ease, backdrop-filter 200ms ease",
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          background: "white",
          borderRadius: "24px 24px 0 0",
          maxHeight: "92dvh",
          overflowY: "auto",
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Zarif IOS Tutamaç Çizgisi */}
        <div className="drawer-handle" />

        {/* Product Image */}
        {product.imageUrl ? (
          <div style={{ position: "relative" }}>
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
            />
            <button
              onClick={onClose}
              aria-label="Kapat"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div style={{ padding: "8px 20px 0", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              aria-label="Kapat"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--surface-muted)", border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {tags.map((tag) => (
                <span key={tag} className={`badge badge-${tag === "Popüler" ? "popular" : tag === "Yeni" ? "new" : "sale"}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Name & Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, fontFamily: "var(--font-display)" }}>
              {product.name}
            </h2>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {product.discountedPriceKurus ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>
                    {formatPrice(product.discountedPriceKurus)}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-tertiary)", textDecoration: "line-through" }}>
                    {formatPrice(product.priceKurus)}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>
                  {formatPrice(product.priceKurus)}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
            {product.longDescription ?? product.shortDescription}
          </p>

          {/* Allergens */}
          {allergens.length > 0 && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "oklch(98% 0.02 60)",
                border: "1px solid oklch(90% 0.04 60)",
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <TriangleAlert size={14} color="#d97706" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>Alerjenler:</strong> {allergens.join(", ")}</span>
            </div>
          )}

          {/* Tavsiye Ürünler */}
          {recommendations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Handshake size={14} color="var(--text-tertiary)" strokeWidth={1.8} />
                Birlikte Harika Gider
              </div>
              <div
                className="custom-scrollbar scroll-fade-right"
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 8,
                  scrollSnapType: "x mandatory",
                }}
              >
                {recommendations.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      trackRecommendationClick(restaurantId, rec.id);
                      onRecommendationClick(rec);
                    }}
                    className="tap-active"
                    style={{
                      flexShrink: 0,
                      width: 120,
                      scrollSnapAlign: "start",
                      background: "var(--surface-subtle)",
                      border: "1.5px solid var(--border-subtle)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 0,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {rec.imageUrl ? (
                      <img src={rec.imageUrl} alt={rec.name} style={{ width: "100%", aspectRatio: "1.2", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1.2", background: `${primaryColor}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UtensilsCrossed size={22} color={primaryColor} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: primaryColor }}>{formatPrice(rec.priceKurus)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Ana Client Component
// ─────────────────────────────────────────────────────────

export default function QRMenuClient({
  restaurant,
  settings,
  website,
  categories,
  products,
  recommendationMap,
  campaigns,
}: QRMenuClientProps) {
  const primaryColor = website?.primaryColor ?? "#c5a880";
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCampaignBanner, setShowCampaignBanner] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const tracked = useRef<Set<string>>(new Set());

  // Menü açılışında bir kez track et
  useEffect(() => {
    trackMenuView(restaurant.id);
  }, [restaurant.id]);

  // URL'deki ?product=... parametresine göre ürünü otomatik aç (Deep Linking)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get("product");
      if (prodId) {
        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          setSelectedProduct(prod);
        }
      }
    }
  }, [products]);

  // Intersection Observer — görünen kategoriyi takip et
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catId = entry.target.getAttribute("data-category-id");
            if (catId) {
              setActiveCategoryId(catId);
              // İlk kez görüntülendiğinde track et
              if (!tracked.current.has(catId)) {
                tracked.current.add(catId);
                trackCategoryView(restaurant.id, catId);
              }
            }
          }
        }
      },
      { threshold: 0.3 }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, restaurant.id]);

  // Kategori tab tıklaması → o bölüme scroll
  const handleCategoryClick = useCallback((catId: string) => {
    setActiveCategoryId(catId);
    isScrollingRef.current = true;
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isScrollingRef.current = false; }, 800);

    if (!tracked.current.has(catId)) {
      tracked.current.add(catId);
      trackCategoryView(restaurant.id, catId);
    }
  }, [restaurant.id]);

  // Ürün tıklaması → detail sheet aç
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    trackProductClick(restaurant.id, product.id, "menu");
    trackProductView(restaurant.id, product.id, "menu");
  }, [restaurant.id]);

  // Kampanya CTA
  const getCampaignHref = (campaign: Campaign): string => {
    switch (campaign.ctaType) {
      case "whatsapp":
        return settings?.whatsapp
          ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(campaign.ctaValue ?? "")}`
          : "#";
      case "instagram":
        return settings?.instagram ? `https://instagram.com/${settings.instagram}` : "#";
      case "google_review":
        return settings?.googleReviewUrl ?? "#";
      case "directions":
        return "#";
      default:
        return campaign.ctaValue ?? "#";
    }
  };

  // Seçili ürünün tavsiyelerini bul
  const selectedRecommendations = selectedProduct
    ? (recommendationMap[selectedProduct.id] ?? [])
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as Product[]
    : [];

  // Ürünleri kategoriye göre grupla
  const productsByCategory = categories.map((cat) => ({
    category: cat,
    products: products.filter((p) => p.categoryId === cat.id),
  }));

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100dvh",
          background: "var(--surface-subtle)",
          fontFamily: "var(--font-sans)",
          paddingBottom: 80,
        }}
      >
        {/* ── Top Bar ── */}
        <div
          style={{
            background: "white",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {settings?.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={restaurant.name}
              width={36}
              height={36}
              style={{ borderRadius: "var(--radius-md)", objectFit: "cover" }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {restaurant.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Dijital Menü</div>
          </div>
          <Link
            href={`/${restaurant.slug}`}
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            ← Web Sitesi
          </Link>
        </div>

        {/* ── Kampanya Banner ── */}
        {showCampaignBanner && campaigns.length > 0 && (
          <div
            style={{
              margin: "12px 16px",
              padding: "14px 16px",
              borderRadius: "var(--radius-xl)",
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              color: "white",
              display: "flex",
              gap: 12,
              alignItems: "center",
              animation: "fadeIn 300ms ease",
            }}
          >
            <span style={{ fontSize: 24 }}>
              <TagIcon size={22} color="white" strokeWidth={2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{campaigns[0].title}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{campaigns[0].description}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <a
                href={getCampaignHref(campaigns[0])}
                onClick={() => trackCampaignClick(restaurant.id, campaigns[0].id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255,255,255,0.25)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Detay
              </a>
              <button
                onClick={() => setShowCampaignBanner(false)}
                aria-label="Kapat"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ── Scroll-Snap Category Bar ── */}
        {categories.length > 0 && (
          <div
            className="category-bar"
            role="tablist"
            aria-label="Menü kategorileri"
            style={{
              padding: "10px 16px",
              gap: 8,
              position: "sticky",
              top: 59,
              zIndex: 20,
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                id={`tab-${cat.id}`}
                aria-selected={activeCategoryId === cat.id}
                aria-controls={`section-${cat.id}`}
                className="category-tab"
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  background:
                    activeCategoryId === cat.id ? primaryColor : "transparent",
                  color:
                    activeCategoryId === cat.id
                      ? "white"
                      : "var(--text-secondary)",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Ürün Listesi ── */}
        <div ref={scrollContainerRef} style={{ padding: "0 16px" }}>
          {productsByCategory.map(({ category, products: catProducts }) => {
            if (catProducts.length === 0) return null;
            return (
              <section
                key={category.id}
                id={`section-${category.id}`}
                data-category-id={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                style={{ marginTop: 24 }}
                aria-labelledby={`tab-${category.id}`}
              >
                {/* Kategori Başlığı */}
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                    margin: "0 0 14px",
                    fontFamily: "var(--font-display)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {category.coverUrl ? (
                    <img
                      src={category.coverUrl}
                      alt=""
                      width={24}
                      height={24}
                      style={{ borderRadius: 4, objectFit: "cover" }}
                    />
                  ) : null}
                  {category.name}
                </h2>

                {/* Ürün Grid */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {catProducts.map((product) => {
                    const tags = parseTags(product.tagsJson);
                    return (
                      <button
                        key={product.id}
                        id={`product-${product.id}`}
                        onClick={() => handleProductClick(product)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          display: "flex",
                          gap: 14,
                          padding: "14px",
                          borderRadius: "var(--radius-xl)",
                          background: "white",
                          border: "1px solid var(--border-subtle)",
                          boxShadow: "var(--shadow-sm)",
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                          width: "100%",
                          boxSizing: "border-box",
                          textAlign: "left",
                        }}
                        onPointerDown={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
                        }}
                        onPointerUp={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "";
                        }}
                        onPointerLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "";
                        }}
                      >
                        {/* Ürün Görseli */}
                        <div style={{ flexShrink: 0 }}>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              width={80}
                              height={80}
                              loading="lazy"
                              style={{ borderRadius: "var(--radius-lg)", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 80, height: 80,
                                borderRadius: "var(--radius-lg)",
                                background: `${primaryColor}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <UtensilsCrossed size={28} color={primaryColor} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>

                        {/* Ürün Bilgisi */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Badges */}
                          {tags.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
                              {product.isPopular && <span className="badge badge-popular">Popüler</span>}
                              {product.isNew && <span className="badge badge-new">Yeni</span>}
                              {product.discountedPriceKurus && <span className="badge badge-sale">İndirimli</span>}
                            </div>
                          )}

                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--text-primary)",
                              marginBottom: 4,
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {product.name}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {product.shortDescription}
                          </div>

                          {/* Fiyat */}
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            {product.discountedPriceKurus ? (
                              <>
                                <span style={{ fontWeight: 800, fontSize: 16, color: primaryColor }}>
                                  {formatPrice(product.discountedPriceKurus)}
                                </span>
                                <span style={{ fontSize: 13, color: "var(--text-tertiary)", textDecoration: "line-through" }}>
                                  {formatPrice(product.priceKurus)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 800, fontSize: 16, color: primaryColor }}>
                                {formatPrice(product.priceKurus)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Sağ ok */}
                        <div
                          style={{
                            color: "var(--text-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <ChevronRight size={17} strokeWidth={1.8} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Floating Action Buttons ── */}
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 10,
            zIndex: 40,
          }}
        >
          {settings?.googleReviewUrl && (
            <a
              href={settings.googleReviewUrl}
              id="fab-review"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick(restaurant.id, "google_review_click", "menu")}
              className="fab"
              style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Star size={14} color="white" fill="white" strokeWidth={1.5} />
              Yorum Bırak
            </a>
          )}
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              id="fab-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick(restaurant.id, "whatsapp_click", "menu")}
              className="fab"
              style={{ fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <MessageCircle size={18} strokeWidth={2} />
            </a>
          )}
        </div>
      </div>

      {/* ── Product Detail Sheet ── */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          recommendations={selectedRecommendations}
          primaryColor={primaryColor}
          onClose={() => setSelectedProduct(null)}
          onRecommendationClick={(p) => setSelectedProduct(p)}
          restaurantId={restaurant.id}
        />
      )}
    </>
  );
}
