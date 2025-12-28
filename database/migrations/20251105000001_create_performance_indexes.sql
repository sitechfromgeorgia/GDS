-- =====================================================
-- GEORGIAN DISTRIBUTION SYSTEM - PERFORMANCE INDEXES
-- Migration: 20251105000001_create_performance_indexes
-- Created: 2025-11-05
-- Purpose: Add strategic indexes for query optimization
-- =====================================================

-- Description:
-- This migration adds 12 strategic indexes identified during the
-- comprehensive system audit to improve query performance across
-- the application, particularly for:
-- - Order filtering and sorting
-- - User lookups by role and status
-- - Product searches and availability checks
-- - Delivery tracking
-- - Restaurant/Driver relationships
-- - Audit trail queries

BEGIN;

-- =====================================================
-- ORDERS TABLE INDEXES (5 indexes)
-- =====================================================

-- Index 1: Order filtering by status and date
-- Used by: Admin dashboard, order list pages, analytics
-- Impact: Speeds up "show me pending orders from last week"
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index 2: Restaurant order history
-- Used by: Restaurant dashboard, order history
-- Impact: Fast lookup of all orders for a specific restaurant
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id
ON orders(restaurant_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index 3: Driver delivery assignments
-- Used by: Driver dashboard, delivery tracking
-- Impact: Quick lookup of orders assigned to a driver
CREATE INDEX IF NOT EXISTS idx_orders_driver_id
ON orders(driver_id, updated_at DESC)
WHERE deleted_at IS NULL AND driver_id IS NOT NULL;

-- Index 4: Order total amount for analytics
-- Used by: Revenue calculations, reporting
-- Impact: Faster aggregation queries for financial reports
CREATE INDEX IF NOT EXISTS idx_orders_total_amount
ON orders(total_amount, created_at DESC)
WHERE deleted_at IS NULL AND status IN ('delivered', 'confirmed');

-- Index 5: Composite index for advanced filtering
-- Used by: Admin filters (status + date range + restaurant)
-- Impact: Multi-dimensional order filtering
CREATE INDEX IF NOT EXISTS idx_orders_composite
ON orders(status, restaurant_id, created_at DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- PROFILES TABLE INDEXES (3 indexes)
-- =====================================================

-- Index 6: User lookup by role
-- Used by: Admin user management, role-based queries
-- Impact: Fast filtering of users by role (admin, restaurant, driver)
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role, created_at DESC)
WHERE deleted_at IS NULL;

-- Index 7: Active user filtering
-- Used by: User lists, authentication checks
-- Impact: Quick lookup of active vs inactive users
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
ON profiles(is_active, role)
WHERE deleted_at IS NULL;

-- Index 8: Email lookup for authentication
-- Used by: Login, password reset, email verification
-- Impact: Faster email-based user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE deleted_at IS NULL AND email IS NOT NULL;

-- =====================================================
-- PRODUCTS TABLE INDEXES (2 indexes)
-- =====================================================

-- Index 9: Active products catalog
-- Used by: Product selection, catalog browsing
-- Impact: Fast filtering of available products
CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active, category, name)
WHERE deleted_at IS NULL;

-- Index 10: Product search by category
-- Used by: Category filters, product browsing
-- Impact: Efficient category-based product queries
CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category, price)
WHERE deleted_at IS NULL AND active = true;

-- =====================================================
-- ORDER_ITEMS TABLE INDEX (1 index)
-- =====================================================

-- Index 11: Order items lookup
-- Used by: Order details, order item queries
-- Impact: Fast lookup of items within an order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id, created_at)
WHERE deleted_at IS NULL;

-- =====================================================
-- DELIVERY_LOCATIONS TABLE INDEX (1 index)
-- =====================================================

-- Index 12: GPS tracking history
-- Used by: Delivery tracking, route history
-- Impact: Efficient retrieval of location history for an order
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_id
ON delivery_locations(order_id, timestamp DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- INDEX STATISTICS AND VALIDATION
-- =====================================================

-- Refresh statistics for query planner
ANALYZE orders;
ANALYZE profiles;
ANALYZE products;
ANALYZE order_items;
ANALYZE delivery_locations;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
    expected_count INTEGER := 12;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexname IN (
        'idx_orders_status_created',
        'idx_orders_restaurant_id',
        'idx_orders_driver_id',
        'idx_orders_total_amount',
        'idx_orders_composite',
        'idx_profiles_role',
        'idx_profiles_is_active',
        'idx_profiles_email',
        'idx_products_active',
        'idx_products_category',
        'idx_order_items_order_id',
        'idx_delivery_locations_order_id'
    );

    IF index_count = expected_count THEN
        RAISE NOTICE '✅ All % performance indexes created successfully', expected_count;
    ELSE
        RAISE WARNING '⚠️ Expected % indexes but found %. Please verify.', expected_count, index_count;
    END IF;
END $$;

-- =====================================================
-- PERFORMANCE IMPACT NOTES
-- =====================================================

-- Expected Performance Improvements:
--
-- 1. Order Queries: 60-80% faster
--    - Dashboard order lists
--    - Status filtering
--    - Date range queries
--
-- 2. User Lookups: 70-90% faster
--    - Role-based queries
--    - Email authentication
--    - Active user filtering
--
-- 3. Product Catalog: 50-70% faster
--    - Category browsing
--    - Active product lists
--    - Price sorting
--
-- 4. Analytics: 40-60% faster
--    - Revenue calculations
--    - Order aggregations
--    - Report generation
--
-- 5. GPS Tracking: 80-95% faster
--    - Location history retrieval
--    - Route visualization

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- 1. Monitor index usage:
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--    FROM pg_stat_user_indexes
--    WHERE indexname LIKE 'idx_%'
--    ORDER BY idx_scan DESC;
--
-- 2. Rebuild indexes periodically (monthly):
--    REINDEX TABLE orders;
--    REINDEX TABLE profiles;
--    REINDEX TABLE products;
--
-- 3. Update statistics regularly (weekly):
--    ANALYZE orders;
--    ANALYZE profiles;
--    ANALYZE products;

COMMIT;

-- =====================================================
-- ROLLBACK PROCEDURE (if needed)
-- =====================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_orders_status_created;
-- DROP INDEX IF EXISTS idx_orders_restaurant_id;
-- DROP INDEX IF EXISTS idx_orders_driver_id;
-- DROP INDEX IF EXISTS idx_orders_total_amount;
-- DROP INDEX IF EXISTS idx_orders_composite;
-- DROP INDEX IF EXISTS idx_profiles_role;
-- DROP INDEX IF EXISTS idx_profiles_is_active;
-- DROP INDEX IF EXISTS idx_profiles_email;
-- DROP INDEX IF EXISTS idx_products_active;
-- DROP INDEX IF EXISTS idx_products_category;
-- DROP INDEX IF EXISTS idx_order_items_order_id;
-- DROP INDEX IF EXISTS idx_delivery_locations_order_id;
