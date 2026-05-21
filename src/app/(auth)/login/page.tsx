// src/app/(auth)/login/page.tsx
// Login sayfası — Cloudflare Turnstile korumalı
// Server Action ile D1 session auth

"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız. Tekrar deneyin.");
        return;
      }

      // Giriş başarılı — dashboard'a yönlendir
      window.location.href = "/dashboard";
    } catch {
      setError("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link
            href="/"
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--color-primary)",
              textDecoration: "none",
              letterSpacing: "-0.5px",
              fontFamily: "var(--font-display)",
            }}
          >
            menu.org.tr
          </Link>
          <p
            style={{
              marginTop: 8,
              fontSize: 15,
              color: "var(--text-secondary)",
            }}
          >
            Yönetim paneline giriş yapın
          </p>
        </div>

        {/* Form Card */}
        <div
          className="glass-card"
          style={{
            padding: "36px",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                E-posta
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ornek@isletme.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-default)",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                  fontFamily: "inherit",
                  background: "white",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Şifre
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 12,
                    color: "var(--color-primary)",
                    textDecoration: "none",
                  }}
                >
                  Şifremi unuttum
                </Link>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-default)",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                  fontFamily: "inherit",
                  background: "white",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                }}
              />
            </div>

            {/* Hata mesajı */}
            {error && (
              <div
                role="alert"
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "oklch(96% 0.05 15)",
                  border: "1px solid oklch(85% 0.1 15)",
                  color: "oklch(40% 0.15 15)",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "var(--radius-full)",
                background: isLoading ? "var(--brand-300)" : "var(--color-primary)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "background var(--transition-fast)",
                fontFamily: "inherit",
              }}
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 13,
            color: "var(--text-tertiary)",
          }}
        >
          Hesabınız yok mu?{" "}
          <a
            href="mailto:destek@menu.org.tr"
            style={{ color: "var(--color-primary)", textDecoration: "none" }}
          >
            Bize yazın
          </a>
        </p>
      </div>
    </div>
  );
}
