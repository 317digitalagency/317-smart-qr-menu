// src/app/api/domains/route.ts
// Custom domain yönetimi API
//
// POST /api/domains        → Yeni domain ekle
// DELETE /api/domains      → Domain sil
// POST /api/domains/verify → DNS TXT token doğrula

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantDomains, restaurantMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { invalidateDomainCache, setDomainSlug } from "@/lib/cache";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────
const AddDomainSchema = z.object({
  restaurantId: z.string().min(1),
  domain: z
    .string()
    .min(4)
    .max(253)
    .regex(
      /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
      "Geçerli bir domain girin (örn. diamore.com)"
    ),
  type: z.enum(["root", "subdomain"]),
});

const RemoveDomainSchema = z.object({
  domainId: z.string().min(1),
  restaurantId: z.string().min(1),
});

const VerifyDomainSchema = z.object({
  domainId: z.string().min(1),
  restaurantId: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────────────
// Helper: kullanıcının restorana erişim yetkisi var mı?
// ─────────────────────────────────────────────────────────────────────
async function assertRestaurantAccess(
  userId: string,
  userRole: string,
  restaurantId: string
): Promise<boolean> {
  if (userRole === "platform_admin") return true;
  const db = getDb();
  const member = await db
    .select({ role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(
      and(
        eq(restaurantMembers.userId, userId),
        eq(restaurantMembers.restaurantId, restaurantId)
      )
    )
    .get();
  return !!member && member.role !== "viewer";
}

// ─────────────────────────────────────────────────────────────────────
// DNS TXT doğrulama
// Token: "menuorgtr-verify=<verificationToken>"
// ─────────────────────────────────────────────────────────────────────
async function verifyDnsTxt(domain: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!res.ok) return false;

    const data = await res.json() as { Answer?: Array<{ data: string }> };
    const answers = data.Answer ?? [];

    return answers.some((a) =>
      a.data.replace(/"/g, "").includes(`menuorgtr-verify=${token}`)
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/domains — domain ekle
// ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  // Verify endpoint mi?
  const url = new URL(req.url);
  if (url.pathname.endsWith("/verify")) {
    return handleVerify(session, body);
  }

  const result = AddDomainSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const { restaurantId, domain, type } = result.data;
  const normalizedDomain = domain.toLowerCase().trim();

  const hasAccess = await assertRestaurantAccess(
    session.user.id,
    session.user.role,
    restaurantId
  );
  if (!hasAccess) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const db = getDb();
  const now = Date.now();

  // Domain zaten kayıtlı mı?
  const existing = await db
    .select({ id: restaurantDomains.id })
    .from(restaurantDomains)
    .where(eq(restaurantDomains.domain, normalizedDomain))
    .get();

  if (existing) {
    return NextResponse.json({ error: "Bu domain zaten kayıtlı" }, { status: 409 });
  }

  const verificationToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const id = createId();

  await db.insert(restaurantDomains).values({
    id,
    restaurantId,
    domain: normalizedDomain,
    type,
    isPrimary: false,
    isVerified: false,
    verificationToken,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    domainId: id,
    domain: normalizedDomain,
    verificationToken,
    instructions: {
      method: "DNS TXT kaydı",
      record: `menuorgtr-verify=${verificationToken}`,
      host: "_menu-verify",
      note: `${normalizedDomain} domaininin DNS yönetim paneline gidin, TXT kaydı ekleyin: Host=_menu-verify, Value=menuorgtr-verify=${verificationToken}`,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// Verify handler (POST /api/domains/verify)
// ─────────────────────────────────────────────────────────────────────
async function handleVerify(
  session: Awaited<ReturnType<typeof getSession>>,
  body: unknown
): Promise<NextResponse> {
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = VerifyDomainSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const { domainId, restaurantId } = result.data;
  const hasAccess = await assertRestaurantAccess(session.user.id, session.user.role, restaurantId);
  if (!hasAccess) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const db = getDb();
  const domainRecord = await db
    .select()
    .from(restaurantDomains)
    .where(
      and(
        eq(restaurantDomains.id, domainId),
        eq(restaurantDomains.restaurantId, restaurantId)
      )
    )
    .get();

  if (!domainRecord) {
    return NextResponse.json({ error: "Domain bulunamadı" }, { status: 404 });
  }

  if (domainRecord.isVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const token = domainRecord.verificationToken;
  if (!token) {
    return NextResponse.json({ error: "Doğrulama token'ı yok" }, { status: 422 });
  }

  const verified = await verifyDnsTxt(domainRecord.domain, token);

  if (!verified) {
    return NextResponse.json(
      {
        ok: false,
        error: "DNS TXT kaydı bulunamadı",
        hint: `_menu-verify.${domainRecord.domain} için TXT değeri: menuorgtr-verify=${token}`,
      },
      { status: 422 }
    );
  }

  // Doğrulama başarılı
  await db
    .update(restaurantDomains)
    .set({ isVerified: true, updatedAt: Date.now() })
    .where(eq(restaurantDomains.id, domainId));

  // KV'ye domain → slug mapping yaz
  // Slug'ı restaurants tablosundan al
  const { restaurants } = await import("@/db/schema");
  const rest = await db
    .select({ slug: restaurants.slug })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .get();

  if (rest?.slug) {
    await setDomainSlug(domainRecord.domain, rest.slug);
  }

  return NextResponse.json({ ok: true, verified: true });
}

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/domains — domain sil
// ─────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const result = RemoveDomainSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 422 });
  }

  const { domainId, restaurantId } = result.data;
  const hasAccess = await assertRestaurantAccess(session.user.id, session.user.role, restaurantId);
  if (!hasAccess) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const db = getDb();
  const domainRecord = await db
    .select({ domain: restaurantDomains.domain })
    .from(restaurantDomains)
    .where(
      and(
        eq(restaurantDomains.id, domainId),
        eq(restaurantDomains.restaurantId, restaurantId)
      )
    )
    .get();

  if (!domainRecord) {
    return NextResponse.json({ error: "Domain bulunamadı" }, { status: 404 });
  }

  await db.delete(restaurantDomains).where(eq(restaurantDomains.id, domainId));
  await invalidateDomainCache(domainRecord.domain);

  return NextResponse.json({ ok: true });
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/domains?restaurantId=xxx — restoran domainleri listele
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurantId = req.nextUrl.searchParams.get("restaurantId");
  if (!restaurantId) return NextResponse.json({ error: "restaurantId gerekli" }, { status: 400 });

  const hasAccess = await assertRestaurantAccess(session.user.id, session.user.role, restaurantId);
  if (!hasAccess) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const db = getDb();
  const domains = await db
    .select()
    .from(restaurantDomains)
    .where(eq(restaurantDomains.restaurantId, restaurantId));

  return NextResponse.json({ domains });
}
