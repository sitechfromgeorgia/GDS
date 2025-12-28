'use client'
import { logger } from '@/lib/logger'

import React from 'react'
import { X, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { useCartContext } from '@/contexts/CartContext'
import { CartItem } from './CartItem'
import { CompactCartItem } from './CartItem'
import { cn } from '@/lib/utils'

interface CartPanelProps {
  className?: string
  variant?: 'slideover' | 'modal' | 'inline'
  compact?: boolean
  showCheckout?: boolean
  onCheckout?: () => void
}

export function CartPanel({
  className,
  variant = 'slideover',
  compact = false,
  showCheckout = true,
  onCheckout,
}: CartPanelProps) {
  const {
    cart,
    itemCount,
    totalPrice,
    isEmpty,
    isCartOpen,
    setIsCartOpen,
    clearCart,
    formatTotal,
    isClearing,
  } = useCartContext()

  const handleClose = () => {
    setIsCartOpen(false)
  }

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout()
    } else {
      // TODO: Navigate to checkout or open checkout modal
      logger.info('Proceeding to checkout...')
    }
  }

  if (variant === 'inline') {
    return (
      <div className={cn('w-full', className)}>
        {isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">კალათა ცარიეა</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                დაამატეთ პროდუქტები კალათაში
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cart?.items.map((item) => (
              <CompactCartItem key={item.id} item={item} compact />
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">ჯამი:</span>
              <span className="text-lg font-bold">{formatTotal(totalPrice)}</span>
            </div>
            {showCheckout && (
              <Button onClick={handleCheckout} className="w-full" size="lg">
                გაგრძელება შეკვეთამდე
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <Card className="relative z-10 w-full max-w-md max-h-[90vh]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              კალათა
              <Badge variant="secondary">{itemCount}</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <CartPanelContent
              compact={compact}
              showCheckout={showCheckout}
              onCheckout={handleCheckout}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default slideover variant using shadcn Drawer
  return (
    <Drawer open={isCartOpen} onOpenChange={setIsCartOpen} direction="right">
      <DrawerContent className={cn('fixed right-0 top-0 h-full w-full max-w-md', className)}>
        <DrawerHeader className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <DrawerTitle className="text-lg font-semibold">კალათა</DrawerTitle>
            <Badge variant="secondary">{itemCount}</Badge>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          <CartPanelContent
            compact={compact}
            showCheckout={showCheckout}
            onCheckout={handleCheckout}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// Inner content component shared between variants
function CartPanelContent({
  compact,
  showCheckout,
  onCheckout,
}: {
  compact: boolean
  showCheckout: boolean
  onCheckout: () => void
}) {
  const { cart, isEmpty, clearCart, formatTotal, isClearing } = useCartContext()

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">კალათა ცარიეა</h3>
        <p className="text-muted-foreground text-center mb-4">
          ჯერ არ დაგიმატებია არცერთი პროდუქტი კალათაში
        </p>
        <Button onClick={onCheckout} variant="outline">
          შოპინგის გაგრძელება
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {cart?.items.map((item) => (
            <CartItem key={item.id} item={item} compact={compact} showActions={!compact} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-6 space-y-4">
        {/* Cart Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">პროდუქტები:</span>
            <span className="text-sm">{cart?.totalItems} ერთეული</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>ჯამი:</span>
            <span>{formatTotal(cart?.totalPrice || 0)}</span>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          {showCheckout && (
            <Button onClick={onCheckout} className="w-full" size="lg">
              შეკვეთის დადასტურება
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <Button onClick={clearCart} variant="outline" className="w-full" disabled={isClearing}>
            {isClearing ? 'წაშლა...' : 'კალათის გასუფთავება'}
          </Button>
        </div>
      </div>
    </div>
  )
}
