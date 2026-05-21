// src/app/api/analytics/route.ts
// Batch analytics endpoint — Zod korumalı
//
// PROD: Cloudflare Queue'ya gönderir (async batch insert)
// DEV:  Direkt D1'e yazar (Queue yok)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────
// Zod Şeması
// ─────────────────────────────────────────────────────────

const EVENT_TYPES = [
  "menu_view", "category_view", "product_view", "campaign_view", "recommendation_view",
  "product_click", "campaign_click", "recommendation_click",
  "google_review_click", "whatsapp_click", "instagram_click",
  "directions_click", "phone_click", "qr_scan",
] as const;

const ENTITY_TYPES = ["category", "product", "campaign", "recommendation", "qr", "general"] as const;
const DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const;
const SOURCE_PAGES = ["home", "menu", "campaigns", "contact", "popup", "other"] as const;

const EventSchema = z.object({
  restaurantId: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i),
  eventType: z.enum(EVENT_TYPES),
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().max(100).nullable().optional(),
  sourcePage: z.enum(SOURCE_PAGES),
  deviceType: z.enum(DEVICE_TYPES),
  sessionId: z.string().uuid(),
  referrer: z.string().max(500).nullable().optional(),
  ts: z.number().int().positive().refine(
    (ts) => Math.abs(Date.now() - ts) < 24 * 60 * 60 * 1000,
    "Timestamp çok eski veya geçersiz (max 24 saat)"
  ),
});

const PayloadSchema = z.array(EventSchema).min(1).max(50);

// ─────────────────────────────────────────────────────────
// CF env helper — dev'de null döner
// ─────────────────────────────────────────────────────────
function tryGetCFEnv(): { CACHE?: KVNamespace; ANALYTICS_QUEUE?: Queue } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return env ?? {};
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────
// Rate limiting (KV tabanlı — prod only)
// ─────────────────────────────────────────────────────────
async function checkRateLimit(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
  if (!kv) return true; // dev'de sınır yok
  const key = `rl:analytics:${ip}`;
  const current = parseInt((await kv.get(key)) ?? "0");
  if (current >= 100) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 60 });
  return true;
}

// ─────────────────────────────────────────────────────────
// Dev modda direkt D1'e yaz
// ─────────────────────────────────────────────────────────
async function writeEventsToDev(events: z.infer<typeof EventSchema>[]): Promise<void> {
  try {
    const { getDb } = await import("@/db");
    const { analyticsEvents } = await import("@/db/schema");
    const db = getDb();
    await db.insert(analyticsEvents).values(
      events.map((e) => ({
        id: crypto.randomUUID(),
        restaurantId: e.restaurantId,
        eventType: e.eventType,
        entityType: e.entityType,
        entityId: e.entityId ?? null,
        sourcePage: e.sourcePage,
        deviceType: e.deviceType,
        referrer: e.referrer ?? null,
        sessionId: e.sessionId,
        createdAt: e.ts,
      }))
    );
  } catch (err) {
    // Dev'de sessizce geç — analytics kritik değil
    console.warn("[Analytics:DEV] D1 write failed:", err);
  }
}

// ─────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 64_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const cfEnv = tryGetCFEnv();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  const allowed = await checkRateLimit(cfEnv.CACHE, ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = PayloadSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues.slice(0, 3).map((i) => i.message) },
      { status: 422 }
    );
  }

  const events = result.data;

  // PROD: Queue'ya gönder
  if (process.env.NODE_ENV === "production" && cfEnv.ANALYTICS_QUEUE) {
    try {
      await cfEnv.ANALYTICS_QUEUE.sendBatch(events.map((e) => ({ body: e })));
    } catch (err) {
      console.error("Queue send failed:", err);
      return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
    }
  } else {
    // DEV: Direkt D1'e yaz
    await writeEventsToDev(events);
  }

  return NextResponse.json(
    { ok: true, processed: events.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export function GET(): NextResponse {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
