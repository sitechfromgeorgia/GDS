---
name: nextjs-15-server-client-components
description: Guides AI agents on choosing between Server and Client Components in Next.js 15 and React 19, covering RSC mental models, the serialization boundary, async data fetching, Suspense streaming, and composition patterns. Use when designing Next.js 15 app architecture, deciding component rendering strategy, or implementing data fetching patterns. Includes decision matrices, code patterns, and common pitfalls.
---

# Next.js 15: Server Components vs Client Components

## Quick Start

**Default to Server Components.** In Next.js 15, all components are Server Components by default. Use `'use client'` only at leaf nodes where client interactivity is needed.

```typescript
// ✅ Server Component (default) - fetch data directly
export default async function ProductList() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 } // Next.js 15: must explicitly set cache
  }).then(r => r.json());
  
  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

// ✅ Client Component (leaf node) - state & interactivity only
'use client';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => setLiked(!liked)}>
        {liked ? '❤️' : '🤍'}
      </button>
    </div>
  );
}
```

**Critical caching rule in Next.js 15:**
```typescript
// ❌ v14 behavior (cached by default) - NO LONGER WORKS
const res = await fetch('/api/data');

// ✅ v15 requirement (explicit cache control)
const res = await fetch('/api/data', {
  cache: 'force-cache' // cache indefinitely
  // OR
  next: { revalidate: 60 } // cache for 60 seconds
  // OR default is no-store (fresh on each request)
});
```

---

## When to Use This Skill

### Architectural Decisions
- Choosing between Server and Client rendering for a component
- Determining which part of the app needs interactivity
- Deciding where to fetch data (server vs client)
- Optimizing bundle size and performance

### Data Fetching Strategy
- Implementing parallel vs sequential data fetching
- Caching and revalidation strategy in Next.js 15
- Using Suspense boundaries for streaming
- Detecting and preventing waterfalls

### Component Composition
- Passing Server Components through Client Component boundaries (children pattern)
- Wrapping interactive features with minimal client code
- Using Server Actions with Client Components
- Avoiding "use client" creep up the tree

### Debugging & Migration
- Fixing hydration mismatches (dates, random numbers)
- Resolving serialization errors ("Functions cannot be passed...")
- Migrating from Next.js 14 to 15 caching behavior
- Understanding the serialization boundary

---

## Server Components vs Client Components: Decision Matrix

| Decision Factor | Server Component | Client Component | Decision |
|---|---|---|---|
| **Fetch sensitive data (DB, API keys)** | ✅ Safe, server-only | ❌ Exposes to client | → Use **Server** |
| **Need React hooks (useState, useEffect)** | ❌ Cannot use hooks | ✅ Full hook support | → Use **Client** |
| **User interactivity (clicks, forms)** | ❌ Not interactive | ✅ Handles interactions | → Use **Client** |
| **Direct DB/CMS queries** | ✅ Direct connection | ❌ Need API layer | → Use **Server** |
| **Access browser APIs (window, localStorage)** | ❌ Not available | ✅ Full browser access | → Use **Client** |
| **Real-time updates needed** | ⚠️ Polling only | ✅ WebSockets native | → Use **Client** (or WebSocket) |
| **Initial page load perf** | ✅ Zero JS sent | ❌ Ships JavaScript | → Use **Server** |
| **Display current date/time** | ⚠️ May hydration mismatch | ✅ Safe in useEffect | → Consider **Client** |
| **Static content (blog post, page template)** | ✅ Optimal perf | ❌ Unnecessary JS | → Use **Server** |

**Gold Standard Rule:** Server by default, Client only at leaves where interactivity exists.

---

## The Serialization Boundary: Core Mental Model

### What It Means
When data crosses from Server → Client Component, React **serializes** it using a format called "Flight". Only certain types can be serialized:

**Serializable (Safe to pass):**
- Primitives: `string`, `number`, `boolean`, `null`
- Arrays and objects (plain JS objects only)
- `Date`, `FormData`, `Map`, `Set`
- Promises

**NOT Serializable (Will error):**
- Functions (including callbacks, event handlers)
- Classes (custom class instances)
- Symbols
- JSX elements / React components
- `undefined`

### Example: The Error & Fix

```typescript
// ❌ WRONG: Server trying to pass function to Client
export default async function Page() {
  const handleSave = async (data) => {
    // logic here
  };

  return <Form onSave={handleSave} />; // ❌ Error!
}

// ✅ CORRECT: Server Component calls Server Action from Client
// app/actions.ts
'use server';
export async function saveData(data: FormData) {
  // server-only logic
  await db.insert(data);
}

// app/form.tsx
'use client';
import { saveData } from './actions';

export function Form() {
  return (
    <form action={saveData}>
      <button type="submit">Save</button>
    </form>
  );
}

// app/page.tsx (Server Component)
import { Form } from './form';

export default function Page() {
  return <Form />; // ✅ Works! Form is Client, imported as-is
}
```

---

## Next.js 15 Caching: The v14 → v15 Breaking Change

### The Paradigm Shift

**Next.js 14:** `fetch()` was **cached by default** (force-cache)
**Next.js 15:** `fetch()` is **NOT cached by default** (no-store)

This is the biggest gotcha when upgrading.

### Caching Explicit Control

```typescript
// app/page.tsx
export default async function Page() {
  // v15: This fetches fresh data on EVERY request
  const res = await fetch('https://api.example.com/data');
  
  const data = await res.json();
  return <div>{data}</div>;
}
```

### Three Explicit Cache Strategies

**1. Immutable Cache (Forever)** — Use for static data
```typescript
const res = await fetch('https://api.example.com/config', {
  cache: 'force-cache'
});
```

**2. Revalidating Cache (ISR-like)** — Best for most content
```typescript
const res = await fetch('https://api.example.com/posts', {
  next: { 
    revalidate: 3600, // cache 1 hour, then check for fresh
    tags: ['posts']   // optional: on-demand revalidation
  }
});
```

**3. Dynamic (Always Fresh)** — For real-time data
```typescript
const res = await fetch('https://api.example.com/live', {
  cache: 'no-store' // or: next: { revalidate: 0 }
});
```

### The `'use cache'` Directive (Next.js 15+ experimental)

For fine-grained cache control across a module:
```typescript
'use cache';

export async function fetchNews() {
  const res = await fetch('https://api.example.com/news', {
    next: { revalidate: 120 } // 2 minutes
  });
  return res.json();
}

export async function getCachedUser(id: string) {
  // Inherits 'use cache' from top of file
  return await db.user.findById(id);
}
```

---

## Async/Await in Server Components: Simplified Data Fetching

### Native Support (No Hooks Needed)

Unlike Client Components, Server Components natively support `async/await`:

```typescript
// ✅ CORRECT: Async Server Component
export default async function Dashboard() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <PostList posts={posts} />
    </div>
  );
}

async function fetchUser() {
  const res = await fetch('https://api.example.com/user', {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}
```

### Parallel Fetching (Avoid Waterfalls)

```typescript
// ❌ BAD: Sequential fetching (waterfalls - slow!)
export default async function Page() {
  const user = await fetchUser(); // waits
  const posts = await fetchPosts(user.id); // then waits
  return <div>{user.name} - {posts.length} posts</div>;
}

// ✅ GOOD: Parallel fetching (concurrent - fast!)
export default async function Page() {
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts() // if doesn't depend on user.id
  ]);
  return <div>{user.name} - {posts.length} posts</div>;
}

// ✅ ALSO GOOD: Initiate in parallel, await separately
export default async function Page() {
  const userPromise = fetchUser();
  const postsPromise = fetchPosts();
  
  const user = await userPromise;
  const posts = await postsPromise;
  
  return <div>{user.name} - {posts.length} posts</div>;
}
```

---

## Suspense & Streaming: Progressive Content

Wrap async operations in `<Suspense>` to stream partial content while waiting:

```typescript
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Static shell renders immediately */}
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile />
      </Suspense>
      
      {/* Each boundary streams independently */}
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostList />
      </Suspense>
    </div>
  );
}

async function UserProfile() {
  const user = await fetchUser();
  return <div>{user.name}</div>;
}

async function PostList() {
  const posts = await fetchPosts();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

**How it works:**
1. Server renders static `<h1>` → sent immediately
2. Client sees `<h1>` while `UserProfile` data fetches
3. `UserProfile` resolves → streamed to client (replaces fallback)
4. Meanwhile, `PostList` fetches in parallel
5. Client receives both updates as they complete

This is **Partial Prerendering (PPR)** — static shell + streamed dynamic parts.

---

## Composition Pattern: The Children Trick

### Problem: Importing Server Components into Client Components Creates Inefficiency

```typescript
// ❌ WRONG: Client imports Server Component directly
'use client';
import { ServerComponent } from './server-component'; // ⚠️ Now a Client Component!

export default function Layout() {
  return (
    <div>
      <ServerComponent /> {/* Wasted: rendered on client, loses benefits */}
    </div>
  );
}
```

### Solution: Pass Server Components as `children`

```typescript
// app/components/layout.tsx (Client Component)
'use client';
import { useState } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle</button>
      {sidebarOpen && <aside>Sidebar</aside>}
      <main>{children}</main> {/* children stay as Server Components! */}
    </div>
  );
}

// app/page.tsx (Server Component)
import { Layout } from './components/layout';

async function DatabaseContent() {
  const data = await db.query(); // ✅ Still runs on server!
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <Layout>
      <DatabaseContent /> {/* ✅ Remains a Server Component */}
    </Layout>
  );
}
```

**Why it works:** `children` is just data (React elements), not an import. Server renders `DatabaseContent`, passes result through Client's `Layout`.

---

## Real-World Example: Blog Post with Comments

```typescript
// app/posts/[slug]/page.tsx (Server Component)
import { Suspense } from 'react';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';

export default async function PostPage({ params }) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      {/* Static section */}
      <hr />
      <h2>Comments</h2>

      {/* Streaming section: form renders immediately, list streams */}
      <CommentForm postId={post.id} />
      
      <Suspense fallback={<div>Loading comments...</div>}>
        <CommentList postId={post.id} />
      </Suspense>
    </article>
  );
}

// app/posts/[slug]/comment-form.tsx (Client Component)
'use client';
import { useState } from 'react';
import { submitComment } from './actions';

export function CommentForm({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await submitComment(postId, formData);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="content" placeholder="Your comment..." />
      <button disabled={loading}>Post</button>
    </form>
  );
}

// app/posts/[slug]/comment-list.tsx (Server Component)
import { getComments } from '@/lib/db';

export async function CommentList({ postId }: { postId: string }) {
  const comments = await getComments(postId);
  
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <strong>{comment.author}</strong>
          <p>{comment.text}</p>
        </div>
      ))}
    </div>
  );
}

// app/posts/[slug]/actions.ts (Server Actions)
'use server';
import { db } from '@/lib/db';

export async function submitComment(postId: string, formData: FormData) {
  const content = formData.get('content');
  await db.comments.insert({ postId, content });
  // Optional: revalidate to show new comment immediately
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Hydration Mismatch (Dates & Random Numbers)

**Problem:** Server renders "Dec 25", client renders "Dec 26" (timezone diff or timing).

```typescript
// ❌ WRONG: Renders different on server vs client
export default function Post({ post }) {
  return (
    <div>
      <h2>{post.title}</h2>
      <p>Posted: {new Date().toLocaleDateString()}</p> {/* Mismatch! */}
    </div>
  );
}

// ✅ FIX 1: Render on client only (useEffect)
'use client';
export default function Post({ post }) {
  const [date, setDate] = useState<string>();

  useEffect(() => {
    setDate(post.createdAt.toLocaleDateString());
  }, []);

  return (
    <div>
      <h2>{post.title}</h2>
      <p>Posted: {date || 'loading...'}</p>
    </div>
  );
}

// ✅ FIX 2: Pass pre-formatted string from Server
export default async function Post() {
  const post = await fetchPost();
  const formattedDate = formatDateUTC(post.createdAt); // Server formats

  return (
    <div>
      <h2>{post.title}</h2>
      <p>Posted: {formattedDate}</p> {/* Server-rendered, consistent */}
    </div>
  );
}

// ✅ FIX 3: suppressHydrationWarning (last resort)
export default function Post({ post }) {
  return (
    <p suppressHydrationWarning>
      Posted: {new Date().toLocaleDateString()}
    </p>
  );
}
```

### Pitfall 2: "Functions Cannot Be Passed to Client Components"

**Problem:** Trying to pass a function from Server → Client Component.

```typescript
// ❌ WRONG: Server tries to pass callback to Client
export default async function Page() {
  const handleDelete = async (id: string) => {
    await db.delete(id);
  };

  return <DeleteButton onDelete={handleDelete} />; // Error!
}

// ✅ FIX: Use Server Actions
// app/actions.ts
'use server';
export async function deleteItem(id: string) {
  await db.delete(id);
  revalidatePath('/items');
}

// app/components/delete-button.tsx
'use client';
import { deleteItem } from '@/app/actions';

export function DeleteButton({ itemId }: { itemId: string }) {
  return (
    <button onClick={() => deleteItem(itemId)}>
      Delete
    </button>
  );
}
```

### Pitfall 3: Using "use client" Too High in the Tree

**Problem:** Marking root layout as `'use client'` makes entire app client-rendered, defeating benefits.

```typescript
// ❌ WRONG: Root layout client-renders everything
'use client'; // <-- DON'T do this at top level

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// ✅ CORRECT: Keep providers at leaf, use children pattern
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider> {/* Client component */}
          {children} {/* Still Server Components! */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Pitfall 4: Sequential (Waterfall) Data Fetching

**Problem:** Fetching user → then posts one at a time = slow.

```typescript
// ❌ SLOW: Waterfall (user first, then posts)
export default async function Dashboard() {
  const user = await fetchUser(); // Network call 1
  const posts = await fetchPosts(user.id); // Network call 2 (after 1 completes)
  // Total time = call1_time + call2_time (serial)
}

// ✅ FAST: Parallel fetching
export default async function Dashboard() {
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts()
  ]); // Both start immediately, complete ~same time
}

// ✅ ALSO GOOD: If posts depend on user.id
export default async function Dashboard() {
  const user = await fetchUser();
  // Now fetch posts in parallel if other data doesn't depend on user
  const [posts, notifications] = await Promise.all([
    fetchPosts(user.id),
    fetchNotifications(user.id)
  ]);
}
```

### Pitfall 5: ObjectId / Non-Serializable Props from Database

**Problem:** MongoDB ObjectId has `Buffer` which isn't serializable.

```typescript
// ❌ WRONG: Passing raw ObjectId to Client Component
export default async function Page() {
  const user = await db.users.findById('123'); // _id is ObjectId
  return <UserCard user={user} />; // ❌ Error: ObjectId not serializable
}

// ✅ FIX: Convert to string
export default async function Page() {
  const user = await db.users.findById('123');
  return (
    <UserCard 
      user={{
        ...user,
        id: user._id.toString() // ✅ Convert to string
      }}
    />
  );
}
```

---

## Best Practices & Rationale

1. **Default to Server Components**
   - Sends zero client JavaScript
   - Keep sensitive logic on server
   - Direct database access, no API layer needed
   - Better initial page load

2. **Push Client Components to the Leaves**
   - Only mark as `'use client'` where interactivity exists
   - Preserve Server Component benefits higher up tree
   - Minimize client bundle size
   - Example: Button component is Client, Page is Server

3. **Explicit Cache Control in v15**
   - Every `fetch()` requires explicit cache option or `next.revalidate`
   - Default (no-store) ensures fresh data but hits backend
   - Use `revalidate: 60` for most dynamic content
   - Use `cache: 'force-cache'` for immutable data

4. **Use Suspense Boundaries for Streaming**
   - Wrap independent async operations in `<Suspense>`
   - Users see static shell immediately while data loads
   - Each boundary can stream content independently
   - Better perceived performance

5. **Composition Pattern (Children) Over Importing**
   - Pass Server Components as `children` to Client Components
   - Avoids converting Server → Client unnecessarily
   - Cleaner data flow, better performance

6. **Detect Waterfalls, Use Promise.all()**
   - Sequential fetches kill performance
   - Parallel fetching with `Promise.all()` is critical
   - If one fetch depends on another, acknowledge the waterfall explicitly

7. **Server Actions for Mutations**
   - Use `'use server'` for data mutations
   - Safer than exposing backend logic
   - Accessible directly from Client Components
   - Handles serialization automatically

---

## Debugging Checklist

When components behave unexpectedly:

- [ ] Is the component trying to use `useState`, `useEffect`? → Must add `'use client'`
- [ ] Seeing hydration error? → Check for `new Date()`, `Math.random()`, timezone issues
- [ ] "Functions cannot be passed"? → Use Server Actions or pass serializable data only
- [ ] Data not updating? → Check Next.js 15 caching (explicit `next.revalidate` or `cache:`)
- [ ] Slow load time? → Check for waterfalls (sequential fetches) - use `Promise.all()`
- [ ] Bundle too large? → Is `'use client'` placed too high? Push to leaves only
- [ ] Server Component imports into Client? → Use children pattern instead
- [ ] Non-serializable props (ObjectId, Date)? → Convert to primitives (string, number)
- [ ] Page statically generated when should be dynamic? → Check for dynamic APIs, may need `export const dynamic = 'force-dynamic'`

---

## References

**Official Documentation:**
- [Next.js 15: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js 15: Data Fetching Guide](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js 15: Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js 15: Partial Prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering)
- [React 19: Server Components](https://react.dev/reference/rsc/server-components)
- [React 19: use server Directive](https://react.dev/reference/rsc/use-server)

**Key Sections:**
- [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-mutation/server-actions)
- [Hydration Error Messages](https://nextjs.org/docs/messages/react-hydration-error)
