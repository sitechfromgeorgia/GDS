---
name: designing-trpc-apis
description: Designs end-to-end type-safe RPC APIs using tRPC v11 with Next.js 15 App Router, React Query v5, and TypeScript. Use when building full-stack applications requiring type-safe server procedures, RSC integration, form data handling, and production patterns including error handling, middleware chains, and testing strategies.
---

# Designing tRPC APIs

## Quick Start

### Installation

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

### Minimal Setup (5-minute)

**Server: `src/server/trpc.ts`**
```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// 1. Create tRPC instance
const t = initTRPC.create();

// 2. Define public procedure
export const publicProcedure = t.procedure;

// 3. Create router
export const appRouter = t.router({
  greet: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { message: `Hello, ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;
```

**Route Handler: `src/app/api/trpc/[trpc]/route.ts`**
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

**Client: `src/app/page.tsx`**
```typescript
'use client';

import { httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc } from '@/trpc/client';

function Component() {
  const { data } = trpc.greet.useQuery({ name: 'Alice' });
  return <div>{data?.message}</div>;
}

export default function Page() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} state={undefined}>
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

## When to Use This Skill

- **Building full-stack Next.js 15 applications** with end-to-end type safety
- **Replacing REST APIs** where client and server share TypeScript types
- **Server Actions alternative** when you need HTTP endpoints or external consumers
- **Real-time apps** using SSE subscriptions or WebSocket connections
- **Form handling** with FormData, file uploads, and binary content
- **Type-safe data mutations** with automatic input/output validation

---

## Architecture Concepts

### tRPC v11 Core Improvements

**v11 vs v10:**
- Streaming support via `httpBatchStreamLink` (eliminate server waterfalls)
- Simplified internals: removed complex middleware composition overhead
- React Query v5 as peer dependency (replace `isLoading` → `isPending`)
- FormData/blob/binary content support (non-JSON data types)
- RSC promise hydration (prefetch in Server Components, hydrate on client)
- SSE subscriptions (recommended over WebSockets for simplicity)

### Type Safety Flow

```
TypeScript Router Definition
        ↓
Client imports type (AppRouter)
        ↓
Type inference: what input/output expected?
        ↓
Compile-time validation (TypeScript)
        ↓
Runtime validation (Zod schemas)
        ↓
Network call (HTTP, SSE, WS)
        ↓
Automatic typed result on client
```

**No code generation needed.** TypeScript's type inference handles the contract.

---

## Project Structure (Domain-Driven)

```
src/
├── server/
│   ├── trpc.ts                    # tRPC instance, procedures
│   ├── context.ts                 # createTRPCContext factory
│   ├── routers/
│   │   ├── _app.ts               # root router (lazy-loads sub-routers)
│   │   ├── user.ts               # user domain
│   │   ├── post.ts               # post domain
│   │   └── subscription.ts        # real-time subscriptions
│   └── middleware/
│       ├── auth.ts               # authentication guard
│       ├── logging.ts            # request logging
│       └── rateLimit.ts          # rate limiting
├── app/
│   ├── api/
│   │   └── trpc/[trpc]/route.ts  # HTTP endpoint
│   ├── layout.tsx                # tRPC + React Query provider
│   └── page.tsx                  # client page
└── trpc/
    ├── client.ts                 # tRPC client setup
    ├── react.tsx                 # React hooks
    └── server.tsx                # RSC utilities (prefetch, HydrateClient)
```

---

## Procedure Patterns

### 1. Public Procedure (No Auth)

```typescript
import { publicProcedure } from '@/server/trpc';
import { z } from 'zod';

export const userRouter = t.router({
  getPublicPosts: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input, ctx }) => {
      return await db.post.findMany({
        where: { published: true },
        take: input.limit,
      });
    }),
});
```

### 2. Protected Procedure (Requires Auth)

```typescript
import { TRPCError } from '@trpc/server';

// Define in server/trpc.ts
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Use in router
export const userRouter = t.router({
  getMyProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // ctx.user is guaranteed here
      return await db.user.findUnique({
        where: { id: ctx.user.id },
      });
    }),
});
```

### 3. Mutation with Input Validation

```typescript
export const userRouter = t.router({
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(10),
        tags: z.array(z.string()).max(5).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const post = await db.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
      return post;
    }),
});
```

### 4. Output Validation (Security)

```typescript
export const userRouter = t.router({
  getUserWithPosts: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        posts: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            // Never expose internal fields
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.id },
        include: { posts: true },
      });
      // Output validator strips unauthorized fields
      return user;
    }),
});
```

---

## Context & Middleware

### Create Context

```typescript
// server/context.ts
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createTRPCContext(
  opts: FetchCreateContextFnOptions
) {
  // Extract auth from header
  const auth = opts.req.headers.get('authorization');
  const user = auth ? parseJWT(auth) : null;

  return {
    user,
    req: opts.req,
    db, // injected database client
    redis, // injected cache client
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Use in tRPC
const t = initTRPC.context<typeof createTRPCContext>().create();
```

### Middleware Chain (Auth + Logging + Rate Limit)

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Logging middleware
const loggingMiddleware = t.middleware(async ({ path, type, next, input }) => {
  console.log(`[${type}] ${path}`, input);
  return next();
});

// Auth guard middleware
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next();
});

// Rate limiting middleware (user-based)
const rateLimitMiddleware = t.middleware(async ({ ctx, path, next }) => {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 h'),
  });

  const { success } = await ratelimit.limit(`${ctx.user?.id}:${path}`);
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Try again in 1 hour.',
    });
  }
  return next();
});

// Apply middleware to protected procedure
export const protectedProcedure = publicProcedure
  .use(loggingMiddleware)
  .use(authMiddleware)
  .use(rateLimitMiddleware);
```

---

## Error Handling

### Custom Error Formatting

```typescript
import { TRPCError, initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    // Format Zod errors
    const zodError = error.cause instanceof ZodError 
      ? error.cause.flatten() 
      : null;

    // Map error codes to HTTP status
    let httpStatus = 500;
    if (error.code === 'BAD_REQUEST') httpStatus = 400;
    if (error.code === 'UNAUTHORIZED') httpStatus = 401;
    if (error.code === 'FORBIDDEN') httpStatus = 403;
    if (error.code === 'NOT_FOUND') httpStatus = 404;

    return {
      ...shape,
      data: {
        ...shape.data,
        httpStatus,
        zodError,
      },
    };
  },
});
```

### Throwing Errors in Procedures

```typescript
export const userRouter = t.router({
  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check ownership
      if (input.id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own account.',
        });
      }

      // Resource not found
      const user = await db.user.findUnique({ where: { id: input.id } });
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }

      // Internal error with cause chain
      try {
        await db.user.delete({ where: { id: input.id } });
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user.',
          cause: err,
        });
      }
    }),
});
```

### Client-Side Error Handling

```typescript
'use client';

import { TRPCClientError } from '@trpc/client';

function DeleteButton() {
  const deleteUser = trpc.user.deleteUser.useMutation({
    onError(error) {
      if (error instanceof TRPCClientError) {
        if (error.data?.code === 'UNAUTHORIZED') {
          redirectToLogin();
        } else if (error.data?.code === 'FORBIDDEN') {
          toast.error('You can only delete your own account.');
        } else {
          toast.error(error.message);
        }
      }
    },
  });

  return (
    <button onClick={() => deleteUser.mutate({ id: userId })}>
      Delete Account
    </button>
  );
}
```

---

## Next.js 15 App Router Integration

### Setup tRPC Client

```typescript
// src/trpc/client.ts
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        // Batch requests for efficiency
        maxURLLength: 2083,
        async headers() {
          return {
            // Add auth token if available
            authorization: `Bearer ${getCookie('token')}`,
          };
        },
      }),
    ],
  });
}
```

### Provider Layout

```typescript
// src/app/layout.tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from '@/trpc/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Avoid immediate refetch on client
          },
        },
      })
  );

  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <html lang="en">
      <body>
        <trpc.Provider client={trpcClient} state={undefined}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      </body>
    </html>
  );
}
```

### Client Component (Hooks)

```typescript
'use client';

import { trpc } from '@/trpc/client';

export function UserProfile() {
  const { data: user, isLoading, error } = trpc.user.getProfile.useQuery();

  const createPost = trpc.post.create.useMutation({
    onSuccess: (newPost) => {
      // Optimistic update pattern
      utils.post.getUserPosts.setData(undefined, (prev) => [
        newPost,
        ...(prev || []),
      ]);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => createPost.mutate({ title: 'New Post' })}>
        Create Post
      </button>
    </div>
  );
}
```

### Server Component (RSC) with Prefetching

```typescript
// src/app/page.tsx
import { HydrateClient, prefetch } from '@/trpc/server';

export default async function Page() {
  // Prefetch in server component (runs on server)
  await prefetch((t) => t.post.getPublicPosts({ limit: 10 }));

  return (
    <HydrateClient>
      <PostsList /> {/* Client component that uses hydrated data */}
    </HydrateClient>
  );
}
```

**RSC Utilities: `src/trpc/server.tsx`**
```typescript
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from './query-client';
import { serverSideCaller } from '@/server/routers/_app';

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export async function prefetch<T extends Promise<any>>(
  cb: (t: typeof serverSideCaller) => T
) {
  await cb(serverSideCaller);
}
```

---

## FormData & File Uploads

### Server Procedure

```typescript
export const uploadRouter = t.router({
  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        filename: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Read file as buffer
      const buffer = await input.file.arrayBuffer();

      // Upload to cloud storage (e.g., S3)
      const url = await uploadToS3({
        buffer,
        filename: `${ctx.user.id}/${input.filename}`,
        mimetype: input.file.type,
      });

      // Update database
      await db.user.update({
        where: { id: ctx.user.id },
        data: { profileImageUrl: url },
      });

      return { url };
    }),
});
```

### Client Upload

```typescript
'use client';

import { trpc } from '@/trpc/client';
import { useState } from 'react';

export function UploadImage() {
  const [file, setFile] = useState<File | null>(null);
  const upload = trpc.upload.uploadProfileImage.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    upload.mutate({
      file,
      filename: file.name,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={upload.isPending}>
        Upload
      </button>
    </form>
  );
}
```

---

## Subscriptions (Server-Sent Events)

```typescript
// Server
export const subscriptionRouter = t.router({
  onPostCreated: publicProcedure.subscription(async function* ({ ctx }) {
    // SSE uses async generators
    const channel = `posts:new`;

    // Emit initial message
    yield { created: new Date() };

    // Subscribe to Redis pub/sub
    const unsubscribe = ctx.redis.subscribe(channel, (message) => {
      yield JSON.parse(message);
    });

    // Cleanup on unsubscribe
    return () => unsubscribe();
  }),
});
```

**Client:**
```typescript
'use client';

export function LiveFeed() {
  const subscription = trpc.subscription.onPostCreated.useSubscription();

  return (
    <div>
      {subscription.data?.created && (
        <div>New post at {subscription.data.created}</div>
      )}
    </div>
  );
}
```

---

## Testing

### Unit Test (Isolated Procedure)

```typescript
// tests/user.test.ts
import { createCaller } from '@/server/routers/_app';

describe('User Router', () => {
  it('should fetch user profile', async () => {
    const ctx = {
      user: { id: 'user-1' },
      db: mockDatabase,
    };

    const caller = createCaller(ctx);

    const result = await caller.user.getProfile();

    expect(result).toEqual({
      id: 'user-1',
      name: 'John Doe',
    });
  });
});
```

### Integration Test (With HTTP)

```typescript
// tests/integration.test.ts
import { fetch } from 'node:fetch';

describe('tRPC HTTP', () => {
  it('should call procedure over HTTP', async () => {
    const response = await fetch('http://localhost:3000/api/trpc/user.getProfile', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-token',
      },
    });

    const data = await response.json();

    expect(data.result.data).toEqual({
      id: 'user-1',
      name: 'John Doe',
    });
  });
});
```

### Component Test (with Mock)

```typescript
// tests/profile.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/trpc/client';
import { UserProfile } from '@/app/profile';

it('should render user profile', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mockClient = {
    user: {
      getProfile: {
        useQuery: () => ({
          data: { id: '1', name: 'John' },
          isLoading: false,
        }),
      },
    },
  };

  render(
    <trpc.Provider client={mockClient as any} state={undefined}>
      <QueryClientProvider client={queryClient}>
        <UserProfile />
      </QueryClientProvider>
    </trpc.Provider>
  );

  expect(screen.getByText('John')).toBeInTheDocument();
});
```

---

## Migration from v10 to v11

### Key Changes

| Feature | v10 | v11 |
|---------|-----|-----|
| React Query | v4 (peer) | v5 (peer) |
| isLoading | Yes | Removed → use isPending |
| Router merging | Plain objects only | Supports lazy() for dynamic loading |
| FormData | experimental_formDataLink | httpLink natively supports FormData |
| Subscriptions | Observable-based | Async generators + SSE |
| RSC support | Basic caller | Full promise hydration support |

### Client Migration

```typescript
// v10
const { isLoading, data } = trpc.user.getProfile.useQuery();

// v11
const { isPending, data } = trpc.user.getProfile.useQuery();
```

### Router Lazy Loading (New)

```typescript
// Reduce cold start from 16s to 2-3s with lazy loading
import { lazy } from '@trpc/server';

export const appRouter = t.router({
  user: lazy(() => import('./routers/user').then(m => m.userRouter)),
  post: lazy(() => import('./routers/post').then(m => m.postRouter)),
  admin: lazy(() => import('./routers/admin').then(m => m.adminRouter)),
});
```

---

## Best Practices

### 1. Organize Routers by Domain
```typescript
// ✅ Good: Domain-driven structure
routers/
  ├── user.ts      (auth, profile)
  ├── post.ts      (create, read, update)
  └── comment.ts   (CRUD)

// ❌ Bad: Mixed concerns
routers/
  ├── queries.ts   (200 procedures mixed)
  └── mutations.ts (300 procedures mixed)
```

### 2. Validate Both Input and Output
```typescript
// ✅ Good: Double validation
.input(z.object({ id: z.string().uuid() }))
.output(z.object({ id: z.string(), name: z.string() }))
.query(...)

// ❌ Bad: Trusting runtime types
.query(async ({ input }) => {
  return db.user.findUnique(...); // May include sensitive fields
})
```

### 3. Use Middleware for Cross-Cutting Concerns
```typescript
// ✅ Good: Reusable middleware
export const apiKeyProtected = publicProcedure.use(apiKeyMiddleware);
export const userProtected = publicProcedure.use(authMiddleware);

// ❌ Bad: Duplicated auth logic in every procedure
.mutation(async ({ ctx }) => {
  if (!ctx.user) throw new Error('...');
  // ... repeated in 50 procedures
})
```

### 4. Lazy Load Large Routers
```typescript
// ✅ Good: Improves cold start
export const appRouter = t.router({
  admin: lazy(() => import('./admin')),
});

// ❌ Bad: All procedures loaded upfront
export const appRouter = t.router({
  admin: adminRouter, // 500KB bundle
});
```

### 5. Type-Safe React Query Options
```typescript
// ✅ Good: Type-safe infinite queries
const { data: pages } = trpc.post.list.useInfiniteQuery(
  { limit: 10 },
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);

// ❌ Bad: Type-unsafe
const query = trpc.post.list.useQuery(); // Missing pagination input
```

---

## Common Errors & Solutions

**Error: `TRPCError is not a function`**
- Verify import: `import { TRPCError } from '@trpc/server'`
- Check you're throwing, not returning: `throw new TRPCError(...)`

**Error: `Cannot find module '@trpc/server/http'`**
- Install: `npm install @trpc/server`
- Verify path: Some utilities like `getHTTPStatusCodeFromError` require this import

**Error: `isLoading is not defined` (React Query v5)**
- Replace `isLoading` → `isPending` in v11
- Replace `isIdle` → removed, use `!data && !isError`

**Error: `Type 'X' is not assignable to type 'Y'` (Output Validation)**
- Ensure database query returns all fields the output schema expects
- Use `.pick()` or `.omit()` to match schema exactly

**Error: `CORS: Request blocked`**
- Add CORS headers in route handler: `res.headers.set('Access-Control-Allow-Origin', '*')`
- Or use `@trpc/server/adapters/fetch` which handles CORS automatically

**Error: `Rate limit exceeded immediately`**
- Check Redis connection: `await redis.ping()`
- Verify rate limit key doesn't collide: Use `${userId}:${path}` format
- Test with higher limit first: `Ratelimit.slidingWindow(1000, '1 h')`

---

## References

- [tRPC Docs](https://trpc.io/docs)
- [tRPC v11 Release](https://trpc.io/blog/announcing-trpc-v11)
- [Migrate v10 → v11](https://trpc.io/docs/migrate-from-v10-to-v11)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Query v5 Docs](https://tanstack.com/query/v5)
- [Zod Validation](https://zod.dev)
- [Using Server Actions with tRPC](https://trpc.io/blog/trpc-actions)
- [Error Handling](https://trpc.io/docs/server/error-handling)
- [RSC Integration](https://trpc.io/docs/client/tanstack-react-query/server-components)
