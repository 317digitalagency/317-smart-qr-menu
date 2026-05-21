// src/app/api/restaurant/settings/route.ts
// Restoran ayarlarını kaydet (upsert) + KV cache invalidate

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantSettings, restaurantMembers, restaurants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateRestaurantCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const SettingsSchema = z.object({
  restaurantId: z.string().min(1),
  logoUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
  instagram: z.string().max(100).nullable().optional(),
  googleMapsUrl: z.string().url().nullable().optional(),
  googleReviewUrl: z.string().url().nullable().optional(),
  workingHoursJson: z.string().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = SettingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const { restaurantId, ...data } = result.data;
  const db = getDb();

  // Yetki kontrolü
  if (session.user.role !== "platform_admin") {
    const member = await db.select({ role: restaurantMembers.role })
      .from(restaurantMembers)
      .where(and(eq(restaurantMembers.userId, session.user.id), eq(restaurantMembers.restaurantId, restaurantId)))
      .get();
    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = Date.now();
  const existing = await db.select({ id: restaurantSettings.id })
    .from(restaurantSettings)
    .where(eq(restaurantSettings.restaurantId, restaurantId))
    .get();

  if (existing) {
    await db.update(restaurantSettings)
      .set({ ...data, updatedAt: now })
      .where(eq(restaurantSettings.restaurantId, restaurantId));
  } else {
    await db.insert(restaurantSettings).values({
      id: createId(),
      restaurantId,
      ...data,
      updatedAt: now,
    });
  }

  // Slug'ı bul ve KV cache invalidate et
  const restaurant = await db.select({ slug: restaurants.slug })
    .from(restaurants).where(eq(restaurants.id, restaurantId)).get();
  if (restaurant) {
    await invalidateRestaurantCache(restaurantId, restaurant.slug);
  }

  return NextResponse.json({ ok: true });
}
