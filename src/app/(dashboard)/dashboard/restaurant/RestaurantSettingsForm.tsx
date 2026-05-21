"use client";
// src/app/(dashboard)/dashboard/restaurant/RestaurantSettingsForm.tsx

import { useState } from "react";

interface RestaurantSettings {
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  googleMapsUrl?: string | null;
  googleReviewUrl?: string | null;
  workingHoursJson?: string | null;
}

const WORKING_DAYS = [
  { key: "mon", label: "Pazartesi" },
  { key: "tue", label: "Salı" },
  { key: "wed", label: "Çarşamba" },
  { key: "thu", label: "Perşembe" },
  { key: "fri", label: "Cuma" },
  { key: "sat", label: "Cumartesi" },
  { key: "sun", label: "Pazar" },
];

function parseHours(json: string | null | undefined): Record<string, string> {
  try { return json ? JSON.parse(json) : {}; } catch { return {}; }
}

interface Props {
  restaurantId: string;
  restaurantName: string;
  settings: RestaurantSettings | null;
  canEdit: boolean;
}

export default function RestaurantSettingsForm({ restaurantId, restaurantName, settings, canEdit }: Props) {
  const [form, setForm] = useState({
    description: settings?.description ?? "",
    address: settings?.address ?? "",
    phone: settings?.phone ?? "",
    whatsapp: settings?.whatsapp ?? "",
    instagram: settings?.instagram ?? "",
    googleMapsUrl: settings?.googleMapsUrl ?? "",
    googleReviewUrl: settings?.googleReviewUrl ?? "",
  });
  const [hours, setHours] = useState<Record<string, string>>(parseHours(settings?.workingHoursJson));
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(settings?.coverUrl ?? "");
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, type: "logo" | "cover") {
    setUploading(type);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("restaurantId", restaurantId);
    fd.append("type", type);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(null);
    if (!res.ok) { setError("Görsel yüklenemedi"); return; }
    const data = await res.json() as { url: string };
    if (type === "logo") setLogoUrl(data.url);
    else setCoverUrl(data.url);
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    const body = {
      restaurantId,
      ...form,
      logoUrl,
      coverUrl,
      workingHoursJson: JSON.stringify(hours),
    };
    const res = await fetch("/api/restaurant/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Kayıt başarısız");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

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
    display: "block" as const,
    fontSize: 13,
    fontWeight: 600 as const,
    color: "var(--text-primary)",
    marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Görseller ── */}
      <section style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Görseller</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {(["logo", "cover"] as const).map((type) => {
            const url = type === "logo" ? logoUrl : coverUrl;
            const label = type === "logo" ? "Logo" : "Kapak Görseli";
            return (
              <div key={type}>
                <label style={labelStyle}>{label}</label>
                <label
                  htmlFor={`upload-${type}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 100,
                    borderRadius: "var(--radius-lg)",
                    border: "2px dashed var(--border-default)",
                    cursor: canEdit ? "pointer" : "default",
                    overflow: "hidden",
                    background: "var(--surface-subtle)",
                    position: "relative",
                  }}
                >
                  {url ? (
                    <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                      {uploading === type ? "Yükleniyor..." : "Yükle"}
                    </div>
                  )}
                </label>
                {canEdit && (
                  <input
                    id={`upload-${type}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file, type);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Genel Bilgiler ── */}
      <section style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Genel Bilgiler</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Restoran Adı</label>
            <input style={{ ...inputStyle, background: "#f9f9f9", color: "var(--text-tertiary)" }} value={restaurantName} readOnly />
          </div>
          <div>
            <label htmlFor="description" style={labelStyle}>Açıklama</label>
            <textarea
              id="description"
              value={form.description}
              disabled={!canEdit}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Kısa, davetkar bir açıklama yazın..."
            />
          </div>
          <div>
            <label htmlFor="address" style={labelStyle}>Adres</label>
            <input id="address" value={form.address} disabled={!canEdit}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
              style={inputStyle} placeholder="Tam adres" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="phone" style={labelStyle}>Telefon</label>
              <input id="phone" value={form.phone} disabled={!canEdit}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                style={inputStyle} placeholder="+905551234567" />
            </div>
            <div>
              <label htmlFor="whatsapp" style={labelStyle}>WhatsApp</label>
              <input id="whatsapp" value={form.whatsapp} disabled={!canEdit}
                onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                style={inputStyle} placeholder="905551234567" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sosyal & Linkler ── */}
      <section style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Sosyal Medya & Linkler</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label htmlFor="instagram" style={labelStyle}>Instagram Kullanıcı Adı</label>
            <input id="instagram" value={form.instagram} disabled={!canEdit}
              onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value }))}
              style={inputStyle} placeholder="kullaniciadi (@ olmadan)" />
          </div>
          <div>
            <label htmlFor="googleMapsUrl" style={labelStyle}>Google Harita Linki</label>
            <input id="googleMapsUrl" value={form.googleMapsUrl} disabled={!canEdit}
              onChange={(e) => setForm(f => ({ ...f, googleMapsUrl: e.target.value }))}
              style={inputStyle} placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label htmlFor="googleReviewUrl" style={labelStyle}>Google Yorum Linki</label>
            <input id="googleReviewUrl" value={form.googleReviewUrl} disabled={!canEdit}
              onChange={(e) => setForm(f => ({ ...f, googleReviewUrl: e.target.value }))}
              style={inputStyle} placeholder="https://g.page/r/.../review" />
          </div>
        </div>
      </section>

      {/* ── Çalışma Saatleri ── */}
      <section style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Çalışma Saatleri</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WORKING_DAYS.map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 90, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
              <input
                value={hours[key] ?? ""}
                disabled={!canEdit}
                onChange={(e) => setHours(h => ({ ...h, [key]: e.target.value }))}
                placeholder="09:00-22:00 veya Kapalı"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Kaydet ── */}
      {canEdit && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            id="btn-save-restaurant"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 28px",
              borderRadius: "var(--radius-full)",
              background: saving ? "var(--brand-300)" : "var(--color-primary)",
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
          {saved && <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>✓ Kaydedildi</span>}
          {error && <span style={{ fontSize: 14, color: "#ef4444" }}>{error}</span>}
        </div>
      )}
    </div>
  );
}
