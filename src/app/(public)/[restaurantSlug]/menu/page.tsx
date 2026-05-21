// src/app/(public)/[restaurantSlug]/menu/page.tsx
// QR Menü — scroll-snap kategori bar, ürün listesi, tavsiye sistemi
// Tüm analitik olaylar sendBeacon pipeline'ına gider (doğrudan D1'e yazmaz)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import {
  restaurants,
  restaurantSettings,
  websiteSettings,
  categories,
  products,
  productRecommendations,
  campaigns,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { cacheFirst, CacheKeys } from "@/lib/cache";
import { formatPrice } from "@/lib/qr";
import QRMenuClient from "./QRMenuClient";

interface Props {
  params: Promise<{ restaurantSlug: string }>;
}

// ─────────────────────────────────────────────────────────
// Server-side data fetching
// ─────────────────────────────────────────────────────────

async function getMenuData(slug: string) {
  const db = getDb();

  return cacheFirst(
    CacheKeys.menu(slug),
    async () => {
      const restaurant = await db
        .select()
        .from(restaurants)
        .where(and(eq(restaurants.slug, slug), eq(restaurants.isActive, true)))
        .get();

      if (!restaurant) return null;

      const [settings, website, allCategories, allProducts, activeCampaigns] =
        await Promise.all([
          db
            .select()
            .from(restaurantSettings)
            .where(eq(restaurantSettings.restaurantId, restaurant.id))
            .get(),
          db
            .select()
            .from(websiteSettings)
            .where(eq(websiteSettings.restaurantId, restaurant.id))
            .get(),
          db
            .select()
            .from(categories)
            .where(
              and(
                eq(categories.restaurantId, restaurant.id),
                eq(categories.isActive, true),
                eq(categories.showInMenu, true)
              )
            )
            .orderBy(asc(categories.sortOrder)),
          db
            .select()
            .from(products)
            .where(
              and(
                eq(products.restaurantId, restaurant.id),
                eq(products.isActive, true)
              )
            )
            .orderBy(asc(products.sortOrder)),
          db
            .select()
            .from(campaigns)
            .where(
              and(
                eq(campaigns.restaurantId, restaurant.id),
                eq(campaigns.isActive, true)
              )
            )
            .limit(2),
        ]);

      // Ürün tavsiye ilişkileri
      const recommendations = await db
        .select({
          productId: productRecommendations.productId,
          recommendedProductId: productRecommendations.recommendedProductId,
          sortOrder: productRecommendations.sortOrder,
        })
        .from(productRecommendations)
        .where(
          and(
            eq(productRecommendations.restaurantId, restaurant.id),
            eq(productRecommendations.isActive, true)
          )
        )
        .orderBy(asc(productRecommendations.sortOrder));

      // Tavsiye map: productId → recommendedProductId[]
      const recommendationMap: Record<string, string[]> = {};
      for (const r of recommendations) {
        if (!recommendationMap[r.productId]) {
          recommendationMap[r.productId] = [];
        }
        recommendationMap[r.productId].push(r.recommendedProductId);
      }

      return {
        restaurant,
        settings,
        website,
        categories: allCategories,
        products: allProducts,
        recommendationMap,
        campaigns: activeCampaigns,
      };
    },
    300
  );
}

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const data = await getMenuData(restaurantSlug);
  if (!data) return { title: "Menü bulunamadı" };

  const { restaurant, settings } = data;
  return {
    title: `${restaurant.name} — Menü`,
    description: settings?.description ?? `${restaurant.name} dijital menüsü`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${restaurant.name} — Menü`,
      images: settings?.logoUrl ? [settings.logoUrl] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────
// Server Component — veriyi client'a prop olarak geçir
// ─────────────────────────────────────────────────────────

export default async function MenuPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const data = await getMenuData(restaurantSlug);
  if (!data) notFound();

  return (
    <QRMenuClient
      restaurant={data.restaurant}
      settings={data.settings ?? null}
      website={data.website ?? null}
      categories={data.categories}
      products={data.products}
      recommendationMap={data.recommendationMap}
      campaigns={data.campaigns}
    />
  );
}
