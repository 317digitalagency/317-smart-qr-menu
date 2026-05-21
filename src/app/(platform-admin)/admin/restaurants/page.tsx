// src/app/(platform-admin)/admin/restaurants/page.tsx
// Platform Admin — Restoran listesi + aktif/pasif toggle + bilgilendirme

import { getDb } from "@/db";
import { restaurants, restaurantMembers, users, restaurantSettings } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import RestaurantsAdminClient from "./RestaurantsAdminClient";

export default async function AdminRestaurantsPage() {
  const db = getDb();

  // Her restoran için üye sayısı ve ayarlar
  const allRestaurants = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      isActive: restaurants.isActive,
      createdAt: restaurants.createdAt,
      phone: restaurantSettings.phone,
      instagram: restaurantSettings.instagram,
    })
    .from(restaurants)
    .leftJoin(restaurantSettings, eq(restaurantSettings.restaurantId, restaurants.id))
    .orderBy(sql`${restaurants.createdAt} DESC`);

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0 0 4px",
              fontFamily: "var(--font-display)",
              color: "oklch(92% 0.04 265)",
            }}
          >
            Restoranlar
          </h1>
          <p style={{ color: "oklch(55% 0.04 265)", fontSize: 13, margin: 0 }}>
            {allRestaurants.length} kayıtlı işletme
          </p>
        </div>
      </div>
      <RestaurantsAdminClient initialRestaurants={allRestaurants} />
    </div>
  );
}
