-- Migration: Add transaction functions for atomic order creation
-- Created: 2025-11-21
-- Purpose: Ensures atomic order creation with proper rollback handling

BEGIN;

/**
 * Atomic order creation function with transaction support.
 *
 * Creates an order and its items in a single atomic transaction.
 * Automatically rolls back if any step fails.
 *
 * @param p_restaurant_id UUID - Restaurant creating the order
 * @param p_delivery_address TEXT - Delivery address
 * @param p_special_instructions TEXT - Optional special instructions
 * @param p_order_items JSONB - Array of order items with product_id and quantity
 * @returns orders ROW - The created order record
 *
 * Example usage:
 * SELECT * FROM create_order_with_items(
 *   'restaurant-uuid'::UUID,
 *   '123 Main St',
 *   'Ring doorbell',
 *   '[
 *     {"product_id": "product-uuid-1", "quantity": 5},
 *     {"product_id": "product-uuid-2", "quantity": 3}
 *   ]'::JSONB
 * );
 */
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_restaurant_id UUID,
  p_delivery_address TEXT,
  p_special_instructions TEXT DEFAULT NULL,
  p_order_items JSONB DEFAULT '[]'::JSONB
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_item JSONB;
BEGIN
  -- Validate inputs
  IF p_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'restaurant_id is required';
  END IF;

  IF p_delivery_address IS NULL OR LENGTH(TRIM(p_delivery_address)) = 0 THEN
    RAISE EXCEPTION 'delivery_address is required';
  END IF;

  IF jsonb_array_length(p_order_items) = 0 THEN
    RAISE EXCEPTION 'order must contain at least one item';
  END IF;

  -- Insert order (all in one transaction)
  INSERT INTO orders (
    restaurant_id,
    status,
    delivery_address,
    special_instructions,
    total_amount
  ) VALUES (
    p_restaurant_id,
    'pending',
    p_delivery_address,
    p_special_instructions,
    0 -- Will be calculated by admin
  )
  RETURNING * INTO v_order;

  -- Insert all order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      total_price
    ) VALUES (
      v_order.id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      0, -- Will be set by admin
      0, -- Will be calculated by admin
      0  -- Will be set by admin
    );
  END LOOP;

  -- Return the created order
  RETURN v_order;

EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the transaction
    RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION create_order_with_items IS
  'Atomically creates an order with items in a single transaction. Automatically rolls back on any error.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;

-- Create index for better performance on order lookups
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
  ON orders(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_product
  ON order_items(order_id, product_id);

COMMIT;
