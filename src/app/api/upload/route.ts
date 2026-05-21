// src/app/api/upload/route.ts
// R2 dosya yükleme endpoint — yalnızca yetkili kullanıcılar

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadToR2, validateFile } from "@/lib/upload";
import { getDb } from "@/db";
import { restaurantMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { UploadType } from "@/lib/upload";

export const runtime = "nodejs";

const ALLOWED_UPLOAD_TYPES: UploadType[] = [
  "logo",
  "cover",
  "product",
  "campaign",
  "category",
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth kontrolü
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz form verisi" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const restaurantId = formData.get("restaurantId") as string | null;
  const uploadType = formData.get("type") as UploadType | null;
  const entityId = formData.get("entityId") as string | null | undefined;

  // Parametre doğrulama
  if (!file || !restaurantId || !uploadType) {
    return NextResponse.json(
      { error: "file, restaurantId ve type zorunludur" },
      { status: 400 }
    );
  }

  if (!ALLOWED_UPLOAD_TYPES.includes(uploadType)) {
    return NextResponse.json(
      { error: `Geçersiz upload tipi: ${uploadType}` },
      { status: 400 }
    );
  }

  // Dosya validasyonu
  const validation = validateFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Yetki: Kullanıcı bu restorana erişebilir mi?
  if (session.user.role !== "platform_admin") {
    const db = getDb();
    const membership = await db
      .select()
      .from(restaurantMembers)
      .where(
        and(
          eq(restaurantMembers.userId, session.user.id),
          eq(restaurantMembers.restaurantId, restaurantId)
        )
      )
      .get();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // viewer rolü upload yapamaz
    if (membership.role === "viewer") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }
  }

  try {
    const result = await uploadToR2(
      file,
      restaurantId,
      uploadType,
      entityId ?? undefined
    );

    return NextResponse.json({ url: result.url, path: result.path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
