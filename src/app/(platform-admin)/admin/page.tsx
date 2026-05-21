// src/app/(platform-admin)/admin/page.tsx
// Platform Admin — Genel bakış

import { getDb } from "@/db";
import { restaurants, users, restaurantMembers } from "@/db/schema";
import { sql, count } from "drizzle-orm";

export default async function AdminOverviewPage() {
  const db = getDb();

  const [restaurantCount, userCount] = await Promise.all([
    db.select({ count: count() }).from(restaurants).get(),
    db.select({ count: count() }).from(users).get(),
  ]);

  // Son 5 restoran
  const recentRestaurants = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      isActive: restaurants.isActive,
      createdAt: restaurants.createdAt,
    })
    .from(restaurants)
    .orderBy(sql`${restaurants.createdAt} DESC`)
    .limit(5);

  const cardStyle = {
    padding: "24px",
    borderRadius: "var(--radius-xl)",
    background: "oklch(18% 0.025 265)",
    border: "1px solid oklch(28% 0.04 265)",
  };

  return (
    <div style={{ padding: 32 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 4px",
          fontFamily: "var(--font-display)",
          color: "oklch(92% 0.04 265)",
        }}
      >
        Platform Genel Bakış
      </h1>
      <p style={{ color: "oklch(55% 0.04 265)", fontSize: 13, marginBottom: 28 }}>
        menu.org.tr global metrikler
      </p>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "Toplam Restoran",
            value: restaurantCount?.count ?? 0,
            icon: "🏪",
            color: "#818cf8",
          },
          {
            label: "Toplam Kullanıcı",
            value: userCount?.count ?? 0,
            icon: "👥",
            color: "#34d399",
          },
          {
            label: "Aktif Plan",
            value: "MVP",
            icon: "🚀",
            color: "#fbbf24",
          },
        ].map((card) => (
          <div key={card.label} style={cardStyle}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "oklch(55% 0.05 265)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              {card.icon} {card.label}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: card.color,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Son Eklenen Restoranlar */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 16,
            color: "oklch(80% 0.04 265)",
          }}
        >
          🕒 Son Eklenen Restoranlar
        </h2>
        {recentRestaurants.length === 0 ? (
          <p style={{ color: "oklch(45% 0.03 265)", fontSize: 13 }}>
            Henüz restoran yok.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "1px solid oklch(28% 0.04 265)" }}
              >
                {["Adı", "Slug", "Durum", "Eklenme"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: "oklch(50% 0.04 265)",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRestaurants.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid oklch(22% 0.03 265)" }}
                >
                  <td
                    style={{
                      padding: "10px 10px",
                      fontWeight: 600,
                      color: "oklch(85% 0.04 265)",
                    }}
                  >
                    {r.name}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      color: "oklch(60% 0.04 265)",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {r.slug}
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: r.isActive
                          ? "oklch(25% 0.08 142)"
                          : "oklch(22% 0.03 265)",
                        color: r.isActive ? "#34d399" : "oklch(45% 0.03 265)",
                      }}
                    >
                      {r.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      fontSize: 12,
                      color: "oklch(50% 0.04 265)",
                    }}
                  >
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
