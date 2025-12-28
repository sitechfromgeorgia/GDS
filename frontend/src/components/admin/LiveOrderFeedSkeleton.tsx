import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * LiveOrderFeedSkeleton
 * Loading skeleton for LiveOrderFeed component
 *
 * Matches structure:
 * - Live indicator header
 * - 5 order cards with:
 *   - Order ID + timestamp
 *   - Status badge
 *   - Customer info
 *   - Order items list
 */
export function LiveOrderFeedSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </div>
          <Skeleton className="h-5 w-32" /> {/* "Updating..." text */}
        </div>
        <Skeleton className="h-8 w-24" /> {/* Refresh button */}
      </div>

      {/* Order cards skeleton (5 cards) */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" /> {/* Order ID */}
                <Skeleton className="h-5 w-20 rounded-full" /> {/* Status badge */}
              </div>
              <Skeleton className="h-4 w-32" /> {/* Timestamp */}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Customer info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" /> {/* Label */}
                <Skeleton className="h-4 w-40" /> {/* Customer name */}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" /> {/* Label */}
                <Skeleton className="h-4 w-48" /> {/* Address */}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" /> {/* Label */}
                <Skeleton className="h-4 w-32" /> {/* Phone */}
              </div>
            </div>

            {/* Order items */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" /> {/* "Items:" label */}
              <div className="space-y-1.5 pl-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" /> {/* Item name */}
                  <Skeleton className="h-4 w-16" /> {/* Quantity */}
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" /> {/* Item name */}
                  <Skeleton className="h-4 w-16" /> {/* Quantity */}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-28" /> {/* View Details button */}
              <Skeleton className="h-9 w-32" /> {/* Update Status button */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
