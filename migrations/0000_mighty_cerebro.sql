CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`event_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`source_page` text NOT NULL,
	`device_type` text NOT NULL,
	`referrer` text,
	`session_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analytics_events_restaurant_id_idx` ON `analytics_events` (`restaurant_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_event_type_idx` ON `analytics_events` (`event_type`);--> statement-breakpoint
CREATE TABLE `campaign_products` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`product_id` text NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text,
	`start_date` integer,
	`end_date` integer,
	`cta_type` text NOT NULL,
	`cta_value` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `campaigns_restaurant_id_idx` ON `campaigns` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`show_in_menu` integer DEFAULT true NOT NULL,
	`cover_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_restaurant_id_idx` ON `categories` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `daily_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`date` text NOT NULL,
	`menu_views` integer DEFAULT 0 NOT NULL,
	`google_review_clicks` integer DEFAULT 0 NOT NULL,
	`campaign_clicks` integer DEFAULT 0 NOT NULL,
	`whatsapp_clicks` integer DEFAULT 0 NOT NULL,
	`instagram_clicks` integer DEFAULT 0 NOT NULL,
	`directions_clicks` integer DEFAULT 0 NOT NULL,
	`phone_clicks` integer DEFAULT 0 NOT NULL,
	`qr_scans` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_analytics_restaurant_date_idx` ON `daily_analytics` (`restaurant_id`,`date`);--> statement-breakpoint
CREATE TABLE `daily_entity_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`date` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_entity_analytics_rest_date_entity_idx` ON `daily_entity_analytics` (`restaurant_id`,`date`,`entity_type`);--> statement-breakpoint
CREATE TABLE `product_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`product_id` text NOT NULL,
	`recommended_product_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recommended_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_recommendations_product_id_idx` ON `product_recommendations` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`long_description` text,
	`price_kurus` integer NOT NULL,
	`discounted_price_kurus` integer,
	`image_url` text,
	`tags_json` text,
	`allergens_json` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_popular` integer DEFAULT false NOT NULL,
	`is_new` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_restaurant_id_idx` ON `products` (`restaurant_id`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`name` text NOT NULL,
	`qr_type` text NOT NULL,
	`target_url` text NOT NULL,
	`source_key` text,
	`utm_source` text DEFAULT 'qr',
	`utm_medium` text,
	`is_active` integer DEFAULT true NOT NULL,
	`scan_count` integer DEFAULT 0 NOT NULL,
	`last_scanned_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `restaurant_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`domain` text NOT NULL,
	`type` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`verification_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_domains_domain_unique` ON `restaurant_domains` (`domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_domains_domain_idx` ON `restaurant_domains` (`domain`);--> statement-breakpoint
CREATE INDEX `restaurant_domains_restaurant_id_idx` ON `restaurant_domains` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurant_members` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `restaurant_members_user_rest_idx` ON `restaurant_members` (`user_id`,`restaurant_id`);--> statement-breakpoint
CREATE INDEX `restaurant_members_rest_idx` ON `restaurant_members` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurant_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`logo_url` text,
	`cover_url` text,
	`cover_video_url` text,
	`description` text,
	`address` text,
	`phone` text,
	`whatsapp` text,
	`instagram` text,
	`google_maps_url` text,
	`google_review_url` text,
	`working_hours_json` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_settings_restaurant_id_unique` ON `restaurant_settings` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_unique` ON `restaurants` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_idx` ON `restaurants` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `website_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`hero_title` text NOT NULL,
	`hero_description` text,
	`primary_color` text DEFAULT '#c5a880' NOT NULL,
	`theme` text DEFAULT 'elegant' NOT NULL,
	`is_live` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `website_settings_restaurant_id_unique` ON `website_settings` (`restaurant_id`);