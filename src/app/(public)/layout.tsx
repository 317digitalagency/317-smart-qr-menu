// src/app/(public)/layout.tsx
// Public restoran sayfaları — SEO indexlenebilir, dashboard navbar yok

import BottomNavBar from "./BottomNavBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ paddingBottom: "76px" }}>
        {children}
      </div>
      <BottomNavBar />
    </>
  );
}
