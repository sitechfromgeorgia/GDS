export function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Category Tabs Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search bar skeleton */}
        <div className="relative w-full sm:w-72">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Category tabs skeleton */}
        <div className="w-full sm:w-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-20 bg-muted animate-pulse rounded-md shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Product image */}
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />

            {/* Product name */}
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />

            {/* Product category */}
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />

            {/* Product price */}
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />

            {/* Add to cart button */}
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
