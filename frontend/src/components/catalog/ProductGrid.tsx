import React from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/types/database'
import { ProductFilterInput } from '@/lib/validators/products/products'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, ShoppingCart, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  filters: ProductFilterInput
  onAddToCart?: (product: Product, quantity?: number) => void
  onProductClick?: (product: Product) => void
  formatPrice?: (price: number) => string
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  showAddToCart?: boolean
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

export function ProductGrid({
  products,
  isLoading = false,
  isError = false,
  error = null,
  filters,
  onAddToCart,
  onProductClick,
  formatPrice,
  className,
  variant = 'default',
  columns = 3,
  showAddToCart = true,
  emptyState,
  pagination,
}: ProductGridProps) {
  const getGridColumns = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-1 sm:grid-cols-2'
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
  }

  const getCardSpacing = () => {
    switch (variant) {
      case 'compact':
        return 'gap-3'
      case 'minimal':
        return 'gap-2'
      default:
        return 'gap-4'
    }
  }

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
    <div className={cn('space-y-6', className)}>
      {/* Products Grid */}
      <div className={cn('grid', getGridColumns(), getCardSpacing())}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
            formatPrice={formatPrice}
            variant={variant}
            showAddToCart={showAddToCart}
            className={cn(
              'transition-all duration-200',
              !isLoading && 'animate-in fade-in-0 slide-in-from-bottom-4'
            )}
          />
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
        <div className="flex items-center justify-between border-t pt-6">
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

      {/* Empty Grid State for Testing */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>კალათა ცარიეა</p>
        </div>
      )}
    </div>
  )
}

export default ProductGrid
