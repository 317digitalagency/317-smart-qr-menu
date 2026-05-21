// src/app/(dashboard)/dashboard/recommendations/page.tsx
// Tavsiye (cross-sell) ürün yönetimi

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, products, productRecommendations, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import RecommendationsClient from "./RecommendationsClient";

export default async function RecommendationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1).get();

  if (!membership) redirect("/dashboard");

  const [allProducts, allCategories, allRecommendations] = await Promise.all([
    db.select({ id: products.id, name: products.name, categoryId: products.categoryId, imageUrl: products.imageUrl, priceKurus: products.priceKurus })
      .from(products)
      .where(eq(products.restaurantId, membership.restaurantId))
      .orderBy(asc(products.sortOrder)),
    db.select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.restaurantId, membership.restaurantId))
      .orderBy(asc(categories.sortOrder)),
    db.select()
      .from(productRecommendations)
      .where(eq(productRecommendations.restaurantId, membership.restaurantId))
      .orderBy(asc(productRecommendations.sortOrder)),
  ]);

  return (
    <div style={{ padding: "32px", maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
        Tavsiye Ürünler
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Ürün detay sayfasında "Birlikte Harika Gider" bölümü için çapraz satış eşleşmeleri tanımlayın
      </p>
      <RecommendationsClient
        restaurantId={membership.restaurantId}
        products={allProducts}
        categories={allCategories}
        initialRecommendations={allRecommendations}
        canEdit={membership.role !== "viewer"}
      />
    </div>
  );
}
