"use client";
// src/app/(dashboard)/dashboard/campaigns/CampaignsClient.tsx

import { useState } from "react";

interface Campaign {
  id: string; title: string; description: string;
  imageUrl: string | null; ctaType: string; ctaValue: string | null;
  isActive: boolean; startDate: number | null; endDate: number | null;
  createdAt: number;
}

const CTA_LABELS: Record<string, string> = {
  whatsapp: "💬 WhatsApp",
  google_review: "⭐ Google Yorum",
  instagram: "📸 Instagram",
  menu: "🍽️ Menü",
  directions: "📍 Yol Tarifi",
  checkout: "🛒 Sepete Git",
};

const EMPTY_FORM = {
  title: "", description: "", imageUrl: "",
  ctaType: "whatsapp", ctaValue: "", isActive: true,
  startDate: "", endDate: "",
};

const inputStyle = {
  width: "100%", padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14, fontFamily: "inherit", background: "white",
  boxSizing: "border-box" as const, outline: "none",
};

function CampaignModal({ campaign, restaurantId, onClose, onSave }: {
  campaign: Campaign | null;
  restaurantId: string;
  onClose: () => void;
  onSave: (c: Campaign) => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(campaign ? {
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.imageUrl ?? "",
      ctaType: campaign.ctaType,
      ctaValue: campaign.ctaValue ?? "",
      isActive: campaign.isActive,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
    } : {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.title.trim()) { setError("Başlık zorunludur"); return; }
    if (!form.description.trim()) { setError("Açıklama zorunludur"); return; }
    setSaving(true); setError(null);

    const body = {
      action: campaign?.id ? "update" : "create",
      id: campaign?.id,
      restaurantId,
      ...form,
      startDate: form.startDate ? new Date(form.startDate).getTime() : null,
      endDate: form.endDate ? new Date(form.endDate).getTime() : null,
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Hata"); return; }
    const d = await res.json() as { campaign: Campaign };
    onSave(d.campaign);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "white", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 520, maxHeight: "90dvh", overflowY: "auto", padding: "28px", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "var(--font-display)" }}>
            {campaign?.id ? "Kampanyayı Düzenle" : "Yeni Kampanya"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Başlık *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="örn: Hafta Sonu %20 İndirim" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Açıklama *</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Kampanya detayları..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>CTA Tipi</label>
            <select value={form.ctaType} onChange={(e) => setForm(f => ({ ...f, ctaType: e.target.value }))} style={inputStyle}>
              {Object.entries(CTA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {(form.ctaType === "whatsapp" || form.ctaType === "checkout") && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                {form.ctaType === "whatsapp" ? "WhatsApp Mesajı" : "Kupon Kodu / Link"}
              </label>
              <input value={form.ctaValue} onChange={(e) => setForm(f => ({ ...f, ctaValue: e.target.value }))}
                placeholder={form.ctaType === "whatsapp" ? "Merhaba, kampanya için..." : "INDIRIM20"} style={inputStyle} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Başlangıç Tarihi</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Bitiş Tarihi</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Kampanya Aktif
          </label>
          {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "12px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsClient({ restaurantId, initialCampaigns, canEdit }: {
  restaurantId: string;
  initialCampaigns: Campaign[];
  canEdit: boolean;
}) {
  const [cams, setCams] = useState<Campaign[]>(initialCampaigns);
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  function handleSave(c: Campaign) {
    setCams(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      return idx >= 0 ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id, restaurantId }),
    });
    if (res.ok) setCams(c => c.filter(x => x.id !== id));
  }

  return (
    <div>
      {canEdit && (
        <button id="btn-add-campaign" onClick={() => { setEditCampaign(null); setShowModal(true); }}
          style={{ padding: "10px 20px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
          + Yeni Kampanya
        </button>
      )}

      {cams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-tertiary)", border: "2px dashed var(--border-default)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
          <p style={{ margin: 0, fontWeight: 500 }}>Henüz kampanya yok.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cams.map(cam => (
            <div key={cam.id} style={{ padding: "16px", borderRadius: "var(--radius-xl)", background: "white", border: "1px solid var(--border-subtle)", display: "flex", gap: 14, alignItems: "flex-start", opacity: cam.isActive ? 1 : 0.55 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{cam.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{cam.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: cam.isActive ? "#dcfce7" : "#f3f4f6", color: cam.isActive ? "#166534" : "#6b7280" }}>
                    {cam.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{CTA_LABELS[cam.ctaType] ?? cam.ctaType}</span>
                  {cam.endDate && (
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      → {new Date(cam.endDate).toLocaleDateString("tr-TR")} tarihine kadar
                    </span>
                  )}
                </div>
              </div>
              {canEdit && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditCampaign(cam); setShowModal(true); }}
                    style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "white", cursor: "pointer", fontSize: 13 }}>✏️</button>
                  <button onClick={() => handleDelete(cam.id)}
                    style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid #fca5a5", background: "#fff5f5", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CampaignModal
          campaign={editCampaign}
          restaurantId={restaurantId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
