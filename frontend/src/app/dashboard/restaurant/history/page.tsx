'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { OrderHistoryTable } from '@/components/restaurant/OrderHistoryTable'
import { OrderDetailModal } from '@/components/orders/OrderDetailModal'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBrowserClient } from '@/lib/supabase'
import { RestaurantOrder } from '@/types/restaurant'

// Create Supabase client instance
const supabase = createBrowserClient()

export default function RestaurantOrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  // Fetch orders
  useEffect(() => {
    if (!user) return

    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch orders with related data

        const { data, error } = await (supabase as any)
          .from('orders')
          .select(
            `
            *,
            order_items (
              *,
              products (
                name,
                unit
              )
            ),
            profiles!orders_driver_id_fkey (
              full_name
            )
          `
          )
          .eq('restaurant_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Transform data to match RestaurantOrder type

        const transformedOrders: RestaurantOrder[] = (data || []).map((order: any) => ({
          ...order,
          items: (order.order_items || []).map((item: any) => ({
            ...item,
            product_name: item.products?.name || '',
          })),
          driver_name: order.profiles?.full_name || undefined,
          total_amount: order.total_amount ?? undefined,
        }))

        setOrders(transformedOrders)
      } catch (err) {
        logger.error('Error fetching orders:', err)
        setError('Failed to load order history')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const handleViewOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const handleExport = () => {
    // Export functionality
    logger.info('Exporting orders...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading order history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground">View and manage your past orders</p>
        </div>
        <Button onClick={handleExport}>Export History</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by order ID or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="priced">Priced</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {RestaurantUtils.formatCurrency(
                orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <OrderHistoryTable onViewOrder={handleViewOrder} />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder as any}
          onClose={handleCloseModal}
          userRole="restaurant"
        />
      )}
    </div>
  )
}
