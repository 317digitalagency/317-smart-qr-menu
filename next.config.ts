import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// NOT: DEV modunda Cloudflare bindings'e ihtiyaç yoktur.
// getDb() doğrudan lokal Miniflare SQLite dosyasını kullanır.
// Production'da opennextjs-cloudflare build + wrangler deploy kullanılır.
// initOpenNextCloudflareForDev() kaldırıldı — artık gerekmiyor.
