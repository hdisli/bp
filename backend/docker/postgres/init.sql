-- ============================================
-- PRODUCT PLATFORM DATABASE SCHEMA
-- ============================================
-- Idempotent: Can be run multiple times without errors
-- Created: 2025-01-27
-- Version: 1.0
-- PostgreSQL 15+
-- ============================================

-- Drop existing tables in correct order (CASCADE removes dependencies)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- TABLE: categories
-- ============================================
-- Stores product categories (e.g., Electronics, Clothing, Food)
-- Every product must belong to exactly one category

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for category lookups by name
CREATE INDEX idx_categories_name ON categories(name);

-- ============================================
-- TABLE: products
-- ============================================
-- Stores all products in the platform
-- Each product belongs to one category

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  brand VARCHAR(100),
  category_id INTEGER NOT NULL,
  sku VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Index for filtering by category (WHERE category_id = X)
CREATE INDEX idx_products_category_id ON products(category_id);

-- Index for filtering by brand (WHERE brand = 'Apple')
CREATE INDEX idx_products_brand ON products(brand);

-- Index for sorting by creation date (ORDER BY created_at DESC)
CREATE INDEX idx_products_created_at ON products(created_at);

-- Index for text search on product names
CREATE INDEX idx_products_name ON products(name);

-- ============================================
-- TABLE: product_images
-- ============================================
-- Stores images for products
-- Each product can have multiple images
-- One image can be marked as primary (main gallery image)

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  path VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT uq_product_images_product_path
    UNIQUE(product_id, path)
);

-- Index for fetching all images for a product (WHERE product_id = X)
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Index for finding primary image (WHERE is_primary = true)
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary);

-- Index for ordering images in gallery (ORDER BY display_order)
CREATE INDEX idx_product_images_display_order ON product_images(display_order);

-- ============================================
-- INITIAL DATA (Optional seed data)
-- ============================================
-- Uncomment if you want some default categories

-- INSERT INTO categories (name, description) VALUES
--   ('Electronics', 'Electronic devices and gadgets'),
--   ('Clothing', 'Fashion and apparel'),
--   ('Books', 'Books and publications'),
--   ('Home & Garden', 'Home improvement and garden supplies'),
--   ('Sports', 'Sports equipment and accessories');

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on products table
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema is correct:
--
-- \dt                          -- List all tables
-- \d categories                -- Show categories schema
-- \d products                  -- Show products schema
-- \d product_images            -- Show product_images schema
-- \di                          -- List all indexes
--
-- Test inserts:
-- INSERT INTO categories (name) VALUES ('Test Category');
-- INSERT INTO products (name, brand, category_id) VALUES ('Test Product', 'Test Brand', 1);
-- INSERT INTO product_images (product_id, path, is_primary) VALUES (1, '/test.jpg', true);

-- ============================================
-- SCHEMA SETUP COMPLETE
-- ============================================
