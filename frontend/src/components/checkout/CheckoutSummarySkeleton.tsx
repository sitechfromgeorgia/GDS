/**
 * Checkout Summary Loading Skeleton (T065)
 *
 * Loading placeholder for the Checkout Summary during code splitting.
 * Provides perceived performance improvement for order review.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutSummarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-5 w-[80px]" />
          </div>
        </CardHeader>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Skeleton className="h-4 w-[160px] mb-1" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-[80px] mb-1" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          ))}

          {/* Separator */}
          <div className="border-t my-4" />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>

            {/* Separator */}
            <div className="border-t my-2" />

            <div className="flex justify-between">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-6 w-[120px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Delivery Information */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[160px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}
