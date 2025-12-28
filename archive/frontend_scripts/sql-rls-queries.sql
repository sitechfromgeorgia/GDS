-- ===========================================
-- RLS Policy Queries for Georgian Distribution System
-- Direct SQL queries to verify Row Level Security implementation
-- ===========================================

-- 1. Get all tables with RLS enabled
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relname;

-- 2. Get all RLS policies for public schema
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT: ' || SUBSTRING(qual FROM 1 FOR 100)
        ELSE ''
    END as select_condition,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || SUBSTRING(with_check FROM 1 FOR 100)
        ELSE ''
    END as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check specific tables for the Georgian Distribution System
-- This query focuses on the core tables mentioned in the requirements

-- Profiles table policies
SELECT 'profiles' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

-- Products table policies
SELECT 'products' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'products'

UNION ALL

-- Orders table policies
SELECT 'orders' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'orders'

UNION ALL

-- Order items table policies
SELECT 'order_items' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'order_items'

UNION ALL

-- Notifications table policies
SELECT 'notifications' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notifications'

UNION ALL

-- Demo sessions table policies
SELECT 'demo_sessions' as table_name, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'demo_sessions'

ORDER BY table_name;

-- 4. Detailed policy analysis for critical tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'products', 'orders', 'order_items', 'notifications', 'demo_sessions')
ORDER BY tablename, policyname;

-- 5. RLS performance check - identify tables without proper indexing
SELECT 
    c.relname as table_name,
    CASE 
        WHEN i.indexname IS NOT NULL THEN 'Has indexes'
        ELSE 'No indexes found'
    END as index_status
FROM pg_class c
LEFT JOIN pg_index ix ON c.oid = ix.indrelid
LEFT JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname NOT LIKE 'pg_%'
GROUP BY c.relname, i.indexname
ORDER BY c.relname;

-- 6. Authentication context verification
SELECT 
    'Current user ID' as check_type,
    auth.uid()::text as result
WHERE auth.uid() IS NOT NULL

UNION ALL

SELECT 
    'Current user role' as check_type,
    current_setting('request.jwt.claim.role', true) as result;

-- 7. Comprehensive security assessment
SELECT 
    'Total tables' as metric,
    count(*) as count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'

UNION ALL

SELECT 
    'Tables with RLS' as metric,
    count(*) as count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' 
  AND c.relrowsecurity = true

UNION ALL

SELECT 
    'Total RLS policies' as metric,
    count(*) as count
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Tables without RLS' as metric,
    (
        SELECT count(*) 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
          AND c.relkind = 'r' 
          AND c.relrowsecurity = false
    ) as count;