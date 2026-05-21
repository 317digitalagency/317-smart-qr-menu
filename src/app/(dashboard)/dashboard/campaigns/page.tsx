// src/app/(dashboard)/dashboard/campaigns/page.tsx
// Kampanya yönetimi

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const allCampaigns = await db.select().from(campaigns)
    .where(eq(campaigns.restaurantId, membership.restaurantId))
    .orderBy(desc(campaigns.createdAt));

  return (
    <div style={{ padding: "32px", maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
        Kampanyalar
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Özel teklifler, WhatsApp yönlendirme ve Google yorum kampanyaları
      </p>
      <CampaignsClient
        restaurantId={membership.restaurantId}
        initialCampaigns={allCampaigns}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
