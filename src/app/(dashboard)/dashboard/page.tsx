// src/app/(dashboard)/dashboard/page.tsx
// Dashboard ana sayfası — Lucide Icons

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, restaurants, dailyAnalytics, dailyEntityAnalytics, products, categories } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { generateInsights } from "@/lib/recommendations";
import {
  Smartphone, BarChart2, Star, Megaphone, MessageCircle,
  Navigation, UtensilsCrossed, LayoutList,
  Lightbulb, Rocket, Plus, Eye, QrCode, Camera,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();

  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1)
    .get();

  if (!membership) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          Henüz bir restorana bağlı değilsiniz. Lütfen yöneticinize başvurun.
        </p>
      </div>
    );
  }

  const restaurantId = membership.restaurantId;
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const todayMetrics = await db.select().from(dailyAnalytics)
    .where(and(eq(dailyAnalytics.restaurantId, restaurantId), eq(dailyAnalytics.date, today))).get();

  const weeklyRows = await db.select().from(dailyAnalytics)
    .where(and(eq(dailyAnalytics.restaurantId, restaurantId), gte(dailyAnalytics.date, sevenDaysAgo)));

  const weeklyTotals = weeklyRows.reduce(
    (acc, row) => ({
      menuViews: acc.menuViews + row.menuViews,
      googleReviewClicks: acc.googleReviewClicks + row.googleReviewClicks,
      campaignClicks: acc.campaignClicks + row.campaignClicks,
      whatsappClicks: acc.whatsappClicks + row.whatsappClicks,
      instagramClicks: acc.instagramClicks + row.instagramClicks,
      directionsClicks: acc.directionsClicks + row.directionsClicks,
    }),
    { menuViews: 0, googleReviewClicks: 0, campaignClicks: 0, whatsappClicks: 0, instagramClicks: 0, directionsClicks: 0 }
  );

  const topProduct = await db.select().from(dailyEntityAnalytics)
    .where(and(eq(dailyEntityAnalytics.restaurantId, restaurantId), eq(dailyEntityAnalytics.entityType, "product"), gte(dailyEntityAnalytics.date, sevenDaysAgo)))
    .orderBy(desc(dailyEntityAnalytics.views)).limit(1).get();

  let topProductName = "—";
  if (topProduct) {
    const prod = await db.select({ name: products.name }).from(products).where(eq(products.id, topProduct.entityId)).get();
    if (prod) topProductName = prod.name;
  }

  const topCategory = await db.select().from(dailyEntityAnalytics)
    .where(and(eq(dailyEntityAnalytics.restaurantId, restaurantId), eq(dailyEntityAnalytics.entityType, "category"), gte(dailyEntityAnalytics.date, sevenDaysAgo)))
    .orderBy(desc(dailyEntityAnalytics.views)).limit(1).get();

  let topCategoryName = "—";
  if (topCategory) {
    const cat = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, topCategory.entityId)).get();
    if (cat) topCategoryName = cat.name;
  }

  const insights = await generateInsights(restaurantId);

  const restaurant = await db
    .select({ name: restaurants.name, slug: restaurants.slug })
    .from(restaurants).where(eq(restaurants.id, restaurantId)).get();

  const STAT_CARDS = [
    { label: "Bugün Menü", value: todayMetrics?.menuViews ?? 0, Icon: Smartphone, color: "#6366f1", bg: "#f0f0ff" },
    { label: "Bu Hafta Menü", value: weeklyTotals.menuViews, Icon: BarChart2, color: "#8b5cf6", bg: "#f5f0ff" },
    { label: "Google Yorum", value: weeklyTotals.googleReviewClicks, Icon: Star, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Kampanya Tıklama", value: weeklyTotals.campaignClicks, Icon: Megaphone, color: "#ef4444", bg: "#fff5f5" },
    { label: "WhatsApp", value: weeklyTotals.whatsappClicks, Icon: MessageCircle, color: "#22c55e", bg: "#f0fdf4" },
    { label: "Instagram", value: weeklyTotals.instagramClicks, Icon: Camera, color: "#ec4899", bg: "#fdf4ff" },
    { label: "Yol Tarifi", value: weeklyTotals.directionsClicks, Icon: Navigation, color: "#3b82f6", bg: "#eff6ff" },
    { label: "En Çok Görülen Ürün", value: topProductName, Icon: UtensilsCrossed, color: "var(--color-primary)", bg: "oklch(97% 0.02 60)" },
    { label: "En Çok Görülen Kategori", value: topCategoryName, Icon: LayoutList, color: "var(--color-primary)", bg: "oklch(97% 0.02 60)" },
  ];

  const INSIGHT_ICONS: Record<string, React.ElementType> = {
    category: LayoutList,
    product: UtensilsCrossed,
    campaign: Megaphone,
    review: Star,
    qr: QrCode,
  };

  const QUICK_ACTIONS = [
    { href: "/dashboard/menu/products", label: "Ürün Ekle", Icon: Plus },
    { href: "/dashboard/campaigns", label: "Kampanya Oluştur", Icon: Megaphone },
    { href: "/dashboard/qr", label: "QR Üret", Icon: QrCode },
    { href: restaurant ? `/${restaurant.slug}/menu` : "#", label: "Menüyü Gör", Icon: Eye },
  ];

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 no-select">

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] m-0 font-display">
          Merhaba, {session.user.name.split(" ")[0]}
        </h1>
        <p className="text-xs md:text-sm text-[var(--text-secondary)] m-0 mt-1">
          {restaurant?.name ?? ""} · {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.Icon;
          return (
            <div key={card.label} className="p-4 rounded-[var(--radius-xl)] bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div style={{ width: 28, height: 28, borderRadius: "var(--radius-md)", background: card.bg }} className="flex items-center justify-center shrink-0">
                  <Icon size={14} color={card.color} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider leading-tight truncate">
                  {card.label}
                </span>
              </div>
              <div 
                className="font-extrabold font-display leading-tight truncate"
                style={{
                  fontSize: typeof card.value === "number" ? 28 : 15,
                  color: card.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Heuristic Öneriler */}
      {insights.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm md:text-base font-bold mb-4 text-[var(--text-primary)] font-display flex items-center gap-2">
            <Lightbulb size={16} className="text-[var(--color-primary)]" strokeWidth={2} />
            Sistem Önerileri
          </h2>
          <div className="flex flex-col gap-2.5">
            {insights.map((insight, i) => {
              const InsightIcon = INSIGHT_ICONS[insight.type] ?? Lightbulb;
              return (
                <div key={i} className="p-4 rounded-[var(--radius-lg)] bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3">
                    <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "oklch(97% 0.02 60)" }} className="flex items-center justify-center shrink-0 mt-0.5">
                      <InsightIcon size={16} className="text-[var(--color-primary)]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[13.5px] text-[var(--text-primary)] leading-snug">{insight.title}</div>
                      <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{insight.description}</div>
                    </div>
                  </div>
                  {insight.actionHref && (
                    <a 
                      href={insight.actionHref} 
                      className="shrink-0 text-center px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold no-underline w-full sm:w-auto tap-active"
                    >
                      {insight.actionLabel}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hızlı İşlemler */}
      <section className="mb-4">
        <h2 className="text-sm md:text-base font-bold mb-4 text-[var(--text-primary)] font-display flex items-center gap-2">
          <Rocket size={16} className="text-[var(--color-primary)]" strokeWidth={2} />
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.Icon;
            return (
              <a 
                key={action.href} 
                href={action.href} 
                className="flex items-center justify-center sm:justify-start gap-2.5 p-3.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-white text-xs font-bold text-[var(--text-primary)] no-underline transition-all tap-active"
              >
                <Icon size={14} className="text-[var(--color-primary)] shrink-0" strokeWidth={2} />
                <span className="truncate">{action.label}</span>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
