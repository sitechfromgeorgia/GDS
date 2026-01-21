## SKILL 11: Shadcn Design Alchemist

### Metadata
- **Name:** Shadcn Design Alchemist
- **Category:** UI/UX & Component Architecture
- **Priority:** P1 (Brand identity & UX)
- **Domain:** Tailwind CSS v4, shadcn/ui, Radix Primitives, motion
- **Owner Role:** Frontend Engineer / Designer
- **Complexity:** Medium
- **Skills Required:** Tailwind CSS, React, Accessibility (a11y), Framer Motion

### Mission
Forge a stunning, accessible, and consistent design system using shadcn/ui. Customize base components to match the Georgian Distribution brand (premium, modern). Enforce design consistency, dark mode support, and fluid animations using Framer Motion.

### Key Directives

1. **Component Customization Strategy**
   - **Do Not Fork blindly**: keep closest to upstream shadcn/ui for easy updates
   - **Theming**: Use CSS variables in `globals.css` for HSL functional colors (`--primary`, `--destructive`, `--sidebar-bg`)
   - **Typography**: Inter (Google Fonts) for UI, Georgian-compatible font fallback
   - **Border Radius**: Consistent `0.5rem` (medium) or `0.75rem` (large)
   - **Tailwind v4 Config**: Use the new CSS-first config approach where possible

2. **Atomic Design Organization**
   - `components/ui/`: Base shadcn components (Button, Input, Card) - treat as library code
   - `components/custom/`: Composite business components (OrderCard, DriverMap, UserAvatar)
   - `components/layout/`: Sidebar, Header, PageContainer

3. **Motion & Interaction**
   - Use `framer-motion` for complex entering/exiting animations
   - Use `tailwindcss-animate` for simple utility classes (`animate-in`, `fade-in`)
   - Micro-interactions: hover states, active states, focus rings
   - Page transitions: subtle opacity fade on route change (`template.tsx`)

4. **Responsive & Mobile-First**
   - Default to mobile styles (`w-full`), override for desktop (`md:w-auto`)
   - Touch targets: minimum 44px for buttons/inputs on mobile
   - Sidebar: Drawer on mobile, persistent Sidebar on desktop
   - Tables: Card view on mobile, Data Table on desktop

5. **Accessibility (a11y) First**
   - All interactive elements must have focus styles (`focus-visible:ring`)
   - Use semantic HTML (`<main>`, `<nav>`, `<section>`)
   - Radix primitives handle ARIA attributes automatically—don't break them
   - Contrast ratio: ensure text meets WCAG AA standards
   - Keyboard navigation: test entire flows without mouse

### Workflows

**Workflow: Customizing a Component**
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20", // Custom shadow
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-xl", // Custom variant
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ... exports
```

**Workflow: Responsive Data Display**
```typescript
// components/custom/OrderList.tsx
export function OrderList({ orders }) {
  // Mobile View (< md)
  const MobileView = () => (
    <div className="grid gap-4 md:hidden">
      {orders.map(order => (
        <Card key={order.id} className="p-4">
          <div className="flex justify-between font-bold">
            <span>#{order.number}</span>
            <Badge status={order.status}>{order.status}</Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {order.items.length} items • {formatPrice(order.total)}
          </div>
        </Card>
      ))}
    </div>
  );

  // Desktop View (>= md)
  const DesktopView = () => (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
           {/* ... headers */}
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              {/* ... cells */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  );
}
```

### Tooling

**Core**
- `shadcn-ui` CLI (`npx shadcn@latest add`)
- Tailwind CSS v4
- `lucide-react` (icons)
- `class-variance-authority` (CVA)

**Utilities**
- `cn()` helper (clsx + tw-merge)
- Theme toggle provider using `next-themes`
- `tailwindcss-animate`

**Testing**
- Storybook (optional, if component library grows)
- Playwright: visual regression testing (Snapshot)
- A11y tests: `axe-core`

**Monitoring**
- N/A (mostly static code), but monitor bundle size of imported icons
