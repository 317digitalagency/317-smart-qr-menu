"use client";
// src/app/(dashboard)/dashboard/website/WebsiteSettingsClient.tsx

import { useState } from "react";

interface WebsiteSettings {
  id?: string;
  heroTitle: string | null;
  heroDescription: string | null;
  primaryColor: string | null;
  theme: string | null;
  isLive: boolean;
}

const THEMES = [
  { value: "minimal", label: "Minimal" },
  { value: "elegant", label: "Zarif" },
  { value: "light", label: "Açık" },
  { value: "dark", label: "Karanlık" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14,
  fontFamily: "inherit",
  background: "white",
  boxSizing: "border-box" as const,
  outline: "none",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600 as const,
  display: "block" as const,
  marginBottom: 6,
  color: "var(--text-primary)",
};

export default function WebsiteSettingsClient({
  restaurantId,
  restaurantSlug,
  initialSettings,
  canEdit,
}: {
  restaurantId: string;
  restaurantSlug: string;
  initialSettings: WebsiteSettings | null;
  canEdit: boolean;
}) {
  const [form, setForm] = useState({
    heroTitle: initialSettings?.heroTitle ?? "",
    heroDescription: initialSettings?.heroDescription ?? "",
    primaryColor: initialSettings?.primaryColor ?? "#c5a880",
    theme: initialSettings?.theme ?? "minimal",
    isLive: initialSettings?.isLive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/website/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ restaurantId, ...form }),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Kaydedilemedi");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Önizleme Linki */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ fontSize: 20 }}>🌐</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Siteniz:
          </div>
          <a
            href={`/${restaurantSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none" }}
          >
            menu.org.tr/{restaurantSlug} ↗
          </a>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 99,
            background: form.isLive ? "#dcfce7" : "#f3f4f6",
            color: form.isLive ? "#166534" : "#6b7280",
          }}
        >
          {form.isLive ? "● Yayında" : "○ Taslak"}
        </span>
      </div>

      {/* Ayarlar Kartı */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Hero Başlık */}
        <div>
          <label style={labelStyle}>Ana Başlık</label>
          <input
            id="website-hero-title"
            value={form.heroTitle}
            onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value }))}
            placeholder="örn: Şehrin En İyi Kahvesi"
            disabled={!canEdit}
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
            Restoran web sayfasında hero bölümünde görünür
          </p>
        </div>

        {/* Hero Açıklama */}
        <div>
          <label style={labelStyle}>Hero Alt Açıklaması</label>
          <textarea
            id="website-hero-desc"
            value={form.heroDescription}
            onChange={(e) => setForm((f) => ({ ...f, heroDescription: e.target.value }))}
            placeholder="örn: Her sabah taze çekilmiş kahveler ve gün içi ev yapımı tatlılar"
            disabled={!canEdit}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Tema + Renk */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Tema</label>
            <select
              id="website-theme"
              value={form.theme}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
              disabled={!canEdit}
              style={inputStyle}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ana Renk</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                id="website-primary-color"
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                disabled={!canEdit}
                style={{ ...inputStyle, padding: 4, height: 44, width: 60, flexShrink: 0 }}
              />
              <input
                value={form.primaryColor}
                onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                disabled={!canEdit}
                style={{ ...inputStyle, fontFamily: "monospace" }}
                placeholder="#c5a880"
              />
            </div>
          </div>
        </div>

        {/* Yayın Durumu */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            cursor: canEdit ? "pointer" : "not-allowed",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={form.isLive}
            onChange={(e) => setForm((f) => ({ ...f, isLive: e.target.checked }))}
            disabled={!canEdit}
          />
          <div>
            <div style={{ fontWeight: 600 }}>Siteyi Yayına Al</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Pasif ise sadece siz önizleyebilirsiniz
            </div>
          </div>
        </label>

        {error && (
          <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
        )}
        {saved && (
          <p style={{ fontSize: 13, color: "#22c55e", margin: 0 }}>✓ Kaydedildi</p>
        )}

        {canEdit && (
          <button
            id="btn-save-website"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        )}
      </div>

      {/* QR Menü Önizleme */}
      <div
        style={{
          background: "linear-gradient(135deg, oklch(97% 0.02 60), oklch(95% 0.04 60))",
          borderRadius: "var(--radius-xl)",
          border: "1px solid oklch(88% 0.04 60)",
          padding: "20px 24px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          📱 QR Menü Önizlemesi
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: form.primaryColor,
                marginBottom: 2,
                fontFamily: "var(--font-display)",
              }}
            >
              {form.heroTitle || "Restoran Adı"}
            </div>
            <div style={{ color: "var(--text-tertiary)" }}>
              {form.heroDescription || "Alt açıklama buraya gelecek"}
            </div>
          </div>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: form.primaryColor,
              boxShadow: `0 0 0 4px ${form.primaryColor}33`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
