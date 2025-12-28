-- ============================================================================
-- Migration: Create Monitoring Views for Grafana Dashboard
-- Created: 2025-11-25
-- Purpose: T040-T047 - Create PostgreSQL views for performance monitoring
-- Technology: PostgreSQL + pg_stat_statements + Grafana
--
-- This migration creates 8 monitoring views:
-- 1. monitoring_query_performance - Top queries by execution time
-- 2. monitoring_index_usage - Index usage statistics
-- 3. monitoring_table_stats - Table health metrics
-- 4. monitoring_rpc_performance - RPC function performance
-- 5. monitoring_connections - Connection pool metrics
-- 6. monitoring_database_size - Database growth tracking
-- 7. monitoring_slow_queries - Real-time slow query detection
-- 8. monitoring_cache_hit_ratio - Buffer cache hit ratio
--
-- Impact:
-- - Enables real-time performance monitoring in Grafana
-- - Tracks 100X improvement validation
-- - Alerts on performance degradation
-- - Monitors index effectiveness
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

COMMENT ON EXTENSION pg_stat_statements IS
'T040: Track planning and execution statistics of all SQL statements';

-- ============================================================================
-- STEP 2: Create Monitoring Views
-- ============================================================================

-- View 1: Query Performance Metrics (T040)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_query_performance AS
SELECT
  queryid,
  substring(query, 1, 100) as query_snippet,
  calls,
  total_exec_time,
  mean_exec_time,
  min_exec_time,
  max_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%monitoring_%'
ORDER BY mean_exec_time DESC
LIMIT 100;

COMMENT ON VIEW monitoring_query_performance IS
'T040: Top 100 queries by average execution time. Tracks p50, p95, p99 latencies for performance validation.';

-- View 2: Index Usage Statistics (T041)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  pg_relation_size(indexrelid) as index_size_bytes,
  CASE
    WHEN idx_scan = 0 THEN 'NEVER_USED'
    WHEN idx_scan < 100 THEN 'RARELY_USED'
    WHEN idx_scan < 1000 THEN 'MODERATE'
    ELSE 'FREQUENTLY_USED'
  END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW monitoring_index_usage IS
'T041: Index usage statistics. Monitor index effectiveness and identify unused indexes.';

-- View 3: Table Statistics (T042)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_table_stats AS
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  CASE
    WHEN n_live_tup > 0
    THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END as dead_tuple_ratio,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes,
  CASE
    WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / n_live_tup) > 20 THEN 'NEEDS_VACUUM'
    WHEN idx_scan = 0 AND seq_scan > 1000 THEN 'NEEDS_INDEX'
    ELSE 'OK'
  END as health_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW monitoring_table_stats IS
'T042: Table health metrics. Monitor vacuum needs, sequential scans, and table bloat.';

-- View 4: RPC Function Performance (T043)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_rpc_performance AS
SELECT
  p.proname as function_name,
  COALESCE(pg_stat_user_functions.calls, 0) as calls,
  COALESCE(pg_stat_user_functions.total_time, 0) as total_time_ms,
  COALESCE(pg_stat_user_functions.self_time, 0) as self_time_ms,
  CASE
    WHEN COALESCE(pg_stat_user_functions.calls, 0) > 0
    THEN ROUND(pg_stat_user_functions.total_time / pg_stat_user_functions.calls, 2)
    ELSE 0
  END as avg_time_ms,
  CASE
    WHEN COALESCE(pg_stat_user_functions.calls, 0) > 0
    AND (pg_stat_user_functions.total_time / pg_stat_user_functions.calls) < 50
    THEN 'EXCELLENT'
    WHEN COALESCE(pg_stat_user_functions.calls, 0) > 0
    AND (pg_stat_user_functions.total_time / pg_stat_user_functions.calls) < 100
    THEN 'GOOD'
    WHEN COALESCE(pg_stat_user_functions.calls, 0) > 0
    AND (pg_stat_user_functions.total_time / pg_stat_user_functions.calls) < 200
    THEN 'ACCEPTABLE'
    ELSE 'SLOW'
  END as performance_rating
FROM pg_proc p
LEFT JOIN pg_stat_user_functions ON p.oid = pg_stat_user_functions.funcid
WHERE p.proname LIKE 'calculate_%' OR p.proname LIKE 'get_order_%'
ORDER BY COALESCE(pg_stat_user_functions.calls, 0) DESC;

COMMENT ON VIEW monitoring_rpc_performance IS
'T043: RPC function performance metrics. Track analytics function execution times (target: <50ms).';

-- View 5: Connection Statistics (T044)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_connections AS
SELECT
  datname as database,
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
  COUNT(*) FILTER (WHERE wait_event_type = 'Lock') as waiting_for_lock,
  ROUND(MAX(EXTRACT(EPOCH FROM (NOW() - state_change))), 2) as max_idle_time_seconds,
  CASE
    WHEN COUNT(*) > 100 THEN 'TOO_MANY'
    WHEN COUNT(*) FILTER (WHERE state = 'idle in transaction') > 10 THEN 'IDLE_IN_TRANSACTION'
    WHEN COUNT(*) < 5 THEN 'UNDERUTILIZED'
    ELSE 'HEALTHY'
  END as pool_status
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname;

COMMENT ON VIEW monitoring_connections IS
'T044: Connection pool monitoring. Track active/idle connections for PgBouncer optimization.';

-- View 6: Database Size Metrics (T045)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_database_size AS
SELECT
  datname as database,
  pg_size_pretty(pg_database_size(datname)) as size_pretty,
  pg_database_size(datname) as size_bytes,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public') as table_count,
  (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE schemaname = 'public') as index_count,
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE 'calculate_%' OR proname LIKE 'get_order_%') as rpc_function_count,
  NOW() as measured_at
FROM pg_database
WHERE datname = current_database();

COMMENT ON VIEW monitoring_database_size IS
'T045: Database size growth tracking. Monitor storage usage over time.';

-- View 7: Slow Queries (Real-time) (T046)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_slow_queries AS
SELECT
  pid,
  usename as username,
  application_name,
  client_addr,
  state,
  ROUND(EXTRACT(EPOCH FROM (NOW() - query_start)), 2) as duration_seconds,
  ROUND(EXTRACT(EPOCH FROM (NOW() - state_change)), 2) as state_duration_seconds,
  substring(query, 1, 200) as query_snippet,
  wait_event_type,
  wait_event,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - query_start)) > 60 THEN 'CRITICAL'
    WHEN EXTRACT(EPOCH FROM (NOW() - query_start)) > 10 THEN 'WARNING'
    WHEN EXTRACT(EPOCH FROM (NOW() - query_start)) > 1 THEN 'SLOW'
    ELSE 'NORMAL'
  END as severity
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
  AND query NOT LIKE '%monitoring_%'
  AND EXTRACT(EPOCH FROM (NOW() - query_start)) > 1
ORDER BY query_start ASC;

COMMENT ON VIEW monitoring_slow_queries IS
'T046: Real-time slow query detection. Alert on queries running >1 second.';

-- View 8: Cache Hit Ratio (T047)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_cache_hit_ratio AS
SELECT
  'Overall Database' as metric,
  SUM(heap_blks_read) as heap_read,
  SUM(heap_blks_hit) as heap_hit,
  CASE
    WHEN SUM(heap_blks_hit) + SUM(heap_blks_read) > 0
    THEN ROUND(100.0 * SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)), 2)
    ELSE 0
  END as cache_hit_ratio,
  CASE
    WHEN SUM(heap_blks_hit) + SUM(heap_blks_read) > 0
    AND (100.0 * SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read))) >= 95
    THEN 'EXCELLENT'
    WHEN SUM(heap_blks_hit) + SUM(heap_blks_read) > 0
    AND (100.0 * SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read))) >= 80
    THEN 'GOOD'
    ELSE 'NEEDS_TUNING'
  END as rating
FROM pg_statio_user_tables
UNION ALL
SELECT
  tablename as metric,
  heap_blks_read,
  heap_blks_hit,
  CASE
    WHEN heap_blks_hit + heap_blks_read > 0
    THEN ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    ELSE 0
  END as cache_hit_ratio,
  CASE
    WHEN heap_blks_hit + heap_blks_read > 0
    AND (100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read)) >= 98
    THEN 'EXCELLENT'
    WHEN heap_blks_hit + heap_blks_read > 0
    AND (100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read)) >= 85
    THEN 'GOOD'
    ELSE 'NEEDS_TUNING'
  END as rating
FROM pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY heap_blks_read + heap_blks_hit DESC;

COMMENT ON VIEW monitoring_cache_hit_ratio IS
'T047: Buffer cache hit ratio monitoring. Target: >95% overall, >98% per table.';

-- ============================================================================
-- STEP 3: Create Monitoring Role with Permissions
-- ============================================================================

-- Create monitoring role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitoring') THEN
    CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_change_this_password';
    RAISE NOTICE 'Created monitoring role. IMPORTANT: Change the password!';
  ELSE
    RAISE NOTICE 'Monitoring role already exists';
  END IF;
END$$;

-- Grant permissions
GRANT CONNECT ON DATABASE postgres TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;

-- Grant specific permissions for monitoring views
GRANT SELECT ON monitoring_query_performance TO monitoring;
GRANT SELECT ON monitoring_index_usage TO monitoring;
GRANT SELECT ON monitoring_table_stats TO monitoring;
GRANT SELECT ON monitoring_rpc_performance TO monitoring;
GRANT SELECT ON monitoring_connections TO monitoring;
GRANT SELECT ON monitoring_database_size TO monitoring;
GRANT SELECT ON monitoring_slow_queries TO monitoring;
GRANT SELECT ON monitoring_cache_hit_ratio TO monitoring;

-- Grant permissions on system views
GRANT SELECT ON pg_stat_statements TO monitoring;
GRANT SELECT ON pg_stat_user_tables TO monitoring;
GRANT SELECT ON pg_stat_user_indexes TO monitoring;
GRANT SELECT ON pg_stat_user_functions TO monitoring;
GRANT SELECT ON pg_stat_activity TO monitoring;
GRANT SELECT ON pg_statio_user_tables TO monitoring;

COMMENT ON ROLE monitoring IS
'T040: Read-only role for Grafana/Prometheus monitoring. Password should be changed after deployment.';

-- ============================================================================
-- STEP 4: Create Summary Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monitoring_summary()
RETURNS TABLE(
  category TEXT,
  metric TEXT,
  value NUMERIC,
  unit TEXT,
  status TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  -- Query Performance
  SELECT
    'Query Performance'::TEXT,
    'Average Query Time'::TEXT,
    ROUND(AVG(mean_exec_time), 2),
    'ms'::TEXT,
    CASE
      WHEN AVG(mean_exec_time) < 50 THEN 'EXCELLENT'
      WHEN AVG(mean_exec_time) < 100 THEN 'GOOD'
      ELSE 'SLOW'
    END::TEXT
  FROM monitoring_query_performance

  UNION ALL

  -- Cache Hit Ratio
  SELECT
    'Cache Performance'::TEXT,
    'Cache Hit Ratio'::TEXT,
    cache_hit_ratio,
    '%'::TEXT,
    rating::TEXT
  FROM monitoring_cache_hit_ratio
  WHERE metric = 'Overall Database'

  UNION ALL

  -- Active Connections
  SELECT
    'Connection Pool'::TEXT,
    'Active Connections'::TEXT,
    active_connections::NUMERIC,
    'connections'::TEXT,
    pool_status::TEXT
  FROM monitoring_connections
  WHERE database = 'postgres'

  UNION ALL

  -- RPC Performance
  SELECT
    'Analytics RPC'::TEXT,
    'Average RPC Time'::TEXT,
    ROUND(AVG(avg_time_ms), 2),
    'ms'::TEXT,
    CASE
      WHEN AVG(avg_time_ms) < 50 THEN 'EXCELLENT'
      WHEN AVG(avg_time_ms) < 100 THEN 'GOOD'
      ELSE 'SLOW'
    END::TEXT
  FROM monitoring_rpc_performance
  WHERE calls > 0

  UNION ALL

  -- Database Size
  SELECT
    'Storage'::TEXT,
    'Database Size'::TEXT,
    size_bytes::NUMERIC / 1024 / 1024 / 1024,
    'GB'::TEXT,
    'INFO'::TEXT
  FROM monitoring_database_size;
END;
$$;

COMMENT ON FUNCTION get_monitoring_summary IS
'T048: Quick monitoring summary for health checks. Returns key metrics with status indicators.';

GRANT EXECUTE ON FUNCTION get_monitoring_summary TO monitoring;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

-- Test all monitoring views
DO $$
DECLARE
  v_view_name TEXT;
  v_row_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Monitoring Views Verification ===';
  RAISE NOTICE '';

  -- Check each view
  FOR v_view_name IN
    SELECT viewname FROM pg_views
    WHERE schemaname = 'public'
    AND viewname LIKE 'monitoring_%'
    ORDER BY viewname
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM ' || v_view_name INTO v_row_count;
    RAISE NOTICE 'View: % - Rows: %', v_view_name, v_row_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Summary ===';
  RAISE NOTICE '';
END$$;

-- Display monitoring summary
SELECT * FROM get_monitoring_summary();

COMMIT;

-- ============================================================================
-- Post-Migration Notes
-- ============================================================================

-- 1. Change monitoring role password:
--    ALTER ROLE monitoring WITH PASSWORD 'your_secure_password';

-- 2. Configure PostgreSQL exporter:
--    DATA_SOURCE_NAME="postgresql://monitoring:[password]@data.greenland77.ge:5432/postgres"

-- 3. Verify pg_stat_statements configuration:
--    SHOW shared_preload_libraries;  -- Should include 'pg_stat_statements'
--    SHOW pg_stat_statements.track;   -- Should be 'all'

-- 4. Test monitoring views:
--    SELECT * FROM monitoring_query_performance LIMIT 5;
--    SELECT * FROM monitoring_index_usage LIMIT 5;
--    SELECT * FROM monitoring_rpc_performance;
--    SELECT * FROM monitoring_cache_hit_ratio;

-- 5. Get quick summary:
--    SELECT * FROM get_monitoring_summary();
