# Database Schema Issues - Phase 1 Fixes

**Date:** 2025-11-19
**Status:** 🔴 Critical Issues Identified

---

## Issue #1: Missing `deleted_at` Column

### Problem
The performance indexes migration ([20251105000001_create_performance_indexes.sql](database/migrations/20251105000001_create_performance_indexes.sql)) references a `deleted_at` column that doesn't exist in any table schemas.

### Affected Tables
- `orders` (lines 30, 37, 44, 51, 58)
- `profiles` (lines 69, 76, 83)
- `products` (lines 94, 101)
- `order_items` (line 112)
- `delivery_locations` (line 123)

### Impact
- **Build Status:** ⚠️ Indexes created but will not filter correctly
- **Performance:** Indexes created but useless (WHERE clause always false)
- **Data Integrity:** No soft delete mechanism exists

### Current Schema (from .claude/knowledge/database-schema.md)
```sql
-- profiles: NO deleted_at
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders: NO deleted_at
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  driver_id UUID,
  status TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products: NO deleted_at
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Recommended Fix

**Option 1: Remove deleted_at from Indexes (Quick Fix - Recommended for Phase 1)**
```sql
-- Modified indexes without deleted_at
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);
-- Remove: WHERE deleted_at IS NULL

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role, created_at DESC);
-- Remove: WHERE deleted_at IS NULL
```

**Option 2: Add deleted_at Column (Future Enhancement - Phase 3)**
```sql
-- Add soft delete support
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE delivery_locations ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add indexes on deleted_at for performance
CREATE INDEX idx_orders_not_deleted ON orders(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_not_deleted ON profiles(id) WHERE deleted_at IS NULL;
```

**Decision:** Implementing Option 1 for Phase 1 immediate fix.

---

## Issue #2: Missing RLS Policy for `delivery_locations`

### Problem
The `delivery_locations` table has indexes but NO Row Level Security policies defined.

### Security Risk
🔴 **HIGH** - Unauthorized users could potentially access GPS tracking data.

### Current State
```sql
-- delivery_locations: Index exists
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_id
ON delivery_locations(order_id, timestamp DESC)
WHERE deleted_at IS NULL;

-- delivery_locations: NO RLS POLICIES!
```

### Recommended Fix
```sql
-- Enable RLS
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "admin_all_delivery_locations" ON delivery_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Driver: Own assigned orders only
CREATE POLICY "driver_view_assigned_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.driver_id = auth.uid()
    )
  );

-- Restaurant: Own orders only
CREATE POLICY "restaurant_view_own_order_locations" ON delivery_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_locations.order_id
      AND orders.restaurant_id = auth.uid()
    )
  );
```

---

## Implementation Plan

### Phase 1 (Immediate - This PR)
1. ✅ Document issues
2. ⏳ Create migration to fix indexes (remove deleted_at WHERE clause)
3. ⏳ Create RLS policies for delivery_locations
4. ⏳ Update `.claude/knowledge/database-schema.md` with accurate info

### Phase 2 (Next Week)
1. Implement soft delete architecture decision
2. Add deleted_at columns if approved
3. Update all queries to respect soft deletes
4. Add admin UI to manage deleted records

### Phase 3 (Next Month)
1. Audit all table schemas for consistency
2. Document all undocumented columns
3. Create comprehensive migration testing suite

---

## Files Modified

### Created
- `DATABASE_SCHEMA_ISSUES.md` - This document

### To Create
- `database/migrations/YYYYMMDD_fix_performance_indexes.sql` - Remove deleted_at
- `database/migrations/YYYYMMDD_add_delivery_locations_rls.sql` - Add RLS policies

### To Update
- `.claude/knowledge/database-schema.md` - Add delivery_locations table documentation

---

## Verification Checklist

- [ ] All indexes created successfully
- [ ] No references to non-existent columns
- [ ] RLS policies tested for all roles
- [ ] Documentation updated
- [ ] Supabase dashboard verified

---

**Next Steps:** Execute fixes in order listed above.
