-- =====================================================
-- Performance Optimization: Database Indexes
-- =====================================================
-- Created: 2025-11-05
-- Purpose: Add indexes to frequently queried columns for optimal performance
-- Impact: Significant performance improvement for dashboard queries and filtering
-- =====================================================

-- Profiles table indexes
-- Purpose: Speed up role-based dashboard redirects and user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Orders table indexes
-- Purpose: Optimize restaurant order views and driver assignment queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Order Items table indexes
-- Purpose: Speed up order detail fetching and product analytics
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Products table indexes
-- Purpose: Optimize product filtering and category browsing
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Composite index for product listing (category + availability)
CREATE INDEX IF NOT EXISTS idx_products_category_available ON products(category_id, is_available);

-- Categories table indexes
-- Purpose: Speed up category lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- =====================================================
-- Index Usage Analytics
-- =====================================================
-- To monitor index usage, run:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
-- =====================================================

COMMENT ON INDEX idx_profiles_role IS 'Speeds up role-based dashboard redirects';
COMMENT ON INDEX idx_orders_restaurant_status IS 'Optimizes restaurant order filtering by status';
COMMENT ON INDEX idx_orders_driver_status IS 'Optimizes driver order filtering by status';
COMMENT ON INDEX idx_products_category_available IS 'Optimizes product listing with category and availability filters';
