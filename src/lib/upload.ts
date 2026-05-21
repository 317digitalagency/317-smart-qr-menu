// src/lib/upload.ts
// Cloudflare R2 upload yardımcıları
// Path standardı: restaurants/{restaurantId}/{type}/{entityId?}/{uuid}.webp
//
// DEV: R2 yoksa dosyayı public/ klasörüne kaydeder (next dev için)
// PROD: CF R2 binding kullanılır

import * as fs from "fs";
import * as path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadType = "logo" | "cover" | "product" | "campaign" | "category";

export interface UploadResult {
  url: string;
  path: string;
}

// ─────────────────────────────────────────────────────────
// Dosya validasyonu
// ─────────────────────────────────────────────────────────

export function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      ok: false,
      error: `Desteklenmeyen dosya tipi: ${file.type}. Sadece JPEG, PNG, WebP, GIF kabul edilir.`,
    };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return {
      ok: false,
      error: `Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum 5MB.`,
    };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────
// R2 path oluşturucu
// ─────────────────────────────────────────────────────────

export function buildR2Path(
  restaurantId: string,
  uploadType: UploadType,
  originalName: string,
  entityId?: string
): string {
  const fileId = crypto.randomUUID().slice(0, 8);
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";

  if (entityId) {
    return `restaurants/${restaurantId}/${uploadType}/${entityId}/${fileId}.${ext}`;
  }
  return `restaurants/${restaurantId}/${uploadType}/${fileId}.${ext}`;
}

// ─────────────────────────────────────────────────────────
// R2'ye yükleme (Prod) / Lokal dosya sistemi (Dev)
// ─────────────────────────────────────────────────────────

export async function uploadToR2(
  file: File,
  restaurantId: string,
  uploadType: UploadType,
  entityId?: string
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const filePath = buildR2Path(restaurantId, uploadType, file.name, entityId);
  const buffer = await file.arrayBuffer();

  // ─── Production: CF R2 ─────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const r2 = env.ASSETS_BUCKET as R2Bucket;
    const r2PublicUrl = (env.R2_PUBLIC_URL as string) ?? "https://assets.menu.org.tr";

    await r2.put(filePath, buffer, {
      httpMetadata: {
        contentType: file.type || "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        restaurantId,
        uploadType,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return { url: `${r2PublicUrl}/${filePath}`, path: filePath };
  }

  // ─── Development: public/ klasörüne kaydet ─────────────
  const publicDir = path.resolve(process.cwd(), "public", "uploads");
  const fullDir = path.join(publicDir, path.dirname(filePath));
  const fullPath = path.join(publicDir, filePath);

  fs.mkdirSync(fullDir, { recursive: true });
  fs.writeFileSync(fullPath, Buffer.from(buffer));

  const localUrl = `/uploads/${filePath}`;
  console.log(`[Upload:DEV] Saved to: ${fullPath} → ${localUrl}`);

  return { url: localUrl, path: filePath };
}

// ─────────────────────────────────────────────────────────
// R2'den silme (orphan cleanup)
// ─────────────────────────────────────────────────────────

export async function deleteFromR2(filePath: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Dev: public/ klasöründen sil
    try {
      const fullPath = path.resolve(process.cwd(), "public", "uploads", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch { /* ignore */ }
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const r2 = env.ASSETS_BUCKET as R2Bucket;
    await r2.delete(filePath);
  } catch {
    console.error(`R2 delete failed for path: ${filePath}`);
  }
}

/**
 * Bir URL'den R2 path'ini çıkarır (eskiyi silmek için)
 */
export function extractR2PathFromUrl(
  url: string,
  r2PublicUrl: string
): string | null {
  if (url.startsWith("/uploads/")) {
    return url.slice("/uploads/".length); // dev path
  }
  if (!url.startsWith(r2PublicUrl)) return null;
  return url.slice(r2PublicUrl.length + 1);
}
