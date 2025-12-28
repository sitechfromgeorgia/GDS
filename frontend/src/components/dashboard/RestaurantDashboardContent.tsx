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
  Loader2,
} from 'lucide-react'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import type { RestaurantMetrics, RestaurantOrder } from '@/types/restaurant'
import { useToast } from '@/hooks/use-toast'
import { loadPaginatedOrders } from '@/app/dashboard/restaurant/actions'

export function RestaurantDashboardContent({ isDemo = false }: { isDemo?: boolean }) {
  const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    if (isDemo) {
      // Simulate a small delay for realism
      setTimeout(() => {
        setMetrics({
          total_orders: 150,
          total_spent: 4500,
          pending_orders: 5,
          completed_orders: 145,
          average_order_value: 30,
          most_ordered_products: [
            { product_name: 'Khinkali', quantity: 500 },
            { product_name: 'Khachapuri', quantity: 200 },
            { product_name: 'Badrijani', quantity: 150 },
          ],
          delivery_performance: {
            average_delivery_time: 25,
            on_time_deliveries: 147,
            late_deliveries: 3,
          },
        })
        setRecentOrders([
          {
            id: '1',
            status: 'delivered',
            total_amount: 120,
            created_at: new Date().toISOString(),
            items: [],
          },
          {
            id: '2',
            status: 'processing',
            total_amount: 85,
            created_at: new Date().toISOString(),
            items: [],
          },
          {
            id: '3',
            status: 'pending',
            total_amount: 200,
            created_at: new Date().toISOString(),
            items: [],
          },
        ] as any)
        setLoading(false)
      }, 500)
      return
    }

    try {
      setLoading(true)

      // T017: Load metrics and PAGINATED orders (using optimized query)
      const [metricsData, ordersResult] = await Promise.all([
        RestaurantUtils.getRestaurantMetrics(),
        loadPaginatedOrders({
          status: ['pending', 'confirmed', 'priced'],
          limit: 5, // Show 5 recent orders on dashboard
        }),
      ])

      setMetrics(metricsData)

      if (ordersResult.success && ordersResult.data) {
        const { items, nextCursor: cursor, hasMore: more } = ordersResult.data
        // Transform paginated items to RestaurantOrder format
        const orders = items.map((item) => ({
          ...item,
          items:
            item.order_items?.map((oi) => ({
              ...oi,
              product_name: oi.products?.name ?? '',
            })) ?? [],
        })) as unknown as RestaurantOrder[]
        setRecentOrders(orders)
        setNextCursor(cursor)
        setHasMore(more)
      } else {
        throw new Error(ordersResult.error || 'Failed to load orders')
      }
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
  }, [toast, isDemo])

  // T017: Load more orders function (cursor-based pagination)
  const loadMoreOrders = useCallback(async () => {
    if (!nextCursor || loadingMore || isDemo) return

    try {
      setLoadingMore(true)

      const result = await loadPaginatedOrders({
        status: ['pending', 'confirmed', 'priced'],
        limit: 5,
        cursor: nextCursor,
      })

      if (result.success && result.data) {
        const { items, nextCursor: cursor, hasMore: more } = result.data
        // Transform paginated items to RestaurantOrder format
        const newOrders = items.map((item) => ({
          ...item,
          items:
            item.order_items?.map((oi) => ({
              ...oi,
              product_name: oi.products?.name ?? '',
            })) ?? [],
        })) as unknown as RestaurantOrder[]
        setRecentOrders((prev: RestaurantOrder[]) => [...prev, ...newOrders])
        setNextCursor(cursor)
        setHasMore(more)
      } else {
        throw new Error(result.error || 'Failed to load more orders')
      }
    } catch (error) {
      logger.error('Failed to load more orders:', error)
      toast({
        title: 'შეცდომა',
        description: 'დამატებითი შეკვეთების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loadingMore, toast, isDemo])

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

                  {/* T017: Load More button for cursor-based pagination */}
                  {!isDemo && hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button onClick={loadMoreOrders} disabled={loadingMore} variant="outline">
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            იტვირთება...
                          </>
                        ) : (
                          'მეტის ნახვა'
                        )}
                      </Button>
                    </div>
                  )}
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
                {!metrics?.most_ordered_products?.length ? (
                  <div className="text-center py-8 text-muted-foreground">მონაცემები არ არის</div>
                ) : (
                  <div className="space-y-2">
                    {metrics?.most_ordered_products?.map((product, index) => (
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
                      {metrics?.delivery_performance?.on_time_deliveries || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">დაგვიანებული</span>
                    <span className="font-medium text-destructive">
                      {metrics?.delivery_performance?.late_deliveries || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">საშუალო დრო</span>
                    <span className="font-medium">
                      {metrics?.delivery_performance?.average_delivery_time || 0} წთ
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
