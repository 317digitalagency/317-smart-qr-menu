"use client";
// src/app/(dashboard)/dashboard/menu/products/ProductsClient.tsx
// Ürün listesi + ekleme/düzenleme modal

import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/qr";
import { Utensils, Pencil, Trash2, Star, Plus, X, Image as ImageIcon } from "lucide-react";

interface Category { id: string; name: string }
interface Product {
  id: string; categoryId: string; name: string;
  shortDescription: string; priceKurus: number;
  discountedPriceKurus: number | null;
  imageUrl: string | null; isActive: boolean;
  isFeatured: boolean; isPopular: boolean; isNew: boolean;
  tagsJson: string | null; allergensJson: string | null;
  longDescription: string | null;
}

const EMPTY_FORM = {
  categoryId: "", name: "", shortDescription: "", longDescription: "",
  priceKurus: "", discountedPriceKurus: "",
  imageUrl: "", tagsJson: "", allergensJson: "",
  isFeatured: false, isPopular: false, isNew: false, isActive: true,
};

const inputStyle = {
  width: "100%", padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14, fontFamily: "inherit", background: "white",
  boxSizing: "border-box" as const, outline: "none",
};

function ProductModal({
  product, categories, restaurantId, onClose, onSave,
}: {
  product: Partial<Product> | null;
  categories: Category[];
  restaurantId: string;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(product ? {
      categoryId: product.categoryId ?? "",
      name: product.name ?? "",
      shortDescription: product.shortDescription ?? "",
      longDescription: product.longDescription ?? "",
      priceKurus: product.priceKurus ? String(product.priceKurus / 100) : "",
      discountedPriceKurus: product.discountedPriceKurus ? String(product.discountedPriceKurus / 100) : "",
      imageUrl: product.imageUrl ?? "",
      tagsJson: product.tagsJson ?? "",
      allergensJson: product.allergensJson ?? "",
      isFeatured: product.isFeatured ?? false,
      isPopular: product.isPopular ?? false,
      isNew: product.isNew ?? false,
      isActive: product.isActive ?? true,
    } : {}),
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("restaurantId", restaurantId);
    fd.append("type", "product");
    fd.append("entityId", product?.id ?? "new");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { setError("Görsel yüklenemedi"); return; }
    const d = await res.json() as { url: string };
    setForm(f => ({ ...f, imageUrl: d.url }));
  }

  async function handleSave() {
    if (!form.categoryId) { setError("Kategori seçin"); return; }
    if (!form.name.trim()) { setError("Ürün adı zorunludur"); return; }
    if (!form.priceKurus) { setError("Fiyat zorunludur"); return; }

    setSaving(true); setError(null);
    const body = {
      action: product?.id ? "update" : "create",
      id: product?.id,
      restaurantId,
      ...form,
      priceKurus: Math.round(parseFloat(form.priceKurus) * 100),
      discountedPriceKurus: form.discountedPriceKurus
        ? Math.round(parseFloat(form.discountedPriceKurus) * 100)
        : null,
    };
    const res = await fetch("/api/menu/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Hata"); return; }
    const d = await res.json() as { product: Product };
    onSave(d.product);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }} />
      <div 
        className="relative bg-white rounded-[28px] w-full maxWidth shadow-2xl overflow-y-auto p-6 md:p-8 border border-[var(--border-subtle)]"
        style={{
          maxWidth: 540,
          maxHeight: "85vh",
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base md:text-lg font-bold font-display text-[var(--text-primary)] m-0">
            {product?.id ? "Ürünü Düzenle" : "Yeni Ürün"}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-secondary)] border-none cursor-pointer transition-transform duration-100 active:scale-90"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Görsel */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-2">Ürün Görseli</label>
            <div className="flex gap-4 items-center">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" width={72} height={72} className="rounded-2xl object-cover border border-[var(--border-subtle)] shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                  <Utensils size={22} className="text-[var(--text-tertiary)]" />
                </div>
              )}
              <label 
                htmlFor="product-image-upload" 
                className="px-4 py-2 border border-[var(--border-default)] rounded-full cursor-pointer text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-all"
              >
                {uploading ? "Yükleniyor..." : "Görsel Seç"}
              </label>
              <input id="product-image-upload" type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor="prod-category" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Kategori *</label>
            <select 
              id="prod-category" 
              value={form.categoryId} 
              onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
              style={{ ...inputStyle }}
              className="focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">Kategori seçin...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Ad */}
          <div>
            <label htmlFor="prod-name" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Ürün Adı *</label>
            <input 
              id="prod-name" 
              value={form.name} 
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="örn: Latte, Cheeseburger" 
              style={inputStyle}
              className="focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Kısa açıklama */}
          <div>
            <label htmlFor="prod-short-desc" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Kısa Açıklama *</label>
            <input 
              id="prod-short-desc" 
              value={form.shortDescription} 
              onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))}
              placeholder="Menüde görünecek kısa açıklama" 
              style={inputStyle}
              className="focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Uzun açıklama */}
          <div>
            <label htmlFor="prod-long-desc" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Detay Açıklaması</label>
            <textarea 
              id="prod-long-desc" 
              value={form.longDescription} 
              onChange={(e) => setForm(f => ({ ...f, longDescription: e.target.value }))}
              placeholder="Ürün detayında gösterilecek uzun açıklama" 
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              className="focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Fiyatlar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-price" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Fiyat (₺) *</label>
              <input 
                id="prod-price" 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.priceKurus}
                onChange={(e) => setForm(f => ({ ...f, priceKurus: e.target.value }))}
                placeholder="250.00" 
                style={inputStyle}
                className="focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="prod-discount" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">İndirimli Fiyat (₺)</label>
              <input 
                id="prod-discount" 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.discountedPriceKurus}
                onChange={(e) => setForm(f => ({ ...f, discountedPriceKurus: e.target.value }))}
                placeholder="200.00" 
                style={inputStyle}
                className="focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Alerjenler */}
          <div>
            <label htmlFor="prod-allergens" className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Alerjenler (JSON dizisi)</label>
            <input 
              id="prod-allergens" 
              value={form.allergensJson} 
              onChange={(e) => setForm(f => ({ ...f, allergensJson: e.target.value }))}
              placeholder='["Gluten","Süt"]' 
              style={inputStyle}
              className="focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Bayraklar */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
            {([
              { key: "isActive", label: "Aktif" },
              { key: "isFeatured", label: "Öne Çıkan" },
              { key: "isPopular", label: "Popüler" },
              { key: "isNew", label: "Yeni" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer user-select-none">
                <input 
                  type="checkbox" 
                  checked={form[key]} 
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4"
                />
                {label}
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-500 font-semibold m-0">{error}</p>}

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full mt-2 py-3 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm border-none cursor-pointer transition-transform duration-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsClient({ restaurantId, initialProducts, categories, canEdit }: {
  restaurantId: string;
  initialProducts: Product[];
  categories: Category[];
  canEdit: boolean;
}) {
  const [prods, setProds] = useState<Product[]>(initialProducts);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const filtered = useMemo(() =>
    selectedCat === "all" ? prods : prods.filter(p => p.categoryId === selectedCat),
    [prods, selectedCat]
  );

  function getCategoryName(catId: string) {
    return categories.find(c => c.id === catId)?.name ?? "—";
  }

  function handleSave(p: Product) {
    setProds(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      return idx >= 0 ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/menu/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id, restaurantId }),
    });
    if (res.ok) setProds(p => p.filter(x => x.id !== id));
  }

  return (
    <div>
      {/* Filtre + Ekle */}
      <div className="flex gap-2.5 mb-5 flex-wrap items-center">
        <select 
          value={selectedCat} 
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-3.5 py-2 rounded-full border border-[var(--border-default)] text-sm bg-white font-semibold outline-none focus:border-[var(--color-primary)] cursor-pointer active:scale-98 transition-transform"
        >
          <option value="all">Tüm Kategoriler ({prods.length})</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({prods.filter(p => p.categoryId === c.id).length})</option>
          ))}
        </select>
        {canEdit && (
          <button 
            id="btn-add-product" 
            onClick={() => { setEditProduct(null); setShowModal(true); }}
            className="ml-auto px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm border-none cursor-pointer transition-transform duration-100 active:scale-95 shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Yeni Ürün
          </button>
        )}
      </div>

      {/* Ürün Listesi */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-6 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-default)] rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
            <Utensils size={22} className="text-[var(--text-secondary)]" />
          </div>
          <p className="margin-0 font-bold text-sm">Henüz ürün yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(product => (
            <div
              key={product.id}
              className={`p-4 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex items-center justify-between gap-4 transition-all
                ${product.isActive ? "opacity-100" : "opacity-60"}
              `}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    width={52} 
                    height={52}
                    className="rounded-xl object-cover shrink-0 border border-[var(--border-subtle)]"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] shrink-0 flex items-center justify-center">
                    <Utensils size={20} className="text-[var(--text-tertiary)]" />
                  </div>
                )}
                
                <div className="min-w-0">
                  <div className="font-bold text-[14.5px] text-[var(--text-primary)] truncate">{product.name}</div>
                  <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate font-medium">
                    {getCategoryName(product.categoryId)} ·{" "}
                    {product.discountedPriceKurus ? (
                      <>
                        <span className="line-through mr-1 opacity-70">{formatPrice(product.priceKurus)}</span>
                        <span className="font-bold text-[var(--color-primary)]">{formatPrice(product.discountedPriceKurus)}</span>
                      </>
                    ) : (
                      <span className="font-bold">{formatPrice(product.priceKurus)}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {product.isPopular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                        Popüler
                      </span>
                    )}
                    {product.isNew && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        Yeni
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 inline-flex items-center gap-0.5">
                        <Star size={10} className="fill-amber-400 text-amber-500" />
                        Öne Çıkan
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {canEdit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => { setEditProduct(product); setShowModal(true); }}
                    title="Düzenle"
                    className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-white flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-transform duration-100 active:scale-90"
                  >
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    title="Sil"
                    className="w-8 h-8 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 cursor-pointer transition-transform duration-100 active:scale-90"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          restaurantId={restaurantId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
