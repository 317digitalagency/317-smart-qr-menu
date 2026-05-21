// src/app/api/auth/login/route.ts
// Login endpoint — D1 session auth
// DEV: rate limiting atlanır (KV yok), PBKDF2 hash doğrulaması yapılır
// PROD: rate limiting + CF env.HASH_PEPPER kullanılır

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs"; // dev'de edge yerine nodejs runtime kullan

const LoginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(128),
});

function tryGetCloudflareEnv(): { CACHE?: KVNamespace; HASH_PEPPER?: string } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return env as { CACHE?: KVNamespace; HASH_PEPPER?: string };
  } catch {
    return {};
  }
}

async function checkLoginRateLimit(
  kv: KVNamespace | undefined,
  ip: string
): Promise<boolean> {
  if (!kv) return true; // Dev'de rate limit yok
  const key = `rl:login:${ip}`;
  const count = parseInt((await kv.get(key)) ?? "0");
  if (count >= 5) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 900 }); // 15 dakika
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const env = tryGetCloudflareEnv();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  // Rate limit: 5 deneme / 15 dakika (prod only)
  const allowed = await checkLoginRateLimit(env.CACHE, ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const result = LoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 422 }
    );
  }

  const { email, password } = result.data;
  const db = getDb();
  const pepper = env.HASH_PEPPER ?? process.env.HASH_PEPPER ?? "";

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .get();

  // Timing-safe: hata mesajı aynı olmalı (kullanıcı enumeration koruması)
  const genericError = "E-posta veya şifre hatalı";

  if (!user) {
    await verifyPassword(password, "pbkdf2:sha512:100000:00000000000000000000000000000000:dummy", pepper);
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash, pepper);
  if (!isValid) {
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  // Session oluştur
  await createSession(user.id);

  // Başarılı: rate limit sıfırla (prod only)
  if (env.CACHE) {
    await env.CACHE.delete(`rl:login:${ip}`);
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
