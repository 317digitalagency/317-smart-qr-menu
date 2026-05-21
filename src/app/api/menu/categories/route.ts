// src/app/api/menu/categories/route.ts
// Kategori CRUD API + KV cache invalidation

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { categories, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { invalidateMenuCache } from "@/lib/cache";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

async function checkMembership(userId: string, restaurantId: string, allowViewer = false) {
  const db = getDb();
  const member = await db.select({ role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(and(eq(restaurantMembers.userId, userId), eq(restaurantMembers.restaurantId, restaurantId)))
    .get();
  if (!member) return null;
  if (!allowViewer && member.role === "viewer") return null;
  return member;
}

const CreateSchema = z.object({
  action: z.literal("create"),
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

const UpdateSchema = z.object({
  action: z.literal("update"),
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const ToggleSchema = z.object({
  action: z.literal("toggle"),
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  isActive: z.boolean(),
});

const DeleteSchema = z.object({
  action: z.literal("delete"),
  id: z.string().min(1),
  restaurantId: z.string().min(1),
});

const ActionSchema = z.discriminatedUnion("action", [
  CreateSchema, UpdateSchema, ToggleSchema, DeleteSchema,
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
    const member = await checkMembership(session.user.id, data.restaurantId);
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();

  if (data.action === "create") {
    const category = {
      id: createId(),
      restaurantId: data.restaurantId,
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder,
      isActive: true,
      showInMenu: true,
      coverUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(categories).values(category);
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ category });
  }

  if (data.action === "update") {
    const updated = await db.update(categories)
      .set({ name: data.name, description: data.description ?? null, updatedAt: now })
      .where(and(eq(categories.id, data.id), eq(categories.restaurantId, data.restaurantId)))
      .returning()
      .get();
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ category: updated });
  }

  if (data.action === "toggle") {
    await db.update(categories)
      .set({ isActive: data.isActive, updatedAt: now })
      .where(and(eq(categories.id, data.id), eq(categories.restaurantId, data.restaurantId)));
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ ok: true });
  }

  if (data.action === "delete") {
    await db.delete(categories)
      .where(and(eq(categories.id, data.id), eq(categories.restaurantId, data.restaurantId)));
    await invalidateMenuCache(data.restaurantId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
