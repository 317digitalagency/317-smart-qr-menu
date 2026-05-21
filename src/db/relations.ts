// src/db/relations.ts
// Drizzle ORM relation definitions — gerekli db.query API için

import { relations } from "drizzle-orm";
import * as s from "./schema";

export const usersRelations = relations(s.users, ({ many }) => ({
  sessions: many(s.sessions),
  restaurantMembers: many(s.restaurantMembers),
}));

export const sessionsRelations = relations(s.sessions, ({ one }) => ({
  user: one(s.users, {
    fields: [s.sessions.userId],
    references: [s.users.id],
  }),
}));

export const restaurantsRelations = relations(
  s.restaurants,
  ({ one, many }) => ({
    members: many(s.restaurantMembers),
    domains: many(s.restaurantDomains),
    settings: one(s.restaurantSettings, {
      fields: [s.restaurants.id],
      references: [s.restaurantSettings.restaurantId],
    }),
    websiteSettings: one(s.websiteSettings, {
      fields: [s.restaurants.id],
      references: [s.websiteSettings.restaurantId],
    }),
    categories: many(s.categories),
    products: many(s.products),
    campaigns: many(s.campaigns),
    qrCodes: many(s.qrCodes),
  })
);

export const restaurantMembersRelations = relations(
  s.restaurantMembers,
  ({ one }) => ({
    restaurant: one(s.restaurants, {
      fields: [s.restaurantMembers.restaurantId],
      references: [s.restaurants.id],
    }),
    user: one(s.users, {
      fields: [s.restaurantMembers.userId],
      references: [s.users.id],
    }),
  })
);

export const restaurantDomainsRelations = relations(
  s.restaurantDomains,
  ({ one }) => ({
    restaurant: one(s.restaurants, {
      fields: [s.restaurantDomains.restaurantId],
      references: [s.restaurants.id],
    }),
  })
);

export const restaurantSettingsRelations = relations(
  s.restaurantSettings,
  ({ one }) => ({
    restaurant: one(s.restaurants, {
      fields: [s.restaurantSettings.restaurantId],
      references: [s.restaurants.id],
    }),
  })
);

export const websiteSettingsRelations = relations(
  s.websiteSettings,
  ({ one }) => ({
    restaurant: one(s.restaurants, {
      fields: [s.websiteSettings.restaurantId],
      references: [s.restaurants.id],
    }),
  })
);

export const categoriesRelations = relations(s.categories, ({ one, many }) => ({
  restaurant: one(s.restaurants, {
    fields: [s.categories.restaurantId],
    references: [s.restaurants.id],
  }),
  products: many(s.products),
}));

export const productsRelations = relations(s.products, ({ one, many }) => ({
  restaurant: one(s.restaurants, {
    fields: [s.products.restaurantId],
    references: [s.restaurants.id],
  }),
  category: one(s.categories, {
    fields: [s.products.categoryId],
    references: [s.categories.id],
  }),
  recommendations: many(s.productRecommendations, {
    relationName: "sourceProduct",
  }),
  recommendedBy: many(s.productRecommendations, {
    relationName: "recommendedProduct",
  }),
  campaignProducts: many(s.campaignProducts),
}));

export const productRecommendationsRelations = relations(
  s.productRecommendations,
  ({ one }) => ({
    product: one(s.products, {
      fields: [s.productRecommendations.productId],
      references: [s.products.id],
      relationName: "sourceProduct",
    }),
    recommendedProduct: one(s.products, {
      fields: [s.productRecommendations.recommendedProductId],
      references: [s.products.id],
      relationName: "recommendedProduct",
    }),
  })
);

export const campaignsRelations = relations(s.campaigns, ({ one, many }) => ({
  restaurant: one(s.restaurants, {
    fields: [s.campaigns.restaurantId],
    references: [s.restaurants.id],
  }),
  campaignProducts: many(s.campaignProducts),
}));

export const campaignProductsRelations = relations(
  s.campaignProducts,
  ({ one }) => ({
    campaign: one(s.campaigns, {
      fields: [s.campaignProducts.campaignId],
      references: [s.campaigns.id],
    }),
    product: one(s.products, {
      fields: [s.campaignProducts.productId],
      references: [s.products.id],
    }),
  })
);

export const qrCodesRelations = relations(s.qrCodes, ({ one }) => ({
  restaurant: one(s.restaurants, {
    fields: [s.qrCodes.restaurantId],
    references: [s.restaurants.id],
  }),
}));
