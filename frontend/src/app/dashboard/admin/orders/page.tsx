'use client'

import { useState, Suspense, lazy } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, Filter, Search, Clock, CheckCircle, Truck } from 'lucide-react'
import { OrderManagementTableSkeleton } from '@/components/admin/OrderManagementTableSkeleton'
import { OrderPricingModal } from '@/components/admin/OrderPricingModal'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import type { Database } from '@/types/database'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load OrderManagementTable
// Why: Large table component with date-fns dependency (~3-5 KB) + complex data handling (~12 KB total)
// Expected impact: 10-15% bundle reduction for admin orders page
const OrderManagementTable = lazy(() =>
  import('@/components/admin/OrderManagementTable').then((m) => ({
    default: m.OrderManagementTable,
  }))
)

// TypeScript interfaces
interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderStatus {
  status: string
  timestamp: string
  note?: string
}

interface OrderPricingItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

// Use the database Order type extended with additional fields for display
type OrderWithDetails = Database['public']['Tables']['orders']['Row'] & {
  restaurants?: { name: string } | null
  drivers?: { full_name: string } | null
  restaurant_name?: string
  driver_name?: string
  // Additional display fields
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  delivery_date?: string
  items?: unknown[]
  status_history?: OrderStatus[]
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const { toast } = useToast()

  const handleExportOrders = () => {
    toast({
      title: 'ექსპორტი',
      description: 'შეკვეთების ექსპორტი მიმდინარეობს...',
    })
  }

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order)
  }

  const handleEditPricing = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setShowPricingModal(true)
  }

  const handlePricingModalClose = () => {
    setShowPricingModal(false)
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">შეკვეთების მართვა</h1>
          <p className="text-muted-foreground">მართეთ შეკვეთები, სტატუსები და მიწოდება</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ შეკვეთები</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> წინა თვესთან შედარებით
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მოლოდინში</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">დამუშავების მოლოდინში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მზადება</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">რესტორნებში მზადდება</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მიტანა</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">გზაშია</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დასრულებული</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,167</div>
            <p className="text-xs text-muted-foreground">წარმატებით დასრულებული</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>ფილტრები და ძიება</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="შეკვეთის ID, მომხმარებლის სახელი..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="სტატუსი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ყველა სტატუსი</SelectItem>
                  <SelectItem value="pending">მოლოდინში</SelectItem>
                  <SelectItem value="confirmed">დადასტურებული</SelectItem>
                  <SelectItem value="preparing">მზადება</SelectItem>
                  <SelectItem value="ready">მზადაა</SelectItem>
                  <SelectItem value="picked_up">გატანილია</SelectItem>
                  <SelectItem value="delivered">მიტანილია</SelectItem>
                  <SelectItem value="cancelled">გაუქმებული</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd', { locale: ka })} -{' '}
                          {format(dateRange.to, 'LLL dd', { locale: ka })}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y', { locale: ka })
                      )
                    ) : (
                      'თარიღის შერჩევა'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || undefined)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                დამატებითი
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>შეკვეთები</CardTitle>
          <CardDescription>მართეთ შეკვეთების სია, სტატუსები და დეტალები</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrderManagementTableSkeleton />}>
            <OrderManagementTable
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              dateRange={dateRange || {}}
              onViewOrder={handleViewOrder as any}
              onEditPricing={handleEditPricing as any}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={Boolean(selectedOrder) && !showPricingModal}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>შეკვეთის დეტალები #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>შეკვეთის სრული ინფორმაცია და ისტორია</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">მომხმარებელი</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">მიწოდება</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.delivery_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.delivery_time} - {selectedOrder.delivery_date}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">პროდუქტები</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedOrder.items as OrderItem[])?.map((item: OrderItem, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            რაოდენობა: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{item.price * item.quantity}₾</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="font-bold">სულ:</p>
                      <p className="font-bold text-lg">{selectedOrder.total_amount}₾</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Status History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">სტატუსის ისტორია</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedOrder.status_history?.map((status: OrderStatus, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <Badge variant="outline">{status.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(status.timestamp), 'PPP p', { locale: ka })}
                        </span>
                        {status.note && <span className="text-sm">{status.note}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pricing Modal */}
      <OrderPricingModal
        order={selectedOrder as unknown as any}
        open={showPricingModal}
        onClose={handlePricingModalClose}
      />
    </div>
  )
}
