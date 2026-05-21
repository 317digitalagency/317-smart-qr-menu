// src/db/schema.ts
// Drizzle ORM schema — menu.org.tr SaaS MVP
// Timestamp standardı: Unix milliseconds (Date.now())
// Fiyat standardı: integer kuruş (250 ₺ = 25000)

import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ═══════════════════════════════════════════════════════════
// AUTH & USERS
// ═══════════════════════════════════════════════════════════

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // cuid2
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(), // PBKDF2 via SubtleCrypto
    name: text("name").notNull(),
    role: text("role", { enum: ["platform_admin", "user"] })
      .default("user")
      .notNull(),
    createdAt: integer("created_at").notNull(), // Unix ms
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // crypto.randomUUID()
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(), // Unix ms
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(t.expiresAt),
  })
);

// ═══════════════════════════════════════════════════════════
// RESTAURANTS & MULTI-TENANT
// ═══════════════════════════════════════════════════════════

export const restaurants = sqliteTable(
  "restaurants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("restaurants_slug_idx").on(t.slug),
  })
);

// Multi-tenant: bir restorana birden fazla kullanıcı bağlanabilir
export const restaurantMembers = sqliteTable(
  "restaurant_members",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "manager", "editor", "viewer"] }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    userRestIdx: index("restaurant_members_user_rest_idx").on(
      t.userId,
      t.restaurantId
    ),
    restIdx: index("restaurant_members_rest_idx").on(t.restaurantId),
  })
);

// Custom domain mapping: diamore.com → diamore slug
export const restaurantDomains = sqliteTable(
  "restaurant_domains",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    domain: text("domain").notNull().unique(),
    // "menu.org.tr/diamore" | "diamore.com" | "menu.diamore.com"
    type: text("type", { enum: ["root", "subdomain", "system_slug"] }).notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .default(false)
      .notNull(),
    isVerified: integer("is_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    verificationToken: text("verification_token"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    domainIdx: uniqueIndex("restaurant_domains_domain_idx").on(t.domain),
    restaurantIdIdx: index("restaurant_domains_restaurant_id_idx").on(
      t.restaurantId
    ),
  })
);

// ═══════════════════════════════════════════════════════════
// RESTAURANT SETTINGS
// ═══════════════════════════════════════════════════════════

export const restaurantSettings = sqliteTable("restaurant_settings", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  coverVideoUrl: text("cover_video_url"),
  description: text("description"),
  address: text("address"),
  phone: text("phone"), // "+905551234567"
  whatsapp: text("whatsapp"), // "905551234567" (ülke kodu dahil, + yok)
  instagram: text("instagram"), // "diamore" (sadece handle)
  googleMapsUrl: text("google_maps_url"),
  googleReviewUrl: text("google_review_url"),
  // JSON: {"mon":"09:00-22:00","tue":"09:00-22:00",...,"sun":"closed"}
  workingHoursJson: text("working_hours_json"),
  updatedAt: integer("updated_at").notNull(),
});

export const websiteSettings = sqliteTable("website_settings", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  heroTitle: text("hero_title").notNull(),
  heroDescription: text("hero_description"),
  primaryColor: text("primary_color").default("#c5a880").notNull(),
  theme: text("theme", { enum: ["light", "dark", "elegant", "minimal"] })
    .default("elegant")
    .notNull(),
  isLive: integer("is_live", { mode: "boolean" }).default(true).notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ═══════════════════════════════════════════════════════════
// MENU: KATEGORİ & ÜRÜN
// ═══════════════════════════════════════════════════════════

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    showInMenu: integer("show_in_menu", { mode: "boolean" })
      .default(true)
      .notNull(),
    coverUrl: text("cover_url"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    restaurantIdIdx: index("categories_restaurant_id_idx").on(t.restaurantId),
  })
);

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description"),
    // Fiyat kuruş cinsinden: 250 ₺ = 25000
    priceKurus: integer("price_kurus").notNull(),
    discountedPriceKurus: integer("discounted_price_kurus"),
    imageUrl: text("image_url"),
    // JSON: ["Popüler", "Yeni", "Vejetaryen"]
    tagsJson: text("tags_json"),
    // JSON: ["Gluten", "Süt", "Yumurta"]
    allergensJson: text("allergens_json"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .default(false)
      .notNull(),
    isPopular: integer("is_popular", { mode: "boolean" })
      .default(false)
      .notNull(),
    isNew: integer("is_new", { mode: "boolean" }).default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    restaurantIdIdx: index("products_restaurant_id_idx").on(t.restaurantId),
    categoryIdIdx: index("products_category_id_idx").on(t.categoryId),
  })
);

// ═══════════════════════════════════════════════════════════
// CROSS-SELLING: TAVSİYE ÜRÜNLER
// ═══════════════════════════════════════════════════════════

export const productRecommendations = sqliteTable(
  "product_recommendations",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    recommendedProductId: text("recommended_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    productIdIdx: index("product_recommendations_product_id_idx").on(
      t.productId
    ),
  })
);

// ═══════════════════════════════════════════════════════════
// KAMPANYALAR
// ═══════════════════════════════════════════════════════════

export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    startDate: integer("start_date"), // Unix ms, null = hemen aktif
    endDate: integer("end_date"), // Unix ms, null = süresiz
    ctaType: text("cta_type", {
      enum: [
        "whatsapp",
        "checkout",
        "menu",
        "instagram",
        "google_review",
        "directions",
      ],
    }).notNull(),
    ctaValue: text("cta_value"), // WhatsApp mesajı, link, kupon kodu vb.
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    restaurantIdIdx: index("campaigns_restaurant_id_idx").on(t.restaurantId),
  })
);

export const campaignProducts = sqliteTable("campaign_products", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
});

// ═══════════════════════════════════════════════════════════
// QR KODLAR
// ═══════════════════════════════════════════════════════════

export const qrCodes = sqliteTable("qr_codes", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Masa 5 Kartı", "Vitrin Afişi"
  qrType: text("qr_type", {
    enum: ["menu", "campaign", "review", "custom"],
  }).notNull(),
  targetUrl: text("target_url").notNull(),
  sourceKey: text("source_key"), // "table_5", "window_sticker"
  utmSource: text("utm_source").default("qr"),
  utmMedium: text("utm_medium"), // "table_card", "sticker", "instagram_bio"
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  scanCount: integer("scan_count").default(0).notNull(),
  lastScannedAt: integer("last_scanned_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ═══════════════════════════════════════════════════════════
// ANALİTİK
// ═══════════════════════════════════════════════════════════

export const ALLOWED_EVENT_TYPES = [
  "menu_view",
  "category_view",
  "product_view",
  "campaign_view",
  "recommendation_view",
  "product_click",
  "campaign_click",
  "recommendation_click",
  "google_review_click",
  "whatsapp_click",
  "instagram_click",
  "directions_click",
  "phone_click",
  "qr_scan",
] as const;

export type AnalyticsEventType = (typeof ALLOWED_EVENT_TYPES)[number];

export const ALLOWED_ENTITY_TYPES = [
  "category",
  "product",
  "campaign",
  "recommendation",
  "qr",
  "general",
] as const;

export type AnalyticsEntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // AnalyticsEventType
    entityType: text("entity_type").notNull(), // AnalyticsEntityType
    entityId: text("entity_id"),
    sourcePage: text("source_page").notNull(), // "home"|"menu"|"campaigns"|"contact"
    deviceType: text("device_type").notNull(), // "mobile"|"tablet"|"desktop"
    referrer: text("referrer"),
    sessionId: text("session_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    restaurantIdIdx: index("analytics_events_restaurant_id_idx").on(
      t.restaurantId
    ),
    createdAtIdx: index("analytics_events_created_at_idx").on(t.createdAt),
    eventTypeIdx: index("analytics_events_event_type_idx").on(t.eventType),
  })
);

// Hızlı dashboard kartları için ön-toplanmış günlük metrikler
export const dailyAnalytics = sqliteTable(
  "daily_analytics",
  {
    id: text("id").primaryKey(), // "{restaurantId}_{YYYY-MM-DD}"
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    menuViews: integer("menu_views").default(0).notNull(),
    googleReviewClicks: integer("google_review_clicks").default(0).notNull(),
    campaignClicks: integer("campaign_clicks").default(0).notNull(),
    whatsappClicks: integer("whatsapp_clicks").default(0).notNull(),
    instagramClicks: integer("instagram_clicks").default(0).notNull(),
    directionsClicks: integer("directions_clicks").default(0).notNull(),
    phoneClicks: integer("phone_clicks").default(0).notNull(),
    qrScans: integer("qr_scans").default(0).notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    restDateIdx: index("daily_analytics_restaurant_date_idx").on(
      t.restaurantId,
      t.date
    ),
  })
);

// Ürün/kategori/kampanya bazlı günlük rapor
export const dailyEntityAnalytics = sqliteTable(
  "daily_entity_analytics",
  {
    id: text("id").primaryKey(), // "{restaurantId}_{YYYY-MM-DD}_{entityType}_{entityId}"
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    entityType: text("entity_type").notNull(), // "product"|"category"|"campaign"|"recommendation"|"qr"
    entityId: text("entity_id").notNull(),
    views: integer("views").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    restDateEntityIdx: index(
      "daily_entity_analytics_rest_date_entity_idx"
    ).on(t.restaurantId, t.date, t.entityType),
  })
);
