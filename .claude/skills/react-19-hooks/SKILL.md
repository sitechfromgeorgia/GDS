---
name: react-19-hooks-server-actions
description: Master React 19's new hooks (use, useActionState, useOptimistic, useFormStatus) and patterns for Server Actions in Next.js 15. Covers form submission, optimistic UI, promise unwrapping, and migration from useEffect. Use when building Server-driven forms, implementing optimistic updates, or modernizing from useEffect-based data fetching.
---

# React 19 Hooks & Server Actions Guide

## Quick Start

React 19 introduces a paradigm shift away from `useEffect` + `useState` toward Server Actions and declarative async patterns. Three core hooks power modern form handling:

```typescript
'use client';

import { useActionState, useOptimistic, useFormStatus } from 'react';
import { submitForm } from '@/app/actions';

// Form with error handling and pending state
export function SearchForm() {
  const [state, formAction, isPending] = useActionState(submitForm, {
    results: [],
    error: null,
  });

  return (
    <form action={formAction}>
      <input type="text" name="query" required />
      <button disabled={isPending}>{isPending ? 'Searching...' : 'Search'}</button>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      <ul>
        {state.results.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </form>
  );
}
```

Server action (`app/actions.ts`):
```typescript
'use server';

export async function submitForm(previousState, formData) {
  const query = formData.get('query');
  try {
    const results = await fetch(`/api/search?q=${query}`).then((r) => r.json());
    return { results, error: null };
  } catch (e) {
    return { results: [], error: 'Search failed' };
  }
}
```

---

## The Core 3 Hooks Deep Dive

### 1. `useActionState` (formerly `useFormState`)

Replaces the pattern: `useState` + `useEffect` + form submission handler.

**What it does:**
- Wraps an async action function (Server Action or Client Action)
- Returns `[state, formAction, isPending]`
- `state` = return value from last action invocation
- `formAction` = ready-to-use form action
- `isPending` = true while action is executing

**TypeScript signature:**
```typescript
const [state, formAction, isPending] = useActionState(
  async (previousState, formData: FormData) => {
    // Process form data
    return newState;
  },
  initialState
);
```

**Key differences from old patterns:**

| Old Pattern | New Pattern |
|------------|------------|
| `useState` + manual submission handler | `useActionState` wraps the action |
| `useEffect` watching form state | Action called automatically on form submission |
| Manual error state management | Error returned in state object |
| Separate pending state tracking | Built-in `isPending` flag |
| Client-side validation only | Server validation with automatic retry |

**Complete example:**
```typescript
'use client';

import { useActionState } from 'react';
import { createPost } from '@/app/actions';

export function PostForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      return await createPost(formData);
    },
    {
      success: false,
      message: '',
      postId: null,
      fieldErrors: {},
    }
  );

  return (
    <form action={formAction}>
      <input name="title" required />
      {state.fieldErrors?.title && (
        <span style={{ color: 'red' }}>{state.fieldErrors.title}</span>
      )}
      
      <textarea name="content" required />
      {state.fieldErrors?.content && (
        <span style={{ color: 'red' }}>{state.fieldErrors.content}</span>
      )}
      
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      
      {state.message && (
        <p style={{ color: state.success ? 'green' : 'red' }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

Server action:
```typescript
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title')?.toString() ?? '';
  const content = formData.get('content')?.toString() ?? '';

  // Validation
  const errors = {};
  if (title.length < 3) errors.title = 'Title must be at least 3 chars';
  if (content.length < 10) errors.content = 'Content must be at least 10 chars';
  
  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Validation failed', fieldErrors: errors };
  }

  try {
    const post = await db.posts.create({ title, content });
    return { success: true, message: 'Post created!', postId: post.id };
  } catch (e) {
    return { success: false, message: 'Database error', fieldErrors: {} };
  }
}
```

---

### 2. `useOptimistic` - Instant Feedback UI

Implements "optimistic updates" for Server Actions: show the result immediately while the server processes.

**What it does:**
- Returns `[optimisticState, addOptimistic]`
- `optimisticState` = real state + pending optimistic changes
- `addOptimistic(optimisticValue)` = apply change immediately
- On server success, real state syncs automatically
- On error, reverts to last real state

**Perfect for:**
- Like buttons, favorites (toggle immediately)
- Todo lists (item appears instantly)
- Vote counters

**Example: Like Button with `useOptimistic`**
```typescript
'use client';

import { useActionState, useOptimistic } from 'react';
import { toggleLike } from '@/app/actions';

export function LikeButton({ postId, initialLiked, initialCount }) {
  const [liked, setLiked] = useOptimistic(initialLiked);
  const [count, setCount] = useOptimistic(initialCount);

  const [state, formAction] = useActionState(
    async (prev, formData) => {
      const result = await toggleLike(postId);
      return result;
    },
    null
  );

  const handleLike = () => {
    // Optimistic: apply change immediately
    setLiked(!liked);
    setCount(count + (liked ? -1 : 1));
    
    // Then execute the action
    formAction();
  };

  return (
    <button onClick={handleLike}>
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );
}
```

**Example: Todo List with Optimistic Delete**
```typescript
'use client';

import { useActionState, useOptimistic } from 'react';
import { deleteTodo } from '@/app/actions';

export function TodoList({ initialTodos }) {
  const [todos, setTodos] = useOptimistic(initialTodos);
  const [state, formAction] = useActionState(deleteTodo, null);

  const handleDelete = (id) => {
    // Optimistic: remove immediately
    setTodos((prev) => prev.filter((t) => t.id !== id));
    
    // Server action processes in background
    const formData = new FormData();
    formData.append('id', id);
    formAction(formData);
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

### 3. `useFormStatus` - Deep Tree Status Access

Accesses form submission state without prop drilling.

**What it does:**
- Returns `{ pending, data, method, action }`
- `pending` = true while parent form is submitting
- `data` = FormData from parent form
- Works anywhere inside a `<form>` subtree
- Eliminates prop drilling for submit buttons, spinners

**Example: Nested Submit Button**
```typescript
'use client';

import { useFormStatus } from 'react-dom';

// Deeply nested component, no props needed
export function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '⏳ Submitting...' : 'Submit'}
    </button>
  );
}

// Usage in parent form
export function MyForm() {
  return (
    <form action={submitAction}>
      <input name="email" type="email" />
      
      <div className="nested">
        <div className="deeply-nested">
          <SubmitButton /> {/* No props! */}
        </div>
      </div>
    </form>
  );
}
```

**Example: Loading Spinner in Nested Component**
```typescript
'use client';

import { useFormStatus } from 'react-dom';

export function FormSpinner() {
  const { pending } = useFormStatus();
  
  if (!pending) return null;
  
  return <div className="spinner">Loading...</div>;
}

export function ComplexForm() {
  return (
    <form action={complexAction}>
      <input name="search" />
      
      {/* Spinner appears automatically when form submits */}
      <FormSpinner />
      
      <button type="submit">Search</button>
    </form>
  );
}
```

---

## The `use()` API: Promise Unwrapping

`use()` is the new declarative way to handle promises in Client Components (replacing `useEffect` + `useState`).

### Pattern 1: Server Component Creates Promise, Client Component `use()`s It

```typescript
// app/page.tsx (Server Component)
import { Suspense } from 'react';
import { MessageDisplay } from './MessageDisplay';

async function fetchMessage() {
  const res = await fetch('/api/message');
  return res.json();
}

export default function Page() {
  const messagePromise = fetchMessage();

  return (
    <Suspense fallback={<p>Loading message...</p>}>
      <MessageDisplay messagePromise={messagePromise} />
    </Suspense>
  );
}
```

```typescript
// app/MessageDisplay.tsx (Client Component)
'use client';

import { use } from 'react';

export function MessageDisplay({ messagePromise }) {
  // use() unwraps the promise declaratively
  const message = use(messagePromise);
  
  return <p>{message.content}</p>;
}
```

### Pattern 2: Streaming Data into Client Components

Use this for real-time, incremental data delivery:

```typescript
// app/page.tsx (Server Component)
async function* generateItems() {
  for (let i = 0; i < 100; i++) {
    yield { id: i, name: `Item ${i}` };
    await new Promise((r) => setTimeout(r, 100));
  }
}

export default function Page() {
  const itemsPromise = (async () => {
    const items = [];
    for await (const item of generateItems()) {
      items.push(item);
    }
    return items;
  })();

  return (
    <Suspense fallback={<p>Loading items...</p>}>
      <ItemList itemsPromise={itemsPromise} />
    </Suspense>
  );
}
```

```typescript
// app/ItemList.tsx
'use client';

import { use } from 'react';

export function ItemList({ itemsPromise }) {
  const items = use(itemsPromise);
  
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Pattern 3: Conditional Context with `use()`

```typescript
'use client';

import { createContext, use } from 'react';

const UserContext = createContext(null);

export function useUser() {
  // use(Context) works just like useContext()
  // but more flexible in suspense scenarios
  return use(UserContext);
}
```

---

## Transitions & Performance

### `useTransition` for Non-Blocking Updates

When you have expensive renders (e.g., filtering a 10k-item list), use `useTransition` to keep the UI responsive:

```typescript
'use client';

import { useTransition, useState } from 'react';

export function SearchableList({ items }) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    
    // Mark the expensive filter update as non-blocking
    startTransition(() => {
      setSearch(value);
    });
  };

  return (
    <div>
      <input
        type="text"
        onChange={handleSearch}
        placeholder="Search..."
      />
      {isPending && <p>Filtering...</p>}
      
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Key insight:** Typing stays responsive even as list updates lag behind.

### React Compiler: Forget `useMemo` / `useCallback`

**Before React 19 (defensive memoization):**
```typescript
function Products({ items, onSelect }) {
  // Manually memoize to prevent re-renders
  const stableOnSelect = useCallback((id) => onSelect(id), [onSelect]);
  const count = useMemo(() => items.length, [items]);

  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} onClick={() => stableOnSelect(it.id)}>
          {it.name} ({count})
        </li>
      ))}
    </ul>
  );
}
```

**After React 19 with Compiler (automatic memoization):**
```typescript
// Same code, but compiler auto-memoizes
function Products({ items, onSelect }) {
  const handleSelect = (id) => onSelect(id);
  const count = items.length;

  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} onClick={() => handleSelect(it.id)}>
          {it.name} ({count})
        </li>
      ))}
    </ul>
  );
}
```

**Enable React Compiler in `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

module.exports = nextConfig;
```

**When to STILL use `useMemo`/`useCallback`:**
- Third-party libraries requiring stable references (rare)
- Extreme performance bottlenecks (profile first!)
- **Estimated: 95% of existing uses can be deleted**

---

## Migration Guide: Old → New Patterns

### Before: useEffect + useState Data Fetching

```typescript
'use client';

import { useEffect, useState } from 'react';

export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!ignore) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true; // Prevent state update on unmount
    };
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <p>{user.name}</p>;
}
```

### After: use() API + Suspense

```typescript
// Server Component - data fetching
async function UserProfile({ userId }) {
  const userPromise = fetch(`/api/users/${userId}`).then((r) => r.json());

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserContent userPromise={userPromise} />
    </Suspense>
  );
}

// Client Component - declarative rendering
'use client';

import { use } from 'react';

export function UserContent({ userPromise }) {
  const user = use(userPromise);
  return <p>{user.name}</p>;
}
```

**Benefits:**
- No `useEffect` imperative loops
- No race condition guard (`ignore`)
- Cleaner, more declarative code
- Error handling via Suspense boundaries

---

## Server Actions: The Backbone

Server Actions are async functions marked with `'use server'`. They replace fetch/API routes for mutations.

### Basic Server Action

```typescript
// app/actions.ts
'use server';

import { db } from '@/db';

export async function updateUser(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');

  // Runs on server only
  const user = await db.users.update({ name, email });

  return { success: true, user };
}
```

### Binding Extra Arguments

Use `.bind()` to pass non-form data:

```typescript
'use client';

import { useActionState } from 'react';
import { updateUserWithId } from '@/app/actions';

export function EditUserForm({ userId, initialName }) {
  // Bind userId to the action
  const [state, formAction] = useActionState(
    updateUserWithId.bind(null, userId),
    { success: false }
  );

  return (
    <form action={formAction}>
      <input name="name" defaultValue={initialName} />
      <button type="submit">Update</button>
      {state.success && <p>Updated!</p>}
    </form>
  );
}
```

Server action receives `userId` as first param:

```typescript
'use server';

export async function updateUserWithId(userId: string, formData: FormData) {
  const name = formData.get('name');
  await db.users.update(userId, { name });
  return { success: true };
}
```

---

## Complete Form Example: Search with Validation

```typescript
// app/page.tsx
import { SearchForm } from '@/components/SearchForm';

export default function Home() {
  return (
    <main>
      <h1>Search Products</h1>
      <SearchForm />
    </main>
  );
}
```

```typescript
// app/components/SearchForm.tsx
'use client';

import { useActionState } from 'react';
import { searchProducts } from '@/app/actions';
import { SubmitButton } from './SubmitButton';

export function SearchForm() {
  const [state, formAction, isPending] = useActionState(
    searchProducts,
    {
      results: [],
      query: '',
      error: null,
      timestamp: null,
    }
  );

  return (
    <div>
      <form action={formAction}>
        <input
          type="search"
          name="query"
          placeholder="Search products..."
          defaultValue={state.query}
        />
        <SubmitButton />
      </form>

      {state.error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          {state.error}
        </div>
      )}

      {state.results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Results ({state.results.length})</h2>
          <ul>
            {state.results.map((product) => (
              <li key={product.id}>
                <strong>{product.name}</strong> - ${product.price}
              </li>
            ))}
          </ul>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Searched at {new Date(state.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
```

```typescript
// app/components/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '⏳ Searching...' : '🔍 Search'}
    </button>
  );
}
```

```typescript
// app/actions.ts
'use server';

export async function searchProducts(prevState, formData: FormData) {
  const query = formData.get('query')?.toString() ?? '';

  // Validation
  if (!query.trim()) {
    return {
      ...prevState,
      error: 'Please enter a search term',
      query,
      results: [],
    };
  }

  if (query.length < 2) {
    return {
      ...prevState,
      error: 'Search term must be at least 2 characters',
      query,
      results: [],
    };
  }

  try {
    // Simulate API call
    const results = await fetch(
      `/api/products/search?q=${encodeURIComponent(query)}`
    ).then((r) => r.json());

    return {
      results,
      query,
      error: null,
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return {
      results: [],
      query,
      error: 'Failed to search. Please try again.',
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## Common Errors & Solutions

### "Why is my Optimistic UI flickering?"

**Problem:** Optimistic update flickers when server response arrives.

**Cause:** State reverts too quickly, re-renders visually.

**Solution:** Ensure server action is fast + use `revalidatePath` for coherent state:

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function toggleLike(postId: string) {
  await db.likes.toggle(postId);
  
  // Revalidate so client gets fresh data in one go
  revalidatePath(`/posts/${postId}`);
  
  return { success: true };
}
```

### "use() suspended, but no Suspense boundary"

**Error:** `use(promise)` called outside Suspense.

**Fix:** Wrap the component using `use()` with a Suspense boundary:

```typescript
// ✅ Correct
<Suspense fallback={<Spinner />}>
  <ComponentUsingUse promise={dataPromise} />
</Suspense>

// ❌ Wrong
<ComponentUsingUse promise={dataPromise} />
```

### "Promise is not stable" error

**Problem:** `use()` warning about unstable promises passed every render.

**Cause:** Promise created in render, not memoized.

**Solution:** Create promise once, pass as prop:

```typescript
// ✅ Correct - promise created once in Server Component
export default function Page() {
  const userPromise = fetchUser(); // Created once
  return <UserProfile userPromise={userPromise} />;
}

// ❌ Wrong - promise created every render
'use client';
export function UserProfile() {
  const userPromise = fetchUser(); // Created every render!
  const user = use(userPromise);
}
```

### "useFormStatus returns undefined in Client Component"

**Problem:** `useFormStatus` only works inside forms.

**Fix:** Ensure component is child of `<form action={action}>`:

```typescript
// ✅ Works - inside form
<form action={action}>
  <input />
  <SubmitButton /> {/* useFormStatus works here */}
</form>

// ❌ Doesn't work - outside form
<SubmitButton /> {/* useFormStatus returns empty object */}
<form action={action}>...</form>
```

---

## Best Practices

### 1. Always Enable React Compiler

Automatic memoization is free performance. Enable it in `next.config.js`:

```javascript
experimental: { reactCompiler: true }
```

### 2. Use Server Actions by Default

- Easier to reason about security (code runs on server)
- No API route boilerplate
- Automatic type safety with TypeScript

```typescript
// Prefer this
'use server';
export async function createPost(formData: FormData) { ... }

// Over manual API routes in most cases
```

### 3. Validate on Both Client and Server

Client validation = UX. Server validation = security.

```typescript
'use client';

import { useActionState } from 'react';

export function Form() {
  const [state, formAction] = useActionState(submitAction, null);

  // Client validation
  const handleSubmit = (e) => {
    if (!e.target.email.value.includes('@')) {
      alert('Invalid email');
      e.preventDefault();
    }
  };

  return <form action={formAction} onSubmit={handleSubmit}>...</form>;
}
```

```typescript
'use server';

export async function submitAction(formData: FormData) {
  const email = formData.get('email');

  // Server validation (can't be bypassed)
  if (!email || !email.toString().includes('@')) {
    return { error: 'Invalid email' };
  }
  // ...
}
```

### 4. Combine `useActionState` + `useOptimistic` for Instant Feedback + Error Recovery

```typescript
'use client';

import { useActionState, useOptimistic } from 'react';
import { deleteTodo } from '@/app/actions';

export function TodoItem({ todo }) {
  const [optimistic, setOptimistic] = useOptimistic(todo);
  const [state, formAction] = useActionState(deleteTodo, null);

  const handleDelete = () => {
    // Show deleted instantly
    setOptimistic(null);
    
    // If server fails, UI reverts automatically
    const formData = new FormData();
    formData.append('id', todo.id);
    formAction(formData);
  };

  if (!optimistic) return null;

  return (
    <li>
      {optimistic.text}
      <button onClick={handleDelete}>Delete</button>
    </li>
  );
}
```

### 5. Use `Suspense` for Streaming Data, Not Loading States

```typescript
// ✅ Good - Suspense + use()
<Suspense fallback={<Spinner />}>
  <UserProfile userPromise={userPromise} />
</Suspense>

// ❌ Avoid - manual loading state with use()
const user = use(userPromise);
if (!user) return <Spinner />; // use() already suspends
```

---

## New vs Old Comparison Table

| Feature | React 18 | React 19 |
|---------|----------|---------|
| **Data Fetching** | `useEffect` + `useState` | `use(promise)` + `Suspense` |
| **Form Submission** | `useState` + manual handler | `useActionState` |
| **Pending State** | Manual `useState` | Built-in `isPending` |
| **Optimistic UI** | Libraries (SWR, React Query) | `useOptimistic` |
| **Form Status Access** | Prop drilling | `useFormStatus` |
| **Context Usage** | `useContext` | `use(Context)` (more flexible) |
| **Memoization** | Manual `useMemo`/`useCallback` | React Compiler auto-memoizes |
| **Non-Blocking Updates** | `useTransition` (same) | `useTransition` (same) |

---

## References

- [React 19 Hooks Docs](https://react.dev/reference/react)
- [use() API Reference](https://react.dev/reference/react/use)
- [useActionState Reference](https://react.dev/reference/react/useActionState)
- [useOptimistic Reference](https://react.dev/reference/react/useOptimistic)
- [useFormStatus Reference](https://react.dev/reference/react-dom/useFormStatus)
- [Next.js Server Actions Guide](https://nextjs.org/docs/app/guides/forms)
- [React Compiler Docs](https://react.dev/learn/react-compiler)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/upgrading)
