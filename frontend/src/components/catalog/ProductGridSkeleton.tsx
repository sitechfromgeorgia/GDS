export function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Product image */}
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />

            {/* Product name */}
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />

            {/* Product category */}
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />

            {/* Product price */}
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />

            {/* Stock status */}
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />

            {/* Add to cart button */}
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

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
