// Analytics Dashboard Page
// Based on specs/001-analytics-dashboard/plan.md

'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { KPICard } from '@/components/analytics/KPICard'
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter'
import { StatusFilter } from '@/components/analytics/StatusFilter'
import { ExportButton } from '@/components/analytics/ExportButton'
import { EmptyState } from '@/components/analytics/EmptyState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { KPICardData } from '@/types/analytics'

export default function AnalyticsPage() {
  const {
    filters,
    kpiData,
    isLoadingKPIs,
    kpiError,
    showPerformanceWarning,
    updateDateRange,
    updateStatus,
    exportCSV,
    isExporting,
    exportError,
  } = useAnalytics()

  // Transform KPI data into card format
  const kpiCards: KPICardData[] = [
    {
      label: 'Orders per Day',
      value: kpiData?.orders_per_day ?? 'N/A',
      unit: 'orders/day',
      tooltip: 'Average number of orders per calendar day in selected range',
      isLoading: isLoadingKPIs,
      error: kpiError ? 'Failed to load' : undefined,
    },
    {
      label: 'On-time Delivery Rate',
      value:
        kpiData?.on_time_rate !== null && kpiData?.on_time_rate !== undefined
          ? `${kpiData.on_time_rate}%`
          : 'N/A',
      unit: kpiData?.on_time_rate !== null ? 'of delivered orders' : undefined,
      tooltip: 'Percentage of orders delivered within 30 minutes of promised window',
      isLoading: isLoadingKPIs,
      error: kpiError ? 'Failed to load' : undefined,
    },
    {
      label: 'Average Delivery Time',
      value: kpiData?.avg_delivery_time ?? 'N/A',
      unit: kpiData?.avg_delivery_time !== null ? 'minutes' : undefined,
      tooltip: 'Average time from order creation to delivery completion',
      isLoading: isLoadingKPIs,
      error: kpiError ? 'Failed to load' : undefined,
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Key performance indicators for operations management
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-start">
        <DateRangeFilter value={filters.dateRange} onChange={updateDateRange} />
        <StatusFilter value={filters.status} onChange={updateStatus} />
        <ExportButton onClick={exportCSV} isExporting={isExporting} />
      </div>

      {/* Performance Warning */}
      {showPerformanceWarning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Large date range may impact performance. Consider narrowing your selection to less than
            90 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Export Error */}
      {exportError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to export data:{' '}
            {exportError instanceof Error ? exportError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      {!isLoadingKPIs && !kpiError && kpiData?.total_orders === 0 ? (
        <EmptyState message="No orders found for the selected date range and filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {kpiCards.map((card, index) => (
            <KPICard key={index} data={card} />
          ))}
        </div>
      )}

      {/* Excluded Orders Notice */}
      {kpiData && kpiData.excluded_count > 0 && (
        <Alert>
          <AlertDescription>
            {kpiData.excluded_count} order{kpiData.excluded_count > 1 ? 's' : ''} excluded from
            calculations due to incomplete data.
          </AlertDescription>
        </Alert>
      )}

      {/* Meta Information */}
      {kpiData && (
        <div className="text-sm text-muted-foreground">
          Showing {kpiData.total_orders} order{kpiData.total_orders !== 1 ? 's' : ''} from{' '}
          {new Date(kpiData.date_range.from).toLocaleDateString()} to{' '}
          {new Date(kpiData.date_range.to).toLocaleDateString()}
          {kpiData.filters.status && kpiData.filters.status.length > 0 && (
            <>
              {' '}
              (filtered by {kpiData.filters.status.length} status
              {kpiData.filters.status.length > 1 ? 'es' : ''})
            </>
          )}
        </div>
      )}
    </div>
  )
}
