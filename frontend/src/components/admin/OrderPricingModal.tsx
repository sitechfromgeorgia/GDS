'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DollarSign, Calculator, Receipt } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@/lib/supabase'

// Create Supabase client instance
const supabase = createBrowserClient()

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  pricing_notes?: string
}

interface OrderPricingModalProps {
  order: Order | null
  open: boolean
  onClose: () => void
}

export function OrderPricingModal({ order, open, onClose }: OrderPricingModalProps) {
  const [pricingData, setPricingData] = useState({
    subtotal: 0,
    delivery_fee: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    pricing_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (order) {
      setPricingData({
        subtotal: order.subtotal || 0,
        delivery_fee: order.delivery_fee || 0,
        tax_amount: order.tax_amount || 0,
        discount_amount: order.discount_amount || 0,
        total_amount: order.total_amount || 0,
        pricing_notes: order.pricing_notes || '',
      })
    }
  }, [order])

  const calculateTotal = () => {
    const subtotal = pricingData.subtotal
    const deliveryFee = pricingData.delivery_fee
    const taxAmount = pricingData.tax_amount
    const discountAmount = pricingData.discount_amount

    return Math.max(0, subtotal + deliveryFee + taxAmount - discountAmount)
  }

  const handleInputChange = (field: string, value: number) => {
    const newData = { ...pricingData, [field]: value }
    const total = calculateTotal()
    setPricingData({ ...newData, total_amount: total })
  }

  const handleSavePricing = async () => {
    if (!order) return

    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({
          subtotal: pricingData.subtotal,
          delivery_fee: pricingData.delivery_fee,
          tax_amount: pricingData.tax_amount,
          discount_amount: pricingData.discount_amount,
          total_amount: pricingData.total_amount,
          pricing_notes: pricingData.pricing_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'შეკვეთის ფასი განახლდა',
      })

      onClose()
    } catch (error) {
      logger.error('Error updating order pricing:', error)
      toast({
        title: 'შეცდომა',
        description: 'ფასის განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            შეკვეთის ფასის რედაქტირება #{order.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            მომხმარებელი: {order.customer_name} • ტელ: {order.customer_phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                შეკვეთის ელემენტები
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        რაოდენობა: {item.quantity} × {item.unit_price}₾
                      </p>
                    </div>
                    <p className="font-medium">{item.total_price}₾</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>პროდუქტების ჯამი:</span>
                  <span>{pricingData.subtotal}₾</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                ფასის დეტალები
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">პროდუქტების ფასი (₾)</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.subtotal}
                    onChange={(e) => handleInputChange('subtotal', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">მიწოდების საფასური (₾)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.delivery_fee}
                    onChange={(e) =>
                      handleInputChange('delivery_fee', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_amount">გადასახადი (₾)</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.tax_amount}
                    onChange={(e) =>
                      handleInputChange('tax_amount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_amount">ფასდაკლება (₾)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.discount_amount}
                    onChange={(e) =>
                      handleInputChange('discount_amount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>სულ გადასახდელი:</span>
                <span className="text-primary">{pricingData.total_amount.toFixed(2)}₾</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Notes */}
          <div className="space-y-2">
            <Label htmlFor="pricing_notes">ფასის შენიშვნები</Label>
            <Textarea
              id="pricing_notes"
              value={pricingData.pricing_notes}
              onChange={(e) =>
                setPricingData((prev) => ({ ...prev, pricing_notes: e.target.value }))
              }
              placeholder="დამატებითი ინფორმაცია ფასის შესახებ..."
              rows={3}
            />
          </div>

          {/* Profitability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">მოგების ანალიზი</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ხარჯები:</span>
                  <span className="font-medium ml-2">
                    {(
                      pricingData.subtotal +
                      pricingData.delivery_fee +
                      pricingData.tax_amount
                    ).toFixed(2)}
                    ₾
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">შემოსავალი:</span>
                  <span className="font-medium ml-2 text-green-600">
                    {pricingData.total_amount.toFixed(2)}₾
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">მოგება:</span>
                  <span
                    className={`font-medium ml-2 ${
                      pricingData.total_amount -
                        (pricingData.subtotal +
                          pricingData.delivery_fee +
                          pricingData.tax_amount) >=
                      0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(
                      pricingData.total_amount -
                      (pricingData.subtotal + pricingData.delivery_fee + pricingData.tax_amount)
                    ).toFixed(2)}
                    ₾
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            გაუქმება
          </Button>
          <Button onClick={handleSavePricing} disabled={loading}>
            {loading ? 'შენახვა...' : 'ფასის შენახვა'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
