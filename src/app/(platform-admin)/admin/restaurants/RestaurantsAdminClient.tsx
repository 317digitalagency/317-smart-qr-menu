"use client";
// src/app/(platform-admin)/admin/restaurants/RestaurantsAdminClient.tsx

import { useState } from "react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: number;
  phone: string | null;
  instagram: string | null;
}

export default function RestaurantsAdminClient({
  initialRestaurants,
}: {
  initialRestaurants: Restaurant[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleActive(id: string, current: boolean) {
    setToggling(id);
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggle", id, isActive: !current }),
    });
    setToggling(null);
    if (res.ok) {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !current } : r))
      );
    }
  }

  const tdStyle = { padding: "12px 10px", fontSize: 13 };
  const thStyle = {
    textAlign: "left" as const,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "oklch(50% 0.04 265)",
  };

  return (
    <div>
      {/* Search */}
      <input
        id="admin-restaurant-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Restoran adı veya slug ara..."
        style={{
          width: "100%",
          maxWidth: 380,
          padding: "10px 14px",
          borderRadius: "var(--radius-full)",
          border: "1.5px solid oklch(30% 0.04 265)",
          background: "oklch(18% 0.02 265)",
          color: "oklch(85% 0.04 265)",
          fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
          marginBottom: 16,
        }}
      />

      <div
        style={{
          background: "oklch(18% 0.025 265)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid oklch(28% 0.04 265)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid oklch(28% 0.04 265)" }}>
              <th style={thStyle}>Restoran</th>
              <th style={thStyle}>Slug / Menü URL</th>
              <th style={thStyle}>İletişim</th>
              <th style={thStyle}>Eklenme</th>
              <th style={thStyle}>Durum</th>
              <th style={thStyle}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "oklch(45% 0.03 265)",
                    fontSize: 13,
                  }}
                >
                  Sonuç yok
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid oklch(22% 0.03 265)",
                  opacity: r.isActive ? 1 : 0.55,
                }}
              >
                <td style={{ ...tdStyle, fontWeight: 700, color: "oklch(85% 0.04 265)" }}>
                  {r.name}
                </td>
                <td style={{ ...tdStyle }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "oklch(60% 0.04 265)",
                      marginBottom: 2,
                    }}
                  >
                    {r.slug}
                  </div>
                  <a
                    href={`/${r.slug}/menu`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: "#818cf8" }}
                  >
                    /{r.slug}/menu ↗
                  </a>
                </td>
                <td style={{ ...tdStyle, fontSize: 12, color: "oklch(60% 0.04 265)" }}>
                  {r.phone && <div>{r.phone}</div>}
                  {r.instagram && <div>@{r.instagram}</div>}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    fontSize: 12,
                    color: "oklch(50% 0.04 265)",
                  }}
                >
                  {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td style={tdStyle}>
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
                <td style={tdStyle}>
                  <button
                    onClick={() => toggleActive(r.id, r.isActive)}
                    disabled={toggling === r.id}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${r.isActive ? "oklch(35% 0.08 15)" : "oklch(35% 0.08 142)"}`,
                      background: "transparent",
                      color: r.isActive ? "#f87171" : "#34d399",
                      cursor: toggling === r.id ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    {toggling === r.id ? "..." : r.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
