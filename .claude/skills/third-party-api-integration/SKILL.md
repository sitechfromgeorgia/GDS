---
name: integrating-third-party-apis
description: Implements production-grade third-party API integration patterns with resilient retries, OAuth 2.0 PKCE flows, secure secret management, type-safe clients using openapi-fetch, and comprehensive error handling. Use when building integrations with external APIs, implementing authentication flows, designing resilient systems, or adding third-party service clients to Node.js/Next.js applications.
---

# Integrating Third-Party APIs: Production Patterns (2025)

## Quick Start

Install dependencies:

```bash
npm install openapi-fetch zod opossum p-retry msw
```

Create a resilient, type-safe API client:

```typescript
import createClient from 'openapi-fetch';
import { z } from 'zod';
import CircuitBreaker from 'opossum';

// 1. Define response schema with Zod
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>;

// 2. Create type-safe client (from OpenAPI spec)
import type { paths } from './api.types'; // Generated from OpenAPI

const { GET, POST } = createClient<paths>({
  baseUrl: process.env.API_BASE_URL,
});

// 3. Add circuit breaker for resilience
const breaker = new CircuitBreaker(
  async (userId: string): Promise<User> => {
    const { data, error } = await GET('/users/{id}', {
      params: { path: { id: userId } },
    });

    if (error) throw new Error(`API error: ${error.message}`);
    
    // Validate response at runtime
    return UserSchema.parse(data);
  },
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

// 4. Use with retry logic
const user = await breaker.fire('user-123').catch((err) => {
  console.error('Failed after retries:', err.message);
  throw err;
});
```

## When to Use This Skill

- Building integrations with REST/GraphQL external APIs
- Implementing OAuth 2.0 flows with PKCE (client-side or server-side)
- Adding resilience patterns (retries, circuit breakers, rate limiting)
- Managing API credentials securely in Next.js/Node.js
- Validating external API responses with runtime type safety
- Handling webhook events with signature verification
- Designing idempotent operations for payment/critical APIs
- Testing without hitting real third-party endpoints

## Architecture Overview

### 1. HTTP Client Strategy

**openapi-fetch** (Recommended for REST APIs):
- Zero boilerplate type-safe client generation from OpenAPI specs
- Thin wrapper around native fetch (~6KB)
- Works with `fetch`, `axios`, or any HTTP client
- Setup: `npx openapi-typescript openapi.json -o api.types.ts`

```typescript
// Generate types from OpenAPI spec
import type { paths } from './api.types';
import createClient from 'openapi-fetch';

const { GET, POST, PUT, DELETE } = createClient<paths>({
  baseUrl: process.env.STRIPE_API_URL,
  fetch, // Use custom fetch implementation
});

// Type-safe requests with autocomplete
const { data, error } = await GET('/charges/{id}', {
  params: { path: { id: 'ch_123' } },
});
```

**Alternative clients comparison:**

| Client | Best For | Pros | Cons |
|--------|----------|------|------|
| **openapi-fetch** | REST APIs with OpenAPI | Zero-runtime, type-safe, minimal | Requires OpenAPI spec |
| **Ky** | Lightweight REST | Simple API, good DX, small | Less batteries-included |
| **Axios** | Feature-rich HTTP | Request interceptors, wide adoption | Larger bundle size (~11KB) |
| **Got** | Node.js HTTP | Powerful, retries built-in | Browser incompatible |

### 2. Resilience & Reliability

#### Exponential Backoff with Jitter

**Problem**: Synchronized retries from multiple clients create "thundering herd", overwhelming degraded servers.

**Solution**: Decorrelated exponential backoff + random jitter

```typescript
// Custom retry logic with exponential backoff + jitter
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Fail fast on permanent errors
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404'))
      ) {
        throw error; // Don't retry 4xx client errors
      }

      // Calculate delay: 2^attempt * baseDelay + random jitter
      const exponentialDelay = Math.pow(2, attempt) * baseDelayMs;
      const jitter = Math.random() * exponentialDelay * 0.1;
      const delayMs = exponentialDelay + jitter;

      console.log(
        `Retry ${attempt + 1}/${maxRetries} after ${delayMs.toFixed(0)}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

// Usage
const userData = await fetchWithRetry(() =>
  fetch('/api/users').then((r) => r.json())
);
```

**Production alternative**: Use `p-retry` library

```typescript
import pRetry from 'p-retry';

const response = await pRetry(
  () => fetch('https://api.example.com/data'),
  {
    retries: 5,
    minTimeout: 100,
    maxTimeout: 30000,
  }
);
```

#### Circuit Breaker Pattern

Prevents cascading failures by stopping requests to degraded services.

```typescript
import CircuitBreaker from 'opossum';

// States: CLOSED (normal) → OPEN (failing fast) → HALF_OPEN (testing recovery) → CLOSED

const breaker = new CircuitBreaker(
  async (paymentId: string) => {
    const response = await fetch(`https://payment-api.com/charges/${paymentId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  {
    timeout: 3000, // Function timeout
    errorThresholdPercentage: 50, // Trip when 50% fail
    resetTimeout: 30000, // Try recovery after 30s
    name: 'PaymentAPI',
    healthCheckInterval: 5000,
  }
);

// Event hooks for monitoring
breaker.on('open', () => {
  console.warn('Circuit opened! Payments API failing.');
  // Send alert, fallback to stale cache, etc.
});

breaker.on('halfOpen', () => {
  console.info('Testing payment API recovery...');
});

// Usage
try {
  const charge = await breaker.fire('ch_123');
} catch (error) {
  if (breaker.opened) {
    // Circuit is open, serve cached response
    return cachedPaymentData;
  }
  throw error;
}
```

#### Idempotency for Critical Operations

Ensures duplicate requests (from retries) don't create duplicate transactions.

```typescript
import crypto from 'crypto';

// Client generates unique key for each logical operation
function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

async function createPayment(amount: number, currency: string) {
  const idempotencyKey = generateIdempotencyKey();

  // Store key → result mapping in database or Redis
  const cacheKey = `idempotency:${idempotencyKey}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached); // Reuse previous result

  // Make request with Idempotency-Key header
  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Idempotency-Key': idempotencyKey, // Server uses this to deduplicate
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: amount.toString(),
      currency,
      source: 'tok_visa',
    }),
  });

  const result = await response.json();

  // Cache the result with the idempotency key
  await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24h TTL

  return result;
}
```

#### Rate Limiting & 429 Handling

```typescript
async function fetchWithRateLimit<T>(
  fn: () => Promise<T>,
  maxRequests = 100,
  windowMs = 60000
): Promise<T> {
  const key = 'api:rate-limit';
  const current = (await redis.incr(key)) || 1;

  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }

  if (current > maxRequests) {
    const ttl = await redis.ttl(key);
    const retryAfter = ttl > 0 ? ttl * 1000 : 1000;

    const error = new Error(`Rate limited. Retry after ${retryAfter}ms`);
    (error as any).retryAfter = retryAfter;
    throw error;
  }

  try {
    return await fn();
  } catch (error) {
    if (error instanceof Response && error.status === 429) {
      const retryAfter = error.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : 60000; // Default 1min
      console.warn(`Rate limited. Waiting ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return fetchWithRateLimit(fn, maxRequests, windowMs); // Retry
    }
    throw error;
  }
}
```

### 3. Authentication & Security

#### OAuth 2.0 Authorization Code Flow with PKCE

**PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception attacks by requiring code verifier proof.

```typescript
// app/auth/signin/route.ts (Next.js Route Handler)

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function generatePKCE() {
  // Generate random code verifier (43-128 chars)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');

  // Generate code challenge (SHA-256 hash of verifier)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

export async function GET(request: NextRequest) {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('base64url'); // CSRF protection

  // Store in signed, HTTP-only cookie
  const response = NextResponse.redirect(
    new URL(
      `${process.env.OAUTH_PROVIDER_URL}/authorize?` +
        new URLSearchParams({
          client_id: process.env.OAUTH_CLIENT_ID!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
          response_type: 'code',
          scope: 'openid profile email',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        })
    )
  );

  // Store verifier and state in signed cookies (NOT localStorage!)
  response.cookies.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true, // JS cannot access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}
```

```typescript
// app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Verify CSRF state
  const storedState = request.cookies.get('oauth_state')?.value;
  if (state !== storedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  // Retrieve code verifier from cookie
  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;
  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing code verifier' },
      { status: 400 }
    );
  }

  // Exchange code for token (server-side only)
  const tokenResponse = await fetch(
    `${process.env.OAUTH_PROVIDER_URL}/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OAUTH_CLIENT_ID!,
        client_secret: process.env.OAUTH_CLIENT_SECRET!, // Only on server
        code,
        code_verifier: codeVerifier, // Proves we initiated the flow
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
      }),
    }
  );

  const { access_token, refresh_token, expires_in } =
    await tokenResponse.json();

  // Store tokens securely
  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  response.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: expires_in,
  });

  // Refresh token in database (with encryption) for long-term access
  if (refresh_token) {
    await db.user.update(
      { id: userId },
      {
        refreshToken: encrypt(refresh_token), // Encrypt before storing
      }
    );
  }

  return response;
}
```

#### Secure Secret Management

```typescript
// lib/secrets.ts

// NEVER do this:
// const API_KEY = 'sk_live_abc123'; // ❌ Hardcoded

// Development: Use .env.local (never commit)
const SECRET_DEV = process.env.THIRD_PARTY_API_KEY; // ✅ .env.local

// Production: Use AWS Secrets Manager / Vault
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await secretsClient.send(command);
  return response.SecretString || '';
}

// Cache for 5 minutes to avoid repeated calls
const secretCache = new Map<string, { value: string; expiresAt: number }>();

export async function getCachedSecret(secretName: string): Promise<string> {
  const cached = secretCache.get(secretName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await getSecret(secretName);
  secretCache.set(secretName, {
    value,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min TTL
  });
  return value;
}

// Backend for Frontend (BFF) Pattern: Proxy API keys through your server
// app/api/external-api/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiKey = await getCachedSecret('stripe-api-key');

  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`, // Secret stays on server
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  return NextResponse.json(await response.json());
}

// Client-side never sees the key
// Client calls your BFF instead of third-party API
await fetch('/api/external-api', {
  method: 'POST',
  body: JSON.stringify({ amount: 2999, currency: 'usd' }),
  // No API key exposed!
});
```

#### Token Refresh Without Race Conditions

```typescript
// lib/tokenRefresh.ts

let refreshPromise: Promise<string> | null = null;

export async function getValidAccessToken(): Promise<string> {
  const stored = await getStoredToken();

  // Check if expired or expiring soon (5 min buffer)
  if (stored && stored.expiresAt > Date.now() + 5 * 60 * 1000) {
    return stored.accessToken;
  }

  // Prevent simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await fetch('https://oauth.example.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.OAUTH_CLIENT_ID!,
          client_secret: process.env.OAUTH_CLIENT_SECRET!,
        }),
      });

      const { access_token, expires_in } = await response.json();

      // Store new token
      await storeToken({
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      });

      return access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

#### Webhook Signature Verification

```typescript
// lib/webhook.ts (HMAC signature verification for Stripe, GitHub, etc.)

import crypto from 'crypto';

export async function verifyWebhookSignature(
  payload: string, // Raw request body as string
  signature: string, // Signature header from webhook provider
  secret: string // Webhook endpoint secret
): Promise<boolean> {
  // Different providers use different formats
  // Stripe: t=timestamp,v1=signature,v0=legacy
  const parts = signature.split(',').reduce(
    (acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Verify HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${payload}`)
    .digest('hex');

  // Compare with constant-time to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(parts.v1)
  );
}

// Usage in Next.js route handler
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  const isValid = await verifyWebhookSignature(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process webhook
  const event = JSON.parse(payload);
  await handleStripeEvent(event);

  return NextResponse.json({ success: true });
}
```

### 4. Type Safety with Zod & openapi-fetch

```typescript
// types/github.ts

import { z } from 'zod';

// Define schemas for runtime validation
export const GitHubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  bio: z.string().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  created_at: z.string().datetime(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

export const GitHubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  stars: z.number().int().nonnegative(),
  language: z.string().nullable(),
  updated_at: z.string().datetime(),
});

export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

// lists.ts - Paginated response wrapper
export const PaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
```

```typescript
// lib/github-client.ts

import createClient from 'openapi-fetch';
import type { paths } from './github.types'; // Generated from OpenAPI
import { GitHubUserSchema, GitHubRepoSchema } from '@/types/github';

const client = createClient<paths>({
  baseUrl: 'https://api.github.com',
  headers: {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  },
});

// Fetch user with runtime validation
export async function getGitHubUser(username: string) {
  const { data, error } = await client.GET('/users/{username}', {
    params: { path: { username } },
  });

  if (error) throw new Error(`GitHub API error: ${error.message}`);

  // Validate response conforms to schema
  const validated = GitHubUserSchema.safeParse(data);
  if (!validated.success) {
    console.error('Schema validation failed:', validated.error);
    throw new Error('Invalid GitHub API response');
  }

  return validated.data; // Type-safe
}

// Fetch repos with fallback
export async function getUserRepos(username: string) {
  const { data, error } = await client.GET(
    '/users/{username}/repos',
    {
      params: {
        path: { username },
        query: { per_page: 100, sort: 'updated' },
      },
    }
  );

  if (error) throw error;

  // Validate array of repos
  const repos = z.array(GitHubRepoSchema).safeParse(data);
  if (!repos.success) {
    console.warn('Some repos failed validation, filtering invalid entries');
    return data.filter((repo) => {
      const result = GitHubRepoSchema.safeParse(repo);
      if (!result.success) console.warn('Invalid repo:', repo);
      return result.success;
    });
  }

  return repos.data;
}
```

### 5. Testing Without Real APIs (MSW)

```typescript
// mocks/handlers.ts (Mock Service Worker)

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock successful API response
  http.get('https://api.example.com/users/:id', ({ params }) => {
    const { id } = params;

    // Simulate slow response
    if (id === 'slow') {
      return HttpResponse.json(
        { error: 'Request timeout' },
        { status: 504, delay: 5000 }
      );
    }

    // Return mock data
    return HttpResponse.json({
      id,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    });
  }),

  // Mock error response
  http.post('https://api.example.com/charges', () => {
    return HttpResponse.json(
      { error: 'Insufficient funds' },
      { status: 402 }
    );
  }),

  // Mock rate limiting
  http.get('https://api.example.com/search', () => {
    return HttpResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }),
];

// mocks/server.ts (Node.js setup for tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./mocks/setup.ts'],
  },
});

// mocks/setup.ts
import { server } from './server';
import { beforeAll, afterEach, afterAll } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// __tests__/github-client.test.ts

import { describe, it, expect } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { getGitHubUser, getUserRepos } from '@/lib/github-client';

describe('GitHub Client', () => {
  it('fetches user data with type safety', async () => {
    const user = await getGitHubUser('torvalds');
    expect(user.login).toBe('torvalds');
    expect(user.followers).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    // Override default handler for this test
    server.use(
      http.get('https://api.github.com/users/:username', () => {
        return HttpResponse.json(
          { message: 'Not Found' },
          { status: 404 }
        );
      })
    );

    await expect(getGitHubUser('nonexistent')).rejects.toThrow();
  });

  it('validates response schema', async () => {
    // Mock invalid response
    server.use(
      http.get('https://api.github.com/users/:username', () => {
        return HttpResponse.json({ name: 'Invalid' }); // Missing required fields
      })
    );

    await expect(getGitHubUser('invalid')).rejects.toThrow(
      'Invalid GitHub API response'
    );
  });

  it('handles rate limiting with retry', async () => {
    let attempts = 0;

    server.use(
      http.get('https://api.github.com/users/:username', () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json(
            { message: 'API rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '1' } }
          );
        }
        return HttpResponse.json({ login: 'test' });
      })
    );

    // With retry logic
    const user = await getGitHubUserWithRetry('test');
    expect(user.login).toBe('test');
    expect(attempts).toBe(2);
  });
});
```

## Best Practices

### ✅ Do

- **Use environment variables in development** (`.env.local`) and secrets managers in production (AWS Secrets Manager, Vault)
- **Validate all external API responses with Zod** at runtime, never trust `as Type`
- **Implement circuit breakers** for critical external dependencies
- **Use exponential backoff + jitter** for retries to prevent thundering herd
- **Store OAuth tokens in HTTP-only cookies**, never localStorage
- **Verify webhook signatures** with HMAC constant-time comparison
- **Use idempotency keys** for payment/critical operations
- **Mock external APIs with MSW** in tests, not actual API calls
- **Generate type-safe clients** from OpenAPI specs instead of manual typing
- **Cache secrets** with short TTL to reduce latency
- **Implement token refresh** with locking to prevent race conditions

### ❌ Don't

- Hardcode API keys in source code
- Store tokens in localStorage (XSS vulnerable)
- Trust unvalidated API responses
- Retry on all errors (fail fast on 4xx client errors)
- Create new retry logic (use libraries like `p-retry`)
- Expose secret keys in NEXT_PUBLIC_ variables
- Make simultaneous refresh token requests
- Skip webhook signature verification
- Use raw `fetch` without error handling
- Block on every API call (use caching and stale-while-revalidate)

## Common Errors & Solutions

**Error: "Webhook signature verification failed"**
- ✅ Verify the exact raw body (as string) was used for HMAC
- ✅ Check secret is correct (not mixed between environments)
- ✅ Ensure timestamps aren't too old (default 300s tolerance)

**Error: "Race condition on token refresh"**
- ✅ Use a lock/promise to ensure single refresh in progress
- ✅ Multiple requests should await the same refresh promise
- ✅ Store refresh token in database with encryption

**Error: "Circuit breaker keeps failing"**
- ✅ Check timeout is appropriate for API (3s is often too short)
- ✅ Verify error threshold percentage (50% = requires many failures)
- ✅ Check resetTimeout (time before trying recovery)
- ✅ Look for cascading failures from dependencies

**Error: "Type validation fails on valid responses"**
- ✅ Use `.safeParse()` instead of `.parse()` to prevent crashes
- ✅ Check API response for nullable/optional fields
- ✅ Use `.catchall()` or `.passthrough()` for dynamic fields
- ✅ Regenerate types from updated OpenAPI spec

**Error: "Rate limiting kills requests"**
- ✅ Implement exponential backoff (don't retry immediately)
- ✅ Respect `Retry-After` header from API
- ✅ Cache responses to reduce redundant requests
- ✅ Use token bucket or sliding window rate limiting

**Error: "CORS errors in browser"**
- ✅ Cannot fix client-side (browser security)
- ✅ Create BFF (Backend for Frontend) route handler
- ✅ Proxy requests through your own server
- ✅ Never expose API key to frontend

## References

- [openapi-fetch: Type-Safe REST Client](https://github.com/openapi-ts/openapi-typescript)
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
- [AWS: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Opossum: Circuit Breaker Library](https://github.com/nodeshift/opossum)
- [RFC 9110: Idempotency-Key Header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
- [Zod: TypeScript Schema Validation](https://zod.dev)
- [Mock Service Worker (MSW): API Mocking](https://mswjs.io)
- [OAuth 2.0 PKCE Flow](https://datatracker.ietf.org/doc/html/rfc7636)
- [Next.js Security Guide: Authentication](https://nextjs.org/docs/app/guides/authentication)
- [BFF Pattern: Backend for Frontend](https://blog.gitguardian.com/stop-leaking-api-keys-the-backend-for-frontend-bff-pattern-explained/)
