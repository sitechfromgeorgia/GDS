-- =====================================================
-- FIX PERFORMANCE INDEXES - Remove Non-Existent deleted_at Column
-- =====================================================
-- Migration: Fix performance indexes that reference deleted_at column
-- Issue: Indexes were created with WHERE deleted_at IS NULL clause,
--        but deleted_at column doesn't exist in any tables
-- Solution: Drop and recreate indexes without deleted_at references
-- Impact: Indexes will now work correctly and improve query performance
-- Date: 2025-11-19
-- Phase: 1 - Critical Fixes
-- =====================================================

BEGIN;

-- =====================================================
-- ORDERS TABLE INDEXES (5 indexes to fix)
-- =====================================================

-- Index 1: Order status and creation time
DROP INDEX IF EXISTS idx_orders_status_created;
CREATE INDEX idx_orders_status_created
ON orders(status, created_at DESC);

-- Index 2: Restaurant order history
DROP INDEX IF EXISTS idx_orders_restaurant_id;
CREATE INDEX idx_orders_restaurant_id
ON orders(restaurant_id, created_at DESC);

-- Index 3: Driver delivery assignments
DROP INDEX IF EXISTS idx_orders_driver_id;
CREATE INDEX idx_orders_driver_id
ON orders(driver_id, updated_at DESC)
WHERE driver_id IS NOT NULL;

-- Index 4: Order total amount for analytics
DROP INDEX IF EXISTS idx_orders_total_amount;
CREATE INDEX idx_orders_total_amount
ON orders(total_amount, created_at DESC)
WHERE status IN ('delivered', 'confirmed');

-- Index 5: Composite index for advanced filtering
DROP INDEX IF EXISTS idx_orders_composite;
CREATE INDEX idx_orders_composite
ON orders(status, restaurant_id, created_at DESC);

-- =====================================================
-- PROFILES TABLE INDEXES (3 indexes to fix)
-- =====================================================

-- Index 6: User role filtering
DROP INDEX IF EXISTS idx_profiles_role;
CREATE INDEX idx_profiles_role
ON profiles(role, created_at DESC);

-- Index 7: Active user filtering
DROP INDEX IF EXISTS idx_profiles_is_active;
CREATE INDEX idx_profiles_is_active
ON profiles(is_active, role);

-- Index 8: Email lookup for authentication
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;

-- =====================================================
-- PRODUCTS TABLE INDEXES (2 indexes to fix)
-- =====================================================

-- Index 9: Active product filtering
DROP INDEX IF EXISTS idx_products_active;
CREATE INDEX idx_products_active
ON products(active, category, name);

-- Index 10: Product search by category
DROP INDEX IF EXISTS idx_products_category;
CREATE INDEX idx_products_category
ON products(category, price)
WHERE active = true;

-- =====================================================
-- ORDER_ITEMS TABLE INDEX (1 index to fix)
-- =====================================================

-- Index 11: Order items lookup
DROP INDEX IF EXISTS idx_order_items_order_id;
CREATE INDEX idx_order_items_order_id
ON order_items(order_id, created_at);

-- =====================================================
-- DELIVERY_LOCATIONS TABLE INDEX (1 index to fix)
-- =====================================================

-- Index 12: Delivery location history
DROP INDEX IF EXISTS idx_delivery_locations_order_id;
CREATE INDEX idx_delivery_locations_order_id
ON delivery_locations(order_id, timestamp DESC);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
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

    IF index_count = 12 THEN
        RAISE NOTICE 'SUCCESS: All 12 performance indexes created correctly';
    ELSE
        RAISE WARNING 'WARNING: Expected 12 indexes but found %', index_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration fixes the schema mismatch where indexes referenced
-- a deleted_at column that doesn't exist in the table definitions.
--
-- If soft delete functionality is needed in the future, it should be
-- implemented in Phase 3 with:
-- 1. ALTER TABLE statements to add deleted_at columns
-- 2. Updated RLS policies to respect deleted_at
-- 3. Updated application queries to filter deleted records
-- 4. Admin UI to manage soft-deleted records
--
-- For now, hard deletes (DELETE FROM) will continue to work as before.
-- =====================================================
