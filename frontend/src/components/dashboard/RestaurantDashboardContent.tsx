'use client'
import { logger } from '@/lib/logger'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
} from 'lucide-react'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import { RestaurantMetrics, RestaurantOrder } from '@/types/restaurant'
import { useToast } from '@/hooks/use-toast'

export function RestaurantDashboardContent() {
  const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [metricsData, ordersData] = await Promise.all([
        RestaurantUtils.getRestaurantMetrics(),
        RestaurantUtils.getOrders({ status: ['pending', 'confirmed', 'priced'] }),
      ])

      setMetrics(metricsData)
      setRecentOrders(ordersData.slice(0, 5))
    } catch (error) {
      logger.error('Failed to load dashboard data:', error)
      toast({
        title: 'შეცდომა',
        description: 'დეშბორდის მონაცემების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const getStatusIcon = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'priced':
        return <Package className="h-4 w-4" />
      case 'assigned':
        return <CheckCircle className="h-4 w-4" />
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-1" />
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მთლიანი შეკვეთები</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.pending_orders || 0} მომლოდინე
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დასრულებული</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completed_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.total_orders
                ? Math.round((metrics.completed_orders / metrics.total_orders) * 100)
                : 0}
              % წარმატებული
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო შეკვეთა</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {RestaurantUtils.formatCurrency(metrics?.average_order_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground">საშუალო ღირებულება</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მიწოდების დრო</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.delivery_performance.average_delivery_time || 0}წთ
            </div>
            <p className="text-xs text-muted-foreground">საშუალო დრო</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">მიმდინარე შეკვეთები</TabsTrigger>
          <TabsTrigger value="analytics">ანალიტიკა</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ბოლო შეკვეთები</CardTitle>
              <CardDescription>უახლესი შეკვეთების სტატუსი და დეტალები</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">შეკვეთები არ არის</div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium">შეკვეთა #{order.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {RestaurantUtils.formatCurrency(order.total_amount || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{order.status}</Badge>
                        <Button variant="outline" size="sm">
                          დეტალები
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>პოპულარული პროდუქტები</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.most_ordered_products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">მონაცემები არ არის</div>
                ) : (
                  <div className="space-y-2">
                    {metrics?.most_ordered_products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{product.product_name}</span>
                        <Badge variant="secondary">{product.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>მიწოდების შესრულება</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">დროული მიწოდება</span>
                    <span className="font-medium">
                      {metrics?.delivery_performance.on_time_deliveries || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">დაგვიანებული</span>
                    <span className="font-medium text-destructive">
                      {metrics?.delivery_performance.late_deliveries || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">საშუალო დრო</span>
                    <span className="font-medium">
                      {metrics?.delivery_performance.average_delivery_time || 0} წთ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
