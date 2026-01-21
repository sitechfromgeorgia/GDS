## SKILL 2: Next.js 15 Server Actions Powerhouse

### Metadata
- **Name:** Next.js 15 Server Actions Powerhouse
- **Category:** Full-Stack Architecture
- **Priority:** P0 (Foundation for mutations)
- **Domain:** Next.js 15 App Router, Server Actions, streaming, partial prerendering
- **Owner Role:** Full-Stack Engineer
- **Complexity:** High
- **Skills Required:** Next.js 15, React 19 Server Components, TypeScript, Middleware

### Mission
Master advanced Next.js 15 Server Actions patterns for secure, efficient mutations. Build type-safe client↔server boundaries with strict serialization, streaming for large operations, and partial prerendering strategies. All mutations flow through Server Actions—no API routes for CRUD unless public API is required.

### Key Directives

1. **Server Actions Architecture**
   - All mutations live in isolated `'use server'` files or functions, never mixed with client code
   - Server Actions handle: form submissions, real-time updates, auth, sensitive calculations
   - Return only JSON-serializable data: primitives, objects, arrays—no functions, Dates (use ISO strings), class instances
   - Use TypeScript strict mode: input validation + output types define contracts
   - Wrap actions with `try/catch`; return `{ success: boolean, data?: T, error?: string }`

2. **Type-Safe Server Action Contracts**
   - Define input schema with Zod: Server Action input validation
   - Define output type as TypeScript interface
   - Generate Zod from database schema using Supabase type generation
   - Client side: import `typeof` action and extract input/output types
   - Use discriminated unions for result types: `{ type: 'success', data } | { type: 'error', message }`

3. **Security Perimeter**
   - Every Server Action verifies `auth.user()` (Supabase)
   - Input validation on server side only (never trust client validation)
   - RLS policies in Supabase as secondary defense (server action + RLS = defense in depth)
   - Avoid exposing sensitive data: transform responses to exclude passwords, tokens, internal IDs
   - Use `revalidatePath` or `revalidateTag` for cache invalidation post-mutation

4. **Streaming & Progressive Enhancement**
   - Use `React.experimental_useOptimistic` for instant UI feedback
   - For heavy operations: stream progress updates via `StreamProvider`
   - Partial prerendering (PPR): mark mutations that need real-time revalidation
   - Server Actions auto-handle form submission without JavaScript (progressive enhancement)
   - Client-side: wrap in `startTransition` to disable form during request

5. **Error Handling & Validation**
   - Zod `.safeParse()` for graceful validation errors
   - Return structured error objects with field-level details
   - Distinguish user errors (validation) from system errors (500)
   - Log system errors to observability service, return generic message to client
   - Provide error context to UI for contextual error messages

6. **Parallel & Sequential Operations**
   - Use `Promise.all()` for independent operations (fetch user + org data)
   - Use `await` sequentially when operations depend on each other
   - Batch mutations: single Server Action accepting array of payloads
   - Use `experimental.after()` for post-response cleanup (e.g., send emails, webhooks)

### Workflows

**Workflow: Type-Safe Mutation**
```typescript
// app/actions/createOrder.ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

const CreateOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
  })),
  deliveryAddress: z.string().min(5),
  notes: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
type CreateOrderOutput = { id: string; orderNumber: string; total: number };

export async function createOrder(input: CreateOrderInput): Promise<
  { success: true; data: CreateOrderOutput } |
  { success: false; error: string; fieldErrors?: Record<string, string> }
> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Validate input on server
    const validation = CreateOrderSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as any,
      };
    }

    const supabase = createServerClient();
    
    // RLS policy ensures user can only order from own restaurants
    const { data, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: input.restaurantId,
        user_id: userId,
        items: input.items,
        delivery_address: input.deliveryAddress,
        notes: input.notes,
        status: 'pending',
      })
      .select('id, order_number, total')
      .single();

    if (error) throw error;

    // Revalidate the orders list
    revalidatePath('/restaurants/[id]/orders');

    return { success: true, data };
  } catch (error) {
    console.error('createOrder error:', error);
    return { success: false, error: 'Failed to create order' };
  }
}
```

**Usage in Client Component:**
```typescript
// app/restaurants/[id]/orders/NewOrderForm.tsx
'use client';

import { useFormStatus, useFormState } from 'react-dom';
import { createOrder } from '@/app/actions/createOrder';
import { useOptimistic } from 'react';

export function NewOrderForm({ restaurantId }: { restaurantId: string }) {
  const [, formAction] = useFormState(createOrder, null);
  const [optimisticOrders, addOptimisticOrder] = useOptimistic([]);
  
  return (
    <form action={formAction} onSubmit={(e) => {
      const formData = new FormData(e.currentTarget);
      const optimisticData = { id: 'temp-' + Date.now() };
      addOptimisticOrder(optimisticData);
    }}>
      {/* form fields */}
      <SubmitButton />
    </form>
  );
}
```

**Workflow: Streaming Long Operation**
```typescript
// app/actions/syncInventory.ts
'use server';

import { experimental_after as after } from 'next/server';

export async function syncInventory(restaurantId: string) {
  try {
    // Initiate sync immediately
    const supabase = createServerClient();
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('restaurant_id', restaurantId);

    // Schedule post-response tasks: send notification, log to analytics
    after(async () => {
      await sendNotification(restaurantId, 'Inventory synced');
      await logAnalytics('inventory_sync', { count: inventory?.length });
    });

    return { success: true, itemsCount: inventory?.length || 0 };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### Tooling

**Core**
- `next@^15.0.0` - Server Actions, PPR, after()
- `zod@^3.23.0` - Schema validation
- `@supabase/supabase-js@^2.45.0` - Database + auth
- `react@^19.0.0` - useOptimistic, useFormStatus

**Utilities**
- `server.ts` utility: `createServerClient()`, `createMiddlewareClient()`
- Validation helper: `validateInput()` wrapper around Zod
- Error handler middleware for Server Actions

**Testing**
- Vitest: unit test Server Actions with mocked Supabase
- Playwright: E2E test form submission, error handling, revalidation

**Monitoring**
- Track Server Action latency, error rate
- Log validation failures by field
- Monitor serialization errors
