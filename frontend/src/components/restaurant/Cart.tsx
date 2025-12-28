'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  MapPin,
  Clock,
  MessageSquare,
} from 'lucide-react'
import type { CartItem } from '@/types/restaurant'
import { Product } from '@/types/restaurant'
import { RestaurantUtils } from '@/lib/restaurant-utils'

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onUpdateNotes: (productId: string, notes: string) => void
  onClearCart: () => void
  onSubmitOrder: (orderData: {
    deliveryAddress: string
    deliveryTime?: string
    specialInstructions?: string
  }) => Promise<void>
}

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onClearCart,
  onSubmitOrder,
}: CartProps) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId)
    } else {
      const product = items.find((item) => item.product.id === productId)?.product
      if (product) {
        const maxQuantity = product.max_order_quantity || 100
        const minQuantity = product.min_order_quantity || 1
        const clampedQuantity = Math.max(minQuantity, Math.min(maxQuantity, newQuantity))
        onUpdateQuantity(productId, clampedQuantity)
      }
    }
  }

  const handleSubmitOrder = async () => {
    await onSubmitOrder({
      deliveryAddress,
      deliveryTime,
      specialInstructions,
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">კალათი ცარიელია</h3>
          <p className="text-muted-foreground">დაამატეთ პროდუქტები კატალოგიდან</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            კალათი ({totalItems} პროდუქტი)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {RestaurantUtils.formatCurrency(item.product.price)} / {item.product.unit}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= (item.product.min_order_quantity || 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.product.id, parseInt(e.target.value) || 0)
                  }
                  className="w-20 text-center"
                  min={item.product.min_order_quantity || 1}
                  max={item.product.max_order_quantity || 100}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= (item.product.max_order_quantity || 100)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-sm text-muted-foreground ml-2">
                  = {RestaurantUtils.formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  შენიშვნები (არასავალდებულო)
                </label>
                <Textarea
                  placeholder="სპეციალური მოთხოვნები ამ პროდუქტისთვის..."
                  value={item.notes || ''}
                  onChange={(e) => onUpdateNotes(item.product.id, e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>სულ:</span>
            <span>{RestaurantUtils.formatCurrency(totalAmount)}</span>
          </div>

          <Button variant="outline" onClick={onClearCart} className="w-full">
            კალათის გასუფთავება
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            მიწოდების ინფორმაცია
          </CardTitle>
          <CardDescription>მიუთითეთ მიწოდების დეტალები</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">მიწოდების მისამართი *</label>
            <Textarea
              placeholder="შეიყვანეთ სრული მისამართი..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              სასურველი მიწოდების დრო (არასავალდებულო)
            </label>
            <Input
              type="datetime-local"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              სპეციალური ინსტრუქციები (არასავალდებულო)
            </label>
            <Textarea
              placeholder="დამატებითი ინსტრუქციები მძღოლისთვის..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>შეკვეთის რეზიუმე</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>პროდუქტები:</span>
            <span>{totalItems} ერთეული</span>
          </div>
          <div className="flex justify-between">
            <span>მიწოდების საფასური:</span>
            <span>უფასო</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>სულ:</span>
            <span>{RestaurantUtils.formatCurrency(totalAmount)}</span>
          </div>

          <Button
            onClick={handleSubmitOrder}
            disabled={!deliveryAddress.trim() || items.length === 0}
            className="w-full"
            size="lg"
          >
            <Package className="h-5 w-5 mr-2" />
            შეკვეთის გაგზავნა
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
