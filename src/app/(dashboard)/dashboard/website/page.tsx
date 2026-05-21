// src/app/(dashboard)/dashboard/website/page.tsx
// Web sitesi görünüm ayarları

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, websiteSettings, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import WebsiteSettingsClient from "./WebsiteSettingsClient";

export default async function WebsitePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1)
    .get();

  if (!membership) redirect("/dashboard");

  const [websiteData, restaurant] = await Promise.all([
    db.select()
      .from(websiteSettings)
      .where(eq(websiteSettings.restaurantId, membership.restaurantId))
      .get(),
    db.select({ name: restaurants.name, slug: restaurants.slug })
      .from(restaurants)
      .where(eq(restaurants.id, membership.restaurantId))
      .get(),
  ]);

  return (
    <div style={{ padding: "32px", maxWidth: 700 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 4px",
          fontFamily: "var(--font-display)",
        }}
      >
        Web Sitesi Ayarları
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Müşterilerin gördüğü mini web sitenizin içeriği ve görünümü
      </p>
      <WebsiteSettingsClient
        restaurantId={membership.restaurantId}
        restaurantSlug={restaurant?.slug ?? ""}
        initialSettings={websiteData ?? null}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
