# Card Component Documentation

**Component**: Card
**Location**: `src/components/ui/card.tsx`
**Based on**: shadcn/ui base component
**Styling**: Tailwind CSS

---

## Overview

The Card component is a flexible container for grouping related content. It provides a consistent visual structure with optional header, content, and footer sections.

### Key Features
- ✅ Composable sub-components (Header, Title, Description, Content, Footer)
- ✅ Responsive design
- ✅ Consistent padding and spacing
- ✅ Dark mode support
- ✅ Accessible semantic HTML

---

## Component Structure

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer content (actions, metadata, etc.)
  </CardFooter>
</Card>
```

---

## Props API

### Card
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  // All standard div attributes supported
}
```

### CardHeader
```typescript
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}
```

### CardTitle
```typescript
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
  // Renders as <h3> by default
}
```

### CardDescription
```typescript
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
}
```

### CardContent
```typescript
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}
```

### CardFooter
```typescript
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}
```

---

## Usage Examples

### Basic Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function BasicCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  )
}
```

### Stats Card

```tsx
function StatsCard({ title, value, change }: {
  title: string
  value: string
  change: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {' '}from last month
        </p>
      </CardContent>
    </Card>
  )
}

// Usage
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatsCard title="Total Revenue" value="$45,231" change={20.1} />
  <StatsCard title="Subscriptions" value="+2,350" change={18.2} />
  <StatsCard title="Sales" value="+12,234" change={19.0} />
  <StatsCard title="Active Now" value="+573" change={2.5} />
</div>
```

### Product Card

```tsx
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover"
        />
        {!product.isAvailable && (
          <Badge className="absolute top-2 right-2" variant="destructive">
            Out of Stock
          </Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.unit}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!product.isAvailable}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Order Card

```tsx
function OrderCard({ order }: { order: Order }) {
  const statusColor = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  }[order.status]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Order #{order.orderNumber}</CardTitle>
            <CardDescription>
              {format(new Date(order.createdAt), 'PPp')}
            </CardDescription>
          </div>
          <Badge className={cn(statusColor, 'text-white')}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items:</span>
            <span className="font-medium">{order.items.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery:</span>
            <span className="font-medium truncate max-w-[200px]">
              {order.deliveryAddress}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        {order.status === 'pending' && (
          <Button size="sm">Confirm Order</Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

### Interactive Card (Clickable)

```tsx
function ClickableCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>Click anywhere to trigger action</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This entire card is interactive</p>
      </CardContent>
    </Card>
  )
}
```

### Card with Form

```tsx
function LoginCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button className="w-full">Sign In</Button>
        <Button variant="link" className="w-full">
          Forgot password?
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Best Practices

### 1. Use Semantic Structure

```tsx
// ✅ GOOD: Use all card sub-components for clarity
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>

// ❌ BAD: Missing semantic structure
<Card>
  <div className="p-6">
    <h3>Title</h3>
    <p>Content</p>
    <button>Action</button>
  </div>
</Card>
```

### 2. Consistent Grid Layouts

```tsx
// ✅ GOOD: Responsive grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### 3. Handle Empty States

```tsx
function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No orders yet</CardTitle>
          <CardDescription>
            Your orders will appear here once you place them.
          </CardDescription>
          <Button className="mt-4">Browse Products</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

---

## Related Components

- [Button](./button.md) - Often used in CardFooter
- [Badge](./badge.md) - Status indicators in cards
- [Dialog](./dialog.md) - Cards within modals

---

**End of Card Component Documentation**
