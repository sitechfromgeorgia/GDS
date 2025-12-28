-- Create cart_snapshots table
CREATE TABLE IF NOT EXISTS cart_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, product_id)
);

-- Enable RLS
ALTER TABLE cart_snapshots ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_snapshots_restaurant ON cart_snapshots(restaurant_id);

-- RLS Policies

-- Allow restaurant to manage their own cart
CREATE POLICY "Restaurants can manage own cart" 
ON cart_snapshots FOR ALL
USING (
  (auth.jwt() ->> 'role')::text = 'restaurant' AND
  restaurant_id = auth.uid()
);
