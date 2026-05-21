// src/app/(marketing)/features/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Özellikler — menu.org.tr",
  description: "menu.org.tr QR menü sisteminin tüm özellikleri: QR menü, Google yorum, kampanya, ürün tavsiyesi, davranış analitiği, mini web sitesi.",
};

const FEATURE_SECTIONS = [
  {
    icon: "📱",
    title: "QR Menü",
    subtitle: "Uygulama indirme yok. Saniyelerde açılır.",
    color: "#6366f1",
    items: [
      "Mobil öncelikli, uygulama hissi veren arayüz",
      "Kategori + ürün hiyerarşisi, sıralama",
      "Fiyat, açıklama, görsel, etiket (Popüler, Yeni, Vejetaryen)",
      "Alerjen bilgileri",
      "İndirimli fiyat gösterimi",
      "QR kodunu PNG/SVG olarak indir, yazdır",
      "UTM parametresi ile kaynak takibi",
    ],
  },
  {
    icon: "⭐",
    title: "Google Yorum Yönlendirme",
    subtitle: "Memnun müşterilerinizi Google'da değerlendirmeye yönlendirin.",
    color: "#f59e0b",
    items: [
      "Menü alt bölümünde gösterilen yorum CTA butonu",
      "Doğrudan Google Maps yorum sayfasına yönlendirme",
      "Kampanya ile entegre yorum aksiyonu",
      "Tıklanma sayısını analizde takip etme",
    ],
  },
  {
    icon: "📢",
    title: "Kampanya Sistemi",
    subtitle: "Özel teklifleri müşteriye anında ulaştırın.",
    color: "#ef4444",
    items: [
      "Başlık, açıklama, görsel ile kampanya kartı",
      "Bitiş tarihi ile süreli kampanya",
      "CTA seçenekleri: WhatsApp, menü yönlendirme, Google yorum, Instagram, directions",
      "Aktif/pasif durumu anlık değiştirme",
      "Kampanya tıklanma istatistikleri",
    ],
  },
  {
    icon: "🔀",
    title: "Ürün Tavsiyesi (Cross-Sell)",
    subtitle: "\"Bunu sipariş edenler bunu da aldı\" sistemi.",
    color: "#8b5cf6",
    items: [
      "Ürün bazlı tavsiye tanımı (A → B, C)",
      "QR menüde ürün detayında otomatik gösterim",
      "Sürükle-bırak sıralama",
      "Akıllı heuristic öneri motoru (analitik bazlı)",
      "Tavsiye tıklanma oranı raporu",
    ],
  },
  {
    icon: "📊",
    title: "Davranış Analitiği",
    subtitle: "Müşteri ne yapıyor? Artık biliyorsunuz.",
    color: "#22c55e",
    items: [
      "Günlük menü görüntüleme sayısı",
      "En çok görüntülenen ürünler ve kategoriler",
      "QR okutulma sayısı ve kaynak takibi",
      "Google yorum, WhatsApp, Instagram tıklanmaları",
      "Kampanya görüntüleme ve tıklanma oranı (CTR)",
      "30 günlük trend grafikleri",
    ],
  },
  {
    icon: "🌐",
    title: "Mini Web Sitesi",
    subtitle: "Her restoran için tam teşekküllü bir web varlığı.",
    color: "#0ea5e9",
    items: [
      "Kişiselleştirilebilir hero başlığı ve açıklaması",
      "Tema seçimi (Minimal, Zarif, Açık, Karanlık)",
      "Marka rengi ile tam uyum",
      "Adres, telefon, WhatsApp, Instagram, Google Haritalar",
      "Çalışma saatleri (gün bazlı, bugün vurgusu)",
      "Özel domain desteği (Pro+)",
      "SEO meta etiketleri otomatik oluşturulur",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: "100dvh", fontFamily: "var(--font-sans)", background: "white" }}>
      <style>{`.feature-item::before { content: "✓"; color: var(--color-primary); font-weight: 700; margin-right: 10px; flex-shrink: 0; }`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)", padding: "0 24px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 19, fontWeight: 800, color: "var(--color-primary)", textDecoration: "none", fontFamily: "var(--font-display)" }}>menu<span style={{ color: "var(--text-tertiary)" }}>.org.tr</span></Link>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/pricing" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 16px" }}>Fiyatlar</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "white", padding: "9px 20px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", textDecoration: "none" }}>Ücretsiz Başla</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "72px 24px 80px", background: "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(96% 0.025 60) 0%, white 70%)" }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, fontFamily: "var(--font-display)" }}>
          Her özellik, bir ihtiyaçtan doğdu
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
          Karmaşık restoran yazılımı değil. Gerçekten kullanılan, ölçülebilir dijital araçlar.
        </p>
      </section>

      {/* Feature Sections */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {FEATURE_SECTIONS.map((section, i) => (
            <div
              key={section.title}
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr",
                gap: 48,
                alignItems: "start",
                flexDirection: i % 2 === 0 ? "row" : "row-reverse",
              }}
            >
              <div style={{ padding: "36px", borderRadius: "var(--radius-xl)", background: "var(--bg-base)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>{section.icon}</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: "var(--font-display)", color: section.color }}>{section.title}</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{section.subtitle}</p>
              </div>
              <div style={{ paddingTop: 16 }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {section.items.map((item) => (
                    <li key={item} style={{ fontSize: 15, display: "flex", alignItems: "flex-start", lineHeight: 1.5 }}>
                      <span style={{ color: section.color, fontWeight: 700, marginRight: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--color-primary)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "var(--font-display)" }}>
          Tüm özellikler, tek platformda
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 36 }}>Başlangıç paketi ücretsiz. Bugün başla.</p>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: "var(--radius-full)", background: "white", color: "var(--color-primary)", fontSize: 16, fontWeight: 700, textDecoration: "none" }}>
          Ücretsiz Başla →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
        <Link href="/" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none", marginRight: 24 }}>← Ana Sayfa</Link>
        <Link href="/pricing" style={{ color: "var(--text-tertiary)", textDecoration: "none", marginRight: 24 }}>Fiyatlar</Link>
        © {new Date().getFullYear()} menu.org.tr · 317 Digital Agency
      </footer>
    </div>
  );
}
