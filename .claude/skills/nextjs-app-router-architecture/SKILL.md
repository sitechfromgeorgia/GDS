---
name: next-js-app-router-architecture
description: Implements Next.js 15 App Router file conventions, route organization patterns, parallel routes, and intercepting routes for building scalable applications. Use when building routes, structuring projects, creating modals with parallel routes, implementing advanced routing patterns, or migrating from Pages Router.
---

# Next.js 15 App Router Architecture

## Quick Start

### Essential File Conventions

| File | Purpose | Role |
|------|---------|------|
| `page.tsx` | Defines a route's UI | Creates a publicly accessible page |
| `layout.tsx` | Wraps pages & siblings | Persistent UI across routes (NOT re-rendered on navigation) |
| `template.tsx` | Like layout but RESETS on navigation | Creates fresh instance for each route visit |
| `loading.tsx` | Streaming UI during async operations | React Suspense boundary wrapper |
| `error.tsx` | Error UI for segment & children | Requires `'use client'` |
| `not-found.tsx` | Custom 404 page | Handle undefined routes |
| `route.ts` | API endpoint | HTTP handlers (GET, POST, PUT, DELETE) |
| `default.tsx` | Fallback for parallel routes | Renders when no slot matches |

### Folder Structure Template

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── (marketing)/        # Route group - URL: /about, /pricing
│   │   ├── layout.tsx      # Marketing layout
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── pricing/
│   │       └── page.tsx
│   ├── (auth)/             # Route group - URL: /login, /signup
│   │   ├── layout.tsx      # Auth layout (no navbar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── @sidebar/       # Parallel route (slot)
│   │   │   ├── default.tsx
│   │   │   └── layout.tsx
│   │   └── @analytics/     # Parallel route
│   │       ├── default.tsx
│   │       └── layout.tsx
│   ├── _components/        # Private folder - not a route
│   ├── _lib/               # Private utilities
│   └── api/
│       └── users/
│           └── route.ts    # POST /api/users
├── components/             # Shared components (colocation preferred)
├── lib/                    # Utilities, helpers
├── types/                  # TypeScript types
└── hooks/                  # Custom React hooks
```

## File-Based Routing Fundamentals

### How File System Maps to URLs

Next.js App Router uses **file system routing**: folders = route segments, `page.tsx` = publicly accessible route.

```
app/
  page.tsx                  → /
  dashboard/
    page.tsx                → /dashboard
    settings/
      page.tsx              → /dashboard/settings
  blog/
    [slug]/
      page.tsx              → /blog/nextjs, /blog/react, etc
```

**Key Rule**: Only folders with `page.tsx` or `route.ts` create routes. Other files are colocation.

### Reserved Special Files

| File | Behavior | Required? |
|------|----------|-----------|
| `page.tsx` | Makes segment publicly accessible | Yes (for public routes) |
| `layout.tsx` | Wraps all child segments; persists across navigation | No (inherits parent) |
| `template.tsx` | Like layout but unmounts/remounts on navigation | No (rarely used) |
| `loading.tsx` | Suspense boundary; shows while children load | No (optional UI) |
| `error.tsx` | Error boundary for segment | No (graceful fallback) |
| `not-found.tsx` | Custom 404 for segment & children | No (uses default) |
| `route.ts` | API endpoint handler | No (if using pages) |
| `default.tsx` | Fallback for parallel routes | Only with parallel routes |

### Server vs Client Components

```typescript
// app/page.tsx - Server Component by default
export default function Page() {
  // Can access database directly, use secrets
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// app/dashboard/client.tsx - Client Component
'use client';

import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Best Practice**: Server Components for data fetching, Client Components for interactivity.

## Route Groups

### What Are Route Groups?

Route Groups organize routes into logical sections **without affecting the URL**. Wrap folder names in parentheses: `(auth)`, `(marketing)`, `(admin)`.

**URLs unaffected:**
- `app/(auth)/login/page.tsx` → `/login` ✅ (NOT `/auth/login`)
- `app/(marketing)/about/page.tsx` → `/about` ✅ (NOT `/marketing/about`)

### Use Cases

1. **Organize by feature** - Keep related routes together
2. **Apply different layouts** - Each group can have its own `layout.tsx`
3. **Multiple root layouts** - Create completely different UIs
4. **Subset layouts** - Share layout with some routes only

### Basic Organization

```
app/
├── (marketing)/          # URL: /about, /pricing
│   ├── layout.tsx        # Shared layout for marketing
│   ├── about/
│   │   └── page.tsx      # URL: /about
│   └── pricing/
│       └── page.tsx      # URL: /pricing
├── (auth)/               # URL: /login, /signup
│   ├── layout.tsx        # Auth-specific layout
│   ├── login/
│   │   └── page.tsx      # URL: /login
│   └── signup/
│       └── page.tsx      # URL: /signup
└── dashboard/            # URL: /dashboard
    └── page.tsx
```

### Multiple Root Layouts

Create completely different UIs for different app sections:

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <html>
      <body>
        <nav>Marketing Navigation</nav>
        {children}
        <footer>Marketing Footer</footer>
      </body>
    </html>
  );
}

// app/(admin)/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <html>
      <body>
        <nav>Admin Navigation</nav>
        <aside>Admin Sidebar</aside>
        {children}
      </body>
    </html>
  );
}
```

**Critical**: Each route group layout must include `<html>` and `<body>` tags.

### Opting Specific Routes Into a Layout

Share a layout without affecting other routes:

```
app/
├── (checkout)/           # Only checkout routes share layout
│   ├── layout.tsx
│   ├── cart/
│   │   └── page.tsx
│   └── payment/
│       └── page.tsx
├── products/             # Separate layout
│   └── page.tsx
└── account/              # Also separate layout
    └── page.tsx
```

## Parallel Routes

### What Are Parallel Routes?

Render multiple pages simultaneously in the same layout. Create slots using `@slotName` folders.

**Use cases:**
- Dashboards with independent sections
- Modal overlays
- Sidebars with independent content
- Analytics panels

### Syntax and Structure

```
app/
├── layout.tsx
├── page.tsx
├── @sidebar/             # Slot 1 - renders independently
│   ├── default.tsx
│   └── layout.tsx
├── @analytics/           # Slot 2 - renders independently
│   ├── default.tsx
│   └── layout.tsx
└── @modals/              # Slot 3
    ├── default.tsx
    └── (.)[id]/          # Intercepting route inside slot
        └── page.tsx
```

### Rendering Parallel Routes

```typescript
// app/layout.tsx
type Props = {
  children: React.ReactNode;
  sidebar: React.ReactNode;    // @sidebar slot
  analytics: React.ReactNode;  // @analytics slot
  modals: React.ReactNode;     // @modals slot
};

export default function DashboardLayout({ 
  children, 
  sidebar, 
  analytics, 
  modals 
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <aside className="col-span-1">
        {sidebar}
      </aside>
      <main className="col-span-2">
        {children}
      </main>
      <div className="col-span-1">
        {analytics}
      </div>
      {modals}
    </div>
  );
}
```

### Default.tsx Behavior

`default.tsx` provides a fallback when navigating to a route without a specific slot match.

```typescript
// app/dashboard/@sidebar/default.tsx
// Renders when no specific sidebar route matches
export default function SidebarDefault() {
  return <aside>Default Sidebar Content</aside>;
}
```

**When it's required**: Always include `default.tsx` in each slot unless you're handling all routes explicitly.

### Conditional Rendering with Parallel Routes

```typescript
// app/layout.tsx
type Props = {
  children: React.ReactNode;
  settings?: React.ReactNode;
};

export default function Layout({ children, settings }: Props) {
  return (
    <>
      <main>{children}</main>
      {settings && <aside>{settings}</aside>}
    </>
  );
}

// Renders settings panel only when /dashboard/settings is active
```

## Intercepting Routes

### What Are Intercepting Routes?

Intercept client-side navigation to render alternate content while preserving the URL for bookmarking/sharing.

**Pattern**: Click image in feed → opens modal overlay. Hard refresh → shows full page.

### Intercepting Route Conventions

| Convention | Intercepts | Example |
|-----------|-----------|---------|
| `(.)` | Same segment level | `app/(.)photo` intercepts `app/photo` |
| `(..)` | One level up | `app/(..)photo` intercepts `app/gallery/photo` |
| `(..)(..)` | Two levels up | `app/(..)(..)/photo` intercepts higher routes |
| `(...)` | Root level | `app/(.../photo` intercepts from anywhere |

### Modal Implementation Example

Photo gallery with modal pattern:

```
app/
├── layout.tsx
├── page.tsx                    # Feed with photo links
├── @modal/                     # Parallel route for modals
│   ├── default.tsx
│   └── (.)[id]/                # Intercepts /photos/[id]
│       └── modal.tsx           # Modal component
└── photos/
    ├── page.tsx                # Photo listing (hard refresh fallback)
    └── [id]/
        └── page.tsx            # Full photo page
```

### Modal Implementation Code

```typescript
// app/@modal/(.)[id]/modal.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function PhotoModal({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl">
        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4"
        >
          ✕
        </button>
        <img 
          src={`/photos/${params.id}.jpg`} 
          alt="Photo"
          className="w-full"
        />
        <p>Photo {params.id}</p>
      </div>
    </div>
  );
}

// app/@modal/default.tsx
export default function ModalDefault() {
  return null;  // No modal when not intercepting
}

// app/photos/page.tsx - Feed with links
export default function PhotoFeed() {
  const photos = [1, 2, 3, 4, 5];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {photos.map(id => (
        <a key={id} href={`/photos/${id}`}>
          <img src={`/photos/${id}.jpg`} alt={`Photo ${id}`} />
        </a>
      ))}
    </div>
  );
}

// app/photos/[id]/page.tsx - Full page fallback
export default function PhotoPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Photo {params.id}</h1>
      <img src={`/photos/${params.id}.jpg`} alt={`Photo ${params.id}`} />
    </div>
  );
}
```

### Soft Navigation vs Hard Navigation

**Soft Navigation** (client-side link): Intercepting route activates → modal shows
**Hard Navigation** (URL bar, refresh): `page.tsx` renders → full page shows

```typescript
// Both routes coexist:
// - Client navigation to /photos/123 → intercepted, modal shows
// - Hard refresh at /photos/123 → full page renders
// - Bookmark /photos/123 → navigates directly to full page
```

## Dynamic Routes

### Single Dynamic Segment

```
app/posts/[slug]/page.tsx     → /posts/nextjs, /posts/react, etc.
```

```typescript
// app/posts/[slug]/page.tsx
export default function Post({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>;
}
```

### Catch-All Routes

Match multiple segments:

```
app/docs/[...slug]/page.tsx   → /docs, /docs/intro, /docs/setup/db, etc.
```

```typescript
// app/docs/[...slug]/page.tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {params.slug?.join(' / ')}</p>
    </div>
  );
}
```

### Optional Catch-All Routes

Match segment AND routes without it:

```
app/[[...slug]]/page.tsx      → /, /blog, /blog/2024, /blog/2024/january
```

```typescript
// app/[[...slug]]/page.tsx
export default function Page({ params }: { params: { slug?: string[] } }) {
  if (!params.slug) {
    return <h1>Home</h1>;
  }
  
  return <h1>Page: {params.slug.join(' / ')}</h1>;
}
```

## Layout vs Template

### Key Differences

| Aspect | `layout.tsx` | `template.tsx` |
|--------|-------------|----------------|
| **Persistence** | Persists across route changes | Unmounts/remounts on each route |
| **Re-render** | Children re-render, layout doesn't | Entire component re-renders |
| **State** | Preserved across navigations | Reset on each navigation |
| **Use case** | Sidebars, headers, shared UI | Animations, per-route state |
| **Frequency** | Always use | Rarely needed |

### Layout: Persistent UI

```typescript
// app/layout.tsx
'use client';

import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // STATE PERSISTS across page navigations
  return (
    <div className="flex">
      {sidebarOpen && <aside>Sidebar</aside>}
      <main>{children}</main>
    </div>
  );
}
```

### Template: Fresh Instance Per Route

```typescript
// app/template.tsx
'use client';

import { useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  
  // count RESETS to 0 on each navigation
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      {children}
    </div>
  );
}
```

## Project Organization Patterns

### Small Project (< 5 routes)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
└── components/
    └── Header.tsx
```

### Medium Project (5-50 routes)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── about/
│   │   └── blog/
│   │       └── [slug]/
│   │           └── page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   └── users/
│   │       └── route.ts
│   ├── _components/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── _lib/
│       └── utils.ts
└── types/
    └── index.ts
```

### Large Project (50+ routes)

```
src/
├── app/
│   ├── layout.tsx
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   │           └── BlogHeader.tsx
│   │   └── docs/
│   │       └── [[...slug]]/
│   │           ├── page.tsx
│   │           └── _components/
│   │               └── DocsNav.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── _components/
│   │   │   │   └── _actions/
│   │   │   │       └── updateProject.ts
│   │   │   └── _components/
│   │   │       └── ProjectCard.tsx
│   │   └── @sidebar/
│   │       ├── default.tsx
│   │       └── layout.tsx
│   ├── api/
│   │   ├── projects/
│   │   │   └── route.ts
│   │   └── projects/
│   │       └── [id]/
│   │           └── route.ts
│   ├── _components/          # Truly shared
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── _lib/
│   │   ├── db.ts
│   │   └── auth.ts
│   └── _actions/             # Server actions
│       └── auth.ts
├── components/               # Legacy or shared external
├── lib/                      # Global utilities
├── hooks/                    # Shared custom hooks
└── types/
    └── index.ts
```

### Colocation Best Practice

Keep files related to a route close together:

```
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── _components/
    │   ├── DashboardHeader.tsx
    │   └── StatCard.tsx
    ├── _hooks/
    │   └── useDashboardData.ts
    ├── _lib/
    │   └── formatStats.ts
    └── _actions/
        └── updateDashboard.ts
```

## Code Examples

### Basic Route with Async Data

```typescript
// app/posts/page.tsx
import { Suspense } from 'react';

async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }  // ISR: revalidate every 60s
  });
  return res.json();
}

function PostList({ posts }: { posts: any[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <PostList posts={posts} />
      </Suspense>
    </div>
  );
}
```

### Error Handling

```typescript
// app/posts/[id]/error.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### API Route Handler

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  return NextResponse.json({
    posts: [],
    page: parseInt(page)
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate, save to DB, etc.
  
  return NextResponse.json(
    { id: 123, ...body },
    { status: 201 }
  );
}
```

### Dynamic Route with Metadata

```typescript
// app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  
  if (!post) {
    return { title: 'Post not found' };
  }
  
  return {
    title: post.title,
    description: post.excerpt
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function PostPage({
  params
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  
  if (!post) {
    notFound();
  }
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

## Common Errors & Solutions

### Error: "Cannot read property 'children' of undefined"

**Cause**: Layout missing required children prop for parallel route slots.

```typescript
// ❌ Wrong
export default function Layout({ children }: Props) {
  return <>{children}</>;
}

// ✅ Correct
type Props = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  modal: React.ReactNode;
};

export default function Layout({ children, sidebar, modal }: Props) {
  return (
    <>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      {modal}
    </>
  );
}
```

### Error: "Expected `<html>` and `<body>` tags"

**Cause**: Multiple root layouts missing html/body tags.

```typescript
// ✅ Each route group layout must include html/body
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### Error: "Parallel route slot is not defined"

**Cause**: Layout references slot that doesn't have all routes defined.

```typescript
// ❌ Missing @modal/(.)[id]/page.tsx
export default function Layout({ children, modal }) {
  return <>{children}{modal}</>;
}

// ✅ Add default.tsx to handle missing routes
// app/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

### Error: "notFound() only works in route handlers or server components"

**Cause**: Using `notFound()` in client component.

```typescript
// ❌ Wrong - client component
'use client';
import { notFound } from 'next/navigation';

export default function Page() {
  notFound();  // Error!
}

// ✅ Correct - server component
import { notFound } from 'next/navigation';

export default async function Page() {
  const post = await getPost();
  if (!post) notFound();
  return <div>{post.title}</div>;
}
```

### Error: "Multiple root layouts detected"

**Cause**: Multiple `layout.tsx` files at app root without route groups.

```typescript
// ❌ Wrong
app/
  layout.tsx        // Root layout 1
  page.tsx
  dashboard/
    layout.tsx      // Root layout 2 - ERROR!

// ✅ Correct - use route groups
app/
  (main)/
    layout.tsx
    page.tsx
  (admin)/
    layout.tsx
    dashboard/
      page.tsx
```

## Best Practices

### 1. Use Server Components by Default

```typescript
// ✅ Preferred - fetch data server-side
export default async function Page() {
  const data = await fetch('api...');
  return <div>{data}</div>;
}

// ❌ Avoid - client-side fetching
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { /* fetch */ }, []);
  return <div>{data}</div>;
}
```

**Why**: Better performance, security, and SEO.

### 2. Colocation Over Separation

```
// ✅ Keep related files together
app/dashboard/
  page.tsx
  _components/
    Header.tsx
    Sidebar.tsx
  _hooks/
    useDashboardData.ts
  _actions/
    updateSettings.ts

// ❌ Avoid scattered files
components/
  DashboardHeader.tsx
  DashboardSidebar.tsx
hooks/
  useDashboardData.ts
actions/
  updateSettings.ts
```

**Why**: Easier to maintain, clearer dependencies.

### 3. Use Private Folders for Non-Route Files

```
app/
├── dashboard/
│   ├── page.tsx              # Public route
│   └── _components/          # Private - not routeable
│       └── Card.tsx
├── _lib/                     # Private utilities
└── api/
    └── route.ts              # Public API
```

**Why**: Prevents Next.js from treating them as routes.

### 4. Route Groups for Organization Without URL Impact

```
// ✅ Group related routes
app/
  (marketing)/
  (dashboard)/
  (api)/

// ❌ Avoid nested folders that change URL
app/
  public/              → /public/... (unwanted in URL)
  protected/           → /protected/... (unwanted in URL)
```

### 5. Keep Layouts Focused

```typescript
// ✅ Simple, reusable layout
export default function Layout({ children }: Props) {
  return (
    <div className="grid grid-cols-4">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// ❌ Too much logic in layout
export default function Layout({ children }: Props) {
  const [theme, setTheme] = useState('light');
  const [auth, setAuth] = useState(null);
  // ... many hooks and complex logic
  return <div>{children}</div>;
}
```

### 6. Error Boundaries at Route Level

```typescript
// app/dashboard/error.tsx
'use client';

export default function DashboardError({ error, reset }) {
  return (
    <div>
      <h2>Dashboard Error</h2>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// app/api/users/[id]/error.tsx
'use client';

export default function UserError({ error, reset }) {
  return <div>Failed to load user</div>;
}
```

## References

- [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Layouts and Templates](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
