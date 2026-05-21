"use client";
// src/app/(dashboard)/dashboard/qr/QRClient.tsx

import { useState } from "react";

interface QRCode {
  id: string; name: string; qrType: string;
  targetUrl: string; sourceKey: string | null;
  utmMedium: string | null; isActive: boolean;
  scanCount: number; createdAt: number;
}

const QR_TYPES = [
  { value: "menu", label: "🍽️ Menü" },
  { value: "campaign", label: "📢 Kampanya" },
  { value: "review", label: "⭐ Google Yorum" },
  { value: "custom", label: "🔗 Özel Link" },
];

const inputStyle = {
  width: "100%", padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14, fontFamily: "inherit", background: "white",
  boxSizing: "border-box" as const, outline: "none",
};

export default function QRClient({ restaurantId, restaurantSlug, restaurantName, initialQRCodes, canEdit }: {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  initialQRCodes: QRCode[];
  canEdit: boolean;
}) {
  const [qrs, setQrs] = useState<QRCode[]>(initialQRCodes);
  const [generating, setGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<{ svg: string; dataUrl: string; targetUrl: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    qrType: "menu",
    path: "/menu",
    sourceKey: "",
    utmMedium: "",
    color: "#000000",
    backgroundColor: "#ffffff",
    size: 300,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateQR() {
    if (!form.name.trim()) { setError("QR kodu için bir isim girin"); return; }
    setGenerating(true); setError(null);

    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurantSlug,
        path: form.qrType === "menu" ? "/menu" : form.qrType === "campaign" ? "/kampanyalar" : form.path,
        size: form.size,
        color: form.color,
        backgroundColor: form.backgroundColor,
        utmMedium: form.utmMedium || undefined,
        sourceKey: form.sourceKey || undefined,
      }),
    });

    setGenerating(false);
    if (!res.ok) { setError("QR üretimi başarısız"); return; }
    const d = await res.json() as { svg: string; dataUrl: string; targetUrl: string };
    setGeneratedQR(d);
  }

  async function saveQR() {
    if (!generatedQR || !form.name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/qr/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        name: form.name,
        qrType: form.qrType,
        targetUrl: generatedQR.targetUrl,
        sourceKey: form.sourceKey || null,
        utmMedium: form.utmMedium || null,
      }),
    });

    setSaving(false);
    if (!res.ok) { setError("Kayıt başarısız"); return; }
    const d = await res.json() as { qrCode: QRCode };
    setQrs(prev => [d.qrCode, ...prev]);
    setGeneratedQR(null);
    setForm({ name: "", qrType: "menu", path: "/menu", sourceKey: "", utmMedium: "", color: "#000000", backgroundColor: "#ffffff", size: 300 });
  }

  function downloadQR() {
    if (!generatedQR) return;
    const link = document.createElement("a");
    link.href = generatedQR.dataUrl;
    link.download = `${form.name || "qr-menu"}.png`;
    link.click();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* ── Sol: Form ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {canEdit && (
          <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Yeni QR Kodu Oluştur</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>QR Kod Adı</label>
                <input id="qr-name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="örn: Masa 5 Kartı, Vitrin Afişi" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Yönlendirme Türü</label>
                <select value={form.qrType} onChange={(e) => setForm(f => ({ ...f, qrType: e.target.value }))} style={inputStyle}>
                  {QR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>UTM Medium</label>
                  <input value={form.utmMedium} onChange={(e) => setForm(f => ({ ...f, utmMedium: e.target.value }))}
                    placeholder="table_card" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Kaynak Kodu</label>
                  <input value={form.sourceKey} onChange={(e) => setForm(f => ({ ...f, sourceKey: e.target.value }))}
                    placeholder="table_5" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>QR Renk</label>
                  <input type="color" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ ...inputStyle, padding: 4, height: 40 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Arka Plan</label>
                  <input type="color" value={form.backgroundColor} onChange={(e) => setForm(f => ({ ...f, backgroundColor: e.target.value }))}
                    style={{ ...inputStyle, padding: 4, height: 40 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Boyut (px)</label>
                  <input type="number" min={100} max={1000} value={form.size} onChange={(e) => setForm(f => ({ ...f, size: Number(e.target.value) }))}
                    style={inputStyle} />
                </div>
              </div>
              {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}
              <button id="btn-generate-qr" onClick={generateQR} disabled={generating}
                style={{ padding: "12px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: generating ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {generating ? "Oluşturuluyor..." : "QR Kodu Oluştur"}
              </button>
            </div>
          </div>
        )}

        {/* Üretilen QR */}
        {generatedQR && (
          <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1.5px solid var(--color-primary)", padding: "24px", textAlign: "center" }}>
            <div dangerouslySetInnerHTML={{ __html: generatedQR.svg }} style={{ maxWidth: 200, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", wordBreak: "break-all", marginBottom: 16 }}>
              {generatedQR.targetUrl}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={downloadQR}
                style={{ padding: "9px 18px", borderRadius: "var(--radius-full)", border: "1.5px solid var(--border-default)", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                ⬇️ PNG İndir
              </button>
              <button onClick={saveQR} disabled={saving}
                style={{ padding: "9px 18px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving ? "..." : "💾 Kaydet"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sağ: Mevcut QR Listesi ── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Mevcut QR Kodlar</h2>
        {qrs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-tertiary)", border: "2px dashed var(--border-default)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
            <p style={{ margin: 0 }}>Henüz QR kod yok.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {qrs.map(qr => (
              <div key={qr.id} style={{ padding: "14px 16px", borderRadius: "var(--radius-lg)", background: "white", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{qr.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {QR_TYPES.find(t => t.value === qr.qrType)?.label ?? qr.qrType}
                  {qr.utmMedium && ` · ${qr.utmMedium}`}
                  {qr.sourceKey && ` · ${qr.sourceKey}`}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                  {qr.scanCount} okutulma
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
