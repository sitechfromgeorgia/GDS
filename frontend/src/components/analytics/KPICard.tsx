// KPI Card Component - Display individual KPI metrics
// Based on specs/001-analytics-dashboard/plan.md

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KPICardData } from '@/types/analytics'

interface KPICardProps {
  data: KPICardData
}

export function KPICard({ data }: KPICardProps) {
  const { label, value, unit, tooltip, isLoading, error } = data

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          {unit && <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1" />}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  const displayValue = value !== null && value !== undefined ? value : 'N/A'

  return (
    <Card title={tooltip}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {unit && <p className="text-xs text-muted-foreground mt-1">{unit}</p>}
      </CardContent>
    </Card>
  )
}
