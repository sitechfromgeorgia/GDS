---
name: implementing-modern-caching-strategies
description: Implements production-ready caching strategies across web applications, APIs, and distributed systems. Covers in-memory caching (LRU, TTL), Redis patterns, HTTP/CDN caching, cache invalidation, stale-while-revalidate, and database query caching. Use when optimizing application performance, reducing database load, managing API response times, or implementing multi-tier caching architectures.
---

# Implementing Modern Caching Strategies (2024-2025)

## Quick Start

Choose your caching tier based on needs:

```typescript
// 1. IN-MEMORY: Fast, single-process, no network overhead
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 }); // 5-minute TTL
cache.set('user:123', userData);
const data = cache.get('user:123');

// 2. REDIS: Distributed, persistent, multi-instance
import Redis from 'ioredis';
const redis = new Redis({ host: 'localhost', port: 6379 });
await redis.setex('user:123', 300, JSON.stringify(userData)); // 5-min TTL
const cached = await redis.get('user:123');

// 3. HTTP/CDN: Browser and edge caching
response.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

// 4. DATABASE: Query-level caching
await prisma.user.findMany({
  cacheStrategy: { ttl: 60, swr: 120 }
});
```

## When to Use This Skill

- **Performance bottlenecks**: Database queries taking >100ms
- **High traffic scenarios**: Multiple identical concurrent requests
- **Distributed systems**: Multi-region or multi-instance deployments
- **Cost optimization**: Reducing database/API calls
- **Stale data tolerance**: Trade slight staleness for performance gains
- **Real-time requirements**: Needing to serve data immediately while refreshing in background

## Caching Decision Flowchart

```
Start: Need to cache data?
├─ Is it static/immutable?
│  └─ YES → HTTP/CDN caching (very long TTL)
├─ Is it frequently accessed?
│  └─ YES → Continue
├─ How stale can data be?
│  ├─ <1 second (real-time) → Event-driven invalidation
│  ├─ 1-5 mins → TTL-based with SWR
│  └─ 5+ mins → TTL-based only
├─ Single or multiple processes/servers?
│  ├─ Single → In-memory LRU cache
│  └─ Multiple → Redis + DB fallback
└─ Configure: TTL + invalidation strategy
```

## In-Memory Caching (Node.js)

### lru-cache v11 - High Performance LRU

```typescript
import LRU from 'lru-cache';

interface CacheOptions {
  max: number; // Max items (not bytes)
  ttl: number; // Milliseconds
  updateAgeOnGet?: boolean;
  updateAgeOnHas?: boolean;
  allowStale?: boolean;
}

// Basic setup
const cache = new LRU<string, any>({
  max: 500, // Keep 500 most-recently-used items
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true, // Extend TTL on access
  updateAgeOnHas: false,
  allowStale: false // Don't serve expired items
});

// Usage
cache.set('key', value);
const data = cache.get('key'); // Returns value or undefined
cache.has('key'); // Check without updating access time
cache.delete('key');
cache.clear();

// Batch operations
for (const [key, value] of cache.entries()) {
  console.log(key, value);
}

// Size tracking (optional)
const cacheWithSize = new LRU({
  max: 100,
  ttl: 1000 * 60 * 5,
  sizeCalculation: (item) => JSON.stringify(item).length,
  maxSize: 1024 * 1024 // 1MB max
});
```

### node-cache - TTL-focused with auto-cleanup

```typescript
import NodeCache from 'node-cache';

// stdTTL: default TTL in seconds, checkperiod: cleanup interval
const cache = new NodeCache({
  stdTTL: 300, // 5-minute default TTL
  checkperiod: 60 // Check for expired keys every 60 seconds
});

cache.set('userSessions', sessionData, 600); // 10-min override
const data = cache.get('userSessions');
cache.del('userSessions');

// Batch multi-get
const keys = ['key1', 'key2', 'key3'];
const values = cache.mget(keys);

// Get all keys matching pattern
const allKeys = cache.keys();
```

### Stale-While-Revalidate Pattern (In-Memory)

```typescript
const cache = new LRU<string, CachedData>({
  max: 500,
  ttl: 1000 * 60 * 5 // 5-min fresh
});

interface CachedData {
  value: any;
  timestamp: number;
  revalidateAfter: number; // SWR threshold
}

async function getWithSWR(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached) {
    // Within fresh window
    if (now - cached.timestamp < cached.revalidateAfter) {
      return cached.value;
    }

    // In stale window - return stale, revalidate in background
    if (now - cached.timestamp < cached.revalidateAfter * 2) {
      // Fire-and-forget revalidation
      fetcher().then(fresh => {
        cache.set(key, {
          value: fresh,
          timestamp: now,
          revalidateAfter: 1000 * 60 * 5
        });
      });
      return cached.value; // Serve stale immediately
    }
  }

  // Cache miss - fetch and cache
  const value = await fetcher();
  cache.set(key, {
    value,
    timestamp: now,
    revalidateAfter: 1000 * 60 * 5
  });
  return value;
}
```

**When to use:**
- **lru-cache**: Production Node.js, memory-bound workloads, need precise size limits
- **node-cache**: Simpler TTL-focused needs, auto-cleanup preference
- **Neither**: Use Redis if: multi-process, persistent cache needed, or distributed system

## Redis Caching Patterns

### Connection Pooling (Critical for Production)

```typescript
import Redis from 'ioredis';
import { createPool } from 'generic-pool';

// Recommended: Use connection pooling for better resource management
const factory = {
  create: async () => new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3
  }),
  destroy: async (client: Redis) => {
    await client.quit();
  }
};

const redisPool = createPool(factory, {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 5000
});

// Usage
async function cacheOperation(operation: (client: Redis) => Promise<any>) {
  const client = await redisPool.acquire();
  try {
    return await operation(client);
  } finally {
    await redisPool.release(client);
  }
}
```

### Cache-Aside Pattern (Most Common)

```typescript
async function getUser(userId: string, redis: Redis) {
  const cacheKey = `user:${userId}`;

  // 1. Try cache
  const cached = await redis.getBuffer(cacheKey);
  if (cached) {
    return JSON.parse(cached.toString());
  }

  // 2. Cache miss - fetch from DB
  const user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);

  // 3. Store in cache (with TTL)
  if (user) {
    await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5-min TTL
  }

  return user;
}
```

### Read-Through Pattern (Redis handles fetching)

```typescript
// Simulates Redis read-through with Lua scripts
async function readThrough(
  redis: Redis,
  key: string,
  ttl: number,
  fetcher: () => Promise<any>
) {
  // Lua script ensures atomic cache-or-fetch operation
  const script = `
    local value = redis.call('GET', KEYS[1])
    if value then
      return value
    end
    return nil
  `;

  let cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Single requestor fetches; others wait
  const lock = `${key}:lock`;
  const lockId = crypto.randomUUID();

  // Try to acquire lock (distributed lock pattern)
  const acquired = await redis.set(lock, lockId, 'EX', 5, 'NX');
  if (acquired) {
    try {
      const fresh = await fetcher();
      await redis.setex(key, ttl, JSON.stringify(fresh));
      return fresh;
    } finally {
      // Release lock only if we still hold it
      const currentLock = await redis.get(lock);
      if (currentLock === lockId) {
        await redis.del(lock);
      }
    }
  } else {
    // Lock not acquired, poll for cache
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 100));
      cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    }
    // Fallback: fetch directly (lock holder might have failed)
    return await fetcher();
  }
}
```

### Write-Through Pattern (Synchronous cache + DB update)

```typescript
async function updateUser(userId: string, updates: any, redis: Redis) {
  const cacheKey = `user:${userId}`;

  // 1. Update cache first (for consistency)
  const cached = await redis.get(cacheKey);
  const currentUser = cached ? JSON.parse(cached) : {};
  const updated = { ...currentUser, ...updates };
  await redis.setex(cacheKey, 300, JSON.stringify(updated));

  // 2. Persist to database
  await database.query(
    'UPDATE users SET data = ? WHERE id = ?',
    [JSON.stringify(updated), userId]
  );

  // 3. On failure, invalidate cache
  return updated;
}
```

### Cache Tagging for Grouped Invalidation

```typescript
// Manual tagging approach (Redis doesn't have built-in tags)
async function cacheWithTags(
  redis: Redis,
  key: string,
  value: any,
  ttl: number,
  tags: string[]
) {
  // Store value
  await redis.setex(key, ttl, JSON.stringify(value));

  // Register key under each tag
  for (const tag of tags) {
    await redis.sadd(`tag:${tag}`, key);
    // Ensure tag set expires too
    await redis.expire(`tag:${tag}`, ttl + 3600);
  }
}

async function invalidateByTag(redis: Redis, tag: string) {
  // Get all keys with this tag
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.del(`tag:${tag}`);
}

// Usage
await cacheWithTags(redis, 'product:123', productData, 300, ['products', 'featured']);
await invalidateByTag(redis, 'products'); // Invalidates all product caches
```

### TTL Jitter (Prevent Cache Stampede)

```typescript
function calculateTTLWithJitter(baseTTL: number, jitterPercent: number = 10) {
  const jitterAmount = (baseTTL * jitterPercent) / 100;
  const randomJitter = Math.random() * jitterAmount - jitterAmount / 2;
  return Math.floor(baseTTL + randomJitter);
}

async function setWithJitter(
  redis: Redis,
  key: string,
  value: any,
  baseTTL: number
) {
  const ttl = calculateTTLWithJitter(baseTTL);
  await redis.setex(key, ttl, JSON.stringify(value));
}

// Usage: Instead of all users' cache expiring at same time,
// they expire within ±10% of base TTL
await setWithJitter(redis, 'user:123', userData, 300); // 270-330 sec
```

## Cache Invalidation Strategies

### Time-Based (TTL)

```typescript
// Simple and predictable
await redis.setex('data', 600, value); // 10-min TTL

// Challenges: Stale data served until expiry, no sync with updates
```

### Event-Driven (Immediate)

```typescript
// When data changes
class UserService {
  async updateUser(userId: string, updates: any) {
    await db.updateUser(userId, updates);
    // Immediately invalidate
    await redis.del(`user:${userId}`);
    // Broadcast to other services
    await redis.publish('user:updated', JSON.stringify({ userId, updates }));
  }
}

// Other services listen
redis.on('message', (channel, data) => {
  if (channel === 'user:updated') {
    const { userId } = JSON.parse(data);
    // Handle invalidation
  }
});
```

### Versioned Cache Keys

```typescript
// Instead of deleting, create new version
let userVersion = 1;

async function getCachedUser(userId: string) {
  const key = `user:${userId}:v${userVersion}`;
  return await redis.get(key);
}

async function updateUser(userId: string, updates: any) {
  await db.updateUser(userId, updates);
  userVersion++; // Increment version, old key automatically expires
}

// Old keys expire via TTL, no delete needed
```

### Combination: TTL + Event-Driven

```typescript
// Best practice: Use both for different data types
async function cacheData(key: string, value: any, ttl: number, tags: string[]) {
  // Cache with moderate TTL
  await redis.setex(key, ttl, JSON.stringify(value));
  
  // Register for event-driven invalidation on critical updates
  for (const tag of tags) {
    await redis.sadd(`tag:${tag}`, key);
  }
}

// Use case mapping:
// - Product catalog: 1-hour TTL (can be stale)
// - User balance: Event-driven (must be immediate)
// - Search results: 5-min TTL + tag-based refresh
```

## Stale-While-Revalidate (SWR)

### HTTP Header Configuration

```typescript
// Express/Node.js
app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 
    'public, max-age=300, stale-while-revalidate=86400'
  );
  res.json(data);
});

// Behavior:
// - Fresh for 300 seconds (5 minutes)
// - Stale for 86400 seconds after that (1 day)
// - While stale, serve cached data + fetch fresh in background
// - After stale expires, must fetch fresh

// Static assets: Very long TTL + SWR
res.set('Cache-Control', 
  'public, max-age=31536000, stale-while-revalidate=2592000'
); // 1 year fresh, 30 days stale
```

### Client-Side SWR (React)

```typescript
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

function UserProfile({ userId }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate when window regains focus
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Don't fetch same URL within 2sec
      focusThrottleInterval: 300000, // Max 1 revalidation per 5min on focus
      refreshInterval: 0 // Don't auto-refresh (0 = disabled)
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.name}</div>;
}

// Manual revalidation
const { mutate } = useSWR(`/api/users/${userId}`, fetcher);
await mutate(); // Refresh immediately
```

### Server-Side SWR (Next.js 15)

```typescript
// app/api/products/route.ts
async function GET(request: Request) {
  const products = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 300, // Fresh for 5 minutes
      tags: ['products'] // For on-demand revalidation
    }
  }).then(r => r.json());

  return Response.json(products, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
    }
  });
}

// app/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const tag = request.headers.get('x-revalidate-tag') || 'products';
  revalidateTag(tag);
  return Response.json({ revalidated: true });
}
```

## Next.js 15 Data Caching

### Data Cache (Fetch-level)

```typescript
// Automatic caching (indefinite by default)
const users = await fetch('https://api.example.com/users', {
  next: { revalidate: 60 } // Revalidate after 60 seconds
}).then(r => r.json());

// Tags for on-demand revalidation
const user = await fetch('https://api.example.com/users/123', {
  next: {
    tags: ['users', 'user-123']
  }
}).then(r => r.json());
```

### Route Caching (Full Page)

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // Revalidate hourly (ISR)

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await fetch(`/api/posts/${params.slug}`, {
    next: { tags: [`post-${params.slug}`] }
  }).then(r => r.json());

  return <article>{post.content}</article>;
}
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret');
  
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, path, tag } = await request.json();

  if (type === 'path') {
    revalidatePath(path); // Revalidate single route
  } else if (type === 'tag') {
    revalidateTag(tag); // Revalidate all fetches with tag
  }

  return Response.json({ revalidated: true });
}

// From external service webhook:
await fetch('/api/revalidate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-revalidate-secret': process.env.REVALIDATE_SECRET
  },
  body: JSON.stringify({ type: 'tag', tag: 'products' })
});
```

## Database Query Caching

### Prisma Accelerate (Built-in Caching)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Time-based caching
const users = await prisma.user.findMany({
  cacheStrategy: {
    ttl: 60, // Cache for 60 seconds
  },
});

// Stale-while-revalidate
const posts = await prisma.post.findMany({
  where: { published: true },
  cacheStrategy: {
    swr: 120, // Serve stale for 120 seconds while revalidating
  },
});

// Combined TTL + SWR (Recommended)
const products = await prisma.product.findMany({
  cacheStrategy: {
    ttl: 30, // Fresh for 30 seconds
    swr: 300, // Stale for additional 300 seconds (5 minutes total)
  },
});

// No caching (default)
const realtime = await prisma.order.findUnique({
  where: { id: orderId },
  // No cacheStrategy = always fetch
});
```

### Manual Redis + Prisma Integration

```typescript
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

// Wrapper for cached queries
async function findUserCached(userId: string) {
  const cacheKey = `user:${userId}`;

  // 1. Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss - query database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // 3. Cache result (5 minutes)
  if (user) {
    await redis.setex(cacheKey, 300, JSON.stringify(user));
  }

  return user;
}

// Query invalidation on mutation
async function updateUser(userId: string, data: any) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  // Invalidate cache
  await redis.del(`user:${userId}`);

  return user;
}
```

### ORM-Level Caching Extension

```typescript
// Using prisma extension (Prisma Client v5+)
const prismaWithCache = prisma.$extends({
  query: {
    async user({ model, operation, args, query }) {
      const cacheKey = `prisma:${model}:${operation}:${JSON.stringify(args)}`;
      
      // Only cache read operations
      if (!['findUnique', 'findMany', 'findFirst'].includes(operation)) {
        return query(args);
      }

      // Try cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Execute and cache
      const result = await query(args);
      if (result) {
        await redis.setex(cacheKey, 300, JSON.stringify(result));
      }

      return result;
    }
  }
});

// Transparent caching
const user = await prismaWithCache.user.findUnique({
  where: { id: 1 }
}); // Uses cache automatically
```

## HTTP & CDN Caching

### Cache-Control Headers Reference

```typescript
// Static assets (CSS, JS, images): Very aggressive
'Cache-Control: public, max-age=31536000, immutable'
// Public: Can be cached by anyone
// max-age: 1 year
// immutable: Won't change

// HTML (pages): Conservative, always revalidate
'Cache-Control: max-age=0, no-cache, must-revalidate'
// max-age=0: Immediately stale
// no-cache: Always revalidate before serving
// must-revalidate: Don't serve stale on error

// API responses: SWR for UX
'Cache-Control: public, max-age=300, stale-while-revalidate=86400'
// Fresh for 5 min, stale for 1 day

// User-specific data: Don't cache in shared caches
'Cache-Control: private, max-age=300'
// private: Only in browser cache, not CDN

// Prevent caching sensitive data
'Cache-Control: no-store'
// Disables all caching
```

### ETag & Conditional Requests

```typescript
import crypto from 'crypto';

// Server: Generate ETag on response
app.get('/api/data', (req, res) => {
  const data = { id: 1, name: 'Product' };
  const etag = `"${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;

  // Check if-none-match (browser has this ETag)
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(data);
});

// Browser sends If-None-Match on subsequent requests
// If ETag matches, server responds 304 (no body transfer)
// If different, server responds 200 with new data + new ETag
```

### Cloudflare CDN Caching

```typescript
// Set in Next.js API routes or Express
app.get('/api/data', (req, res) => {
  res.set('CDN-Cache-Control', 'public, max-age=3600');
  res.set('Cache-Control', 'public, max-age=300');
  
  res.json(data);
});

// Behavior:
// - Cloudflare edge: Caches for 3600 sec
// - Browser: Caches for 300 sec
// - Other CDNs: Use Cache-Control

// On-demand CDN cache invalidation (Cloudflare API)
// Purge by tag from worker or webhook
```

## Best Practices & Anti-Patterns

### ✅ DO's

| Do | Why |
|---|---|
| Add jitter to TTLs | Prevents cache stampede when many entries expire simultaneously |
| Use tags for grouped invalidation | More efficient than clearing entire cache |
| Cache immutable by content hash | Enables infinite TTLs on static assets |
| Implement connection pooling for Redis | Reuses connections, prevents exhaustion |
| Monitor cache hit ratios | Identify ineffective caching strategies |
| Serve stale on errors | Better UX than broken pages |
| Separate concerns (tags, versioning) | Reduces cache key collisions |
| Set appropriate TTLs by data type | Product data: 1h, User data: 5m, Search: 10m |

### ❌ DON'Ts

| Don't | Why |
|---|---|
| Cache without TTL | Stale data persists forever |
| Use user-specific data as shared cache key | Cache poisoning vulnerability |
| Cache authentication tokens | Security risk, use session store instead |
| Forget to invalidate on updates | Users see outdated data |
| Cache all database queries identically | Some queries are expensive, deserve longer TTLs |
| Ignore cache hit/miss metrics | Can't optimize without data |
| Use `Cache-Control: private` incorrectly | Defeats CDN benefits for user-specific content |
| Stampede protection everywhere | Adds complexity to simple operations |

### Cache Poisoning Prevention

```typescript
// ❌ DANGEROUS: User input in cache key
const cacheKey = `user:${req.headers['x-user-id']}`; // Attacker controls header

// ✅ SAFE: Validate and normalize cache keys
function getCacheKey(userId: string) {
  const normalized = String(userId).replace(/[^0-9]/g, '');
  if (!normalized) throw new Error('Invalid user ID');
  return `user:${normalized}`;
}

// ❌ DANGEROUS: Cache sensitive data with public flag
res.set('Cache-Control', 'public, max-age=3600');
res.json({ password: user.password }); // Exposed to all

// ✅ SAFE: Use private for user-specific data
res.set('Cache-Control', 'private, max-age=3600');
res.json({ email: user.email });

// ❌ DANGEROUS: No validation of cache values
const user = JSON.parse(cachedData); // Could be malformed

// ✅ SAFE: Validate deserialized data
try {
  const parsed = JSON.parse(cachedData);
  if (!parsed.id) throw new Error('Invalid user object');
  return parsed;
} catch (e) {
  // Invalidate cache entry
  await redis.del(key);
  // Fetch fresh from source
  return await fetchUser();
}
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **Cache stampede on key expiry** | All requests miss simultaneously | Add TTL jitter: `ttl + random(-10%, +10%)` |
| **Stale data forever** | No TTL set | Always set max-age or use event-driven invalidation |
| **Memory bloat** | Unbounded in-memory cache | Set `max` items in LRU cache or use `maxSize` bytes |
| **Redis connection timeouts** | No connection pooling | Use generic-pool or ioredis with `maxRetriesPerRequest` |
| **Cache inconsistency** | Invalidation doesn't reach all instances | Use Redis pub/sub or centralized invalidation API |
| **Users see outdated data** | Cache not cleared after update | Call invalidation immediately after DB write |
| **CDN serves wrong user's data** | Cache-Control missing private flag | Use `private` for user-specific responses |
| **Infinite redirect loops** | Cached redirect responses | Don't cache redirects; use `Cache-Control: no-store` |

## Monitoring & Debugging

```typescript
// Cache hit/miss tracking
class CacheMetrics {
  hits = 0;
  misses = 0;

  get hitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  logStats() {
    console.log(`Cache Hit Rate: ${this.hitRate.toFixed(2)}%`);
    console.log(`Hits: ${this.hits}, Misses: ${this.misses}`);
  }
}

// Instrument cache operations
async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = await redis.get(key);
  
  if (cached) {
    metrics.hits++;
    return JSON.parse(cached);
  }

  metrics.misses++;
  const data = await fetcher();
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
}

// Redis memory inspection
async function inspectRedis(redis: Redis) {
  const info = await redis.info('memory');
  const stats = await redis.dbsize();
  
  console.log(`Memory used: ${info.match(/used_memory_human:(.+)/)?.[1]}`);
  console.log(`Keys in DB: ${stats}`);
}
```

## Architecture Decision Guide

### Single Process (Development)
```typescript
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, ttl: 300000 });
// Simple, no dependencies, perfect for local dev
```

### Multiple Processes (Production with One Server)
```typescript
// Use Redis even on single server for cache sharing across processes
import Redis from 'ioredis';
const redis = new Redis(); // Separate Redis instance
// All processes share same cache data
```

### Distributed System (Multiple Servers)
```typescript
// Multi-tier caching
// L1: In-memory LRU (5-minute TTL) on each process
// L2: Redis (shared across all processes)
// L3: Database (source of truth)

// L1 misses → L2
// L2 misses → L3, populate both L1 and L2
```

### Multi-Region (Global)
```typescript
// Edge caching (Cloudflare/Vercel):
// - Cache near users
// - Revalidate from origin
// - Invalidation via tags/purge API

// Origin caching (Redis):
// - Authoritative cache
// - Invalidation on data changes
```

## References

- **lru-cache**: https://github.com/isaacs/node-lru-cache
- **ioredis**: https://github.com/luin/ioredis
- **Redis Docs**: https://redis.io/docs/latest/develop/clients/
- **HTTP Caching**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
- **Next.js Caching**: https://nextjs.org/docs/app/getting-started/caching-and-revalidating
- **Prisma Caching**: https://www.prisma.io/docs/postgres/database/caching
- **Cloudflare Cache**: https://developers.cloudflare.com/cache/
- **SWR (HTTP & React)**: https://www.rfc-editor.org/rfc/rfc5861
- **Cache Stampede Prevention**: https://www.designgurus.io/answers/detail/how-do-you-mitigate-the-thundering-herd-problem
