// src/app/(auth)/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap — menu.org.tr",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, var(--brand-50) 0%, var(--surface-base) 60%)",
      }}
    >
      {children}
    </div>
  );
}
