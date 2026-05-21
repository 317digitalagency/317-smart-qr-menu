// src/app/(dashboard)/dashboard/qr/page.tsx
// QR Kod üretimi ve yönetimi

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, qrCodes, restaurants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import QRClient from "./QRClient";

export default async function QRPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const [restaurant, allQRCodes] = await Promise.all([
    db.select({ slug: restaurants.slug, name: restaurants.name })
      .from(restaurants).where(eq(restaurants.id, membership.restaurantId)).get(),
    db.select().from(qrCodes)
      .where(eq(qrCodes.restaurantId, membership.restaurantId))
      .orderBy(desc(qrCodes.createdAt)),
  ]);

  return (
    <div style={{ padding: "32px", maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
        QR Kodlar
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Masa kartı, vitrin afişi, Instagram bio gibi konumlar için UTM izleme içeren QR kodlar üretin
      </p>
      <QRClient
        restaurantId={membership.restaurantId}
        restaurantSlug={restaurant?.slug ?? ""}
        restaurantName={restaurant?.name ?? ""}
        initialQRCodes={allQRCodes}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
