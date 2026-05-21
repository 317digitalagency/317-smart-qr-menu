// src/app/(platform-admin)/layout.tsx
// Platform Admin shell — Lucide Icons

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, Store, Users, Globe, LogOut, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, id: "admin-nav-overview" },
  { href: "/admin/restaurants", label: "Restoranlar", icon: Store, id: "admin-nav-restaurants" },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, id: "admin-nav-users" },
  { href: "/admin/domains", label: "Domainler", icon: Globe, id: "admin-nav-domains" },
];

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "platform_admin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "oklch(11% 0.015 265)", fontFamily: "var(--font-sans)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: "oklch(14% 0.018 265)",
        borderRight: "1px solid oklch(22% 0.025 265)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100dvh",
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px", borderBottom: "1px solid oklch(22% 0.025 265)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-md)",
              background: "oklch(55% 0.15 265)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={17} color="white" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "oklch(90% 0.05 265)", letterSpacing: "-0.3px", fontFamily: "var(--font-display)" }}>
                Platform Admin
              </div>
              <div style={{ fontSize: 11, color: "oklch(50% 0.04 265)" }}>menu.org.tr</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "10px", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "oklch(65% 0.05 265)",
                  textDecoration: "none",
                  marginBottom: 2,
                  transition: "background 150ms, color 150ms",
                }}
              >
                <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid oklch(22% 0.025 265)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "oklch(55% 0.15 265)",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {session.user.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "oklch(75% 0.05 265)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user.name}
              </div>
              <div style={{ fontSize: 10, color: "oklch(45% 0.03 265)" }}>Platform Admin</div>
            </div>
          </div>
          <a
            href="/api/auth/logout"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "oklch(50% 0.04 265)", textDecoration: "none",
              padding: "5px 8px", borderRadius: "var(--radius-sm)",
            }}
          >
            <LogOut size={13} strokeWidth={1.8} />
            Çıkış Yap
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", color: "oklch(85% 0.03 265)" }}>
        {children}
      </main>
    </div>
  );
}
