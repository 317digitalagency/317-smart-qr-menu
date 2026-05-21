// src/worker/handlers.ts
// Cloudflare Worker event handlers:
// - Queue consumer: analytics batch insert to D1
// - Cron trigger: cleanup + maintenance tasks

import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { eq, lt, and, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

type Env = CloudflareEnv;

function getDb(env: Env) {
  return drizzle(env.DB as D1Database, { schema });
}

// ─────────────────────────────────────────────────────────
// Queue Consumer — Analytics Batch Insert
// ─────────────────────────────────────────────────────────

export async function handleQueue(
  batch: MessageBatch<schema.AnalyticsEventType>,
  env: Env
): Promise<void> {
  const db = getDb(env);
  const messages = batch.messages;

  if (messages.length === 0) {
    batch.ackAll();
    return;
  }

  // ─── 1. analytics_events batch insert ─────────────────────
  const eventValues = messages.map((m) => {
    const e = m.body as unknown as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      restaurantId: String(e.restaurantId),
      eventType: String(e.eventType),
      entityType: String(e.entityType),
      entityId: e.entityId ? String(e.entityId) : null,
      sourcePage: String(e.sourcePage ?? "other"),
      deviceType: String(e.deviceType ?? "mobile"),
      referrer: e.referrer ? String(e.referrer) : null,
      sessionId: String(e.sessionId),
      createdAt: Number(e.ts ?? Date.now()),
    };
  });

  try {
    await db.insert(schema.analyticsEvents).values(eventValues);
  } catch (err) {
    console.error("Analytics events insert failed:", err);
    // Kritik hata: retry için ackAll yapmıyoruz
    throw err;
  }

  // ─── 2. daily_analytics UPSERT (genel metrikler) ──────────
  for (const e of eventValues) {
    const date = new Date(e.createdAt).toISOString().split("T")[0];
    const aggId = `${e.restaurantId}_${date}`;

    const inc = {
      menuViews: e.eventType === "menu_view" ? 1 : 0,
      googleReviewClicks: e.eventType === "google_review_click" ? 1 : 0,
      campaignClicks: e.eventType === "campaign_click" ? 1 : 0,
      whatsappClicks: e.eventType === "whatsapp_click" ? 1 : 0,
      instagramClicks: e.eventType === "instagram_click" ? 1 : 0,
      directionsClicks: e.eventType === "directions_click" ? 1 : 0,
      phoneClicks: e.eventType === "phone_click" ? 1 : 0,
      qrScans: e.eventType === "qr_scan" ? 1 : 0,
    };

    await db
      .insert(schema.dailyAnalytics)
      .values({
        id: aggId,
        restaurantId: e.restaurantId,
        date,
        ...inc,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: schema.dailyAnalytics.id,
        set: {
          menuViews: sql`${schema.dailyAnalytics.menuViews} + ${inc.menuViews}`,
          googleReviewClicks: sql`${schema.dailyAnalytics.googleReviewClicks} + ${inc.googleReviewClicks}`,
          campaignClicks: sql`${schema.dailyAnalytics.campaignClicks} + ${inc.campaignClicks}`,
          whatsappClicks: sql`${schema.dailyAnalytics.whatsappClicks} + ${inc.whatsappClicks}`,
          instagramClicks: sql`${schema.dailyAnalytics.instagramClicks} + ${inc.instagramClicks}`,
          directionsClicks: sql`${schema.dailyAnalytics.directionsClicks} + ${inc.directionsClicks}`,
          phoneClicks: sql`${schema.dailyAnalytics.phoneClicks} + ${inc.phoneClicks}`,
          qrScans: sql`${schema.dailyAnalytics.qrScans} + ${inc.qrScans}`,
          updatedAt: sql`${Date.now()}`,
        },
      });

    // ─── 3. daily_entity_analytics UPSERT ───────────────────
    if (e.entityId && e.entityType !== "general") {
      const entityAggId = `${e.restaurantId}_${date}_${e.entityType}_${e.entityId}`;
      const isView = e.eventType.endsWith("_view");
      const isClick = e.eventType.endsWith("_click") || e.eventType === "qr_scan";

      await db
        .insert(schema.dailyEntityAnalytics)
        .values({
          id: entityAggId,
          restaurantId: e.restaurantId,
          date,
          entityType: e.entityType as schema.AnalyticsEntityType,
          entityId: e.entityId,
          views: isView ? 1 : 0,
          clicks: isClick ? 1 : 0,
          updatedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: schema.dailyEntityAnalytics.id,
          set: {
            views: sql`${schema.dailyEntityAnalytics.views} + ${isView ? 1 : 0}`,
            clicks: sql`${schema.dailyEntityAnalytics.clicks} + ${isClick ? 1 : 0}`,
            updatedAt: sql`${Date.now()}`,
          },
        });
    }
  }

  batch.ackAll();
}

// ─────────────────────────────────────────────────────────
// Cron Handler — Gece 02:00 çalışır
// ─────────────────────────────────────────────────────────

export async function handleCron(env: Env): Promise<void> {
  const db = getDb(env);
  const now = Date.now();

  console.log(`[Cron] ${new Date(now).toISOString()} başladı`);

  // ─── 1. 90 günden eski analytics_events temizle ───────────
  const cutoff90Days = now - 90 * 24 * 60 * 60 * 1000;
  const deleted = await db
    .delete(schema.analyticsEvents)
    .where(lt(schema.analyticsEvents.createdAt, cutoff90Days));
  console.log(`[Cron] Eski analytics events silindi`);

  // ─── 2. Süresi dolmuş kampanyaları pasife al ──────────────
  await db
    .update(schema.campaigns)
    .set({ isActive: false, updatedAt: now })
    .where(
      and(
        eq(schema.campaigns.isActive, true),
        lt(schema.campaigns.endDate, now),
        isNotNull(schema.campaigns.endDate)
      )
    );
  console.log(`[Cron] Süresi dolmuş kampanyalar kapatıldı`);

  // ─── 3. Süresi dolmuş session'ları temizle ────────────────
  await db
    .delete(schema.sessions)
    .where(lt(schema.sessions.expiresAt, now));
  console.log(`[Cron] Süresi dolmuş sessionlar temizlendi`);

  console.log(`[Cron] Tamamlandı`);
}

// ─────────────────────────────────────────────────────────
// Worker Default Export
// ─────────────────────────────────────────────────────────

export default {
  async queue(
    batch: MessageBatch<schema.AnalyticsEventType>,
    env: Env
  ): Promise<void> {
    await handleQueue(batch, env);
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleCron(env);
  },
};
