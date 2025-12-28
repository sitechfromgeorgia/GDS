/**
 * Order Form Loading Skeleton (T065)
 *
 * Loading placeholder for the OrderForm during code splitting.
 * Provides perceived performance improvement for restaurant order placement.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function OrderFormSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Delivery Address Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-20 w-full" />
          </div>

          {/* Contact Phone Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-20 w-full" />
          </div>

          {/* Submit Button */}
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
