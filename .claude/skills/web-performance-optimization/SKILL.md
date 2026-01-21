---
name: optimizing-web-performance-nextjs-react
description: Diagnoses, profiles, and fixes performance issues in Next.js 15 and React 19 applications. Covers Core Web Vitals optimization (INP, LCP, CLS), React Compiler integration, Server Components waterfall debugging, JavaScript bundle optimization, image/font tuning, and database query efficiency. Use when optimizing web app performance, debugging slow interactions, reducing bundle size, implementing Server Components, or improving Core Web Vitals scores.
---

# Optimizing Web Performance in Next.js 15 & React 19

## Quick Start

### Diagnosis Checklist (Start Here)

Run these checks in order to identify your bottleneck:

```bash
# 1. Run Lighthouse audit
# Chrome DevTools → Lighthouse → Analyze page load
# Look for: LCP, INP, CLS values

# 2. Check which metric is failing
# Good targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

# 3. Identify the main thread blocker
# Chrome DevTools → Performance → Record → Interact → Stop
# Look for: Long Tasks (> 50ms blocks interaction)

# 4. Check for memory issues
# Chrome DevTools → Memory → Performance Monitor
# Watch: JS Heap, Documents, Nodes over time

# 5. Profile React renders
# React DevTools → Profiler → Record interactions
# Watch for: Unnecessary re-renders, expensive computations
```

### Quick Wins (30-50% INP improvement)

```javascript
// ✅ 1. Defer non-critical work after paint
function handleButtonClick() {
  // Critical: Update UI immediately
  setLoadingState(true);
  updateVisibleUI();

  // Non-critical: Defer to after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      sendAnalytics();
      prefetchNextPage();
      updateBackgroundState();
    }, 0);
  });
}

// ✅ 2. Yield to main thread in loops (prevents thread blocking)
async function processLargeDataset(items) {
  let lastYieldTime = performance.now();
  
  for (const item of items) {
    processItem(item);
    
    // Yield every 50ms to allow interactions
    if (performance.now() - lastYieldTime > 50) {
      await yieldToMain();
      lastYieldTime = performance.now();
    }
  }
}

function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ✅ 3. Use startTransition for non-urgent updates
import { startTransition } from 'react';

function handleSearch(query) {
  // Urgent: Update input field immediately
  setInputValue(query);
  
  // Non-urgent: Update results (won't block input)
  startTransition(() => {
    setSearchResults(filterResults(query));
  });
}

// ✅ 4. Remove unused JavaScript
// next.config.js - analyze bundle
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});

// Then run: ANALYZE=true npm run build
```

---

## When to Use This Skill

Use this skill when:

- **INP is > 200ms** - slow interactions blocking main thread
- **LCP is > 2.5s** - image or JavaScript delays initial paint
- **CLS is > 0.1** - fonts, images, or dynamic content shifting layout
- **Bundle size > 150KB** - excessive JavaScript blocking interaction
- **Waterfall requests visible** - sequential Server Component fetching
- **Memory leaks suspected** - heap grows over time without stabilizing
- **React re-renders excessive** - components re-rendering unnecessarily
- **Database queries > 100ms** - N+1 problems or missing indexes

---

## Core Web Vitals Explained (2025)

### INP: Interaction to Next Paint (Most Important)

**What it measures:** Time from user interaction (click, tap, keystroke) to visible response on screen.

**Components:**
- **Input Delay (0-50ms):** Time to execute event listeners (browser + your code)
- **Processing Duration (0-100ms):** JavaScript computation between input and paint
- **Presentation Delay (0-50ms):** Time to render paint after processing

**Good:** < 200ms | **Needs work:** 200-500ms | **Poor:** > 500ms

**Causes of slow INP in React:**
1. Expensive event handlers (`onChange` on large lists)
2. Main thread blocking tasks (data processing without yielding)
3. React re-renders during interaction
4. Third-party scripts (GTM, analytics) on main thread
5. Complex DOM trees (1000+ nodes on page)

**Fix Priority:**
1. Reduce input delay: Move handlers off critical path
2. Reduce processing: Split work with `startTransition`
3. Reduce presentation: Optimize renders with React Compiler

---

### LCP: Largest Contentful Paint

**What it measures:** Time until the largest element (image/text block) is visible.

**Good:** < 2.5s | **Needs work:** 2.5-4s | **Poor:** > 4s

**Common LCP elements:**
- Hero image
- Above-fold text block
- Product image (e-commerce)

**Optimization order:**
1. **Image optimization** (biggest impact: 30-50% improvement)
2. **Font loading strategy** (fonts often delay paint)
3. **JavaScript loading** (defer non-critical scripts)
4. **Server Component fetching** (parallel data requests)

---

### CLS: Cumulative Layout Shift

**What it measures:** Visual stability - how much content shifts after initial paint.

**Good:** < 0.1 | **Needs work:** 0.1-0.25 | **Poor:** > 0.25

**Common causes:**
1. Web fonts loading (FOUT/FOIT)
2. Images without dimensions set
3. Ads injected into page
4. Dynamically loaded content above fold

**Quick fix:** Reserve space for all dynamic content with `aspect-ratio` or `min-height`.

---

## Image Optimization for LCP

### Strategy: Images Often Cause 40-60% of LCP Issues

```typescript
// ❌ BAD: Large unoptimized image, no priority
<Image 
  src="/hero.jpg" 
  width={1200} 
  height={600}
  alt="Hero"
/>

// ✅ GOOD: Optimized with priority and modern formats
<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="Hero"
  priority // Preload immediately
  quality={85} // 85% quality = 30-40% smaller
  sizes="100vw" // Use full viewport width
/>

// ✅ BEST: Next.js 15 automatic format selection
// Just set priority=true and Next.js handles avif/webp
<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  priority
  alt="Hero"
/>
```

### Image Sizing for Responsive Design

```tsx
// ✅ Responsive images with sizes attribute
<Image
  src="/product.jpg"
  width={1200}
  height={800}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 80vw,
         1200px"
  priority
  alt="Product"
/>

// Why sizes matters:
// Without sizes: Browser downloads 1200px image on mobile (waste)
// With sizes: Browser downloads 100vw image on mobile (~390px actual)
// Result: 80-90% bandwidth savings on mobile
```

### LCP Image Formula

```javascript
// Measure LCP images
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.element) {
      console.log('LCP Element:', {
        element: entry.element.tagName,
        url: entry.element.src || entry.element.textContent?.slice(0, 50),
        renderTime: entry.renderTime,
        loadTime: entry.loadTime,
        startTime: entry.startTime
      });
    }
  }
});

observer.observe({ type: 'largest-contentful-paint', buffered: true });
```

---

## Font Optimization for LCP & CLS

### Problem: Fonts Cause Both LCP Delay and CLS

**FOUT (Flash of Unstyled Text):** Text visible in fallback font, then swaps when web font loads
**FOIT (Flash of Invisible Text):** Text invisible until web font loads, then appears

Both cause layout shift.

### Solution: Use next/font with Preloading

```typescript
// app/layout.tsx - Declare fonts at root
import { Inter, Geist_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately
  preload: true, // Preload at build time (default)
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Font Subsetting (Reduces Font Size by 70-80%)

```typescript
const roboto = Roboto({
  weight: ['400', '700'], // Only load these weights
  subsets: ['latin'], // Only Latin characters
  variable: '--font-roboto', // Use CSS variable
});

// Only 5KB instead of 30KB+
```

### CLS Prevention with size-adjust

```typescript
// next/font automatically uses size-adjust to prevent CLS
// This makes fallback font (e.g., Arial) match web font dimensions
// Result: No visible shift when font loads
```

---

## React 19 Compiler: Replacing Manual Memoization

### What Changed

React 19 Compiler **eliminates need for `useMemo`, `useCallback`, `React.memo`** by analyzing code at build time.

### Before (React 18)

```tsx
// ❌ Manual memoization boilerplate
import { useState, useMemo, useCallback, memo } from 'react';

const ListItem = memo(({ item, onDelete }) => (
  <li>
    {item.name}
    <button onClick={onDelete}>Delete</button>
  </li>
));

export function TodoList() {
  const [todos, setTodos] = useState([]);
  
  const handleDelete = useCallback((id) => {
    setTodos(t => t.filter(todo => todo.id !== id));
  }, []);

  const sortedTodos = useMemo(() => {
    return todos.sort((a, b) => a.created - b.created);
  }, [todos]);

  return (
    <ul>
      {sortedTodos.map(todo => (
        <ListItem 
          key={todo.id} 
          item={todo} 
          onDelete={() => handleDelete(todo.id)}
        />
      ))}
    </ul>
  );
}
```

### After (React 19)

```tsx
// ✅ No manual memoization - Compiler handles it
export function TodoList() {
  const [todos, setTodos] = useState([]);
  
  function handleDelete(id) {
    setTodos(t => t.filter(todo => todo.id !== id));
  }

  const sortedTodos = todos.sort((a, b) => a.created - b.created);

  return (
    <ul>
      {sortedTodos.map(todo => (
        <ListItem 
          key={todo.id} 
          item={todo} 
          onDelete={() => handleDelete(todo.id)}
        />
      ))}
    </ul>
  );
}

// React Compiler automatically:
// - Memoizes handleDelete (stable reference)
// - Memoizes sortedTodos (recomputes only if todos changes)
// - Prevents ListItem re-renders when props unchanged
```

### Enabling React Compiler

```bash
npm install babel-plugin-react-compiler
```

```javascript
// babel.config.js
module.exports = {
  plugins: [['babel-plugin-react-compiler']],
};
```

```typescript
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true,
  },
};
```

### When to Still Use useMemo/useCallback

Only in these rare cases:
1. Third-party libraries expect stable references
2. Extremely expensive calculations (> 100ms)
3. Large object/array comparisons

```typescript
// ✅ Rare case: Third-party library needs stable reference
const config = useMemo(() => ({
  apiKey: process.env.API_KEY,
  endpoints: { users: '/api/users', posts: '/api/posts' }
}), []);

useEffect(() => {
  thirdPartyLibrary.init(config);
}, [config]);
```

---

## INP Optimization Workflow

### Step 1: Measure the Culprit

```javascript
// Measure which interactions are slow
import { onINP } from 'web-vitals/attribution';

const slowInteractions = [];

onINP((metric) => {
  const breakdown = metric.attribution;
  
  slowInteractions.push({
    value: metric.value, // Total INP
    inputDelay: breakdown.inputDelay,
    processingDuration: breakdown.processingDuration,
    presentationDelay: breakdown.presentationDelay,
    interactionType: breakdown.interactionType, // 'click', 'tap', 'key'
    target: breakdown.interactionTarget, // Element that was clicked
  });
  
  console.log('Worst interactions:', slowInteractions.sort((a,b) => b.value - a.value).slice(0, 5));
});
```

### Step 2: Fix Based on Component

**If `inputDelay` is high (> 100ms):**
- Event handler is slow or blocked
- Move async work out of handler

```typescript
// ❌ BAD: Processing blocks input
input.addEventListener('input', async (e) => {
  const data = await fetch('/api/validate');
  updateUI(data);
});

// ✅ GOOD: Fetch doesn't block input
input.addEventListener('input', (e) => {
  updateUI(e.target.value); // Immediate
  fetch('/api/validate').then(data => updateUI(data)); // Async
});
```

**If `processingDuration` is high (> 100ms):**
- JavaScript computation blocking thread
- Use `startTransition` or `yieldToMain()`

```typescript
// ❌ BAD: Heavy computation blocks render
function handleSearch(query) {
  const results = performExpensiveSearch(query); // 200ms
  setResults(results);
}

// ✅ GOOD: Use startTransition to keep UI responsive
function handleSearch(query) {
  setInputValue(query); // Immediate (urgent)
  startTransition(() => {
    const results = performExpensiveSearch(query);
    setResults(results); // Non-urgent (lower priority)
  });
}
```

**If `presentationDelay` is high (> 50ms):**
- React re-rendering is expensive
- Check Component tree for unnecessary renders

```typescript
// ✅ Debug expensive re-renders
import { Profiler } from 'react';

<Profiler 
  id="ProductList" 
  onRender={(id, phase, duration) => {
    if (duration > 10) {
      console.warn(`${id} took ${duration}ms to render`);
    }
  }}
>
  <ProductList />
</Profiler>
```

---

## React Server Components: Debugging Waterfall Requests

### Problem: Sequential Data Fetching (Common Mistake)

```typescript
// ❌ BAD: Creates waterfall - each component waits for previous
async function Dashboard() {
  const user = await getUser(); // Request 1: 200ms
  
  return (
    <>
      <UserHeader user={user} />
      <Stats userId={user.id} /> {/* Waits for user! Request 2: 300ms */}
      <RecentActivity userId={user.id} /> {/* Waits for stats! Request 3: 250ms */}
    </>
  );
}

// Timeline: 200 + 300 + 250 = 750ms total 😞
```

### Solution 1: Parallel Requests with Promise.all()

```typescript
// ✅ GOOD: Fetch in parallel
async function Dashboard() {
  const [user, stats, activity] = await Promise.all([
    getUser(),
    getStats(null), // Don't depend on user yet
    getActivity(null)
  ]);
  
  return (
    <>
      <UserHeader user={user} />
      <Stats data={stats} />
      <RecentActivity data={activity} />
    </>
  );
}

// Timeline: max(200, 300, 250) = 300ms total ✅
```

### Solution 2: Suspense Boundaries (Streaming)

```typescript
// ✅ BEST: Serve what's ready, stream rest
import { Suspense } from 'react';

async function Dashboard() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <UserHeader />
      </Suspense>
      
      <Suspense fallback={<StatsSkeleton />}>
        <Stats userId={undefined} /> {/* Loads in parallel */}
      </Suspense>
      
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity userId={undefined} />
      </Suspense>
    </>
  );
}

// User sees:
// 1. Skeletons immediately (0ms)
// 2. Header fills in (200ms)
// 3. Stats fill in (300ms)
// 4. Activity fills in (250ms)
// Perceived load time: ~200ms (vs 750ms) ✅
```

### Debugging Tool: React DevTools Profiler

```typescript
// Enable in Chrome DevTools:
// React DevTools → Profiler → Record → Interact → Stop

// Look for:
// 1. Components that take > 10ms to render
// 2. Components that re-render multiple times for same data
// 3. Unnecessary Suspense fallbacks being rendered
```

---

## Next.js 15 Partial Prerendering (PPR)

### What It Does

Renders **static parts** at build time, **streams dynamic parts** at request time - in a single HTTP request.

### Problem It Solves

```typescript
// ❌ BEFORE: Single dynamic data makes entire page dynamic
export async function generateMetadata({ params }) {
  const userId = params.id;
  
  // One async call anywhere makes whole page dynamic
  const user = await getUser(userId);
  
  return {
    title: user.name,
  };
}

// Result: Page loses caching, LCP gets worse
```

### Solution: PPR

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    ppr: 'incremental', // Enable PPR
  },
};

// app/user/[id]/page.tsx
export const experimental_ppr = true;

export async function Page({ params }) {
  return (
    <>
      {/* Static shell - rendered at build time */}
      <Header />
      <UserDetails />
      
      {/* Dynamic holes - streamed at request time */}
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryStatus productId={params.id} />
      </Suspense>
      
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations productId={params.id} />
      </Suspense>
    </>
  );
}

// Result:
// - Static parts cached at edge (instant)
// - Dynamic parts streamed from origin (~100-200ms)
// - User sees meaningful content immediately
```

---

## JavaScript Bundle Optimization

### Analyze Bundle Size

```bash
# Create bundle analysis report
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});

# Run analysis
ANALYZE=true npm run build

# Look for:
# - Vendor dependencies > 50KB (consider alternatives)
# - Duplicate packages (fix package-lock.json)
# - Barrel files importing unused code
```

### Code Splitting: Dynamic Imports

```typescript
// ❌ BAD: All code in main bundle
import { PDFViewer, PDFGenerator } from '@/pdf-tools';

export function Dashboard() {
  const [showPDF, setShowPDF] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowPDF(true)}>View PDF</button>
      {showPDF && <PDFViewer />}
    </>
  );
}

// PDF library loaded on every page load (wasteful)

// ✅ GOOD: Dynamic import
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/pdf-tools').then(m => m.PDFViewer), {
  loading: () => <p>Loading PDF...</p>,
  ssr: false, // PDF viewer doesn't need SSR
});

export function Dashboard() {
  const [showPDF, setShowPDF] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowPDF(true)}>View PDF</button>
      {showPDF && <PDFViewer />}
    </>
  );
}

// PDF library loaded only when clicked ✅
```

### Tree Shaking: Avoid Barrel Files

```typescript
// ❌ BAD: Barrel file imports entire package
// @/utils/index.ts
export { expensive1 } from './expensive1'; // 50KB
export { expensive2 } from './expensive2'; // 50KB
export { tiny } from './tiny'; // 2KB

// page.tsx
import { tiny } from '@/utils'; // Bundles all 102KB!

// ✅ GOOD: Direct import
import { tiny } from '@/utils/tiny'; // Bundles only 2KB
```

### Third-Party Script Optimization

```typescript
// ❌ BAD: Blocks main thread
<script src="https://analytics.js" />

// ✅ GOOD: Load with defer
<script src="https://analytics.js" defer />

// ✅ BETTER: Use Partytown (move to Web Worker)
<script defer src="https://cdn.jsdelivr.net/npm/@builder.io/partytown/lib/partytown.js" />

// Wrap scripts in Partytown
<script
  type="text/partytown"
  src="https://analytics.js"
/>

// Result: Offloads GTM, analytics, ads to separate thread
// INP improvement: 30-50% typical
```

---

## Memory Leaks & Detached Nodes

### Detect Memory Leaks

```javascript
// Chrome DevTools → Memory tab → Performance Monitor
// Watch for: JS Heap steadily increasing over time without dropping

// If you see continuous growth → potential memory leak

// Root causes:
// 1. Event listeners not removed
// 2. Timers/intervals not cleared
// 3. Closures holding references
// 4. Detached DOM nodes
```

### Fix: Cleanup Functions

```typescript
// ❌ BAD: Memory leak
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // Forgot to remove!
}, []);

// ✅ GOOD: Cleanup
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll); // Cleanup
  };
}, []);

// ✅ ALSO: Abort fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(res => setData(res));
  
  return () => controller.abort(); // Cancel on unmount
}, []);
```

### Find Detached DOM Nodes

```javascript
// Chrome DevTools → Memory → Heap Snapshot
// Search for: "Detached HTMLDivElement" or similar

// Common cause: Removing element from DOM while React still references it

// ✅ Fix: Use React refs properly
const ref = useRef(null);

useEffect(() => {
  if (ref.current) {
    ref.current.remove(); // ❌ Wrong
  }
}, []);

// Instead:
const [show, setShow] = useState(true);
return show ? <div ref={ref}>{...}</div> : null;
```

---

## Database Query Optimization (N+1 Problem)

### Detect N+1 Queries

```typescript
// Enable query logging in Prisma/Drizzle
// Prisma:
const prisma = new PrismaClient({
  log: ['query'],
});

// If you see repeated queries for same data pattern → N+1 problem
```

### Common N+1 Pattern in Next.js

```typescript
// ❌ BAD: N+1 in Server Component
async function ProductList() {
  const products = await db.product.findMany(); // Query 1
  
  return (
    <>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </>
  );
}

// Inside ProductCard:
async function ProductCard({ product }) {
  const inventory = await db.inventory.findOne({ // Query 2, 3, 4... (N times!)
    where: { productId: product.id }
  });
  
  return <div>{product.name} - {inventory.count}</div>;
}

// With 20 products: 1 + 20 = 21 queries! 😞
```

### Solution 1: Fetch Data at Root Level

```typescript
// ✅ GOOD: Fetch everything at once
async function ProductList() {
  const products = await db.product.findMany({
    include: { // Single query with JOIN
      inventory: true
    }
  });
  
  return (
    <>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </>
  );
}

// ProductCard now receives pre-joined data
function ProductCard({ product }) {
  return <div>{product.name} - {product.inventory.count}</div>;
}

// Result: 1 query instead of 21 ✅
```

### Solution 2: DataLoader Pattern (Batching)

```typescript
import DataLoader from 'dataloader';

const inventoryLoader = new DataLoader(async (productIds) => {
  // Batch multiple loads into single query
  const inventories = await db.inventory.findMany({
    where: { productId: { in: productIds } }
  });
  
  return productIds.map(id => 
    inventories.find(inv => inv.productId === id)
  );
});

// Usage: Multiple calls get batched
const inv1 = await inventoryLoader.load(1); // Queue
const inv2 = await inventoryLoader.load(2); // Queue
// Executes as single query at end of event loop
```

### Solution 3: Request Memoization

```typescript
// Next.js automatically memoizes fetch() in Server Components

async function Page() {
  // Both calls hit database once (second is cached)
  const user1 = await fetch('/api/user/123').then(r => r.json());
  const user2 = await fetch('/api/user/123').then(r => r.json());
  
  return <>{user1.name} - {user2.name}</>;
}

// For non-fetch calls:
import { cache } from 'react';

const getUser = cache(async (id) => {
  return db.user.findOne({ where: { id } });
});

async function Page() {
  const user1 = await getUser(123); // Database call
  const user2 = await getUser(123); // Cached result
}
```

---

## Chrome DevTools Profiling Workflow

### Step 1: Record Performance

```
1. Open Chrome DevTools → Performance tab
2. Click "Record" circle
3. Interact with page (click buttons, scroll, type)
4. Click "Stop" to end recording
5. Analyze the flame chart
```

### Step 2: Identify Issues

**Look for these patterns:**

| Pattern | Problem | Solution |
|---------|---------|----------|
| Red triangle on task | Long Task (> 50ms) | Split work with `yieldToMain()` |
| Long JavaScript bar | Heavy computation | Use `startTransition` |
| Long Layout bar | DOM thrashing | Batch DOM reads/writes |
| Long Paint bar | Complex rendering | Simplify CSS or virtualize list |

### Step 3: Memory Debugging

```javascript
// Chrome DevTools → Memory tab → Heap Snapshot

// Take snapshots at different times:
// 1. Before interaction
// 2. After interaction
// 3. After cleanup

// Compare snapshots to find what's not being freed
// Look for: Detached DOM nodes, uncleaned event listeners
```

---

## Common Anti-Patterns (2025)

### ❌ Overusing 'use client'

```typescript
// BAD: Entire app is client-side
'use client';

export default function App() {
  return <>{/* All components here */}</>;
}

// Problem:
// - All JavaScript shipped to client
// - No data fetching on server
// - Bundle size bloated
// - Database credentials exposed to client

// GOOD: Only mark interactive components as client
// app/layout.tsx - no 'use client' (Server Component by default)
export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// app/header.tsx - client-side if needed
'use client';
export function Header() {
  const [open, setOpen] = useState(false);
  return <>{/* Interactive UI */}</>;
}
```

### ❌ Fetching in useEffect on Client

```typescript
// ❌ BAD: Fetches on client, causes waterfall
'use client';

export function Dashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(setUser);
  }, []);
  
  return <>{user?.name}</>;
}

// Timeline:
// 1. Client downloads JS (200ms)
// 2. React hydrates (100ms)
// 3. useEffect runs fetch (300ms)
// Total: 600ms before data appears

// ✅ GOOD: Fetch on server
async function Dashboard() {
  const user = await db.user.findOne();
  
  return <>{user.name}</>;
}

// Timeline:
// 1. Server fetches data (100ms)
// 2. Server renders HTML (50ms)
// 3. Client displays (0ms - HTML already has content)
// Total: 150ms perceived
```

### ❌ Missing Suspense Boundaries

```typescript
// ❌ BAD: Entire page waits for slow component
async function Page() {
  const user = await getUser(); // 200ms
  const posts = await getPosts(); // 500ms - blocks entire page!
  
  return <>
    <UserInfo user={user} />
    <PostList posts={posts} />
  </>;
}

// ✅ GOOD: Stream what's ready
import { Suspense } from 'react';

async function Page() {
  return <>
    <Suspense fallback={<UserSkeleton />}>
      <UserInfo />
    </Suspense>
    
    <Suspense fallback={<PostsSkeleton />}>
      <PostList />
    </Suspense>
  </>;
}

// User sees UserInfo at 200ms, PostList at 500ms (better UX)
```

---

## Best Practices

1. **Measure First** - Use Lighthouse, WebPageTest, real user metrics before optimizing
2. **Prioritize INP** - Interaction responsiveness matters most for user experience
3. **Server Everything Possible** - Keep bundle small, fetch on server
4. **Stream, Don't Wait** - Use Suspense to show content as it loads
5. **Batch Database Queries** - Use `include`/`populate` not loops
6. **Monitor Production** - Use Sentry, DataDog, or similar to catch real issues
7. **Test Mobile** - Test on actual 4G and slow devices, not desktop
8. **Defer Analytics** - Move GTM/analytics to Web Workers with Partytown

---

## References

- [Web.dev: Core Web Vitals](https://web.dev/explore/core-web-vitals)
- [Next.js Optimization Guide](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React 19 Compiler](https://react.dev/blog/2024/12/19/react-19)
- [INP Optimization Guide](https://www.linkgraph.com/blog/interaction-to-next-paint-optimization/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance)
- [Partytown Web Workers](https://partytown.builder.io/)
- [React Server Components Waterfall Article](https://www.developerway.com/posts/react-server-components-performance)
- [N+1 Query Prevention](https://uicraft.dev/blog/optimizing-nextjs-backend-performance-solving-the-n1-query-problem)
- [Font Loading Best Practices](https://web.dev/articles/optimize-cls)
- [Partial Prerendering PPR](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
