// src/lib/auth.ts
// Custom D1 session auth — JWT değil, veritabanı tabanlı session
// Edge-uyumlu: SubtleCrypto (PBKDF2) ile şifre hash

import { cookies } from "next/headers";
import { getDb } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün
const RENEWAL_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 günden az kaldıysa yenile
const PBKDF2_ITERATIONS = 100_000;

// ─────────────────────────────────────────────────────────
// Şifre hashing (Edge-uyumlu PBKDF2 via SubtleCrypto)
// ─────────────────────────────────────────────────────────

/**
 * Hash formatı: "pbkdf2:sha512:100000:<saltHex>:<hashHex>"
 * Bu format create-user.mjs ve bu fonksiyon arasında tutarlıdır.
 */
export async function hashPassword(
  password: string,
  pepper: string
): Promise<string> {
  const enc = new TextEncoder();
  // Random salt oluştur
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password + pepper),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-512", salt: saltBytes, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    512
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:sha512:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  pepper: string
): Promise<boolean> {
  const enc = new TextEncoder();

  // Yeni format: pbkdf2:sha512:iterations:saltHex:hashHex
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 5) return false;
    const [, hashAlgo, iterStr, saltHex, expectedHex] = parts;
    const iterations = parseInt(iterStr, 10);
    const saltBytes = new Uint8Array(
      saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
    );
    const sha = hashAlgo === "sha512" ? "SHA-512" : "SHA-256";
    const bits = hashAlgo === "sha512" ? 512 : 256;

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password + pepper),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: sha, salt: saltBytes, iterations },
      keyMaterial,
      bits
    );
    const computedHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison
    if (computedHex.length !== expectedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computedHex.length; i++) {
      diff |= computedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return diff === 0;
  }

  // Fallback: eski statik salt format (legacy)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password + pepper),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = enc.encode("menu-org-tr-static-salt-v1");
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  );
  const computed = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

// ─────────────────────────────────────────────────────────
// Session yönetimi
// ─────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "platform_admin" | "user";
}

export interface SessionResult {
  sessionId: string;
  user: SessionUser;
}

/**
 * Mevcut request'in session'ını doğrular.
 * İki ayrı query kullanır (Drizzle relation API'ına gerek yok).
 */
export async function getSession(): Promise<SessionResult | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const now = Date.now();

  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get();

  if (!session) {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  // Otomatik session yenileme (3 günden az kaldıysa)
  if (session.expiresAt - now < RENEWAL_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: now + SESSION_DURATION_MS })
      .where(eq(sessions.id, sessionId));
  }

  return { sessionId, user: user as SessionUser };
}

/**
 * Yeni session oluşturur ve httpOnly cookie set eder.
 */
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const now = Date.now();
  const sessionId = crypto.randomUUID();

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: now + SESSION_DURATION_MS,
    createdAt: now,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });

  return sessionId;
}

/**
 * Session'ı D1'den siler ve cookie'yi temizler.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  cookieStore.delete(COOKIE_NAME);
}

// ─────────────────────────────────────────────────────────
// Yetki kontrolü helpers
// ─────────────────────────────────────────────────────────

export function requireAuth(session: SessionResult | null): asserts session is SessionResult {
  if (!session) {
    throw new Error("Unauthorized");
  }
}

export function requirePlatformAdmin(session: SessionResult | null): void {
  requireAuth(session);
  if (session.user.role !== "platform_admin") {
    throw new Error("Forbidden: platform admin only");
  }
}

// ─────────────────────────────────────────────────────────
// Kullanıcı işlemleri
// ─────────────────────────────────────────────────────────

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  pepper: string;
  role?: "platform_admin" | "user";
}) {
  const db = getDb();
  const now = Date.now();
  const passwordHash = await hashPassword(data.password, data.pepper);

  const user = {
    id: createId(),
    email: data.email.toLowerCase().trim(),
    passwordHash,
    name: data.name,
    role: data.role ?? ("user" as const),
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(user);
  return user;
}
