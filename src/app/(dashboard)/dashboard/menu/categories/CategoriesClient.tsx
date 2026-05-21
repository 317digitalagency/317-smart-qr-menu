"use client";
// src/app/(dashboard)/dashboard/menu/categories/CategoriesClient.tsx

import { useState } from "react";
import { createId } from "@paralleldrive/cuid2";
import { GripVertical, Pencil, Eye, EyeOff, Trash2, ClipboardList, Plus } from "lucide-react";

interface Category {
  id: string; name: string; description: string | null;
  sortOrder: number; isActive: boolean; showInMenu: boolean;
}

const inputStyle = {
  width: "100%", padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14, fontFamily: "inherit",
  background: "white", boxSizing: "border-box" as const, outline: "none",
};

export default function CategoriesClient({
  restaurantId, initialCategories, canEdit,
}: {
  restaurantId: string;
  initialCategories: Category[];
  canEdit: boolean;
}) {
  const [cats, setCats] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCategory() {
    if (!form.name.trim()) { setError("Kategori adı zorunludur"); return; }
    setSaving(true); setError(null);

    const body = editId
      ? { action: "update", id: editId, restaurantId, ...form }
      : { action: "create", restaurantId, ...form, sortOrder: cats.length };

    const res = await fetch("/api/menu/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Hata"); return; }
    const d = await res.json() as { category: Category };

    if (editId) {
      setCats(c => c.map(cat => cat.id === editId ? d.category : cat));
    } else {
      setCats(c => [...c, d.category]);
    }
    setForm({ name: "", description: "" });
    setShowForm(false);
    setEditId(null);
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch("/api/menu/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggle", id, restaurantId, isActive: !isActive }),
    });
    if (res.ok) setCats(c => c.map(cat => cat.id === id ? { ...cat, isActive: !isActive } : cat));
  }

  async function deleteCategory(id: string) {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz? İçindeki ürünler de silinir.")) return;
    const res = await fetch("/api/menu/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id, restaurantId }),
    });
    if (res.ok) setCats(c => c.filter(cat => cat.id !== id));
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? "" });
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {/* Yeni Kategori Formu */}
      {canEdit && (
        <div className="mb-6">
          {!showForm ? (
            <button
              id="btn-add-category"
              onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", description: "" }); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm border-none cursor-pointer transition-transform duration-100 active:scale-95 shadow-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              Yeni Kategori
            </button>
          ) : (
            <div className="p-5 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-bold mb-4 font-display text-[var(--text-primary)]">
                {editId ? "Kategoriyi Düzenle" : "Yeni Kategori"}
              </h3>
              <div className="flex flex-col gap-3">
                <input
                  id="cat-name"
                  placeholder="Kategori adı (örn: Kahvaltı, Tatlılar)"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                  className="focus:border-[var(--color-primary)] transition-colors"
                  autoFocus
                />
                <input
                  id="cat-desc"
                  placeholder="Açıklama (opsiyonel)"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  style={inputStyle}
                  className="focus:border-[var(--color-primary)] transition-colors"
                />
                {error && <p className="text-xs text-red-500 font-semibold m-0">{error}</p>}
                <div className="flex gap-2.5 mt-1">
                  <button 
                    onClick={saveCategory} 
                    disabled={saving}
                    className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-bold text-xs border-none cursor-pointer transition-transform duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button 
                    onClick={() => { setShowForm(false); setEditId(null); }}
                    className="px-4 py-2.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] font-semibold text-xs border-none cursor-pointer transition-transform duration-100 active:scale-95"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kategori Listesi */}
      {cats.length === 0 ? (
        <div className="text-center py-12 px-6 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-default)] rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={22} className="text-[var(--text-secondary)]" />
          </div>
          <p className="margin-0 font-bold text-sm">Henüz kategori yok. İlk kategorinizi ekleyin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cats.map((cat, idx) => (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex items-center justify-between gap-4 transition-all
                ${cat.isActive ? "opacity-100" : "opacity-60"}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[var(--text-tertiary)] cursor-grab shrink-0 p-1 hover:text-[var(--text-secondary)]">
                  <GripVertical size={16} />
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-[14.5px] text-[var(--text-primary)] truncate">{cat.name}</div>
                  {cat.description && (
                    <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate">{cat.description}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full
                  ${cat.isActive ? "bg-green-50 text-green-600 border border-green-100" : "bg-gray-100 text-gray-500 border border-gray-200"}
                `}>
                  {cat.isActive ? "Aktif" : "Pasif"}
                </span>
                
                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => startEdit(cat)}
                      title="Düzenle"
                      className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-white flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-transform duration-100 active:scale-90"
                    >
                      <Pencil size={13} strokeWidth={2.2} />
                    </button>
                    <button 
                      onClick={() => toggleActive(cat.id, cat.isActive)}
                      title={cat.isActive ? "Pasife al" : "Aktife al"}
                      className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-white flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-transform duration-100 active:scale-90"
                    >
                      {cat.isActive ? (
                        <EyeOff size={13} strokeWidth={2.2} />
                      ) : (
                        <Eye size={13} strokeWidth={2.2} />
                      )}
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id)}
                      title="Sil"
                      className="w-8 h-8 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 cursor-pointer transition-transform duration-100 active:scale-90"
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
