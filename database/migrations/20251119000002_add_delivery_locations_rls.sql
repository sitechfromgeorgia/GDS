-- =====================================================
-- ADD RLS POLICIES FOR delivery_locations TABLE
-- =====================================================
-- Migration: Add Row Level Security policies for delivery_locations
-- Issue: delivery_locations table has no RLS policies (security risk!)
-- Solution: Add comprehensive RLS policies for admin, driver, and restaurant roles
-- Impact: Prevents unauthorized access to GPS tracking data
-- Date: 2025-11-19
-- Phase: 1 - Critical Security Fixes
-- =====================================================

BEGIN;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on delivery_locations table
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN POLICIES - Full Access
-- =====================================================

-- Admin can view all delivery locations
CREATE POLICY "admin_select_all_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert delivery locations (for testing/manual entry)
CREATE POLICY "admin_insert_delivery_locations" ON delivery_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update delivery locations
CREATE POLICY "admin_update_delivery_locations" ON delivery_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete delivery locations
CREATE POLICY "admin_delete_delivery_locations" ON delivery_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- DRIVER POLICIES - Assigned Orders Only
-- =====================================================

-- Driver can view locations for their assigned orders
CREATE POLICY "driver_select_assigned_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.driver_id = auth.uid()
    )
  );

-- Driver can insert locations for their assigned orders
-- (GPS tracking updates during delivery)
CREATE POLICY "driver_insert_assigned_delivery_locations" ON delivery_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.driver_id = auth.uid()
      AND orders.status IN ('in_transit', 'confirmed')
    )
  );

-- =====================================================
-- RESTAURANT POLICIES - Own Orders Only
-- =====================================================

-- Restaurant can view locations for their own orders
-- (Track delivery progress of their orders)
CREATE POLICY "restaurant_select_own_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.restaurant_id = auth.uid()
    )
  );

-- Restaurants cannot insert/update/delete delivery locations
-- (Only drivers can track their own location)

-- =====================================================
-- DEMO ROLE POLICIES - Recent Data Only
-- =====================================================

-- Demo users can view recent delivery locations (last 7 days)
CREATE POLICY "demo_select_recent_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND timestamp >= NOW() - INTERVAL '7 days'
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'delivery_locations';

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'delivery_locations';

    IF rls_enabled THEN
        RAISE NOTICE 'SUCCESS: RLS is enabled on delivery_locations';
    ELSE
        RAISE WARNING 'WARNING: RLS is NOT enabled on delivery_locations';
    END IF;

    IF policy_count = 8 THEN
        RAISE NOTICE 'SUCCESS: All 8 RLS policies created for delivery_locations';
    ELSE
        RAISE WARNING 'WARNING: Expected 8 policies but found %', policy_count;
    END IF;
END $$;

-- List all policies for verification
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'delivery_locations'
ORDER BY policyname;

COMMIT;

-- =====================================================
-- NOTES
-- =====================================================
-- Security Model:
-- 1. Admin: Full CRUD access to all delivery locations
-- 2. Driver: Can view and insert locations for assigned orders
-- 3. Restaurant: Can view locations for their own orders
-- 4. Demo: Read-only access to recent locations (last 7 days)
--
-- GPS Tracking Flow:
-- 1. Driver accepts order → order.driver_id = driver's user ID
-- 2. Driver starts delivery → order.status = 'in_transit'
-- 3. Driver's mobile app sends GPS updates → INSERT delivery_locations
-- 4. Restaurant tracks delivery → SELECT delivery_locations
-- 5. Driver completes delivery → order.status = 'delivered'
--
-- Privacy Considerations:
-- - Drivers can only track location for active deliveries
-- - Location history is accessible to admin for analytics
-- - Restaurants can track delivery progress but not driver's full history
-- - Demo users have limited time-based access
-- =====================================================
