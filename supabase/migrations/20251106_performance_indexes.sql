-- ========================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- ========================================
-- Migration: Add missing indexes for common query patterns
-- Created: 2025-11-06
-- Purpose: Improve query performance for orders, order_items, and notifications

-- ========================================
-- ORDERS TABLE INDEXES
-- ========================================

-- Composite index for restaurant orders filtering and sorting
-- Supports: SELECT * FROM orders WHERE restaurant_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created
ON orders(restaurant_id, status, created_at DESC);

-- Composite index for driver orders filtering and sorting
-- Supports: SELECT * FROM orders WHERE driver_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_driver_status_created
ON orders(driver_id, status, created_at DESC);

-- Index for order status filtering (used by admins)
-- Supports: SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);

-- Index for recent orders queries
-- Supports: SELECT * FROM orders ORDER BY created_at DESC LIMIT ?
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
ON orders(created_at DESC);

COMMENT ON INDEX idx_orders_restaurant_status_created IS 'Optimizes restaurant order queries with status filtering';
COMMENT ON INDEX idx_orders_driver_status_created IS 'Optimizes driver order queries with status filtering';
COMMENT ON INDEX idx_orders_status_created IS 'Optimizes admin order queries by status';
COMMENT ON INDEX idx_orders_created_at_desc IS 'Optimizes recent orders queries';

-- ========================================
-- ORDER_ITEMS TABLE INDEXES
-- ========================================

-- Composite index for order items lookup
-- Supports: SELECT * FROM order_items WHERE order_id = ? AND product_id = ?
-- Also supports: SELECT * FROM order_items WHERE order_id = ?
CREATE INDEX IF NOT EXISTS idx_order_items_order_product
ON order_items(order_id, product_id);

-- Index for product-based queries (used in analytics)
-- Supports: SELECT * FROM order_items WHERE product_id = ?
CREATE INDEX IF NOT EXISTS idx_order_items_product
ON order_items(product_id);

COMMENT ON INDEX idx_order_items_order_product IS 'Optimizes order item lookups and prevents N+1 queries';
COMMENT ON INDEX idx_order_items_product IS 'Optimizes product-based analytics queries';

-- ========================================
-- NOTIFICATIONS TABLE INDEXES
-- ========================================

-- Composite index for user notifications filtering
-- Supports: SELECT * FROM notifications WHERE user_id = ? AND is_read = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON notifications(user_id, is_read, created_at DESC);

-- Index for unread count queries
-- Supports: SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read) WHERE is_read = false;

-- Index for notification cleanup (old notifications)
-- Supports: DELETE FROM notifications WHERE created_at < ? AND is_read = true
CREATE INDEX IF NOT EXISTS idx_notifications_created_read
ON notifications(created_at, is_read);

COMMENT ON INDEX idx_notifications_user_read_created IS 'Optimizes user notification queries with read status filtering';
COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes unread notification count queries (partial index)';
COMMENT ON INDEX idx_notifications_created_read IS 'Optimizes notification cleanup queries';

-- ========================================
-- PRODUCTS TABLE INDEXES
-- ========================================

-- Index for active products queries
-- Supports: SELECT * FROM products WHERE is_active = true ORDER BY name
CREATE INDEX IF NOT EXISTS idx_products_active_name
ON products(is_active, name) WHERE is_active = true;

-- Index for product category filtering (if category column exists)
-- Note: Only create if category column exists in your schema
-- CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active) WHERE is_active = true;

COMMENT ON INDEX idx_products_active_name IS 'Optimizes active product catalog queries (partial index)';

-- ========================================
-- PROFILES TABLE INDEXES
-- ========================================

-- Index for role-based queries
-- Supports: SELECT * FROM profiles WHERE role = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_profiles_role_active
ON profiles(role, is_active);

-- Index for email lookup (if not already indexed by unique constraint)
-- Supabase auth typically handles this, but adding for completeness
-- CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

COMMENT ON INDEX idx_profiles_role_active IS 'Optimizes role-based user queries';

-- ========================================
-- DEMO_SESSIONS TABLE INDEXES
-- ========================================

-- Index for user demo sessions
-- Supports: SELECT * FROM demo_sessions WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_demo_sessions_user_created
ON demo_sessions(user_id, created_at DESC);

-- Index for demo session cleanup (expired sessions)
-- Supports: DELETE FROM demo_sessions WHERE expires_at < NOW()
CREATE INDEX IF NOT EXISTS idx_demo_sessions_expires
ON demo_sessions(expires_at);

COMMENT ON INDEX idx_demo_sessions_user_created IS 'Optimizes user demo session queries';
COMMENT ON INDEX idx_demo_sessions_expires IS 'Optimizes demo session cleanup queries';

-- ========================================
-- POLICY_AUDIT_LOG TABLE INDEXES
-- ========================================

-- Index for audit log queries by user
-- Supports: SELECT * FROM policy_audit_log WHERE user_id = ? ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp
ON policy_audit_log(user_id, timestamp DESC);

-- Index for audit log queries by table
-- Supports: SELECT * FROM policy_audit_log WHERE table_name = ? ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_audit_log_table_timestamp
ON policy_audit_log(table_name, timestamp DESC);

-- Index for audit log cleanup (old entries)
-- Supports: DELETE FROM policy_audit_log WHERE timestamp < ?
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
ON policy_audit_log(timestamp DESC);

COMMENT ON INDEX idx_audit_log_user_timestamp IS 'Optimizes user audit log queries';
COMMENT ON INDEX idx_audit_log_table_timestamp IS 'Optimizes table-specific audit queries';
COMMENT ON INDEX idx_audit_log_timestamp IS 'Optimizes audit log cleanup and recent entries queries';

-- ========================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ========================================

-- Update statistics for the query planner to use new indexes effectively
ANALYZE orders;
ANALYZE order_items;
ANALYZE notifications;
ANALYZE products;
ANALYZE profiles;
ANALYZE demo_sessions;
ANALYZE policy_audit_log;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- To verify indexes are being used, run these EXPLAIN ANALYZE queries:
/*
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE restaurant_id = 'xxx' AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

EXPLAIN ANALYZE
SELECT * FROM order_items
WHERE order_id = 'xxx';

EXPLAIN ANALYZE
SELECT COUNT(*) FROM notifications
WHERE user_id = 'xxx' AND is_read = false;
*/
