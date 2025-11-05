'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Download, Eye, Filter } from 'lucide-react'
import { RestaurantOrder, OrderFilters } from '@/types/restaurant'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import { useToast } from '@/hooks/use-toast'

interface OrderHistoryTableProps {
  onViewOrder?: (order: RestaurantOrder) => void
}

export function OrderHistoryTable({ onViewOrder }: OrderHistoryTableProps) {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const itemsPerPage = 10

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await RestaurantUtils.getOrders({
        ...filters,
        search: searchQuery || undefined,
      })

      // Simple pagination (in a real app, this would be done on the backend)
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = data.slice(startIndex, endIndex)

      setOrders(paginatedData)
      setTotalPages(Math.ceil(data.length / itemsPerPage))
    } catch (error) {
      logger.error('Failed to load orders:', error)
      toast({
        title: 'შეცდომა',
        description: 'შეკვეთების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, searchQuery, toast])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleSearch = () => {
    setCurrentPage(1)
    loadOrders()
  }

  const handleStatusFilter = (status: string) => {
    const newStatus = filters.status?.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...(filters.status || []), status]

    setFilters((prev) => ({
      ...prev,
      status: newStatus.length > 0 ? newStatus : undefined,
    }))
    setCurrentPage(1)
  }

  const handleExportOrders = () => {
    // Simple CSV export
    const csvData = orders.map((order) => ({
      'შეკვეთის ID': order.id,
      სტატუსი: order.status,
      თანხა: order.total_amount,
      მისამართი: order.delivery_address,
      'შექმნის დრო': RestaurantUtils.formatDate(order.created_at),
      'განახლების დრო': RestaurantUtils.formatDate(order.updated_at),
    }))

    if (csvData.length === 0) {
      return
    }

    const csvString = [
      Object.keys(csvData[0]!).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n')

    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'ექსპორტი დასრულებულია',
      description: 'შეკვეთები ექსპორტირებულია CSV ფაილში',
    })
  }

  const getStatusBadgeVariant = (status: RestaurantOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'priced':
        return 'outline'
      case 'assigned':
        return 'secondary'
      case 'out_for_delivery':
        return 'default'
      case 'delivered':
        return 'default'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ფილტრები და ძიება
          </CardTitle>
          <CardDescription>გაფილტრეთ და მოძებნეთ შეკვეთები</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="მისამართი ან შეკვეთის ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleExportOrders}>
              <Download className="h-4 w-4 mr-2" />
              ექსპორტი
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'pending',
              'confirmed',
              'priced',
              'assigned',
              'out_for_delivery',
              'delivered',
              'completed',
              'cancelled',
            ].map((status) => (
              <Button
                key={status}
                variant={filters.status?.includes(status) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>შეკვეთების ისტორია</CardTitle>
          <CardDescription>ყველა შეკვეთის დეტალური სია</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">შეკვეთები არ მოიძებნა</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>შეკვეთის ID</TableHead>
                    <TableHead>სტატუსი</TableHead>
                    <TableHead>თანხა</TableHead>
                    <TableHead>მისამართი</TableHead>
                    <TableHead>შექმნის დრო</TableHead>
                    <TableHead>მოქმედებები</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {RestaurantUtils.formatCurrency(order.total_amount ?? 0)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{order.delivery_address}</TableCell>
                      <TableCell>{RestaurantUtils.formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => onViewOrder?.(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          ნახვა
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
