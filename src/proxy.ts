// src/proxy.ts
// Host-based routing & auth guard
// menu.org.tr → marketing/public
// app.menu.org.tr → dashboard (auth gerekli)
// admin.menu.org.tr → platform admin (platform_admin rolü gerekli)
// <custom-domain> → KV'den restaurantSlug bul → /[slug]/*
//
// DEV: localhost her zaman pass-through

import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_HOSTS = ["app.menu.org.tr", "panel.menu.org.tr"];
const PLATFORM_ADMIN_HOSTS = ["admin.menu.org.tr"];
const MAIN_HOST = "menu.org.tr";
const COOKIE_NAME = "session";

// Auth gerektirmeyen public paths
const PUBLIC_PATHS = ["/login", "/forgot-password", "/api/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  );
}

// KV domain lookup — CF runtime'da çalışır, dev'de null döner
async function resolveCustomDomain(host: string): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const kv = env?.CACHE as KVNamespace | undefined;
    if (!kv) return null;
    return await kv.get(`domain:${host}`);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "");
  const pathname = request.nextUrl.pathname;

  // ─── Static assets — dokunma ────────────────────────────────
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // ─── Dev / localhost — direkt geç ───────────────────────────
  if (host === "localhost" || host === "127.0.0.1") {
    return NextResponse.next();
  }

  // ─── Platform Admin Panel (admin.menu.org.tr) ────────────────
  if (PLATFORM_ADMIN_HOSTS.some((h) => host === h)) {
    if (isPublicPath(pathname)) return NextResponse.next();

    const hasSession = request.cookies.has(COOKIE_NAME);
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
    return NextResponse.next();
  }

  // ─── SaaS Dashboard Panel (app.menu.org.tr) ─────────────────
  if (DASHBOARD_HOSTS.some((h) => host === h)) {
    if (isPublicPath(pathname)) return NextResponse.next();

    const hasSession = request.cookies.has(COOKIE_NAME);
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // / → /dashboard, /categories → /dashboard/categories
    if (!pathname.startsWith("/dashboard") && pathname !== "/") {
      return NextResponse.rewrite(new URL(`/dashboard${pathname}`, request.url));
    }
    // Kök yol → /dashboard
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ─── Ana Domain (menu.org.tr) ────────────────────────────────
  if (host === MAIN_HOST || host === `www.${MAIN_HOST}`) {
    // www redirect
    if (host.startsWith("www.")) {
      const url = request.nextUrl.clone();
      url.host = MAIN_HOST;
      return NextResponse.redirect(url, 301);
    }
    // Normal routing — marketing + public sayfaları Next.js'e bırak
    return NextResponse.next();
  }

  // ─── Custom Domain Routing ──────────────────────────────────
  // diamore.com, menu.diamore.com → KV'den slug bul → /[slug]/*
  const slug = await resolveCustomDomain(host);
  if (slug) {
    const targetPath = pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // Bilinmeyen domain → ana siteye yönlendir
  return NextResponse.redirect(new URL("/", `https://${MAIN_HOST}`));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
