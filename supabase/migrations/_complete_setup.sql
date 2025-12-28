-- ============================================================================
-- GEORGIAN DISTRIBUTION SYSTEM - COMPLETE DATABASE SETUP
-- Apply all migrations in order
-- Run this in: Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Initial Schema (20251102_initial_schema.sql)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'restaurant' CHECK (role IN ('admin', 'restaurant', 'driver', 'demo')),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ka TEXT, -- Georgian name
  description TEXT,
  description_ka TEXT, -- Georgian description
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  pickup_time TIMESTAMPTZ,
  delivery_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_update', 'delivery_update', 'system')),
  title TEXT NOT NULL,
  title_ka TEXT, -- Georgian title
  message TEXT NOT NULL,
  message_ka TEXT, -- Georgian message
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_audit_logs table
CREATE TABLE IF NOT EXISTS order_audit_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create demo_sessions table
CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create policy_audit_log table
CREATE TABLE IF NOT EXISTS policy_audit_log (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  row_id UUID,
  passed BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_id ON order_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_token ON demo_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_user_id ON demo_sessions(user_id);

-- ============================================================================
-- MIGRATION 2: Seed Data (20251103_seed_data.sql)
-- ============================================================================

-- Insert sample Georgian products
INSERT INTO products (name, name_ka, description, description_ka, price, category, is_available, stock_quantity)
VALUES
  ('Georgian Khachapuri', 'ხაჭაპური', 'Traditional Georgian cheese bread', 'ტრადიციული ქართული ყველის პური', 12.50, 'Bakery', true, 100),
  ('Khinkali (10 pcs)', 'ხინკალი (10 ცალი)', 'Georgian dumplings with meat', 'ქართული ხინკალი ხორცით', 15.00, 'Main Course', true, 50),
  ('Lobiani', 'ლობიანი', 'Bean-filled bread', 'ლობიოთი შიგთავსიანი პური', 8.50, 'Bakery', true, 80)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION 3: RLS Policies (20251104_rls_policies.sql)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_restaurant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'restaurant');
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_driver()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- Products policies (public read)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin());

-- Orders policies
DROP POLICY IF EXISTS "Restaurants can view own orders" ON orders;
CREATE POLICY "Restaurants can view own orders" ON orders FOR SELECT
  USING (restaurant_id = auth.uid() OR driver_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Restaurants can create orders" ON orders;
CREATE POLICY "Restaurants can create orders" ON orders FOR INSERT
  WITH CHECK (restaurant_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admins and owners can update orders" ON orders;
CREATE POLICY "Admins and owners can update orders" ON orders FOR UPDATE
  USING (restaurant_id = auth.uid() OR driver_id = auth.uid() OR is_admin());

-- Order items policies
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.restaurant_id = auth.uid() OR orders.driver_id = auth.uid() OR is_admin())
  ));

-- Deliveries policies
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries FOR SELECT
  USING (driver_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Drivers can update deliveries" ON deliveries;
CREATE POLICY "Drivers can update deliveries" ON deliveries FOR UPDATE
  USING (driver_id = auth.uid() OR is_admin());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Demo sessions policies (public for demo mode)
DROP POLICY IF EXISTS "Anyone can create demo sessions" ON demo_sessions;
CREATE POLICY "Anyone can create demo sessions" ON demo_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view demo sessions" ON demo_sessions;
CREATE POLICY "Anyone can view demo sessions" ON demo_sessions FOR SELECT
  USING (true);

-- ============================================================================
-- MIGRATION 4: Storage Buckets (20251105_storage_buckets.sql)
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for product images
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Verify all tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'products', 'orders', 'order_items', 'deliveries',
    'notifications', 'order_status_history', 'order_audit_logs',
    'demo_sessions', 'policy_audit_log'
  );

  RAISE NOTICE 'Created % out of 10 tables', table_count;
END $$;

-- Show summary
SELECT 'Migration completed successfully!' AS status,
       NOW() AS completed_at;
