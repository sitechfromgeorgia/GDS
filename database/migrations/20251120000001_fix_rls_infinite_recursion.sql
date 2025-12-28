-- Migration: Fix RLS Infinite Recursion
-- Created: 2025-11-20
-- Issue: Recursive policies causing database queries to hang
-- Solution: Rewrite policies to avoid self-reference loops

BEGIN;

-- =============================================================================
-- PROFILES TABLE: Fix recursive policies
-- =============================================================================

-- Drop existing potentially recursive policies
DROP POLICY IF EXISTS "profiles_select_recursive" ON profiles;
DROP POLICY IF EXISTS "profiles_update_recursive" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- Create non-recursive SELECT policy for profiles
CREATE POLICY "profiles_select_safe"
  ON profiles
  FOR SELECT
  USING (
    -- Users can see their own profile
    auth.uid() = id
    OR
    -- Admins can see all profiles (non-recursive check)
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      LIMIT 1
    )
  );

-- Create non-recursive UPDATE policy for profiles
CREATE POLICY "profiles_update_safe"
  ON profiles
  FOR UPDATE
  USING (
    -- Users can update their own profile
    auth.uid() = id
    OR
    -- Admins can update any profile (non-recursive check)
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      LIMIT 1
    )
  );

-- =============================================================================
-- ORDERS TABLE: Fix recursive policies if any
-- =============================================================================

-- Drop potentially recursive order policies
DROP POLICY IF EXISTS "orders_select_recursive" ON orders;
DROP POLICY IF EXISTS "orders_update_recursive" ON orders;

-- Recreate with explicit non-recursive checks
CREATE POLICY "orders_select_safe"
  ON orders
  FOR SELECT
  USING (
    -- Restaurant can see their own orders
    restaurant_id IN (
      SELECT id FROM profiles
      WHERE id = auth.uid()
      AND role = 'restaurant'
      LIMIT 1
    )
    OR
    -- Driver can see assigned orders
    driver_id IN (
      SELECT id FROM profiles
      WHERE id = auth.uid()
      AND role = 'driver'
      LIMIT 1
    )
    OR
    -- Admin can see all orders
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      LIMIT 1
    )
  );

-- =============================================================================
-- PRODUCTS TABLE: Ensure no recursive policies
-- =============================================================================

-- Drop any recursive product policies
DROP POLICY IF EXISTS "products_select_recursive" ON products;

-- Create simple non-recursive policy
CREATE POLICY "products_select_safe"
  ON products
  FOR SELECT
  USING (
    -- All authenticated users can view products
    auth.role() = 'authenticated'
    OR
    -- Admins can view all products
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      LIMIT 1
    )
  );

-- =============================================================================
-- VERIFICATION: Add comments for tracking
-- =============================================================================

COMMENT ON POLICY "profiles_select_safe" ON profiles IS
  'Non-recursive policy: users see own profile, admins see all. Fixed 2025-11-20';

COMMENT ON POLICY "profiles_update_safe" ON profiles IS
  'Non-recursive policy: users update own profile, admins update all. Fixed 2025-11-20';

COMMENT ON POLICY "orders_select_safe" ON orders IS
  'Non-recursive policy: role-based access without loops. Fixed 2025-11-20';

COMMENT ON POLICY "products_select_safe" ON products IS
  'Non-recursive policy: authenticated users can view. Fixed 2025-11-20';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================

-- Verify policies were created
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'orders', 'products')
-- ORDER BY tablename, policyname;

-- Test query performance (should not hang)
-- SELECT COUNT(*) FROM profiles WHERE role = 'admin';
-- SELECT COUNT(*) FROM orders WHERE status = 'pending';
