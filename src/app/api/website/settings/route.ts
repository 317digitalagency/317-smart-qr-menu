// src/app/api/website/settings/route.ts
// Website ayarlarını kaydet

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { websiteSettings, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateWebsiteCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const Schema = z.object({
  restaurantId: z.string().min(1),
  heroTitle: z.string().max(200).optional(),
  heroDescription: z.string().max(500).nullable().optional(),
  primaryColor: z.string().max(20).optional(),
  theme: z.enum(["light", "dark", "elegant", "minimal"]).optional(),
  isLive: z.boolean().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = Schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const data = result.data;
  const db = getDb();

  if (session.user.role !== "platform_admin") {
    const member = await db.select({ role: restaurantMembers.role })
      .from(restaurantMembers)
      .where(and(
        eq(restaurantMembers.userId, session.user.id),
        eq(restaurantMembers.restaurantId, data.restaurantId),
      ))
      .get();
    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = Date.now();
  const existing = await db.select({ id: websiteSettings.id })
    .from(websiteSettings)
    .where(eq(websiteSettings.restaurantId, data.restaurantId))
    .get();

  if (existing) {
    await db.update(websiteSettings)
      .set({
        heroTitle: data.heroTitle ?? "Hoş Geldiniz",
        heroDescription: data.heroDescription ?? null,
        primaryColor: data.primaryColor ?? "#c5a880",
        theme: data.theme ?? "minimal",
        isLive: data.isLive ?? true,
        updatedAt: now,
      })
      .where(eq(websiteSettings.restaurantId, data.restaurantId));
  } else {
    await db.insert(websiteSettings).values({
      id: createId(),
      restaurantId: data.restaurantId,
      heroTitle: data.heroTitle ?? "Hoş Geldiniz",
      heroDescription: data.heroDescription ?? null,
      primaryColor: data.primaryColor ?? "#c5a880",
      theme: data.theme ?? "minimal",
      isLive: data.isLive ?? true,
      updatedAt: now,
    });
  }

  await invalidateWebsiteCache(data.restaurantId);
  return NextResponse.json({ ok: true });
}
