"use client";
// src/app/(platform-admin)/admin/users/UsersAdminClient.tsx

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: number;
}

interface MemberEntry {
  restaurantName: string;
  restaurantSlug: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "🛡️ Platform Admin",
  restaurant_admin: "👤 Restoran Admin",
  manager: "👔 Yönetici",
  staff: "🧑‍🍳 Personel",
  viewer: "👁️ Görüntüleyici",
};

export default function UsersAdminClient({
  users,
  memberMap,
}: {
  users: User[];
  memberMap: Record<string, MemberEntry[]>;
}) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
      <input
        id="admin-user-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="İsim veya e-posta ara..."
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
          boxSizing: "border-box" as const,
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
              <th style={thStyle}>Kullanıcı</th>
              <th style={thStyle}>E-posta</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Üyelikler</th>
              <th style={thStyle}>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
            {filtered.map((u) => (
              <>
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid oklch(22% 0.03 265)" }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 700,
                      color: "oklch(85% 0.04 265)",
                    }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: "oklch(65% 0.04 265)",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    {u.email}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background:
                          u.role === "platform_admin"
                            ? "oklch(25% 0.12 290)"
                            : "oklch(22% 0.03 265)",
                        color:
                          u.role === "platform_admin"
                            ? "#c4b5fd"
                            : "oklch(65% 0.04 265)",
                        fontWeight: 600,
                      }}
                    >
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {(memberMap[u.id] ?? []).length > 0 ? (
                      <button
                        onClick={() =>
                          setExpandedUser(expandedUser === u.id ? null : u.id)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#818cf8",
                          fontSize: 12,
                          fontFamily: "inherit",
                          padding: 0,
                        }}
                      >
                        {(memberMap[u.id] ?? []).length} restoran{" "}
                        {expandedUser === u.id ? "▲" : "▼"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "oklch(45% 0.03 265)" }}>
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: "oklch(50% 0.04 265)",
                    }}
                  >
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
                {expandedUser === u.id && (memberMap[u.id] ?? []).length > 0 && (
                  <tr key={`${u.id}-expand`}>
                    <td
                      colSpan={5}
                      style={{
                        padding: "8px 10px 12px 40px",
                        background: "oklch(15% 0.02 265)",
                        borderBottom: "1px solid oklch(22% 0.03 265)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(memberMap[u.id] ?? []).map((m, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 99,
                              background: "oklch(22% 0.03 265)",
                              color: "oklch(65% 0.04 265)",
                              border: "1px solid oklch(30% 0.04 265)",
                            }}
                          >
                            {m.restaurantName}{" "}
                            <span style={{ opacity: 0.6 }}>({m.role})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
