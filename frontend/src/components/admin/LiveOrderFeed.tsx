'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, Clock, User, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row'] & {
  restaurants: { full_name: string | null } | null
  drivers: { full_name: string | null } | null
}

export function LiveOrderFeed() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  const router = useRouter()

  const fetchActiveOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          restaurants:profiles!restaurant_id(full_name),
          drivers:profiles!driver_id(full_name)
        `
        )
        .in('status', ['pending', 'confirmed', 'priced', 'assigned', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setOrders(data as unknown as Order[])
    } catch (error) {
      console.error('Error fetching live orders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchActiveOrders()
  }, [fetchActiveOrders])

  // Subscribe to real-time updates
  useRealtimeDashboard(fetchActiveOrders)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive'
      case 'confirmed':
        return 'default'
      case 'priced':
        return 'secondary'
      case 'assigned':
        return 'outline'
      case 'out_for_delivery':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'მოლოდინში'
      case 'confirmed':
        return 'დადასტურებული'
      case 'priced':
        return 'ფასდადებული'
      case 'assigned':
        return 'მინიჭებული'
      case 'out_for_delivery':
        return 'გატანილია'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), 'HH:mm', { locale: ka })}
                  </span>
                </div>
                <Badge variant={getStatusColor(order.status) as any}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="line-clamp-1">
                  {order.restaurants?.full_name || 'უცნობი რესტორანი'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="line-clamp-2">{order.delivery_address}</span>
              </div>
              {order.total_amount > 0 && (
                <div className="font-medium text-lg pt-2">{order.total_amount.toFixed(2)}₾</div>
              )}
              <Button
                className="w-full mt-2"
                variant="secondary"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                დეტალები <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {orders.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">აქტიური შეკვეთები არ არის</div>
      )}
    </div>
  )
}
