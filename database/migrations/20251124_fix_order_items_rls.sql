-- Fix RLS policy for order_items table
-- Created: 2025-11-24
-- Purpose: Allow restaurants to insert order items for their own orders

BEGIN;

-- Drop existing policy if it exists (unlikely given the error, but good practice)
DROP POLICY IF EXISTS "Restaurants can create order items" ON order_items;

-- Create INSERT policy
CREATE POLICY "Restaurants can create order items" ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.restaurant_id = auth.uid() OR is_admin())
  )
);

COMMIT;
