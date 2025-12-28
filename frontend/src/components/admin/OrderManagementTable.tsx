'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Eye, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

type Order = Database['public']['Tables']['orders']['Row'] & {
  restaurants?: { full_name: string | null } | null
  drivers?: { full_name: string | null } | null
  restaurant_name?: string
  driver_name?: string
}

import type { OrderStatus } from '@/types/database'

// Create Supabase client instance
const supabase = createBrowserClient()

interface OrderManagementTableProps {
  searchTerm: string
  statusFilter: string
  dateRange: { from?: Date; to?: Date }
  onViewOrder: (order: Order) => void
  onEditPricing: (order: Order) => void
}

export function OrderManagementTable({
  searchTerm,
  statusFilter,
  dateRange,
  onViewOrder,
  onEditPricing,
}: OrderManagementTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const itemsPerPage = 20

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase.from('orders').select(
        `
          *,
          restaurants:profiles!restaurant_id(full_name),
          drivers:profiles!driver_id(full_name)
        `,
        { count: 'exact' }
      )

      // Apply search filter
      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,delivery_address.ilike.%${searchTerm}%`)
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply date range filter
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString().split('T')[0])
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString().split('T')[0])
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      // Explicitly type the query result to fix TypeScript inference issues
      type QueryResult = Array<
        Database['public']['Tables']['orders']['Row'] & {
          restaurants?: { full_name: string | null } | null
          drivers?: { full_name: string | null } | null
        }
      >

      const formattedOrders = ((data as QueryResult) || []).map((order) => ({
        ...order,
        restaurant_name: order.restaurants?.full_name,
        driver_name: order.drivers?.full_name,
      })) as Order[]

      setOrders(formattedOrders)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      logger.error('Error fetching orders:', error)
      toast({
        title: 'შეცდომა',
        description: 'შეკვეთების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, dateRange, currentPage, sortBy, sortOrder, toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId])
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((o) => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      const { error } = await (supabase.from('orders') as any).update(updateData).eq('id', orderId)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'შეკვეთის სტატუსი განახლდა',
      })

      fetchOrders()
    } catch (error) {
      logger.error('Error updating order status:', error)
      toast({
        title: 'შეცდომა',
        description: 'სტატუსის განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      const { error } = await (supabase.from('orders') as any)
        .update(updateData)
        .in('id', selectedOrders)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: `${selectedOrders.length} შეკვეთის სტატუსი განახლდა`,
      })

      fetchOrders()
      setSelectedOrders([])
    } catch (error) {
      logger.error('Error bulk updating orders:', error)
      toast({
        title: 'შეცდომა',
        description: 'შეკვეთების განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const getPriorityColor = (order: Order) => {
    const createdAt = new Date(order.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 2 && order.status === 'pending') return 'destructive'
    if (hoursDiff > 1 && ['confirmed', 'priced'].includes(order.status)) return 'warning'
    return 'default'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">არჩეულია {selectedOrders.length} შეკვეთა</span>
          <Select onValueChange={(value) => handleBulkStatusUpdate(value as OrderStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="სტატუსის შეცვლა" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">დადასტურება</SelectItem>
              <SelectItem value="priced">ფასდადება</SelectItem>
              <SelectItem value="assigned">მინიჭება</SelectItem>
              <SelectItem value="out_for_delivery">გატანილია</SelectItem>
              <SelectItem value="delivered">მიტანილია</SelectItem>
              <SelectItem value="cancelled">გაუქმება</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>შეკვეთა</TableHead>
              <TableHead>მომხმარებელი</TableHead>
              <TableHead>რესტორანი</TableHead>
              <TableHead>მძღოლი</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('total_amount')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  ფასი
                </Button>
              </TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('created_at')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  შექმნილია
                </Button>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const priorityColor = getPriorityColor(order)

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked: boolean) => handleSelectOrder(order.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ka })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.delivery_address || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.delivery_time || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.restaurant_name || 'არ არის მითითებული'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.driver_name || 'არ არის მინიჭებული'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.total_amount ? `${order.total_amount}₾` : 'ფასი არ არის დადასტურებული'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value as OrderStatus)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">მოლოდინში</SelectItem>
                          <SelectItem value="confirmed">დადასტურებული</SelectItem>
                          <SelectItem value="priced">ფასდადებული</SelectItem>
                          <SelectItem value="assigned">მინიჭებული</SelectItem>
                          <SelectItem value="out_for_delivery">გატანილია</SelectItem>
                          <SelectItem value="delivered">მიტანილია</SelectItem>
                          <SelectItem value="completed">დასრულებული</SelectItem>
                          <SelectItem value="cancelled">გაუქმებული</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge
                        variant={
                          priorityColor === 'destructive'
                            ? 'destructive'
                            : priorityColor === 'warning'
                              ? 'secondary'
                              : 'default'
                        }
                        className="ml-2"
                      >
                        {priorityColor === 'destructive' && 'სასწრაფო'}
                        {priorityColor === 'warning' && 'საშუალო'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ka })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'HH:mm', { locale: ka })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewOrder(order)}>
                          <Eye className="mr-2 h-4 w-4" />
                          ნახვა
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditPricing(order)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          ფასის რედაქტირება
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            გვერდი {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              წინა
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              შემდეგი
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
