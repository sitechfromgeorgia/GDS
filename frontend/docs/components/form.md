# Form Component Documentation

**Component**: Form
**Location**: `src/components/ui/form.tsx`
**Based on**: React Hook Form + Radix UI Form
**Validation**: Zod schema validation

---

## Overview

The Form component provides a complete form solution with validation, error handling, and accessibility features built on React Hook Form and Zod.

### Key Features
- ✅ Type-safe with TypeScript + Zod
- ✅ Automatic validation
- ✅ Error message display
- ✅ Accessible form controls
- ✅ Loading states
- ✅ Field-level and form-level errors

---

## Installation

```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn-ui@latest add form
```

---

## Basic Example

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// 1. Define validation schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type FormData = z.infer<typeof formSchema>

// 2. Create form component
export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  async function onSubmit(data: FormData) {
    try {
      await login(data)
    } catch (error) {
      form.setError('root', {
        message: 'Login failed. Please check your credentials.'
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Complete Example: Product Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

// Validation schema
const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  price: z.coerce
    .number()
    .min(0.01, 'Price must be greater than 0'),
  categoryId: z.string().min(1, 'Please select a category'),
  stock: z.coerce
    .number()
    .int()
    .min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Please specify unit'),
  isAvailable: z.boolean().default(true)
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  categories: Array<{ id: string; name: string }>
}

export function ProductForm({
  initialData,
  onSubmit,
  categories
}: ProductFormProps) {
  const { toast } = useToast()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sku: initialData?.sku || '',
      price: initialData?.price || 0,
      categoryId: initialData?.categoryId || '',
      stock: initialData?.stock || 0,
      unit: initialData?.unit || 'unit',
      isAvailable: initialData?.isAvailable ?? true
    }
  })

  async function handleSubmit(data: ProductFormData) {
    try {
      await onSubmit(data)
      toast({
        title: 'Success',
        description: initialData ? 'Product updated' : 'Product created'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormDescription>
                This will be displayed to customers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SKU and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="PROD-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price, Stock, Unit Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="g">Gram</SelectItem>
                    <SelectItem value="l">Liter</SelectItem>
                    <SelectItem value="ml">Milliliter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Availability Checkbox */}
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Available for Sale</FormLabel>
                <FormDescription>
                  This product will be visible to customers
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Buttons */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : 'Save Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={form.formState.isSubmitting}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## Validation Patterns

### Required Fields

```tsx
const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  name: z.string().min(1, 'Name is required')
})
```

### Optional Fields

```tsx
const schema = z.object({
  description: z.string().optional(),
  notes: z.string().nullable()
})
```

### Number Validation

```tsx
const schema = z.object({
  age: z.coerce.number().min(18, 'Must be at least 18'),
  price: z.coerce.number().positive('Must be positive'),
  quantity: z.coerce.number().int('Must be integer').min(1)
})
```

### Date Validation

```tsx
const schema = z.object({
  birthDate: z.coerce.date().max(new Date(), 'Cannot be in future'),
  expiryDate: z.coerce.date().min(new Date(), 'Cannot be in past')
})
```

### Custom Validation

```tsx
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})
```

### Conditional Validation

```tsx
const schema = z.object({
  hasDelivery: z.boolean(),
  deliveryAddress: z.string().optional()
}).refine(
  (data) => !data.hasDelivery || (data.deliveryAddress && data.deliveryAddress.length > 0),
  {
    message: 'Delivery address is required when delivery is selected',
    path: ['deliveryAddress']
  }
)
```

---

## Error Handling

### Field-Level Errors

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          className={fieldState.error ? 'border-destructive' : ''}
        />
      </FormControl>
      <FormMessage /> {/* Displays field error */}
    </FormItem>
  )}
/>
```

### Form-Level Errors

```tsx
async function onSubmit(data: FormData) {
  try {
    await submitForm(data)
  } catch (error) {
    // Set root-level error
    form.setError('root', {
      message: 'Failed to submit form. Please try again.'
    })
  }
}

// Display root error
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {form.formState.errors.root.message}
    </AlertDescription>
  </Alert>
)}
```

### Manual Error Setting

```tsx
// Set error on specific field
form.setError('email', {
  message: 'This email is already registered'
})

// Set multiple errors
form.setError('password', { message: 'Password too weak' })
form.setError('confirmPassword', { message: 'Passwords do not match' })

// Clear specific error
form.clearErrors('email')

// Clear all errors
form.clearErrors()
```

---

## Form State

### Loading State

```tsx
const isLoading = form.formState.isSubmitting

<Button type="submit" disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Submitting...' : 'Submit'}
</Button>
```

### Dirty State

```tsx
const isDirty = form.formState.isDirty

{isDirty && (
  <p className="text-sm text-muted-foreground">
    You have unsaved changes
  </p>
)}
```

### Valid State

```tsx
const isValid = form.formState.isValid

<Button type="submit" disabled={!isValid}>
  Submit
</Button>
```

---

## Best Practices

### 1. Use TypeScript

```tsx
// ✅ GOOD: Type-safe form
const schema = z.object({
  email: z.string().email()
})
type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### 2. Provide Helpful Error Messages

```tsx
// ✅ GOOD: Clear error messages
z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')

// ❌ BAD: Generic errors
z.string().min(8, 'Invalid')
```

### 3. Handle Async Validation

```tsx
// Check if email exists
const checkEmailExists = async (email: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single()

  return !data // Return false if email exists
}

// In form submit
async function onSubmit(data: FormData) {
  const emailAvailable = await checkEmailExists(data.email)

  if (!emailAvailable) {
    form.setError('email', {
      message: 'This email is already registered'
    })
    return
  }

  // Continue with submission
}
```

---

## Related Components

- [Button](./button.md) - Submit buttons
- [Input](./input.md) - Text inputs
- [Select](./select.md) - Dropdown selection
- [Textarea](./textarea.md) - Multi-line text

---

**End of Form Component Documentation**
