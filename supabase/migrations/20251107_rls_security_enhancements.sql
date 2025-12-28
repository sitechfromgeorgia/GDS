-- ========================================
-- RLS SECURITY ENHANCEMENTS
-- ========================================
-- Migration: Fix RLS policy gaps and overly permissive policies
-- Created: 2025-11-07
-- Purpose: Tighten security by fixing gaps in Row Level Security policies

-- ========================================
-- FIX OVERLY PERMISSIVE PROFILES POLICY
-- ========================================

-- Drop the overly broad policy that allows restaurants to view all other restaurants
DROP POLICY IF EXISTS "profiles_select_restaurant_others" ON profiles;

-- Create more restrictive policy: Restaurants can only view their own assigned drivers
-- and admin profiles (for support purposes only)
CREATE POLICY "profiles_select_restaurant_limited" ON profiles
    FOR SELECT USING (
        get_user_role() = 'restaurant' AND
        (
            -- Can view admins (for support)
            role = 'admin' OR
            -- Can view drivers assigned to their orders
            (role = 'driver' AND id IN (
                SELECT DISTINCT driver_id FROM orders
                WHERE restaurant_id = auth.uid() AND driver_id IS NOT NULL
            ))
        )
    );

COMMENT ON POLICY "profiles_select_restaurant_limited" ON profiles IS
    'Restaurants can view admins and drivers assigned to their orders only';

-- ========================================
-- DEMO USER DATA ISOLATION
-- ========================================

-- Ensure demo users can only see their own demo session data
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "demo_sessions_select_own" ON demo_sessions;

-- Create stricter demo session policy
CREATE POLICY "demo_sessions_select_own_strict" ON demo_sessions
    FOR SELECT USING (
        user_id = auth.uid() AND
        expires_at > NOW() -- Only active sessions
    );

CREATE POLICY "demo_sessions_insert_own" ON demo_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        expires_at > NOW() -- Can only create future-dated sessions
    );

CREATE POLICY "demo_sessions_update_own" ON demo_sessions
    FOR UPDATE USING (
        user_id = auth.uid() AND
        expires_at > NOW() -- Can only update active sessions
    );

CREATE POLICY "demo_sessions_delete_own" ON demo_sessions
    FOR DELETE USING (
        user_id = auth.uid() OR
        get_user_role() = 'admin' -- Admins can cleanup
    );

COMMENT ON POLICY "demo_sessions_select_own_strict" ON demo_sessions IS
    'Users can only view their own active demo sessions';
COMMENT ON POLICY "demo_sessions_insert_own" ON demo_sessions IS
    'Users can only create their own demo sessions';
COMMENT ON POLICY "demo_sessions_update_own" ON demo_sessions IS
    'Users can only update their own active demo sessions';
COMMENT ON POLICY "demo_sessions_delete_own" ON demo_sessions IS
    'Users can delete their own sessions, admins can delete any';

-- ========================================
-- AUDIT LOG PROTECTION AND CLEANUP
-- ========================================

-- Add policy for audit log cleanup (admin only)
CREATE POLICY "audit_log_cleanup_admin" ON policy_audit_log
    FOR DELETE USING (
        get_user_role() = 'admin' AND
        timestamp < NOW() - INTERVAL '90 days' -- Only delete old entries
    );

COMMENT ON POLICY "audit_log_cleanup_admin" ON policy_audit_log IS
    'Admins can delete audit logs older than 90 days';

-- Create function for automatic audit log cleanup
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM policy_audit_log
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs() IS
    'Automatically cleanup audit logs older than 90 days';

-- ========================================
-- STORAGE POLICIES
-- ========================================

-- Note: Storage policies are handled separately via Supabase Storage API
-- But we can add RLS policies for a storage metadata table if it exists

-- Policy to allow users to delete their own uploads
-- This assumes storage objects are tracked in the database
CREATE POLICY IF NOT EXISTS "storage_delete_own" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-uploads' AND
        owner = auth.uid()
    );

COMMENT ON POLICY "storage_delete_own" ON storage.objects IS
    'Users can delete their own uploaded files';

-- ========================================
-- NOTIFICATION SECURITY
-- ========================================

-- Ensure notifications can't be created by non-admin users
-- Drop existing insert policy
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;

-- Create stricter notification creation policy
CREATE POLICY "notifications_insert_admin_only" ON notifications
    FOR INSERT WITH CHECK (
        get_user_role() = 'admin' OR
        get_user_role() IS NULL -- Allow system/trigger insertions
    );

COMMENT ON POLICY "notifications_insert_admin_only" ON notifications IS
    'Only admins and system can create notifications';

-- ========================================
-- ORDER ITEMS PROTECTION
-- ========================================

-- Ensure order items can't be modified after order is completed/cancelled
DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;

CREATE POLICY "order_items_update_admin_restricted" ON order_items
    FOR UPDATE USING (
        get_user_role() = 'admin' AND
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id
            AND status NOT IN ('completed', 'cancelled', 'delivered')
        )
    );

COMMENT ON POLICY "order_items_update_admin_restricted" ON order_items IS
    'Admins can only update order items for non-finalized orders';

-- ========================================
-- PRODUCT SECURITY
-- ========================================

-- Ensure soft-deleted products can't be ordered
DROP POLICY IF EXISTS "products_select_public_active" ON products;

CREATE POLICY "products_select_active_only" ON products
    FOR SELECT USING (
        is_active = true AND
        deleted_at IS NULL
    );

COMMENT ON POLICY "products_select_active_only" ON products IS
    'Only active, non-deleted products are visible';

-- ========================================
-- DEMO MODE RESTRICTIONS
-- ========================================

-- Prevent demo users from accessing real data
CREATE POLICY IF NOT EXISTS "orders_demo_isolation" ON orders
    FOR SELECT USING (
        CASE
            WHEN get_user_role() = 'demo' THEN
                -- Demo users can only see orders from demo sessions
                restaurant_id IN (
                    SELECT user_id FROM demo_sessions
                    WHERE user_id = auth.uid()
                    AND expires_at > NOW()
                )
            ELSE true -- Non-demo users see normal data
        END
    );

COMMENT ON POLICY "orders_demo_isolation" ON orders IS
    'Demo users can only view orders from their demo session';

-- ========================================
-- FUNCTION: CLEANUP EXPIRED DEMO SESSIONS
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_expired_demo_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete expired demo sessions
    DELETE FROM demo_sessions
    WHERE expires_at < NOW();

    -- Optionally: Delete demo user data (orders, notifications, etc.)
    -- Uncomment if you want to cleanup demo data automatically
    /*
    DELETE FROM orders
    WHERE restaurant_id IN (
        SELECT id FROM profiles WHERE role = 'demo'
    )
    AND created_at < NOW() - INTERVAL '24 hours';
    */
END;
$$;

COMMENT ON FUNCTION cleanup_expired_demo_sessions() IS
    'Cleanup expired demo sessions and optionally demo user data';

-- ========================================
-- SCHEDULED CLEANUP (Requires pg_cron extension)
-- ========================================

-- Note: This requires the pg_cron extension to be enabled
-- Run: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule audit log cleanup (daily at 2 AM)
/*
SELECT cron.schedule(
    'cleanup-old-audit-logs',
    '0 2 * * *', -- Daily at 2 AM
    $$SELECT cleanup_old_audit_logs();$$
);

-- Schedule demo session cleanup (hourly)
SELECT cron.schedule(
    'cleanup-expired-demo-sessions',
    '0 * * * *', -- Every hour
    $$SELECT cleanup_expired_demo_sessions();$$
);
*/

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify all policies are active
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE 'Total RLS policies: %', policy_count;

    IF policy_count < 50 THEN
        RAISE WARNING 'Low policy count detected. Expected at least 50 policies.';
    END IF;
END $$;
