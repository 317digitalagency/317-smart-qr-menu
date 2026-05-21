// src/app/api/qr/save/route.ts
// QR kodunu D1'e kaydet

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { qrCodes, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

const Schema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(200),
  qrType: z.enum(["menu", "campaign", "review", "custom"]),
  targetUrl: z.string().url(),
  sourceKey: z.string().max(100).nullable().optional(),
  utmMedium: z.string().max(100).nullable().optional(),
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
      .where(and(eq(restaurantMembers.userId, session.user.id), eq(restaurantMembers.restaurantId, data.restaurantId)))
      .get();
    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = Date.now();
  const qrCode = {
    id: createId(),
    restaurantId: data.restaurantId,
    name: data.name,
    qrType: data.qrType,
    targetUrl: data.targetUrl,
    sourceKey: data.sourceKey ?? null,
    utmSource: "qr",
    utmMedium: data.utmMedium ?? null,
    isActive: true,
    scanCount: 0,
    lastScannedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(qrCodes).values(qrCode);
  return NextResponse.json({ qrCode });
}
