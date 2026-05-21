// src/app/layout.tsx
// Root layout — tüm route gruplarının ortak üst katmanı

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "menu.org.tr — Restoran QR Menü Sistemi",
    template: "%s | menu.org.tr",
  },
  description:
    "Restoran ve kafeler için minimal web sitesi, QR menü, kampanya yönetimi ve müşteri davranış analitiği.",
  metadataBase: new URL(
    process.env.PUBLIC_URL ?? "https://menu.org.tr"
  ),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "menu.org.tr",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SmartMenu" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
