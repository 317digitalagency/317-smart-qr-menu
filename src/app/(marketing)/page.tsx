// src/app/(marketing)/page.tsx
// menu.org.tr — Premium marketing landing page (Full Lucide Icons)

import type { Metadata } from "next";
import Link from "next/link";
import {
  QrCode, Star, Megaphone, Sparkles, BarChart3, Globe,
  Rocket, UtensilsCrossed, BarChart2, Smartphone, ArrowRight,
  CheckCircle2, UserPlus, Pencil, Printer, TrendingUp,
  ChevronRight, Coffee, Store, MapPin, Zap, Shield, Clock,
  Infinity as InfinityIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "menu.org.tr — Restoranınız İçin Akıllı QR Menü Sistemi",
  description:
    "Minimal web sitesi, QR menü, Google yorum yönlendirme, kampanya yönetimi ve müşteri davranış analitiği. Türkiye'nin restoranları için Cloudflare üzerinde çalışan hızlı dijital menü sistemi.",
  openGraph: {
    title: "menu.org.tr — Akıllı QR Menü Sistemi",
    description: "QR menü + Google yorum + kampanya + analitik. 5 dakikada kur, hemen kullan.",
    type: "website",
    locale: "tr_TR",
  },
};

const FEATURES = [
  { Icon: QrCode,    color: "#6366f1", bg: "#f0f0ff", title: "QR Menü",            description: "Müşteriler QR kodu okuttuğunda anında açılan, uygulama hissi veren hızlı menü. Uygulama indirme yok." },
  { Icon: Star,      color: "#f59e0b", bg: "#fffbeb", title: "Google Yorum",        description: "Müşterilerinizi yumuşak bir şekilde Google'da yorum bırakmaya yönlendirin. Reputasyonunuz artsın." },
  { Icon: Megaphone, color: "#ef4444", bg: "#fff5f5", title: "Kampanya Sistemi",    description: "WhatsApp, Instagram veya menü yönlendirmeli kampanya oluşturun. Süre sınırı koyun, tıklanmaları izleyin." },
  { Icon: Sparkles,  color: "#8b5cf6", bg: "#f5f0ff", title: "Ürün Tavsiyesi",     description: "Latte → Cookie, Burger → Patates gibi çapraz satış tanımlayın. Ortalama sepet tutarını artırın." },
  { Icon: BarChart3, color: "#22c55e", bg: "#f0fdf4", title: "Davranış Analitiği", description: "Hangi ürün çok görüldü, hangi kampanya tıklandı? Basit ve anlaşılır günlük raporlar." },
  { Icon: Globe,     color: "#0ea5e9", bg: "#f0f9ff", title: "Mini Web Sitesi",    description: "Her restoran için SEO'lu, mobil öncelikli modern bir web sitesi. Kendi domain desteği." },
];

const STEPS = [
  { num: "01", Icon: UserPlus,   color: "#6366f1", bg: "#f0f0ff", title: "Kaydol",           desc: "E-posta ile 30 saniyede hesap aç. Kredi kartı gerektirmez." },
  { num: "02", Icon: Pencil,     color: "#f59e0b", bg: "#fffbeb", title: "Menünü Ekle",       desc: "Kategori ve ürünleri ekle, fiyatları gir. Dilediğin zaman güncelle." },
  { num: "03", Icon: QrCode,     color: "#ef4444", bg: "#fff5f5", title: "QR Kodu Yazdır",    desc: "Masalara koy, afişe bas, menüye yapıştır. Hepsi bu." },
  { num: "04", Icon: BarChart2,  color: "#22c55e", bg: "#f0fdf4", title: "Analizi İzle",      desc: "Hangi ürün bakılıyor, hangi kampanya tıklanıyor? Dashboard'dan takip et." },
];

const STATS = [
  { Icon: Zap,          value: "< 1sn",  label: "Menü açılış süresi" },
  { Icon: Smartphone,   value: "0",      label: "Uygulama gerektirmez" },
  { Icon: Clock,        value: "7/24",   label: "Anlık güncelleme" },
  { Icon: InfinityIcon, value: "∞",      label: "QR okutulma limiti" },
];

const TESTIMONIALS = [
  { name: "Ahmet K.", business: "Café Miray, İstanbul", Icon: Coffee, color: "#c5a880", bg: "oklch(93% 0.04 60)", text: "QR menüye geçince aylık baskı masrafım sıfırlandı. Günde 5 dakikada fiyat güncelleyebiliyorum artık." },
  { name: "Selin D.", business: "Burger Evi, Ankara",   Icon: Store,  color: "#ef4444", bg: "#fff5f5",            text: "Google yorum sayımız 3 ayda 2 katına çıktı. Müşteriler QR menüden direkt yorum sayfasına gidiyor." },
  { name: "Murat T.", business: "Pizzacı Murat, İzmir", Icon: MapPin, color: "#0ea5e9", bg: "#f0f9ff",            text: "Dashboard'daki analizler inanılmaz. En çok sipariş edilen ürünleri görünce menüyü tamamen değiştirdim." },
];

const PRICING = [
  {
    name: "Başlangıç", price: "Ücretsiz", period: "", desc: "Tek restoran, temel özellikler",
    features: ["1 restoran", "QR menü", "500 ürüne kadar", "Temel analitik", "Google yorum yönlendirme"],
    cta: "Ücretsiz Başla", href: "/login", highlight: false,
  },
  {
    name: "Pro", price: "₺299", period: "/ay", desc: "Büyüyen işletmeler için",
    features: ["3 restoran", "Kampanya sistemi", "Ürün tavsiyesi", "Gelişmiş analitik", "Özel domain", "Öncelikli destek"],
    cta: "14 Gün Ücretsiz Dene", href: "/login", highlight: true,
  },
  {
    name: "Zincir", price: "₺799", period: "/ay", desc: "Çoklu şube yönetimi",
    features: ["Sınırsız restoran", "Tüm Pro özellikleri", "API erişimi", "Özel entegrasyonlar", "Dedicated destek"],
    cta: "Bize Ulaşın", href: "mailto:hello@menu.org.tr", highlight: false,
  },
];

export default function MarketingHomePage() {
  return (
    <div style={{ minHeight: "100dvh", fontFamily: "var(--font-sans)", color: "var(--text-primary)", background: "white" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(197,168,128,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(197,168,128,0); }
        }
        .hero-badge { animation: fadeUp 0.6s ease both; }
        .hero-h1 { animation: fadeUp 0.6s 0.1s ease both; }
        .hero-p { animation: fadeUp 0.6s 0.2s ease both; }
        .hero-cta { animation: fadeUp 0.6s 0.3s ease both; }
        .hero-phone { animation: float 4s ease-in-out infinite; }
        .cta-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .cta-secondary:hover { background: var(--surface-subtle); }
        .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg) !important; }
        .plan-card:hover { transform: translateY(-2px); }
        .highlight-plan { animation: pulse-glow 2.5s ease-in-out infinite; }
        nav a:hover { color: var(--text-primary) !important; }
        .step-card:hover { background: white; box-shadow: var(--shadow-md); }
        .testimonial-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      `}</style>

      {/* ── Navigation ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }} className="px-4 md:px-6">
          <Link href="/" style={{ fontSize: 19, fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.5px", textDecoration: "none", fontFamily: "var(--font-display)" }}>
            menu<span style={{ color: "var(--text-tertiary)" }}>.org.tr</span>
          </Link>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Link href="/features" className="hidden md:inline-block" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 14px", borderRadius: "var(--radius-md)", transition: "var(--transition-fast)" }}>Özellikler</Link>
            <Link href="/pricing" className="hidden md:inline-block" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", padding: "8px 14px", borderRadius: "var(--radius-md)", transition: "var(--transition-fast)" }}>Fiyatlar</Link>
            <Link href="/login" className="px-3 sm:px-4 text-xs sm:text-sm" style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", padding: "8px 16px", height: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-full)", border: "1.5px solid var(--border-default)", transition: "var(--transition-fast)", marginLeft: 4 }}>Giriş Yap</Link>
            <Link href="/login" className="cta-primary px-3 sm:px-5 text-xs sm:text-sm tap-active" style={{ fontWeight: 700, color: "white", textDecoration: "none", height: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-full)", background: "var(--color-primary)", transition: "var(--transition-fast)" }}>
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "72px 24px 80px", background: "radial-gradient(ellipse 90% 70% at 50% -10%, oklch(96% 0.025 60) 0%, white 65%)", textAlign: "center", overflow: "hidden" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {/* Badge */}
          <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: "var(--radius-full)", background: "var(--brand-100)", color: "oklch(42% 0.08 60)", fontSize: 13, fontWeight: 600, marginBottom: 32, letterSpacing: "0.02em" }}>
            <MapPin size={13} strokeWidth={2} />
            Türkiye&apos;nin Restoranları İçin
          </div>

          <h1 className="hero-h1" style={{ fontSize: "clamp(38px, 6.5vw, 72px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "var(--text-primary)", margin: "0 0 28px", fontFamily: "var(--font-display)" }}>
            QR menü,{" "}
            <span style={{ color: "var(--color-primary)", position: "relative" }}>
              sadece menü
              <svg style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 6, opacity: 0.4 }} viewBox="0 0 200 6" fill="none">
                <path d="M0 5 Q50 0 100 4 Q150 8 200 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </span>{" "}
            değil
          </h1>

          <p className="hero-p" style={{ fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.65, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 48px" }}>
            Google yorum yönlendirme + kampanya yönetimi + ürün tavsiyesi + davranış analitiği.<br/>
            <strong style={{ color: "var(--text-primary)" }}>Müşteri sadece menüye bakar; siz her şeyi ölçersiniz.</strong>
          </p>

          <div className="hero-cta" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" id="cta-get-started" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 24px rgba(197,168,128,0.4)", transition: "all var(--transition-base)" }}>
              Ücretsiz Başla
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link href="/cafe-miray/menu" id="cta-demo" className="cta-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 30px", borderRadius: "var(--radius-full)", border: "1.5px solid var(--border-default)", color: "var(--text-primary)", fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all var(--transition-base)", background: "white" }}>
              <UtensilsCrossed size={16} strokeWidth={2} />
              Demo Menüyü Gör
            </Link>
          </div>
        </div>

        {/* Mock phone */}
        <div className="hero-phone" style={{ marginTop: 64, display: "inline-block" }}>
          <div style={{ width: 280, margin: "0 auto", background: "white", borderRadius: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--border-subtle)", overflow: "hidden", border: "8px solid #1a1a1a", position: "relative" }}>
            <div style={{ background: "#1a1a1a", height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 60, height: 6, background: "#333", borderRadius: 99 }} />
            </div>
            <div style={{ padding: "16px 14px", background: "var(--bg-base)" }}>
              {/* Product Row 1 */}
              <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "oklch(93% 0.04 60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Coffee size={17} color="var(--color-primary)" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Latte</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>₺75</div>
                </div>
                <div style={{ fontSize: 10, background: "var(--color-primary)", color: "white", padding: "2px 8px", borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>Popüler</div>
              </div>
              {/* Product Row 2 */}
              <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "oklch(96% 0.01 60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={17} color="#8b5cf6" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Cheesecake</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>₺95</div>
                </div>
                <div style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>Yeni</div>
              </div>
              {/* Google Review CTA */}
              <div style={{ background: "oklch(97% 0.02 60)", borderRadius: 12, padding: "10px 14px", fontSize: 10, color: "var(--color-primary)", fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Star size={11} color="var(--color-primary)" fill="var(--color-primary)" strokeWidth={1.5} />
                Google&apos;da Değerlendir
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat Bar ── */}
      <section style={{ background: "var(--color-primary)", padding: "32px 24px" }} className="no-select">
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0">
          {STATS.map((s, i) => {
            const Icon = s.Icon;
            return (
              <div 
                key={s.label} 
                className={`text-center px-4 py-2 border-white/20 
                  ${i % 2 !== 0 ? 'border-l' : ''} 
                  md:border-t-0 md:border-l ${i === 0 ? 'md:border-l-0' : 'md:border-l'}
                `}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                  <Icon size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                  <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, fontFamily: "var(--font-display)" }}>
              4 adımda hazır
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              Teknik bilgi gerekmez. Restoran sahibi veya çalışanı olmanız yeterli.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {STEPS.map((step) => {
              const Icon = step.Icon;
              return (
                <div key={step.num} className="step-card" style={{ padding: "28px", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", transition: "all var(--transition-base)", cursor: "default" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.08em", marginBottom: 16, fontFamily: "var(--font-display)" }}>{step.num}</div>
                  <div style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon size={20} color={step.color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-display)" }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: "var(--bg-base)", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, fontFamily: "var(--font-display)" }}>
              İşletmenize değer katan özellikler
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Karmaşık restoran otomasyonu değil. Dijital görünürlük, yorum, kampanya ve analitik.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <div key={f.title} className="feature-card" style={{ padding: "28px", borderRadius: "var(--radius-xl)", background: "white", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", transition: "all var(--transition-base)", cursor: "default" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <Icon size={22} color={f.color} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, fontFamily: "var(--font-display)" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 56, fontFamily: "var(--font-display)" }}>
            İşletme sahipleri ne diyor?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => {
              const Icon = t.Icon;
              return (
                <div key={t.name} className="testimonial-card" style={{ padding: "28px", borderRadius: "var(--radius-xl)", background: "var(--bg-base)", border: "1px solid var(--border-subtle)", transition: "all var(--transition-base)" }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Icon size={22} color={t.color} strokeWidth={1.8} />
                  </div>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={13} color="#f59e0b" fill="#f59e0b" strokeWidth={1} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 20px", fontStyle: "italic" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t.business}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: "var(--bg-base)", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, fontFamily: "var(--font-display)" }}>
              Şeffaf fiyatlandırma
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Gizli ücret yok. İstediğin zaman iptal.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={plan.highlight ? "plan-card highlight-plan" : "plan-card"}
                style={{
                  padding: "36px 28px",
                  borderRadius: "var(--radius-xl)",
                  background: plan.highlight ? "var(--color-primary)" : "white",
                  border: plan.highlight ? "none" : "1px solid var(--border-subtle)",
                  boxShadow: plan.highlight ? "0 8px 40px rgba(197,168,128,0.3)" : "var(--shadow-sm)",
                  color: plan.highlight ? "white" : "var(--text-primary)",
                  transition: "all var(--transition-base)",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "oklch(42% 0.08 60)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                    EN POPÜLER
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, opacity: plan.highlight ? 0.85 : 0.6, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{plan.price}</span>
                  <span style={{ fontSize: 14, opacity: 0.7 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, opacity: plan.highlight ? 0.8 : 0.6, marginBottom: 28 }}>{plan.desc}</p>
                <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={16} color={plan.highlight ? "rgba(255,255,255,0.9)" : "var(--color-primary)"} strokeWidth={2} style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "13px",
                    borderRadius: "var(--radius-full)",
                    background: plan.highlight ? "white" : "var(--color-primary)",
                    color: plan.highlight ? "var(--color-primary)" : "white",
                    fontWeight: 700, fontSize: 15, textDecoration: "none",
                    transition: "opacity var(--transition-fast)",
                  }}
                >
                  {plan.cta}
                  <ChevronRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "96px 24px", textAlign: "center", background: "white" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Icon chip instead of emoji */}
          <div style={{ width: 72, height: 72, borderRadius: "var(--radius-xl)", background: "oklch(95% 0.025 60)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <Rocket size={32} color="var(--color-primary)" strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "var(--font-display)" }}>
            Restoranınızı dijitale taşıyın
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>
            Kurulum 5 dakika. Kredi kartı gerektirmez.<br/>
            İlk ayı tamamen ücretsiz deneyin.
          </p>
          <Link
            href="/login"
            id="cta-footer-get-started"
            className="cta-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontSize: 17, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 24px rgba(197,168,128,0.4)", transition: "all var(--transition-base)" }}
          >
            Ücretsiz Başla
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, color: "var(--text-tertiary)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Shield size={13} strokeWidth={2} />
              Kredi kartı yok
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2 size={13} strokeWidth={2} />
              İstediğin zaman iptal
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Zap size={13} strokeWidth={2} />
              5 dakikada hazır
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "40px 24px", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
            menu.org.tr
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Özellikler", "/features"], ["Fiyatlar", "/pricing"], ["Giriş", "/login"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: "var(--text-tertiary)", textDecoration: "none", fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            © {new Date().getFullYear()} menu.org.tr · 317 Digital Agency
          </div>
        </div>
      </footer>
    </div>
  );
}
