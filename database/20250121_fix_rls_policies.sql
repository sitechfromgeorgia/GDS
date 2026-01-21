-- GDS RLS Policies Security Fix Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Date: 2025-01-21
--
-- CRITICAL: This migration fixes security vulnerabilities in RLS policies
-- Run with a user that has appropriate permissions (service_role or database owner)

-- =============================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- =============================================

-- Function to get current user's role from profiles
CREATE OR REPLACE FUNCTION public.auth_get_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'anon');
END;
$$;

-- Function to check if current user is a restaurant
CREATE OR REPLACE FUNCTION public.auth_is_restaurant()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'restaurant'
  );
END;
$$;

-- Function to check if current user is a driver
CREATE OR REPLACE FUNCTION public.auth_is_driver()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'driver'
  );
END;
$$;

-- =============================================
-- STEP 2: FIX ORDERS POLICIES (CRITICAL!)
-- =============================================
-- Problem: "Users view orders" allows ANYONE to see ALL orders
-- Solution: Role-based access - restaurants see own, drivers see assigned, admin sees all

-- Remove old insecure policy
DROP POLICY IF EXISTS "Users view orders" ON public.orders;

-- Admin can view ALL orders
CREATE POLICY "Admins view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth_is_admin());

-- Restaurants can only view their OWN orders
CREATE POLICY "Restaurants view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth_is_restaurant()
  AND "restaurantId" = auth.uid()
);

-- Drivers can view orders assigned to them
CREATE POLICY "Drivers view assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth_is_driver()
  AND "driverId" = auth.uid()
);

-- Fix INSERT policy - only restaurants can create orders
DROP POLICY IF EXISTS "Users create orders" ON public.orders;
CREATE POLICY "Restaurants create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth_is_restaurant()
  AND "restaurantId" = auth.uid()
);

-- Fix UPDATE policy - role-based updates
DROP POLICY IF EXISTS "Users update orders" ON public.orders;

-- Admin can update any order
CREATE POLICY "Admins update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth_is_admin());

-- Drivers can update their assigned orders (status only via application logic)
CREATE POLICY "Drivers update assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth_is_driver()
  AND "driverId" = auth.uid()
);

-- =============================================
-- STEP 3: FIX PRODUCTS POLICIES
-- =============================================
-- Problem: Any authenticated user can manage products
-- Solution: Only admin can INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "Auth users manage products" ON public.products;

-- Only admin can manage products
CREATE POLICY "Admins manage products"
ON public.products
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- STEP 4: FIX CATEGORIES POLICIES
-- =============================================
-- Problem: Any authenticated user can write categories
-- Solution: Only admin can write

DROP POLICY IF EXISTS "Write categories" ON public.categories;

CREATE POLICY "Admins manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- STEP 5: FIX UNITS POLICIES
-- =============================================
-- Problem: Any authenticated user can write units
-- Solution: Only admin can write

DROP POLICY IF EXISTS "Write units" ON public.units;

CREATE POLICY "Admins manage units"
ON public.units
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- STEP 6: FIX PROFILES POLICIES
-- =============================================
-- Problem: Admin can't see other users' profiles
-- Solution: Add policy for admin to view all profiles

CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_is_admin());

-- Admin can update any profile
CREATE POLICY "Admins update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth_is_admin());

-- =============================================
-- STEP 7: ADD STORES MANAGEMENT POLICIES
-- =============================================
-- Problem: No INSERT/UPDATE/DELETE policies for stores
-- Solution: Add admin management policies

CREATE POLICY "Admins manage stores"
ON public.stores
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- STEP 8: FIX STORE_PRODUCTS POLICIES
-- =============================================
-- Problem: No write policies
-- Solution: Admin can manage

CREATE POLICY "Admins manage store_products"
ON public.store_products
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- STEP 9: FIX PRICE_HISTORY POLICIES
-- =============================================
-- Add admin write policy (auto-generated by triggers)

CREATE POLICY "Admins manage price_history"
ON public.price_history
FOR ALL
TO authenticated
USING (auth_is_admin())
WITH CHECK (auth_is_admin());

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these after applying to verify the changes:

/*
-- Check all policies
SELECT
  tablename,
  policyname,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test as different roles (in SQL Editor with role impersonation)
-- Set role to restaurant user and try to SELECT from orders
-- Should only see own orders
*/

-- =============================================
-- ROLLBACK (if needed)
-- =============================================
-- To rollback, you would need to recreate the original policies.
-- Keep a backup of your policies before running this migration.
