# Database Query Optimization Guide for PostgreSQL

## Table of Contents

- [Executive Summary](#executive-summary)
- [Query Performance Analysis](#query-performance-analysis)
  - [Step 1: Identify Slow Queries](#step-1-identify-slow-queries)
  - [Step 2: Use EXPLAIN ANALYZE](#step-2-use-explain-analyze)
  - [Step 3: Strategic Indexing](#step-3-strategic-indexing)
- [Query Optimization Patterns](#query-optimization-patterns)
  - [Pattern 1: Avoid SELECT *](#pattern-1-avoid-select-)
  - [Pattern 2: Optimize JOINs](#pattern-2-optimize-joins)
  - [Pattern 3: Pagination Optimization](#pattern-3-pagination-optimization)
  - [Pattern 4: Aggregate Efficiently](#pattern-4-aggregate-efficiently)
  - [Pattern 5: Materialized Views for Complex Analytics](#pattern-5-materialized-views-for-complex-analytics)
- [Connection Pooling](#connection-pooling)
- [Query Optimization Checklist](#query-optimization-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

Database query performance is the foundation of application responsiveness. A poorly optimized query can turn a sub-100ms API response into a 5-second timeout, degrading user experience and system scalability. This guide provides systematic approaches to identify, analyze, and optimize PostgreSQL queries for production workloads.

### Key Takeaways:

- ✅ **80% of performance issues** stem from missing indexes or inefficient query patterns
- ✅ **EXPLAIN ANALYZE** reveals query execution plans and identifies bottlenecks
- ✅ **Proper indexing** can improve query performance by 100-1000X
- ✅ **Connection pooling (PgBouncer)** reduces overhead by 90%
- ✅ **Materialized views** accelerate complex aggregations by 50-100X

### Performance Targets:

- **Simple queries** (single table SELECT): <10ms
- **Join queries** (2-3 tables): <50ms
- **Complex aggregations**: <200ms
- **Dashboard analytics**: <500ms (with caching)

---

## Query Performance Analysis

### Step 1: Identify Slow Queries

#### Enable pg_stat_statements Extension:

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries (by total time)
SELECT
  query,
  calls,
  total_exec_time / 1000 AS total_seconds,
  mean_exec_time / 1000 AS mean_seconds,
  max_exec_time / 1000 AS max_seconds,
  stddev_exec_time / 1000 AS stddev_seconds
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Find slowest queries (by average time)
SELECT
  query,
  calls,
  mean_exec_time / 1000 AS mean_seconds,
  (total_exec_time / 1000) / calls AS avg_per_call
FROM pg_stat_statements
WHERE calls > 100 -- Exclude rare queries
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Reset statistics (after optimization)
SELECT pg_stat_statements_reset();
```

#### Application-Level Logging:

**lib/db/query-logger.ts**

```typescript
// lib/db/query-logger.ts
import { performance } from 'perf_hooks'

export async function logSlowQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  threshold: number = 1000 // 1 second
): Promise<T> {
  const start = performance.now()

  try {
    const result = await queryFn()
    const duration = performance.now() - start

    if (duration > threshold) {
      console.warn(`[SLOW QUERY] ${queryName} took ${duration.toFixed(2)}ms`)

      // Send to monitoring service
      Sentry.captureMessage(`Slow query: ${queryName}`, {
        level: 'warning',
        extra: { duration, queryName }
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[FAILED QUERY] ${queryName} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

// Usage
const orders = await logSlowQuery(
  'fetch_restaurant_orders',
  () => supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId)
)
```

---

### Step 2: Use EXPLAIN ANALYZE

#### Understanding Query Plans:

```sql
-- Basic EXPLAIN (estimated plan, no execution)
EXPLAIN
SELECT * FROM orders WHERE restaurant_id = 'uuid-here';

-- EXPLAIN ANALYZE (actual execution with timings)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT o.*, oi.*, p.name AS product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.restaurant_id = 'uuid-here'
  AND o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 20;
```

#### Reading Query Plans:

**Key Indicators:**

✅ **GOOD SIGNS:**
- Index Scan / Index Only Scan (uses index)
- Buffers: shared hit=X (data in cache)
- Actual time: low milliseconds
- Rows removed by filter: 0 (precise filtering)

❌ **BAD SIGNS:**
- Seq Scan (full table scan - needs index)
- Buffers: shared read=X (disk reads - slow)
- Rows removed by filter: high (inefficient filtering)
- Nested Loop with high row counts (join explosion)
- Hash join on large tables (consider index)

**Example Output Analysis:**

```
-> Index Scan using idx_orders_restaurant_status
   (cost=0.29..8.31 rows=1 width=200)
   (actual time=0.015..0.020 rows=5 loops=1)
```
✅ Good: Using index, 0.020ms execution, 5 rows returned

```
-> Seq Scan on orders
   (cost=0.00..1543.25 rows=12450 width=200)
   (actual time=0.010..45.234 rows=12450 loops=1)
```
❌ Bad: Sequential scan, 45ms, scanned 12K rows
→ Solution: Add index on filter column

---

### Step 3: Strategic Indexing

#### Index Types and Use Cases:

```sql
-- B-tree Index (default, most common)
-- Use for: =, <, >, <=, >=, BETWEEN, IN, ORDER BY
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);

-- Composite Index (multiple columns)
-- Order matters! Most selective column first
CREATE INDEX idx_orders_restaurant_status_created
  ON orders(restaurant_id, status, created_at DESC);

-- Partial Index (filtered index, smaller size)
-- Use for: Queries with common WHERE clause
CREATE INDEX idx_orders_pending
  ON orders(restaurant_id, created_at DESC)
  WHERE status = 'pending';

-- Unique Index (enforce uniqueness + performance)
CREATE UNIQUE INDEX idx_products_sku ON products(sku);

-- GIN Index (full-text search, JSONB, arrays)
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || description));

-- BRIN Index (large tables with natural ordering)
-- Use for: Time-series data, append-only logs
CREATE INDEX idx_orders_created_brin ON orders
  USING BRIN (created_at);
```

#### Your System's Critical Indexes:

```sql
-- For restaurant order filtering (most common query)
CREATE INDEX idx_orders_restaurant_status_created
  ON orders(restaurant_id, status, created_at DESC);

-- For driver assigned orders
CREATE INDEX idx_orders_driver_status
  ON orders(driver_id, status)
  WHERE driver_id IS NOT NULL;

-- For analytics dashboard (date range queries)
CREATE INDEX idx_orders_created_status_delivered
  ON orders(created_at DESC, status)
  WHERE status = 'delivered';

-- For order items lookup
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- For product search
CREATE INDEX idx_products_name_trgm ON products
  USING GIN (name gin_trgm_ops);

-- For profile role lookups (used in RLS)
CREATE INDEX idx_profiles_role ON profiles(role);
```

#### Index Maintenance:

```sql
-- Find unused indexes (consider dropping)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
SELECT
  pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size,
  (array_agg(idx))[1] AS idx1,
  (array_agg(idx))[2] AS idx2
FROM (
  SELECT
    indexrelid::regclass AS idx,
    indrelid::regclass AS tbl,
    indkey::text AS key
  FROM pg_index
) sub
GROUP BY tbl, key
HAVING COUNT(*) > 1
ORDER BY SUM(pg_relation_size(idx)) DESC;

-- Rebuild bloated indexes
REINDEX INDEX CONCURRENTLY idx_orders_restaurant_id;
```

---

## Query Optimization Patterns

### Pattern 1: Avoid SELECT *

```sql
-- ❌ BAD: Returns all 20 columns, wastes bandwidth
SELECT * FROM orders WHERE restaurant_id = ?;

-- ✅ GOOD: Select only needed columns
SELECT id, status, total_amount, created_at
FROM orders
WHERE restaurant_id = ?;

-- Savings: 80% less data transferred
```

---

### Pattern 2: Optimize JOINs

```sql
-- ❌ BAD: Multiple queries (N+1 problem)
SELECT * FROM orders WHERE restaurant_id = ?;
-- Then in application loop:
-- SELECT * FROM order_items WHERE order_id = ?;

-- ✅ GOOD: Single JOIN query
SELECT
  o.id,
  o.total_amount,
  jsonb_agg(
    jsonb_build_object(
      'product_id', oi.product_id,
      'quantity', oi.quantity,
      'price', oi.price
    )
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.restaurant_id = ?
GROUP BY o.id;
```

---

### Pattern 3: Pagination Optimization

```sql
-- ❌ BAD: OFFSET becomes slow for large offsets
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000; -- Scans 1020 rows, returns 20

-- ✅ GOOD: Cursor-based pagination
SELECT * FROM orders
WHERE created_at < ? -- Last seen timestamp
ORDER BY created_at DESC
LIMIT 20;

-- Implementation:
-- Page 1: WHERE created_at < NOW()
-- Page 2: WHERE created_at < '2024-01-15 10:30:00' (last item from page 1)
```

---

### Pattern 4: Aggregate Efficiently

```sql
-- ❌ BAD: Multiple queries for dashboard stats
SELECT COUNT(*) FROM orders WHERE status = 'pending';
SELECT COUNT(*) FROM orders WHERE status = 'delivered';
SELECT SUM(total_amount) FROM orders WHERE status = 'delivered';

-- ✅ GOOD: Single query with aggregation
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_count,
  SUM(total_amount) FILTER (WHERE status = 'delivered') AS total_revenue
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

### Pattern 5: Materialized Views for Complex Analytics

```sql
-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  DATE(created_at) AS date,
  restaurant_id,
  status,
  COUNT(*) AS order_count,
  SUM(total_amount) AS revenue,
  AVG(total_amount) AS avg_order_value
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), restaurant_id, status;

-- Add indexes on materialized view
CREATE INDEX idx_dashboard_stats_date ON dashboard_stats(date DESC);
CREATE INDEX idx_dashboard_stats_restaurant ON dashboard_stats(restaurant_id, date DESC);

-- Refresh strategy (every 5 minutes via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;

-- Query is now instant (reads pre-computed data)
SELECT * FROM dashboard_stats
WHERE restaurant_id = ?
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- Before: 2-5 seconds (complex aggregation)
-- After: <50ms (simple SELECT)
```

---

## Connection Pooling

### Why PgBouncer is Critical:

**PostgreSQL Architecture:**
- Each connection = new process (~9.5MB memory)
- 200 connections = 1.9GB RAM just for connections
- Connection setup: 50ms overhead per connection

**With PgBouncer:**
- 200 client connections → 20 database connections
- Memory: 200MB (90% savings)
- Connection reuse: <1ms overhead

### PgBouncer Configuration (docker-compose):

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: pgbouncer
    environment:
      DATABASE_URL: "postgres://postgres:${DB_PASSWORD}@db:5432/postgres"
      POOL_MODE: transaction # Optimal for Supabase
      MAX_CLIENT_CONN: 500
      DEFAULT_POOL_SIZE: 20
      MIN_POOL_SIZE: 5
      RESERVE_POOL_SIZE: 5
    ports:
      - "6432:5432"
    depends_on:
      - db
```

### Application Connection String:

```typescript
// Use PgBouncer for connection pooling
const DATABASE_URL = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(':5432', ':6432') + '?pgbouncer=true'
  : 'postgresql://postgres:password@localhost:6432/postgres?pgbouncer=true'
```

---

## Query Optimization Checklist

### Immediate Wins (This Week)

- [ ] Enable pg_stat_statements extension
- [ ] Identify top 10 slowest queries
- [ ] Add missing indexes for common filters
- [ ] Replace SELECT * with specific columns
- [ ] Implement cursor-based pagination
- [ ] Set up PgBouncer connection pooling

### Ongoing Optimization (This Month)

- [ ] Create materialized views for analytics
- [ ] Optimize JOIN queries (avoid N+1)
- [ ] Add composite indexes for multi-column filters
- [ ] Monitor index usage (drop unused)
- [ ] Set up query logging in application
- [ ] Configure slow query alerts (<1s threshold)

### Advanced Optimization (Next Quarter)

- [ ] Implement database read replicas
- [ ] Set up query result caching (Redis)
- [ ] Partition large tables (orders by month)
- [ ] Optimize autovacuum settings
- [ ] Implement connection pooling monitoring
- [ ] Create query performance dashboard

---

## Further Resources

- **PostgreSQL Performance Tuning:** https://www.postgresql.org/docs/current/performance-tips.html
- **Use The Index, Luke:** https://use-the-index-luke.com/
- **PgBouncer Documentation:** https://www.pgbouncer.org/
- **EDB Query Optimization Guide:** https://www.enterprisedb.com/blog/postgresql-query-optimization
