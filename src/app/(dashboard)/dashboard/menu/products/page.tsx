// src/app/(dashboard)/dashboard/menu/products/page.tsx
// Ürün yönetimi — listeleme, filtreleme, ekleme, düzenleme, silme

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, products, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const [allProducts, allCategories] = await Promise.all([
    db.select().from(products)
      .where(eq(products.restaurantId, membership.restaurantId))
      .orderBy(asc(products.sortOrder)),
    db.select().from(categories)
      .where(eq(categories.restaurantId, membership.restaurantId))
      .orderBy(asc(categories.sortOrder)),
  ]);

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
            Ürünler
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
            {allProducts.length} ürün · {allCategories.length} kategori
          </p>
        </div>
      </div>
      <ProductsClient
        restaurantId={membership.restaurantId}
        initialProducts={allProducts}
        categories={allCategories}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
