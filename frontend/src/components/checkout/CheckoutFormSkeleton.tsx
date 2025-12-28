/**
 * Checkout Form Loading Skeleton (T065)
 *
 * Loading placeholder for the Checkout Form during code splitting.
 * Provides perceived performance improvement for multi-step checkout flow.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[160px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-[280px]" />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[140px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Selection Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[160px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-[80px] mb-1" />
                    <Skeleton className="h-3 w-[160px]" />
                  </div>
                </div>
                <Skeleton className="h-5 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[180px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
          <div className="flex justify-between items-center mt-2">
            <Skeleton className="h-3 w-[120px]" />
            <Skeleton className="h-3 w-[40px]" />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Skeleton className="h-12 w-full" />

      {/* Order Summary Notice */}
      <div className="text-center">
        <Skeleton className="h-3 w-full max-w-md mx-auto" />
      </div>
    </div>
  )
}
