-- ========================================
-- STANDARDIZE ACTIVE COLUMN NAMING
-- ========================================
-- Migration: Rename 'active' to 'is_active' for consistency
-- Created: 2025-11-08
-- Purpose: Ensure consistent naming across all tables (use 'is_active' everywhere)

-- ========================================
-- PRODUCTS TABLE
-- ========================================

-- Rename 'active' to 'is_active' in products table
ALTER TABLE products
    RENAME COLUMN active TO is_active;

-- Update the index if it exists
DROP INDEX IF EXISTS idx_products_active_name;
CREATE INDEX idx_products_is_active_name
    ON products(is_active, name) WHERE is_active = true;

COMMENT ON COLUMN products.is_active IS 'Whether the product is active and available for ordering';
COMMENT ON INDEX idx_products_is_active_name IS 'Optimizes active product catalog queries (partial index)';

-- ========================================
-- UPDATE RLS POLICIES
-- ========================================

-- Drop and recreate the products RLS policy with correct column name
DROP POLICY IF EXISTS "products_select_active_only" ON products;
DROP POLICY IF EXISTS "products_select_public_active" ON products;

CREATE POLICY "products_select_active_only" ON products
    FOR SELECT USING (
        is_active = true AND
        deleted_at IS NULL
    );

COMMENT ON POLICY "products_select_active_only" ON products IS
    'Only active, non-deleted products are visible';

-- ========================================
-- VERIFY CONSISTENCY
-- ========================================

-- Check all tables for active/is_active columns
DO $$
DECLARE
    active_cols INTEGER;
    is_active_cols INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'active';

    SELECT COUNT(*) INTO is_active_cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'is_active';

    RAISE NOTICE 'Tables with "active" column: %', active_cols;
    RAISE NOTICE 'Tables with "is_active" column: %', is_active_cols;

    IF active_cols > 0 THEN
        RAISE WARNING 'Found % tables still using "active" column. Should be migrated to "is_active"', active_cols;
    END IF;
END $$;

-- ========================================
-- REFRESH MATERIALIZED VIEWS (if any)
-- ========================================

-- If you have materialized views using products.active, refresh them
-- REFRESH MATERIALIZED VIEW mv_product_catalog;
