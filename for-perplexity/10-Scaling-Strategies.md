# Scaling Strategies for VPS-Based SaaS Applications

## Table of Contents

- [Executive Summary](#executive-summary)
- [Phase 1: Single VPS Optimization (50-500 Users)](#phase-1-single-vps-optimization-50-500-users)
  - [Current Infrastructure Assessment](#current-infrastructure-assessment)
  - [Quick Win 1: PgBouncer (5X Improvement)](#quick-win-1-pgbouncer-5x-improvement)
  - [Quick Win 2: Strategic Database Indexes](#quick-win-2-strategic-database-indexes)
  - [Quick Win 3: Redis Caching Layer](#quick-win-3-redis-caching-layer)
  - [Quick Win 4: CDN for Static Assets](#quick-win-4-cdn-for-static-assets)
- [Phase 2: Advanced Optimization (500-2000 Users)](#phase-2-advanced-optimization-500-2000-users)
  - [Database Read Replicas](#database-read-replicas)
  - [Application-Level Caching Strategies](#application-level-caching-strategies)
- [Phase 3: Horizontal Scaling (2000-5000+ Users)](#phase-3-horizontal-scaling-2000-5000-users)
  - [Load Balancer Architecture](#load-balancer-architecture)
  - [Nginx Load Balancer Setup](#nginx-load-balancer-setup)
  - [Session Management (Redis)](#session-management-redis)
  - [Database Sharding (Advanced)](#database-sharding-advanced)
- [Cost Projection by Phase](#cost-projection-by-phase)
- [Scaling Checklist](#scaling-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

Scaling a SaaS application from 50 to 5,000+ concurrent users requires strategic planning and phased implementation. Unlike cloud platforms with auto-scaling, VPS environments demand proactive capacity planning, efficient resource utilization, and architectural decisions that balance cost and performance. This guide provides a proven roadmap for scaling your Georgian Distribution Management System cost-effectively.

### Key Takeaways:

- ✅ **Vertical scaling** (bigger servers) is simplest but hits limits at ~10K users
- ✅ **Horizontal scaling** (multiple servers) requires load balancing and session management
- ✅ **Database read replicas** offload 70-80% of query load from primary
- ✅ **Caching layers** (Redis, CDN) reduce database load by 60-90%
- ✅ **Cost-effective scaling**: €50/month (100 users) → €300/month (5000 users)

### Scaling Phases:

- **Phase 1 (Current)**: Single VPS, 50-500 users
- **Phase 2 (6 months)**: Optimized single VPS, 500-2000 users
- **Phase 3 (12 months)**: Horizontal scaling, 2000-5000+ users

---

## Phase 1: Single VPS Optimization (50-500 Users)

### Current Infrastructure Assessment

**Your Current Setup:**

```
┌─────────────────────────────────────┐
│ Contabo VPS (Single)                │
│ ┌─────────────────────────────┐     │
│ │ Next.js Frontend (Port 3000)│     │
│ └─────────────┬───────────────┘     │
│               │                     │
│ ┌─────────────▼───────────────┐     │
│ │ Self-Hosted Supabase        │     │
│ │ - PostgreSQL                │     │
│ │ - Realtime                  │     │
│ │ - Auth                      │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

**Optimization Priorities (Impact vs. Effort):**

| Optimization | Impact | Effort | ROI | Priority |
|-------------|--------|---------|-----|----------|
| PgBouncer connection pooling | 🔥 High | ⚡ Low | 💎 Excellent | 1 |
| Database indexes | 🔥 High | ⚡ Low | 💎 Excellent | 2 |
| Redis caching | 🔶 Medium | ⚡ Low | 👍 Good | 3 |
| CDN for static assets | 🔶 Medium | ⚡ Low | 👍 Good | 4 |
| Materialized views | 🔥 High | 🔶 Medium | 👍 Good | 5 |
| Code splitting | 🔶 Medium | 🔶 Medium | 👌 Fair | 6 |

---

### Quick Win 1: PgBouncer (5X Improvement)

**Problem:** PostgreSQL creates a new process per connection (~9.5MB memory each)
**Solution:** Connection pooling reduces 500 connections to 20

**docker-compose.override.yml:**

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: "postgres://postgres:${DB_PASS}@db:5432/postgres"
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 500    # Client connections
      DEFAULT_POOL_SIZE: 20   # Actual DB connections
      MIN_POOL_SIZE: 5
    ports:
      - "6432:5432"
```

**Impact:**

- ✅ Memory savings: 1.9GB → 200MB (90% reduction)
- ✅ Connection overhead: 50ms → <1ms
- ✅ Capacity increase: 200 → 500 concurrent users

---

### Quick Win 2: Strategic Database Indexes

**Analyze Current Slow Queries:**

```sql
-- Find slowest queries
SELECT
  query,
  calls,
  mean_exec_time / 1000 AS mean_seconds
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add Missing Indexes:**

```sql
-- For restaurant order filtering (most common)
CREATE INDEX CONCURRENTLY idx_orders_restaurant_status_created
  ON orders(restaurant_id, status, created_at DESC);

-- For driver queries
CREATE INDEX CONCURRENTLY idx_orders_driver_status
  ON orders(driver_id, status)
  WHERE driver_id IS NOT NULL;

-- For analytics dashboard
CREATE INDEX CONCURRENTLY idx_orders_created_status
  ON orders(created_at DESC, status);
```

**Impact:**

- ✅ Query time: 2-5 seconds → 10-50ms (50-100X faster)
- ✅ Dashboard load time: 5s → 200ms
- ✅ Concurrent capacity: +200 users

---

### Quick Win 3: Redis Caching Layer

**Install Redis:**

```yaml
# docker-compose.override.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Implement Caching Strategy:**

```typescript
// lib/cache/redis.ts
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redis.connect()

export class CacheService {
  // Cache products (1 hour TTL)
  static async getProducts(): Promise<Product[]> {
    const cached = await redis.get('products:all')

    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from database
    const products = await db.products.findMany()

    // Cache for 1 hour
    await redis.setEx('products:all', 3600, JSON.stringify(products))

    return products
  }

  // Cache dashboard stats (5 minutes)
  static async getDashboardStats(restaurantId: string) {
    const cacheKey = `dashboard:${restaurantId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const stats = await calculateDashboardStats(restaurantId)

    // Cache for 5 minutes
    await redis.setEx(cacheKey, 300, JSON.stringify(stats))

    return stats
  }

  // Invalidate cache on updates
  static async invalidateProductCache() {
    await redis.del('products:all')
  }
}
```

**Caching Targets:**

- Product catalog: 1 hour TTL (rarely changes)
- Dashboard stats: 5 minutes TTL (acceptable staleness)
- User profiles: 10 minutes TTL
- Session data: 1 day TTL

**Impact:**

- ✅ Database load: -60% (fewer queries)
- ✅ API response time: 500ms → 50ms (10X faster)
- ✅ Concurrent capacity: +300 users

---

### Quick Win 4: CDN for Static Assets

**CloudFlare Setup (Free Tier):**

1. Point DNS to CloudFlare
2. Enable "Proxy" mode (orange cloud)
3. Configure caching rules

**CloudFlare Cache Rules:**

```yaml
# Cache static assets aggressively
Cache Level: Standard
Browser Cache TTL: 1 year
Edge Cache TTL: 1 month

File Extensions:
  - .js, .css, .woff, .woff2
  - .jpg, .png, .svg, .webp
  - .mp4, .webm
```

**Next.js Image Optimization:**

```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-loader.js',
  },
}

// lib/cloudflare-loader.js
export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`]
  if (quality) params.push(`quality=${quality}`)
  return `https://cdn.greenland77.ge/cdn-cgi/image/${params.join(',')}/${src}`
}
```

**Impact:**

- ✅ Page load time: 2s → 800ms (2.5X faster)
- ✅ Bandwidth savings: 70% (offloaded to CDN)
- ✅ Origin server load: -40%

---

## Phase 2: Advanced Optimization (500-2000 Users)

### Database Read Replicas

**Architecture with Read Replica:**

```
┌──────────────────┐ ┌──────────────────┐
│ Primary DB       │────────▶│ Read Replica     │
│ (Write + Read)   │   WAL   │ (Read Only)      │
│ Port: 5432       │  Stream │ Port: 5433       │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ ┌──────────────────────────┘
         │ │
   ┌─────▼─▼──────┐
   │ PgBouncer     │
   │ (Read Routing)│
   └───────────────┘
```

**Setup PostgreSQL Replication:**

```bash
# On primary server
# postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB

# Create replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'strong-pass';

# pg_hba.conf
host replication replicator replica-ip/32 md5

# On replica server
pg_basebackup -h primary-ip -U replicator -D /var/lib/postgresql/data -P -R
```

**Smart Query Routing:**

```typescript
// lib/db/router.ts
import { Pool } from 'pg'

const primaryPool = new Pool({
  host: 'primary-db.local',
  port: 5432,
  database: 'postgres',
  max: 20,
})

const replicaPool = new Pool({
  host: 'replica-db.local',
  port: 5433,
  database: 'postgres',
  max: 50, // More connections for reads
})

export class DatabaseRouter {
  // Write operations go to primary
  static async write(query: string, params?: any[]) {
    return primaryPool.query(query, params)
  }

  // Read operations go to replica
  static async read(query: string, params?: any[]) {
    return replicaPool.query(query, params)
  }
}

// Usage
// Writes (20% of traffic)
await DatabaseRouter.write('INSERT INTO orders VALUES ($1, $2)', [id, data])

// Reads (80% of traffic) → Offloaded to replica
await DatabaseRouter.read('SELECT * FROM orders WHERE restaurant_id = $1', [id])
```

**Impact:**

- ✅ Primary database load: -70% (reads offloaded)
- ✅ Read query capacity: 3X increase
- ✅ Write performance: Unaffected
- 💰 Cost: +€50/month (replica VPS)

---

### Application-Level Caching Strategies

**HTTP Response Caching:**

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const products = await db.products.findMany()

  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'CDN-Cache-Control': 'max-age=3600',
    },
  })
}
```

**Incremental Static Regeneration (ISR):**

```typescript
// app/products/[id]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const products = await db.products.findMany({ take: 100 })
  return products.map(p => ({ id: p.id }))
}

export default async function ProductPage({ params }) {
  const product = await db.products.findUnique({ where: { id: params.id } })
  return <ProductDetail product={product} />
}
```

**Impact:**

- ✅ Static pages: Instant load (<50ms)
- ✅ API calls: 70% cached at CDN
- ✅ Database queries: -50%

---

## Phase 3: Horizontal Scaling (2000-5000+ Users)

### Load Balancer Architecture

```
┌────────────────────┐
│ CloudFlare CDN     │
│ (Edge Caching)     │
└──────────┬─────────┘
           │
┌──────────▼─────────┐
│ Nginx Load Balancer│
│ (Sticky Sessions)  │
└──────────┬─────────┘
           │
┌──────────┼──────────┐
│          │          │
┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ App       │ │ App       │ │ App       │
│ Server 1  │ │ Server 2  │ │ Server 3  │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │
      └─────────────┼─────────────┘
                    │
          ┌─────────▼──────────┐
          │ Redis (Shared)     │
          │ (Sessions, Cache)  │
          └─────────┬──────────┘
                    │
      ┌─────────────┼──────────────┐
      │             │              │
┌─────▼─────┐ ┌────▼─────┐ ┌─────▼─────┐
│ Primary DB│ │ Replica 1│ │ Replica 2 │
└───────────┘ └──────────┘ └───────────┘
```

---

### Nginx Load Balancer Setup

```nginx
# /etc/nginx/nginx.conf
upstream app_backend {
  # IP hash for sticky sessions
  ip_hash;

  server app1.internal:3000 max_fails=3 fail_timeout=30s;
  server app2.internal:3000 max_fails=3 fail_timeout=30s;
  server app3.internal:3000 max_fails=3 fail_timeout=30s;

  # Health checks
  keepalive 32;
}

server {
  listen 443 ssl http2;
  server_name greenland77.ge;

  location / {
    proxy_pass http://app_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

---

### Session Management (Redis)

**Centralized Session Store:**

```typescript
// lib/session/redis-store.ts
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })
redis.connect()

export class SessionStore {
  static async set(sessionId: string, data: any, ttl: number = 86400) {
    await redis.setEx(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(data)
    )
  }

  static async get(sessionId: string) {
    const data = await redis.get(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  }

  static async destroy(sessionId: string) {
    await redis.del(`session:${sessionId}`)
  }
}
```

---

### Database Sharding (Advanced)

**When to Shard:** >10K active restaurants or >100M orders

**Sharding Strategy:**

```typescript
// Shard by restaurant_id (consistent hashing)
function getShardForRestaurant(restaurantId: string): number {
  const hash = hashCode(restaurantId)
  return hash % SHARD_COUNT // 0, 1, 2, or 3
}

const shards = [
  new Pool({ host: 'db-shard-0.local' }),
  new Pool({ host: 'db-shard-1.local' }),
  new Pool({ host: 'db-shard-2.local' }),
  new Pool({ host: 'db-shard-3.local' }),
]

export async function getOrdersForRestaurant(restaurantId: string) {
  const shardIndex = getShardForRestaurant(restaurantId)
  const pool = shards[shardIndex]

  return pool.query('SELECT * FROM orders WHERE restaurant_id = $1', [restaurantId])
}
```

---

## Cost Projection by Phase

### Phase 1 (50-500 users):

```
Single Contabo VPS M: €15/month
Cloudflare Free Tier: €0/month
Sentry Developer: €0/month (free tier)
────────────────────────────────
Total: €15/month
Cost per user: €0.03-0.30
```

### Phase 2 (500-2000 users):

```
Contabo VPS L (8 vCPU, 30GB RAM): €30/month
Read Replica VPS M: €15/month
Redis Cloud (2GB): €20/month
Cloudflare Pro: €20/month
Sentry Team: €26/month
────────────────────────────────
Total: €111/month
Cost per user: €0.06-0.22
```

### Phase 3 (2000-5000 users):

```
3x App Servers (Hetzner CX31): €90/month
Load Balancer VPS: €15/month
Primary DB (Hetzner CX41): €30/month
2x Read Replicas: €60/month
Redis Cluster (8GB): €50/month
Cloudflare Business: €200/month
Sentry Business: €80/month
────────────────────────────────
Total: €525/month
Cost per user: €0.11-0.26
```

---

## Scaling Checklist

### Phase 1 (Immediate)

- [ ] PgBouncer connection pooling
- [ ] Database indexes optimized
- [ ] Redis caching layer
- [ ] CloudFlare CDN enabled
- [ ] Monitoring dashboards set up

### Phase 2 (6-12 months)

- [ ] Database read replica deployed
- [ ] Materialized views for analytics
- [ ] ISR for static content
- [ ] Application-level caching
- [ ] Load testing completed (1000 users)

### Phase 3 (12-24 months)

- [ ] Horizontal app scaling (3+ servers)
- [ ] Load balancer configured
- [ ] Centralized session management (Redis)
- [ ] Multiple read replicas
- [ ] Database sharding evaluated
- [ ] Auto-scaling policies defined

---

## Further Resources

- **PostgreSQL Replication**: https://www.postgresql.org/docs/current/high-availability.html
- **Nginx Load Balancing**: https://nginx.org/en/docs/http/load_balancing.html
- **Redis Caching Patterns**: https://redis.io/docs/manual/patterns/
- **Horizontal Scaling Guide**: https://www.digitalocean.com/community/tutorials/scaling-web-applications
