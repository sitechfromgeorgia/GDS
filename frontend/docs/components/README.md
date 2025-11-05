# Component Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**UI Library**: shadcn/ui + Radix UI
**Styling**: Tailwind CSS

---

## Table of Contents
1. [Overview](#overview)
2. [Component Structure](#component-structure)
3. [UI Components](#ui-components)
4. [Dashboard Components](#dashboard-components)
5. [Form Components](#form-components)
6. [Layout Components](#layout-components)
7. [Real-time Components](#real-time-components)
8. [Usage Guidelines](#usage-guidelines)
9. [Best Practices](#best-practices)

---

## Overview

This application uses **shadcn/ui** components built on top of **Radix UI** primitives, styled with **Tailwind CSS**. All components follow modern React patterns with TypeScript for type safety.

### Component Philosophy

- ✅ **Accessible**: WCAG 2.1 AA compliant
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Composable**: Small, reusable pieces
- ✅ **Themeable**: Dark/light mode support
- ✅ **Performant**: Memoized where beneficial
- ✅ **Responsive**: Mobile-first design

---

## Component Structure

```
src/
├── components/
│   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── AdminDashboardContent.tsx
│   │   ├── RestaurantDashboardContent.tsx
│   │   ├── DriverDashboardContent.tsx
│   │   └── DashboardStats.tsx
│   │
│   ├── auth/                    # Authentication components
│   │   ├── AuthProvider.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   │
│   └── realtime/                # Real-time components
│       ├── RealtimeOrderList.tsx
│       ├── RealtimeCartPanel.tsx
│       └── RealtimeNotifications.tsx
```

---

## UI Components

### Core Components

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| [Button](./button.md) | Primary interaction element | Variants, sizes, states |
| [Card](./card.md) | Content container | Header, content, footer |
| [Input](./input.md) | Text input field | Validation, icons, states |
| [Select](./select.md) | Dropdown selection | Single/multi-select |
| [Dialog](./dialog.md) | Modal dialogs | Confirmation, forms |
| [Form](./form.md) | Form handling | Validation, submission |
| [Toast](./toast.md) | Notifications | Success, error, info |
| [Dropdown Menu](./dropdown-menu.md) | Context menus | Actions, navigation |
| [Tabs](./tabs.md) | Tab navigation | Content sections |
| [Badge](./badge.md) | Status indicators | Colors, variants |

### Quick Component Reference

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Menu Item</Button>
<Button variant="link">Learn More</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Card structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>

// Input with validation
<Input
  type="email"
  placeholder="Email"
  error={errors.email?.message}
/>

// Select dropdown
<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Dialog modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Toast notifications
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

toast({
  title: "Success",
  description: "Your changes have been saved.",
  variant: "default"
})

toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive"
})
```

---

## Dashboard Components

### AdminDashboardContent
Complete admin dashboard with stats, orders, and actions.

**Location**: `src/components/dashboard/AdminDashboardContent.tsx`

**Features**:
- User statistics cards
- Product statistics
- Order management
- Quick actions panel
- System alerts

**Usage**:
```tsx
import { AdminDashboardContent } from '@/components/dashboard/AdminDashboardContent'

function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
```

### RestaurantDashboardContent
Restaurant-specific dashboard with metrics and orders.

**Location**: `src/components/dashboard/RestaurantDashboardContent.tsx`

**Features**:
- Daily/weekly/monthly metrics
- Recent orders list
- Analytics charts
- Performance indicators

**Usage**:
```tsx
import { RestaurantDashboardContent } from '@/components/dashboard/RestaurantDashboardContent'

function RestaurantPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RestaurantDashboardContent />
    </Suspense>
  )
}
```

### DriverDashboardContent
Driver-specific dashboard with deliveries and earnings.

**Location**: `src/components/dashboard/DriverDashboardContent.tsx`

**Features**:
- Today's deliveries
- Earnings tracker
- Active/pending deliveries
- Performance stats
- Quick actions

**Usage**:
```tsx
import { DriverDashboardContent } from '@/components/dashboard/DriverDashboardContent'

function DriverPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DriverDashboardContent />
    </Suspense>
  )
}
```

---

## Form Components

### Form with React Hook Form

All forms use **React Hook Form** with **Zod** validation.

**Example**:
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Define validation schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters')
})

type FormData = z.infer<typeof formSchema>

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: ''
    }
  })

  async function onSubmit(data: FormData) {
    try {
      await submitForm(data)
      toast({ title: 'Success' })
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Layout Components

### MainLayout
Primary application layout with header, sidebar, and content area.

**Location**: `src/components/layout/MainLayout.tsx`

**Features**:
- Responsive sidebar (collapsible on mobile)
- Header with user menu
- Breadcrumb navigation
- Footer

**Usage**:
```tsx
import { MainLayout } from '@/components/layout/MainLayout'

function App() {
  return (
    <MainLayout>
      <YourPageContent />
    </MainLayout>
  )
}
```

### Header
Application header with navigation and user menu.

**Location**: `src/components/layout/Header.tsx`

**Features**:
- Logo/brand
- Navigation links
- User profile dropdown
- Notifications badge
- Theme toggle

### Sidebar
Collapsible sidebar navigation.

**Location**: `src/components/layout/Sidebar.tsx`

**Features**:
- Role-based menu items
- Active link highlighting
- Collapse/expand toggle
- Icons with labels

---

## Real-time Components

### RealtimeOrderList
Live-updating order list with subscriptions.

**Location**: `src/components/realtime/RealtimeOrderList.tsx`

**Features**:
- Real-time order updates
- Status change animations
- Filtering by status
- Automatic refresh

**Usage**:
```tsx
import { RealtimeOrderList } from '@/components/realtime/RealtimeOrderList'

function OrdersPage() {
  return (
    <RealtimeOrderList
      restaurantId={restaurantId}
      filters={{ status: ['pending', 'confirmed'] }}
    />
  )
}
```

### RealtimeCartPanel
Shopping cart with live synchronization.

**Location**: `src/components/realtime/RealtimeCartPanel.tsx`

**Features**:
- Real-time cart updates
- Item quantity management
- Total calculation
- Checkout button

**Usage**:
```tsx
import { RealtimeCartPanel } from '@/components/realtime/RealtimeCartPanel'

function CartView() {
  return <RealtimeCartPanel />
}
```

---

## Usage Guidelines

### 1. Import Components Correctly

```tsx
// ✅ GOOD: Import from @/components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ❌ BAD: Relative imports
import { Button } from '../../../components/ui/button'
```

### 2. Use Type-Safe Props

```tsx
// ✅ GOOD: Define prop types
interface Props {
  title: string
  onClose: () => void
  isOpen?: boolean
}

function MyComponent({ title, onClose, isOpen = false }: Props) {
  // Component logic
}

// ❌ BAD: Untyped props
function MyComponent({ title, onClose, isOpen }) {
  // No type safety
}
```

### 3. Handle Loading States

```tsx
// ✅ GOOD: Show loading UI
function DataComponent() {
  const { data, isLoading, error } = useQuery('data', fetchData)

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return <DataDisplay data={data} />
}
```

### 4. Memoize Expensive Components

```tsx
// ✅ GOOD: Memoize components that render frequently
import { memo } from 'react'

export const ProductCard = memo(function ProductCard({ product }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>{product.description}</CardContent>
    </Card>
  )
})
```

### 5. Use Proper Event Handlers

```tsx
// ✅ GOOD: Use useCallback for event handlers
import { useCallback } from 'react'

function MyComponent() {
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id)
  }, [])

  return <Button onClick={() => handleClick('123')}>Click</Button>
}

// ❌ BAD: Inline anonymous functions
function MyComponent() {
  return <Button onClick={() => console.log('Clicked')}>Click</Button>
}
```

---

## Best Practices

### 1. Component Organization

```tsx
// ✅ GOOD: Organized component file
'use client' // If client component

// 1. Imports
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

// 2. Types
interface Props {
  title: string
  onSubmit: (value: string) => Promise<void>
}

// 3. Component
export function MyComponent({ title, onSubmit }: Props) {
  // State
  const [value, setValue] = useState('')
  const { toast } = useToast()

  // Handlers
  const handleSubmit = useCallback(async () => {
    try {
      await onSubmit(value)
      toast({ title: 'Success' })
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }, [value, onSubmit, toast])

  // Render
  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  )
}
```

### 2. Accessibility

```tsx
// ✅ GOOD: Proper accessibility attributes
<button
  type="button"
  aria-label="Close dialog"
  aria-pressed={isOpen}
  onClick={handleClose}
>
  <X aria-hidden="true" />
</button>

// Use semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### 3. Error Boundaries

```tsx
// Wrap components that might error
import { ErrorBoundary } from 'react-error-boundary'

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error(error)}
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 4. Performance Optimization

```tsx
// ✅ Use React.memo for pure components
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  // Expensive calculations
  return <div>{processData(data)}</div>
})

// ✅ Use useCallback for stable function references
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])

// ✅ Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return heavyComputation(data)
}, [data])
```

### 5. Styling Guidelines

```tsx
// ✅ GOOD: Use Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
  <Button className="w-full md:w-auto">Action</Button>
</div>

// ✅ Use cn() helper for conditional classes
import { cn } from '@/lib/utils'

<Button
  className={cn(
    'base-classes',
    isActive && 'active-classes',
    isDisabled && 'disabled-classes'
  )}
>
  Button
</Button>
```

---

## Component Testing

### Unit Testing Components

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

## Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Validation Documentation](https://zod.dev/)

---

## Related Documentation

- [Button Component](./button.md)
- [Card Component](./card.md)
- [Form Component](./form.md)
- [Dialog Component](./dialog.md)
- [Toast Component](./toast.md)

---

**End of Component Documentation README**
