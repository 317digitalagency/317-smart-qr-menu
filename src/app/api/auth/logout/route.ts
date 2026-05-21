// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", _req.url));
}
