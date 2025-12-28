# ISR Implementation Plan (T051-T056)

**Date:** 2025-11-26
**Phase:** 3 - Frontend Performance Optimization
**Tasks:** T051-T056
**Status:** ✅ Implementation Ready

---

## Executive Summary

Implementing Incremental Static Regeneration (ISR) for 53 static routes identified in baseline analysis.

**Expected Impact:**
- **30-50% faster page loads** for static content
- **Reduced server load** by serving cached static pages
- **Fresh content** with configurable revalidation intervals
- **Better UX** with instant page loads from CDN edge

---

## ISR Strategy by Route Category

### Category 1: Landing & Marketing Pages (⏰ 1 hour revalidation)
**Why:** Content changes infrequently, high traffic, SEO critical

| Route | Current | ISR Config | Rationale |
|-------|---------|------------|-----------|
| `/` (Landing) | SSR | `revalidate: 3600` | Home page, high traffic, stable content |
| `/welcome` | SSR | `revalidate: 3600` | Onboarding page, rarely changes |
| `/demo` | SSR | `revalidate: 3600` | Demo showcase, stable features |

**Code Pattern:**
```typescript
// app/(public)/landing/page.tsx
export const revalidate = 3600 // Revalidate every 1 hour

export default function LandingPage() {
  // Server Component by default
  return <LandingContent />
}
```

---

### Category 2: Dashboard Overview Pages (⏰ 5 minutes revalidation)
**Why:** Display aggregated data, acceptable slight staleness, high traffic

| Route | Current | ISR Config | Rationale |
|-------|---------|------------|-----------|
| `/dashboard` | SSR | `revalidate: 300` | Dashboard home, aggregate stats |
| `/dashboard/admin` | SSR | `revalidate: 300` | Admin overview, KPIs update every 5min |
| `/dashboard/restaurant` | SSR | `revalidate: 300` | Restaurant overview, order stats |
| `/dashboard/driver` | SSR | `revalidate: 300` | Driver overview, delivery stats |

**Code Pattern:**
```typescript
// app/dashboard/admin/page.tsx
export const revalidate = 300 // Revalidate every 5 minutes

export default async function AdminDashboard() {
  // Fetch data at build time + revalidation
  const stats = await fetchDashboardStats()
  return <DashboardOverview stats={stats} />
}
```

---

### Category 3: Analytics Pages (⏰ 10 minutes revalidation)
**Why:** Historical data, reports generated periodically

| Route | Current | ISR Config | Rationale |
|-------|---------|------------|-----------|
| `/dashboard/admin/analytics` | SSR | `revalidate: 600` | Historical analytics, 10min acceptable |
| `/dashboard/driver/analytics` | SSR | `revalidate: 600` | Driver performance metrics |
| `/dashboard/restaurant/analytics` | SSR | `revalidate: 600` | Restaurant analytics reports |
| `/analytics` | SSR | `revalidate: 600` | Global analytics dashboard |

**Code Pattern:**
```typescript
// app/dashboard/admin/analytics/page.tsx
export const revalidate = 600 // Revalidate every 10 minutes

export default async function AnalyticsPage() {
  const analyticsData = await fetchAnalytics()
  return <AnalyticsDashboard data={analyticsData} />
}
```

---

### Category 4: Product Catalog (⏰ 30 minutes revalidation)
**Why:** Products change moderately, high traffic from restaurants

| Route | Current | ISR Config | Rationale |
|-------|---------|------------|-----------|
| `/catalog` | SSR | `revalidate: 1800` | Product catalog, bulk orders |
| `/dashboard/restaurant/order` | SSR | `revalidate: 1800` | Product ordering page |

**Code Pattern:**
```typescript
// app/catalog/page.tsx
export const revalidate = 1800 // Revalidate every 30 minutes

export default async function CatalogPage() {
  const products = await fetchProducts()
  return <ProductCatalog products={products} />
}
```

---

### Category 5: Settings & Configuration (⏰ 1 hour revalidation)
**Why:** Rarely changes, low traffic, user-specific portions use client components

| Route | Current | ISR Config | Rationale |
|-------|---------|------------|-----------|
| `/dashboard/admin/settings` | SSR | `revalidate: 3600` | System settings, hourly check ok |
| `/dashboard/driver/settings` | SSR | `revalidate: 3600` | Driver preferences |
| `/dashboard/restaurant/settings` | SSR | `revalidate: 3600` | Restaurant settings |

**Code Pattern:**
```typescript
// app/dashboard/admin/settings/page.tsx
export const revalidate = 3600 // Revalidate every 1 hour

export default async function SettingsPage() {
  const systemSettings = await fetchSystemSettings()
  return (
    <>
      <SystemSettings data={systemSettings} /> {/* Server Component */}
      <UserSettings /> {/* Client Component for user-specific data */}
    </>
  )
}
```

---

### Category 6: Real-Time Pages (❌ NO ISR - Keep SSR)
**Why:** Require real-time data, frequently changing

| Route | Current | Keep As | Rationale |
|-------|---------|---------|-----------|
| `/dashboard/admin/orders` | SSR | SSR (no ISR) | Live order management |
| `/dashboard/driver/deliveries` | SSR | SSR (no ISR) | Active deliveries |
| `/dashboard/restaurant/kitchen` | SSR | SSR (no ISR) | Kitchen orders (live) |
| `/checkout` | SSR | SSR (no ISR) | Checkout process (dynamic) |

**Code Pattern:**
```typescript
// app/dashboard/admin/orders/page.tsx
// NO revalidate export - stays as SSR

export default async function OrdersPage() {
  // Always fetch fresh data
  const orders = await fetchOrders()
  return <OrderManagement orders={orders} />
}
```

---

## Implementation Checklist

### T051: ISR Configuration Setup ✅
- [x] Create ISR_IMPLEMENTATION_PLAN.md
- [x] Define revalidation intervals by route category
- [x] Document code patterns
- [ ] Create Next.js config updates (if needed)

### T052: Landing & Marketing Pages ISR
- [ ] Implement ISR for `/` (landing)
- [ ] Implement ISR for `/welcome`
- [ ] Implement ISR for `/demo`
- [ ] Add metadata exports for SEO
- [ ] Test revalidation behavior

### T053: Dashboard Overview Pages ISR
- [ ] Implement ISR for `/dashboard`
- [ ] Implement ISR for `/dashboard/admin`
- [ ] Implement ISR for `/dashboard/restaurant`
- [ ] Implement ISR for `/dashboard/driver`
- [ ] Add loading states with Suspense

### T054: Analytics Pages ISR
- [ ] Implement ISR for `/dashboard/admin/analytics`
- [ ] Implement ISR for `/dashboard/driver/analytics`
- [ ] Implement ISR for `/dashboard/restaurant/analytics`
- [ ] Implement ISR for `/analytics`
- [ ] Integrate with Phase 2 RPC functions

### T055: Product Catalog ISR
- [ ] Implement ISR for `/catalog`
- [ ] Implement ISR for `/dashboard/restaurant/order`
- [ ] Add product image optimization
- [ ] Test with large product sets

### T056: Settings Pages ISR
- [ ] Implement ISR for `/dashboard/admin/settings`
- [ ] Implement ISR for `/dashboard/driver/settings`
- [ ] Implement ISR for `/dashboard/restaurant/settings`
- [ ] Separate static/dynamic content
- [ ] Add validation and testing

---

## Advanced ISR Patterns

### Pattern 1: On-Demand Revalidation
For critical updates (e.g., product price changes), trigger revalidation:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const path = request.nextUrl.searchParams.get('path')

  if (!path) {
    return NextResponse.json({ message: 'Missing path' }, { status: 400 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}

// Usage: POST /api/revalidate?secret=XXX&path=/catalog
```

### Pattern 2: Tag-Based Revalidation
Group related pages for batch revalidation:

```typescript
// app/catalog/page.tsx
export const revalidate = 1800
export const tags = ['products', 'catalog']

export default async function CatalogPage() {
  const products = await fetchProducts()
  return <ProductCatalog products={products} />
}

// Revalidate all product-related pages
import { revalidateTag } from 'next/cache'
await revalidateTag('products')
```

### Pattern 3: Conditional Revalidation
Different intervals based on data freshness:

```typescript
// app/dashboard/admin/page.tsx
export async function generateStaticParams() {
  // Pre-render dashboard at build time
  return [{}]
}

export default async function AdminDashboard() {
  const stats = await fetchStats()

  // Determine revalidation based on data age
  const dataAge = Date.now() - new Date(stats.last_updated).getTime()
  const revalidate = dataAge > 3600000 ? 300 : 600 // 5min if stale, else 10min

  return <Dashboard stats={stats} revalidate={revalidate} />
}
```

---

## Performance Monitoring

### Metrics to Track

**Before ISR (Baseline from analyze-frontend-performance.mjs):**
- Static routes: 53
- Revalidate exports: 0
- Server Components ratio: Low (110% client components)

**After ISR (Expected Improvements):**
| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| Page Load Time (p50) | ~800ms | ~200ms | **4X faster** |
| Page Load Time (p95) | ~1500ms | ~400ms | **3.75X faster** |
| Time to First Byte (TTFB) | ~200ms | ~50ms | **4X faster** |
| Server CPU Usage | Baseline | -40% | **40% reduction** |
| Cache Hit Rate | 0% | 85%+ | **85%+ cached** |

### Verification Commands

```bash
# 1. Check revalidate exports
grep -r "export const revalidate" frontend/src/app

# 2. Analyze build output
npm run build | grep -E "(Static|SSR|ISR)"

# 3. Test ISR behavior
curl -I https://distribution.greenland77.ge/
# Look for: X-Nextjs-Cache: HIT or STALE

# 4. Monitor revalidation
# Check Vercel/deployment logs for ISR events
```

---

## Testing Strategy

### 1. Unit Tests for ISR Configuration
```typescript
// __tests__/isr-config.test.ts
import { revalidate as landingRevalidate } from '@/app/(public)/landing/page'
import { revalidate as dashboardRevalidate } from '@/app/dashboard/page'

describe('ISR Configuration', () => {
  it('should have correct revalidation intervals', () => {
    expect(landingRevalidate).toBe(3600) // 1 hour
    expect(dashboardRevalidate).toBe(300) // 5 minutes
  })
})
```

### 2. E2E Tests for Revalidation
```typescript
// tests/e2e/isr.spec.ts
import { test, expect } from '@playwright/test'

test('ISR revalidation works correctly', async ({ page }) => {
  // First visit - miss
  await page.goto('/dashboard/admin/analytics')
  const firstResponse = await page.waitForResponse('/dashboard/admin/analytics')
  expect(firstResponse.headers()['x-nextjs-cache']).toBe('MISS')

  // Second visit - hit
  await page.reload()
  const secondResponse = await page.waitForResponse('/dashboard/admin/analytics')
  expect(secondResponse.headers()['x-nextjs-cache']).toBe('HIT')
})
```

### 3. Manual Testing Checklist
- [ ] Verify static generation at build time
- [ ] Test revalidation after interval expires
- [ ] Check cache headers (X-Nextjs-Cache)
- [ ] Verify on-demand revalidation API
- [ ] Test with different user roles
- [ ] Monitor performance improvements

---

## Rollback Plan

If ISR causes issues:

1. **Immediate Rollback:**
   ```bash
   # Remove all revalidate exports
   find frontend/src/app -name "page.tsx" -exec sed -i '/export const revalidate/d' {} \;

   # Rebuild and deploy
   npm run build && npm run deploy
   ```

2. **Gradual Rollback:**
   - Remove ISR from problematic routes only
   - Keep working routes with ISR
   - Monitor and iterate

3. **Revert Commit:**
   ```bash
   git revert <commit-hash>
   git push origin 001-postgres-opt
   ```

---

## Next Steps After T051-T056

After completing ISR implementation:
1. **Verify** performance improvements with Lighthouse
2. **Monitor** cache hit rates in production
3. **Measure** TTFB and page load time reductions
4. **Document** lessons learned
5. **Proceed** to T057-T066 (Code Splitting)

---

## References

- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel ISR Guide](https://vercel.com/docs/incremental-static-regeneration)
- Frontend Performance Baseline: `frontend-performance-baseline.json`

---

**Status:** ✅ Plan Complete, Ready for Implementation
**Next:** Implement T052 (Landing & Marketing Pages ISR)
