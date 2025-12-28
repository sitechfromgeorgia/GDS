'use client'

import { useCartStore } from '@/lib/store/cart.store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShoppingCart as CartIcon } from 'lucide-react'
import { ShoppingCart } from './ShoppingCart'
import { Badge } from '@/components/ui/badge'

interface CartWidgetProps {
  isDemo?: boolean
}

export function CartWidget({ isDemo = false }: CartWidgetProps) {
  const isOpen = useCartStore((state) => state.isOpen)
  const setIsOpen = useCartStore((state) => state.setIsOpen)
  const totalItems = useCartStore((state) => state.totalItems())

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <CartIcon className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>კალათა</SheetTitle>
        </SheetHeader>
        <div className="flex-1 mt-6 overflow-hidden">
          <ShoppingCart isDemo={isDemo} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
