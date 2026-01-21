## SKILL 5: TanStack Data Strategist

### Metadata
- **Name:** TanStack Data Strategist
- **Category:** Data Fetching & Caching
- **Priority:** P1 (Foundation for data layer)
- **Domain:** TanStack Query, caching, pagination, real-time sync
- **Owner Role:** Full-Stack Engineer
- **Complexity:** High
- **Skills Required:** TanStack Query, React hooks, cache invalidation, cursor pagination

### Mission
Architect sophisticated caching and data-fetching strategies using TanStack Query. Manage infinite scrolling tables, optimistic updates, prefetching, and real-time sync. Balance performance with freshness, handling 1000+ order records without bloat.

### Key Directives

1. **Query Strategy**
   - **Queries (reads)**: Use `useQuery` for basic fetches, `useInfiniteQuery` for pagination
   - **Mutations (writes)**: Use `useMutation` with optimistic updates via `useOptimistic`
   - **Cache Duration**: 
     - User/restaurant data: 5 min
     - Order list: 30 sec (high change rate)
     - Delivery tracking: real-time (Realtime subscription)
     - Analytics/reports: 1 hour (low change rate)

2. **Pagination Strategy**
   - **Cursor-based (infinite scroll)**: Default for delivery list, order history
   - **Offset-based (page numbers)**: Admin dashboards, search results
   - Prefetch next page when user scrolls to 80% of list
   - Disable infinite scroll fetches if already fetching or no next page

3. **Optimistic Updates Pattern**
   - Mutation optimistically updates cache before server response
   - Rollback if mutation fails
   - Show optimistic UI state: (faded color, spinner) until confirmed
   - Pair with Server Actions for serializable payload

4. **Real-Time Integration**
   - Subscribe to Realtime channel for order/delivery updates
   - On Realtime message: call `queryClient.setQueryData()` to update cache
   - Avoid re-fetching entire list; surgical updates to affected records
   - Use `queryClient.invalidateQueries()` only for complex aggregate data (totals)

5. **Prefetching Strategy**
   - Prefetch on route hover (Next.js Link): `queryClient.prefetchQuery()`
   - Prefetch next page in infinite query on scroll
   - Stagger prefetches: don't hammer server with 5 prefetches simultaneously
   - Respect user's "lite mode" or low-data-mode setting

6. **Error Handling & Retry**
   - Retry failed queries: 2 retries with exponential backoff
   - 4xx errors: don't retry (user error)
   - 5xx errors: retry with backoff
   - Network errors: retry indefinitely until user dismisses or success
   - Show error UI: "Failed to load. Retry?" button

### Workflows

**Workflow: Infinite Scroll Delivery List**
```typescript
// app/components/DeliveryList.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';

const PAGE_SIZE = 20;

export function DeliveryList() {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['deliveries'],
    queryFn: async ({ pageParam = null }) => {
      const response = await fetch(
        `/api/deliveries?limit=${PAGE_SIZE}&cursor=${pageParam || ''}`
      );
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  // Intersection Observer for auto-load on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') return <div>Loading...</div>;
  if (status === 'error') return <div>Error loading deliveries</div>;

  return (
    <div>
      {data?.pages.map((page) =>
        page.deliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))
      )}
      <div ref={observerTarget} className="h-10">
        {isFetchingNextPage && <div>Loading more...</div>}
        {!hasNextPage && <div>No more deliveries</div>}
      </div>
    </div>
  );
}
```

**Workflow: Optimistic Order Update**
```typescript
// app/components/OrderActions.tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOptimistic } from 'react';
import { updateOrderStatus } from '@/app/actions/updateOrderStatus';

export function OrderActions({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const [optimisticOrder, setOptimisticOrder] = useOptimistic(order);

  const mutation = useMutation({
    mutationFn: (newStatus: string) => updateOrderStatus(order.id, newStatus),
    onMutate: async (newStatus) => {
      // Optimistically update cache
      setOptimisticOrder({ ...order, status: newStatus });
      
      // Cancel inflight queries
      await queryClient.cancelQueries({ queryKey: ['order', order.id] });

      // Snapshot previous data
      const previousData = queryClient.getQueryData(['order', order.id]);

      // Update cache optimistically
      queryClient.setQueryData(['order', order.id], (old: Order) => ({
        ...old,
        status: newStatus,
      }));

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['order', order.id], context.previousData);
      }
    },
    onSuccess: (data) => {
      // Server confirmed, update canonical data
      queryClient.setQueryData(['order', order.id], data);
    },
  });

  return (
    <div>
      <p>Status: {optimisticOrder.status}</p>
      <button
        onClick={() => mutation.mutate('confirmed')}
        disabled={mutation.isPending}
      >
        Confirm Order
      </button>
    </div>
  );
}
```

**Workflow: Real-Time Cache Update**
```typescript
// hooks/useRealtimeDeliveries.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export function useRealtimeDeliveries() {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    'deliveries',
    { event: '*' }, // All events
    (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT') {
        // Prepend new delivery to infinite query pages
        queryClient.setQueryData(['deliveries'], (old: any) => ({
          ...old,
          pages: [
            { deliveries: [newRecord, ...old.pages[0].deliveries], nextCursor: old.pages[0].nextCursor },
            ...old.pages.slice(1),
          ],
        }));
      } else if (eventType === 'UPDATE') {
        // Update specific delivery in cache
        queryClient.setQueryData(['deliveries'], (old: any) => ({
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            deliveries: page.deliveries.map((d: any) =>
              d.id === newRecord.id ? newRecord : d
            ),
          })),
        }));
      } else if (eventType === 'DELETE') {
        // Remove deleted delivery
        queryClient.setQueryData(['deliveries'], (old: any) => ({
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            deliveries: page.deliveries.filter((d: any) => d.id !== oldRecord.id),
          })),
        }));
      }
    }
  );
}
```

### Tooling

**Core**
- `@tanstack/react-query@^5.40.0` - Data fetching + caching
- `@tanstack/query-devtools@^5.40.0` - Debug cache state
- `zustand@^4.5.0` - Local UI state (separate from server cache)

**Utilities**
- `useInfiniteQuery` wrapper with cursor logic
- `useMutation` wrapper with rollback pattern
- `useRealtimeSync` hook to integrate Realtime with TanStack Query
- Prefetch utility for route transitions

**Testing**
- Vitest: mock queryClient, test optimistic updates + rollback
- Playwright: test infinite scroll load, cache invalidation
- Performance: measure re-render frequency with TanStack Query DevTools

**Monitoring**
- Track cache hit rate (queries served from cache vs network)
- Monitor query latency, mutation duration
- Alert on high retry rates (server instability indicator)
