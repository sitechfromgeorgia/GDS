# Database Schema - Complete Structure & RLS Policies

## Schema Overview

**Database:** PostgreSQL 15+
**Location:** Self-hosted Supabase (production), Supabase Cloud (development)
**Total Tables:** 6 core tables
**RLS Policies:** 25+ comprehensive policies
**Indexes:** 12 strategic indexes

---

## Table Structures

### 1. profiles

**Purpose:** User metadata and role management

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant', 'driver', 'demo')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users: Own profile only
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

---

### 2. products

**Purpose:** Product catalog (bilingual)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ka TEXT NOT NULL,  -- Georgian name
  name_en TEXT NOT NULL,  -- English name
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(available);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- All authenticated: Read available products
CREATE POLICY "Read available products" ON products
  FOR SELECT TO authenticated
  USING (available = true);

-- Demo: Read-only
CREATE POLICY "Demo read products" ON products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'demo'
    )
  );
```

---

### 3. orders

**Purpose:** Order master records

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'picked_up', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access orders" ON orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Restaurant: Own orders only
CREATE POLICY "Restaurant view own orders" ON orders
  FOR SELECT TO authenticated
  USING (restaurant_id = auth.uid());

CREATE POLICY "Restaurant create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    restaurant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'restaurant'
    )
  );

-- Driver: Assigned orders only
CREATE POLICY "Driver view assigned orders" ON orders
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'driver'
    )
  );

CREATE POLICY "Driver update assigned orders" ON orders
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (
    driver_id = auth.uid() AND
    status IN ('picked_up', 'delivered')
  );

-- Demo: Read-only, last 7 days
CREATE POLICY "Demo read recent orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'demo'
    ) AND
    created_at >= NOW() - INTERVAL '7 days'
  );
```

---

### 4. order_items

**Purpose:** Order line items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- RLS Policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access order_items" ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Restaurant: Own order items
CREATE POLICY "Restaurant view own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.restaurant_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant create order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.restaurant_id = auth.uid()
    )
  );

-- Driver: Assigned order items
CREATE POLICY "Driver view assigned order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.driver_id = auth.uid()
    )
  );

-- Demo: Read-only
CREATE POLICY "Demo read order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'demo'
    ) AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.created_at >= NOW() - INTERVAL '7 days'
    )
  );
```

---

### 5. notifications

**Purpose:** User-specific alerts

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Own notifications only
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System: Create notifications for any user (via service role)
```

---

### 6. demo_sessions

**Purpose:** Demo access management

```sql
CREATE TABLE demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
CREATE INDEX idx_demo_sessions_user_id ON demo_sessions(user_id);

-- RLS Policies
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "Admin full access demo_sessions" ON demo_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Demo users: Own sessions
CREATE POLICY "Demo view own sessions" ON demo_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

---

## Migration Strategy

### Migration Files (17 total)

**Naming Convention:** `YYYYMMDDHHMMSS_description.sql`

**Key Migrations:**

1. **Initial Schema** (20251105000001)
   - Create all tables
   - Initial RLS policies
   - Basic indexes

2. **Performance Indexes** (20251119000001)
   - Optimize query performance
   - Add composite indexes
   - Analyze query patterns

3. **RLS Refinement** (20251120-20251124)
   - Fix infinite recursion
   - Strict policy enforcement
   - Performance optimization

4. **Feature Additions** (20251121-20251125)
   - Order comments
   - Cart snapshots
   - Transaction functions
   - Deliveries table

### Migration Execution

```bash
# Development (Supabase CLI)
supabase db push

# Production (Manual)
psql -h data.greenland77.ge -U postgres -d postgres -f migration.sql
```

---

## RLS Policy Patterns

### 1. Admin Override Pattern

```sql
-- Used in ALL tables
EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
)
```

### 2. Tenant Isolation Pattern

```sql
-- Restaurant owns orders
restaurant_id = auth.uid()

-- Driver assigned to orders
driver_id = auth.uid()
```

### 3. Time-Based Access Pattern

```sql
-- Demo: Last 7 days only
created_at >= NOW() - INTERVAL '7 days'
```

### 4. Hierarchical Access Pattern

```sql
-- Order items inherit order access
EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
    AND orders.restaurant_id = auth.uid()
)
```

---

## Query Optimization Strategies

### Efficient Queries

**Good:**
```sql
-- Selective columns
SELECT id, status, total_amount FROM orders WHERE restaurant_id = $1;

-- Indexed filter
SELECT * FROM orders WHERE status = 'pending' AND created_at > $1;
```

**Bad:**
```sql
-- SELECT *
SELECT * FROM orders;

-- No index
SELECT * FROM orders WHERE total_amount > 100;
```

### Connection Pooling

**Supabase Built-in:**
- PgBouncer in transaction mode
- Max connections: 15 (free tier), scalable (paid)
- Connection timeout: 60 seconds

---

## Backup & Recovery

### Automated Backups (Supabase)

**Development:**
- Daily automated backups
- 7-day retention
- Point-in-time recovery

**Production (Self-hosted):**
```bash
# Daily backup script
pg_dump -h data.greenland77.ge -U postgres -Fc -d postgres > backup_$(date +%Y%m%d).dump

# Restore
pg_restore -h data.greenland77.ge -U postgres -d postgres backup_20251125.dump
```

---

## Database Monitoring

### Key Metrics

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries (pg_stat_statements)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

---

**This document provides complete database schema, RLS policies, migration strategy, and optimization techniques for the Georgian Distribution Management System.**
