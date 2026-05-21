#!/usr/bin/env node
// scripts/create-user.mjs
// Gerçek PBKDF2 hash ile kullanıcı oluşturur
// Kullanım: node scripts/create-user.mjs
//
// Ortam değişkenleri (opsiyonel):
//   HASH_PEPPER = wrangler secret ile prod'da set edilir
//   DB_NAME    = D1 database adı (default: menu-org-tr-db)
//   DB_ENV     = "local" veya "remote" (default: local)

import { execSync } from "node:child_process";
import * as readline from "node:readline";

const DB_NAME = process.env.DB_NAME || "menu-org-tr-db";
const DB_ENV  = (process.env.DB_ENV || "local") === "remote" ? "--remote" : "--local";
const PEPPER  = process.env.HASH_PEPPER || "";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

// ── PBKDF2 via Node crypto ──────────────────────────────────
async function hashPassword(password) {
  const { webcrypto } = await import("node:crypto");
  const subtle = webcrypto.subtle;

  const encoder = new TextEncoder();
  const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
  const saltHex   = [...saltBytes].map(b => b.toString(16).padStart(2, "0")).join("");

  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(password + PEPPER),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-512", salt: saltBytes, iterations: 100_000 },
    keyMaterial,
    512
  );

  const hashHex = [...new Uint8Array(derivedBits)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:sha512:100000:${saltHex}:${hashHex}`;
}

async function generateCuid() {
  // Basit cuid2-benzeri ID
  const { webcrypto } = await import("node:crypto");
  const bytes = webcrypto.getRandomValues(new Uint8Array(16));
  return "u_" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function sqlExecute(command) {
  const escaped = command.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return execSync(
    `npx wrangler d1 execute ${DB_NAME} ${DB_ENV} --command="${escaped}" --json 2>/dev/null`,
    { encoding: "utf-8" }
  );
}

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║    menu.org.tr — Kullanıcı Oluştur    ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log(`📍 Veritabanı: ${DB_NAME} (${DB_ENV === "--local" ? "lokal" : "uzak"})\n`);

  // Kullanıcı bilgileri
  const name     = (await ask("Ad Soyad         : ")).trim();
  const email    = (await ask("E-posta          : ")).trim().toLowerCase();
  const password = (await ask("Şifre            : ")).trim();
  const roleRaw  = (await ask("Rol [user/platform_admin] (varsayılan: user): ")).trim();
  const role     = ["platform_admin", "user"].includes(roleRaw) ? roleRaw : "user";

  // Restoran bilgileri (platform_admin ise atla)
  let restaurantId = null;
  let restaurantName = null;
  let restaurantSlug = null;

  if (role === "user") {
    const createRest = (await ask("\nBu kullanıcı için yeni restoran oluşturulsun mu? [E/h]: ")).trim().toLowerCase();
    if (createRest !== "h") {
      restaurantName = (await ask("Restoran Adı     : ")).trim();
      restaurantSlug = (await ask("Restoran Slug    : ")).trim().toLowerCase().replace(/\s+/g, "-");
    }
  }

  rl.close();
  console.log("\n⏳ Hash oluşturuluyor...");

  // Validasyon
  if (!name || !email || !password) {
    console.error("❌ Ad, e-posta ve şifre zorunludur.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("❌ Şifre en az 8 karakter olmalıdır.");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const userId = await generateCuid();
  const now = Date.now();

  console.log("💾 Kullanıcı ekleniyor...");

  // E-posta varlık kontrolü
  try {
    const checkResult = JSON.parse(
      sqlExecute(`SELECT id FROM users WHERE email = '${email}' LIMIT 1`)
    );
    if (checkResult[0]?.results?.length > 0) {
      console.error(`❌ "${email}" e-posta adresi zaten kayıtlı.`);
      process.exit(1);
    }
  } catch {
    // ignore
  }

  // Kullanıcı ekle
  sqlExecute(
    `INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES ('${userId}', '${email}', '${hash}', '${name}', '${role}', ${now}, ${now})`
  );

  console.log(`✅ Kullanıcı oluşturuldu: ${name} <${email}>`);

  // Restoran oluştur
  if (restaurantName && restaurantSlug) {
    const { webcrypto } = await import("node:crypto");
    const bytes = webcrypto.getRandomValues(new Uint8Array(12));
    restaurantId = "r_" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
    const memberId = "m_" + [...webcrypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, "0")).join("");

    sqlExecute(
      `INSERT INTO restaurants (id, name, slug, is_active, created_at, updated_at) VALUES ('${restaurantId}', '${restaurantName}', '${restaurantSlug}', 1, ${now}, ${now})`
    );

    sqlExecute(
      `INSERT INTO restaurant_members (id, restaurant_id, user_id, role, created_at) VALUES ('${memberId}', '${restaurantId}', '${userId}', 'owner', ${now})`
    );

    // Varsayılan restaurant_settings
    const settingsId = "rs_" + [...webcrypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, "0")).join("");
    sqlExecute(
      `INSERT INTO restaurant_settings (id, restaurant_id, updated_at) VALUES ('${settingsId}', '${restaurantId}', ${now})`
    );

    // Varsayılan website_settings
    const wsId = "ws_" + [...webcrypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, "0")).join("");
    sqlExecute(
      `INSERT INTO website_settings (id, restaurant_id, hero_title, primary_color, theme, is_live, updated_at) VALUES ('${wsId}', '${restaurantId}', 'Hoş Geldiniz', '#c5a880', 'minimal', 1, ${now})`
    );

    console.log(`✅ Restoran oluşturuldu: ${restaurantName} (/${restaurantSlug})`);
    console.log(`   → Owner olarak atandı`);
  }

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║              Özet                        ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`   E-posta : ${email}`);
  console.log(`   Şifre   : ${password}`);
  console.log(`   Rol     : ${role}`);
  if (restaurantSlug) {
    console.log(`   Menü URL: /${restaurantSlug}/menu`);
    console.log(`   Dashboard: /dashboard`);
  }
  if (DB_ENV === "--local") {
    console.log("\n⚠️  Bu kullanıcı SADECE lokal DB'de oluşturuldu.");
    console.log("   Prod'a eklemek için: DB_ENV=remote node scripts/create-user.mjs");
  }
}

main().catch((e) => {
  console.error("❌ Hata:", e.message);
  process.exit(1);
});
