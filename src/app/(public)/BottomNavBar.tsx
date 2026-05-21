"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, UtensilsCrossed, Tag, MapPin } from "lucide-react";

export default function BottomNavBar() {
  const pathname = usePathname();
  if (!pathname) return null;

  // Extract restaurant slug and active page segment
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const reservedWords = ["dashboard", "admin", "login", "register", "api", "forgot-password"];
  if (reservedWords.includes(firstSegment)) return null;

  const restaurantSlug = firstSegment;
  const activeTab = segments[1] || "home";

  const navItems = [
    {
      key: "home",
      label: "Ana Sayfa",
      icon: Store,
      href: `/${restaurantSlug}`,
    },
    {
      key: "menu",
      label: "Menü",
      icon: UtensilsCrossed,
      href: `/${restaurantSlug}/menu`,
    },
    {
      key: "kampanyalar",
      label: "Kampanyalar",
      icon: Tag,
      href: `/${restaurantSlug}/kampanyalar`,
    },
    {
      key: "iletisim",
      label: "İletişim",
      icon: MapPin,
      href: `/${restaurantSlug}/iletisim`,
    },
  ];

  return (
    <div
      className="no-select md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
      }}
    >
      {/* Mobile Bottom Nav Bar wrapper */}
      <div
        className="glass-nav safe-pb"
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: 66,
          maxWidth: 680,
          margin: "0 auto",
          borderRadius: "24px 24px 0 0",
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className="tap-active"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: isActive ? "var(--color-primary, #c5a880)" : "var(--text-tertiary, #9ca3af)",
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                position: "relative",
                height: "100%",
                gap: 3,
                transition: "color 150ms ease",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  transition: "transform 150ms ease",
                  transform: isActive ? "translateY(-1px)" : "none",
                }}
              />
              <span style={{ fontSize: "10px", transform: "scale(0.95)" }}>{item.label}</span>
              {isActive && (
                <div
                  className="active-nav-indicator"
                  style={{
                    backgroundColor: "var(--color-primary, #c5a880)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
