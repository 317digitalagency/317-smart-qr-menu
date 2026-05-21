// src/app/(dashboard)/dashboard/restaurant/page.tsx
// Restoran bilgileri yönetimi — logo, kapak görseli, iletişim, sosyal, çalışma saatleri

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, restaurantSettings, restaurants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import RestaurantSettingsForm from "./RestaurantSettingsForm";

export default async function RestaurantSettingsPage() {
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

  const [restaurant, settings] = await Promise.all([
    db.select().from(restaurants).where(eq(restaurants.id, membership.restaurantId)).get(),
    db.select().from(restaurantSettings).where(eq(restaurantSettings.restaurantId, membership.restaurantId)).get(),
  ]);

  if (!restaurant) redirect("/dashboard");

  return (
    <div style={{ padding: "32px", maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, fontFamily: "var(--font-display)" }}>
        Restoran Bilgileri
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Logo, kapak görseli, iletişim bilgileri ve sosyal medya hesapları
      </p>
      <RestaurantSettingsForm
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        settings={settings ?? null}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
