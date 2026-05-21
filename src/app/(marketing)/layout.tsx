// src/app/(marketing)/layout.tsx
import type { Metadata } from "next";
import WhatsAppWidget from "./WhatsAppWidget";

export const metadata: Metadata = {
  title: "menu.org.tr — Restoranınız İçin Akıllı QR Menü",
  description:
    "Minimal web sitesi, QR menü, kampanya yönetimi, Google yorum yönlendirme ve müşteri davranış analitiği. Cloudflare üzerinde çalışan hızlı ve ölçeklenebilir SaaS.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <WhatsAppWidget />
    </>
  );
}
