// src/app/api/menu/products/route.ts
// Ürün CRUD API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { products, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateMenuCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const ProductBase = z.object({
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(500),
  longDescription: z.string().max(2000).nullable().optional(),
  priceKurus: z.number().int().positive(),
  discountedPriceKurus: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  tagsJson: z.string().max(500).nullable().optional(),
  allergensJson: z.string().max(500).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...ProductBase.shape }),
  z.object({ action: z.literal("update"), id: z.string().min(1), ...ProductBase.shape }),
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

  // Yetki
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
    const product = {
      id: createId(),
      restaurantId: data.restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription ?? null,
      priceKurus: data.priceKurus,
      discountedPriceKurus: data.discountedPriceKurus ?? null,
      imageUrl: data.imageUrl ?? null,
      tagsJson: data.tagsJson ?? null,
      allergensJson: data.allergensJson ?? null,
      isFeatured: data.isFeatured,
      isPopular: data.isPopular,
      isNew: data.isNew,
      isActive: data.isActive,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(products).values(product);
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ product });
  }

  if (data.action === "update") {
    const product = await db.update(products)
      .set({
        categoryId: data.categoryId,
        name: data.name,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription ?? null,
        priceKurus: data.priceKurus,
        discountedPriceKurus: data.discountedPriceKurus ?? null,
        imageUrl: data.imageUrl ?? null,
        tagsJson: data.tagsJson ?? null,
        allergensJson: data.allergensJson ?? null,
        isFeatured: data.isFeatured,
        isPopular: data.isPopular,
        isNew: data.isNew,
        isActive: data.isActive,
        updatedAt: now,
      })
      .where(and(eq(products.id, data.id), eq(products.restaurantId, data.restaurantId)))
      .returning()
      .get();
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ product });
  }

  if (data.action === "delete") {
    await db.delete(products)
      .where(and(eq(products.id, data.id), eq(products.restaurantId, data.restaurantId)));
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
