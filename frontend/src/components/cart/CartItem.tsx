'use client'

import React, { useState, memo } from 'react'
import Image from 'next/image'
import { Minus, Plus, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartContext } from '@/contexts/CartContext'
import { CartItem as CartItemType } from '@/types/cart'
import { cn } from '@/lib/utils'

interface CartItemProps {
  item: CartItemType
  className?: string
  showActions?: boolean
  compact?: boolean
}

export const CartItem = memo(function CartItem({
  item,
  className,
  showActions = true,
  compact = false,
}: CartItemProps) {
  const { updateProductQuantity, removeProductFromCart, formatTotal } = useCartContext()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return

    try {
      await updateProductQuantity(item.productId, newQuantity)
    } catch (error) {
      // Error handling is done in the context
    }
  }

  const handleRemove = async () => {
    try {
      await removeProductFromCart(item.productId)
    } catch (error) {
      // Error handling is done in the context
    }
  }

  const handleNotesSave = async () => {
    // TODO: Implement notes update when backend supports it
    setIsEditingNotes(false)
  }

  const handleNotesCancel = () => {
    setNotes(item.notes || '')
    setIsEditingNotes(false)
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-2', className)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {item.product.name_ka || item.product.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {item.quantity} × {formatTotal(item.unitPrice)}
            </span>
            <Badge variant="outline" className="text-xs">
              {formatTotal(item.totalPrice)}
            </Badge>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="h-8 w-8 p-0"
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          {item.product.image_url && (
            <div className="shrink-0">
              <Image
                src={item.product.image_url}
                alt={item.product.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {item.product.name_ka || item.product.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  კატეგორია: {item.product.category}
                </p>
                <p className="text-sm text-muted-foreground">ერთეული: {item.product.unit}</p>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold">{formatTotal(item.totalPrice)}</div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} × {formatTotal(item.unitPrice)}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {item.notes && (
              <div className="mt-3 p-2 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Edit3 className="h-3 w-3" />
                  <span className="font-medium">შენიშვნები:</span>
                </div>
                <p className="text-sm mt-1">{item.notes}</p>
              </div>
            )}

            {/* Quantity Controls */}
            {showActions && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">რაოდენობა:</span>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(item.quantity - 1)}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          handleQuantityChange(value)
                        }
                      }}
                      className="w-16 h-8 text-center border-0 focus:ring-0"
                      min="0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button variant="destructive" size="sm" onClick={handleRemove} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  წაშლა
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Compact Cart Item for list views
export function CompactCartItem({ item, className }: CartItemProps) {
  const { updateProductQuantity, removeProductFromCart, formatTotal } = useCartContext()

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return
    try {
      await updateProductQuantity(item.productId, newQuantity)
    } catch (error) {
      // Error handling is done in the context
    }
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-lg',
        'hover:bg-muted/50 transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {item.product.image_url && (
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-md border"
          />
        )}
        <div>
          <p className="font-medium text-sm">{item.product.name_ka || item.product.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatTotal(item.unitPrice)} / {item.product.unit}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="h-8 w-8 p-0"
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <div className="text-sm font-medium w-16 text-right">{formatTotal(item.totalPrice)}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeProductFromCart(item.productId)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
