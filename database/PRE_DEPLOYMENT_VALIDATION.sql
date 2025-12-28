-- ============================================================================
-- PRE-DEPLOYMENT VALIDATION SCRIPT (T013 Extension)
-- ============================================================================
-- Purpose: Validate system state BEFORE applying optimizations
-- Run this before EXECUTE_DEPLOYMENT.bat to ensure safe deployment
-- Expected runtime: 3-5 minutes
-- ============================================================================

\timing on
\set QUIET on

-- ============================================================================
-- SECTION 1: DATABASE CONNECTION & VERSION CHECK
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '  PRE-DEPLOYMENT VALIDATION'
\echo '  Self-Hosted Supabase at data.greenland77.ge'
\echo '  PostgreSQL Production Optimization - Phase 2'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo '1. Database Version & Extensions'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT version() AS postgresql_version;

\echo ''
\echo 'Required Extensions:'
SELECT
  extname AS extension_name,
  extversion AS version,
  CASE
    WHEN extname = 'pg_stat_statements' THEN '✓ Required for query monitoring'
    WHEN extname = 'plpgsql' THEN '✓ Required for RPC functions'
    WHEN extname = 'uuid-ossp' THEN '✓ Required for UUID generation'
    ELSE '○ Optional'
  END AS status
FROM pg_extension
WHERE extname IN ('pg_stat_statements', 'plpgsql', 'uuid-ossp', 'pgcrypto')
ORDER BY extname;

\echo ''
\echo 'Missing Extensions Check:'
DO $$
DECLARE
  v_missing TEXT[] := '{}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    v_missing := array_append(v_missing, 'pg_stat_statements');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'plpgsql') THEN
    v_missing := array_append(v_missing, 'plpgsql');
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING EXTENSIONS: %', array_to_string(v_missing, ', ');
    RAISE NOTICE 'FIX: Run the following commands:';
    RAISE NOTICE '  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;';
    RAISE NOTICE '  CREATE EXTENSION IF NOT EXISTS plpgsql;';
    RAISE EXCEPTION 'Cannot proceed - missing required extensions';
  ELSE
    RAISE NOTICE '✅ All required extensions are installed';
  END IF;
END$$;

-- ============================================================================
-- SECTION 2: TABLE STRUCTURE VALIDATION
-- ============================================================================

\echo ''
\echo ''
\echo '2. Table Structure Validation'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Core Tables Existence:'
SELECT
  tablename AS table_name,
  schemaname AS schema_name,
  CASE
    WHEN tablename IN ('orders', 'profiles', 'products') THEN '✓ Critical'
    ELSE '○ Supporting'
  END AS importance
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'profiles', 'products', 'order_items', 'categories', 'drivers', 'restaurants')
ORDER BY tablename;

\echo ''
\echo 'Missing Critical Tables Check:'
DO $$
DECLARE
  v_missing TEXT[] := '{}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
    v_missing := array_append(v_missing, 'orders');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
    v_missing := array_append(v_missing, 'profiles');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
    v_missing := array_append(v_missing, 'products');
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION '❌ MISSING CRITICAL TABLES: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✅ All critical tables exist';
  END IF;
END$$;

\echo ''
\echo 'Table Row Counts:'
SELECT
  'orders' AS table_name,
  COUNT(*) AS row_count,
  CASE
    WHEN COUNT(*) = 0 THEN '⚠ Empty - consider adding seed data'
    WHEN COUNT(*) < 100 THEN '○ Low data - performance tests may not be representative'
    WHEN COUNT(*) < 1000 THEN '✓ Good for testing'
    ELSE '✓✓ Production-scale data'
  END AS assessment
FROM orders
UNION ALL
SELECT
  'products',
  COUNT(*),
  CASE
    WHEN COUNT(*) = 0 THEN '⚠ Empty - consider adding seed data'
    WHEN COUNT(*) < 50 THEN '○ Low data'
    WHEN COUNT(*) < 200 THEN '✓ Good for testing'
    ELSE '✓✓ Production-scale data'
  END
FROM products
UNION ALL
SELECT
  'profiles',
  COUNT(*),
  CASE
    WHEN COUNT(*) = 0 THEN '⚠ Empty - consider adding seed data'
    WHEN COUNT(*) < 10 THEN '○ Low data'
    WHEN COUNT(*) < 100 THEN '✓ Good for testing'
    ELSE '✓✓ Production-scale data'
  END
FROM profiles;

-- ============================================================================
-- SECTION 3: EXISTING INDEX INVENTORY
-- ============================================================================

\echo ''
\echo ''
\echo '3. Existing Index Inventory'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Current Indexes on Critical Tables:'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products', 'profiles')
ORDER BY tablename, indexname;

\echo ''
\echo 'Indexes to be Created (will check for conflicts):'
DO $$
DECLARE
  v_conflicts TEXT[] := '{}';
BEGIN
  -- Check for existing 2025 indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%_2025%') THEN
    SELECT array_agg(indexname)
    INTO v_conflicts
    FROM pg_indexes
    WHERE indexname LIKE '%_2025%';

    RAISE NOTICE '⚠ WARNING: Found existing 2025 indexes: %', array_to_string(v_conflicts, ', ');
    RAISE NOTICE 'These will be skipped during deployment (IF NOT EXISTS clause)';
  ELSE
    RAISE NOTICE '✅ No conflicting 2025 indexes found - deployment will be clean';
  END IF;
END$$;

-- ============================================================================
-- SECTION 4: RLS POLICY STATUS
-- ============================================================================

\echo ''
\echo ''
\echo '4. Row Level Security (RLS) Status'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'RLS Enabled on Tables:'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  CASE
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'products', 'profiles', 'order_items')
ORDER BY tablename;

\echo ''
\echo 'RLS Policies Count by Table:'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  COUNT(*) AS policy_count,
  CASE
    WHEN COUNT(*) = 0 THEN '⚠ No policies - table may be inaccessible'
    WHEN COUNT(*) < 3 THEN '○ Few policies'
    ELSE '✓ Multiple policies'
  END AS assessment
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 5: DATABASE SIZE & CAPACITY
-- ============================================================================

\echo ''
\echo ''
\echo '5. Database Size & Capacity Assessment'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Database Size:'
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS total_size,
  CASE
    WHEN pg_database_size(current_database()) > 10737418240 THEN '⚠ >10GB - monitor storage'
    WHEN pg_database_size(current_database()) > 1073741824 THEN '○ >1GB - normal'
    ELSE '✓ <1GB - plenty of space'
  END AS assessment;

\echo ''
\echo 'Top 10 Largest Tables:'
SELECT
  schemaname AS schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================================================
-- SECTION 6: ACTIVE CONNECTIONS & LOAD
-- ============================================================================

\echo ''
\echo ''
\echo '6. Active Connections & Current Load'
\echo '────────────────────────────────────────────────────────────────────────────'

\echo ''
\echo 'Connection Summary:'
SELECT
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY COUNT(*) DESC;

\echo ''
\echo 'Long-Running Queries (>30 seconds):'
SELECT
  pid,
  usename AS username,
  application_name,
  state,
  EXTRACT(EPOCH FROM (NOW() - query_start))::INTEGER AS duration_seconds,
  LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND query_start < NOW() - INTERVAL '30 seconds'
ORDER BY query_start;

\echo ''
\echo 'Load Assessment:'
DO $$
DECLARE
  v_active_count INTEGER;
  v_idle_in_transaction INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active_count
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'active';

  SELECT COUNT(*) INTO v_idle_in_transaction
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND state = 'idle in transaction';

  RAISE NOTICE 'Active queries: %', v_active_count;
  RAISE NOTICE 'Idle in transaction: %', v_idle_in_transaction;

  IF v_active_count > 50 THEN
    RAISE NOTICE '⚠ High load - consider deploying during maintenance window';
  ELSIF v_idle_in_transaction > 10 THEN
    RAISE NOTICE '⚠ Many idle transactions - may indicate connection pool issues';
  ELSE
    RAISE NOTICE '✅ Normal load - safe to deploy';
  END IF;
END$$;

-- ============================================================================
-- SECTION 7: BACKUP RECOMMENDATION
-- ============================================================================

\echo ''
\echo ''
\echo '7. Backup Recommendation'
\echo '────────────────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_db_size BIGINT;
  v_estimated_backup_time INTEGER;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_db_size;

  -- Estimate: ~100MB/second for pg_dump
  v_estimated_backup_time := (v_db_size / 104857600)::INTEGER;

  RAISE NOTICE '';
  RAISE NOTICE '📦 BACKUP RECOMMENDATION:';
  RAISE NOTICE '  Database size: %', pg_size_pretty(v_db_size);
  RAISE NOTICE '  Estimated backup time: % seconds (at ~100MB/s)', v_estimated_backup_time;
  RAISE NOTICE '';
  RAISE NOTICE '  Command:';
  RAISE NOTICE '  pg_dump $DATABASE_URL > backup_pre_optimization_$(date +%%Y%%m%%d_%%H%%M%%S).sql';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ EXECUTE_DEPLOYMENT.bat will create automatic backup';
  RAISE NOTICE '  ✓ Manual backup recommended for extra safety';
END$$;

-- ============================================================================
-- SECTION 8: DEPLOYMENT READINESS CHECKLIST
-- ============================================================================

\echo ''
\echo ''
\echo '8. Deployment Readiness Checklist'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

DO $$
DECLARE
  v_ready BOOLEAN := TRUE;
  v_warnings TEXT[] := '{}';
BEGIN
  -- Check 1: Extensions
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    v_ready := FALSE;
    v_warnings := array_append(v_warnings, '❌ Missing pg_stat_statements extension');
  END IF;

  -- Check 2: Tables
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders') THEN
    v_ready := FALSE;
    v_warnings := array_append(v_warnings, '❌ Missing orders table');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') THEN
    v_ready := FALSE;
    v_warnings := array_append(v_warnings, '❌ Missing products table');
  END IF;

  -- Check 3: Data
  IF (SELECT COUNT(*) FROM orders) < 10 THEN
    v_warnings := array_append(v_warnings, '⚠ Low order count - performance tests may not be representative');
  END IF;

  -- Check 4: Active connections
  IF (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 50 THEN
    v_warnings := array_append(v_warnings, '⚠ High active connection count - consider maintenance window');
  END IF;

  RAISE NOTICE '';
  IF v_ready AND array_length(v_warnings, 1) IS NULL THEN
    RAISE NOTICE '✅✅✅ SYSTEM IS READY FOR DEPLOYMENT ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update DATABASE_URL in EXECUTE_DEPLOYMENT.bat';
    RAISE NOTICE '2. Run: EXECUTE_DEPLOYMENT.bat';
    RAISE NOTICE '3. Monitor deployment output for errors';
    RAISE NOTICE '4. Verify improvements in validation-results.txt';
  ELSE
    RAISE NOTICE '⚠⚠⚠ DEPLOYMENT READINESS ISSUES ⚠⚠⚠';
    RAISE NOTICE '';
    RAISE NOTICE 'Issues found:';
    FOR i IN 1..array_length(v_warnings, 1) LOOP
      RAISE NOTICE '  %', v_warnings[i];
    END LOOP;
    RAISE NOTICE '';
    IF v_ready THEN
      RAISE NOTICE 'Status: CAN PROCEED (warnings only)';
    ELSE
      RAISE NOTICE 'Status: CANNOT PROCEED (critical errors)';
    END IF;
  END IF;
  RAISE NOTICE '';
END$$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '  PRE-DEPLOYMENT VALIDATION COMPLETE'
\echo '  Generated: ' `date`
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\set QUIET off
\timing off
