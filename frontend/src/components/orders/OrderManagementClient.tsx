'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { OrderDetailModal } from './OrderDetailModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

// Create Supabase client instance
const supabase = createBrowserClient()

type Order = Database['public']['Tables']['orders']['Row']
type OrderWithDetails = Order & {
  restaurant: {
    full_name: string | null
    email: string | null
    phone: string | null
    restaurant_name: string | null
  } | null
  driver: {
    full_name: string | null
    phone: string | null
  } | null
  items: Array<
    Database['public']['Tables']['order_items']['Row'] & {
      product: {
        name: string
        image_url: string | null
      } | null
    }
  >
}

interface OrderManagementClientProps {
  user: Database['public']['Tables']['profiles']['Row']
  role: string
}

export function OrderManagementClient({ user, role }: OrderManagementClientProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [pricingOrder, setPricingOrder] = useState<OrderWithDetails | null>(null)

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          restaurant:profiles!orders_restaurant_id_fkey(full_name, email, phone, restaurant_name),
          driver:profiles!orders_driver_id_fkey(full_name, phone),
          items:order_items(
            *,
            product:products(name, image_url)
          )
        `
        )
        .order('created_at', { ascending: false })

      // Apply role-based filtering
      if (role === 'restaurant') {
        query = query.eq('restaurant_id', user.id)
      } else if (role === 'driver') {
        query = query.or(`driver_id.eq.${user.id},and(status.eq.pending,driver_id.is.null)`)
      }
      // Admin sees all orders

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching orders:', error)
      } else {
        setOrders((data as OrderWithDetails[]) || [])
      }
    } catch (error) {
      logger.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant?.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  // Handle order details
  const handleOrderDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  // Handle pricing
  const handlePricing = (order: OrderWithDetails) => {
    setPricingOrder(order)
    setIsPricingModalOpen(true)
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'preparing':
        return 'default'
      case 'ready':
        return 'default'
      case 'in_delivery':
        return 'default'
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'preparing':
        return <Package className="h-4 w-4" />
      case 'ready':
        return <Package className="h-4 w-4" />
      case 'in_delivery':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-600">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {role === 'admin' && (
          <Button onClick={() => (window.location.href = '/orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  id="search"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="in_delivery">In Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'admin' && selectedOrders.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedOrders.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {role === 'admin' && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedOrders(filteredOrders.map((order) => order.id))
                          } else {
                            setSelectedOrders([])
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Order ID</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    {role === 'admin' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleOrderSelect(order.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {order.restaurant?.restaurant_name || order.restaurant?.full_name}
                        </p>
                        <p className="text-sm text-gray-500">{order.restaurant?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.driver ? (
                        <div>
                          <p className="font-medium">{order.driver.full_name}</p>
                          <p className="text-sm text-gray-500">{order.driver.phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(order.status)}
                        className="flex items-center gap-2"
                      >
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>₾{order.total_amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOrderDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        {role === 'admin' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handlePricing(order)}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailModal
              order={selectedOrder as any}
              onClose={() => setIsDetailModalOpen(false)}
              userRole={role}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Pricing Modal (Admin only) */}
      <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Order Pricing</DialogTitle>
          </DialogHeader>
          {pricingOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cost-price" className="block text-sm font-medium mb-1">
                    Cost Price
                  </label>
                  <Input id="cost-price" type="number" step="0.01" placeholder="Enter cost price" />
                </div>
                <div>
                  <label htmlFor="selling-price" className="block text-sm font-medium mb-1">
                    Selling Price
                  </label>
                  <Input
                    id="selling-price"
                    type="number"
                    step="0.01"
                    placeholder="Enter selling price"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Order Items</h4>
                <div className="space-y-2">
                  {pricingOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded"
                    >
                      <div>
                        <p className="font-medium">{(item as any).product?.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₾{item.selling_price?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-500">
                          Total: ₾
                          {item.selling_price
                            ? (item.selling_price * item.quantity).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsPricingModalOpen(false)}>
                  Cancel
                </Button>
                <Button>Save Pricing</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
