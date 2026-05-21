// src/app/(dashboard)/dashboard/domains/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { restaurantMembers, restaurants, restaurantDomains } from "@/db/schema";
import { eq } from "drizzle-orm";
import DomainsClient from "./DomainsClient";

export default async function DomainsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();

  const membership = await db
    .select({ restaurantId: restaurantMembers.restaurantId })
    .from(restaurantMembers)
    .where(eq(restaurantMembers.userId, session.user.id))
    .limit(1)
    .get();

  if (!membership) redirect("/dashboard");

  const restaurant = await db
    .select({ id: restaurants.id, slug: restaurants.slug })
    .from(restaurants)
    .where(eq(restaurants.id, membership.restaurantId))
    .get();

  if (!restaurant) redirect("/dashboard");

  const domains = await db
    .select()
    .from(restaurantDomains)
    .where(eq(restaurantDomains.restaurantId, restaurant.id));

  return (
    <DomainsClient
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
      initialDomains={domains}
    />
  );
}
