// src/app/api/campaigns/route.ts
// Kampanya CRUD API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { campaigns, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateCampaignCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const CampaignBase = z.object({
  restaurantId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  imageUrl: z.string().url().nullable().optional(),
  ctaType: z.enum(["whatsapp", "checkout", "menu", "instagram", "google_review", "directions"]),
  ctaValue: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
  startDate: z.number().int().nullable().optional(),
  endDate: z.number().int().nullable().optional(),
});

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...CampaignBase.shape }),
  z.object({ action: z.literal("update"), id: z.string().min(1), ...CampaignBase.shape }),
  z.object({ action: z.literal("delete"), id: z.string().min(1), restaurantId: z.string().min(1) }),
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = ActionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const data = result.data;
  const db = getDb();

  if (session.user.role !== "platform_admin") {
    const member = await db.select({ role: restaurantMembers.role })
      .from(restaurantMembers)
      .where(and(eq(restaurantMembers.userId, session.user.id), eq(restaurantMembers.restaurantId, data.restaurantId)))
      .get();
    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = Date.now();

  if (data.action === "create") {
    const campaign = {
      id: createId(),
      restaurantId: data.restaurantId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      ctaType: data.ctaType,
      ctaValue: data.ctaValue ?? null,
      isActive: data.isActive,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(campaigns).values(campaign);
    await invalidateCampaignCache(data.restaurantId);
    return NextResponse.json({ campaign });
  }

  if (data.action === "update") {
    const campaign = await db.update(campaigns)
      .set({
        title: data.title, description: data.description,
        imageUrl: data.imageUrl ?? null, ctaType: data.ctaType,
        ctaValue: data.ctaValue ?? null, isActive: data.isActive,
        startDate: data.startDate ?? null, endDate: data.endDate ?? null,
        updatedAt: now,
      })
      .where(and(eq(campaigns.id, data.id), eq(campaigns.restaurantId, data.restaurantId)))
      .returning().get();
    await invalidateCampaignCache(data.restaurantId);
    return NextResponse.json({ campaign });
  }

  if (data.action === "delete") {
    await db.delete(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.restaurantId, data.restaurantId)));
    await invalidateCampaignCache(data.restaurantId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
