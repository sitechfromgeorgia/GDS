---
name: error-handling-patterns-nextjs
description: Implements production-grade error handling for full-stack TypeScript/JavaScript applications with Next.js 15, React 19, and Node.js backends. Covers global error architecture, Server Components/Actions, Error Boundaries with Suspense, RFC 7807 API errors, type-safe Result patterns, observability integration with Sentry/OpenTelemetry, and testing strategies. Use when building robust web apps, setting up error infrastructure, handling async errors, validating data with Zod, or implementing logging/monitoring systems.
---

# Error Handling Patterns in Modern Web Applications

## Quick Start

Three-layer error handling foundation (client, server, API):

**1. Global Error Boundaries (React 19)**
```typescript
// app/error.tsx - Client Component
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
    // Log to observability service
    console.error('Error logged:', error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**2. Server Action Error Handling with useActionState**
```typescript
// lib/actions.ts - Server Action
'use server';

import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

export async function createUser(
  prevState: { error?: string } | null,
  formData: FormData
) {
  try {
    const data = Object.fromEntries(formData);
    const parsed = UserSchema.parse(data);
    
    // Database operation
    await db.users.create(parsed);
    return { error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: 'Failed to create user' };
  }
}
```

```typescript
// app/create-user.tsx - Client Component
'use client';

import { useActionState } from 'react';
import { createUser } from '@/lib/actions';

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    { error: null }
  );

  return (
    <form action={formAction}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create User'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

**3. Standardized API Error Response (RFC 7807)**
```typescript
// lib/api-error.ts
export interface ProblemDetail {
  type: string; // Error type URI
  title: string; // Short description
  status: number; // HTTP status
  detail: string; // Specific instance detail
  instance?: string; // Resource URI that had error
  extensions?: Record<string, unknown>; // Custom fields
}

export function createProblemDetail(
  status: number,
  title: string,
  detail: string,
  extensions?: Record<string, unknown>
): ProblemDetail {
  return {
    type: `https://api.example.com/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    instance: undefined,
    extensions,
  };
}
```

```typescript
// app/api/users/route.ts
import { createProblemDetail } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = UserSchema.parse(body);
    
    const user = await db.users.create(validated);
    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const problemDetail = createProblemDetail(
        400,
        'Validation Error',
        'Request body validation failed',
        {
          'invalid-params': error.issues.map(issue => ({
            name: issue.path.join('.'),
            reason: issue.message,
          })),
        }
      );
      return Response.json(problemDetail, {
        status: 400,
        headers: { 'content-type': 'application/problem+json' },
      });
    }
    
    const problemDetail = createProblemDetail(
      500,
      'Internal Server Error',
      'An unexpected error occurred'
    );
    return Response.json(problemDetail, {
      status: 500,
      headers: { 'content-type': 'application/problem+json' },
    });
  }
}
```

## When to Use This Skill

- Building Next.js 15+ applications with full-stack TypeScript
- Handling Server Actions and form submissions (React 19)
- Setting up global error boundaries and nested error UI
- Validating external data (API requests, form inputs, databases)
- Integrating error logging with Sentry or OpenTelemetry
- Implementing type-safe error handling with Result patterns
- Testing error paths and edge cases
- Building APIs with standardized error responses
- Handling async/await errors in middleware, server components, or data fetching

## Architecture Overview

### Error Flow Diagram (Conceptual)

```
Client Request
    ↓
Middleware (next/middleware.ts) - Catch auth/redirect errors
    ↓
Server Component / Server Action (lib/actions.ts) - try/catch, return Result
    ↓
Database / External API - Handle connection/validation errors
    ↓
Response Error → Error Boundary (app/error.tsx) - UI fallback
           ↓
Client Error Monitoring - Sentry capture & structured logging
```

**Key Principle**: Errors propagate UP to nearest boundary (Error Boundary, error.tsx), but should be HANDLED at source (Server Actions, API routes).

---

## Next.js 15 Error Handling System

### File Convention Hierarchy

| File | Scope | When It Catches |
|------|-------|-----------------|
| `app/error.tsx` | Route segment + nested children | Client/Server errors in routes below it |
| `app/not-found.tsx` | Route segment + nested children | 404 from `notFound()` function |
| `app/global-error.tsx` | Root layout + entire app | Uncaught errors in root layout (must include `<html>`, `<body>`) |
| Middleware errors | Before route resolution | 401/403/redirects during auth checks |

### Nested Error Boundaries

Errors bubble UP to nearest boundary. Layout files can't catch their own segment's errors:

```
app/
├── layout.tsx          (Root layout)
├── global-error.tsx    (Catches uncaught errors)
├── error.tsx           (Catches errors in page.tsx + children)
├── page.tsx
└── dashboard/
    ├── layout.tsx      (Can't catch errors from dashboard/page.tsx)
    ├── error.tsx       (Catches dashboard/* errors)
    └── page.tsx
```

**Error path for `dashboard/page.tsx` error:**
1. `dashboard/error.tsx` catches it
2. If no dashboard/error.tsx, goes to `app/error.tsx`
3. If neither exists, shows Next.js default error page

### Server Component Error Handling

```typescript
// app/dashboard/posts/page.tsx - Server Component
import { getPosts } from '@/lib/db';

export default async function PostsPage() {
  // Errors throw naturally, caught by error.tsx
  const posts = await getPosts();
  
  return <PostsList posts={posts} />;
}
```

In production, error details are scrubbed (empty string). To debug, check server logs or use Sentry.

### Server Actions with Error Returns

**Modern pattern (React 19)**: Return errors, don't throw.

```typescript
// lib/actions.ts
'use server';

// Type-safe error return
export async function deletePost(postId: string) {
  try {
    await db.posts.delete(postId);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: 'Post not found' };
    }
    return { success: false, error: 'Failed to delete post' };
  }
}
```

```typescript
// app/post-actions.tsx - Client Component
'use client';

import { useActionState } from 'react';

export function DeletePostButton({ postId }: { postId: string }) {
  const [state, deleteAction, isPending] = useActionState(
    async () => deletePost(postId),
    null
  );

  return (
    <>
      <button onClick={() => deleteAction()} disabled={isPending}>
        Delete
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </>
  );
}
```

### Middleware Error Handling

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get('auth')?.value;
    
    if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // Log error but don't crash middleware
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## React 19 & Error Boundaries with Suspense

### Error Boundary + Suspense Pattern

**Key**: Error Boundaries catch errors; Suspense handles loading.

```typescript
'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="error-card">
      <h2>Error loading data</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Retry</button>
    </div>
  );
}

export function UserProfilePage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Concurrent Rendering & Multiple Suspense Boundaries

React 19 allows nested Suspense boundaries to load independently:

```typescript
export function DashboardPage() {
  return (
    <div>
      <ErrorBoundary FallbackComponent={SidebarError}>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={MainError}>
        <Suspense fallback={<MainSkeleton />}>
          <MainContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

Each section loads independently. If Sidebar fails, MainContent still renders.

### Handling Rejected Promises in Suspense

Use `use()` hook with Error Boundaries:

```typescript
'use client';

import { use, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

function UserContent({ userPromise }: { userPromise: Promise<User> }) {
  // use() unwraps promise; if rejected, Error Boundary catches it
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

export function UserProfile({ userId }: { userId: string }) {
  const userPromise = fetchUser(userId);

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div>
          <p>Failed to load user: {error.message}</p>
          <button onClick={resetErrorBoundary}>Retry</button>
        </div>
      )}
    >
      <Suspense fallback={<p>Loading user...</p>}>
        <UserContent userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## Type-Safe Error Handling: Result Pattern

### Why Result Pattern?

TypeScript throws don't guarantee handling. Results are explicit in types.

```typescript
// ❌ Bad: Error might not be caught
async function getUser(id: string) {
  if (!id) throw new Error('Invalid ID'); // Might be unhandled
  return db.users.findById(id);
}

// ✅ Good: Errors explicit in type
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

async function getUser(id: string): Promise<Result<User, string>> {
  if (!id) return { ok: false, error: 'Invalid ID' };
  try {
    const user = await db.users.findById(id);
    return { ok: true, data: user };
  } catch {
    return { ok: false, error: 'Database error' };
  }
}
```

### Using neverthrow Library

```typescript
import { ok, err, Result } from 'neverthrow';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

// Function returns Result, not throwing
export function getUserResult(id: string): Result<User, ValidationError | NotFoundError> {
  if (!id) return err(new ValidationError('User ID required'));
  
  const user = db.users.findById(id);
  if (!user) return err(new NotFoundError('User'));
  
  return ok(user);
}

// Usage: Must handle both cases
const result = getUserResult('123');

if (result.isOk()) {
  console.log('User:', result.value);
} else {
  console.error('Error:', result.error.message);
}

// Or using match
result.match(
  (user) => console.log('User:', user),
  (error) => console.error('Error:', error.message)
);
```

### Combining Results with map/andThen

```typescript
export function processUserData(id: string): Result<ProcessedUser, Error> {
  return getUserResult(id)
    .andThen((user) => validateUserAge(user)) // Chain another Result
    .map((user) => transformUserData(user));  // Transform on success
}

// If either step fails, error is propagated
```

---

## Data Validation with Zod

### Basic Schema Validation

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']),
});

type User = z.infer<typeof UserSchema>; // Inferred type

// Parsing with safeParse (doesn't throw)
const result = UserSchema.safeParse(data);

if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.error(`${issue.path.join('.')}: ${issue.message}`);
  });
} else {
  console.log('Valid user:', result.data);
}
```

### Custom Error Messages

```typescript
const LoginSchema = z.object({
  email: z.string().email('Enter valid email'),
  password: z
    .string()
    .min(8, 'Password must be 8+ characters')
    .regex(/[A-Z]/, 'Must include uppercase letter'),
});

// Error output
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "too_small",
        "minimum": 8,
        "type": "string",
        "path": ["password"],
        "message": "Password must be 8+ characters"
      }
    ]
  }
}
```

### Nested & Discriminated Schemas

```typescript
const PetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dog'),
    breed: z.enum(['labrador', 'poodle']),
  }),
  z.object({
    type: z.literal('cat'),
    color: z.enum(['black', 'white', 'orange']),
  }),
]);

// Type-safe: TypeScript knows which fields exist per type
const myPet: z.infer<typeof PetSchema> = {
  type: 'dog',
  breed: 'labrador', // ✅ Valid for dogs only
};
```

### Transforming During Validation

```typescript
const DateSchema = z
  .string()
  .pipe(z.coerce.date()) // Convert string to Date
  .pipe(
    z.date().refine(
      (date) => date > new Date(),
      'Date must be in the future'
    )
  );

const result = DateSchema.safeParse('2025-12-31');
// Returns: { success: true, data: Date(2025-12-31) }
```

---

## API Error Handling: RFC 7807 Problem Details

### Complete API Error Response Handler

```typescript
// lib/api-errors.ts
import { z } from 'zod';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  extensions?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    detail?: string,
    public extensions?: Record<string, unknown>
  ) {
    super(detail || title);
    this.name = 'ApiError';
  }

  toProblemDetail(instance?: string): ProblemDetail {
    return {
      type: `https://api.example.com/errors/${this.title.toLowerCase().replace(/\s/g, '-')}`,
      title: this.title,
      status: this.status,
      detail: this.message,
      instance,
      extensions: this.extensions,
    };
  }
}

export class ValidationError extends ApiError {
  constructor(
    detail: string,
    public issues: Array<{ path: string; message: string }>
  ) {
    super(400, 'Validation Error', detail, { 'invalid-params': issues });
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'Not Found', `${resource} not found`);
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'Unauthorized', 'Authentication required');
  }
}

export class ForbiddenError extends ApiError {
  constructor(resource?: string) {
    super(403, 'Forbidden', `Access denied${resource ? ` to ${resource}` : ''}`);
  }
}
```

### API Route with Error Handling

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserSchema } from '@/lib/schemas';
import {
  ValidationError,
  NotFoundError,
  ApiError,
} from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UserSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError('Request validation failed', issues);
    }

    const user = await db.users.create(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const problemDetail = error.toProblemDetail(req.nextUrl.pathname);
      return NextResponse.json(problemDetail, {
        status: error.status,
        headers: { 'content-type': 'application/problem+json' },
      });
    }

    console.error('Unhandled error:', error);
    const unknownError = new ApiError(
      500,
      'Internal Server Error',
      'An unexpected error occurred'
    );
    return NextResponse.json(unknownError.toProblemDetail(), {
      status: 500,
      headers: { 'content-type': 'application/problem+json' },
    });
  }
}
```

### Client-Side API Error Handling with TanStack Query

```typescript
// lib/api-client.ts
import { useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) return false;
        // Retry server errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) {
    const problemDetail = await res.json();
    const error = new Error(problemDetail.detail);
    Object.assign(error, problemDetail);
    throw error;
  }
  return res.json();
}

// Usage in component
export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) {
    const err = error as any;
    return (
      <div className="error">
        <h3>{err.title}</h3>
        <p>{err.detail}</p>
      </div>
    );
  }

  return <div>{data.name}</div>;
}
```

---

## Observability & Monitoring

### Sentry Integration (Next.js 15)

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true, // Redact PII
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    // Filter sensitive errors
    if (event.exception?.values?.[0]?.value?.includes('database password')) {
      return null; // Don't send
    }
    return event;
  },
});
```

### Structured Logging with Context

```typescript
// lib/logger.ts
import * as Sentry from '@sentry/nextjs';

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: any;
}

export function logError(message: string, error: Error, context?: LogContext) {
  Sentry.captureException(error, {
    tags: {
      component: context?.endpoint,
    },
    contexts: {
      custom: context,
    },
  });
  console.error(`[ERROR] ${message}:`, error.message, context);
}

export function logWarn(message: string, context?: LogContext) {
  console.warn(`[WARN] ${message}:`, context);
}

export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}:`, context);
}
```

### Server Action Error Logging

```typescript
'use server';

import { logError } from '@/lib/logger';
import { headers } from 'next/headers';

export async function createPost(formData: FormData) {
  const requestId = headers().get('x-request-id') || 'unknown';
  
  try {
    const title = formData.get('title') as string;
    const post = await db.posts.create({ title });
    return { post, error: null };
  } catch (error) {
    logError('Failed to create post', error as Error, {
      requestId,
      endpoint: '/api/posts',
      formDataKeys: Array.from(formData.keys()),
    });
    return { post: null, error: 'Failed to create post' };
  }
}
```

---

## Testing Error Scenarios

### Testing Error Boundaries (Jest + React Testing Library)

```typescript
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/app/error';
import { userEvent } from '@testing-library/user-event';

describe('Error Boundary', () => {
  it('should display error message', () => {
    const error = new Error('Test error');
    const resetMock = jest.fn();

    render(
      <ErrorBoundary error={error} reset={resetMock} />
    );

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should call reset when trying again', async () => {
    const error = new Error('Test error');
    const resetMock = jest.fn();

    render(
      <ErrorBoundary error={error} reset={resetMock} />
    );

    await userEvent.click(screen.getByText('Try again'));
    expect(resetMock).toHaveBeenCalled();
  });
});
```

### Testing Server Actions (Jest)

```typescript
import { createUser } from '@/lib/actions';

describe('Server Actions', () => {
  it('should return error for invalid email', async () => {
    const formData = new FormData();
    formData.append('name', 'John');
    formData.append('email', 'invalid');

    const result = await createUser(null, formData);

    expect(result.error).toBe('Invalid email');
    expect(result.success).toBe(false);
  });

  it('should create user successfully', async () => {
    const formData = new FormData();
    formData.append('name', 'John');
    formData.append('email', 'john@example.com');

    const result = await createUser(null, formData);

    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
  });

  it('should handle database errors', async () => {
    jest.spyOn(db.users, 'create').mockRejectedValue(
      new Error('Connection failed')
    );

    const formData = new FormData();
    formData.append('name', 'John');
    formData.append('email', 'john@example.com');

    const result = await createUser(null, formData);

    expect(result.error).toBe('Failed to create user');
  });
});
```

### Testing API Errors

```typescript
import { POST } from '@/app/api/users/route';

describe('POST /api/users', () => {
  it('should return 400 for validation error', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: '' }), // Invalid
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.title).toBe('Validation Error');
    expect(data.extensions['invalid-params']).toBeDefined();
  });

  it('should return 201 for valid user', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John',
        email: 'john@example.com',
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
  });
});
```

---

## Common Errors & Solutions

### "Error objects cannot be serialized" in Server Actions

**Problem**: Returning Error object from Server Action throws.

**Solution**: Extract error message as string:
```typescript
try {
  // ...
} catch (error) {
  return {
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### "Unhandled error" in production but works in development

**Problem**: Error details are scrubbed in production for security.

**Solution**: Log to Sentry/observability service before error is handled:
```typescript
try {
  // ...
} catch (error) {
  Sentry.captureException(error); // Logs before returning generic message
  return { error: 'Something went wrong' };
}
```

### Multiple Suspense boundaries not loading independently

**Problem**: React 18 sibling components suspend sequentially (waterfall).

**Solution**: React 19 fixed this. Use separate `<Suspense>` boundaries with independent `fallback` UIs.

### Error Boundary not catching Server Component errors

**Problem**: `error.tsx` doesn't catch errors in same-level layout.

**Solution**: Layout errors need `global-error.tsx` or errors must bubble from nested route:
```
// This won't work:
app/layout.tsx (has error)
app/error.tsx (won't catch layout errors)

// Use:
app/global-error.tsx (catches root/layout errors)
```

### Zod errors not user-friendly

**Problem**: Zod messages like "Expected string, received number" are technical.

**Solution**: Map errors to user-friendly messages:
```typescript
const friendlyMessage = {
  invalid_type: 'Please enter a valid value',
  too_small: 'Value too short',
  too_big: 'Value too long',
};

const message = friendlyMessage[issue.code] || issue.message;
```

### Sentry not capturing async errors in Server Components

**Problem**: Errors in `async` Server Components not sent to Sentry.

**Solution**: Wrap in try/catch or use error boundary. Server Components don't automatically report to Sentry unless instrumented.

---

## Best Practices

1. **Error Boundaries at Segment Boundaries**: Place `error.tsx` at meaningful feature boundaries, not just at top level.

2. **Return Errors from Server Actions**: Don't throw; return `{ error: string }` for expected errors. Only throw for truly unexpected failures.

3. **Validate Early & Continuously**: Validate at API boundary (Zod), database boundaries, and rendering (optional props).

4. **Use RFC 7807 for APIs**: Standardized error format makes client integration predictable and testable.

5. **Log Context, Not Just Messages**: Include `userId`, `requestId`, `endpoint` in logs for debugging.

6. **Retry Intelligently**: Don't retry 4xx errors. Use exponential backoff (1s, 2s, 4s, ..., max 30s).

7. **Sanitize Error Messages**: Never expose stack traces or internal paths to clients. Use Sentry for full details.

8. **Test Error Paths**: Unit test error cases as thoroughly as happy paths. 20% of code often causes 80% of errors.

---

## References

- [Next.js Error Handling Docs](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundary Reference](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React 19 Suspense Deep Dive](https://dev.to/a1guy/react-19-suspense-deep-dive)
- [neverthrow GitHub](https://github.com/supermacro/neverthrow)
- [Zod Documentation](https://zod.dev/)
- [RFC 7807: Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [TanStack Query Retry Strategies](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)
- [TypeScript Error Handling Best Practices](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)