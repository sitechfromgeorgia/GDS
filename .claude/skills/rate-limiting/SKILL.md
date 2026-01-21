---
name: implementing-production-rate-limiting
description: Implements production-grade rate limiting for APIs and web applications using Redis-based algorithms, serverless patterns, and modern frameworks. Use when building APIs, protecting endpoints from abuse, implementing tiered subscription limits, or deploying to serverless environments like Vercel, Cloudflare Workers, or Lambda.
---

# Implementing Production-Grade Rate Limiting

## Quick Start

### Basic Token Bucket with Redis (TypeScript)

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Token bucket rate limiter
async function rateLimit(userId: string, limit: number = 100, windowMs: number = 60000) {
  const key = `rate:${userId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Lua script for atomic operation
  const script = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
    local current = redis.call('ZCARD', key)
    
    if current < limit then
      redis.call('ZADD', key, now, now)
      redis.call('EXPIRE', key, math.ceil((ARGV[3] - window_start) / 1000) + 1)
      return {1, limit - current - 1}
    else
      return {0, 0}
    end
  `;

  try {
    const result = await redis.eval(script, [key], [limit, windowStart, now]);
    return { allowed: result[0] === 1, remaining: result[1] };
  } catch {
    // Fail open on Redis error
    return { allowed: true, remaining: limit };
  }
}

// Usage
const result = await rateLimit("user:123");
if (!result.allowed) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

### Next.js Middleware Example

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const identifier = request.ip || "anonymous";
  const { success, pending } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { 
        status: 429,
        headers: {
          "Retry-After": "10",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        }
      }
    );
  }

  // Wait for pending operations on edge runtime
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", "9");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
```

---

## When to Use This Skill

**Implement rate limiting when:**
- Building production APIs exposed to untrusted clients
- Protecting expensive operations (payments, file uploads, ML inference)
- Preventing brute force attacks on authentication endpoints
- Managing quota for tiered subscription plans
- Deploying to serverless (Lambda, Vercel, Cloudflare Workers)
- Defending against DDoS and bot attacks
- Implementing fair resource allocation across users

**Choose algorithms based on requirements:**
- **Token Bucket**: Allows bursts up to limit (Stripe, Amazon pattern)
- **Sliding Window**: Most accurate but memory-intensive
- **Fixed Window**: Simplest, counter-based approach
- **Leaky Bucket**: Smooths traffic to constant rate

---

## Core Concepts & Algorithm Selection

### Token Bucket Algorithm

**How it works:** Tokens accumulate at a fixed rate. Each request consumes 1 token. When bucket is full, excess tokens are discarded. Request succeeds only if token available.

**Characteristics:**
- Burst friendly (allows spike up to bucket size)
- 0.7ms latency on Redis Cluster
- Perfect for handling traffic spikes
- Used by: Stripe, Amazon API Gateway

**Trade-offs:**
- ✅ Allows legitimate traffic bursts
- ✅ Smooth recovery when under limit
- ❌ Memory overhead (tracks token state)

**When to use:** Public APIs, user-facing services, subscription tiers

### Sliding Window Log Algorithm

**How it works:** Maintains timestamp log of all requests in window. Count requests in window; if <= limit, allow request and log timestamp.

**Characteristics:**
- Most accurate (no boundary effects)
- 2.5ms latency on distributed systems
- Precise quota enforcement

**Trade-offs:**
- ✅ Perfect accuracy
- ✅ No burst exploitation
- ❌ High memory (stores every request timestamp)
- ❌ Slower at scale

**When to use:** Critical APIs (payments), tight quota enforcement

### Fixed Window Counter

**How it works:** Counter increments per request. Resets every window. Request allowed if counter < limit.

**Characteristics:**
- Simplest implementation
- Fastest (single increment)
- Predictable behavior

**Trade-offs:**
- ✅ Minimal memory
- ✅ Fastest operation
- ❌ Boundary effects (requests cluster at window edges)
- ❌ Can allow 2x limit requests at boundary

**When to use:** Internal APIs, background jobs, simple requirements

### Sliding Window Counter

**How it works:** Hybrid approach. Tracks requests across current and previous window using weighted calculation.

**Characteristics:**
- Balance between accuracy and performance
- Fewer false positives than fixed window
- Memory efficient

**Trade-offs:**
- ✅ Better than fixed window accuracy
- ✅ More memory efficient than sliding log
- ❌ Still has minor boundary effects

**When to use:** General-purpose APIs, good accuracy-performance balance

### Decision Tree

```
Choose algorithm based on:

1. Accuracy Required?
   YES → Sliding Window Log (most accurate)
   NO → Continue to 2

2. Burst Traffic Expected?
   YES → Token Bucket
   NO → Continue to 3

3. Simplicity Priority?
   YES → Fixed Window Counter
   NO → Sliding Window Counter
```

---

## Redis-Based Implementation

### Atomic Operations & Lua Scripts

Redis single-threaded event loop ensures Lua scripts execute atomically. This prevents race conditions when:
- Reading current count
- Checking against limit
- Incrementing counter
- Setting expiration

All happen as one indivisible unit.

**Why not just GET + INCR?**
```typescript
// ❌ RACE CONDITION - two requests can both slip through
const current = await redis.get(key);        // Thread gap here!
if (current > limit) return false;
await redis.incr(key);
```

Between `get()` and `incr()`, another request can check the old value.

**✅ CORRECT - Lua executes atomically**
```typescript
const script = `
  local current = redis.call('get', KEYS[1])
  if tonumber(current) > tonumber(ARGV[1]) then
    return 0
  end
  redis.call('incr', KEYS[1])
  return 1
`;
await redis.eval(script, [key], [limit]);
```

### Token Bucket Implementation

```typescript
const tokenBucketScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])  -- tokens per second
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])    -- tokens requested
  
  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1]) or limit
  local last_refill = tonumber(bucket[2]) or now
  
  -- Calculate tokens to add
  local elapsed = math.max(0, now - last_refill)
  tokens = math.min(limit, tokens + (elapsed * refill_rate))
  
  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return {1, math.floor(tokens)}
  else
    return {0, math.floor(tokens)}
  end
`;

// Usage: 100 tokens, refill at 10/second
async function checkTokenBucket(
  userId: string, 
  limit: number = 100,
  refillRate: number = 10
) {
  const result = await redis.eval(
    tokenBucketScript,
    [`rate:${userId}`],
    [limit, refillRate / 1000, Date.now(), 1]  // per millisecond
  );
  
  return {
    allowed: result[0] === 1,
    tokensRemaining: result[1],
  };
}
```

### Sliding Window Implementation

```typescript
const slidingWindowScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])     -- milliseconds
  local now = tonumber(ARGV[3])
  local window_start = now - window
  
  -- Remove old entries outside window
  redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
  
  -- Count requests in window
  local current = redis.call('ZCARD', key)
  
  if current < limit then
    -- Add current request with timestamp as score
    redis.call('ZADD', key, now, now)
    -- Expire key after window ends
    redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)
    return {1, limit - current - 1}
  else
    return {0, 0}
  end
`;

async function checkSlidingWindow(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000  // 1 minute
) {
  const result = await redis.eval(
    slidingWindowScript,
    [`window:${userId}`],
    [limit, windowMs, Date.now()]
  );
  
  return {
    allowed: result[0] === 1,
    remaining: result[1],
  };
}
```

### Redis Cluster Considerations

**Issue:** With Redis Cluster, keys hash to different nodes. Distributed rate limiting needs coordination.

**Solutions:**

1. **Hash-based partitioning** (simplest)
   ```typescript
   // All user keys go to same slot using {}
   const key = `{user:${userId}}:rate`;  // slots same node
   ```

2. **Upstash Multi-Region** (recommended for critical)
   ```typescript
   const ratelimit = new Ratelimit({
     redis: [
       new Redis({ /* us-east */ }),
       new Redis({ /* eu-west */ }),
     ],
     limiter: Ratelimit.fixedWindow(100, "1 h"),
   });
   ```

3. **Single Redis instance** (for small scale)
   - Simplest
   - No coordination needed
   - Single point of failure

---

## Per-User and Per-Resource Limits

### Identifying Users

```typescript
// Priority order:
// 1. Authenticated user ID (JWT, session)
// 2. API key
// 3. IP address
// 4. Anonymous (fingerprint)

function getIdentifier(request: NextRequest): string {
  // From JWT
  const token = request.headers.get("authorization")?.split(" ")[1];
  if (token) {
    const decoded = jwt.decode(token);
    return `user:${decoded.sub}`;
  }

  // From API key header
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    return `key:${apiKey}`;
  }

  // From IP
  const ip = request.ip || request.headers.get("x-forwarded-for");
  return `ip:${ip}`;
}
```

### Multi-Dimensional Rate Limiting

```typescript
// Limit per: user, endpoint, AND method
async function checkMultiDimensional(
  userId: string,
  endpoint: string,
  method: string
) {
  const checks = [
    // User-level global
    rateLimit(`user:${userId}:global`, 10000, "1d"),
    
    // User + endpoint
    rateLimit(`user:${userId}:${endpoint}`, 100, "1h"),
    
    // Endpoint-level (shared across users)
    rateLimit(`endpoint:${endpoint}`, 100000, "1h"),
    
    // Method-specific (expensive operations)
    method === "POST" 
      ? rateLimit(`user:${userId}:write`, 50, "1h")
      : rateLimit(`user:${userId}:read`, 1000, "1h"),
  ];

  const results = await Promise.all(checks);
  
  // Any check failed = request blocked
  const passed = results.every(r => r.allowed);
  const blocking = results.find(r => !r.allowed);
  
  return { passed, reason: blocking?.key };
}
```

### Tiered Subscription Limits

```typescript
const TIERS = {
  free: { requests: 100, window: 3600 },        // 100/hour
  pro: { requests: 10000, window: 3600 },       // 10k/hour
  enterprise: { requests: 1000000, window: 3600 }, // 1M/hour
};

async function checkWithTier(userId: string, tier: keyof typeof TIERS) {
  const tierConfig = TIERS[tier];
  const key = `rate:${userId}:${tier}`;
  
  // Use tier-specific limits
  return rateLimit(key, tierConfig.requests, tierConfig.window);
}
```

### Dynamic Rate Limit Adjustment

```typescript
// Adjust limits based on server load
async function getDynamicLimit(userId: string) {
  const cpuUsage = await getServerLoad();
  const baseLimit = 100;
  
  // Reduce limits under high load
  if (cpuUsage > 80) {
    return Math.floor(baseLimit * 0.5);  // 50
  } else if (cpuUsage > 50) {
    return Math.floor(baseLimit * 0.75); // 75
  }
  
  return baseLimit; // 100
}

// Store dynamic override in Redis
async function setDynamicLimit(userId: string, limit: number) {
  await redis.set(
    `limit:override:${userId}`,
    limit,
    { ex: 3600 }  // 1 hour
  );
}
```

---

## API Protection Patterns

### HTTP Headers for Rate Limiting

**Standard Headers (RateLimit-3)**

```typescript
function setRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  resetTimestampSeconds: number
) {
  response.headers.set("RateLimit-Limit", limit.toString());
  response.headers.set("RateLimit-Remaining", remaining.toString());
  response.headers.set("RateLimit-Reset", resetTimestampSeconds.toString());
}

// Or classic X-RateLimit headers (GitHub, Twitter style)
response.headers.set("X-RateLimit-Limit", "60");
response.headers.set("X-RateLimit-Remaining", "59");
response.headers.set("X-RateLimit-Reset", "1691172000");
```

### 429 Response with Retry-After

```typescript
function createRateLimitResponse(resetSeconds: number) {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: resetSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": resetSeconds.toString(),
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.floor(Date.now() / 1000 + resetSeconds).toString(),
      },
    }
  );
}
```

### Client-Side Retry Logic

```typescript
// Exponential backoff with Retry-After header
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);

    if (response.status !== 429) {
      return response;
    }

    if (attempt === maxRetries - 1) {
      throw new Error("Max retries exceeded");
    }

    // Use Retry-After if available, otherwise exponential backoff
    let delayMs: number;
    const retryAfter = response.headers.get("Retry-After");
    
    if (retryAfter) {
      if (!isNaN(Number(retryAfter))) {
        delayMs = Number(retryAfter) * 1000;
      } else {
        delayMs = new Date(retryAfter).getTime() - Date.now();
      }
    } else {
      delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
```

---

## Framework-Specific Implementations

### Express.js Middleware

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "redis";

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  statusCode: 429,
  skip: (req) => req.user?.isPremium, // Skip for premium users
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
});

app.get("/api/data", limiter, (req, res) => {
  res.json({ data: "protected" });
});

// Per-endpoint limits
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Maximum 5 login attempts per hour",
});

app.post("/login", strictLimiter, (req, res) => {
  // Handle login
});
```

### Next.js API Routes (App Router)

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.tokenBucket(100, "1 h", 10), // 10 req/sec burst
});

export async function GET(request: NextRequest) {
  const identifier = request.headers.get("x-api-key") ||
                    request.ip ||
                    "anonymous";

  const { success, pending, limit, remaining, reset } = 
    await ratelimit.limit(identifier);

  // Handle edge runtime async cleanup
  const response = NextResponse.json(
    { data: "success", remaining },
    { status: success ? 200 : 429 }
  );

  // Add headers for rate limit info
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  if (!success) {
    response.headers.set("Retry-After", Math.ceil((reset - Date.now()) / 1000).toString());
  }

  if (pending) {
    // Edge runtime: wait for pending operations
    // On Vercel Edge Functions use waitUntil pattern via NextFetchEvent
  }

  return response;
}
```

### Fastify Plugin

```typescript
import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";

const app = Fastify();

await app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "15 minutes",
  redis: "redis://127.0.0.1:6379",
  skip: (request) => request.user?.tier === "premium",
  keyGenerator: (request) => {
    return request.user?.id || request.ip;
  },
});

app.get("/api/data", async (request, reply) => {
  return { data: "success" };
});
```

### Cloudflare Workers

```typescript
// wrangler.toml
name = "rate-limit-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-id"

---

// src/index.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 m"),
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const identifier = new URL(request.url).searchParams.get("user") ||
                      request.headers.get("cf-connecting-ip") ||
                      "anonymous";

    const { success, pending } = await ratelimit.limit(identifier);

    if (!success) {
      ctx.waitUntil(pending);
      return new Response("Rate limited", { status: 429 });
    }

    ctx.waitUntil(pending);
    return new Response("OK", { status: 200 });
  },
};
```

---

## Configuration Patterns

### Environment Variables

```bash
# Redis
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Or self-hosted
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting Config
RATE_LIMIT_WINDOW_MS=3600000       # 1 hour
RATE_LIMIT_MAX_REQUESTS=100        # requests per window
RATE_LIMIT_ENABLED=true
RATE_LIMIT_FAIL_OPEN=true          # Allow on Redis failure

# DDoS Protection
DDoS_THRESHOLD=10000               # requests/minute
DDoS_BLOCK_DURATION=300            # 5 minutes

# Advanced
RATE_LIMIT_KEY_PREFIX=api          # prevent collisions
RATE_LIMIT_CLUSTER_MODE=false
```

### TypeScript Configuration

```typescript
interface RateLimitConfig {
  // Algorithm
  algorithm: "tokenBucket" | "slidingWindow" | "fixedWindow";
  
  // Limits
  requestsPerWindow: number;
  windowMs: number;
  
  // Burst (token bucket only)
  refillRate?: number;
  
  // Behavior
  failOpen?: boolean;              // Allow on Redis failure
  skipKey?: (key: string) => boolean;
  onLimit?: (key: string) => void; // Monitoring hook
  
  // Redis
  redis: {
    url: string;
    token: string;
    maxRetries?: number;
  };
}

const config: RateLimitConfig = {
  algorithm: "tokenBucket",
  requestsPerWindow: 100,
  windowMs: 60 * 1000,
  refillRate: 10, // 10 requests/second
  failOpen: true,
};
```

---

## Graceful Degradation & Failover

### Fail-Open Strategy

```typescript
async function rateLimitWithFallback(
  userId: string,
  limit: number = 100
) {
  try {
    // Try Redis
    return await checkRedisLimit(userId, limit);
  } catch (error) {
    console.error("Rate limiter Redis error:", error);
    
    // Fail open: allow request but log for investigation
    if (process.env.RATE_LIMIT_FAIL_OPEN === "true") {
      console.warn(`Rate limit check failed for ${userId}, allowing request`);
      return { allowed: true, remaining: limit };
    }
    
    // Fail closed: reject to be safe
    throw new Error("Rate limiter unavailable");
  }
}
```

### Circuit Breaker Integration

```typescript
import CircuitBreaker from "opossum";

const redisLimiterBreaker = new CircuitBreaker(
  async (key: string) => checkRedisLimit(key, 100),
  {
    timeout: 1000,              // 1 second
    errorThresholdPercentage: 50, // Open if >50% fail
    resetTimeout: 30000,        // Try again after 30s
    fallback: () => ({ allowed: true, remaining: 100 }), // Fail open
  }
);

// Use breaker
try {
  const result = await redisLimiterBreaker.fire("user:123");
  if (!result.allowed) return new Response("Rate limited", { status: 429 });
} catch (error) {
  // Circuit is open or fallback triggered
  return new Response("Service temporarily unavailable", { status: 503 });
}
```

### Multi-Level Fallback

```typescript
async function multiLevelRateLimit(userId: string) {
  // Level 1: Try Redis
  try {
    return await redis.eval(script, [key], args);
  } catch (err) {
    console.warn("Redis failed, trying memory fallback");
  }

  // Level 2: In-memory cache (risky in distributed, but better than nothing)
  const memoryKey = `mem:${userId}`;
  const cached = memoryCache.get(memoryKey);
  
  if (!cached) {
    memoryCache.set(memoryKey, { count: 1, expires: Date.now() + 60000 });
    return { allowed: true };
  }

  if (Date.now() > cached.expires) {
    cached.count = 0;
    cached.expires = Date.now() + 60000;
  }

  cached.count++;
  return { allowed: cached.count <= 100 };
}
```

---

## Common Errors & Solutions

### "READONLY You can't write against a read only replica"

**Cause:** Connected to Redis replica instead of primary.

**Fix:**
```typescript
// Use URL with correct endpoint
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL, // Upstash handles primary
});

// Or explicit primary connection
const redis = new Redis({
  host: "primary.redis.cluster",
  port: 6379,
});
```

### "WRONGTYPE Operation against a key holding the wrong kind of value"

**Cause:** Mixing data structures (using SET on ZSET key, vice versa).

**Fix:**
```typescript
// Use consistent script - choose ONE data structure per key:
// Option 1: Sorted Set (recommended for sliding window)
redis.call('ZADD', key, timestamp, value)

// Option 2: Hash (recommended for token bucket)
redis.call('HMSET', key, 'tokens', value)

// Use different keys to avoid mixing
const tokenKey = `tokens:${userId}`;  // Hash
const logKey = `log:${userId}`;       // Sorted Set
```

### Race Conditions Without Lua

**Symptom:** Rate limit exceeded even though under limit on high concurrency.

**Fix:** Always use Lua scripts:
```typescript
// ❌ NOT SAFE
const count = await redis.get(key);
if (count > 100) return false;
await redis.incr(key);

// ✅ SAFE - Use Lua for atomicity
const script = `
  local count = redis.call('get', KEYS[1])
  if tonumber(count) > 100 then return 0 end
  redis.call('incr', KEYS[1])
  return 1
`;
```

### Memory Bloat from Expired Keys

**Symptom:** Redis memory usage grows over time.

**Fix:** Always set expiration:
```typescript
// ✅ Always EXPIRE
redis.call('ZADD', key, now, value);
redis.call('EXPIRE', key, math.ceil(window / 1000) + 1);

// Or set with EX inline
redis.call('SET', key, value, 'EX', 3600);
```

### Vercel Edge Function Hanging

**Cause:** Async operation not awaited on edge runtime.

**Fix:**
```typescript
export async function GET(request: NextRequest, context: any) {
  const { success, pending } = await ratelimit.limit(identifier);
  
  // Don't return yet - wait for pending
  const response = NextResponse.json({});
  
  // Fire-and-forget pending cleanup
  context.waitUntil?.(pending);
  
  return response;
}
```

---

## Monitoring & Observability

### Key Metrics to Track

```typescript
interface RateLimitMetrics {
  totalRequests: number;
  allowedRequests: number;
  rejectedRequests: number;
  rejectionRate: number; // rejected / total
  p95Latency: number;    // 95th percentile latency
  redisErrors: number;
  failoverActivations: number;
}

// Prometheus-style metrics
const rateLimitMetrics = new Map();

// Counter: total requests
prometheus.counter("rate_limit_total_requests", "Total requests checked");

// Counter: rejected
prometheus.counter("rate_limit_rejected_total", "Total rejected requests", [
  "reason", // "limit_exceeded", "redis_error", "config_issue"
]);

// Gauge: current rejection rate
prometheus.gauge("rate_limit_rejection_rate", "Current rejection rate");

// Histogram: latency
prometheus.histogram("rate_limit_check_duration_ms", "Rate limit check latency");

// Example emission
const start = Date.now();
const result = await rateLimit(userId);
const duration = Date.now() - start;

prometheus.counter("rate_limit_total_requests").inc();
prometheus.histogram("rate_limit_check_duration_ms").observe(duration);

if (!result.allowed) {
  prometheus.counter("rate_limit_rejected_total", { reason: "limit_exceeded" }).inc();
}
```

### Logging Suspicious Activity

```typescript
async function checkLimitWithLogging(userId: string, limit: number) {
  const result = await checkLimit(userId, limit);

  if (!result.allowed) {
    const now = new Date().toISOString();
    const logEntry = {
      timestamp: now,
      userId,
      event: "rate_limit_exceeded",
      limit,
      window: "1h",
      severity: result.remaining < -10 ? "high" : "medium",
    };

    // Log for investigation
    logger.warn("Rate limit exceeded", logEntry);

    // Alert if severely over
    if (result.remaining < -50) {
      alerting.sendSlack({
        text: `🚨 Severe rate limit abuse: ${userId}`,
        fields: logEntry,
      });
    }
  }

  return result;
}
```

### DataDog Integration

```typescript
import { StatsD } from "node-dogstatsd";

const dogstatsd = new StatsD();

async function rateLimitWithDataDog(userId: string) {
  const tags = [`user:${userId}`, `endpoint:/api/data`];
  
  dogstatsd.histogram("rate_limit.check.duration", duration, tags);
  dogstatsd.gauge("rate_limit.remaining", remaining, tags);
  
  if (!allowed) {
    dogstatsd.increment("rate_limit.rejected", 1, tags);
    dogstatsd.event("Rate limit exceeded", { userId }, { alert_type: "warning" });
  }
}
```

---

## Security Checklist

- [ ] **Rate limit by authenticated ID first**, IP second, not IP alone (prevents DDoS bypass)
- [ ] **Always use Lua scripts** for atomicity (prevents race conditions)
- [ ] **Set expiration on all keys** to prevent memory bloat
- [ ] **Implement fail-open gracefully** if Redis fails (don't block traffic)
- [ ] **Monitor rejection rate** - sudden spike = attack pattern
- [ ] **Use HTTPS only** for API keys in headers
- [ ] **Hash API keys** in logs (don't log full tokens)
- [ ] **Implement circuit breaker** around Redis calls
- [ ] **Test rate limiting** with concurrent requests (k6, locust)
- [ ] **Document rate limits** in API docs with examples
- [ ] **Provide Retry-After header** to help clients backoff
- [ ] **Use IP header validation** - don't trust X-Forwarded-For blindly
- [ ] **Rotate API keys regularly** if user-based limits
- [ ] **Alert on:** sustained high rejection rate, Redis connection loss, suspicious patterns

---

## Testing Rate Limits

### k6 Load Test

```javascript
// rate-limit-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,          // 10 concurrent users
  duration: "30s",
  rps: 100,         // 100 requests per second
};

export default function () {
  const url = "http://localhost:3000/api/data";
  
  const response = http.get(url, {
    headers: { "X-API-Key": "test-key" },
  });

  check(response, {
    "status is 200 or 429": (r) => r.status === 200 || r.status === 429,
    "has rate limit header": (r) => r.headers["X-RateLimit-Limit"],
  });

  sleep(0.1);
}

// Run: k6 run rate-limit-test.js
```

### Unit Test (Vitest)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { Redis } from "@upstash/redis";

describe("Rate Limiting", () => {
  let redis: Redis;

  beforeEach(() => {
    redis = new Redis({
      url: process.env.REDIS_URL_TEST!,
      token: process.env.REDIS_TOKEN_TEST!,
    });
  });

  it("should allow requests under limit", async () => {
    const result = await rateLimit("test-user", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("should reject requests over limit", async () => {
    // Make 5 requests to hit limit
    for (let i = 0; i < 5; i++) {
      await rateLimit("test-user-2", 5, 60000);
    }

    const sixthRequest = await rateLimit("test-user-2", 5, 60000);
    expect(sixthRequest.allowed).toBe(false);
  });

  it("should reset after window expires", async () => {
    const shortWindow = 100; // 100ms
    
    await rateLimit("test-user-3", 1, shortWindow);
    const result1 = await rateLimit("test-user-3", 1, shortWindow);
    expect(result1.allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, shortWindow + 10));

    const result2 = await rateLimit("test-user-3", 1, shortWindow);
    expect(result2.allowed).toBe(true);
  });
});
```

---

## References

- **Upstash Rate Limit** - https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- **express-rate-limit** - https://express-rate-limit.mintlify.app/overview
- **rate-limiter-flexible** - https://github.com/animir/node-rate-limiter-flexible
- **Redis Lua Scripts** - https://redis.io/commands/eval/
- **RFC 6585 (429 Status Code)** - https://tools.ietf.org/html/rfc6585
- **RateLimit-3 Header Spec** - https://github.com/aoferederation/ratelimit-headers
- **Redis Error Handling** - https://redis.io/docs/develop/clients/error-handling/
- **Prometheus Monitoring** - https://prometheus.io/docs/guides/go-prometheus/
