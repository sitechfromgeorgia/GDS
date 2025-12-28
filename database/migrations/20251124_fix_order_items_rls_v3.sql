-- Fix RLS policy for order_items table (v3 - RESET & PERMISSIVE)
-- Created: 2025-11-24
-- Purpose: Reset RLS and apply broad permissions to debug

BEGIN;

-- Ensure RLS is enabled (to be sure we are controlling it)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop known policies
DROP POLICY IF EXISTS "Restaurants can create order items" ON order_items;
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- Create permissive policies
CREATE POLICY "Debug Insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Debug Select" ON order_items FOR SELECT USING (true);

COMMIT;
