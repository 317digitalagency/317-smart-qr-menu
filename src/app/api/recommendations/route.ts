// src/app/api/recommendations/route.ts
// Ürün tavsiye CRUD API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { productRecommendations, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateMenuCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    restaurantId: z.string().min(1),
    productId: z.string().min(1),
    recommendedProductId: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().min(1),
    restaurantId: z.string().min(1),
  }),
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

  if (data.action === "create") {
    const now = Date.now();
    const recommendation = {
      id: createId(),
      restaurantId: data.restaurantId,
      productId: data.productId,
      recommendedProductId: data.recommendedProductId,
      sortOrder: 0,
      isActive: true,
      createdAt: now,
    };
    await db.insert(productRecommendations).values(recommendation);
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ recommendation });
  }

  if (data.action === "delete") {
    await db.delete(productRecommendations)
      .where(and(eq(productRecommendations.id, data.id), eq(productRecommendations.restaurantId, data.restaurantId)));
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
