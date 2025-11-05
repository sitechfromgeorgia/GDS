'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root

const SheetTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Trigger
    ref={ref}
    className={cn(
      'text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
SheetTrigger.displayName = SheetPrimitive.Trigger.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    title?: string
    description?: string
  }
>(({ className, title, description, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform ease-in-out duration-300 data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full',
        'sm:max-w-[425px]',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex flex-col space-y-2 text-center sm:text-left mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="relative flex-1 flex-col overflow-y-auto">{children}</div>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

export { Sheet, SheetTrigger, SheetContent }
