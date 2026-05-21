"use client";
// src/app/(dashboard)/dashboard/domains/DomainsClient.tsx

import { useState } from "react";

interface Domain {
  id: string;
  domain: string;
  type: "root" | "subdomain" | "system_slug";
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken: string | null;
  createdAt: number;
}

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  initialDomains: Domain[];
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-default)",
  fontSize: 14,
  outline: "none",
  background: "white",
  boxSizing: "border-box" as const,
};

const btnPrimary = {
  padding: "10px 22px",
  borderRadius: "var(--radius-full)",
  background: "var(--color-primary)",
  color: "white",
  fontWeight: 700,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
};

export default function DomainsClient({ restaurantId, restaurantSlug, initialDomains }: Props) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [newDomain, setNewDomain] = useState("");
  const [domainType, setDomainType] = useState<"root" | "subdomain">("root");
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addedToken, setAddedToken] = useState<{ domain: string; token: string; domainId: string } | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  async function handleAdd() {
    if (!newDomain.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, domain: newDomain.trim(), type: domainType }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; domain?: string; verificationToken?: string; domainId?: string };
      if (!res.ok) { showMsg("err", data.error ?? "Hata"); return; }

      setAddedToken({ domain: data.domain ?? "", token: data.verificationToken ?? "", domainId: data.domainId ?? "" });
      setNewDomain("");
      setDomains((prev) => [...prev, {
        id: data.domainId ?? "", domain: data.domain ?? "", type: domainType,
        isPrimary: false, isVerified: false, verificationToken: data.verificationToken ?? null, createdAt: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(domainId: string) {
    setVerifyingId(domainId);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, restaurantId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { showMsg("err", data.error ?? "DNS kaydı bulunamadı"); return; }
      showMsg("ok", "Domain doğrulandı ✓");
      setDomains((prev) => prev.map((d) => d.id === domainId ? { ...d, isVerified: true } : d));
      if (addedToken?.domainId === domainId) setAddedToken(null);
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(domainId: string, domain: string) {
    if (!confirm(`"${domain}" silinecek. Emin misin?`)) return;
    setDeletingId(domainId);
    try {
      const res = await fetch("/api/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, restaurantId }),
      });
      if (!res.ok) { showMsg("err", "Silinemedi"); return; }
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      showMsg("ok", "Domain silindi");
    } finally {
      setDeletingId(null);
    }
  }

  const systemSlug = `menu.org.tr/${restaurantSlug}`;

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>Domain Yönetimi</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>Restoranınıza özel domain bağlayın</p>

      {msg && (
        <div style={{ padding: "12px 18px", borderRadius: "var(--radius-md)", background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2", color: msg.type === "ok" ? "#16a34a" : "#dc2626", fontSize: 14, fontWeight: 600, marginBottom: 24, border: `1px solid ${msg.type === "ok" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.type === "ok" ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Sistem URL'i */}
      <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>Sistem URL (değiştirilemez)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{systemSlug}</span>
          <span style={{ fontSize: 12, background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>✓ Aktif</span>
        </div>
      </div>

      {/* DNS Doğrulama Talimatı (eklenen domain için) */}
      {addedToken && (
        <div style={{ background: "oklch(97% 0.02 60)", borderRadius: "var(--radius-xl)", border: "1px solid oklch(88% 0.04 60)", padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 DNS TXT Kaydı Ekle</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            <strong>{addedToken.domain}</strong> domaininin DNS yönetim paneline gidin ve şu TXT kaydını ekleyin:
          </p>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, background: "white", borderRadius: "var(--radius-sm) 0 0 0" }}>Host</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", background: "white" }}>_menu-verify</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, background: "white" }}>Tip</td>
                <td style={{ padding: "8px 12px", background: "white" }}>TXT</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", fontWeight: 600, background: "white", borderRadius: "0 0 0 var(--radius-sm)" }}>Değer</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", background: "white", wordBreak: "break-all" }}>menuorgtr-verify={addedToken.token}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-tertiary)" }}>
            DNS değişikliği yayılması 5–60 dakika sürebilir.
          </div>
        </div>
      )}

      {/* Mevcut Domainler */}
      {domains.length > 0 && (
        <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", fontSize: 14, fontWeight: 700 }}>
            Kayıtlı Domainler
          </div>
          {domains.map((d) => (
            <div key={d.id} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.domain}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {d.type === "root" ? "Kök domain" : "Alt domain"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {d.isVerified ? (
                  <span style={{ fontSize: 12, background: "#f0fdf4", color: "#16a34a", padding: "4px 12px", borderRadius: 99, fontWeight: 600 }}>✓ Doğrulandı</span>
                ) : (
                  <>
                    <span style={{ fontSize: 12, background: "#fef9ec", color: "#d97706", padding: "4px 12px", borderRadius: 99, fontWeight: 600 }}>⏳ Bekliyor</span>
                    <button
                      onClick={() => handleVerify(d.id)}
                      disabled={verifyingId === d.id}
                      style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12, opacity: verifyingId === d.id ? 0.6 : 1 }}
                    >
                      {verifyingId === d.id ? "Kontrol ediliyor..." : "Doğrula"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(d.id, d.domain)}
                  disabled={deletingId === d.id}
                  style={{ padding: "6px 14px", borderRadius: "var(--radius-full)", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: deletingId === d.id ? 0.5 : 1 }}
                >
                  {deletingId === d.id ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Domain Ekle */}
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", padding: "24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Yeni Domain Ekle</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="diamore.com veya menu.diamore.com"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            value={domainType}
            onChange={(e) => setDomainType(e.target.value as "root" | "subdomain")}
            style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}
          >
            <option value="root">Kök domain (diamore.com)</option>
            <option value="subdomain">Alt domain (menu.diamore.com)</option>
          </select>
          <button onClick={handleAdd} disabled={loading || !newDomain.trim()} style={{ ...btnPrimary, opacity: loading || !newDomain.trim() ? 0.6 : 1 }}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
          Domain ekledikten sonra DNS TXT kaydı ile doğrulamanız gerekir.
        </p>
      </div>
    </div>
  );
}
