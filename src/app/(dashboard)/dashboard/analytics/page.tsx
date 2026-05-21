// src/app/(dashboard)/dashboard/analytics/page.tsx
// Davranış analitiği — günlük trendler, en çok görüntülenen ürünler

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import {
  restaurantMembers, dailyAnalytics, dailyEntityAnalytics,
  products, categories, campaigns
} from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const restaurantId = membership.restaurantId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Son 30 gün genel metrikler
  const dailyRows = await db.select().from(dailyAnalytics)
    .where(and(eq(dailyAnalytics.restaurantId, restaurantId), gte(dailyAnalytics.date, thirtyDaysAgo)))
    .orderBy(desc(dailyAnalytics.date));

  // En çok görüntülenen ürünler (7 gün)
  const topProductRows = await db.select().from(dailyEntityAnalytics)
    .where(and(
      eq(dailyEntityAnalytics.restaurantId, restaurantId),
      eq(dailyEntityAnalytics.entityType, "product"),
      gte(dailyEntityAnalytics.date, sevenDaysAgo)
    ))
    .orderBy(desc(dailyEntityAnalytics.views))
    .limit(10);

  // Ürün adlarını çek
  const productNames: Record<string, string> = {};
  for (const row of topProductRows) {
    const prod = await db.select({ name: products.name }).from(products).where(eq(products.id, row.entityId)).get();
    if (prod) productNames[row.entityId] = prod.name;
  }

  // En çok görüntülenen kategoriler (7 gün)
  const topCategoryRows = await db.select().from(dailyEntityAnalytics)
    .where(and(
      eq(dailyEntityAnalytics.restaurantId, restaurantId),
      eq(dailyEntityAnalytics.entityType, "category"),
      gte(dailyEntityAnalytics.date, sevenDaysAgo)
    ))
    .orderBy(desc(dailyEntityAnalytics.views))
    .limit(5);

  const categoryNames: Record<string, string> = {};
  for (const row of topCategoryRows) {
    const cat = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, row.entityId)).get();
    if (cat) categoryNames[row.entityId] = cat.name;
  }

  // Kampanya performansı (7 gün)
  const campaignRows = await db.select().from(dailyEntityAnalytics)
    .where(and(
      eq(dailyEntityAnalytics.restaurantId, restaurantId),
      eq(dailyEntityAnalytics.entityType, "campaign"),
      gte(dailyEntityAnalytics.date, sevenDaysAgo)
    ))
    .orderBy(desc(dailyEntityAnalytics.clicks))
    .limit(5);

  const campaignTitles: Record<string, string> = {};
  for (const row of campaignRows) {
    const cam = await db.select({ title: campaigns.title }).from(campaigns).where(eq(campaigns.id, row.entityId)).get();
    if (cam) campaignTitles[row.entityId] = cam.title;
  }

  // 30 günlük toplamlar
  const totals30 = dailyRows.reduce((acc, r) => ({
    menuViews: acc.menuViews + r.menuViews,
    googleReviewClicks: acc.googleReviewClicks + r.googleReviewClicks,
    campaignClicks: acc.campaignClicks + r.campaignClicks,
    whatsappClicks: acc.whatsappClicks + r.whatsappClicks,
    instagramClicks: acc.instagramClicks + r.instagramClicks,
    qrScans: acc.qrScans + r.qrScans,
  }), { menuViews: 0, googleReviewClicks: 0, campaignClicks: 0, whatsappClicks: 0, instagramClicks: 0, qrScans: 0 });

  const cardStyle = {
    padding: "20px",
    borderRadius: "var(--radius-xl)",
    background: "white",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
        Analizler
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Son 30 günlük müşteri davranış verileri
      </p>

      {/* ── 30 Günlük Özet Kartlar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Menü Görüntüleme", value: totals30.menuViews, icon: "📱", color: "#6366f1" },
          { label: "QR Okutulma", value: totals30.qrScans, icon: "📊", color: "#8b5cf6" },
          { label: "Google Yorum", value: totals30.googleReviewClicks, icon: "⭐", color: "#f59e0b" },
          { label: "Kampanya Tıklama", value: totals30.campaignClicks, icon: "📢", color: "#ef4444" },
          { label: "WhatsApp", value: totals30.whatsappClicks, icon: "💬", color: "#22c55e" },
          { label: "Instagram", value: totals30.instagramClicks, icon: "📸", color: "#ec4899" },
        ].map(card => (
          <div key={card.label} style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: card.color, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* ── En Çok Görüntülenen Ürünler ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🍽️ En Çok Görüntülenen Ürünler (7 gün)</h2>
          {topProductRows.length === 0 ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Henüz veri yok</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topProductRows.map((row, i) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-tertiary)", width: 20 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{productNames[row.entityId] ?? row.entityId}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{row.views} görüntüleme · {row.clicks} tıklama</div>
                  </div>
                  <div style={{ height: 6, width: 60, borderRadius: 99, background: "var(--surface-muted)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((row.views / (topProductRows[0]?.views || 1)) * 100)}%`, background: "var(--color-primary)", borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── En Çok Görüntülenen Kategoriler ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 En Çok Görüntülenen Kategoriler (7 gün)</h2>
          {topCategoryRows.length === 0 ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Henüz veri yok</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topCategoryRows.map((row, i) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-tertiary)", width: 20 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{categoryNames[row.entityId] ?? row.entityId}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{row.views} görüntüleme</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Kampanya Performansı ── */}
      {campaignRows.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📢 Kampanya Performansı (7 gün)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaignRows.map(row => (
              <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{campaignTitles[row.entityId] ?? row.entityId}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{row.views} görüntüleme · {row.clicks} tıklama</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                  {row.views > 0 ? `%${Math.round((row.clicks / row.views) * 100)} CTR` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Günlük Menü Görüntülemeleri Tablosu ── */}
      {dailyRows.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📅 Günlük Trafik (Son 30 Gün)</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)" }}>
                  {["Tarih", "Menü Görüntüleme", "QR Okutulma", "Google Yorum", "WhatsApp", "Kampanya"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-tertiary)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyRows.slice(0, 14).map(row => (
                  <tr key={row.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                      {new Date(row.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </td>
                    <td style={{ padding: "8px 12px" }}>{row.menuViews}</td>
                    <td style={{ padding: "8px 12px" }}>{row.qrScans}</td>
                    <td style={{ padding: "8px 12px" }}>{row.googleReviewClicks}</td>
                    <td style={{ padding: "8px 12px" }}>{row.whatsappClicks}</td>
                    <td style={{ padding: "8px 12px" }}>{row.campaignClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
