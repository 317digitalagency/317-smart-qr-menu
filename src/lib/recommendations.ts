// src/lib/recommendations.ts
// Heuristic (kural bazlı) öneri motoru
// AI gerektirmez — daily_entity_analytics verisiyle çalışır

import { getDb } from "@/db";
import {
  dailyEntityAnalytics,
  dailyAnalytics,
  products,
  categories,
  campaigns,
} from "@/db/schema";
import { eq, and, gte, desc, gt } from "drizzle-orm";

export interface Insight {
  type: "category" | "product" | "campaign" | "review" | "qr";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

/**
 * Son 7 günün verilerine dayalı heuristic öneriler üretir.
 * Dashboard'da "Sistem Önerileri" kartında gösterilir.
 */
export async function generateInsights(
  restaurantId: string
): Promise<Insight[]> {
  const db = getDb();
  const insights: Insight[] = [];

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ─── 1. En çok görüntülenen kategori ──────────────────────
  const topCategory = await db
    .select()
    .from(dailyEntityAnalytics)
    .where(
      and(
        eq(dailyEntityAnalytics.restaurantId, restaurantId),
        eq(dailyEntityAnalytics.entityType, "category"),
        gte(dailyEntityAnalytics.date, sevenDaysAgo)
      )
    )
    .orderBy(desc(dailyEntityAnalytics.views))
    .limit(1)
    .get();

  if (topCategory && topCategory.views > 10) {
    const cat = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, topCategory.entityId))
      .get();

    if (cat) {
      insights.push({
        type: "category",
        title: `"${cat.name}" bu hafta yoğun ilgi gördü`,
        description: `${topCategory.views} kez görüntülendi. Bu kategorideki popüler ürünlerinizi öne çıkarmayı düşünün.`,
        actionLabel: "Ürünleri düzenle",
        actionHref: "/dashboard/menu/products",
      });
    }
  }

  // ─── 2. Düşük CTR'lı ürünler (görüntülenme yüksek, tıklama düşük) ──
  const lowCtrProducts = await db
    .select()
    .from(dailyEntityAnalytics)
    .where(
      and(
        eq(dailyEntityAnalytics.restaurantId, restaurantId),
        eq(dailyEntityAnalytics.entityType, "product"),
        gte(dailyEntityAnalytics.date, sevenDaysAgo),
        gt(dailyEntityAnalytics.views, 30)
      )
    )
    .all();

  const lowCtr = lowCtrProducts.filter(
    (p) => p.views > 0 && p.clicks / p.views < 0.05
  );

  if (lowCtr.length > 0) {
    insights.push({
      type: "product",
      title: `${lowCtr.length} ürün çok görülüyor ama az tıklanıyor`,
      description:
        "Bu ürünlerin fotoğrafı, açıklaması veya fiyatı ilgi çekmeyebilir. Güncelleme fark yaratabilir.",
      actionLabel: "Ürünleri incele",
      actionHref: "/dashboard/analytics",
    });
  }

  // ─── 3. Yüksek Google yorum tıklaması — kampanya önerisi ──────
  const recentDays = await db
    .select({ googleReviewClicks: dailyAnalytics.googleReviewClicks })
    .from(dailyAnalytics)
    .where(
      and(
        eq(dailyAnalytics.restaurantId, restaurantId),
        gte(dailyAnalytics.date, sevenDaysAgo)
      )
    )
    .all();

  const totalReviewClicks = recentDays.reduce(
    (sum, d) => sum + d.googleReviewClicks,
    0
  );

  if (totalReviewClicks >= 20) {
    insights.push({
      type: "review",
      title: "Google yorum butonu çok tıklanıyor",
      description: `Bu hafta ${totalReviewClicks} kez tıklandı. Yoruma özel indirim kampanyası oluşturarak yorum sayınızı artırabilirsiniz.`,
      actionLabel: "Kampanya oluştur",
      actionHref: "/dashboard/campaigns",
    });
  }

  // ─── 4. Aktif kampanya yoksa uyar ─────────────────────────────
  const activeCampaigns = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.restaurantId, restaurantId),
        eq(campaigns.isActive, true)
      )
    )
    .limit(1)
    .get();

  if (!activeCampaigns) {
    insights.push({
      type: "campaign",
      title: "Aktif kampanyanız yok",
      description:
        "Müşterileri harekete geçirmek için özel bir teklif oluşturun. Kampanyalar WhatsApp, Google yorum veya Instagram'a yönlendirebilir.",
      actionLabel: "Kampanya oluştur",
      actionHref: "/dashboard/campaigns",
    });
  }

  // ─── 5. QR kaynak karşılaştırması ──────────────────────────────
  const qrStats = await db
    .select()
    .from(dailyEntityAnalytics)
    .where(
      and(
        eq(dailyEntityAnalytics.restaurantId, restaurantId),
        eq(dailyEntityAnalytics.entityType, "qr"),
        gte(dailyEntityAnalytics.date, sevenDaysAgo)
      )
    )
    .orderBy(desc(dailyEntityAnalytics.views))
    .limit(2)
    .all();

  if (qrStats.length >= 2 && qrStats[0].views > qrStats[1].views * 2) {
    insights.push({
      type: "qr",
      title: "Bir QR kaynağı çok daha fazla okuttuluyor",
      description:
        "En çok okutulan QR konumuna odaklanarak oradaki deneyimi iyileştirebilirsiniz.",
      actionLabel: "QR raporunu gör",
      actionHref: "/dashboard/analytics",
    });
  }

  return insights;
}
