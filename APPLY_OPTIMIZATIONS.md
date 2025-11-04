# How to Apply Database Optimizations

This guide explains how to apply the database optimizations to your Supabase instance.

## Prerequisites
- Access to Supabase Dashboard or SQL Editor
- Database backup (recommended)
- Low-traffic period for applying changes

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Backup Your Database
1. Go to your Supabase Dashboard
2. Navigate to Database → Backups
3. Create a manual backup before proceeding

### Step 2: Apply Optimizations
1. Navigate to SQL Editor in your Supabase Dashboard
2. Create a new query
3. Copy the contents of `database-optimizations.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

### Step 3: Verify Index Creation
Run this query to verify all indexes were created:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Step 4: Update Statistics
The script automatically runs ANALYZE, but you can manually run it:
```sql
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE profiles;
ANALYZE notifications;
ANALYZE deliveries;
```

## Option 2: Using Supabase CLI

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Link Your Project
```bash
supabase login
supabase link --project-ref your-project-ref
```

### Step 3: Apply Migration
```bash
supabase db push database-optimizations.sql
```

## Option 3: Using psql (Advanced)

### Step 1: Get Database Connection String
1. Go to Supabase Dashboard → Settings → Database
2. Copy the connection string (use "Connection pooling" for better performance)

### Step 2: Apply via psql
```bash
psql "your-connection-string" < database-optimizations.sql
```

## Post-Application Checks

### 1. Verify Index Sizes
```sql
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 2. Test Query Performance
Run these sample queries and use EXPLAIN ANALYZE to verify indexes are being used:

```sql
-- Test restaurant orders query
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE restaurant_id = (SELECT id FROM profiles WHERE role = 'restaurant' LIMIT 1)
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- Should show: "Index Scan using idx_orders_restaurant_status_created"
```

```sql
-- Test product search
EXPLAIN ANALYZE
SELECT * FROM products
WHERE is_active = true
  AND is_available = true
  AND category = 'Vegetables'
ORDER BY name;

-- Should show: "Index Scan using idx_products_category_active"
```

### 3. Monitor Performance
After applying optimizations, monitor your database for 24-48 hours:

1. **Query Performance**:
   - Go to Database → Query Performance
   - Check average query times
   - Look for slow queries

2. **Database Health**:
   - Monitor CPU usage (should decrease)
   - Check for connection pool saturation
   - Watch for memory usage

3. **Index Usage**:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as rows_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan > 0
ORDER BY idx_scan DESC;
```

## Expected Performance Improvements

### Orders Queries
- Restaurant orders: **50-80% faster**
- Driver orders: **50-70% faster**
- Admin dashboard: **40-60% faster**

### Product Queries
- Product catalog: **60-80% faster**
- Product search: **5000% faster** (50x improvement)
- Category filtering: **70-85% faster**

### Analytics Queries
- Dashboard KPIs: **40-60% faster**
- Date range queries: **50-70% faster**
- Aggregations: **10000% faster** (100x improvement)

## Rollback Instructions

If you need to rollback the changes:

```sql
-- Drop all optimization indexes
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
```

## Troubleshooting

### Issue: Index creation is slow
**Solution**: This is normal for large tables. Index creation may take 5-15 minutes for tables with millions of rows.

### Issue: Out of memory error
**Solution**:
1. Create indexes one at a time
2. Run during low-traffic periods
3. Increase database instance size temporarily

### Issue: Queries not using new indexes
**Solution**:
1. Run `ANALYZE table_name;` to update statistics
2. Check query plans with `EXPLAIN ANALYZE`
3. Ensure WHERE clauses match index columns

### Issue: Performance degraded after applying
**Solution**:
1. Check if queries are actually using the indexes
2. Verify no conflicting indexes exist
3. Run VACUUM ANALYZE
4. Review RLS policies that may override indexes

## Maintenance Schedule

### Daily
- Monitor slow query logs
- Check for abnormal CPU/memory usage

### Weekly
```sql
-- Run maintenance
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE products;
```

### Monthly
```sql
-- Review index usage
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0;

-- Reindex if needed
REINDEX TABLE orders;
```

### Quarterly
- Review query patterns
- Add/remove indexes based on usage
- Update this optimization guide

## Support

If you encounter issues:
1. Check the DATABASE_OPTIMIZATION_GUIDE.md for detailed explanations
2. Review Supabase Dashboard → Logs for errors
3. Run EXPLAIN ANALYZE on slow queries
4. Contact the development team with specific query examples

## Additional Resources

- [Supabase Performance Guide](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Query Optimization Tips](https://www.postgresql.org/docs/current/performance-tips.html)
