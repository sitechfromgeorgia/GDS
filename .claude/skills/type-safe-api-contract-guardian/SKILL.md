## SKILL 13: Type-Safe API Contract Guardian

### Metadata
- **Name:** Type-Safe API Contract Guardian
- **Category:** Code Quality & Type Safety
- **Priority:** P1 (Prevent runtime errors)
- **Domain:** Zod, TypeScript, tRPC-like patterns, API Route validation
- **Owner Role:** Full-Stack Engineer
- **Complexity:** Medium
- **Skills Required:** TypeScript, Zod, Runtime Type Checking

### Mission
Enforce strict semantic contracts between client and server. No `any`, no implicit casts. Every API endpoint and Server Action MUST validate inputs using Zod. Inferred types flow automatically to the client, ensuring refactors break build, not production.

### Key Directives

1. **Shared Schema Architecture**
   - Define validation schemas in shared location (e.g., `lib/validators` or `types/schema`)
   - Export both Schema (Zod) and Type (TypeScript interface)
   - Client imports validation for form handling; Server imports for request parsing
   - Prevents drift between UI forms and API expectations

2. **Validation Layer Strategy**
   - **Server Actions**: `const result = Schema.safeParse(input)`
   - **Route Handlers**: `const body = await req.json(); const result = Schema.safeParse(body);`
   - **Edge Functions**: `const payload = await req.json(); const result = Schema.safeParse(payload);`
   - If invalid: Return 400 or `{ error: "Validation Failed", details: zodError }`
   - Never trust input, even from typed client

3. **Database → App Type Flow**
   - Use `supabase gen types` to generate `Database` interface
   - Don't use raw DB types in UI components (leaks implementation details)
   - Create mapper/DTO layer: `DB User -> App User`
   - Use Zod transformers to fix data formats (e.g. `string` date from JSON → `Date` object)

4. **Environment Variable Validation**
   - Create `env.mjs` or `env.ts` with Zod validation
   - Validate `SUPABASE_URL`, `STRIPE_KEY` at build/startup time
   - Fail fast if config is missing

5. **API Response Standardization**
   - Success: `{ success: true, data: T }`
   - Error: `{ success: false, error: string, code?: string, fields?: Record<string, string> }`
   - Uniform error structure allows unified UI error handling toaster

### Workflows

**Workflow: End-to-End Type Safety**
```typescript
// types/order-schema.ts
import { z } from 'zod';

// Shared Schema
export const UpdateOrderSchema = z.object({
  status: z.enum(['pending', 'preparing', 'delivering', 'completed']),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().min(1),
  })).min(1),
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
```

**Server Action (Backend):**
```typescript
// app/actions/orders.ts
'use server';
import { UpdateOrderSchema, UpdateOrderInput } from '@/types/order-schema';

export async function updateOrder(id: string, input: UpdateOrderInput) {
  const result = UpdateOrderSchema.safeParse(input);
  
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fields: result.error.flatten().fieldErrors
    };
  }

  // Safe to use result.data
  // ... db update
  return { success: true };
}
```

**Client Component (Frontend):**
```typescript
// app/orders/EditOrderForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateOrderSchema, UpdateOrderInput } from '@/types/order-schema';
import { updateOrder } from '@/app/actions/orders';

export function EditOrderForm({ orderId }) {
  const form = useForm<UpdateOrderInput>({
    resolver: zodResolver(UpdateOrderSchema),
    defaultValues: { status: 'pending', items: [] }
  });

  const onSubmit = async (data: UpdateOrderInput) => {
    // Type-safe call to server action
    const res = await updateOrder(orderId, data);
    if (!res.success) {
      if (res.fields) {
        // Map server validation errors back to form
        Object.entries(res.fields).forEach(([key, val]) => {
          form.setError(key as any, { message: val[0] });
        });
      }
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Tooling

**Core**
- `zod@^3.23.0` - Schema declaration
- `@hookform/resolvers` - Zod integration for forms
- `typescript@^5.x.x` - Base guarantees

**Utilities**
- `env.ts` validator script
- Type generator for Supabase
- Generic API response wrapper

**Testing**
- Vitest: Test Zod schemas with invalid inputs
- Verify error mapping from Server Action to Form
- "Fail Fast" test: intentional type mismatch should fail compilation

**Monitoring**
- Log validation failures (400 Bad Request) to identify UI/API drift or potential attacks
