// src/app/(platform-admin)/admin/users/page.tsx
// Platform Admin — Kullanıcı listesi

import { getDb } from "@/db";
import { users, restaurantMembers, restaurants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import UsersAdminClient from "./UsersAdminClient";

export default async function AdminUsersPage() {
  const db = getDb();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);

  // Her kullanıcının hangi restoranlarda üye olduğunu çek
  const memberships = await db
    .select({
      userId: restaurantMembers.userId,
      restaurantName: restaurants.name,
      restaurantSlug: restaurants.slug,
      role: restaurantMembers.role,
    })
    .from(restaurantMembers)
    .leftJoin(restaurants, eq(restaurants.id, restaurantMembers.restaurantId));

  const memberMap: Record<
    string,
    { restaurantName: string; restaurantSlug: string; role: string }[]
  > = {};
  for (const m of memberships) {
    if (!m.restaurantName) continue;
    if (!memberMap[m.userId]) memberMap[m.userId] = [];
    memberMap[m.userId].push({
      restaurantName: m.restaurantName,
      restaurantSlug: m.restaurantSlug ?? "",
      role: m.role,
    });
  }

  return (
    <div style={{ padding: 32 }}>
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
        Kullanıcılar
      </h1>
      <p style={{ color: "oklch(55% 0.04 265)", fontSize: 13, marginBottom: 28 }}>
        {allUsers.length} kayıtlı kullanıcı
      </p>
      <UsersAdminClient users={allUsers} memberMap={memberMap} />
    </div>
  );
}
