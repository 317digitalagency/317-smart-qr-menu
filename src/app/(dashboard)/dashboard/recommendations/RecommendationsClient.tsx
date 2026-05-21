"use client";
// src/app/(dashboard)/dashboard/recommendations/RecommendationsClient.tsx

import { useState } from "react";
import { formatPrice } from "@/lib/qr";

interface Product { id: string; name: string; categoryId: string; imageUrl: string | null; priceKurus: number }
interface Category { id: string; name: string }
interface Recommendation { id: string; productId: string; recommendedProductId: string; sortOrder: number; isActive: boolean }

export default function RecommendationsClient({ restaurantId, products, categories, initialRecommendations, canEdit }: {
  restaurantId: string;
  products: Product[];
  categories: Category[];
  initialRecommendations: Recommendation[];
  canEdit: boolean;
}) {
  const [recs, setRecs] = useState<Recommendation[]>(initialRecommendations);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getProductName(id: string) { return products.find(p => p.id === id)?.name ?? id; }
  function getCategoryName(catId: string) { return categories.find(c => c.id === catId)?.name ?? ""; }

  async function addRecommendation() {
    if (!sourceId || !targetId) { setError("İki ürün seçin"); return; }
    if (sourceId === targetId) { setError("Aynı ürünü seçemezsiniz"); return; }
    if (recs.some(r => r.productId === sourceId && r.recommendedProductId === targetId)) {
      setError("Bu eşleşme zaten mevcut"); return;
    }
    setSaving(true); setError(null);

    const res = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "create", restaurantId, productId: sourceId, recommendedProductId: targetId }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Hata"); return; }
    const d = await res.json() as { recommendation: Recommendation };
    setRecs(prev => [...prev, d.recommendation]);
    setSourceId(""); setTargetId("");
  }

  async function deleteRec(id: string) {
    const res = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id, restaurantId }),
    });
    if (res.ok) setRecs(prev => prev.filter(r => r.id !== id));
  }

  const selectStyle = {
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1.5px solid var(--border-default)",
    fontSize: 14, fontFamily: "inherit", background: "white",
    boxSizing: "border-box" as const, outline: "none", width: "100%",
  };

  // Kaynak ürüne göre gruplama
  const grouped = recs.reduce<Record<string, string[]>>((acc, r) => {
    if (!acc[r.productId]) acc[r.productId] = [];
    acc[r.productId].push(r.recommendedProductId);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Yeni Eşleşme ── */}
      {canEdit && (
        <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Yeni Tavsiye Eşleşmesi</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Kaynak Ürün</label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={selectStyle}>
                <option value="">Ürün seçin...</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {products.filter(p => p.categoryId === cat.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.priceKurus)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ textAlign: "center", fontSize: 22, color: "var(--text-tertiary)", paddingBottom: 2 }}>→</div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Tavsiye Edilecek Ürün</label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={selectStyle}>
                <option value="">Ürün seçin...</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {products.filter(p => p.categoryId === cat.id && p.id !== sourceId).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.priceKurus)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: "#ef4444", margin: "12px 0 0" }}>{error}</p>}

          <button id="btn-add-recommendation" onClick={addRecommendation} disabled={saving}
            style={{ marginTop: 16, padding: "10px 24px", borderRadius: "var(--radius-full)", background: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Kaydediliyor..." : "Eşleşme Ekle"}
          </button>
        </div>
      )}

      {/* ── Mevcut Eşleşmeler ── */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Mevcut Eşleşmeler</h2>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 24px", color: "var(--text-tertiary)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔀</div>
            <p style={{ margin: 0, fontWeight: 500 }}>Henüz eşleşme tanımlanmadı.</p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Örnek: Latte → Cookie, Burger → Patates Kızartması</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(grouped).map(([productId, recommendedIds]) => (
              <div key={productId}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--text-primary)" }}>
                  🍽️ {getProductName(productId)}
                  <span style={{ fontWeight: 400, color: "var(--text-tertiary)", fontSize: 12, marginLeft: 6 }}>
                    ({getCategoryName(products.find(p => p.id === productId)?.categoryId ?? "")})
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {recommendedIds.map(recId => {
                    const rec = recs.find(r => r.productId === productId && r.recommendedProductId === recId);
                    return (
                      <div key={recId} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: "var(--radius-full)",
                        background: "var(--surface-muted)", border: "1px solid var(--border-subtle)",
                        fontSize: 13, fontWeight: 500,
                      }}>
                        <span>→ {getProductName(recId)}</span>
                        {canEdit && rec && (
                          <button onClick={() => deleteRec(rec.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 16, padding: "0 0 0 4px", lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
