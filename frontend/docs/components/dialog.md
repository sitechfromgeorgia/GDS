# Dialog Component Documentation

**Component**: Dialog (Modal)
**Location**: `src/components/ui/dialog.tsx`
**Based on**: Radix UI Dialog
**Styling**: Tailwind CSS

---

## Overview

The Dialog component (also known as Modal) is an overlay that displays content above the main page. It's used for confirmations, forms, and focused interactions.

### Key Features
- ✅ Accessible (ARIA compliant)
- ✅ Focus trap (keeps focus within dialog)
- ✅ Escape key closes
- ✅ Click outside closes
- ✅ Scroll lock on body
- ✅ Composable sub-components
- ✅ Customizable animations

---

## Component Structure

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    {/* Main content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Props API

### Dialog
```typescript
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  modal?: boolean // Default: true
}
```

### DialogContent
```typescript
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  // Closes dialog on pointer down outside
  onPointerDownOutside?: (event: Event) => void
  // Closes dialog on escape key
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}
```

---

## Usage Examples

### Basic Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function BasicDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a basic dialog with some content.
          </DialogDescription>
        </DialogHeader>
        <p>Dialog content goes here.</p>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Controlled Dialog

```tsx
function ControlledDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Dialog
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogHeader>
          <p>This dialog is controlled by state.</p>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

### Confirmation Dialog

```tsx
function DeleteConfirmation({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the item.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Form Dialog

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

type FormData = z.infer<typeof schema>

function FormDialog() {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: ''
    }
  })

  async function onSubmit(data: FormData) {
    try {
      await createUser(data)
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Enter user details below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### View Details Dialog

```tsx
function ProductDetailsDialog({ product }: { product: Product }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            SKU: {product.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {product.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
              <p className="text-2xl font-bold">${product.price}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Stock</h4>
              <p className="text-2xl font-bold">{product.stock}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Description
            </h4>
            <p className="text-sm">{product.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={product.isAvailable ? 'default' : 'destructive'}>
              {product.isAvailable ? 'Available' : 'Out of Stock'}
            </Badge>
            {product.category && (
              <Badge variant="outline">{product.category.name}</Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Scrollable Dialog

```tsx
function ScrollableDialog({ content }: { content: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Terms</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept our terms
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm">
            {content}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Multi-Step Dialog

```tsx
function MultiStepDialog() {
  const [step, setStep] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  function handleClose() {
    setIsOpen(false)
    setStep(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Start Wizard</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Wizard - Step {step} of 3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div>
            <h3 className="font-medium mb-2">Step 1: Basic Information</h3>
            <Input placeholder="Enter your name" />
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-medium mb-2">Step 2: Contact Details</h3>
            <Input type="email" placeholder="Enter your email" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-medium mb-2">Step 3: Confirmation</h3>
            <p className="text-sm text-muted-foreground">
              Review your information and click Finish
            </p>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleClose}>
              Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Advanced Patterns

### Prevent Close on Outside Click

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent
    onPointerDownOutside={(e) => e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
  >
    <DialogHeader>
      <DialogTitle>Important Action</DialogTitle>
      <DialogDescription>
        You must make a selection before closing
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

### Nested Dialogs

```tsx
function NestedDialogs() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Primary</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Primary Dialog</DialogTitle>
        </DialogHeader>
        <p>This is the first dialog.</p>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Secondary</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Secondary Dialog</DialogTitle>
            </DialogHeader>
            <p>This dialog appears on top.</p>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Best Practices

### 1. Use Appropriate Sizes

```tsx
// ✅ GOOD: Specify max width for form dialogs
<DialogContent className="sm:max-w-[425px]">
  {/* Small form */}
</DialogContent>

<DialogContent className="sm:max-w-[600px]">
  {/* Medium content */}
</DialogContent>

<DialogContent className="sm:max-w-[800px]">
  {/* Large content */}
</DialogContent>
```

### 2. Provide Clear Actions

```tsx
// ✅ GOOD: Clear primary and secondary actions
<DialogFooter>
  <Button variant="outline">Cancel</Button>
  <Button variant="destructive">Delete</Button>
</DialogFooter>

// ❌ BAD: Ambiguous buttons
<DialogFooter>
  <Button>Yes</Button>
  <Button>No</Button>
</DialogFooter>
```

### 3. Handle Loading States

```tsx
// ✅ GOOD: Show loading in dialog
<DialogFooter>
  <Button onClick={handleAction} disabled={isLoading}>
    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {isLoading ? 'Processing...' : 'Confirm'}
  </Button>
</DialogFooter>
```

### 4. Reset Form on Close

```tsx
// ✅ GOOD: Reset form when dialog closes
<Dialog open={isOpen} onOpenChange={(open) => {
  setIsOpen(open)
  if (!open) {
    form.reset()
  }
}}>
  {/* Form dialog */}
</Dialog>
```

---

## Accessibility

### Keyboard Support

| Key | Action |
|-----|--------|
| `Escape` | Closes the dialog |
| `Tab` | Moves focus to next focusable element |
| `Shift + Tab` | Moves focus to previous element |

### Focus Management

- Focus is automatically trapped within dialog
- Focus returns to trigger element on close
- First focusable element receives focus on open

### ARIA Attributes

- `role="dialog"` - Identifies as dialog
- `aria-labelledby` - References DialogTitle
- `aria-describedby` - References DialogDescription
- `aria-modal="true"` - Indicates modal behavior

---

## Related Components

- [Button](./button.md) - Dialog triggers
- [Form](./form.md) - Forms within dialogs
- [AlertDialog](./alert-dialog.md) - Confirmation dialogs

---

**End of Dialog Component Documentation**
