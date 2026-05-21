// src/app/(marketing)/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fiyatlandırma — menu.org.tr",
  description: "menu.org.tr QR menü sistemi fiyatları. Başlangıç paketi ücretsiz. Pro ve Zincir paketleri ile daha fazla özellik.",
};

const PLANS = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    period: "",
    desc: "Tek şube, temel dijital varlık",
    features: [
      { text: "1 restoran", included: true },
      { text: "QR menü", included: true },
      { text: "500 ürüne kadar", included: true },
      { text: "Temel analitik (7 gün)", included: true },
      { text: "Google yorum yönlendirme", included: true },
      { text: "Kampanya sistemi", included: false },
      { text: "Ürün tavsiyesi", included: false },
      { text: "Özel domain", included: false },
      { text: "Öncelikli destek", included: false },
    ],
    cta: "Ücretsiz Başla",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₺299",
    period: "/ay",
    desc: "Büyüyen tek veya çok şubeli işletmeler",
    features: [
      { text: "3 restoran", included: true },
      { text: "QR menü", included: true },
      { text: "Sınırsız ürün", included: true },
      { text: "Gelişmiş analitik (90 gün)", included: true },
      { text: "Google yorum yönlendirme", included: true },
      { text: "Kampanya sistemi", included: true },
      { text: "Ürün tavsiyesi", included: true },
      { text: "Özel domain", included: true },
      { text: "Öncelikli destek", included: false },
    ],
    cta: "14 Gün Ücretsiz Dene",
    href: "/login",
    highlight: true,
  },
  {
    name: "Zincir",
    price: "₺799",
    period: "/ay",
    desc: "Çok şubeli zincir restoranlar için",
    features: [
      { text: "Sınırsız restoran", included: true },
      { text: "QR menü", included: true },
      { text: "Sınırsız ürün", included: true },
      { text: "Tam analitik (1 yıl)", included: true },
      { text: "Google yorum yönlendirme", included: true },
      { text: "Kampanya sistemi", included: true },
      { text: "Ürün tavsiyesi", included: true },
      { text: "Özel domain", included: true },
      { text: "Dedicated öncelikli destek", included: true },
    ],
    cta: "Teklif Alın",
    href: "mailto:hello@menu.org.tr",
    highlight: false,
  },
];

const FAQ = [
  { q: "Ücretsiz paket ne kadar süre ücretsiz?", a: "Süresiz. Ücretsiz paket için zaman sınırı yoktur." },
  { q: "Kredi kartı bilgisi gerekiyor mu?", a: "Başlangıç paketi için hayır. Pro ve Zincir paketleri için ödeme başlamadan önce bildirim yapılır." },
  { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet, her zaman. Abonelik iptali anında gerçekleşir, ek ücret alınmaz." },
  { q: "Özel domain nasıl çalışıyor?", a: "Pro+ paketlerde kendi domainini (örn. cafemiray.com) QR menüne bağlayabilirsin. DNS ayarı 5 dakika sürer." },
  { q: "Ürün görseli yükleyebilir miyim?", a: "Evet. Cloudflare R2 üzerinde depolanan görsellerle menünü zenginleştirebilirsin." },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100dvh", fontFamily: "var(--font-sans)", background: "white" }}>
      <style>{`
        .plan-hover:hover { transform: translateY(-3px); }
        .faq-item { border-bottom: 1px solid var(--border-subtle); }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)", padding: "0 24px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 19, fontWeight: 800, color: "var(--color-primary)", textDecoration: "none", fontFamily: "var(--font-display)" }}>menu<span style={{ color: "var(--text-tertiary)" }}>.org.tr</span></Link>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "white", padding: "9px 20px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", textDecoration: "none" }}>Ücretsiz Başla</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "72px 24px 64px", background: "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(96% 0.025 60) 0%, white 70%)" }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, fontFamily: "var(--font-display)" }}>
          Şeffaf fiyatlandırma
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, maxWidth: 480, margin: "0 auto" }}>
          Gizli ücret yok. İstediğin zaman iptal. İlk ay ücretsiz.
        </p>
      </section>

      {/* Plans */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="plan-hover"
              style={{
                padding: "36px 28px",
                borderRadius: "var(--radius-xl)",
                background: plan.highlight ? "var(--color-primary)" : "white",
                border: plan.highlight ? "none" : "1px solid var(--border-subtle)",
                boxShadow: plan.highlight ? "0 8px 48px rgba(197,168,128,0.35)" : "var(--shadow-sm)",
                color: plan.highlight ? "white" : "var(--text-primary)",
                transition: "all var(--transition-base)",
                position: "relative",
              }}
            >
              {plan.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "oklch(42% 0.08 60)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>
                  EN POPÜLER
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{plan.price}</span>
                <span style={{ fontSize: 14, opacity: 0.65 }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 28 }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f.text} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 10, opacity: f.included ? 1 : 0.4 }}>
                    <span style={{ fontWeight: 700, flexShrink: 0, color: f.included ? (plan.highlight ? "white" : "var(--color-primary)") : "currentcolor" }}>
                      {f.included ? "✓" : "✕"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                style={{
                  display: "block", textAlign: "center", padding: "13px",
                  borderRadius: "var(--radius-full)",
                  background: plan.highlight ? "white" : "var(--color-primary)",
                  color: plan.highlight ? "var(--color-primary)" : "white",
                  fontWeight: 700, fontSize: 15, textDecoration: "none",
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "var(--bg-base)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 48, textAlign: "center", fontFamily: "var(--font-display)" }}>
            Sık sorulan sorular
          </h2>
          {FAQ.map((item) => (
            <div key={item.q} className="faq-item" style={{ padding: "24px 0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
        <Link href="/" style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none", marginRight: 24 }}>← Ana Sayfa</Link>
        © {new Date().getFullYear()} menu.org.tr · 317 Digital Agency
      </footer>
    </div>
  );
}
