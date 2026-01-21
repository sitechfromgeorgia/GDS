---
name: nextjs-15-middleware-edge-auth
description: Implements production-ready Next.js 15 middleware patterns with Edge Runtime constraints, Supabase SSR token refresh, and authentication routing. Use when building protected routes, managing session tokens, handling CORS, or integrating Supabase authentication in middleware. Prevents middleware bloat and Edge Runtime pitfalls.
---

# Next.js 15 Middleware & Edge Runtime with Authentication

## Quick Start

Create `src/middleware.ts` with Supabase SSR integration:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Refresh token session before any route logic
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes - redirect unauthenticated users
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = ['/dashboard', '/profile', '/settings']
  return protectedPaths.some(path => pathname.startsWith(path))
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## When to Use This Skill

- **Route Protection**: Redirect unauthenticated users before rendering
- **Token Refresh**: Use Supabase `@supabase/ssr` to refresh tokens on every request
- **Header Manipulation**: Add custom headers or pass data to Server Components
- **CORS Handling**: Modify headers for cross-origin requests
- **Geo-targeting**: Use `request.geo` for location-based routing (Vercel)
- **Bot Protection**: Rate limiting or user-agent filtering
- **Avoiding Middleware Bloat**: Keep middleware <10ms execution time

## Middleware Architecture: The Mental Model

### The "Chain"

Middleware executes **before everything**:

```
User Request
    ↓
[Middleware] ← Executes HERE, can redirect/rewrite
    ↓
Static Files (_next/static, /public)
    ↓
Route Handlers / Pages
    ↓
Response
```

### Why Edge Runtime?

Middleware runs on **Vercel Edge Network** (V8 JavaScript runtime):
- **Global distribution**: Executes near the user
- **Sub-10ms latency**: No cold starts
- **Per-edge scalability**: Handles massive traffic
- **Trade-off**: Limited Node.js APIs (no `fs`, `child_process`, native crypto)

### Execution Timeline

```
Middleware startup: <1ms
Cookie parsing: <0.5ms
Supabase token refresh: 50-100ms (network roundtrip)
Total acceptable: <150ms

Avoid: Database queries, file operations, heavy parsing
```

## Implementation Patterns

### 1. Matcher Configuration (Exclude Static Assets)

The matcher determines which routes trigger middleware. Use **negative lookahead** regex:

```typescript
export const config = {
  matcher: [
    // Exclude _next internals, public assets, file extensions
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Regex breakdown**:
- `/(` - Start matching from root
- `(?!` - Negative lookahead (exclude these patterns)
- `_next/static|_next/image` - Next.js internals
- `favicon.ico` - Single favicon
- `.*\.(?:svg|png|...)$` - File extensions (static assets)
- `).*)/` - Match everything else

**Common extensions to exclude**:
```typescript
// Add to the regex for your use case
'(?!favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff)$)'
```

**Multiple matchers** (logical OR):
```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',        // Match /dashboard and children
    '/api/:path*',              // Match /api routes
    '/((?!.*\\.\\w+$).*)',     // Match routes without file extensions
  ],
}
```

### 2. Request/Response Manipulation

#### Rewrites (Invisible URL change)
```typescript
// URL bar shows /old-path, but serves /new-path content
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/old-path') {
    return NextResponse.rewrite(new URL('/new-path', request.url))
  }
}
```

#### Redirects (Visible URL change)
```typescript
// User sees URL change in browser
export async function middleware(request: NextRequest) {
  if (!user && request.nextUrl.pathname === '/protected') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

#### Setting Headers (Pass data to Server Components)
```typescript
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Custom header passed to all downstream handlers
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', user.user_metadata?.role || 'user')
  
  return response
}

// Access in Server Component
import { headers } from 'next/headers'

export default function Dashboard() {
  const headersList = headers()
  const userId = headersList.get('x-user-id')
  const role = headersList.get('x-user-role')
  
  return <div>User: {userId}, Role: {role}</div>
}
```

#### Setting Cookies
```typescript
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Set cookie that persists in browser
  response.cookies.set({
    name: 'auth-token',
    value: refreshedToken,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  
  return response
}
```

### 3. Supabase SSR Authentication (Gold Standard Pattern)

The **critical** pattern for Supabase with Next.js 15:

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  // IMPORTANT: Create response first, before Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on request
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          // Set cookies on response (critical for token refresh)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Call getUser() FIRST (triggers token refresh if needed)
  // DO NOT call getSession() - it doesn't refresh tokens
  const { data: { user } } = await supabase.auth.getUser()

  // Route protection logic
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Pass user info as header (optional, for Server Components)
  if (user) {
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Why this pattern works**:
1. `getUser()` internally calls `updateSession()` which refreshes expired tokens
2. Cookie jar is properly synchronized between request/response
3. Tokens are updated before any route logic runs
4. No race conditions because middleware is serial

### 4. CORS Header Handling

```typescript
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add CORS headers if coming from allowed origins
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://example.com',
    'https://app.example.com',
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: response.headers })
  }

  return response
}
```

### 5. Geo-Routing (Vercel)

```typescript
export async function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US'

  // Route requests to region-specific content
  if (country === 'DE' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/de', request.url))
  }

  if (country === 'FR' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/fr', request.url))
  }

  return NextResponse.next()
}
```

## Edge Runtime Constraints & Workarounds

### ❌ What's NOT Available in Middleware

| API | Why | Workaround |
|-----|-----|-----------|
| `fs` module | No file system | Store in database or environment |
| Native `crypto` | Limited to Web Crypto API | Use `crypto.subtle.*` |
| `child_process` | Can't spawn processes | Move to API route (Node.js runtime) |
| `net`, `tls` | Raw socket access unavailable | Use HTTP client libraries |
| `setImmediate`, `setTimeout` > 30s | No long-running tasks | API routes for async work |
| Direct database connections | Connection pooling not available | Use HTTP query layer (PostgREST via Supabase) |

### ✅ What IS Available

```typescript
// Web Crypto API (safe in Edge)
const hash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode('data')
)

// JSON parsing
const data = JSON.parse(request.body)

// Fetch (HTTP requests)
const res = await fetch('https://api.example.com/data')

// TextEncoder/TextDecoder
const encoded = new TextEncoder().encode('hello')

// Array, Object, String methods
// Regular expressions
// Date
```

### 1MB Bundle Size Limit

Middleware function (including all imports) **must be < 1MB**.

**Debugging in `next build`**:
```bash
npm run build

# Look for warnings like:
# ⚠ The Edge Function "middleware" is 1.23 MB
```

**Reduction strategies**:
```typescript
// ❌ BAD: Heavy library in middleware
import _ from 'lodash'
import jwt from 'jsonwebtoken'

export async function middleware(request: NextRequest) {
  const token = jwt.sign({ id: 1 }, 'secret')
}

// ✅ GOOD: Lightweight checks only
export async function middleware(request: NextRequest) {
  // If heavy logic needed, delegate to API route
  const response = await fetch('/api/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}
```

**Check bundle composition**:
```bash
# Use Next.js bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Then add to next.config.js:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... config
})

# Run:
ANALYZE=true npm run build
```

## Performance Checklist

**Target execution time: <10ms**

- [ ] Middleware runs for every matched route
- [ ] Each invocation is independent (no shared state)
- [ ] Avoid calling external APIs (use caching)
- [ ] Keep matcher precise (exclude static files)
- [ ] No database queries in middleware (use Supabase RLS instead)
- [ ] No heavy JSON parsing or string operations
- [ ] No large imports (treeshake dead code)
- [ ] Supabase token refresh: ~50-100ms acceptable
- [ ] Bundle size: <1MB (check with `next build`)

**Vercel Edge Analytics**:
```bash
# Check middleware execution stats in Vercel Dashboard
# > Deployment > Monitoring > Edge Functions > middleware
```

## Common Errors & Solutions

### Error: "Edge Runtime does not support Node.js 'crypto' module"

**Cause**: Using Node.js `crypto` instead of Web Crypto API.

```typescript
// ❌ Wrong
import crypto from 'crypto'
const hash = crypto.createHash('sha256').update('data').digest('hex')

// ✅ Correct
const hash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode('data')
)
```

### Error: "The Edge Function 'middleware' size is 1.07 MB"

**Cause**: Middleware bundle exceeds 1MB limit.

```typescript
// ❌ Heavy imports
import nodemailer from 'nodemailer'
import pdfkit from 'pdfkit'

// ✅ Move to API route
export async function middleware(request: NextRequest) {
  // Delegate heavy work
  if (request.nextUrl.pathname === '/send-email') {
    return NextResponse.rewrite(
      new URL('/api/email', request.url)
    )
  }
}

// /api/email.ts (Node.js runtime, 256MB limit)
import nodemailer from 'nodemailer'
export async function POST(request: NextRequest) {
  // Heavy work here
}
```

### Error: "Middleware running on every request (causing delays)"

**Cause**: Matcher too broad.

```typescript
// ❌ Runs on everything including images
export const config = {
  matcher: '/:path*',
}

// ✅ Exclude static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Error: "Token refresh not working in middleware"

**Cause**: Using `getSession()` instead of `getUser()`.

```typescript
// ❌ Wrong - doesn't refresh
const { data: { session } } = await supabase.auth.getSession()

// ✅ Correct - refreshes tokens
const { data: { user } } = await supabase.auth.getUser()

// getUser() calls updateSession() internally
```

### Error: "Cookies not persisting after middleware"

**Cause**: Not setting cookies on response.

```typescript
// ❌ Wrong
const supabase = createServerClient(..., {
  cookies: {
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value)
      })
      // Missing: response.cookies.set()
    },
  },
})

// ✅ Correct
const supabase = createServerClient(..., {
  cookies: {
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value)
      })
      // Also set on response
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
    },
  },
})
```

### Error: "Middleware running on static files (causing slowdown)"

**Cause**: Router config not excluding assets.

```typescript
// Add to matcher exclusions
'favicon.ico'         // Favicon
'*.svg'               // SVGs
'*.png'               // Images
'*.webp'              // Modern images
'*.woff2'             // Fonts
'_next/static'        // Next.js static
'_next/image'         // Image optimization
```

## Node.js Runtime Option (Next.js 15.5+)

New in Next.js 15.5: Use Node.js runtime for middleware if needed:

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'  // Now available!

export async function middleware(request: NextRequest) {
  // Full Node.js APIs available
  const token = createHmac('sha256', 'secret').update('data').digest('hex')

  return NextResponse.next()
}

// Enable Node.js runtime
export const config = {
  runtime: 'nodejs',  // Instead of 'edge' (default)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',
}
```

**Trade-offs**:
- ✅ Full Node.js API access
- ✅ Can use heavy libraries
- ❌ Runs on origin server (higher latency)
- ❌ Slower cold starts
- ❌ Not globally distributed

## Best Practices

1. **Keep Middleware Lightweight**: <10ms execution time
2. **Exclude Static Files**: Use negative lookahead matcher
3. **Supabase Pattern**: Always use `getUser()` not `getSession()`
4. **Cookie Sync**: Set cookies on both request and response
5. **Delegate Heavy Work**: Move complex logic to API routes
6. **Monitor Bundle Size**: Watch for the 1MB limit
7. **Test Matcher Locally**: Use `next dev` to verify routes
8. **Pass Data via Headers**: Use `x-*` headers for Server Components
9. **Avoid Database Queries**: Use RLS at the database level instead
10. **Plan for Edge Constraints**: Know what's unavailable before coding

## References

- [Next.js 15 Middleware Docs](https://nextjs.org/docs/15/app/building-your-application/routing/middleware)
- [Edge Runtime API Reference](https://nextjs.org/docs/app/api-reference/edge)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Vercel Edge Functions](https://vercel.com/docs/edge-functions/overview)
- [Next.js 15.5 Release Notes](https://nextjs.org/blog/next-15-5)