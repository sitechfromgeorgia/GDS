import React from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/types/database'
import { ProductFilterInput } from '@/lib/validators/products/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Package, Loader2, Search, List, Grid, Filter, SortAsc, SortDesc } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductListViewProps {
  products: Product[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  filters: ProductFilterInput
  onAddToCart?: (product: Product, quantity?: number) => void
  onProductClick?: (product: Product) => void
  formatPrice?: (price: number) => string
  className?: string
  showAddToCart?: boolean
  showFilters?: boolean
  showSort?: boolean
  sortOptions?: Array<{
    label: string
    value: string
    direction?: 'asc' | 'desc'
  }>
  currentSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void
  emptyState?: {
    title?: string
    description?: string
    action?: React.ReactNode
  }
  pagination?: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    onNextPage: () => void
    onPreviousPage: () => void
    isLoading: boolean
  }
}

export function ProductListView({
  products,
  isLoading = false,
  isError = false,
  error = null,
  filters,
  onAddToCart,
  onProductClick,
  formatPrice,
  className,
  showAddToCart = true,
  showFilters = false,
  showSort = false,
  sortOptions = [],
  currentSort,
  onSortChange,
  emptyState,
  pagination,
}: ProductListViewProps) {
  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>პროდუქტების ჩატვირთვის დროს მოხდა შეცდომა: {error?.message}</span>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    const defaultEmptyState = {
      title: 'პროდუქტები არ მოიძებნა',
      description:
        filters.search || filters.category
          ? 'ცდებით ძიების პირობები ან არჩეულია კატეგორია. სცადეთ სხვა პარამეტრები.'
          : 'ამჟამად პროდუქტები არ არის ხელმისაწვდომი.',
      action: (
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
          <Search className="w-4 h-4 mr-2" />
          გადახადეთ
        </Button>
      ),
    }

    const { title, description, action } = { ...defaultEmptyState, ...emptyState }

    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-500 max-w-md">{description}</p>
          </div>
          {action}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Sort Options */}
      {showSort && sortOptions.length > 0 && (
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <List className="w-4 h-4" />
            <span>სიის ხედი ({products.length} პროდუქტი)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">დახარისხება:</span>
            <div className="flex gap-1">
              {sortOptions.map((option) => {
                const isActive = currentSort?.field === option.value
                const isDesc = currentSort?.direction === 'desc'

                return (
                  <Button
                    key={option.value}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (!onSortChange) return

                      if (isActive) {
                        // Toggle direction if same field
                        onSortChange(option.value, isDesc ? 'asc' : 'desc')
                      } else {
                        // Use default direction for new field
                        onSortChange(option.value, option.direction || 'asc')
                      }
                    }}
                    className="flex items-center gap-1 text-xs"
                  >
                    {option.label}
                    {isActive &&
                      (isDesc ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <Card
            key={product.id}
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              !isLoading && 'animate-in fade-in-0 slide-in-from-left-4'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-0">
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onProductClick={onProductClick}
                formatPrice={formatPrice}
                variant="minimal"
                showAddToCart={showAddToCart}
                className="border-0 shadow-none rounded-none hover:bg-gray-50"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>პროდუქტების ჩატვირთვა...</span>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && (pagination.hasNextPage || pagination.hasPreviousPage) && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">პროდუქტების რაოდენობა: {products.length}</div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPreviousPage}
              disabled={!pagination.hasPreviousPage || pagination.isLoading}
            >
              წინა
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNextPage}
              disabled={!pagination.hasNextPage || pagination.isLoading}
            >
              შემდეგი
            </Button>
          </div>
        </div>
      )}

      {/* List Summary */}
      {!isLoading && products.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500 border-t">
          <div className="flex items-center justify-center gap-2">
            <Grid className="w-4 h-4" />
            <span>
              ნაჩვენებია {products.length} პროდუქტი{' '}
              {filters.search && `ძიების მიხედვით: "${filters.search}"`}
            </span>
            {(filters.category || filters.min_price || filters.max_price) && (
              <Badge variant="secondary" className="ml-2">
                <Filter className="w-3 h-3 mr-1" />
                ფილტრირებული
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductListView
