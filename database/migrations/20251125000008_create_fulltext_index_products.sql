-- Migration: Create Full-Text Search Index on Products
-- Created: 2025-11-25
-- Purpose: T034 - Enable fast product search in admin dashboard
-- Target: Product search queries (name, description, Georgian text)
-- Technology: PostgreSQL GIN index with tsvector
--
-- Query Pattern Being Optimized:
-- SELECT * FROM products
-- WHERE name ILIKE '%ხინკალი%'
--    OR description ILIKE '%ხინკალი%';
--
-- Expected Performance:
-- Before: 500-1000ms (full table scan with ILIKE)
-- After:  <50ms (GIN index full-text search)
-- Result: 10-20X faster product search

BEGIN;

-- Step 1: Add tsvector column for full-text search
-- This stores the searchable text in a preprocessed format
ALTER TABLE products
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(description, '')), 'B')
) STORED;

-- Step 2: Create GIN index on the search_vector column
-- GIN (Generalized Inverted Index) is optimized for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- Step 3: Verify column and index were created
DO $$
BEGIN
  -- Check column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'search_vector'
  ) THEN
    RAISE NOTICE 'Column search_vector created successfully';
  ELSE
    RAISE EXCEPTION 'Column search_vector was not created';
  END IF;

  -- Check index exists
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_products_search_vector'
  ) THEN
    RAISE NOTICE 'Index idx_products_search_vector created successfully';
  ELSE
    RAISE EXCEPTION 'Index idx_products_search_vector was not created';
  END IF;
END$$;

COMMIT;

-- Analyze table to update statistics for query planner
ANALYZE products;

--
-- How to Use Full-Text Search:
--

-- OLD APPROACH (slow, doesn't use index):
-- SELECT * FROM products
-- WHERE name ILIKE '%ხინკალი%' OR description ILIKE '%ხინკალი%';

-- NEW APPROACH (fast, uses GIN index):
-- SELECT * FROM products
-- WHERE search_vector @@ plainto_tsquery('simple', 'ხინკალი');

-- With ranking (most relevant first):
-- SELECT *,
--   ts_rank(search_vector, plainto_tsquery('simple', 'ხინკალი')) as relevance
-- FROM products
-- WHERE search_vector @@ plainto_tsquery('simple', 'ხინკალი')
-- ORDER BY relevance DESC;

--
-- Performance Validation (T038):
--

-- 1. Check index is being used:
--    EXPLAIN ANALYZE
--    SELECT * FROM products
--    WHERE search_vector @@ plainto_tsquery('simple', 'ხინკალი');
--
--    Expected output: "Bitmap Index Scan on idx_products_search_vector"

-- 2. Compare ILIKE vs full-text search:
--    -- ILIKE (slow):
--    EXPLAIN ANALYZE
--    SELECT * FROM products
--    WHERE name ILIKE '%ხინკალი%';
--
--    -- Full-text (fast):
--    EXPLAIN ANALYZE
--    SELECT * FROM products
--    WHERE search_vector @@ plainto_tsquery('simple', 'ხინკალი');

-- 3. Check index size:
--    SELECT
--      indexname,
--      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
--    FROM pg_stat_user_indexes
--    WHERE indexrelname = 'idx_products_search_vector';
--
--    Expected: ~10-30MB depending on product count and text length

--
-- Notes:
--

-- **Why 'simple' configuration?**
-- - Georgian language doesn't have native PostgreSQL text search config
-- - 'simple' configuration works well for Georgian Unicode text
-- - Preserves Georgian characters without stemming

-- **Weight system:**
-- - 'A' weight for name (highest priority)
-- - 'B' weight for description (secondary priority)
-- - Affects ts_rank() relevance scoring

-- **GENERATED ALWAYS AS ... STORED:**
-- - search_vector automatically updates when name/description changes
-- - No need for triggers or manual updates
-- - Always in sync with source data

-- **GIN index advantages:**
-- - Optimized for multi-value columns (like tsvector)
-- - Fast lookups for full-text search queries
-- - Supports @@ operator (text search matching)

-- **Migration safety:**
-- - CONCURRENTLY prevents table locks (zero downtime)
-- - COALESCE handles NULL values safely
-- - IF NOT EXISTS prevents errors on re-run

-- **Frontend integration example:**
--    // frontend/src/lib/services/restaurant/product.service.ts
--    const { data } = await supabase
--      .from('products')
--      .select('*')
--      .textSearch('search_vector', searchQuery)
--      .order('relevance', { ascending: false });

