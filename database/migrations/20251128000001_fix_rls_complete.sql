-- Migration: Complete RLS Fix for Products, Orders, and Cart
-- Created: 2025-11-28
-- Issue: RLS policies blocking service_role and authenticated users
-- Solution: Complete overhaul of RLS policies with proper service_role bypass

-- =============================================================================
-- STEP 1: Create is_admin() helper function (security definer)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- =============================================================================
-- STEP 2: PRODUCTS TABLE - Fix RLS
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow service_role to bypass RLS (for admin operations)
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

-- Drop all existing product policies to start fresh
DROP POLICY IF EXISTS "products_select_safe" ON public.products;
DROP POLICY IF EXISTS "products_select_recursive" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

-- Create new simplified policies
CREATE POLICY "service_role_full_access_products"
  ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_can_read_products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_can_manage_products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- STEP 3: ORDERS TABLE - Fix RLS
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

-- Drop existing order policies
DROP POLICY IF EXISTS "orders_select_safe" ON public.orders;
DROP POLICY IF EXISTS "orders_select_recursive" ON public.orders;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
DROP POLICY IF EXISTS "Restaurants can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;

-- Create new policies for orders
CREATE POLICY "service_role_full_access_orders"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "restaurant_can_view_own_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (restaurant_id = auth.uid());

CREATE POLICY "restaurant_can_create_orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_id = auth.uid());

CREATE POLICY "driver_can_view_assigned_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "driver_can_update_assigned_orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "admin_full_access_orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- STEP 4: ORDER_ITEMS TABLE - Fix RLS
-- =============================================================================

-- Check if order_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    -- Ensure RLS is enabled
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "service_role_full_access_order_items" ON public.order_items';
    EXECUTE 'DROP POLICY IF EXISTS "users_can_view_own_order_items" ON public.order_items';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access_order_items" ON public.order_items';

    -- Create new policies
    EXECUTE 'CREATE POLICY "service_role_full_access_order_items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "users_can_view_own_order_items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.restaurant_id = auth.uid() OR orders.driver_id = auth.uid())))';
    EXECUTE 'CREATE POLICY "admin_full_access_order_items" ON public.order_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
  END IF;
END $$;

-- =============================================================================
-- STEP 5: CART_SNAPSHOTS TABLE - Create if not exists
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cart_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, product_id)
);

-- Enable RLS on cart_snapshots
ALTER TABLE public.cart_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_snapshots FORCE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "service_role_full_access_cart" ON public.cart_snapshots;
DROP POLICY IF EXISTS "users_can_manage_own_cart" ON public.cart_snapshots;
DROP POLICY IF EXISTS "admin_full_access_cart" ON public.cart_snapshots;

-- Create policies for cart_snapshots
CREATE POLICY "service_role_full_access_cart"
  ON public.cart_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_can_manage_own_cart"
  ON public.cart_snapshots
  FOR ALL
  TO authenticated
  USING (restaurant_id = auth.uid())
  WITH CHECK (restaurant_id = auth.uid());

CREATE POLICY "admin_full_access_cart"
  ON public.cart_snapshots
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create index for cart lookups
CREATE INDEX IF NOT EXISTS idx_cart_snapshots_restaurant ON public.cart_snapshots(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_snapshots_product ON public.cart_snapshots(product_id);

-- =============================================================================
-- STEP 6: PROFILES TABLE - Ensure proper RLS
-- =============================================================================

-- Drop potentially problematic policies
DROP POLICY IF EXISTS "profiles_select_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_recursive" ON public.profiles;

-- Ensure service_role has access
CREATE POLICY "service_role_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can see their own profile
CREATE POLICY "users_can_view_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "admin_can_view_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can manage all profiles
CREATE POLICY "admin_can_manage_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- STEP 7: Grant necessary permissions
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO authenticated;

GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT ALL ON public.cart_snapshots TO service_role;
GRANT ALL ON public.cart_snapshots TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- =============================================================================

-- Check policies
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('products', 'orders', 'profiles', 'cart_snapshots')
-- ORDER BY tablename, policyname;

-- Test product access (as service_role)
-- SELECT COUNT(*) FROM public.products;

-- Test order access (as service_role)
-- SELECT COUNT(*) FROM public.orders;
