-- migrations/seed_local.sql
-- Lokal test verisi — Gerçek kolon adları doğrulandı (snake_case)

-- Önce var olanları temizle (idempotent)
DELETE FROM daily_entity_analytics WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM daily_analytics WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM product_recommendations WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM campaigns WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM products WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM categories WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM website_settings WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM restaurant_settings WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM restaurant_members WHERE restaurant_id = 'rest_seed_demo_001';
DELETE FROM restaurants WHERE id = 'rest_seed_demo_001';
DELETE FROM sessions WHERE user_id = 'user_seed_admin_001';
DELETE FROM users WHERE id = 'user_seed_admin_001';

-- Users
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES 
('user_seed_admin_001', 'admin@menu.org.tr', 'SEED_PLACEHOLDER', 'Demo Admin', 'restaurant_admin', 1748000000000, 1748000000000);

-- Restaurant
INSERT INTO restaurants (id, name, slug, is_active, created_at, updated_at) VALUES 
('rest_seed_demo_001', 'Café Miray', 'cafe-miray', 1, 1748000000000, 1748000000000);

-- Members
INSERT INTO restaurant_members (id, restaurant_id, user_id, role, created_at) VALUES 
('memb_seed_001', 'rest_seed_demo_001', 'user_seed_admin_001', 'owner', 1748000000000);

-- Restaurant Settings
INSERT INTO restaurant_settings (id, restaurant_id, description, address, phone, whatsapp, instagram, google_maps_url, google_review_url, updated_at) VALUES 
('rsett_seed_001', 'rest_seed_demo_001', 'Şehrin kalbinde, sıcak bir atmosferde özel kahveler ve ev yapımı tatlılar.', 'Bağcılar Mah. Kahve Sk. No:12, İstanbul', '+905321234567', '905321234567', 'cafemiray', 'https://maps.google.com/?q=Cafe+Miray+Istanbul', 'https://g.page/r/CafeMirayDemo/review', 1748000000000);

-- Website Settings (kolonlar: id, restaurant_id, hero_title, hero_description, primary_color, theme, is_live, updated_at)
INSERT INTO website_settings (id, restaurant_id, hero_title, hero_description, primary_color, theme, is_live, updated_at) VALUES 
('wsett_seed_001', 'rest_seed_demo_001', 'Şehrin En İyi Kahvesi', 'Özel harmanlar, ev yapımı tatlılar ve sıcak atmosfer.', '#c5a880', 'minimal', 1, 1748000000000);

-- Categories
INSERT INTO categories (id, restaurant_id, name, description, sort_order, is_active, show_in_menu, created_at, updated_at) VALUES 
('cat_seed_sicak_001', 'rest_seed_demo_001', 'Sıcak İçecekler', 'Espresso bazlı kahveler ve çaylar', 0, 1, 1, 1748000000000, 1748000000000),
('cat_seed_soguk_001', 'rest_seed_demo_001', 'Soğuk İçecekler', 'Cold brew, buzlu kahve ve meyveli içecekler', 1, 1, 1, 1748000000000, 1748000000000),
('cat_seed_tatli_001', 'rest_seed_demo_001', 'Tatlılar', 'Ev yapımı kek ve kurabiyeler', 2, 1, 1, 1748000000000, 1748000000000);

-- Products
INSERT INTO products (id, restaurant_id, category_id, name, short_description, long_description, price_kurus, is_active, is_popular, is_new, is_featured, sort_order, created_at, updated_at) VALUES 
('prod_seed_001', 'rest_seed_demo_001', 'cat_seed_sicak_001', 'Latte', 'Espresso ve buharla ısıtılmış süt', 'Çift shot espresso üzerine ince bir süt köpüğü ile hazırlanan klasik latte.', 8000, 1, 1, 0, 1, 0, 1748000000000, 1748000000000),
('prod_seed_002', 'rest_seed_demo_001', 'cat_seed_sicak_001', 'Türk Kahvesi', 'Geleneksel köpüklü Türk kahvesi', 'Özel harmanlanmış Türk kahvesi. Yanında lokum ile servis edilir.', 5000, 1, 1, 0, 0, 1, 1748000000000, 1748000000000),
('prod_seed_003', 'rest_seed_demo_001', 'cat_seed_soguk_001', 'Cold Brew', '12 saat soğuk demleme', 'Seçilmiş kahve çekirdeklerinden 12 saat soğuk demleme yöntemiyle hazırlanan serinletici içecek.', 9000, 1, 0, 1, 0, 0, 1748000000000, 1748000000000),
('prod_seed_004', 'rest_seed_demo_001', 'cat_seed_tatli_001', 'Cheesecake', 'Ev yapımı New York cheesecake', 'Günlük hazırlanan kremalı cheesecake. Sezonun taze meyveleriyle servis edilir.', 12000, 1, 1, 0, 0, 0, 1748000000000, 1748000000000),
('prod_seed_005', 'rest_seed_demo_001', 'cat_seed_tatli_001', 'Brownie', 'Çikolatalı ıslak brownie', 'Bitter çikolata ve cevizle hazırlanan nemli brownie.', 8500, 1, 0, 0, 0, 1, 1748000000000, 1748000000000);

-- Recommendations
INSERT INTO product_recommendations (id, restaurant_id, product_id, recommended_product_id, sort_order, is_active, created_at) VALUES 
('rec_seed_001', 'rest_seed_demo_001', 'prod_seed_001', 'prod_seed_004', 0, 1, 1748000000000),
('rec_seed_002', 'rest_seed_demo_001', 'prod_seed_001', 'prod_seed_005', 1, 1, 1748000000000),
('rec_seed_003', 'rest_seed_demo_001', 'prod_seed_002', 'prod_seed_004', 0, 1, 1748000000000),
('rec_seed_004', 'rest_seed_demo_001', 'prod_seed_003', 'prod_seed_005', 0, 1, 1748000000000);

-- Campaign
INSERT INTO campaigns (id, restaurant_id, title, description, cta_type, cta_value, is_active, created_at, updated_at) VALUES 
('camp_seed_001', 'rest_seed_demo_001', 'Hoş Geldin İndirimi 🎉', 'İlk siparişinizde tüm tatlılarda %15 indirim! Kodu gösterin.', 'whatsapp', 'Merhaba, hoş geldin kampanyasından yararlanmak istiyorum.', 1, 1748000000000, 1748000000000);

-- Daily Analytics (kolonlar: id, restaurant_id, date, menu_views, google_review_clicks, campaign_clicks, whatsapp_clicks, instagram_clicks, directions_clicks, phone_clicks, qr_scans, updated_at)
INSERT INTO daily_analytics (id, restaurant_id, date, menu_views, qr_scans, google_review_clicks, campaign_clicks, whatsapp_clicks, instagram_clicks, directions_clicks, phone_clicks, updated_at) VALUES 
('da_seed_001', 'rest_seed_demo_001', date('now'), 42, 18, 7, 12, 5, 3, 4, 0, 1748000000000),
('da_seed_002', 'rest_seed_demo_001', date('now', '-1 day'), 38, 22, 5, 9, 8, 2, 3, 0, 1748000000000),
('da_seed_003', 'rest_seed_demo_001', date('now', '-2 days'), 55, 30, 10, 15, 7, 5, 6, 0, 1748000000000),
('da_seed_004', 'rest_seed_demo_001', date('now', '-3 days'), 31, 14, 4, 8, 3, 1, 2, 0, 1748000000000),
('da_seed_005', 'rest_seed_demo_001', date('now', '-4 days'), 48, 25, 8, 11, 6, 4, 5, 0, 1748000000000),
('da_seed_006', 'rest_seed_demo_001', date('now', '-5 days'), 29, 11, 3, 6, 2, 1, 1, 0, 1748000000000),
('da_seed_007', 'rest_seed_demo_001', date('now', '-6 days'), 62, 35, 12, 18, 9, 6, 8, 0, 1748000000000);

-- Daily Entity Analytics (kolonlar: id, restaurant_id, date, entity_type, entity_id, views, clicks, updated_at)
INSERT INTO daily_entity_analytics (id, restaurant_id, date, entity_type, entity_id, views, clicks, updated_at) VALUES 
('dea_seed_001', 'rest_seed_demo_001', date('now'), 'product', 'prod_seed_001', 28, 15, 1748000000000),
('dea_seed_002', 'rest_seed_demo_001', date('now'), 'product', 'prod_seed_004', 21, 9, 1748000000000),
('dea_seed_003', 'rest_seed_demo_001', date('now'), 'product', 'prod_seed_003', 18, 7, 1748000000000),
('dea_seed_004', 'rest_seed_demo_001', date('now'), 'product', 'prod_seed_002', 14, 6, 1748000000000),
('dea_seed_005', 'rest_seed_demo_001', date('now'), 'product', 'prod_seed_005', 11, 4, 1748000000000),
('dea_seed_006', 'rest_seed_demo_001', date('now'), 'category', 'cat_seed_sicak_001', 42, 0, 1748000000000),
('dea_seed_007', 'rest_seed_demo_001', date('now'), 'category', 'cat_seed_tatli_001', 33, 0, 1748000000000),
('dea_seed_008', 'rest_seed_demo_001', date('now'), 'category', 'cat_seed_soguk_001', 22, 0, 1748000000000),
('dea_seed_009', 'rest_seed_demo_001', date('now'), 'campaign', 'camp_seed_001', 12, 8, 1748000000000),
('dea_seed_010', 'rest_seed_demo_001', date('now', '-1 day'), 'product', 'prod_seed_001', 22, 12, 1748000000000),
('dea_seed_011', 'rest_seed_demo_001', date('now', '-1 day'), 'product', 'prod_seed_004', 17, 7, 1748000000000),
('dea_seed_012', 'rest_seed_demo_001', date('now', '-2 days'), 'product', 'prod_seed_001', 31, 18, 1748000000000),
('dea_seed_013', 'rest_seed_demo_001', date('now', '-2 days'), 'product', 'prod_seed_003', 25, 10, 1748000000000),
('dea_seed_014', 'rest_seed_demo_001', date('now', '-6 days'), 'product', 'prod_seed_001', 19, 8, 1748000000000);
