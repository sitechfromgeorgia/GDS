# Database Schema Documentation

**Database**: PostgreSQL 15.x
**Provider**: Supabase
**Last Updated**: 2025-11-05

---

## Table of Contents
1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Row Level Security](#row-level-security)
7. [Database Functions](#database-functions)
8. [Triggers](#triggers)

---

## Overview

The database schema consists of 8 primary tables organized around user profiles, products, orders, and cart management. All tables use UUIDs as primary keys and include audit timestamps.

### Design Principles
- ✅ **Normalized**: 3NF compliance for data integrity
- ✅ **Secure**: Row Level Security (RLS) on all tables
- ✅ **Performant**: 15+ indexes for query optimization
- ✅ **Auditable**: Created/updated timestamps on all tables
- ✅ **Type-Safe**: Strong type constraints and check constraints

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA (ERD)                           │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   auth.users     │
                    │   (Supabase)     │
                    └────────┬─────────┘
                             │
                             │ 1:1
                             ▼
                    ┌──────────────────┐
               ┌────│    profiles      │────┐
               │    │ ================  │    │
               │    │ id (PK)          │    │
               │    │ email            │    │
               │    │ full_name        │    │
               │    │ role             │    │
               │    │ is_active        │    │
               │    └──────────────────┘    │
               │                             │
               │ restaurant_id               │ driver_id
               │ (role=restaurant)           │ (role=driver)
               │                             │
               ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │     orders       │         │     orders       │
    │ ================ │         │ ================ │
    │ id (PK)          │◄────────┤ driver_id (FK)   │
    │ restaurant_id(FK)│         │                  │
    │ status           │         │                  │
    │ total_amount     │         │                  │
    └────────┬─────────┘         └──────────────────┘
             │
             │ 1:N
             ▼
    ┌──────────────────┐
    │   order_items    │         ┌──────────────────┐
    │ ================ │    ┌────│    products      │
    │ id (PK)          │    │    │ ================ │
    │ order_id (FK)    │    │    │ id (PK)          │
    │ product_id (FK)  │────┘    │ name             │
    │ quantity         │         │ price            │
    │ unit_price       │         │ category_id (FK) │
    │ total_price      │         │ is_available     │
    └──────────────────┘         └────────┬─────────┘
                                          │
                                          │ N:1
                                          ▼
                                 ┌──────────────────┐
                                 │   categories     │
                                 │ ================ │
                                 │ id (PK)          │
                                 │ name             │
                                 │ slug             │
                                 └──────────────────┘

    ┌──────────────────┐
    │  cart_sessions   │
    │ ================ │
    │ id (PK)          │
    │ session_token    │
    │ user_id (FK)     │─────┐
    │ is_active        │     │
    │ expires_at       │     │ 1:1
    └────────┬─────────┘     │ (optional)
             │                │
             │ 1:N            ▼
             ▼         ┌──────────────────┐
    ┌──────────────────┐    │   profiles       │
    │   cart_items     │    └──────────────────┘
    │ ================ │
    │ id (PK)          │
    │ cart_session_id  │
    │ product_id (FK)  │────┐
    │ quantity         │    │
    │ unit_price       │    │ N:1
    │ total_price      │    │
    └──────────────────┘    ▼
                     ┌──────────────────┐
                     │    products      │
                     └──────────────────┘

    ┌──────────────────┐
    │ cart_activities  │
    │ ================ │
    │ id (PK)          │
    │ cart_session_id  │────┐
    │ activity_type    │    │ N:1
    │ product_id       │    │
    │ old_quantity     │    │
    │ new_quantity     │    ▼
    └──────────────────┘  ┌──────────────────┐
                          │  cart_sessions   │
                          └──────────────────┘

Legend:
  PK  = Primary Key
  FK  = Foreign Key
  1:1 = One-to-One Relationship
  1:N = One-to-Many Relationship
  N:1 = Many-to-One Relationship
```

---

## Tables

### 1. profiles

User profile information with role-based data.

```sql
CREATE TABLE profiles (
  -- Primary Key
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Role and Status
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,

  -- Address
  address TEXT,
  location GEOGRAPHY(POINT),
  city VARCHAR(100),
  postal_code VARCHAR(20),

  -- Driver-specific Fields
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(50),
  vehicle_info JSONB,
  license_number VARCHAR(100),
  license_expiry DATE,

  -- Restaurant-specific Fields
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  tax_id VARCHAR(50),

  -- Metadata
  metadata JSONB,
  notes TEXT,
  last_seen_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('admin', 'restaurant', 'driver')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[\d\s-()]+$')
);

-- Enum
CREATE TYPE user_role AS ENUM ('admin', 'restaurant', 'driver');
```

**Indexes**:
```sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_is_available ON profiles(is_available) WHERE is_available = true;
CREATE INDEX idx_profiles_location ON profiles USING GIST(location) WHERE location IS NOT NULL;
```

---

### 2. categories

Product categories for organization.

```sql
CREATE TABLE categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category Information
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,

  -- Hierarchy (for nested categories)
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Display Order
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_is_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_display_order ON categories(display_order);
```

---

### 3. products

Product catalog with pricing and inventory.

```sql
CREATE TABLE products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),

  -- Category
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Media
  image_url TEXT,
  images JSONB, -- Array of image URLs

  -- Inventory
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
  unit VARCHAR(50) DEFAULT 'unit',

  -- Status
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB,
  tags TEXT[], -- Array of tags

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_unit CHECK (unit IN ('unit', 'kg', 'g', 'l', 'ml', 'piece'))
);
```

**Indexes**:
```sql
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available) WHERE is_available = true;
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('simple', name));
```

---

### 4. orders

Customer orders with delivery information.

```sql
CREATE TABLE orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order Number (human-readable)
  order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Relationships
  restaurant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status and Priority
  status order_status DEFAULT 'pending',
  priority order_priority DEFAULT 'normal',

  -- Pricing
  subtotal DECIMAL(10, 2) DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
  discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),

  -- Delivery Information
  delivery_address TEXT NOT NULL,
  delivery_location GEOGRAPHY(POINT),
  delivery_notes TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,

  -- Customer Contact
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Metadata
  notes TEXT,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enums
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'priced',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled'
);

CREATE TYPE order_priority AS ENUM ('low', 'normal', 'high', 'urgent');
```

**Indexes**:
```sql
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);
```

---

### 5. order_items

Line items for orders.

```sql
CREATE TABLE order_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Product Snapshot (at time of order)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),

  -- Quantity and Pricing
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),

  -- Customization
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;
```

---

### 6. cart_sessions

Shopping cart sessions for users.

```sql
CREATE TABLE cart_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session Identification
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_cart_sessions_session_token ON cart_sessions(session_token);
CREATE INDEX idx_cart_sessions_user_id ON cart_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_sessions_is_active ON cart_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_cart_sessions_expires_at ON cart_sessions(expires_at);
```

---

### 7. cart_items

Items in shopping carts.

```sql
CREATE TABLE cart_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Quantity and Pricing
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),

  -- Customization
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one product per cart
  UNIQUE(cart_session_id, product_id)
);
```

**Indexes**:
```sql
CREATE INDEX idx_cart_items_cart_session_id ON cart_items(cart_session_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

---

### 8. cart_activities

Activity log for cart changes (for real-time updates).

```sql
CREATE TABLE cart_activities (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Activity Type
  activity_type cart_activity_type NOT NULL,

  -- Changes
  old_quantity INTEGER,
  new_quantity INTEGER,
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum
CREATE TYPE cart_activity_type AS ENUM (
  'item_added',
  'item_updated',
  'item_removed',
  'cart_cleared'
);
```

**Indexes**:
```sql
CREATE INDEX idx_cart_activities_cart_session_id ON cart_activities(cart_session_id);
CREATE INDEX idx_cart_activities_created_at ON cart_activities(created_at DESC);
```

---

## Relationships

### One-to-One (1:1)

| Parent Table | Child Table | Relationship |
|-------------|-------------|--------------|
| `auth.users` | `profiles` | Each auth user has one profile |

### One-to-Many (1:N)

| Parent Table | Child Table | Foreign Key | Description |
|-------------|-------------|-------------|-------------|
| `profiles` (restaurant) | `orders` | `restaurant_id` | Restaurant creates many orders |
| `profiles` (driver) | `orders` | `driver_id` | Driver handles many orders |
| `categories` | `products` | `category_id` | Category contains many products |
| `orders` | `order_items` | `order_id` | Order contains many items |
| `cart_sessions` | `cart_items` | `cart_session_id` | Cart contains many items |
| `cart_sessions` | `cart_activities` | `cart_session_id` | Cart has many activities |

### Many-to-One (N:1)

| Child Table | Parent Table | Foreign Key | Description |
|------------|-------------|-------------|-------------|
| `order_items` | `products` | `product_id` | Many order items reference one product |
| `cart_items` | `products` | `product_id` | Many cart items reference one product |

---

## Row Level Security (RLS)

All tables have RLS enabled with role-based policies.

### Example: profiles table

```sql
-- Users can view own profile
CREATE POLICY "users_view_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admins_view_all_profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Example: orders table

```sql
-- Restaurants view own orders
CREATE POLICY "restaurants_view_own_orders"
  ON orders FOR SELECT
  USING (auth.uid() = restaurant_id);

-- Drivers view assigned orders
CREATE POLICY "drivers_view_assigned_orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'driver'
      AND (orders.driver_id = auth.uid() OR orders.status IN ('priced', 'assigned'))
    )
  );

-- Admins view all orders
CREATE POLICY "admins_view_all_orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

---

## Database Functions

### 1. Update Updated At Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Handle New User (Auto-create Profile)

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Cleanup Expired Cart Sessions

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_cart_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_sessions
  WHERE expires_at < NOW()
  AND is_active = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### 1. Update Timestamps

```sql
-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all tables)
```

### 2. Auto-create Profile on User Signup

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## Views

### cart_session_summary

Aggregated cart statistics.

```sql
CREATE VIEW cart_session_summary AS
SELECT
  cs.id,
  cs.session_token,
  cs.user_id,
  COUNT(ci.id) AS item_count,
  SUM(ci.quantity) AS total_quantity,
  SUM(ci.total_price) AS total_price,
  cs.created_at,
  cs.updated_at
FROM cart_sessions cs
LEFT JOIN cart_items ci ON cs.id = ci.cart_session_id
GROUP BY cs.id;
```

---

## Database Migrations

All schema changes are managed through Supabase migrations:

```
supabase/migrations/
├── 20240101000000_initial_schema.sql
├── 20240102000000_add_cart_tables.sql
├── 20240103000000_add_indexes.sql
├── 20240104000000_add_rls_policies.sql
└── 20240105000000_add_triggers.sql
```

---

## Related Documentation

- [System Overview](./system-overview.md)
- [Auth Flow](./auth-flow.md)
- [Order Flow](./order-flow.md)
- [API Documentation](../api/README.md)

---

**End of Database Schema Documentation**
