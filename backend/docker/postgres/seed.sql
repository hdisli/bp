-- ============================================
-- PRODUCT PLATFORM - SEED DATA
-- ============================================
-- Idempotent: Kann mehrfach hintereinander laufen
-- Created: 2025-01-27
-- Contains: 5 categories, 15 products, 40 images
-- ============================================
-- Hinweis: Tabellen werden durch TypeORM-Migrations erstellt.
-- Diese Datei läuft NACH dem App-Start (Migrations) oder
-- beim ersten Docker-Init wenn Tabellen bereits existieren.
-- ============================================

-- Prüfe ob Tabellen existieren, bevor Seeds laufen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) THEN
    RAISE NOTICE 'Tabellen existieren noch nicht – Seeds werden übersprungen (TypeORM-Migrations laufen beim App-Start)';
    RETURN;
  END IF;

  -- ============================================
  -- INSERT CATEGORIES (idempotent)
  -- ============================================
  INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
    (1, 'Electronics', 'Elektronische Geräte und Zubehör', NOW(), NOW()),
    (2, 'Beauty', 'Kosmetik und Hautpflege', NOW(), NOW()),
    (3, 'Food & Beverages', 'Lebensmittel und Getränke', NOW(), NOW()),
    (4, 'Sports & Outdoors', 'Sport- und Freizeitausrüstung', NOW(), NOW()),
    (5, 'Home & Garden', 'Haushalt und Garten', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Reset sequence nach expliziten IDs
  PERFORM setval('categories_id_seq', GREATEST((SELECT MAX(id) FROM categories), 5));

  -- ============================================
  -- INSERT PRODUCTS (idempotent)
  -- ============================================
  INSERT INTO products (id, name, brand, description, category_id, rating, review_count, is_featured, created_at, updated_at) VALUES
    -- Electronics (3 products)
    (1, 'iPhone 15 Pro', 'Apple', 'Premium Smartphone mit ProMotion Display und A17 Pro Chip', 1, 4.8, 2847, true, NOW(), NOW()),
    (2, 'Samsung Galaxy S24', 'Samsung', 'Flaggschiff Android Smartphone mit AI-Features', 1, 4.6, 1923, true, NOW(), NOW()),
    (3, 'Sony WH-1000XM5', 'Sony', 'Premium Kopfhörer mit aktiver Geräuschunterdrückung', 1, 4.9, 3156, true, NOW(), NOW()),
    -- Beauty (3 products)
    (4, 'Revitalift Nachtcreme', 'L''Oréal', 'Anti-Aging Nachtpflege mit Retinol und Hyaluronsäure', 2, 4.4, 892, false, NOW(), NOW()),
    (5, 'Hydra-Boost Serum', 'Neutrogena', 'Feuchtigkeitsserum mit Hyaluronsäure für trockene Haut', 2, 4.5, 1245, true, NOW(), NOW()),
    (6, 'Lip Balm SPF 15', 'Burt''s Bees', 'Natürlicher Lippenbalsam mit Sonnenschutz und Bienenwachs', 2, 4.7, 2103, false, NOW(), NOW()),
    -- Food & Beverages (3 products)
    (7, 'Espresso Kaffeebohnen', 'Illy', 'Italienische Premium-Kaffeebohnen mit intensivem Aroma', 3, 4.6, 567, false, NOW(), NOW()),
    (8, 'Bio Olivenöl', 'Gallo', 'Natives Olivenöl extra aus biologischem Anbau in Spanien', 3, 4.3, 234, false, NOW(), NOW()),
    (9, 'Gouda Käse', 'Gouda Cheese Co.', 'Reifer holländischer Hartkäse mit cremiger Textur', 3, 4.2, 156, false, NOW(), NOW()),
    -- Sports & Outdoors (3 products)
    (10, 'Laufschuhe Air Max', 'Nike', 'Komfortable Laufschuhe mit Air-Cushioning für lange Distanzen', 4, 4.7, 1876, true, NOW(), NOW()),
    (11, 'Yoga-Matte Premium', 'Manduka', 'Rutschfeste Yoga-Matte aus Naturkautschuk, 6mm dick', 4, 4.8, 943, false, NOW(), NOW()),
    (12, 'Fahrradhelm Safety', 'ABUS', 'Zertifizierter Fahrradhelm mit LED-Licht und verstellbarer Passform', 4, 4.5, 412, false, NOW(), NOW()),
    -- Home & Garden (3 products)
    (13, 'LED Deckenleuchte', 'Philips', 'Dimmbare LED-Leuchte mit Smart-Home-Integration und Farbwechsel', 5, 4.4, 678, true, NOW(), NOW()),
    (14, 'Edelstahl Topfset', 'WMF', '5-teiliges Edelstahl-Kochgeschirr-Set für Induktion geeignet', 5, 4.6, 1234, false, NOW(), NOW()),
    (15, 'Kaffeefilter Keramik', 'Melitta', 'Wiederverwendbarer Kaffeefilter aus Keramik für Pour-Over', 5, 4.1, 89, false, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Reset sequence nach expliziten IDs
  PERFORM setval('products_id_seq', GREATEST((SELECT MAX(id) FROM products), 15));

  -- ============================================
  -- INSERT PRODUCT IMAGES (idempotent)
  -- ============================================
  INSERT INTO product_images (id, product_id, path, is_primary, display_order, created_at) VALUES
    -- Product 1: iPhone 15 Pro (3 images)
    (1, 1, '/uploads/product-1-main.jpg', true, 0, NOW()),
    (2, 1, '/uploads/product-1-side.jpg', false, 1, NOW()),
    (3, 1, '/uploads/product-1-back.jpg', false, 2, NOW()),
    -- Product 2: Samsung Galaxy S24 (3 images)
    (4, 2, '/uploads/product-2-main.jpg', true, 0, NOW()),
    (5, 2, '/uploads/product-2-side.jpg', false, 1, NOW()),
    (6, 2, '/uploads/product-2-specs.jpg', false, 2, NOW()),
    -- Product 3: Sony WH-1000XM5 (3 images)
    (7, 3, '/uploads/product-3-main.jpg', true, 0, NOW()),
    (8, 3, '/uploads/product-3-side.jpg', false, 1, NOW()),
    (9, 3, '/uploads/product-3-detail.jpg', false, 2, NOW()),
    -- Product 4: Revitalift Nachtcreme (3 images)
    (10, 4, '/uploads/product-4-main.jpg', true, 0, NOW()),
    (11, 4, '/uploads/product-4-jar.jpg', false, 1, NOW()),
    (12, 4, '/uploads/product-4-texture.jpg', false, 2, NOW()),
    -- Product 5: Hydra-Boost Serum (3 images)
    (13, 5, '/uploads/product-5-main.jpg', true, 0, NOW()),
    (14, 5, '/uploads/product-5-bottle.jpg', false, 1, NOW()),
    (15, 5, '/uploads/product-5-detail.jpg', false, 2, NOW()),
    -- Product 6: Lip Balm SPF 15 (3 images)
    (16, 6, '/uploads/product-6-main.jpg', true, 0, NOW()),
    (17, 6, '/uploads/product-6-stick.jpg', false, 1, NOW()),
    (18, 6, '/uploads/product-6-texture.jpg', false, 2, NOW()),
    -- Product 7: Espresso Kaffeebohnen (3 images)
    (19, 7, '/uploads/product-7-main.jpg', true, 0, NOW()),
    (20, 7, '/uploads/product-7-bag.jpg', false, 1, NOW()),
    (21, 7, '/uploads/product-7-beans.jpg', false, 2, NOW()),
    -- Product 8: Bio Olivenöl (3 images)
    (22, 8, '/uploads/product-8-main.jpg', true, 0, NOW()),
    (23, 8, '/uploads/product-8-bottle.jpg', false, 1, NOW()),
    (24, 8, '/uploads/product-8-detail.jpg', false, 2, NOW()),
    -- Product 9: Gouda Käse (3 images)
    (25, 9, '/uploads/product-9-main.jpg', true, 0, NOW()),
    (26, 9, '/uploads/product-9-cut.jpg', false, 1, NOW()),
    (27, 9, '/uploads/product-9-texture.jpg', false, 2, NOW()),
    -- Product 10: Laufschuhe Air Max (3 images)
    (28, 10, '/uploads/product-10-main.jpg', true, 0, NOW()),
    (29, 10, '/uploads/product-10-side.jpg', false, 1, NOW()),
    (30, 10, '/uploads/product-10-sole.jpg', false, 2, NOW()),
    -- Product 11: Yoga-Matte Premium (2 images)
    (31, 11, '/uploads/product-11-main.jpg', true, 0, NOW()),
    (32, 11, '/uploads/product-11-rolled.jpg', false, 1, NOW()),
    -- Product 12: Fahrradhelm Safety (2 images)
    (33, 12, '/uploads/product-12-main.jpg', true, 0, NOW()),
    (34, 12, '/uploads/product-12-side.jpg', false, 1, NOW()),
    -- Product 13: LED Deckenleuchte (2 images)
    (35, 13, '/uploads/product-13-main.jpg', true, 0, NOW()),
    (36, 13, '/uploads/product-13-mounted.jpg', false, 1, NOW()),
    -- Product 14: Edelstahl Topfset (2 images)
    (37, 14, '/uploads/product-14-main.jpg', true, 0, NOW()),
    (38, 14, '/uploads/product-14-stacked.jpg', false, 1, NOW()),
    -- Product 15: Kaffeefilter Keramik (2 images)
    (39, 15, '/uploads/product-15-main.jpg', true, 0, NOW()),
    (40, 15, '/uploads/product-15-filter.jpg', false, 1, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Reset sequence nach expliziten IDs
  PERFORM setval('product_images_id_seq', GREATEST((SELECT MAX(id) FROM product_images), 40));

END $$;
