'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
  TableCaption,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ORDER_STATUSES, USER_ROLES } from '@/constants'
import { useAuth } from '@/hooks/useAuth'

// Create Supabase client instance
const supabase = createBrowserClient()

// Define Supabase realtime payload type
interface SupabaseRealtimePayload {
  new: { id: string; status: string }
  old?: { id: string; status?: string }
}

type Order = Database['public']['Tables']['orders']['Row']
type OrderWithDetails = Order & {
  restaurant?: Database['public']['Tables']['profiles']['Row']
  driver?: Database['public']['Tables']['profiles']['Row']
  items?: Database['public']['Tables']['order_items'][]
}

interface OrderTableProps {
  orders: OrderWithDetails[]
  userRole: 'admin' | 'restaurant' | 'driver' | 'demo'
  onOrderUpdate?: (orderId: string, newStatus: string) => void
  onOrderSelect?: (order: OrderWithDetails) => void
  showActions?: boolean
  loading?: boolean
}

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-primary/10 text-primary',
  priced: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  assigned: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებულია',
  priced: 'ფასირებულია',
  assigned: 'მინიჭებულია',
  out_for_delivery: 'გზაშია',
  delivered: 'მიწოდებულია',
  completed: 'დასრულებულია',
  cancelled: 'გაუქმებულია',
}

export function OrderTable({
  orders,
  userRole,
  onOrderUpdate,
  onOrderSelect,
  showActions = true,
  loading = false,
}: OrderTableProps) {
  const { user } = useAuth()

  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  const handleOrderSelect = (order: OrderWithDetails) => {
    // Toggle selection state
    const newSelectedOrders = new Set(selectedOrders)
    if (newSelectedOrders.has(order.id)) {
      newSelectedOrders.delete(order.id)
    } else {
      newSelectedOrders.add(order.id)
    }
    setSelectedOrders(newSelectedOrders)

    if (onOrderSelect) {
      onOrderSelect(order)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (onOrderUpdate) {
      onOrderUpdate(orderId, newStatus)
    }
  }

  const getStatusBadge = (status: string) => {
    const colorClass =
      statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
    const label = statusLabels[status as keyof typeof statusLabels] || status

    return (
      <Badge className={colorClass} variant="secondary">
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '₾0.00'
    return `₾${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canUpdateStatus = (order: OrderWithDetails) => {
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return true // Admin can update any status
      case USER_ROLES.RESTAURANT:
        return order.status === 'delivered' // Restaurant can only mark as completed
      case USER_ROLES.DRIVER:
        return ['assigned', 'out_for_delivery'].includes(order.status) // Driver can update delivery status
      default:
        return false
    }
  }

  const getAvailableStatuses = (order: OrderWithDetails) => {
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return Object.entries(ORDER_STATUSES).filter(
          ([key]) => key !== 'pending' && key !== 'confirmed'
        )
      case USER_ROLES.RESTAURANT:
        if (order.status === 'delivered') {
          return [['completed', ORDER_STATUSES.COMPLETED]]
        }
        return []
      case USER_ROLES.DRIVER:
        if (order.status === 'assigned') {
          return [['out_for_delivery', ORDER_STATUSES.OUT_FOR_DELIVERY]]
        }
        if (order.status === 'out_for_delivery') {
          return [['delivered', ORDER_STATUSES.DELIVERED]]
        }
        return []
      default:
        return []
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>შეკრიებები ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            ბოლოდების სტატუსის შეკრიებების
            {userRole === USER_ROLES.RESTAURANT && ' • დაჭრების მიღებეთ'}
            {userRole === USER_ROLES.DRIVER && ' • მიტყვილებების'}
            {userRole === USER_ROLES.ADMIN && ' • სრული მართვებება'}
            {userRole === 'demo' && ' • დემო რეჟიმი'}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>შეკრიების #</TableHead>
              <TableHead>რესტორანი</TableHead>
              <TableHead>მძღოლი</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead>თანხა</TableHead>
              <TableHead>შექმნილია</TableHead>
              <TableHead>განახლებულია</TableHead>
              <TableHead>შენიშვნები</TableHead>
              {showActions && <TableHead>მოქმენებები</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className={`cursor-pointer hover:bg-muted/50 ${
                  selectedOrders.has(order.id) ? 'bg-muted' : ''
                }`}
                onClick={() => handleOrderSelect(order)}
              >
                <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                <TableCell>{order.restaurant?.restaurant_name || '-'}</TableCell>
                <TableCell>{order.driver?.full_name || '-'}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
                <TableCell>
                  {order.updated_at !== order.created_at && formatDate(order.updated_at)}
                </TableCell>
                <TableCell>
                  {order.notes ? (
                    <div className="max-w-xs truncate" title={order.notes}>
                      {order.notes}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                {showActions && (
                  <TableCell>
                    {canUpdateStatus(order) && (
                      <div className="flex gap-2">
                        {getAvailableStatuses(order).map(
                          ([statusKey, statusValue]) =>
                            statusValue && (
                              <Button
                                key={statusKey}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, statusValue)}
                                disabled={userRole === 'demo'}
                              >
                                {statusLabels[statusKey as keyof typeof statusLabels]}
                              </Button>
                            )
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
