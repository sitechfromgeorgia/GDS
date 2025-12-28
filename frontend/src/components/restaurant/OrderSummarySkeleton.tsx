/**
 * Order Summary Loading Skeleton (T065)
 *
 * Loading placeholder for the OrderSummary during code splitting.
 * Provides perceived performance improvement for cart summary display.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function OrderSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[160px]" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t my-4" />

        {/* Total */}
        <div className="flex justify-between">
          <Skeleton className="h-6 w-[60px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
      </CardContent>
    </Card>
  )
}
