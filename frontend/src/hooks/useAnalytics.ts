// Custom hook for Analytics Dashboard state management
// Uses Zustand for filter state and TanStack Query for data fetching

import { useQuery, useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import type { KPISummary, DateRange, OrderStatus, AnalyticsFilters } from '@/types/analytics'
import { isLargeDateRange } from '@/lib/validators/analytics'

interface UseAnalyticsOptions {
  initialDateRange?: DateRange
  initialStatus?: OrderStatus[]
}

export function useAnalytics(options?: UseAnalyticsOptions) {
  // Default to last 7 days
  const defaultFrom = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString()
  }, [])

  const defaultTo = useMemo(() => new Date().toISOString(), [])

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: options?.initialDateRange || { from: defaultFrom, to: defaultTo },
    status: options?.initialStatus || [],
  })

  // Fetch KPIs with TanStack Query
  const {
    data: kpiData,
    isLoading: isLoadingKPIs,
    error: kpiError,
    refetch: refetchKPIs,
  } = useQuery<KPISummary>({
    queryKey: ['analytics', 'kpis', filters.dateRange, filters.status],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      })

      if (filters.status.length > 0) {
        params.set('status', filters.status.join(','))
      }

      const response = await fetch(`/api/analytics/kpis?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch KPIs')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  })

  // Export CSV mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      })

      if (filters.status.length > 0) {
        params.set('status', filters.status.join(','))
      }

      const response = await fetch(`/api/analytics/export?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to export data')
      }

      // Download CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })

  // Update date range
  const updateDateRange = useCallback((dateRange: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange }))
  }, [])

  // Update status filter
  const updateStatus = useCallback((status: OrderStatus[]) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: { from: defaultFrom, to: defaultTo },
      status: [],
    })
  }, [defaultFrom, defaultTo])

  // Check if date range is large (for performance warning)
  const showPerformanceWarning = useMemo(
    () => isLargeDateRange(filters.dateRange.from, filters.dateRange.to),
    [filters.dateRange]
  )

  return {
    // State
    filters,
    kpiData,
    isLoadingKPIs,
    kpiError,
    showPerformanceWarning,

    // Actions
    updateDateRange,
    updateStatus,
    resetFilters,
    refetchKPIs,
    exportCSV: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
  }
}
