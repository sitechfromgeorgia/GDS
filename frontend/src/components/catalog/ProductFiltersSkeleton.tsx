export function ProductFiltersSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Title */}
      <div className="h-6 bg-muted animate-pulse rounded w-1/2" />

      {/* Category filters */}
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>

      {/* Apply/Reset buttons */}
      <div className="flex gap-2">
        <div className="h-10 bg-muted animate-pulse rounded flex-1" />
        <div className="h-10 bg-muted animate-pulse rounded flex-1" />
      </div>
    </div>
  )
}
