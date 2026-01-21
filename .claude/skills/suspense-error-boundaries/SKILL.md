---
name: implementing-resilient-ui-nextjs-15
description: Implements resilient UI patterns in Next.js 15 using Suspense, loading.tsx, and error.tsx with hierarchical error boundaries, granular recovery, and waterfall prevention. Use when building error-resilient pages, preventing layout shifts with skeletons, handling segment-level errors, or streaming data progressively with Server Components.
---

# Implementing Resilient UI in Next.js 15

Resilient UI patterns protect against errors and loading delays by showing granular fallbacks, preventing whole-page loading states, and enabling segment-specific recovery. This skill explains the hierarchy of `loading.tsx` → `error.tsx` → `Suspense` boundaries, how to prevent waterfall loading, and when to use each pattern.

## Quick Start

### 1. Basic Loading State (Automatic Streaming)

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}
```

### 2. Granular Error Boundary

```typescript
// app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded">
      <h2 className="text-red-900 font-semibold">Something went wrong</h2>
      <p className="text-red-700 text-sm mt-2">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
```

### 3. Manual Suspense for Granular Streaming

```typescript
// app/products/[id]/page.tsx
import { Suspense } from 'react';
import ProductDetails from '@/components/ProductDetails';
import Reviews from '@/components/Reviews';
import ReviewsSkeleton from '@/components/ReviewsSkeleton';

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Fast data: renders immediately */}
      <ProductDetails productId={params.id} />
      
      {/* Slow data: isolated Suspense boundary */}
      <Suspense fallback={<ReviewsSkeleton />} key={params.id}>
        <Reviews productId={params.id} />
      </Suspense>
    </div>
  );
}
```

---

## When to Use This Skill

- **Building error-resilient pages** with isolated error recovery
- **Streaming Server Components** without blocking the entire page
- **Preventing layout shifts** with skeleton placeholders during loading
- **Handling segment-specific errors** at different hierarchy levels
- **Distinguishing between expected 404s** (`notFound()`) and unexpected exceptions (`error.tsx`)
- **Preventing waterfall loading** where components fetch sequentially

---

## The Hierarchy (Mental Model)

Understanding the component tree is critical. Error and loading boundaries work from **closest to farthest** from the source:

```
app/
├── layout.tsx                    ← Root (wraps everything)
├── error.tsx                     ← Never catches root layout errors
├── global-error.tsx             ← Last resort: catches root layout errors
│
└── dashboard/
    ├── layout.tsx               ← Dashboard layout
    ├── loading.tsx              ← Wraps page & children in <Suspense>
    ├── error.tsx                ← Catches dashboard page errors (NOT layout errors)
    │
    └── [id]/
        ├── page.tsx             ← Throws error → caught by dashboard/error.tsx
        ├── error.tsx            ← Catches THIS segment's errors
        ├── not-found.tsx        ← Renders when notFound() is called
        └── components/
            ├── ProductList.tsx (suspends) → caught by nearest Suspense
            └── Reviews.tsx (suspends)      → caught by nearest Suspense
```

### Key Principles

**Error Boundaries Don't Catch Their Own Layout:**
- `app/dashboard/error.tsx` wraps `app/dashboard/page.tsx` and children
- It CANNOT catch errors in `app/dashboard/layout.tsx` itself
- Move `error.tsx` to parent if layout errors occur

**Loading.tsx Uses Automatic Suspense:**
- `loading.tsx` = implicit `<Suspense>` boundary around page content
- Shows fallback immediately; streams page when ready
- Only works for **route segments** (requires a nested folder structure)

**Suspense vs Loading.tsx:**
- `loading.tsx` → page-level, automatic
- `<Suspense>` → component-level, granular, manual control

**Reset() Re-renders Only the Segment:**
- `error.tsx` contains `reset()` function
- Clicking "Try Again" attempts to **re-render the segment**, not the whole page
- Useful for transient errors (network blips, server timeouts)

---

## Loading Patterns (Streaming)

### Pattern 1: Page-Level Loading (Automatic)

Use `loading.tsx` for full-page skeletons:

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// app/dashboard/page.tsx
export default async function Page() {
  const data = await fetchDashboardData(); // Suspends here
  return <Dashboard data={data} />;
}
```

**When the page loads:**
1. Browser shows `loading.tsx` immediately (while `page.tsx` suspends)
2. Server fetches data
3. HTML streams in, replacing skeleton
4. Static content (header, nav) visible the whole time

### Pattern 2: Granular Suspense (Manual)

Prevent whole-page blocking for slow components:

```typescript
// app/products/[id]/page.tsx
import { Suspense } from 'react';

async function ProductDetails({ id }: { id: string }) {
  const product = await fetch(`/api/products/${id}`).then(r => r.json());
  return <div>{product.name} - ${product.price}</div>;
}

async function Reviews({ id }: { id: string }) {
  // Simulates slower API
  await new Promise(resolve => setTimeout(resolve, 3000));
  const reviews = await fetch(`/api/products/${id}/reviews`).then(r => r.json());
  return <div>{reviews.length} reviews</div>;
}

function ReviewsSkeleton() {
  return <div className="h-32 bg-gray-200 rounded animate-pulse"></div>;
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main>
      {/* Fast component renders immediately */}
      <ProductDetails id={params.id} />
      
      {/* Slow component gets its own boundary */}
      <Suspense fallback={<ReviewsSkeleton />} key={params.id}>
        <Reviews id={params.id} />
      </Suspense>
    </main>
  );
}
```

**Result:** User sees product details in ~500ms, reviews stream in after 3s. No blocking.

### Pattern 3: Prevent Waterfall Loading

❌ **WATERFALL (Sequential):**
```typescript
// Each component suspends one after another
async function Parent() {
  const user = await fetch('/api/user').then(r => r.json());      // 500ms
  const posts = await fetch(`/api/posts/${user.id}`).then(...);   // 1000ms (waits for user)
  const comments = await fetch(`/api/comments`).then(...);        // 1500ms (waits for posts)
  // Total: 2+ seconds
}
```

✅ **PARALLEL:**
```typescript
// Fetch in parallel before rendering
async function Parent() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json()),
  ]);
  // Total: ~500ms (fastest request)
}
```

✅ **GRANULAR SUSPENSE:**
```typescript
async function User() {
  const user = await fetch('/api/user').then(r => r.json());
  return <div>{user.name}</div>;
}

async function Posts() {
  const posts = await fetch('/api/posts').then(r => r.json());
  return <div>{posts.length} posts</div>;
}

export default function Page() {
  return (
    <main>
      <Suspense fallback={<div>Loading user...</div>}>
        <User />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
    </main>
  );
}
```

Each component starts fetching immediately. User sees whichever completes first.

---

## Error Handling (Resilience)

### Error.tsx with Segment Recovery

```typescript
// app/dashboard/error.tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Dashboard Error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    reset(); // Attempts to re-render the segment
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-6">
      <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Dashboard Error
      </h1>
      
      <p className="text-gray-600 text-center max-w-md mb-4">
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Try Again ({retryCount})
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
        >
          Go Home
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 p-4 bg-gray-100 rounded text-xs overflow-auto max-w-2xl">
          {error.stack}
        </pre>
      )}
    </div>
  );
}
```

### Global Error (Root Layout Errors)

```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-900 mb-2">
              Critical Error
            </h1>
            <p className="text-red-700 mb-6">
              {error.message || 'The application encountered a critical error.'}
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

**Note:** `global-error.tsx` MUST include `<html>` and `<body>` tags because it replaces the entire root layout.

### Not Found vs Error

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetch(`/api/products/${params.id}`)
    .then(r => r.json())
    .catch(() => null);

  if (!product) {
    // Expected: resource doesn't exist → use notFound()
    notFound();
  }

  if (product.archived) {
    // Unexpected: data fetch succeeded but product is archived
    throw new Error('Product has been archived');
  }

  return <div>{product.name}</div>;
}
```

```typescript
// app/products/[id]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-600 mb-6">Product not found</p>
      <Link href="/products" className="text-blue-600 hover:underline">
        Back to Products
      </Link>
    </main>
  );
}

// app/products/error.tsx (catches unexpected errors like archived products)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button onClick={() => reset()} className="px-4 py-2 bg-blue-600 text-white rounded">
        Try Again
      </button>
    </main>
  );
}
```

**Key difference:**
- `notFound()` → renders `not-found.tsx` (resource doesn't exist)
- `throw Error()` → renders `error.tsx` (unexpected failure)

---

## Best Practices

### 1. Skeleton UI Prevents CLS (Cumulative Layout Shift)

```typescript
// ✅ GOOD: Skeleton matches content shape
function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
    </div>
  );
}

// ❌ WRONG: Skeleton is too small, causes layout shift
function BadSkeleton() {
  return <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>;
}
```

### 2. Use Key on Suspense for Route Changes

```typescript
// ✅ GOOD: Key changes with params, resets Suspense
export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Skeleton />} key={params.id}>
      <ProductDetails id={params.id} />
    </Suspense>
  );
}

// ❌ WRONG: Key never changes, component won't re-suspend on route change
export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProductDetails id={params.id} />
    </Suspense>
  );
}
```

### 3. Don't Wrap Suspense Too High

```typescript
// ❌ WRONG: Header blocked during product load
export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Header /> {/* Waits for everything */}
      <ProductDetails />
      <Reviews />
    </Suspense>
  );
}

// ✅ GOOD: Header shows immediately, only slow parts suspend
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </>
  );
}
```

### 4. Reset Only Handles Segment-Level Errors

```typescript
// ✅ CORRECT: reset() re-runs data fetch for THIS segment
export default async function Page() {
  const data = await fetch('/api/data').then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

  return <Dashboard data={data} />;
}

// When error.tsx calls reset(), it attempts to re-render Page,
// which re-runs the fetch. If fetch succeeds, data loads.
// If fetch fails again, error.tsx renders again.
```

### 5. Use Error Reporting

```typescript
// app/components/ErrorReporter.tsx
'use client';

import { useEffect } from 'react';

interface ErrorReporterProps {
  error: Error & { digest?: string };
}

export function ErrorReporter({ error }: ErrorReporterProps) {
  useEffect(() => {
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { component: 'error-boundary' },
        extra: { digest: error.digest },
      });
    }

    // Or your own service
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [error]);

  return null;
}
```

---

## Common Errors & Solutions

### "My error.tsx isn't catching errors"

**Problem:** Error occurs in layout, but `error.tsx` doesn't catch it.

**Why:** Error boundaries wrap the layout *below* them. An error in `app/dashboard/layout.tsx` is above `app/dashboard/error.tsx`.

**Solution:** Move `error.tsx` to parent:
```
app/
├── dashboard/
│   ├── layout.tsx (throws error)
│   └── error.tsx (can't catch it)
└── error.tsx (catches it if moved here)
```

---

### "Loading.tsx never shows"

**Problem:** Browser displays `page.tsx` immediately without showing `loading.tsx`.

**Why:** 
1. `loading.tsx` only works if there's **async delay** in `page.tsx`
2. Content smaller than browser buffer size won't render until more data arrives
3. Browser caching prevents streaming visualization

**Solution:**
```typescript
// app/dashboard/page.tsx
export default async function Page() {
  // Without await, no suspend occurs
  const data = fetchData(); // ❌ Promise not awaited

  // Correct: await suspends
  const data = await fetchData(); // ✅ Suspends, loading.tsx shows
}
```

Add enough content to force streaming:
```typescript
export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
```

---

### "Reset button doesn't work"

**Problem:** Clicking "Try Again" in `error.tsx` doesn't retry.

**Cause:**
- `reset()` called before `router.refresh()` → timing issue
- Error still being thrown → infinite error loop

**Solution:**
```typescript
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: any) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRetry = () => {
    startTransition(() => {
      reset(); // Clear error state
      router.refresh(); // Refresh server state
    });
  };

  return (
    <button onClick={handleRetry} disabled={isPending}>
      {isPending ? 'Retrying...' : 'Try Again'}
    </button>
  );
}
```

---

### "Components fetch data sequentially (waterfall)"

**Problem:** Each component waits for previous component's data.

**Why:** Components suspend individually, creating a chain.

**Solution:** Fetch all data before rendering:
```typescript
// ❌ WATERFALL
async function Page({ params }: any) {
  return (
    <Suspense fallback={<Skeleton1 />}>
      <Component1 /> {/* fetches, then */}
      <Suspense fallback={<Skeleton2 />}>
        <Component2 /> {/* fetches, then */}
        <Suspense fallback={<Skeleton3 />}>
          <Component3 /> {/* fetches */}
        </Suspense>
      </Suspense>
    </Suspense>
  );
}

// ✅ PARALLEL
async function Page({ params }: any) {
  // All fetch calls start immediately
  const [data1, data2, data3] = await Promise.all([
    fetch('/api/1').then(r => r.json()),
    fetch('/api/2').then(r => r.json()),
    fetch('/api/3').then(r => r.json()),
  ]);

  return (
    <Suspense fallback={<Skeleton />} key={params.id}>
      <Component1 data={data1} />
      <Component2 data={data2} />
      <Component3 data={data3} />
    </Suspense>
  );
}
```

---

## References

- [Next.js Error Handling Docs](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js Streaming & Suspense](https://nextjs.org/learn/dashboard-app/streaming)
- [React Suspense Reference](https://react.dev/reference/react/Suspense)
- [Next.js Loading UI Docs](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Error Boundary Best Practices](https://nextjs.org/learn/dashboard-app/error-handling)
