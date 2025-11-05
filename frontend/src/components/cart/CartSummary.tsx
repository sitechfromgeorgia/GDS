'use client'

import React from 'react'
import { ShoppingBag, Package, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCartContext } from '@/contexts/CartContext'
import { cn } from '@/lib/utils'

interface CartSummaryProps {
  className?: string
  compact?: boolean
  showActions?: boolean
  onCheckout?: () => void
  showClearButton?: boolean
}

export function CartSummary({
  className,
  compact = false,
  showActions = true,
  onCheckout,
  showClearButton = true,
}: CartSummaryProps) {
  const { cart, itemCount, totalPrice, formatTotal, clearCart, isClearing, isEmpty } =
    useCartContext()

  if (isEmpty) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">კალათა ცარიეა</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{itemCount} ერთეული</p>
                <p className="text-sm text-muted-foreground">{cart?.items.length || 0} პროდუქტი</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{formatTotal(totalPrice)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          შეკვეთის მოცულობა
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">პროდუქტების რაოდენობა:</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{cart?.items.length || 0}</Badge>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ერთეულების რაოდენობა:</span>
            <span className="font-medium">{itemCount}</span>
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>ჯამური ფასი:</span>
            <span className="text-orange-600">{formatTotal(totalPrice)}</span>
          </div>
        </div>

        {/* Items Preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">კალათაში არსებული პროდუქტები:</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cart?.items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="flex-1 truncate pr-2">
                  {item.product.name_ka || item.product.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.quantity}×</span>
                  <span className="font-medium">{formatTotal(item.totalPrice)}</span>
                </div>
              </div>
            ))}
            {cart && cart.items.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                და კიდევ {cart.items.length - 5} პროდუქტი...
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        {showActions && (
          <div className="space-y-2">
            <Button onClick={onCheckout} className="w-full" size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              შეკვეთის დადასტურება
            </Button>

            {showClearButton && (
              <Button
                onClick={clearCart}
                variant="outline"
                className="w-full"
                disabled={isClearing}
              >
                {isClearing ? 'წაშლა...' : 'კალათის გასუფთავება'}
              </Button>
            )}
          </div>
        )}

        {/* Delivery Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• ფასები არ შეიცავს მიწოდების ხარჯებს</p>
          <p>• შეკვეთის სტატუსი განსაზღვრულია ადმინისტრატორის მიერ</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple cart summary for header/navbar
export function SimpleCartSummary({ className }: { className?: string }) {
  const { itemCount, totalPrice, isEmpty, formatTotal } = useCartContext()

  if (isEmpty) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <ShoppingBag className="h-4 w-4" />
        <span className="text-sm">ცარიეა</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="secondary" className="text-xs">
        {itemCount}
      </Badge>
      <span className="text-sm font-medium">{formatTotal(totalPrice)}</span>
    </div>
  )
}
