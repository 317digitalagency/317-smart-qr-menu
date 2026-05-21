// src/types/cloudflare.d.ts
// Cloudflare Worker binding type declarations

interface CloudflareEnv {
  // Cloudflare D1 — Ana veritabanı
  DB: D1Database;
  // Cloudflare R2 — Görsel & medya depolama
  ASSETS_BUCKET: R2Bucket;
  // Cloudflare KV — Public sayfa cache
  CACHE: KVNamespace;
  // Cloudflare Queues — Analytics batch pipeline
  ANALYTICS_QUEUE: Queue;
  // Static assets
  ASSETS: Fetcher;
  // Secrets
  TURNSTILE_SECRET_KEY: string;
  SESSION_ENCRYPTION_KEY: string;
  HASH_PEPPER: string;
  // Vars
  NODE_ENV: string;
  APP_URL: string;
  PUBLIC_URL: string;
  R2_PUBLIC_URL: string;
}
