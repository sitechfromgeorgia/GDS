# Database Schema

> **მონაცემთა ბაზის სქემა** | Complete database structure with RLS policies

---

## 📊 Schema Overview

**Database:** PostgreSQL 15+
**Tables:** 7 main tables
**RLS Policies:** 33+ comprehensive policies (Updated 2025-11-19)
**Indexes:** 12 strategic indexes (Fixed 2025-11-19)
**Triggers:** 3 automated triggers

**Recent Updates:**
- ✅ 2025-11-19: Added delivery_locations RLS policies (8 policies)
- ✅ 2025-11-19: Fixed performance indexes (removed non-existent deleted_at column)
- ✅ 2025-11-19: Security hardening complete

---

## 1. profiles

User profiles extending Supabase auth.users

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant', 'driver', 'demo')),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_view_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 2. products

Product catalog with Georgian language support

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_georgian TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'piece', 'liter', 'pack')),
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_available_products" ON products
  FOR SELECT USING (available = true);

CREATE POLICY "admin_manage_products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 3. orders

Central order management table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'in_transit',
    'delivered',
    'cancelled'
  )),
  total_amount DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  notes TEXT,
  cancellation_reason TEXT,
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
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Restaurant: Own orders only
CREATE POLICY "restaurant_select_own" ON orders
  FOR SELECT USING (restaurant_id = auth.uid());

CREATE POLICY "restaurant_insert_own" ON orders
  FOR INSERT WITH CHECK (restaurant_id = auth.uid());

-- Driver: Assigned orders only
CREATE POLICY "driver_select_assigned" ON orders
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "driver_update_assigned" ON orders
  FOR UPDATE USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid() AND status IN ('in_transit', 'delivered'));

-- Demo: Recent data only
CREATE POLICY "demo_read_recent" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'demo')
    AND created_at > NOW() - INTERVAL '7 days'
  );
```

---

## 4. order_items

Line items for each order

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- RLS Policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Inherit permissions from orders table
CREATE POLICY "order_items_access" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      -- RLS on orders table handles access control
    )
  );
```

---

## 5. notifications

User notification system

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_order',
    'order_confirmed',
    'order_in_transit',
    'order_delivered',
    'order_cancelled',
    'delivery_assigned',
    'delivery_cancelled',
    'status_changed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());
```

---

## 6. delivery_locations

GPS tracking for order deliveries

```sql
CREATE TABLE delivery_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes (Updated 2025-11-19)
CREATE INDEX idx_delivery_locations_order_id
  ON delivery_locations(order_id, timestamp DESC);

-- RLS Policies (Added 2025-11-19)
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- Admin: Full access to all delivery locations
CREATE POLICY "admin_select_all_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_insert_delivery_locations" ON delivery_locations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_delivery_locations" ON delivery_locations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_delivery_locations" ON delivery_locations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Driver: Can view and insert locations for assigned orders
CREATE POLICY "driver_select_assigned_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.driver_id = auth.uid()
    )
  );

CREATE POLICY "driver_insert_assigned_delivery_locations" ON delivery_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.driver_id = auth.uid()
      AND orders.status IN ('in_transit', 'confirmed')
    )
  );

-- Restaurant: Can view locations for their own orders
CREATE POLICY "restaurant_select_own_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.restaurant_id = auth.uid()
    )
  );

-- Demo: Read-only access to recent locations (last 7 days)
CREATE POLICY "demo_select_recent_delivery_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND timestamp >= NOW() - INTERVAL '7 days'
  );
```

**Usage:**
- Driver mobile app sends GPS coordinates during delivery
- Restaurant dashboard displays real-time delivery tracking
- Admin analytics for delivery route optimization

---

## 7. demo_sessions

Demo user session management

```sql
CREATE TABLE demo_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  feedback_submitted BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
CREATE INDEX idx_demo_sessions_expires_at ON demo_sessions(expires_at);

-- RLS Policies
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_own_sessions" ON demo_sessions
  FOR ALL USING (user_id = auth.uid());
```

---

## 🔄 Triggers & Functions

### 1. Auto-update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 2. Order status notification trigger

```sql
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Notify restaurant
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.restaurant_id,
      'status_changed',
      'Order Status Updated',
      'Your order #' || NEW.id || ' status changed to ' || NEW.status
    );

    -- Notify driver if assigned
    IF NEW.driver_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        NEW.driver_id,
        'status_changed',
        'Delivery Status Updated',
        'Order #' || NEW.id || ' status changed to ' || NEW.status
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();
```

### 3. Calculate order total from items

```sql
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  new_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO new_total
  FROM order_items
  WHERE order_id = NEW.order_id;

  UPDATE orders
  SET total_amount = new_total
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_total
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();
```

---

## 📈 Common Queries

### Get orders with items and products
```sql
SELECT
  o.id,
  o.status,
  o.total_amount,
  o.created_at,
  json_agg(
    json_build_object(
      'product_name', p.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    )
  ) as items
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
GROUP BY o.id;
```

### Analytics query
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Last Updated:** 2025-11-03
**Schema Version:** 1.0.0
**RLS Coverage:** 100% of tables
