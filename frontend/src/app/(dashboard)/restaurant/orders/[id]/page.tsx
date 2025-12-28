'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { orderService } from '@/lib/services/restaurant/order.service'
import { logger } from '@/lib/logger'
import { OrderStatusTimeline } from '@/components/restaurant/OrderStatusTimeline'
import { DriverInfo } from '@/components/restaurant/DriverInfo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants/georgian'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { OrderCommentSection } from '@/components/restaurant/OrderCommentSection'

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(orderId)
        setOrder(data)
      } catch (error) {
        logger.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    const subscription = orderService.subscribeToOrderStatus(orderId, (newStatus) => {
      setOrder((prev: any) => (prev ? { ...prev, status: newStatus } : prev))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return <div>შეკვეთა ვერ მოიძებნა</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">შეკვეთა #{order.id.slice(0, 8)}</h1>
        <Badge variant="outline" className="text-lg">
          {formatCurrency(order.total_amount)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>სტატუსი</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>შეკვეთის დეტალები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.product.unit} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.quantity * item.unit_price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DriverInfo driver={order.driver} />

          <Card>
            <CardHeader>
              <CardTitle>მიწოდების დეტალები</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">მისამართი:</span>
                <p className="text-muted-foreground">{order.delivery_address}</p>
              </div>
              <div>
                <span className="font-medium">ტელეფონი:</span>
                <p className="text-muted-foreground">{order.contact_phone}</p>
              </div>
              {order.special_instructions && (
                <div>
                  <span className="font-medium">კომენტარი:</span>
                  <p className="text-muted-foreground">{order.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <OrderCommentSection orderId={order.id} initialComments={order.comments} />
        </div>
      </div>
    </div>
  )
}
