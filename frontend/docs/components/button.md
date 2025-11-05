# Button Component Documentation

**Component**: Button
**Location**: `src/components/ui/button.tsx`
**Based on**: Radix UI (via shadcn/ui)
**Styling**: Tailwind CSS + Class Variance Authority (CVA)

---

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Props API](#props-api)
4. [Variants](#variants)
5. [Sizes](#sizes)
6. [Usage Examples](#usage-examples)
7. [Accessibility](#accessibility)
8. [Best Practices](#best-practices)
9. [Testing](#testing)

---

## Overview

The Button component is a versatile, accessible button element with multiple variants and sizes. It supports all standard HTML button attributes and provides consistent styling across the application.

### Key Features
- ✅ Multiple visual variants (default, destructive, outline, secondary, ghost, link)
- ✅ Multiple sizes (sm, default, lg, icon)
- ✅ Disabled state support
- ✅ Loading state support
- ✅ Icon support
- ✅ Full TypeScript support
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard accessible

---

## Installation

The Button component is already installed as part of shadcn/ui. If you need to add it to a new project:

```bash
npx shadcn-ui@latest add button
```

---

## Props API

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default "default"
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

  /**
   * Size of the button
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * Whether the button should render as a child element (for composability)
   * @default false
   */
  asChild?: boolean

  /**
   * All standard HTML button attributes are supported:
   * - type: 'button' | 'submit' | 'reset'
   * - disabled: boolean
   * - onClick: (event) => void
   * - aria-label: string
   * - etc.
   */
}
```

---

## Variants

### 1. Default (Primary)
Primary action button with solid fill.

```tsx
<Button variant="default">
  Default Button
</Button>
```

**Use cases**:
- Primary actions (Save, Submit, Create)
- Call-to-action buttons
- Most important action on the page

**Styling**:
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Hover: `hover:bg-primary/90`

---

### 2. Destructive
Destructive actions that require caution.

```tsx
<Button variant="destructive">
  Delete Account
</Button>
```

**Use cases**:
- Delete actions
- Irreversible operations
- Warning actions

**Styling**:
- Background: `bg-destructive`
- Text: `text-destructive-foreground`
- Hover: `hover:bg-destructive/90`

---

### 3. Outline
Secondary action with border only.

```tsx
<Button variant="outline">
  Cancel
</Button>
```

**Use cases**:
- Secondary actions
- Cancel buttons
- Alternative options

**Styling**:
- Border: `border border-input`
- Background: `bg-background`
- Hover: `hover:bg-accent hover:text-accent-foreground`

---

### 4. Secondary
Secondary action with subtle background.

```tsx
<Button variant="secondary">
  View Details
</Button>
```

**Use cases**:
- Secondary actions
- Less prominent actions
- Informational actions

**Styling**:
- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Hover: `hover:bg-secondary/80`

---

### 5. Ghost
Minimal button without background.

```tsx
<Button variant="ghost">
  <Settings className="mr-2 h-4 w-4" />
  Settings
</Button>
```

**Use cases**:
- Menu items
- List actions
- Inline actions
- Icon buttons in toolbars

**Styling**:
- Background: transparent
- Hover: `hover:bg-accent hover:text-accent-foreground`

---

### 6. Link
Button styled as a hyperlink.

```tsx
<Button variant="link">
  Learn More
</Button>
```

**Use cases**:
- Navigation within content
- Text links that need button behavior
- Secondary navigation

**Styling**:
- Text: `text-primary`
- Underline: `underline-offset-4 hover:underline`

---

## Sizes

### Default
Standard button size for most use cases.

```tsx
<Button size="default">
  Default Size
</Button>
```

**Dimensions**: `h-10 px-4 py-2`

---

### Small
Compact button for tight spaces.

```tsx
<Button size="sm">
  Small Button
</Button>
```

**Dimensions**: `h-9 px-3`

**Use cases**:
- Table actions
- Inline forms
- Mobile UI
- Compact layouts

---

### Large
Prominent button for emphasis.

```tsx
<Button size="lg">
  Large Button
</Button>
```

**Dimensions**: `h-11 px-8`

**Use cases**:
- Landing pages
- Call-to-action buttons
- Hero sections
- Primary actions on forms

---

### Icon
Square button for icon-only content.

```tsx
<Button size="icon" aria-label="Close">
  <X className="h-4 w-4" />
</Button>
```

**Dimensions**: `h-10 w-10`

**Important**: Always include `aria-label` for icon-only buttons!

---

## Usage Examples

### Basic Button

```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return (
    <Button onClick={() => console.log('Clicked')}>
      Click Me
    </Button>
  )
}
```

---

### Button with Icon

```tsx
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function CreateButton() {
  return (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create New
    </Button>
  )
}
```

---

### Loading Button

```tsx
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await submitForm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSubmit} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Submitting...' : 'Submit'}
    </Button>
  )
}
```

---

### Icon-Only Button

```tsx
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onDelete}
      aria-label="Delete item"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
```

---

### Button as Link (Next.js)

```tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function NavigateButton() {
  return (
    <Button asChild>
      <Link href="/dashboard">Go to Dashboard</Link>
    </Button>
  )
}
```

---

### Disabled Button

```tsx
import { Button } from '@/components/ui/button'

function DisabledExample() {
  return (
    <Button disabled>
      Disabled Button
    </Button>
  )
}
```

**Note**: Disabled buttons are not focusable and don't trigger onClick events.

---

### Button Group

```tsx
import { Button } from '@/components/ui/button'

function ButtonGroup() {
  const [selected, setSelected] = useState('all')

  return (
    <div className="flex gap-2">
      <Button
        variant={selected === 'all' ? 'default' : 'outline'}
        onClick={() => setSelected('all')}
      >
        All
      </Button>
      <Button
        variant={selected === 'active' ? 'default' : 'outline'}
        onClick={() => setSelected('active')}
      >
        Active
      </Button>
      <Button
        variant={selected === 'completed' ? 'default' : 'outline'}
        onClick={() => setSelected('completed')}
      >
        Completed
      </Button>
    </div>
  )
}
```

---

### Confirmation Button

```tsx
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function DeleteWithConfirmation({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## Accessibility

### Keyboard Support

| Key | Action |
|-----|--------|
| `Enter` | Activates the button |
| `Space` | Activates the button |
| `Tab` | Moves focus to/from the button |

### ARIA Attributes

```tsx
// Icon-only buttons MUST have aria-label
<Button size="icon" aria-label="Close dialog">
  <X />
</Button>

// Buttons with loading state
<Button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Toggle buttons
<Button
  aria-pressed={isActive}
  onClick={() => setIsActive(!isActive)}
>
  {isActive ? 'Active' : 'Inactive'}
</Button>

// Buttons that open dialogs
<Button aria-haspopup="dialog" aria-expanded={isOpen}>
  Open Menu
</Button>
```

### Screen Reader Support

```tsx
// Provide descriptive text for screen readers
<Button>
  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
  <span>Delete item</span>
</Button>

// For icon-only buttons, use aria-label
<Button size="icon" aria-label="Delete item">
  <Trash2 aria-hidden="true" />
</Button>
```

---

## Best Practices

### 1. Use Semantic Button Types

```tsx
// ✅ GOOD: Specify button type
<Button type="button" onClick={handleClick}>
  Click Me
</Button>

<Button type="submit">
  Submit Form
</Button>

// ❌ BAD: Missing type (defaults to "submit" which may cause unintended form submissions)
<Button onClick={handleClick}>
  Click Me
</Button>
```

---

### 2. Provide Visual Feedback

```tsx
// ✅ GOOD: Show loading state
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>

// ❌ BAD: No feedback during async operations
<Button onClick={async () => await save()}>
  Save
</Button>
```

---

### 3. Use Appropriate Variants

```tsx
// ✅ GOOD: Variant matches action importance
<div className="flex gap-2">
  <Button variant="default">Save Changes</Button>
  <Button variant="outline">Cancel</Button>
</div>

// ❌ BAD: Both buttons have same visual weight
<div className="flex gap-2">
  <Button variant="default">Save Changes</Button>
  <Button variant="default">Cancel</Button>
</div>
```

---

### 4. Handle Disabled State Properly

```tsx
// ✅ GOOD: Explain why button is disabled (tooltip or helper text)
<div>
  <Button disabled={!isValid}>
    Submit
  </Button>
  {!isValid && (
    <p className="text-sm text-muted-foreground mt-1">
      Please fill in all required fields
    </p>
  )}
</div>

// ❌ BAD: Disabled with no explanation
<Button disabled={!isValid}>
  Submit
</Button>
```

---

### 5. Size Buttons Appropriately

```tsx
// ✅ GOOD: Consistent sizing in button groups
<div className="flex gap-2">
  <Button size="sm">Action 1</Button>
  <Button size="sm">Action 2</Button>
  <Button size="sm">Action 3</Button>
</div>

// ❌ BAD: Inconsistent sizing
<div className="flex gap-2">
  <Button size="sm">Action 1</Button>
  <Button>Action 2</Button>
  <Button size="lg">Action 3</Button>
</div>
```

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect, vi } from 'vitest'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('renders with correct size class', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')
  })

  it('is keyboard accessible', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Button Component', () => {
  test('should be clickable', async ({ page }) => {
    await page.goto('/button-demo')

    const button = page.getByRole('button', { name: 'Click Me' })
    await button.click()

    await expect(page.getByText('Button clicked!')).toBeVisible()
  })

  test('should show loading state', async ({ page }) => {
    await page.goto('/button-demo')

    const button = page.getByRole('button', { name: 'Submit' })
    await button.click()

    // Should show loading text
    await expect(button).toContainText('Loading...')

    // Should be disabled during loading
    await expect(button).toBeDisabled()
  })

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/button-demo')

    await page.keyboard.press('Tab')
    const button = page.getByRole('button', { name: 'Click Me' })
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.getByText('Button clicked!')).toBeVisible()
  })
})
```

---

## Common Patterns

### Form Submit Button

```tsx
function FormSubmitButton({ isSubmitting, isValid }: Props) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting || !isValid}
      aria-busy={isSubmitting}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </Button>
  )
}
```

### Action Button with Confirmation

```tsx
function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## Related Components

- [Card](./card.md) - Container component often used with buttons
- [Dialog](./dialog.md) - Modal component with button triggers
- [Form](./form.md) - Form component with submit buttons
- [Toast](./toast.md) - Notification component triggered by buttons

---

**End of Button Component Documentation**
