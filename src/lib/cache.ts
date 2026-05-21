// src/lib/cache.ts
// Cloudflare KV cache katmanı — public menü ve restoran verileri için
//
// DEV  (next dev):  KV çağrıları sessizce atlanır (in-memory Map ile mock)
// PROD (CF Worker): Gerçek KV binding kullanılır

const DEFAULT_TTL_SECONDS = 300; // 5 dakika
const DOMAIN_TTL_SECONDS = 3600; // 1 saat (domainler sık değişmez)

// ─────────────────────────────────────────────────────────
// Cache Key Standardı
// ─────────────────────────────────────────────────────────

export const CacheKeys = {
  restaurant: (slug: string) => `restaurant:slug:${slug}`,
  domain: (host: string) => `domain:${host}`,
  menu: (restaurantId: string) => `menu:${restaurantId}`,
  website: (restaurantId: string) => `website:${restaurantId}`,
  campaigns: (restaurantId: string) => `campaigns:${restaurantId}`,
  settings: (restaurantId: string) => `settings:${restaurantId}`,
  theme: (restaurantId: string) => `theme:${restaurantId}`,
} as const;

// ─────────────────────────────────────────────────────────
// Dev-mode in-memory mock KV
// ─────────────────────────────────────────────────────────
const devStore = new Map<string, { value: unknown; expiresAt: number }>();

function isEdgeRuntime() {
  return (
    process.env.NEXT_RUNTIME === "edge" ||
    typeof (globalThis as Record<string, unknown>).caches !== "undefined" && process.env.NODE_ENV !== "test"
  );
}

// ─────────────────────────────────────────────────────────
// Temel KV yardımcıları
// ─────────────────────────────────────────────────────────

function tryGetKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return (env.CACHE as KVNamespace) ?? null;
  } catch {
    return null;
  }
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  // Production / preview
  const kv = tryGetKV();
  if (kv) {
    try {
      return (await kv.get(key, "json")) as T | null;
    } catch {
      return null;
    }
  }

  // Dev fallback — in-memory
  const entry = devStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    devStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  const kv = tryGetKV();
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    } catch {
      // Cache yazma başarısızsa sessizce devam et
    }
    return;
  }

  // Dev fallback
  devStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteFromCache(key: string): Promise<void> {
  const kv = tryGetKV();
  if (kv) {
    try { await kv.delete(key); } catch { /* ignore */ }
    return;
  }
  devStore.delete(key);
}

// ─────────────────────────────────────────────────────────
// Cache Invalidation Fonksiyonları
// Admin panelde veri değiştiğinde çağrılır
// ─────────────────────────────────────────────────────────

/**
 * Restoran genel bilgileri değiştiğinde (ad, slug, settings, website ayarları)
 */
export async function invalidateRestaurantCache(
  restaurantId: string,
  slug: string
): Promise<void> {
  await Promise.all([
    deleteFromCache(CacheKeys.restaurant(slug)),
    deleteFromCache(CacheKeys.settings(restaurantId)),
    deleteFromCache(CacheKeys.website(restaurantId)),
    deleteFromCache(CacheKeys.theme(restaurantId)),
  ]);
}

/**
 * Menü verisi değiştiğinde (kategori/ürün ekleme, silme, güncelleme, fiyat)
 */
export async function invalidateMenuCache(restaurantId: string): Promise<void> {
  await deleteFromCache(CacheKeys.menu(restaurantId));
}

/**
 * Kampanya değiştiğinde
 */
export async function invalidateCampaignCache(
  restaurantId: string
): Promise<void> {
  await deleteFromCache(CacheKeys.campaigns(restaurantId));
}

/**
 * Web sitesi ayarları değiştiğinde
 */
export async function invalidateWebsiteCache(
  restaurantId: string
): Promise<void> {
  await deleteFromCache(CacheKeys.website(restaurantId));
}

/**
 * Custom domain eklenip/doğrulandığında
 */
export async function invalidateDomainCache(domain: string): Promise<void> {
  await deleteFromCache(CacheKeys.domain(domain));
}

// ─────────────────────────────────────────────────────────
// Cache-First Veri Çekme Pattern'i
// ─────────────────────────────────────────────────────────

/**
 * KV'den oku → yoksa D1'den çek → KV'ye yaz → döndür
 */
export async function cacheFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<T> {
  const cached = await getFromCache<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}

/**
 * Domain → restaurantSlug mapping için özel helper
 * Middleware'de kullanılır (TTL: 1 saat)
 */
export async function getDomainSlug(host: string): Promise<string | null> {
  return getFromCache<string>(CacheKeys.domain(host));
}

export async function setDomainSlug(
  host: string,
  slug: string
): Promise<void> {
  await setCache(CacheKeys.domain(host), slug, DOMAIN_TTL_SECONDS);
}
