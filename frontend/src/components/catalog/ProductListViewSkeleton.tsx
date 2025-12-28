export function ProductListViewSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex gap-4">
            {/* Product image */}
            <div className="w-24 h-24 bg-muted animate-pulse rounded flex-shrink-0" />

            {/* Product details */}
            <div className="flex-1 space-y-2">
              {/* Name */}
              <div className="h-5 bg-muted animate-pulse rounded w-1/2" />

              {/* Category */}
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />

              {/* Description */}
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />

              {/* Price and stock */}
              <div className="flex gap-4">
                <div className="h-6 bg-muted animate-pulse rounded w-20" />
                <div className="h-6 bg-muted animate-pulse rounded w-24" />
              </div>
            </div>

            {/* Action button */}
            <div className="h-10 w-32 bg-muted animate-pulse rounded flex-shrink-0" />
          </div>
        </div>
      ))}

      {/* Pagination skeleton */}
      <div className="flex justify-center gap-2">
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}
