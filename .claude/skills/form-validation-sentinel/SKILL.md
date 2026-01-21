## SKILL 14: Form Validation Sentinel

### Metadata
- **Name:** Form Validation Sentinel
- **Category:** UI Patterns & UX
- **Priority:** P1 (Data integrity & UX)
- **Domain:** React Hook Form, Zod, Accessibility, Server Action feedback
- **Owner Role:** Frontend Engineer
- **Complexity:** Medium
- **Skills Required:** React Hook Form, Controlled vs Uncontrolled, Async Validation

### Mission
Eliminate form frustration. Implement robust, accessible forms using React Hook Form and Zod. Handle client-side instant feedback, server-side validation error mapping, multi-step wizards, and conditional field logic. Ensure every error message is clear, actionable, and accessible.

### Key Directives

1. **Architecture**
   - Use `react-hook-form` logic (uncontrolled inputs by default for perf)
   - Use `zodResolver` to bind validation schemas
   - Wrap inputs in standard `FormField`, `FormItem`, `FormLabel`, `FormControl` (shadcn pattern)
   - Use `useFormStatus` (React 19) for pending states in Server Action forms

2. **UX Patterns**
   - **Instant Feedback**: Validate format (email, phone) onBlur or onChange
   - **Form-Level Feedback**: Validate business logic (duplicate name) onSubmit via Server Action
   - **Accessibility**: Aria-invalid, proper labels, focus error field on submit
   - **Dirty State**: Warn user if leaving page with unsaved changes (`useBeforeUnload`)

3. **Complex Scenarios**
   - **Multi-Step Forms**: Preserving state between steps (Wizard pattern) using context or hidden fields
   - **Dynamic Fields**: `useFieldArray` for list items (e.g., Order Items in a cart)
   - **Conditional Logic**: Watch fields (`useWatch`) to show/hide sections
   - **File Uploads**: Integrate with `react-dropzone`, validated manually in `onChange`

4. **Debugging**
   - Use `DevTool` (react-hook-form) to inspect form state during dev
   - Log validation errors to console in development

### Workflows

**Workflow: Complex Form with Array & Async Validation**
```typescript
// app/products/ProductForm.tsx
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkSkuAvailability } from '@/app/actions/checkSku'; // Async check

const ProductSchema = z.object({
  name: z.string().min(3),
  sku: z.string().length(8),
  variants: z.array(z.object({
    size: z.string(),
    price: z.coerce.number().min(0.01),
  })).min(1),
});

export function ProductForm() {
  const form = useForm({
    resolver: zodResolver(ProductSchema),
    defaultValues: { name: '', sku: '', variants: [{ size: 'M', price: 0 }] },
    mode: 'onBlur', // Validate on blur
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const onSubmit = async (data) => {
    // 1. Client-side valid (Zod)
    
    // 2. Server-side async check
    const isSkuUnique = await checkSkuAvailability(data.sku);
    if (!isSkuUnique) {
      form.setError('sku', { message: 'SKU already taken' });
      return;
    }

    // 3. Submit
    await saveProduct(data);
  };

  return (
    <Form {...form}>
       {/* Fields ... */}
       {fields.map((field, index) => (
         <div key={field.id}>
           <Input {...form.register(`variants.${index}.price`)} />
           <Button onClick={() => remove(index)}>Remove</Button>
         </div>
       ))}
       <Button onClick={() => append({ size: '', price: 0 })}>Add Variant</Button>
    </Form>
  );
}
```

### Tooling

**Core**
- `react-hook-form@^7.x.x`
- `@hookform/resolvers`
- `zod`

**Utilities**
- Shadcn `Form` components (wrappers around Radix Label/Slot)
- `useFormStatus` (React DOM)

**Testing**
- React Testing Library: `userEvent.type()`, `userEvent.click()`
- Verify validation messages appear
- Verify valid submission calls api
