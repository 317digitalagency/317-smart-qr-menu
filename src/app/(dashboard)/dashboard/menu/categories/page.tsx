// src/app/(dashboard)/dashboard/menu/categories/page.tsx
// Kategori yönetimi — listeleme, ekleme, sıralama, silme

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, membership.restaurantId))
    .orderBy(asc(categories.sortOrder));

  return (
    <div style={{ padding: "32px", maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
            Kategoriler
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
            Menü kategorilerinizi yönetin, sıralayın
          </p>
        </div>
      </div>
      <CategoriesClient
        restaurantId={membership.restaurantId}
        initialCategories={allCategories}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
