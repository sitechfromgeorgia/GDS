-- GDS Performance Indexes Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Date: 2025-01-21

-- =============================================
-- ORDERS TABLE INDEXES
-- =============================================

-- Index for filtering orders by restaurant (RestaurantView History)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id
ON orders("restaurantId");

-- Index for filtering orders by status (OrderManagement)
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

-- Index for sorting orders by date (everywhere)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
ON orders("createdAt" DESC);

-- Composite index for restaurant + status filtering
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
ON orders("restaurantId", status);

-- =============================================
-- PRODUCTS TABLE INDEXES
-- =============================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

-- Partial index for active products only (most common query)
CREATE INDEX IF NOT EXISTS idx_products_is_active
ON products("isActive") WHERE "isActive" = true;

-- Partial index for promo products
CREATE INDEX IF NOT EXISTS idx_products_is_promo
ON products("isPromo") WHERE "isPromo" = true;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this after creating indexes to verify:
/*
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products')
ORDER BY tablename, indexname;
*/
