"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Globe,
  LayoutList,
  UtensilsCrossed,
  Sparkles,
  Megaphone,
  QrCode,
  Network,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
} from "lucide-react";

interface DashboardShellClientProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
  };
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/dashboard/restaurant", label: "Restoran Bilgileri", icon: Store, id: "nav-restaurant" },
  { href: "/dashboard/website", label: "Web Sitesi", icon: Globe, id: "nav-website" },
  { href: "/dashboard/menu/categories", label: "Kategoriler", icon: LayoutList, id: "nav-categories" },
  { href: "/dashboard/menu/products", label: "Ürünler", icon: UtensilsCrossed, id: "nav-products" },
  { href: "/dashboard/recommendations", label: "Tavsiye Ürünler", icon: Sparkles, id: "nav-recommendations" },
  { href: "/dashboard/campaigns", label: "Kampanyalar", icon: Megaphone, id: "nav-campaigns" },
  { href: "/dashboard/qr", label: "QR Kodlar", icon: QrCode, id: "nav-qr" },
  { href: "/dashboard/domains", label: "Domainler", icon: Network, id: "nav-domains" },
  { href: "/dashboard/analytics", label: "Analizler", icon: BarChart3, id: "nav-analytics" },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings, id: "nav-settings" },
];

export default function DashboardShellClient({ children, user }: DashboardShellClientProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Touch Swipe to Dismiss logic
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
      currentY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 120) {
      setDrawerOpen(false);
    }
    setDragY(0);
  };

  // Primary active tabs on bottom nav bar
  const bottomTabs = [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/dashboard/menu/categories", label: "Kategori", icon: LayoutList },
    { href: "/dashboard/menu/products", label: "Ürünler", icon: UtensilsCrossed },
    { href: "/dashboard/analytics", label: "Analiz", icon: BarChart3 },
  ];

  // Secondary items for "More" drawer
  const moreItems = NAV_ITEMS.filter(
    (item) => !bottomTabs.some((tab) => tab.href === item.href)
  );

  return (
    <div className="flex min-h-[100dvh] bg-[var(--surface-base)] text-[var(--text-primary)] font-sans antialiased overflow-x-hidden">
      
      {/* ── Desktop Sidebar (Hidden on mobile) ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-[var(--border-subtle)] flex-col sticky top-0 h-screen overflow-y-auto no-select z-20">
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="no-underline">
            <div className="text-lg font-extrabold text-[var(--color-primary)] tracking-tight font-display">
              menu.org.tr
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-medium tracking-wider">
              Yönetim Paneli
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="p-3 flex-1 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[13.5px] font-medium transition-all duration-150
                  ${isActive 
                    ? "bg-[oklch(95%_0.02_60)] text-[var(--color-primary)]" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                <Icon 
                  size={16} 
                  strokeWidth={1.8} 
                  className={`shrink-0 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"}`} 
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info footer in sidebar */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                {user.email}
              </div>
            </div>
          </div>
          <a
            href="/api/auth/logout"
            id="nav-logout"
            className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors p-1.5 rounded-[var(--radius-sm)]"
          >
            <LogOut size={13} strokeWidth={1.8} />
            Çıkış Yap
          </a>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Mobile Top Header (Hidden on desktop) ── */}
        <header className="md:hidden sticky top-0 z-30 h-14 bg-white/92 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between px-4 no-select">
          <Link href="/dashboard" className="no-underline flex flex-col">
            <span className="text-base font-extrabold text-[var(--color-primary)] tracking-tight font-display leading-none">
              menu.org.tr
            </span>
            <span className="text-[9.5px] text-[var(--text-tertiary)] mt-0.5 font-medium tracking-wider">
              Yönetim Paneli
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[oklch(95%_0.02_60)] text-[var(--color-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Actual Page Component Content */}
        <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden w-full">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (Hidden on desktop) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-lg border-t border-[var(--border-subtle)] pb-[env(safe-area-inset-bottom)] shadow-lg no-select">
        <div className="h-16 flex items-center justify-around px-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center flex-1 h-full tap-active"
              >
                <div className={`relative p-1 rounded-full transition-transform duration-100 ${isActive ? "scale-105" : ""}`}>
                  <Icon 
                    size={21} 
                    strokeWidth={isActive ? 2.2 : 1.8} 
                    className={isActive ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"} 
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Dahası / More tab trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full tap-active border-none bg-transparent"
          >
            <div className={`relative p-1 rounded-full transition-transform duration-100 ${drawerOpen ? "scale-105" : ""}`}>
              <Menu 
                size={21} 
                strokeWidth={drawerOpen ? 2.2 : 1.8} 
                className={drawerOpen ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"} 
              />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 ${drawerOpen ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"}`}>
              Dahası
            </span>
          </button>
        </div>
      </div>

      {/* ── Premium Mobile Drawer (Slide-up menu) ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 transition-opacity duration-300">
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-all"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Slide-up container */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-2xl max-h-[85vh] flex flex-col"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? "none" : "transform 250ms cubic-bezier(0.25, 0.8, 0.25, 1)"
            }}
          >
            {/* Gesture handle */}
            <div 
              className="py-3 cursor-grab active:cursor-grabbing w-full flex justify-center shrink-0 select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 bg-[oklch(85%_0.01_240)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-[var(--border-subtle)] shrink-0 select-none">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">Tüm İşlemler</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">Yönetici kısayol menüsü</p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-secondary)] border-none tap-active"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drawer menu list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
              <div className="bg-[var(--surface-subtle)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col p-1.5 gap-0.5">
                {moreItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all tap-active text-sm font-medium
                        ${isActive 
                          ? "bg-[oklch(95%_0.02_60)] text-[var(--color-primary)]" 
                          : "text-[var(--text-primary)] active:bg-white/60"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${isActive ? "bg-white text-[var(--color-primary)]" : "bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)]"}
                        `}>
                          <Icon size={16} strokeWidth={1.8} />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
                    </Link>
                  );
                })}
              </div>

              {/* Logout inside drawer */}
              <div className="mt-4 mb-8">
                <a
                  href="/api/auth/logout"
                  className="flex items-center justify-center gap-2 w-full p-3.5 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm border border-red-100 tap-active"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Güvenli Çıkış Yap
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
