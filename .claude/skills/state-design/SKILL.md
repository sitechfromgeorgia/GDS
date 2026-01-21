---
name: designing-ui-states-react-19-shadcn
description: Guides implementing the four states of UI (Ideal, Loading, Empty, Error) using React 19 hooks, shadcn/ui components, and accessibility best practices. Use when building professional application interfaces, handling async operations with optimistic updates, or improving perceived performance with skeleton screens.
---

# Designing UI States with React 19 & shadcn/ui

## Quick Start

The **four states of UI** separate user experience into distinct, well-designed screens:

```typescript
// State Matrix Template
type UIState = 'ideal' | 'loading' | 'empty' | 'error';

// ✅ IDEAL: Data loaded successfully
<DataDisplay items={items} />

// ⏳ LOADING: Fetching data
<Skeleton className="w-full h-10" />

// 📭 EMPTY: No data to display
<EmptyState 
  title="No items yet"
  action="Create first item"
/>

// ⚠️ ERROR: Request failed
<ErrorState 
  message="Failed to load items"
  onRetry={handleRetry}
/>
```

## When to Use This Skill

- **Building forms with server actions** and need visual feedback
- **Rendering lists/tables** that load asynchronously
- **Designing first-use experiences** without sample data
- **Handling failed API calls** with recovery paths
- **Improving perceived performance** with skeleton screens
- **Ensuring accessibility** for screen reader users
- **Creating fast-feeling UIs** with optimistic updates

## 1. Loading States (Suspense & Streaming)

### useTransition for Pending States

React 19's `useTransition` hook replaces manual `isLoading` state. It provides `isPending` without unmounting components:

```typescript
'use client';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function DataFetcher() {
  const [data, setData] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleFetch = () => {
    startTransition(async () => {
      const res = await fetch('/api/items');
      const json = await res.json();
      setData(json);
    });
  };

  return (
    <div>
      <Button onClick={handleFetch} disabled={isPending}>
        {isPending ? 'Loading...' : 'Fetch Data'}
      </Button>

      {isPending && <Skeleton className="w-full h-10 mt-4" />}
      {data && <div>{data.name}</div>}
    </div>
  );
}
```

**Why `useTransition` over manual state:**
- Transitions don't cause component unmounting
- Preserves focus and form state during loading
- Prevents layout shift when showing skeletons
- Works with Server Components and Suspense

### Skeleton Screens with shadcn/ui

Use shadcn/ui's `Skeleton` component for perceived performance improvement:

```typescript
'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ItemCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-3">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-5/6 h-10" />
          <Skeleton className="w-4/5 h-10" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="flex-1 h-10 rounded" />
          <Skeleton className="flex-1 h-10 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Skeleton vs. Pulsating CSS:**
- ✅ Use `<Skeleton>` for layout preservation
- ✅ Apply Tailwind's `animate-pulse` for shimmer effect
- ❌ Don't use spinners for page-level loading (causes anxiety)

### useOptimistic for Instant UI Updates

React 19's `useOptimistic` creates fast-feeling UIs by showing changes immediately:

```typescript
'use client';
import { useOptimistic, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function TodoItem({ 
  id, 
  text, 
  completed,
  onToggle 
}: TodoItemProps) {
  const [optimisticState, setOptimistic] = useOptimistic(
    { id, text, completed },
    (state, newCompleted) => ({
      ...state,
      completed: newCompleted
    })
  );

  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newState = !optimisticState.completed;
    // Update UI immediately
    setOptimistic(newState);
    
    // Then sync with server
    startTransition(async () => {
      await onToggle(id, newState);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={optimisticState.completed}
        onChange={handleToggle}
        disabled={isPending}
      />
      <span className={optimisticState.completed ? 'line-through' : ''}>
        {text}
      </span>
      {isPending && <span className="text-xs text-muted-foreground">Saving...</span>}
    </div>
  );
}
```

**When to use `useOptimistic`:**
- ✅ Form submissions (enable instant feedback)
- ✅ Toggle states (checkbox, favorite buttons)
- ✅ List mutations (add/remove items)
- ❌ Don't use for critical operations (payments, deletions)

---

## 2. Empty States (Engagement & Onboarding)

### Empty State Component Template

```typescript
'use client';
import { Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = <Inbox className="w-12 h-12 text-muted-foreground" />,
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 px-4">
      <div className="text-muted-foreground mb-4">
        {icon}
      </div>
      
      <h3 className="text-lg font-semibold mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>

      <div className="flex gap-3">
        {action && (
          <Button onClick={action.onClick}>
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Contextual Empty States

Distinguish between "Empty" and "No Access":

```typescript
// Empty: User can create content
<EmptyState
  title="No projects yet"
  description="Get started by creating your first project."
  action={{ label: 'New Project', onClick: handleCreate }}
/>

// No Access: User doesn't have permission
<div className="text-center py-12">
  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
  <h3 className="font-semibold mb-2">Access Denied</h3>
  <p className="text-sm text-muted-foreground">
    Contact your workspace admin for access.
  </p>
</div>

// No Results: Search/filter yielded nothing
<EmptyState
  icon={<Search className="w-12 h-12" />}
  title="No results found"
  description='We couldn\'t find any projects matching "xyz". Try different keywords.'
  action={{ label: 'Clear filters', onClick: handleClear }}
/>
```

### Contextual Messaging Strategy

**Good empty state messages:**
- ✅ Reflect the user's action: "You haven't created any invoices yet"
- ✅ Are conversational: "Let's create your first board"
- ✅ Provide next step: Include one clear CTA
- ❌ Generic: "No data" (unclear what to do)
- ❌ Accusatory: "You haven't uploaded anything" (blame tone)

---

## 3. Error Recovery (Resilience)

### Granular Error Boundaries

Wrap specific components, not entire pages:

```typescript
'use client';
import { useErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Fallback component
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium">{error.message}</p>
          <p className="text-sm">
            We've logged this error. Please try again or contact support.
          </p>
          <Button 
            size="sm" 
            onClick={resetErrorBoundary}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Usage: Wrap components at granular level
import { ErrorBoundary } from 'react-error-boundary';

export function Dashboard() {
  return (
    <div className="grid gap-4">
      {/* Isolate each section */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <UserProfile />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ActivityFeed />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <RecentItems />
      </ErrorBoundary>
    </div>
  );
}
```

**Error Boundary Strategy:**
- Granular > Page-level (one component's crash doesn't break entire page)
- Multiple boundaries allow independent recovery
- Each boundary can have custom fallback UI

### Server Action Error Handling

Use `useActionState` from React 19 for form error handling:

```typescript
'use client';
import { useActionState } from 'react';
import { updateProfile } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function EditProfileForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    { success: false, error: null, data: null }
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* Global error */}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Success feedback */}
      {state.success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Profile updated successfully
          </AlertDescription>
        </Alert>
      )}

      <Input
        name="email"
        defaultValue={user.email}
        aria-invalid={state.fieldErrors?.email ? 'true' : 'false'}
      />
      
      {state.fieldErrors?.email && (
        <p className="text-sm text-red-500">
          {state.fieldErrors.email}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

### Retry Logic Pattern

```typescript
export function RetryableDataFetch({ url }: { url: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        // Update state
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  if (error) {
    return (
      <div className="text-center py-8 border border-red-200 rounded-lg">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button 
          size="sm" 
          onClick={handleRetry}
          disabled={isPending}
        >
          Retry
        </Button>
      </div>
    );
  }

  return <div>{/* content */}</div>;
}
```

---

## 4. Accessibility (A11y)

### Live Regions for Dynamic Updates

Screen reader announcements for state changes:

```typescript
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AccessibleLoader() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Screen reader only: announce loading state */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading ? 'Loading content...' : 'Content loaded.'}
      </div>

      {/* Visual content container */}
      <div aria-busy={isLoading}>
        <Button 
          onClick={handleFetch} 
          disabled={isLoading}
          aria-label={isLoading ? 'Loading...' : 'Fetch data'}
        >
          {isLoading ? 'Loading...' : 'Load'}
        </Button>
      </div>
    </>
  );
}
```

### Accessibility Attributes Matrix

```typescript
// Loading state
<div 
  aria-busy="true"              // Container is updating
  role="status"                 // Region type
  aria-live="polite"            // Wait for pause before announcing
>
  <Skeleton />
  <span className="sr-only">Loading items...</span>
</div>

// Error state
<div 
  role="alert"                  // Immediately announce to screen readers
  aria-live="assertive"         // Interrupt to announce error
  aria-labelledby="error-title"
>
  <h3 id="error-title">Error loading items</h3>
  <p>Network error. Please retry.</p>
</div>

// Empty state
<div 
  role="main"
  aria-label="No items"
>
  <h2>No items yet</h2>
  <Button>Create First Item</Button>
</div>
```

**Live Region Attributes:**
- `aria-live="polite"` – Announce when user pauses (loading states)
- `aria-live="assertive"` – Interrupt immediately (error alerts)
- `aria-busy="true"` – Container is undergoing changes
- `role="status"` – For status/loading messages
- `role="alert"` – For error/warning messages

### Focus Management

```typescript
export function ErrorRecoveryUI() {
  const errorRef = useRef<HTMLDivElement>(null);

  const handleRetry = async () => {
    try {
      // ... fetch logic
    } catch (error) {
      // Move focus to error message for immediate attention
      errorRef.current?.focus();
    }
  };

  return (
    <>
      <div
        ref={errorRef}
        role="alert"
        tabIndex={-1}  // Focusable but not in tab order
        className="focus:outline-none focus:ring-2 focus:ring-red-500 p-4 rounded"
      >
        <p>Failed to load. Retry now.</p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    </>
  );
}
```

---

## 5. Complete State Management Example

```typescript
'use client';
import { useOptimistic, useTransition } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';

type Item = { id: string; title: string };

export function ItemsList({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useOptimistic<Item[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const { showBoundary } = useErrorBoundary();

  // Loading
  if (isPending && items.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-12" />
        ))}
      </div>
    );
  }

  // Empty
  if (items.length === 0) {
    return (
      <EmptyState
        title="No items"
        description="Create your first item to get started."
        action={{
          label: 'Create',
          onClick: async () => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/items', { method: 'POST' });
                if (!res.ok) throw new Error('Failed to create');
                const newItem = await res.json();
                setItems([...items, newItem]);
              } catch (err) {
                showBoundary(err);
              }
            });
          }
        }}
      />
    );
  }

  // Ideal
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="p-3 border rounded">
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### ✅ DO

- **Use transitions for all async operations** → Prevents component unmounting
- **Optimize perceived performance** → Show skeletons before real data
- **Provide one clear CTA per empty state** → Reduces user decision paralysis
- **Use descriptive error messages** → "Upload failed: File too large (Max 10MB)" not "Error"
- **Wrap components granularly with Error Boundaries** → Isolate failures
- **Test with screen readers** → NVDA (Windows), JAWS, VoiceOver (Mac)
- **Include loading announcements** → Use `aria-live` regions

### ❌ DON'T

- **Show spinners for page-level loading** → Causes anxiety; use skeletons instead
- **Use generic messages** → "No data" doesn't explain what to do
- **Unmount on error** → Use granular boundaries for recovery
- **Forget offline states** → Show "You are offline" with retry option
- **Use browser storage in apps** → Throws SecurityError in iframe sandboxes; use JavaScript variables
- **Multiply CTAs in empty states** → More than one action creates decision paralysis

---

## Common Errors & Solutions

### Error: useOptimistic state reverts immediately

**Cause:** Action doesn't complete or throws error
```typescript
// ❌ WRONG: Promise not awaited
setOptimistic(newValue);
fetch('/api/update'); // Fire and forget

// ✅ CORRECT: Wait for completion
setOptimistic(newValue);
const result = await fetch('/api/update');
if (!result.ok) handleError(); // Revert on error
```

### Error: Skeleton screen causes layout shift

**Cause:** Skeleton dimensions don't match content
```typescript
// ❌ WRONG: Different width
<Skeleton className="w-1/2 h-4" />
{/* Content is full width */}

// ✅ CORRECT: Match content dimensions
<Skeleton className="w-full h-4" />
{/* Content is also full width */}
```

### Error: Screen reader doesn't announce loading

**Cause:** Missing `aria-live` or element not inserted into DOM
```typescript
// ❌ WRONG: display: none hides from accessibility tree
<div aria-live="polite" style={{ display: 'none' }}>
  Loading...
</div>

// ✅ CORRECT: Use sr-only class
<div aria-live="polite" className="sr-only">
  Loading...
</div>
```

### Error: Form validation errors not visible

**Cause:** Using `aria-invalid` without error message element
```typescript
// ❌ WRONG: Invalid attribute but no visible message
<input aria-invalid={hasError} />

// ✅ CORRECT: Pair with error description
<input 
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <p id="email-error" className="text-sm text-red-500">
    {errorMessage}
  </p>
)}
```

---

## State Design Checklist

- [ ] **Loading:** Using `useTransition` instead of manual state
- [ ] **Loading:** Skeleton dimensions match final content
- [ ] **Loading:** Screen reader gets `aria-live="polite"` announcement
- [ ] **Empty:** Single, clear CTA provided
- [ ] **Empty:** Message is contextual (not "No data")
- [ ] **Error:** Granular Error Boundary wrapping component
- [ ] **Error:** Error message is descriptive with recovery steps
- [ ] **Error:** Retry button available and functional
- [ ] **A11y:** `aria-busy` on containers during updates
- [ ] **A11y:** Focus managed after state changes
- [ ] **A11y:** Tested with NVDA/JAWS/VoiceOver

---

## References

- [React 19 useTransition Hook](https://react.dev/reference/react/useTransition)
- [React 19 useOptimistic Hook](https://react.dev/reference/react/useOptimistic)
- [React 19 useActionState](https://react.dev/reference/react/useActionState)
- [shadcn/ui Skeleton Component](https://ui.shadcn.com/docs/components/skeleton)
- [shadcn/ui Error Boundary Integration](https://github.com/shadcn-ui/ui)
- [ARIA Live Regions - Sara Soueidan](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/)
- [Empty State UX Best Practices - UXPin](https://www.uxpin.com/studio/blog/ux-best-practices-designing-the-overlooked-empty-states/)
- [React Error Boundaries - Legacy Docs](https://legacy.reactjs.org/docs/error-boundaries.html)
- [react-error-boundary Library](https://github.com/bvaughn/react-error-boundary)
- [Tailwind CSS Skeleton Shimmer](https://csstailwind.com/how-to-create-loading-skeleton-shimmer-in-tailwindcss/)
- [MDN ARIA busy attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy)
- [Web Accessibility SIS - Aria Live Regions](https://bati-itao.github.io/learning/esdc-self-paced-web-accessibility-course/module11/aria-live.html)