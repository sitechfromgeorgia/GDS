-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  pickup_time TIMESTAMPTZ,
  delivery_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);

-- Deliveries policies
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries FOR SELECT
  USING (driver_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Drivers can update deliveries" ON deliveries;
CREATE POLICY "Drivers can update deliveries" ON deliveries FOR UPDATE
  USING (driver_id = auth.uid() OR is_admin());
