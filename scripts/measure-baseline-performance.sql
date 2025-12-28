-- Baseline Performance Measurement Script
-- Purpose: Record p50, p95, p99 latencies for restaurant orders query
-- Run BEFORE optimization to establish baseline metrics

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║        Baseline Performance Measurement                   ║'
\echo '╠════════════════════════════════════════════════════════════╣'
\echo '║ This script measures current query performance            ║'
\echo '║ Run this BEFORE applying optimizations                    ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Enable timing and extended display
\timing on
\x auto

-- Create performance tracking table
CREATE TABLE IF NOT EXISTS performance_baselines (
  id SERIAL PRIMARY KEY,
  query_name VARCHAR(255) NOT NULL,
  measurement_timestamp TIMESTAMPTZ DEFAULT NOW(),
  p50_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  p99_latency_ms NUMERIC,
  avg_latency_ms NUMERIC,
  min_latency_ms NUMERIC,
  max_latency_ms NUMERIC,
  sample_size INTEGER,
  notes TEXT
);

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 Test 1: Restaurant Dashboard Query (Current)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Running 20 iterations to measure latency distribution...'
\echo ''

-- Create temporary table to store timing results
CREATE TEMP TABLE query_timings (
  iteration INT,
  execution_time_ms NUMERIC
);

-- Run query 20 times and measure execution time
DO $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  execution_ms NUMERIC;
  i INT;
BEGIN
  FOR i IN 1..20 LOOP
    start_time := clock_timestamp();

    -- Execute the actual query (current version with SELECT *)
    PERFORM
      o.id,
      o.status,
      o.total_amount,
      o.created_at,
      o.delivery_address,
      o.notes
    FROM orders o
    WHERE o.restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
      AND o.status IN ('pending', 'confirmed')
    ORDER BY o.created_at DESC
    LIMIT 20;

    end_time := clock_timestamp();
    execution_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;

    INSERT INTO query_timings VALUES (i, execution_ms);
  END LOOP;
END$$;

-- Calculate percentiles
WITH percentiles AS (
  SELECT
    percentile_cont(0.50) WITHIN GROUP (ORDER BY execution_time_ms) as p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99,
    AVG(execution_time_ms) as avg_ms,
    MIN(execution_time_ms) as min_ms,
    MAX(execution_time_ms) as max_ms,
    COUNT(*) as sample_size
  FROM query_timings
)
INSERT INTO performance_baselines (
  query_name,
  p50_latency_ms,
  p95_latency_ms,
  p99_latency_ms,
  avg_latency_ms,
  min_latency_ms,
  max_latency_ms,
  sample_size,
  notes
)
SELECT
  'restaurant_orders_current',
  p50,
  p95,
  p99,
  avg_ms,
  min_ms,
  max_ms,
  sample_size,
  'Baseline measurement before index optimization'
FROM percentiles
RETURNING *;

\echo ''
\echo '✅ Baseline measurements recorded!'
\echo ''

-- Display results
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📈 Performance Summary'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  'Current Performance (Before Optimization)' as status,
  ROUND(p50_latency_ms, 2) || 'ms' as p50,
  ROUND(p95_latency_ms, 2) || 'ms' as p95,
  ROUND(p99_latency_ms, 2) || 'ms' as p99,
  ROUND(avg_latency_ms, 2) || 'ms' as average,
  sample_size as samples
FROM performance_baselines
WHERE query_name = 'restaurant_orders_current'
ORDER BY measurement_timestamp DESC
LIMIT 1;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🎯 Target Performance (After Optimization)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '  Goal: 100X speedup'
\echo '  Target p95: <5ms (vs current)'
\echo '  Target p99: <10ms'
\echo ''

-- Clean up
DROP TABLE query_timings;

\echo ''
\echo '📋 Next Steps:'
\echo '  1. Apply database indexes (T007-T009)'
\echo '  2. Optimize SELECT * to specific columns (T014-T015)'
\echo '  3. Implement pagination (T016-T017)'
\echo '  4. Re-run this script to measure improvement (T018)'
\echo ''

\timing off
\x off
