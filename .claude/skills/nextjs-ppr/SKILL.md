---
name: nextjs-15-partial-prerendering
description: Implements Partial Prerendering (PPR) in Next.js 15 to split pages into static shells and dynamic holes, combining static site speed with SSR flexibility using experimental_ppr and Suspense boundaries. Use when optimizing pages with mixed static/dynamic content, implementing streaming architecture, or migrating from fully dynamic SSR to hybrid rendering.
---

# Next.js 15 Partial Prerendering (PPR)

## Quick Start

Enable PPR globally with incremental adoption:

**`next.config.ts`:**
```typescript
const nextConfig = {
  experimental: {
    ppr: 'incremental', // Enable PPR per-route opt-in
  },
};

export default nextConfig;
```

**`app/dashboard/page.tsx`:**
```typescript
import { Suspense } from 'react';
import { cookies } from 'next/headers';

export const experimental_ppr = true; // Opt-in this route

// Static shell component
function StaticHeader() {
  return <header className="header">Dashboard</header>;
}

// Dynamic component (wrapped in Suspense)
async function UserBanner() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth')?.value;
  const user = await fetchUser(token); // Runs at request time
  
  return <div className="banner">Welcome, {user.name}</div>;
}

export default function DashboardPage() {
  return (
    <div>
      <StaticHeader /> {/* Prerendered at build time */}
      
      <Suspense fallback={<div className="banner-skeleton">Loading user info...</div>}>
        <UserBanner /> {/* Streamed at request time */}
      </Suspense>
    </div>
  );
}

async function fetchUser(token: string) {
  const res = await fetch('https://api.example.com/user', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', // Dynamic data
  });
  return res.json();
}
```

**Result:**
- Build time: Prerender static shell HTML
- Request time: Return shell immediately, stream dynamic content as it resolves

---

## When to Use This Skill

- **Mixed content pages**: Static layout + dynamic user data, cart, recommendations
- **ISR replacement**: Want instant shell delivery + fresh dynamic content
- **Streaming optimization**: Multiple async operations should load in parallel
- **Performance-critical routes**: Need edge caching for static parts, real-time data for dynamic parts
- **Incremental migration**: Gradually convert SSR pages without full redesign

---

## Core Concepts

### The Mental Model: Static Shell + Dynamic Holes

PPR splits your page into two categories:

| Category | What | When | Benefit |
|----------|------|------|---------|
| **Static Shell** | Header, layout, footer, static content | Built at build time | Served instantly from edge |
| **Dynamic Holes** | User data, personalized content, real-time info | Generated at request time | Fresh data, streamed seamlessly |

**PPR Architecture Diagram:**

```
BUILD TIME
═══════════════════════════════════════════════════════════════════
  
  page.tsx (with experimental_ppr = true)
           ↓
  ┌─────────────────────────────────────────┐
  │   Static Shell (Prerendered to HTML)    │
  │  ┌────────────────────────────────────┐ │
  │  │  <Header /> - Static               │ │
  │  ├────────────────────────────────────┤ │
  │  │  <ProductList /> - Static          │ │
  │  ├────────────────────────────────────┤ │
  │  │  <Suspense fallback>               │ │
  │  │    [Cart Skeleton]                 │ │  ← Hole placeholder
  │  │  </Suspense>                       │ │
  │  ├────────────────────────────────────┤ │
  │  │  <Footer /> - Static               │ │
  │  └────────────────────────────────────┘ │
  │                                          │
  │  ✓ Cached on Edge CDN                   │
  │  ✓ Instant delivery worldwide           │
  └─────────────────────────────────────────┘


REQUEST TIME
═══════════════════════════════════════════════════════════════════

  1. User Request
        ↓
  2. ⚡ INSTANT: Edge returns static shell (50KB, 0ms)
        ↓
  ┌─────────────────────────────────────────┐
  │   Browser renders static content        │
  │   (User sees Header, ProductList,       │
  │    Skeleton UI immediately)             │
  └─────────────────────────────────────────┘
        ↓↓↓ (in parallel)
  3. Server renders 3 dynamic sections
        ├─→ <UserCart /> - Fetch & render (50ms)
        ├─→ <UserProfile /> - Fetch & render (80ms)
        └─→ <Recommendations /> - Fetch & render (120ms)
        ↓
  4. 📡 Stream chunks back (50ms - 120ms)
        ├─→ Cart HTML chunk ① (replaces skeleton)
        ├─→ Profile HTML chunk ② (replaces skeleton)
        └─→ Recommendations HTML chunk ③ (replaces skeleton)
        ↓
  5. ✓ Page complete and interactive (≈120ms total vs 250ms without PPR)
```

**Request Flow:**
```
1. User requests page
2. Edge server sends static shell HTML immediately (0ms perceived delay)
3. Browser renders static content while JavaScript loads
4. Server renders dynamic components in parallel
5. Dynamic HTML chunks stream in, replace fallback UI
6. Page is complete and interactive
```

### Suspense Boundaries as Rendering Boundaries

`<Suspense>` defines where the split occurs:

```typescript
export default function Page() {
  return (
    <div>
      {/* OUTSIDE Suspense = Static Shell */}
      <StaticHeader />
      <ProductList /> {/* Prerendered at build */}
      
      {/* INSIDE Suspense = Dynamic Hole */}
      <Suspense fallback={<CartSkeleton />}>
        <UserCart /> {/* Streamed at request */}
      </Suspense>
    </div>
  );
}
```

- Everything outside `<Suspense>` tries to be static
- Everything inside `<Suspense>` is deferred to request time
- Fallback UI is part of the static shell

### What Forces Dynamic Rendering

These APIs automatically mark components as dynamic and must be wrapped in `<Suspense>`:

- `cookies()` - Read auth tokens, preferences
- `headers()` - Read user-agent, custom headers
- `searchParams` prop - Query string parameters
- `useSearchParams()` hook - Client-side search params
- `fetch()` with `cache: 'no-store'` - Real-time data
- `fetch()` with `revalidate: 0` - Bypass ISR cache
- `unstable_noStore()` - Explicit dynamic opt-in

**Anti-pattern (entire page goes dynamic):**
```typescript
export default function Page() {
  const cookies = await cookies(); // ❌ Page forced dynamic, no Suspense
  return <UserContent />;
}
```

**Correct pattern (only wrapped component dynamic):**
```typescript
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserContent /> {/* Only this suspends */}
    </Suspense>
  );
}

async function UserContent() {
  const cookies = await cookies(); // ✅ Only this component is dynamic
  return <div>{cookies.get('auth')?.value}</div>;
}
```

---

## Implementation Patterns

### Pattern 1: Single Dynamic Section

**Product page with static product + dynamic comments:**

```typescript
// app/products/[id]/page.tsx
import { Suspense } from 'react';

export const experimental_ppr = true;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  // Fetch at build time (static)
  const product = await getProduct(id, { revalidate: 3600 });
  
  return (
    <article>
      {/* Static Shell */}
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <Price>${product.price}</Price>
      
      {/* Dynamic Hole: Comments + view count */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments productId={id} />
        <ViewCount productId={id} />
      </Suspense>
    </article>
  );
}

async function getProduct(id: string, options: any) {
  const res = await fetch(`https://api.example.com/products/${id}`, options);
  return res.json();
}

async function Comments({ productId }: { productId: string }) {
  // Fetches on every request (fresh data)
  const comments = await fetch(
    `https://api.example.com/products/${productId}/comments`,
    { cache: 'no-store' }
  ).then(r => r.json());
  
  return (
    <div>
      {comments.map((c: any) => (
        <div key={c.id}>{c.text}</div>
      ))}
    </div>
  );
}

async function ViewCount({ productId }: { productId: string }) {
  const count = await fetch(
    `https://api.example.com/products/${productId}/views`,
    { cache: 'no-store' }
  ).then(r => r.json());
  
  return <p>Viewed {count} times</p>;
}
```

### Pattern 2: Multiple Parallel Dynamic Sections

**Dashboard with cart + user profile + recommendations:**

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export const experimental_ppr = true;

export default function DashboardPage() {
  return (
    <div className="grid">
      {/* Static content */}
      <Header />
      <Navigation />
      
      {/* Dynamic sections render in PARALLEL, not sequentially */}
      <div className="sidebar">
        <Suspense fallback={<CartSkeleton />}>
          <Cart />
        </Suspense>
      </div>
      
      <div className="main">
        <Suspense fallback={<ProfileSkeleton />}>
          <UserProfile />
        </Suspense>
      </div>
      
      <div className="recommendations">
        <Suspense fallback={<RecommendationsSkeleton />}>
          <Recommendations />
        </Suspense>
      </div>
    </div>
  );
}

// These all fetch in parallel at request time
async function Cart() {
  const cart = await fetchCart();
  return <CartUI items={cart.items} />;
}

async function UserProfile() {
  const profile = await fetchProfile();
  return <ProfileUI {...profile} />;
}

async function Recommendations() {
  const recommendations = await fetchRecommendations();
  return <RecommendationsList items={recommendations} />;
}
```

### Pattern 3: Reading Cookies/Auth

**Profile page with public content + authenticated sidebar:**

```typescript
// app/profile/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';

export const experimental_ppr = true;

export default function ProfilePage() {
  return (
    <div className="layout">
      {/* Static: Public profile section */}
      <PublicProfile />
      
      {/* Dynamic: Only read cookies in wrapped component */}
      <Suspense fallback={<SidebarSkeleton />}>
        <AuthenticatedSidebar />
      </Suspense>
    </div>
  );
}

function PublicProfile() {
  // No cookies() call here - this stays static
  return <div>Public profile content...</div>;
}

async function AuthenticatedSidebar() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  // Validate token and fetch user
  const user = await validateAndFetchUser(sessionToken);
  
  return (
    <aside>
      <h3>Welcome, {user.name}</h3>
      <UserMenu />
    </aside>
  );
}

async function validateAndFetchUser(token?: string) {
  if (!token) return { name: 'Guest' };
  const res = await fetch('/api/user', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return res.json();
}
```

---

## Build & Deploy Verification

### Verify PPR is Working

**Check build output:**
```bash
npm run build
```

Look for these logs:
```
⚡ Next.js Prerendering
  ✓ app/dashboard (PPR enabled)
  ✓ app/products/[id] (PPR enabled)
  ○ app/admin (dynamic)
```

This indicates which routes were prerendered with PPR.

**What each status means:**
- `✓ Route Name (PPR enabled)` - Successfully prerendered static shell
- `○ Route Name (dynamic)` - Route is fully dynamic (no prerendering)
- `⚠ Route Name (force-dynamic)` - Explicitly set to dynamic

### Debug Environment Variable

```bash
DEBUG=ppr npm run build 2>&1 | head -100
```

Outputs detailed logs showing:
- Which components are static
- Which components are dynamic
- Why each component has that status
- Suspense boundary analysis

**Example output:**
```
[PPR] app/products/[id]/page.tsx
  [static] ProductImage - no dynamic APIs
  [static] ProductDescription - static props
  [dynamic] Comments - uses fetch(no-store)
  [dynamic] ViewCount - reads cookies()
  [suspense-boundary] Comments wrapped in Suspense ✓
  [suspense-boundary] ViewCount wrapped in Suspense ✓
```

### Inspect Network Tab

**Step-by-step:**
1. Build and run: `npm run build && npm run start`
2. Open DevTools (F12) → Network tab
3. Request a PPR page
4. Look at the main document request

**What to look for:**
- Initial response contains static shell (HTML with `<div>Loading...</div>` placeholders)
- Response header shows `transfer-encoding: chunked` (streaming)
- Additional chunks appear as dynamic content arrives

**Streaming visualization:**
```
Request Timeline
────────────────────────────────────────────────

Time 0ms:     Static shell received ✓
              ┌────────────────────┐
              │ HTML (complete)    │
              │ <Header/>          │
              │ <ProductList/>     │
              │ <div>Loading...</div>
              └────────────────────┘

Time 50ms:    Cart chunk streams in
              Dynamic cart HTML replaces skeleton

Time 120ms:   Recommendations chunk streams in
              Dynamic recommendations replace skeleton

Time 150ms:   Page complete and fully interactive
```

**Verify in DevTools:**
```javascript
// In Console, check when each section rendered
console.log('Static shell time:', performance.timing.responseStart);
console.log('First dynamic chunk:', performance.getEntriesByName('...'));

// Or use Web Vitals
console.log('First Contentful Paint:', performance.getEntriesByName('first-contentful-paint')[0].startTime);
console.log('Largest Contentful Paint:', performance.getEntriesByName('largest-contentful-paint').slice(-1)[0].startTime);
```

### Runtime vs Edge Compatibility

PPR works best on **Node.js runtime** (default). Edge runtime limitations:

```typescript
// ❌ This won't fully benefit from PPR on Edge
export const runtime = 'edge'; // Limited Node.js APIs

// ✅ Default Node.js runtime (best for PPR)
// export const runtime = 'nodejs'; // Default, omit this line
```

**Why:** Node.js runtime supports full database access, file I/O, and streaming. Edge runtime has restrictions.

**Recommended approach:**
```typescript
// app/dashboard/page.tsx
export const experimental_ppr = true;
// Don't set runtime - defaults to Node.js
// Static shell can still be edge-cached via ISR revalidation

export default function Dashboard() {
  // Implementation...
}
```

---

## Common Errors & Solutions

### Error 1: "Static Bail Out Caught"

**Message:** `The route exports a runtime configuration that is incompatible with static generation.`

**Cause:** Tried to catch error from `cookies()` or `headers()` in try/catch block.

```typescript
// ❌ WRONG
async function Component() {
  try {
    const c = await cookies(); // Error gets caught!
    return <div>{c}</div>;
  } catch (e) {
    return <div>Error</div>;
  }
}
```

**Solution 1: Don't catch dynamic API errors**
```typescript
// ✅ CORRECT
async function Component() {
  const c = await cookies(); // Let error propagate
  return <div>{c}</div>;
}
```

**Solution 2: Mark as explicitly dynamic before try/catch**
```typescript
import { unstable_noStore } from 'next/cache';

async function Component() {
  unstable_noStore(); // Opts out before try/catch
  try {
    const c = await cookies();
    return <div>{c}</div>;
  } catch (e) {
    return <div>Error</div>;
  }
}
```

### Error 2: "Suspense boundary required"

**Message:** `Uncached data was accessed outside of <Suspense>.`

**Cause:** Reading `cookies()` at the page level without `<Suspense>` wrapper.

```typescript
// ❌ WRONG
export default function Page() {
  const cookies = await cookies(); // No Suspense!
  return <div>{cookies}</div>;
}
```

**Solution: Wrap in Suspense**
```typescript
// ✅ CORRECT
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CookieComponent />
    </Suspense>
  );
}

async function CookieComponent() {
  const cookies = await cookies();
  return <div>{cookies}</div>;
}
```

### Error 3: "Whole page went dynamic"

**Symptom:** Build log shows route is fully dynamic instead of PPR.

**Cause:** Accessed `cookies()` or `searchParams` without wrapping in `<Suspense>`.

**Debug:**
```typescript
// Find where dynamic API is called
const cookieStore = await cookies(); // ← Check this is wrapped
const params = searchParams; // ← Check this is inside Suspense
```

**Solution:** Move all dynamic operations into components wrapped by `<Suspense>`.

### Error 4: "Layout shift with fallback UI"

**Symptom:** Page jumps when dynamic content loads.

**Cause:** Fallback skeleton doesn't match final content dimensions.

```typescript
// ❌ WRONG - Fallback is tiny
<Suspense fallback={<div>...</div>}>
  <Cart items={20} /> {/* Renders large */}
</Suspense>

// ✅ CORRECT - Fallback matches final size
<Suspense fallback={<CartSkeleton itemCount={20} />}>
  <Cart items={20} />
</Suspense>
```

**Best practice: Match fallback layout exactly**
```typescript
function CartSkeleton() {
  return (
    <div className="cart" style={{ height: '400px' }}>
      {Array.from({ length: 5 }).map(i => (
        <div key={i} className="cart-item-skeleton" />
      ))}
    </div>
  );
}
```

### Error 5: "searchParams kills static generation"

**Symptom:** Page with `searchParams` prop doesn't prerender.

**Cause:** `searchParams` is a dynamic prop (varies per request).

```typescript
// ❌ WRONG - Page forced dynamic
export default function Page({ searchParams }: { searchParams: any }) {
  return <div>{searchParams.filter}</div>;
}
```

**Solution 1: Wrap searchParams access in Suspense**
```typescript
// ✅ CORRECT
export default function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }> 
}) {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <FilteredContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilteredContent({ searchParams }: any) {
  const params = await searchParams;
  return <div>Filtered: {params.filter}</div>;
}
```

**Solution 2: Use `useSearchParams` on client component**
```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export default function FilteredContent() {
  const searchParams = useSearchParams();
  return <div>Filtered: {searchParams.get('filter')}</div>;
}
```

---

## Migration Guide: SSR → PPR

### Before (Fully Dynamic SSR)

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  const user = await getUser();
  const cart = await getCart();
  const recommendations = await getRecommendations();
  
  // ❌ Entire page waits for all data
  return (
    <div>
      <Header user={user} />
      <Cart items={cart.items} />
      <Recommendations items={recommendations} />
    </div>
  );
}
```

**Problems:**
- User sees blank page until all data loads
- Slow backend calls block fast content
- No edge caching

### After (PPR with Streaming)

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export const experimental_ppr = true; // Enable PPR for this route

export default function Dashboard() {
  return (
    <div>
      {/* Static shell - renders immediately */}
      <Header />
      <Navigation />
      
      {/* Dynamic sections - stream independently */}
      <Suspense fallback={<CartSkeleton />}>
        <Cart />
      </Suspense>
      
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}

// Components fetch only when needed
async function Cart() {
  const cart = await getCart();
  return <CartUI items={cart.items} />;
}

async function Recommendations() {
  const recommendations = await getRecommendations();
  return <RecommendationsList items={recommendations} />;
}
```

**Benefits:**
- Static shell served instantly
- Multiple dynamic sections load in parallel
- Static parts edge-cached
- Perceived performance dramatically improved

### Step-by-Step Migration

**Step 1: Enable PPR**
```typescript
// next.config.ts
export default {
  experimental: { ppr: 'incremental' },
};
```

**Step 2: Add `experimental_ppr` export**
```typescript
// app/dashboard/page.tsx
export const experimental_ppr = true;
```

**Step 3: Identify static content**
- Header
- Navigation
- Layout
- Static text and images

**Step 4: Identify dynamic content**
- User-specific data
- Cart
- Real-time information

**Step 5: Extract dynamic logic**
```typescript
async function UserCart() {
  const cart = await getCart(); // Fetches at request time
  return <CartUI {...cart} />;
}
```

**Step 6: Wrap in Suspense**
```typescript
<Suspense fallback={<CartSkeleton />}>
  <UserCart />
</Suspense>
```

**Step 7: Test**
```bash
npm run build # Check for PPR logs
npm run start # Verify streaming works
```

---

## Best Practices

### ✅ DO

- **Place Suspense as shallow as possible**: The closer to the dynamic component, the more of the page stays static.
  ```typescript
  // ✅ Good - Only Cart suspends
  <Suspense fallback={<CartSkeleton />}>
    <Cart />
  </Suspense>
  
  // ❌ Bad - Entire page layout suspends
  <Suspense fallback={<PageSkeleton />}>
    <Header />
    <Cart />
    <Footer />
  </Suspense>
  ```

- **Load dynamic sections in parallel**: Multiple Suspense boundaries render simultaneously.
  ```typescript
  // ✅ Cart and Recommendations load at the same time
  <Suspense><Cart /></Suspense>
  <Suspense><Recommendations /></Suspense>
  ```

- **Match fallback dimensions to final content**: Prevents layout shift.
  ```typescript
  function CartSkeleton() {
    return <div style={{ height: '400px' }}>Skeleton...</div>;
  }
  ```

- **Use `revalidate` on static data**: Refreshes periodically.
  ```typescript
  const product = await getProduct(id, { revalidate: 3600 });
  ```

- **Keep fallback UI lightweight**: Users see it first.
  ```typescript
  // ✅ Simple skeleton
  const fallback = <div className="skeleton" />;
  
  // ❌ Complex loading UI
  const fallback = <LoadingWithAnimation />;
  ```

### ❌ DON'T

- **Don't access `cookies()` at page level**:
  ```typescript
  // ❌ WRONG - Page forced dynamic
  export default async function Page() {
    const c = await cookies();
  }
  
  // ✅ Correct
  export default function Page() {
    return <Suspense><CookieComponent /></Suspense>;
  }
  ```

- **Don't catch errors from dynamic APIs**:
  ```typescript
  // ❌ WRONG
  try {
    const c = await cookies();
  } catch (e) {}
  
  // ✅ Correct
  const c = await cookies(); // Let PPR catch it
  ```

- **Don't nest Suspense too deeply**: Creates waterfall effect.
  ```typescript
  // ❌ WRONG - Sequential loading
  <Suspense>
    <A />
    <Suspense>
      <B /> {/* Waits for A */}
    </Suspense>
  </Suspense>
  
  // ✅ Correct - Parallel loading
  <Suspense><A /></Suspense>
  <Suspense><B /></Suspense>
  ```

- **Don't use PPR on every route**: Only routes with real dynamic content.
  ```typescript
  // ✅ Use on mixed content routes
  export const experimental_ppr = true;
  
  // ❌ Skip on fully static routes
  // export const experimental_ppr = true; // Unnecessary
  ```

- **Don't call `generateStaticParams` with dynamic APIs inside**: Move to separate route.

---

## Performance Considerations

### Build Time Impact

PPR adds minimal overhead:
- Build time similar to current SSG (prerendering happens at build time)
- Component analysis happens during compilation
- No runtime penalty

**Monitor:**
```bash
time npm run build
# Compare with/without PPR enabled
```

### Runtime Streaming Performance

Each dynamic section adds a server roundtrip:

**Single Suspense boundary:**
- Static shell: 20ms
- Dynamic content: 100ms
- Total: ~100ms perceived (parallel)

**Multiple Suspense boundaries:**
- Static shell: 20ms
- Dynamic A: 50ms (parallel)
- Dynamic B: 80ms (parallel)
- Total: max(50, 80) = ~80ms perceived

### Network Efficiency

PPR reduces payload size:
- Static shell once per route (edge-cached)
- Dynamic payload only when needed
- Streaming avoids round-trip latency

**Example:** Product page
- Static shell: 50KB (cached for 1 hour)
- Dynamic comments: 15KB (per request, only sent once)
- ISR approach: 65KB every 30 min

---

## Troubleshooting Checklist

- [ ] Is `ppr: 'incremental'` set in `next.config.ts`?
- [ ] Did you add `export const experimental_ppr = true` to the page?
- [ ] Is all dynamic content wrapped in `<Suspense>`?
- [ ] Are there any `try/catch` blocks around `cookies()/headers()`?
- [ ] Does fallback UI match final content dimensions?
- [ ] Are `searchParams` wrapped in Suspense or client component?
- [ ] Did you run `npm run build` to verify prerendering?
- [ ] Are you using Node.js runtime (not Edge)?
- [ ] Are multiple dynamic sections loading in parallel (not nested)?

---

## "Why Did My Whole Page Go Dynamic?" Debugging

**This is the #1 PPR problem. Here's how to fix it:**

### Symptom: Build log shows `○ dynamic` instead of `✓ (PPR enabled)`

**Checklist to find the culprit:**

1. **Check for `cookies()` at page level**
   ```typescript
   // ❌ WRONG - Makes entire page dynamic
   export default async function Page() {
     const c = await cookies();
     return <div>{c}</div>;
   }
   
   // ✅ CORRECT - Move inside Suspense
   export default function Page() {
     return <Suspense><CookieComponent /></Suspense>;
   }
   ```

2. **Check for `headers()` at page level**
   ```typescript
   // ❌ WRONG
   export default async function Page() {
     const h = await headers();
     return <div>{h}</div>;
   }
   
   // ✅ CORRECT
   export default function Page() {
     return <Suspense><HeaderComponent /></Suspense>;
   }
   ```

3. **Check for `searchParams` destructuring without Suspense**
   ```typescript
   // ❌ WRONG - searchParams makes page dynamic
   export default function Page({ searchParams }) {
     return <div>{searchParams.filter}</div>;
   }
   
   // ✅ CORRECT - Wrap in Suspense
   export default function Page({ searchParams }) {
     return <Suspense><FilterComponent searchParams={searchParams} /></Suspense>;
   }
   ```

4. **Check for `useSearchParams()` without Suspense**
   ```typescript
   // ❌ WRONG in server component
   export default function Page() {
     const searchParams = useSearchParams(); // ← This is client-only!
     return <div>{searchParams}</div>;
   }
   
   // ✅ CORRECT
   'use client';
   import { useSearchParams } from 'next/navigation';
   export default function Page() {
     const searchParams = useSearchParams();
     return <div>{searchParams}</div>;
   }
   ```

5. **Check for `fetch()` without cache option**
   ```typescript
   // ⚠️ Might be dynamic - fetch without cache:
   const data = await fetch('https://api.example.com/data');
   
   // ✅ Explicitly static
   const data = await fetch('https://api.example.com/data', { 
     cache: 'force-cache' 
   });
   
   // ✅ Explicitly dynamic
   const data = await fetch('https://api.example.com/data', { 
     cache: 'no-store' // Wrap this component in Suspense!
   });
   ```

6. **Check for dynamically imported components**
   ```typescript
   // ⚠️ Might cause issues
   const HeavyComponent = dynamic(() => import('./Heavy'));
   
   // ✅ Better with Suspense
   import { lazy } from 'react';
   const HeavyComponent = lazy(() => import('./Heavy'));
   
   export default function Page() {
     return <Suspense><HeavyComponent /></Suspense>;
   }
   ```

### Nuclear Debugging Option

Add this to the top of your page to see exactly what's making it dynamic:

```typescript
// app/dashboard/page.tsx
import { unstable_noStore } from 'next/cache';

// Temporarily opt out to find the culprit
// unstable_noStore(); // Uncomment if page is forced dynamic

export const experimental_ppr = true;

export default function Page() {
  console.log('[PPR] Page rendering...');
  return <div>Debug: Check console for PPR status</div>;
}
```

Then in build output:
```bash
DEBUG=ppr npm run build 2>&1 | grep -A5 "dashboard"
```

---

## Advanced Gotchas

### Gotcha 1: Nested Suspense Creates Waterfall

**Problem:**
```typescript
// ❌ WRONG - Components render sequentially
<Suspense fallback={<div>Loading A...</div>}>
  <ComponentA>
    <Suspense fallback={<div>Loading B...</div>}>
      <ComponentB />
    </Suspense>
  </ComponentA>
</Suspense>

// Timeline:
// 0-100ms: ComponentA loads
// 100-200ms: ComponentB loads (must wait for A)
// Result: 200ms total
```

**Solution:**
```typescript
// ✅ CORRECT - Components load in parallel
<Suspense fallback={<div>Loading A...</div>}>
  <ComponentA />
</Suspense>

<Suspense fallback={<div>Loading B...</div>}>
  <ComponentB />
</Suspense>

// Timeline:
// 0-200ms: Both load simultaneously
// Result: 200ms total (same as one, but more content!)
```

### Gotcha 2: Suspense Boundary Too High

**Problem:**
```typescript
// ❌ WRONG - Static content hidden while loading
<Suspense fallback={<PageSkeleton />}>
  <Header /> {/* Static, doesn't need Suspense */}
  <Cart /> {/* Dynamic, needs Suspense */}
  <Footer /> {/* Static, doesn't need Suspense */}
</Suspense>

// Result: User sees skeleton, then full page
```

**Solution:**
```typescript
// ✅ CORRECT - Only wrap dynamic content
<Header /> {/* Shows immediately */}

<Suspense fallback={<CartSkeleton />}>
  <Cart /> {/* Only this suspends */}
</Suspense>

<Footer /> {/* Shows immediately */}

// Result: User sees header + footer instantly, cart loads over time
```

### Gotcha 3: Props Passed Through Suspense Boundary

**Problem:**
```typescript
// ❌ WRONG - Passing dynamic data through props prevents optimization
async function Page() {
  const user = await fetchUser(); // Dynamic at page level!
  
  return (
    <Suspense>
      <Cart user={user} /> {/* Props passed before Suspense */}
    </Suspense>
  );
}
```

**Solution:**
```typescript
// ✅ CORRECT - Let component fetch its own data
export default function Page() {
  return (
    <Suspense>
      <Cart /> {/* Fetches inside the boundary */}
    </Suspense>
  );
}

async function Cart() {
  const user = await fetchUser(); // Fetches at request time
  return <div>{user.cart}</div>;
}
```

### Gotcha 4: Revalidation Strategy Confusion

**Problem:**
```typescript
// ❌ Unclear: Is this static or dynamic?
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

**Solution:**
```typescript
// ✅ CLEAR: Explicitly static with ISR
export const revalidate = 3600; // Revalidate every hour

async function StaticContent() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Match export
  });
  return <div>{data}</div>;
}

// ✅ CLEAR: Explicitly dynamic, streamed
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicContent />
    </Suspense>
  );
}

async function DynamicContent() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store' // Fresh on every request
  });
  return <div>{data}</div>;
}
```

### Gotcha 5: Error Boundary Inside Suspense

**Problem:**
```typescript
// ⚠️ Error boundaries and Suspense interact in unexpected ways
<Suspense fallback={<div>Loading...</div>}>
  <ErrorBoundary fallback={<div>Error!</div>}>
    <Component />
  </ErrorBoundary>
</Suspense>
```

**Best practice:**
```typescript
// ✅ Error boundary wraps Suspense
<ErrorBoundary fallback={<div>Error!</div>}>
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

### Gotcha 6: `key` Prop on Suspense with Dynamic Routes

**Problem:**
```typescript
// ❌ WRONG - Doesn't remount Suspense on param change
export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetails id={params.id} />
    </Suspense>
  );
}

// When user navigates: /product/1 → /product/2
// ProductDetails doesn't refetch because Suspense didn't remount
```

**Solution:**
```typescript
// ✅ CORRECT - Use key to remount on param change
export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense key={params.id} fallback={<div>Loading...</div>}>
      <ProductDetails id={params.id} />
    </Suspense>
  );
}

// Now when user navigates: /product/1 → /product/2
// Suspense boundary remounts and ProductDetails refetches
```

---

## References

- [Next.js PPR Documentation](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/ppr)
- [Getting Started: Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [Next.js Streaming Patterns](https://vercel.com/blog/partial-prerendering-with-next-js-creating-a-new-default-rendering-model)
- [Next.js 15 Blog Post](https://nextjs.org/blog/next-15)
- [Next.js 16 Updates](https://nextjs.org/blog/next-16)
- [Error Boundary Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
