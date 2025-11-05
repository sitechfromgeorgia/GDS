'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Truck,
  Phone,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react'
import { Cart } from '@/types/cart'
import { ORDER_SUBMISSION_GEORGIAN } from '@/types/order-submission'

interface CheckoutSummaryProps {
  cart: Cart
  restaurantName?: string
  estimatedDeliveryTime?: string
  deliveryFee?: number
  specialInstructions?: string
  contactPhone?: string
  deliveryAddress?: string
  priority?: 'normal' | 'urgent'
  onEditOrder: () => void
  onSubmit: () => void
  isLoading?: boolean
}

export default function CheckoutSummary({
  cart,
  restaurantName = 'რესტორანი',
  estimatedDeliveryTime,
  deliveryFee = 25,
  specialInstructions,
  contactPhone,
  deliveryAddress,
  priority = 'normal',
  onEditOrder,
  onSubmit,
  isLoading = false,
}: CheckoutSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ka-GE', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEstimatedTotal = () => {
    const subtotal = cart.totalPrice
    const deliveryFeeAmount = subtotal >= 500 ? 0 : deliveryFee
    return subtotal + deliveryFeeAmount
  }

  const getDeliveryFee = () => {
    return cart.totalPrice >= 500 ? 0 : deliveryFee
  }

  const deliveryFeeAmount = getDeliveryFee()
  const totalAmount = getEstimatedTotal()
  const isFreeDelivery = deliveryFeeAmount === 0

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {ORDER_SUBMISSION_GEORGIAN.labels.orderNumber}
            <Badge variant="outline" className="ml-auto">
              {restaurantName}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {estimatedDeliveryTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {ORDER_SUBMISSION_GEORGIAN.labels.estimatedDelivery}:{' '}
                {formatDate(estimatedDeliveryTime)}
              </div>
            )}
            <Badge variant={priority === 'urgent' ? 'destructive' : 'secondary'}>
              {priority === 'urgent' ? 'ექსპრეს' : 'რუტინული'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            შეკვეთის დეტალები ({cart.totalItems} ერთეული)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.product.name_ka || item.product.name}</h4>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)} {item.product.unit}
                </div>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1">შენიშვნა: {item.notes}</p>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPrice(item.unitPrice)} სახელწოდება
                </div>
              </div>
            </div>
          ))}

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>ქვე-ჯამი:</span>
              <span>{formatPrice(cart.totalPrice)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                მიწოდების საფასური:
              </span>
              <span className={isFreeDelivery ? 'text-green-600' : ''}>
                {isFreeDelivery ? 'უფასო' : formatPrice(deliveryFeeAmount)}
              </span>
            </div>

            {isFreeDelivery && (
              <p className="text-xs text-green-600">
                🎉 უფასო მიწოდება! მინიმალური თანხა 500 ლარი იყო.
              </p>
            )}

            <Separator />

            <div className="flex justify-between font-medium">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ჯამური თანხა:
              </div>
              <span className="text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle>კონტაქტი და მიწოდება</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">ტელეფონი:</span>
              <span>{contactPhone}</span>
            </div>
          )}

          {deliveryAddress && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">მიწოდების მისამართი:</span>
              <span>{deliveryAddress}</span>
            </div>
          )}

          {specialInstructions && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">განსაკუთრებული ინსტრუქციები:</span>
                <p className="text-muted-foreground mt-1">{specialInstructions}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onEditOrder} className="flex-1" disabled={isLoading}>
          შეკვეთის რედაქტირება
        </Button>

        <Button
          onClick={onSubmit}
          disabled={isLoading || cart.items.length === 0}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              იგზავნება...
            </>
          ) : (
            ORDER_SUBMISSION_GEORGIAN.actions.submitOrder
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="text-xs text-muted-foreground text-center p-3 bg-muted rounded-lg">
        🔒 თქვენი მონაცემები უსაფრთხო პროტოკოლით არის დაცული
      </div>
    </div>
  )
}
