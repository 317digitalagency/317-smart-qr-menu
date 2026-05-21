// scripts/seed.ts
// Lokal D1'e test verisi ekler
// Çalıştır: npx tsx scripts/seed.ts

import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const DB = "menu-org-tr-db";
const FLAG = "--local";

// ── Basit PBKDF2 yerine lokal seed için sha256 kullanıyoruz (prod'da PBKDF2 var)
// Gerçek hash: lib/auth.ts → hashPassword() fonksiyonu prod'da PBKDF2 kullanır
// Seed için doğrudan DB'ye elle bir PBKDF2 hash yazmamız gerekiyor.
// Bu scriptte test kolaylığı için bilinen bir hash kullanıyoruz.
// Şifre: Admin123! → hash üretildi (test için)

// NOT: Bu hash lib/auth.ts daki hashPassword("Admin123!", pepper="dev") sonucudur.
// Prod'da wrangler secret put HASH_PEPPER ile ayarlanacak.

const now = Date.now();
const userId = "user_seed_admin_001";
const restaurantId = "rest_seed_demo_001";
const settingsId = "rsett_seed_001";
const websiteId = "wsett_seed_001";
const cat1 = "cat_seed_sicak_001";
const cat2 = "cat_seed_soguk_001";
const cat3 = "cat_seed_tatli_001";
const prod1 = "prod_seed_001";
const prod2 = "prod_seed_002";
const prod3 = "prod_seed_003";
const prod4 = "prod_seed_004";
const prod5 = "prod_seed_005";
const memberId = "memb_seed_001";

// PBKDF2 hash for "Admin123!" with empty pepper (lokal test)
// Gerçekte wrangler d1 local bu hash'i doğrulamak için lib/auth.ts'e ihtiyaç duyar
// Bu seed'de bilinen değeri direkt yazıyoruz:
// hashPassword("Admin123!", "") = PBKDF2 SHA-512, 100000 iter
// Kısalık için burada bcrypt-style placeholder kullanıyoruz.
// Gerçek prod hash lib/auth.ts hashPassword() üretecek.
const PLACEHOLDER_HASH = "pbkdf2$sha512$100000$73616c7465645f68617368$" + 
  createHash("sha256").update("Admin123!:dev-seed").digest("hex");

function sql(query: string) {
  const escaped = query.replace(/'/g, "\\'").replace(/\n/g, " ");
  const result = execSync(
    `npx wrangler d1 execute ${DB} ${FLAG} --command='${escaped}' --json 2>/dev/null`,
    { encoding: "utf-8", cwd: process.cwd() }
  );
  return JSON.parse(result);
}

async function main() {
  console.log("🌱 Seeding local D1 database...\n");

  // ── Users ──────────────────────────────────────────────
  console.log("👤 Creating admin user...");
  sql(`INSERT OR REPLACE INTO users (id, email, passwordHash, name, role, createdAt, updatedAt) VALUES 
    ('${userId}', 'admin@menu.org.tr', '${PLACEHOLDER_HASH}', 'Demo Admin', 'restaurant_admin', ${now}, ${now})`);

  // ── Restaurants ────────────────────────────────────────
  console.log("🏪 Creating demo restaurant...");
  sql(`INSERT OR REPLACE INTO restaurants (id, name, slug, isActive, createdAt) VALUES 
    ('${restaurantId}', 'Café Miray', 'cafe-miray', 1, ${now})`);

  // ── Restaurant Members ─────────────────────────────────
  sql(`INSERT OR REPLACE INTO restaurant_members (id, restaurantId, userId, role, joinedAt) VALUES 
    ('${memberId}', '${restaurantId}', '${userId}', 'owner', ${now})`);

  // ── Restaurant Settings ────────────────────────────────
  console.log("⚙️  Creating restaurant settings...");
  sql(`INSERT OR REPLACE INTO restaurant_settings 
    (id, restaurantId, description, address, phone, whatsapp, instagram, googleMapsUrl, googleReviewUrl, updatedAt) VALUES 
    ('${settingsId}', '${restaurantId}', 
     'Şehrin kalbinde, sıcak bir atmosferde özel kahveler ve ev yapımı tatlılar.',
     'Bağcılar Mah. Kahve Sk. No:12, İstanbul',
     '+905321234567', '905321234567', 'cafemiray',
     'https://maps.google.com/?q=Cafe+Miray+Istanbul',
     'https://g.page/r/CafeMirayDemo/review',
     ${now})`);

  // ── Website Settings ───────────────────────────────────
  sql(`INSERT OR REPLACE INTO website_settings 
    (id, restaurantId, primaryColor, secondaryColor, theme, showAddress, showPhone, showSocial, updatedAt) VALUES 
    ('${websiteId}', '${restaurantId}', '#c5a880', '#8b6914', 'minimal', 1, 1, 1, ${now})`);

  // ── Categories ─────────────────────────────────────────
  console.log("📋 Creating categories...");
  sql(`INSERT OR REPLACE INTO categories (id, restaurantId, name, description, sortOrder, isActive, showInMenu, createdAt, updatedAt) VALUES 
    ('${cat1}', '${restaurantId}', 'Sıcak İçecekler', 'Espresso bazlı kahveler ve çaylar', 0, 1, 1, ${now}, ${now}),
    ('${cat2}', '${restaurantId}', 'Soğuk İçecekler', 'Cold brew, buzlu kahve ve meyveli içecekler', 1, 1, 1, ${now}, ${now}),
    ('${cat3}', '${restaurantId}', 'Tatlılar', 'Ev yapımı kek ve kurabiyeler', 2, 1, 1, ${now}, ${now})`);

  // ── Products ───────────────────────────────────────────
  console.log("🍽️  Creating products...");
  sql(`INSERT OR REPLACE INTO products 
    (id, restaurantId, categoryId, name, shortDescription, longDescription, priceKurus, imageUrl, isActive, isPopular, isNew, isFeatured, sortOrder, createdAt, updatedAt) VALUES 
    ('${prod1}', '${restaurantId}', '${cat1}', 
     'Latte', 'Espresso ve buharla ısıtılmış süt', 
     'Çift shot espresso üzerine ince bir süt köpüğü ile hazırlanan klasik latte. Hafif ve kremsi bir içim sunar.',
     8000, NULL, 1, 1, 0, 1, 0, ${now}, ${now}),
    ('${prod2}', '${restaurantId}', '${cat1}', 
     'Türk Kahvesi', 'Geleneksel köpüklü Türk kahvesi', 
     'Özel harmanlanmış Türk kahvesi, istenilen kıvamda pişirilir. Yanında lokum ile servis edilir.',
     5000, NULL, 1, 1, 0, 0, 1, ${now}, ${now}),
    ('${prod3}', '${restaurantId}', '${cat2}', 
     'Cold Brew', '12 saat soğuk demleme', 
     'Seçilmiş kahve çekirdeklerinden 12 saat soğuk demleme yöntemiyle hazırlanan, yumuşak ve serinletici bir içecek.',
     9000, NULL, 1, 0, 1, 0, 0, ${now}, ${now}),
    ('${prod4}', '${restaurantId}', '${cat3}', 
     'Cheesecake', 'Ev yapımı New York cheesecake', 
     'Günlük hazırlanan kremalı cheesecake. Sezonun taze meyveleriyle servis edilir.',
     12000, NULL, 1, 1, 0, 0, 0, ${now}, ${now}),
    ('${prod5}', '${restaurantId}', '${cat3}', 
     'Brownie', 'Çikolatalı ıslak brownie', 
     'Bitter çikolata ve cevizle hazırlanan nemli brownie. Dondurma ile veya sade servis edilebilir.',
     8500, NULL, 1, 0, 0, 0, 1, ${now}, ${now})`);

  // ── Recommendations ────────────────────────────────────
  console.log("🔀 Creating recommendations...");
  sql(`INSERT OR REPLACE INTO product_recommendations (id, restaurantId, productId, recommendedProductId, sortOrder, isActive, createdAt) VALUES 
    ('rec_seed_001', '${restaurantId}', '${prod1}', '${prod4}', 0, 1, ${now}),
    ('rec_seed_002', '${restaurantId}', '${prod1}', '${prod5}', 1, 1, ${now}),
    ('rec_seed_003', '${restaurantId}', '${prod2}', '${prod4}', 0, 1, ${now}),
    ('rec_seed_004', '${restaurantId}', '${prod3}', '${prod5}', 0, 1, ${now})`);

  // ── Demo Campaign ──────────────────────────────────────
  console.log("📢 Creating demo campaign...");
  sql(`INSERT OR REPLACE INTO campaigns 
    (id, restaurantId, title, description, ctaType, ctaValue, isActive, createdAt, updatedAt) VALUES 
    ('camp_seed_001', '${restaurantId}', 
     'Hoş Geldin İndirimi 🎉', 
     'İlk siparişinizde tüm tatlılarda %15 indirim! Kodu gösterin.',
     'whatsapp', 'Merhaba, hoş geldin kampanyasından yararlanmak istiyorum.',
     1, ${now}, ${now})`);

  // ── Demo Analytics ─────────────────────────────────────
  console.log("📊 Creating demo analytics...");
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  sql(`INSERT OR REPLACE INTO daily_analytics 
    (id, restaurantId, date, menuViews, qrScans, googleReviewClicks, campaignClicks, whatsappClicks, instagramClicks, directionsClicks, websiteViews) VALUES 
    ('da_seed_001', '${restaurantId}', '${today}', 42, 18, 7, 12, 5, 3, 4, 15),
    ('da_seed_002', '${restaurantId}', '${yesterday}', 38, 22, 5, 9, 8, 2, 3, 12)`);

  sql(`INSERT OR REPLACE INTO daily_entity_analytics 
    (id, restaurantId, entityType, entityId, date, views, clicks) VALUES 
    ('dea_seed_001', '${restaurantId}', 'product', '${prod1}', '${today}', 28, 15),
    ('dea_seed_002', '${restaurantId}', 'product', '${prod4}', '${today}', 21, 9),
    ('dea_seed_003', '${restaurantId}', 'product', '${prod3}', '${today}', 18, 7),
    ('dea_seed_004', '${restaurantId}', 'category', '${cat1}', '${today}', 42, 0),
    ('dea_seed_005', '${restaurantId}', 'category', '${cat3}', '${today}', 33, 0),
    ('dea_seed_006', '${restaurantId}', 'campaign', 'camp_seed_001', '${today}', 12, 8)`);

  console.log("\n✅ Seed complete!\n");
  console.log("📋 Demo bilgileri:");
  console.log("   E-posta : admin@menu.org.tr");
  console.log("   Şifre   : Admin123!");
  console.log("   Restoran: Café Miray (slug: cafe-miray)");
  console.log("   Menü    : http://localhost:3000/cafe-miray/menu");
  console.log("   Dashboard: http://localhost:3000/dashboard");
  console.log("\n⚠️  NOT: Şifre hash'i gerçek PBKDF2 değil (lokal test için placeholder).");
  console.log("   Gerçek login için scripts/create-user.ts kullanın.");
}

main().catch((e) => { console.error(e); process.exit(1); });
