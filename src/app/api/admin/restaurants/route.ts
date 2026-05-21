// src/app/api/admin/restaurants/route.ts
// Platform Admin — restoran aktif/pasif toggle

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("toggle"),
    id: z.string().min(1),
    isActive: z.boolean(),
  }),
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session || session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  if (data.action === "toggle") {
    await db.update(restaurants)
      .set({ isActive: data.isActive, updatedAt: Date.now() })
      .where(eq(restaurants.id, data.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
