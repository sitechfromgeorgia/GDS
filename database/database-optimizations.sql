-- Database Optimization Script for Georgian Distribution System
-- This script adds indexes to improve query performance based on actual usage patterns
-- Run this script against your Supabase database

-- ============================================================================
-- DROP EXISTING INDEXES (if re-running script)
-- ============================================================================
DROP INDEX IF EXISTS idx_orders_restaurant_status_created;
DROP INDEX IF EXISTS idx_orders_driver_status_created;
DROP INDEX IF EXISTS idx_orders_status_created;
DROP INDEX IF EXISTS idx_orders_restaurant_id;
DROP INDEX IF EXISTS idx_orders_driver_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;

DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_order_product;

DROP INDEX IF EXISTS idx_products_category_active;
DROP INDEX IF EXISTS idx_products_active_available;
DROP INDEX IF EXISTS idx_products_search;
DROP INDEX IF EXISTS idx_products_price;

DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_role_active;

DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_notifications_user_created;

DROP INDEX IF EXISTS idx_deliveries_driver_status;
DROP INDEX IF EXISTS idx_deliveries_order_id;

DROP INDEX IF EXISTS idx_order_status_history_order;
DROP INDEX IF EXISTS idx_order_audit_logs_order;
DROP INDEX IF EXISTS idx_demo_sessions_token;
DROP INDEX IF EXISTS idx_demo_sessions_expires;

-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================

-- Composite index for restaurant orders filtered by status and sorted by date
-- Supports: getRestaurantOrders(), filtered by status
CREATE INDEX idx_orders_restaurant_status_created
ON orders(restaurant_id, status, created_at DESC);

-- Composite index for driver orders filtered by status and sorted by date
-- Supports: getDriverOrders(), filtered by status
CREATE INDEX idx_orders_driver_status_created
ON orders(driver_id, status, created_at DESC);

-- Index for admin queries filtered by status
-- Supports: getAllOrders(), getPendingOrders(), status filters
CREATE INDEX idx_orders_status_created
ON orders(status, created_at DESC);

-- Individual indexes for foreign key lookups
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);

-- Index for analytics queries (date range filtering)
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Index for order status queries
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================================================
-- ORDER_ITEMS TABLE INDEXES
-- ============================================================================

-- Index for fetching items by order (most common query)
-- Supports: getOrderItems(), order detail views
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Index for product-based queries and analytics
-- Supports: product sales reports, inventory tracking
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Composite index for order-product joins
-- Supports: complex queries joining orders with products
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Composite index for product catalog filtering
-- Supports: getProducts() with category filter
CREATE INDEX idx_products_category_active
ON products(category, is_active, is_available)
WHERE is_active = true AND is_available = true;

-- Index for active/available products
-- Supports: all product listing queries
CREATE INDEX idx_products_active_available
ON products(is_active, is_available, name);

-- GIN index for full-text search on product names and descriptions
-- Supports: searchProducts(), product search functionality
CREATE INDEX idx_products_search
ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index for price range filtering
-- Supports: getProducts() with price filters
CREATE INDEX idx_products_price
ON products(price)
WHERE is_active = true AND is_available = true;

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Index for role-based queries
-- Supports: getAllUsers(), role filtering, RLS policies
CREATE INDEX idx_profiles_role ON profiles(role);

-- Composite index for active users by role
-- Supports: active user queries, authentication
CREATE INDEX idx_profiles_role_active
ON profiles(role, is_active)
WHERE is_active = true;

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Composite index for unread notifications by user
-- Supports: notification queries, unread counts
CREATE INDEX idx_notifications_user_unread
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Index for all user notifications sorted by date
-- Supports: notification history, mark as read operations
CREATE INDEX idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- ============================================================================
-- DELIVERIES TABLE INDEXES
-- ============================================================================

-- Composite index for driver deliveries by status
-- Supports: driver dashboard, active delivery tracking
CREATE INDEX idx_deliveries_driver_status
ON deliveries(driver_id, status, created_at DESC);

-- Index for order-delivery lookups
-- Supports: order tracking, delivery status queries
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);

-- ============================================================================
-- ORDER_STATUS_HISTORY TABLE INDEXES
-- ============================================================================

-- Index for order history queries
-- Supports: audit trail, status history views
CREATE INDEX idx_order_status_history_order
ON order_status_history(order_id, changed_at DESC);

-- ============================================================================
-- ORDER_AUDIT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for order audit queries
-- Supports: audit trail, compliance reports
CREATE INDEX idx_order_audit_logs_order
ON order_audit_logs(order_id, created_at DESC);

-- ============================================================================
-- DEMO_SESSIONS TABLE INDEXES
-- ============================================================================

-- Index for session token lookups
-- Supports: demo session validation
CREATE INDEX idx_demo_sessions_token ON demo_sessions(session_token);

-- Index for cleaning up expired sessions
-- Supports: session expiration cleanup
CREATE INDEX idx_demo_sessions_expires
ON demo_sessions(expires_at)
WHERE ended_at IS NULL;

-- ============================================================================
-- POLICY_AUDIT_LOG TABLE INDEXES
-- ============================================================================

-- Index for policy audit queries
CREATE INDEX idx_policy_audit_log_user
ON policy_audit_log(user_id, created_at DESC);

CREATE INDEX idx_policy_audit_log_table
ON policy_audit_log(table_name, operation, created_at DESC);

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update table statistics for query planner optimization

ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE profiles;
ANALYZE notifications;
ANALYZE deliveries;
ANALYZE order_status_history;
ANALYZE order_audit_logs;
ANALYZE demo_sessions;
ANALYZE policy_audit_log;

-- ============================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify index usage (uncomment to test)

-- Test 1: Restaurant orders query
-- EXPLAIN ANALYZE
-- SELECT * FROM orders
-- WHERE restaurant_id = 'test-uuid' AND status = 'pending'
-- ORDER BY created_at DESC;

-- Test 2: Product search query
-- EXPLAIN ANALYZE
-- SELECT * FROM products
-- WHERE is_active = true AND is_available = true
-- AND to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ to_tsquery('test');

-- Test 3: Driver deliveries query
-- EXPLAIN ANALYZE
-- SELECT * FROM deliveries
-- WHERE driver_id = 'test-uuid' AND status = 'in_transit'
-- ORDER BY created_at DESC;

-- ============================================================================
-- INDEX SIZE REPORT
-- ============================================================================
-- Run this query to see the size of all indexes

/*
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- ============================================================================
-- NOTES AND RECOMMENDATIONS
-- ============================================================================

/*
IMPLEMENTATION NOTES:
1. Run this script during low-traffic periods to avoid locking issues
2. Monitor query performance after applying indexes
3. Use EXPLAIN ANALYZE to verify index usage
4. Consider adding more indexes based on specific query patterns
5. Regularly run ANALYZE to keep statistics up to date

PAGINATION RECOMMENDATIONS:
1. Always use LIMIT and OFFSET for large result sets
2. Consider cursor-based pagination for very large tables
3. Use COUNT queries sparingly - they can be expensive

QUERY OPTIMIZATION TIPS:
1. Select only needed columns, avoid SELECT *
2. Use composite indexes for multi-column filters
3. Filter before joining when possible
4. Use EXISTS instead of IN for large subqueries
5. Batch insert/update operations when possible

MONITORING:
1. Track slow query logs
2. Monitor index hit rates
3. Watch for unused indexes
4. Monitor table bloat
5. Regular VACUUM operations
*/
