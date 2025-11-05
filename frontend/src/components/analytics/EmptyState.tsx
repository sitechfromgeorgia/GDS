// Empty State Component
// Based on specs/001-analytics-dashboard/plan.md

import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({
  message = 'No data available for the selected filters.',
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  )
}
