---
name: mastering-nextjs-15-caching
description: Master Next.js 15 caching strategy with ISR, revalidation, and tag-based invalidation. Learn the paradigm shift from "cached by default" (v14) to "uncached by default" (v15) for e-commerce and SaaS applications. Covers fetch caching, unstable_cache for databases, precision invalidation, and debugging with X-Nextjs-Cache headers. Use when building high-performance e-commerce or SaaS with Next.js 15 App Router.
---

# Mastering Next.js 15 Caching Strategies, ISR & Revalidation

## Quick Start

The critical shift in Next.js 15: **`fetch` defaults to `no-store` (uncached)** instead of v14's `force-cache`. You must explicitly opt into caching.

**Fetch with caching:**
```typescript
// Time-based ISR (stale-while-revalidate pattern)
const res = await fetch('https://api.example.com/products', {
  next: { revalidate: 3600, tags: ['products'] } // Revalidate after 1 hour
});

// Forever cache (immutable data like blog posts)
const res = await fetch('https://api.example.com/config', {
  cache: 'force-cache'
});

// Real-time (no cache)
const res = await fetch('https://api.example.com/realtime', {
  cache: 'no-store'
});
```

**Database queries with caching:**
```typescript
import { unstable_cache } from 'next/cache';

const getCachedProducts = unstable_cache(
  async () => {
    return await db.products.findMany();
  },
  ['products'],
  { 
    revalidate: 3600,
    tags: ['products']
  }
);
```

**Revalidate on mutation (Server Action):**
```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function createProduct(formData: FormData) {
  // Create product in DB
  const product = await db.products.create({...});
  
  // Invalidate all pages using 'products' tag
  revalidateTag('products');
  
  return product;
}
```

---

## When to Use This Skill

- **Building e-commerce with dynamic product catalogs** - Cache data with tags for instant invalidation on inventory changes
- **SaaS dashboards with user-specific data** - Distinguish between cacheable (product data) and non-cacheable (user sessions) content
- **Performance optimization on complex queries** - Use `unstable_cache` to avoid repeated database calls within ISR windows
- **Scaling to 100k+ pages** - Tag-based revalidation beats path-specific revalidation for large content sites
- **Debugging stale data issues** - Reading cache headers and understanding the 4-layer cache architecture
- **Migrating from Next.js 14** - Understanding breaking cache defaults and explicit opt-in requirements

---

## The 4 Layers of Next.js Caching (Architecture)

Next.js caches at **4 distinct layers**. Each layer has different scope and lifespan:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Client Router Cache (In-Memory Browser)           │
│ • 30s (dynamic routes) or 5m (static)                       │
│ • Stale-while-revalidate: serves stale, fetches fresh      │
│ • Cleared on hard refresh, route.push(), or timeout        │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Full Route Cache (HTML + RSC Payload)             │
│ • Server-side: 1+ hours (configurable via revalidate)      │
│ • Built at: Build time or first dynamic visit              │
│ • Bypassed if: cookies() | headers() | searchParams used   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Data Cache (Persistent Server Store)              │
│ • Multi-request persistence across all users               │
│ • Invalidated by: revalidateTag() or revalidatePath()      │
│ • Per-fetch config: cache | revalidate | tags options      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Request Memoization (React Feature)               │
│ • Single render pass deduplication                         │
│ • Duration: Lifetime of one render pass (~0.1-1s)          │
│ • Applies to: GET/HEAD fetch, or React cache()             │
└─────────────────────────────────────────────────────────────┘
```

**Layer flow:**
1. **Request Memoization** - React automatically dedupes identical `fetch` calls within same render
2. **Data Cache** - Persistent store reused across all incoming requests (hours/days)
3. **Full Route Cache** - Pre-rendered HTML + React Server Component Payload (ISR revalidation)
4. **Router Cache** - Client-side in-memory cache for faster navigation (30s-5m stale time)

---

## Decision Matrix: When to Cache What

| Data Source | Freshness Needed | Strategy | Implementation |
|-------------|------------------|----------|-----------------|
| Product catalog | 1 hour | Time-based ISR | `fetch(..., { next: { revalidate: 3600, tags: ['products'] } })` |
| User profile | Real-time | No-store | `fetch(..., { cache: 'no-store' })` |
| Blog posts | Forever | Force-cache | `fetch(..., { cache: 'force-cache' })` |
| Search results | 30 minutes | DB + unstable_cache | `unstable_cache(dbQuery, [...], { revalidate: 1800, tags: ['search'] })` |
| Homepage featured | 2 hours | Multi-tag ISR | `fetch(..., { next: { tags: ['featured', 'homepage'] } })` |
| Dynamic pricing | Per-request | No-store + headers() | `headers()` access bypasses Full Route Cache automatically |
| Admin-only data | Session-aware | No-store + cookies() | `cookies()` access makes route dynamic |
| Configuration | Never changes | Force-cache | Deploy once, cache forever |

---

## Implementation Patterns

### Pattern 1: Fetch with Time-Based ISR (Stale-While-Revalidate)

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 3600, // Revalidate after 1 hour
      tags: ['products'] // Optional: enable on-demand invalidation
    }
  });

  const products = await res.json();
  
  return <ProductList products={products} />;
}
```

**Behavior:**
- First visitor: Fetches fresh data, caches for 1 hour
- Requests within 1 hour: Returns cached data instantly
- After 1 hour: Serves stale cache immediately, fetches fresh in background
- Next request: Returns fresh data

### Pattern 2: Database Queries with unstable_cache

```typescript
// app/lib/db.ts
import { unstable_cache } from 'next/cache';
import db from '@/lib/db'; // Prisma, Drizzle, etc.

export const getCachedProducts = unstable_cache(
  async (categoryId?: string) => {
    // Every unique categoryId gets its own cache entry
    return await db.products.findMany({
      where: categoryId ? { categoryId } : undefined
    });
  },
  ['products'], // Cache key prefix
  {
    revalidate: 3600,
    tags: ['products', `products-category-${categoryId}`]
  }
);

export const getCachedProductById = unstable_cache(
  async (productId: string) => {
    return await db.products.findUnique({
      where: { id: productId }
    });
  },
  ['product'], // Shared key prefix
  {
    revalidate: 1800,
    tags: [`product-${productId}`] // Per-product invalidation
  }
);
```

**Usage in Server Component:**
```typescript
// app/products/[id]/page.tsx
import { getCachedProductById } from '@/app/lib/db';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getCachedProductById(id);
  
  return <ProductDetail product={product} />;
}
```

### Pattern 3: On-Demand Invalidation with Server Actions

```typescript
// app/actions/product.ts
'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import db from '@/lib/db';

export async function createProduct(formData: FormData) {
  const product = await db.products.create({
    data: {
      name: formData.get('name'),
      price: Number(formData.get('price'))
    }
  });

  // Invalidate all pages tagged 'products'
  revalidateTag('products');
  
  // Also refresh homepage if it uses featured products
  revalidatePath('/', 'layout');

  return product;
}

export async function updateProduct(id: string, formData: FormData) {
  const product = await db.products.update({
    where: { id },
    data: { price: Number(formData.get('price')) }
  });

  // Precision invalidation: only this product + category listings
  revalidateTag(`product-${id}`);
  revalidateTag(`products-category-${product.categoryId}`);

  return product;
}
```

**Distinction:**
- `revalidateTag()` - Invalidates **all pages** using that tag (best for entity-based updates)
- `revalidatePath()` - Invalidates **specific path** (best for layout-specific content)

### Pattern 4: Multi-Tag Strategy for Related Pages

```typescript
// app/lib/cache-tags.ts
export const cacheTags = {
  products: 'products',
  productById: (id: string) => `product-${id}`,
  productsByCategory: (categoryId: string) => `products-category-${categoryId}`,
  categories: 'categories',
  featured: 'featured-products',
  homepage: 'homepage'
};

// app/api/admin/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { cacheTags } from '@/app/lib/cache-tags';

export async function POST(req: Request) {
  const { event, entityId } = await req.json();

  switch (event) {
    case 'product.updated':
      // Invalidate: specific product + category listing + featured if applicable
      revalidateTag(cacheTags.productById(entityId));
      revalidateTag(cacheTags.productsByCategory('*')); // All categories
      revalidateTag(cacheTags.featured);
      break;
      
    case 'category.created':
      // Invalidate just categories
      revalidateTag(cacheTags.categories);
      break;
  }

  return Response.json({ revalidated: true });
}
```

### Pattern 5: Bailout Mechanisms (Force Dynamic Rendering)

```typescript
// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export default async function Dashboard() {
  // Accessing cookies() automatically makes this route dynamic (no Full Route Cache)
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  // Accessing headers() also makes route dynamic
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');

  // ⚠️ This route will NOT be pre-rendered; always uses ISR/dynamic rendering
  return <Dashboard userId={userId} />;
}
```

**Bailout behaviors (prevent Full Route Cache):**
- `cookies()` - Can't cache user-specific content at build time
- `headers()` - Request headers vary per user
- `searchParams` - Query parameters make routes dynamic
- `cache: 'no-store'` - Any fetch with no-store forces dynamic

---

## Precision Invalidation: revalidateTag vs revalidatePath

| Aspect | `revalidateTag()` | `revalidatePath()` |
|--------|------------------|--------------------|
| **Scope** | All pages using tag across entire site | Specific path/layout only |
| **Best for** | Entity-based updates (product created) | Page-specific content (blog post) |
| **Example** | `revalidateTag('products')` affects `/products`, `/categories/shoes`, `/homepage` | `revalidatePath('/blog/[slug]')` only affects blog pages |
| **Performance** | More efficient at scale (100k+ pages) | Slower if many paths reference same entity |
| **Use case** | "Product X changed, update everywhere" | "Refresh /about/team page" |

**Real-world scenario:**

```typescript
// E-commerce: Product price change
export async function updatePrice(productId: string, newPrice: number) {
  await db.products.update({ where: { id: productId }, data: { price: newPrice } });
  
  // Tag-based: hits product detail, listings, search results, homepage featured—all at once
  revalidateTag(`product-${productId}`);
  
  // Path-based would require:
  // revalidatePath(`/products/${productId}`, 'page');
  // revalidatePath('/products', 'page');
  // revalidatePath('/search', 'page');
  // revalidatePath('/', 'layout');  // Much more tedious!
}
```

---

## Debugging & Monitoring

### Check Cache Status with X-Nextjs-Cache Header

```typescript
// Fetch response headers include X-Nextjs-Cache
const res = await fetch('https://yourapp.com/api/data');

console.log(res.headers.get('x-nextjs-cache'));
// Output: 'HIT' | 'MISS' | 'STALE' | 'SKIP'
```

**Header meanings:**
- `HIT` - Data retrieved from cache, fresh
- `MISS` - Cache empty, fetched from source (first request)
- `STALE` - Revalidation window passed, old data served while fresh fetches
- `SKIP` - Cache skipped (no-store, cookies, headers, etc.)

### Enable Detailed Cache Logging

```bash
# Development: verbose logging
NEXT_PRIVATE_DEBUG_CACHE=1 npm run dev

# Production: check cache behavior
NEXT_PRIVATE_DEBUG_CACHE=1 npm run start
```

**Output example:**
```
✓ GET https://api.example.com/products → HIT (from Data Cache, age: 245s)
✗ GET https://api.example.com/user → SKIP (no-store)
→ POST https://api.example.com/checkout → MISS (POST always uncached)
```

### Verify unstable_cache Hits

```typescript
// Method 1: Instrument the wrapped function
const getCachedProducts = unstable_cache(
  async () => {
    console.log('🔄 Fetching products (DB hit)'); // Only logs on cache MISS
    return await db.products.findMany();
  },
  ['products'],
  { revalidate: 3600, tags: ['products'] }
);

// Method 2: Add timestamps to verify cache
export const getCachedProductsWithTime = unstable_cache(
  async () => {
    return {
      products: await db.products.findMany(),
      fetchedAt: new Date().toISOString()
    };
  },
  ['products'],
  { revalidate: 3600 }
);
```

---

## Common Errors & Solutions

### ❌ Error: Over-Caching User Data

**Problem:**
```typescript
// ❌ WRONG: Caches sensitive user data forever
export default async function Dashboard() {
  const user = await fetch(`https://api.example.com/user`, {
    next: { revalidate: 3600, tags: ['user'] }
  });

  return <Dashboard user={user} />;
}
```

**Why it fails:** All users see the same cached data (first user to visit wins).

**Solution:**
```typescript
// ✅ CORRECT: User data never cached
export default async function Dashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const user = await fetch(`https://api.example.com/user/${userId}`, {
    cache: 'no-store' // Always fresh per user
  });

  return <Dashboard user={user} />;
}
```

### ❌ Error: Not Handling Router Cache Stale Time

**Problem:**
```typescript
// User updates product, then navigates back
// Old cached version (30s stale) shown instead of fresh data
```

**Solution:**
```typescript
// app/actions/product.ts
'use server';

import { revalidateTag } from 'next/cache';
import { useRouter } from 'next/navigation'; // Client-side router

export async function updateProduct(id: string, formData: FormData) {
  await db.products.update({ where: { id }, data: {...} });
  
  // Invalidate data cache
  revalidateTag(`product-${id}`);
  
  // Force client to re-fetch (bypasses 30s Router Cache)
  // Can be called from use server + client action combo
  return { success: true };
}
```

### ❌ Error: Mixing Cached & Dynamic Fetches on Same Page

**Problem:**
```typescript
// ❌ WRONG: Inconsistent caching
export default async function ProductPage() {
  // This has 1 hour cache
  const product = await fetch(`/api/products/123`, {
    next: { revalidate: 3600 }
  });

  // This has NO cache (always fresh)
  const stock = await fetch(`/api/stock/123`, {
    cache: 'no-store'
  });

  // Page rendered dynamically because stock is no-store
  // But product data might be stale for 1 hour!
  return <>{product} {stock}</>;
}
```

**Solution:**
```typescript
// ✅ CORRECT: Align freshness
export default async function ProductPage() {
  // Both fetches now use 5-min revalidation
  const [product, stock] = await Promise.all([
    fetch(`/api/products/123`, { next: { revalidate: 300 } }),
    fetch(`/api/stock/123`, { next: { revalidate: 300 } })
  ]);

  return <>{product} {stock}</>;
}
```

### ❌ Error: Forgetting to Add Tags to Database Queries

**Problem:**
```typescript
// ❌ WRONG: Can't invalidate database cache
const getCachedProducts = unstable_cache(
  async () => db.products.findMany(),
  ['products'],
  { revalidate: 3600 }
  // ❌ Missing tags option!
);

// Now when product is created, how do we invalidate?
export async function createProduct() {
  await db.products.create({...});
  revalidateTag('products'); // Doesn't work without tags in unstable_cache!
}
```

**Solution:**
```typescript
// ✅ CORRECT: Add tags for invalidation
const getCachedProducts = unstable_cache(
  async () => db.products.findMany(),
  ['products'],
  { 
    revalidate: 3600,
    tags: ['products'] // ✅ Enable on-demand invalidation
  }
);

export async function createProduct() {
  await db.products.create({...});
  revalidateTag('products'); // Now works!
}
```

### ❌ Error: Ignoring Request Memoization in Nested Components

**Problem:**
```typescript
// This calls the same API twice (wasteful, even with memoization)
export default async function Page() {
  return (
    <div>
      <ComponentA /> {/* Fetches /api/user */}
      <ComponentB /> {/* Fetches /api/user again */}
    </div>
  );
}

// React auto-dedupes within render, but adds overhead
```

**Solution:**
```typescript
// ✅ CORRECT: Fetch once, pass down
export default async function Page() {
  const user = await fetch('/api/user');

  return (
    <div>
      <ComponentA user={user} />
      <ComponentB user={user} />
    </div>
  );
}
```

---

## Advanced Config & Opt-Outs

### Route Segment Config

```typescript
// app/dashboard/page.tsx

// Option 1: Force dynamic rendering (always ISR)
export const dynamic = 'force-dynamic';

// Option 2: Force static (build-time only, no ISR)
export const dynamic = 'force-static';

// Option 3: Error if any dynamic data detected (strict)
export const dynamic = 'error';

// Option 4: Auto (default, detect based on data sources)
export const dynamic = 'auto';

// Control fetch defaults for entire route
export const fetchCache = 'only-cache'; // All fetches must be cached
export const fetchCache = 'force-no-store'; // All fetches uncached (real-time)

// ISR configuration
export const revalidate = 3600; // Revalidate after 1 hour
export const revalidate = 0; // Dynamic (no Full Route Cache)
export const revalidate = false; // Immutable (cache forever)

export default async function Dashboard() {
  // ...
}
```

### Client Router Cache Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Pages without revalidate: 30s stale time
      static: 300, // Pages with revalidate: 5m stale time
    },
  },
};

export default nextConfig;
```

---

## Best Practices

### 1. **Tag-Based Over Path-Based for Scale**
Use `revalidateTag()` for cross-cutting entity updates; reserve `revalidatePath()` for layout-specific content.

```typescript
// ✅ Scales to 100k+ pages
revalidateTag('product-123');

// ❌ Doesn't scale (must know all affected paths)
revalidatePath('/products/123');
revalidatePath('/categories/electronics');
revalidatePath('/search?q=phone');
```

### 2. **Separate Cacheable from Non-Cacheable Data**
Never cache user-specific or real-time data; always `no-store` for auth/permissions.

```typescript
export default async function Page() {
  // ✅ Cacheable: product info (shared)
  const product = await fetch('/api/products/123', {
    next: { revalidate: 3600, tags: ['product-123'] }
  });

  // ✅ Non-cacheable: user session (personal)
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const userCart = await fetch(`/api/cart/${userId}`, {
    cache: 'no-store' // Per-user data, always fresh
  });

  return <>{product} {userCart}</>;
}
```

### 3. **Add Context to Cache Keys in unstable_cache**
Include variable values in the key array so different parameters get distinct cache entries.

```typescript
// ✅ CORRECT: Unique cache per userId
const getUserData = unstable_cache(
  async (userId: string) => db.users.findUnique({ where: { id: userId } }),
  ['user'],
  { tags: [`user-${userId}`] } // Also tag with userId
);

// Call 1: getUserData('user-1') → Cache entry 1
// Call 2: getUserData('user-2') → Cache entry 2 (distinct!)
// Call 3: getUserData('user-1') → Cache entry 1 (reused)
```

### 4. **Use Hierarchical Tags for Bulk Invalidation**
Structure tags to enable selective invalidation.

```typescript
// app/lib/cache-tags.ts
export const tags = {
  product: (id: string) => `product:${id}`,
  category: (id: string) => `category:${id}`,
  search: (query: string) => `search:${query}`,
  user: (id: string) => `user:${id}`,
};

// When category is updated, invalidate all products in that category
export async function invalidateCategory(categoryId: string) {
  revalidateTag(`category:${categoryId}`);
  // Also invalidate products in this category
  revalidateTag(`products:${categoryId}`);
}
```

### 5. **Monitor Cache Efficiency**
Log cache operations to detect over-caching or excessive misses.

```typescript
// app/lib/instrumented-fetch.ts
export const cachedFetch = async (url: string, options?: any) => {
  const startTime = Date.now();
  const res = await fetch(url, options);
  const cacheStatus = res.headers.get('x-nextjs-cache') || 'UNKNOWN';
  
  console.log(`[${cacheStatus}] ${url} (${Date.now() - startTime}ms)`);
  
  return res;
};
```

---

## Migration from Next.js 14

| Feature | Next.js 14 | Next.js 15 | Action |
|---------|-----------|-----------|--------|
| **fetch() default** | `force-cache` (cached) | `no-store` (uncached) | **Audit all fetches, add explicit `next: { revalidate }`** |
| **GET Route Handlers** | Cached by default | Dynamic by default | **Export `dynamic = 'force-static'` if static** |
| **Router Cache stale** | 30s all routes | 30s dynamic, 5m static | **Most pages unchanged, but test navigation** |
| **unstable_cache tags** | Limited | Full support | **Start using tags for invalidation** |
| **On-demand revalidation** | `revalidatePath()` | Both `revalidatePath()` + `revalidateTag()` | **Prefer `revalidateTag()` for scale** |

**Migration checklist:**
- [ ] Search all `fetch()` calls for missing cache options
- [ ] Add `next: { revalidate: N, tags: [...] }` to cacheable fetches
- [ ] Add `cache: 'no-store'` to real-time data
- [ ] Verify Route Handlers have `dynamic` export if needed
- [ ] Update revalidation logic to use tags
- [ ] Test with `NEXT_PRIVATE_DEBUG_CACHE=1` to verify behavior
- [ ] Check X-Nextjs-Cache headers in DevTools Network tab

---

## References

- [Next.js 15 Caching Guide](https://nextjs.org/docs/app/guides/caching-and-revalidating)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [revalidateTag() API](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [revalidatePath() API](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [unstable_cache() API](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
