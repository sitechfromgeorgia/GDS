# Database Setup

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document provides step-by-step instructions for setting up the PostgreSQL database schema, running migrations, configuring Row Level Security (RLS), and seeding initial data.

---

## Database Architecture

### Schema Overview

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│    profiles     │ (role: admin, restaurant, driver)
└────────┬────────┘
         │
         ├───────────────────────┐
         │                       │
         │ restaurant_id         │ driver_id
         ▼                       ▼
┌─────────────────┐      ┌──────────────┐
│     orders      │      │    orders    │
└────────┬────────┘      └──────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐      ┌──────────────┐
│   order_items   │─N:1──│   products   │
└─────────────────┘      └──────┬───────┘
                                │
                                │ N:1
                                ▼
                         ┌──────────────┐
                         │  categories  │
                         └──────────────┘

┌─────────────────┐
│ cart_sessions   │ (guest and authenticated carts)
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   cart_items    │
└─────────────────┘

┌─────────────────┐
│cart_activities  │ (audit log)
└─────────────────┘
```

---

## Step 1: Create Supabase Project

### Via Web Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Fill in project details:
   - **Name**: distribution-management (or your choice)
   - **Database Password**: Generate strong password (save securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier for development
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

---

## Step 2: Access Database

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your project dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New query**
4. Copy and paste migration SQL
5. Click **Run** or press `Ctrl/Cmd + Enter`

### Option 2: Direct Connection (Advanced)

Get connection string:
1. Go to **Settings** > **Database**
2. Copy **Connection string** (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with your database password

**Connection string format**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

**Using psql**:
```bash
psql "postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"
```

**Using DBeaver/pgAdmin**:
- Host: `db.your-project-ref.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: Your database password

---

## Step 3: Run Migrations

### Migration Files Location

```
frontend/supabase/migrations/
├── 20241103000000_initial_schema.sql         # Core tables
├── 20241103000001_rls_policies.sql           # Security policies
├── 20241103000002_indexes.sql                # Performance indexes
├── 20241103000003_functions_triggers.sql     # Database functions
└── 20241103000004_seed_data.sql              # Initial data
```

---

### Migration 1: Initial Schema

**File**: `20241103000000_initial_schema.sql`

**Purpose**: Create all tables with constraints and relationships

**Run in SQL Editor**:

```sql
-- =====================================================
-- INITIAL SCHEMA MIGRATION
-- =====================================================
-- Creates all core tables for the Distribution Management System
-- Tables: profiles, categories, products, orders, order_items,
--         cart_sessions, cart_items, cart_activities
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant', 'driver')),
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,

  -- Driver-specific fields
  is_available BOOLEAN DEFAULT false,
  current_location POINT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT valid_phone CHECK (phone ~ '^[0-9+\-\s()]+$')
);

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- TABLE: products
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit TEXT NOT NULL DEFAULT 'unit',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- TABLE: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  restaurant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'priced', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')
  ),
  total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE: order_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- TABLE: cart_sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Either user_id or session_token must be present
  CONSTRAINT cart_session_identifier CHECK (
    (user_id IS NOT NULL) OR (session_token IS NOT NULL)
  )
);

-- =====================================================
-- TABLE: cart_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cart_session_id UUID REFERENCES public.cart_sessions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique product per cart session
  UNIQUE(cart_session_id, product_id)
);

-- =====================================================
-- TABLE: cart_activities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cart_session_id UUID REFERENCES public.cart_sessions(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('add', 'update', 'remove', 'clear')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Initial schema migration completed successfully!' as message;
```

**Verify**:
```sql
-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- cart_activities, cart_items, cart_sessions, categories,
-- order_items, orders, products, profiles
```

---

### Migration 2: Row Level Security (RLS)

**File**: `20241103000001_rls_policies.sql`

**Purpose**: Enable RLS and create security policies

**Run in SQL Editor**:

```sql
-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Implements fine-grained access control at database level
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_view_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admins_view_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create profiles
CREATE POLICY "admins_create_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "admins_update_profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Anyone can view categories
CREATE POLICY "anyone_view_categories"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "admins_manage_categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Anyone can view available products
CREATE POLICY "anyone_view_products"
  ON public.products FOR SELECT
  USING (true);

-- Admins can manage all products
CREATE POLICY "admins_manage_products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Restaurants can create products
CREATE POLICY "restaurants_create_products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'restaurant'
    )
  );

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

-- Restaurants can view their own orders
CREATE POLICY "restaurants_view_own_orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = restaurant_id);

-- Drivers can view assigned orders
CREATE POLICY "drivers_view_assigned_orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = driver_id);

-- Admins can view all orders
CREATE POLICY "admins_view_all_orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Restaurants can create orders
CREATE POLICY "restaurants_create_orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id);

-- Restaurants can update their own orders (limited statuses)
CREATE POLICY "restaurants_update_own_orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = restaurant_id)
  WITH CHECK (auth.uid() = restaurant_id);

-- Drivers can update assigned orders
CREATE POLICY "drivers_update_assigned_orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Admins can update any order
CREATE POLICY "admins_update_orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- ORDER ITEMS POLICIES
-- =====================================================

-- Users can view order items if they can view the order
CREATE POLICY "users_view_order_items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.restaurant_id = auth.uid()
        OR o.driver_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Restaurants can create order items for their orders
CREATE POLICY "restaurants_create_order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND restaurant_id = auth.uid()
    )
  );

-- =====================================================
-- CART POLICIES
-- =====================================================

-- Users can view their own cart
CREATE POLICY "users_view_own_cart"
  ON public.cart_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own cart
CREATE POLICY "users_manage_own_cart"
  ON public.cart_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Cart items follow cart session permissions
CREATE POLICY "users_manage_cart_items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cart_sessions
      WHERE id = cart_items.cart_session_id
      AND user_id = auth.uid()
    )
  );

-- Cart activities follow cart session permissions
CREATE POLICY "users_view_cart_activities"
  ON public.cart_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cart_sessions
      WHERE id = cart_activities.cart_session_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'RLS policies migration completed successfully!' as message;
```

**Verify**:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### Migration 3: Performance Indexes

**File**: `20241103000002_indexes.sql`

**Purpose**: Create indexes for query optimization

**Run in SQL Editor**:

```sql
-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Creates indexes on frequently queried columns
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON public.profiles(is_available) WHERE role = 'driver';
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Cart sessions indexes
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON public.cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_token ON public.cart_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at ON public.cart_sessions(expires_at);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_session_id ON public.cart_items(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Cart activities indexes
CREATE INDEX IF NOT EXISTS idx_cart_activities_cart_session_id ON public.cart_activities(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_activities_created_at ON public.cart_activities(created_at DESC);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Performance indexes migration completed successfully!' as message;
```

**Verify**:
```sql
-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

### Migration 4: Functions and Triggers

**File**: `20241103000003_functions_triggers.sql`

**Run in SQL Editor**:

```sql
-- =====================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function: Cleanup expired cart sessions
CREATE OR REPLACE FUNCTION cleanup_expired_cart_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_sessions
  WHERE expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Functions and triggers migration completed successfully!' as message;
```

---

### Migration 5: Seed Data

**File**: `20241103000004_seed_data.sql`

**Purpose**: Insert initial categories and admin user

**Run in SQL Editor**:

```sql
-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert categories
INSERT INTO public.categories (name, description) VALUES
  ('Beverages', 'Drinks and beverages'),
  ('Dairy', 'Milk and dairy products'),
  ('Bakery', 'Bread and baked goods'),
  ('Meat', 'Fresh and frozen meat'),
  ('Produce', 'Fresh fruits and vegetables'),
  ('Snacks', 'Chips, cookies, and snacks'),
  ('Frozen', 'Frozen foods'),
  ('Canned', 'Canned goods')
ON CONFLICT (name) DO NOTHING;

-- Note: Admin user must be created through Supabase Auth UI or signup flow
-- After creating admin user, update their role:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Seed data migration completed successfully!' as message;
SELECT 'Remember to create admin user and set role = ''admin''' as reminder;
```

---

## Step 4: Verify Database Setup

### Check Tables

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check RLS

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Check Indexes

```sql
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### Check Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

---

## Step 5: Create Admin User

### Via Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Fill in:
   - Email: admin@example.com
   - Password: (strong password)
   - Email Confirmation: Send (or Auto Confirm)
4. Click **Create user**

### Update Role to Admin

```sql
-- Replace 'user-uuid' with actual user ID from auth.users
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'user-uuid-from-auth-users';

-- Verify
SELECT id, role, full_name FROM public.profiles WHERE role = 'admin';
```

---

## Next Steps

After database setup:

1. ✅ Verify all migrations completed successfully
2. ✅ Create admin user and set role
3. ✅ Proceed to [Frontend Deployment](./frontend-deployment.md)
4. Test authentication flow
5. Test order creation

---

## Related Documentation

- [Environment Setup](./environment-setup.md) - Configure environment variables
- [Supabase Configuration](./supabase-config.md) - Configure Supabase project
- [Architecture: Database Schema](../architecture/database-schema.md) - Detailed schema documentation

---

**End of Database Setup Documentation**
