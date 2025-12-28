/**
 * Product Form Loading Skeleton (T065)
 *
 * Loading placeholder for the ProductForm during code splitting.
 * Provides perceived performance improvement for admin product management.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Form Fields Grid */}
      <div className="space-y-4">
        {/* Name and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Image Upload Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[80px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Tags Input */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-[60px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-[140px]" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  )
}
