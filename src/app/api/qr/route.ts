// src/app/api/qr/route.ts
// QR kod üretimi endpoint

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateQRCode, buildQRTargetUrl } from "@/lib/qr";
import { z } from "zod";

export const runtime = "nodejs";

const QRRequestSchema = z.object({
  restaurantSlug: z.string().min(1).max(100),
  path: z.enum(["/menu", "/kampanyalar", "/iletisim", "/"]).default("/menu"),
  size: z.number().int().min(100).max(1000).default(300),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#000000"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#ffffff"),
  utmMedium: z.string().max(50).optional(),
  sourceKey: z.string().max(50).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = QRRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues.slice(0, 3) },
      { status: 422 }
    );
  }

  const { restaurantSlug, path, size, color, backgroundColor, utmMedium, sourceKey } =
    result.data;

  const baseUrl = process.env.PUBLIC_URL ?? "https://menu.org.tr";
  const targetUrl = buildQRTargetUrl({
    baseUrl,
    restaurantSlug,
    path,
    utmMedium,
    sourceKey,
  });

  try {
    const qr = await generateQRCode({
      url: targetUrl,
      size,
      color,
      backgroundColor,
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({
      svg: qr.svg,
      dataUrl: qr.dataUrl,
      targetUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "QR üretim hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
