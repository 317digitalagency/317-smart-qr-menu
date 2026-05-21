// src/app/(platform-admin)/admin/domains/page.tsx
// Platform Admin — Custom domain listesi + durum

import { getDb } from "@/db";
import { restaurantDomains, restaurants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function AdminDomainsPage() {
  const db = getDb();

  const domains = await db
    .select({
      id: restaurantDomains.id,
      domain: restaurantDomains.domain,
      isVerified: restaurantDomains.isVerified,
      isPrimary: restaurantDomains.isPrimary,
      verificationToken: restaurantDomains.verificationToken,
      createdAt: restaurantDomains.createdAt,
      restaurantName: restaurants.name,
      restaurantSlug: restaurants.slug,
    })
    .from(restaurantDomains)
    .leftJoin(restaurants, eq(restaurants.id, restaurantDomains.restaurantId))
    .orderBy(sql`${restaurantDomains.createdAt} DESC`);

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
        Custom Domain'ler
      </h1>
      <p style={{ color: "oklch(55% 0.04 265)", fontSize: 13, marginBottom: 28 }}>
        {domains.length} kayıtlı domain · Cloudflare Workers Routes ile yönetilir
      </p>

      {domains.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
          <p style={{ color: "oklch(55% 0.04 265)", margin: 0 }}>
            Henüz custom domain tanımlanmadı.
          </p>
          <p style={{ color: "oklch(40% 0.03 265)", fontSize: 12, marginTop: 4 }}>
            İşletmeler Dashboard → Ayarlar'dan domain ekleyebilir.
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(28% 0.04 265)" }}>
                {["Domain", "Restoran", "DNS Doğrulama", "Birincil", "Eklenme"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "oklch(50% 0.04 265)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr
                  key={d.id}
                  style={{ borderBottom: "1px solid oklch(22% 0.03 265)" }}
                >
                  <td
                    style={{
                      padding: "12px 10px",
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "oklch(80% 0.04 265)",
                      fontWeight: 600,
                    }}
                  >
                    {d.domain}
                  </td>
                  <td
                    style={{
                      padding: "12px 10px",
                      fontSize: 13,
                      color: "oklch(65% 0.04 265)",
                    }}
                  >
                    {d.restaurantName ?? "—"}
                    {d.restaurantSlug && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "oklch(45% 0.04 265)",
                          fontFamily: "monospace",
                        }}
                      >
                        {d.restaurantSlug}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: d.isVerified
                          ? "oklch(25% 0.08 142)"
                          : "oklch(25% 0.08 60)",
                        color: d.isVerified ? "#34d399" : "#fbbf24",
                      }}
                    >
                      {d.isVerified ? "✓ Doğrulandı" : "⏳ Bekliyor"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    {d.isPrimary ? (
                      <span style={{ fontSize: 11, color: "#818cf8" }}>
                        ✓ Birincil
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "oklch(40% 0.03 265)" }}>
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 10px",
                      fontSize: 12,
                      color: "oklch(50% 0.04 265)",
                    }}
                  >
                    {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
