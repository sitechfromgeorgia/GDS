'use client'

import { useState, Suspense, lazy } from 'react'
import { OrderManagementTableSkeleton } from '@/components/admin/OrderManagementTableSkeleton'
import { useRouter } from 'next/navigation'
import { addDays } from 'date-fns'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load OrderManagementTable
// Why: Large component with complex order management, filtering, and status updates (~11-13 KB)
// Expected impact: 12-15% bundle reduction for admin orders page
const OrderManagementTable = lazy(() =>
  import('@/components/admin/OrderManagementTable').then((m) => ({
    default: m.OrderManagementTable,
  }))
)

export default function AdminOrdersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, _setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })

  const handleViewOrder = (order: any) => {
    router.push(`/admin/orders/${order.id}`)
  }

  const handleEditPricing = (order: any) => {
    // Open pricing dialog or navigate
    logger.info('Edit pricing for', { orderId: order.id })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">შეკვეთების მართვა</h1>
        <Button
          onClick={() => router.push('/admin/orders/live')}
          variant="outline"
          className="gap-2"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live რეჟიმი
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Filters can be added here if moved out of the table component, 
            but currently OrderManagementTable handles its own filters internally 
            or accepts them as props. 
            
            The current OrderManagementTable accepts filters as props, so we need controls here.
        */}
        <input
          type="text"
          placeholder="ძებნა..."
          className="p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="p-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">ყველა სტატუსი</option>
          <option value="pending">მოლოდინში</option>
          <option value="confirmed">დადასტურებული</option>
          <option value="priced">ფასდადებული</option>
          <option value="assigned">მინიჭებული</option>
          <option value="out_for_delivery">გატანილია</option>
          <option value="delivered">მიტანილია</option>
          <option value="completed">დასრულებული</option>
          <option value="cancelled">გაუქმებული</option>
        </select>
      </div>

      <Suspense fallback={<OrderManagementTableSkeleton />}>
        <OrderManagementTable
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          dateRange={dateRange}
          onViewOrder={handleViewOrder}
          onEditPricing={handleEditPricing}
        />
      </Suspense>
    </div>
  )
}
