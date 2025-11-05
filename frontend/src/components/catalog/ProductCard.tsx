import React, { memo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/types/database'
import { ProductFilterInput } from '@/lib/validators/products/products'
import { ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product, quantity?: number) => void
  onProductClick?: (product: Product) => void
  formatPrice?: (price: number) => string
  className?: string
  showAddToCart?: boolean
  variant?: 'default' | 'compact' | 'minimal'
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  formatPrice,
  className,
  showAddToCart = true,
  variant = 'default',
}: ProductCardProps) {
  const formatPriceText = formatPrice || ((price: number) => `${price.toLocaleString()} ₾`)

  // Determine stock status
  const getStockStatus = () => {
    if (product.stock_quantity <= 0) {
      return {
        status: 'out_of_stock',
        label: 'მარაგი არ არის',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
      }
    }

    if (product.stock_quantity <= product.min_stock_level) {
      return {
        status: 'low_stock',
        label: 'ცოტა მარაგი',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Package,
      }
    }

    return {
      status: 'in_stock',
      label: 'მარაგშია',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Package,
    }
  }

  const stockInfo = getStockStatus()
  const StockIcon = stockInfo.icon

  const handleAddToCart = () => {
    onAddToCart?.(product, 1)
  }

  const handleProductClick = () => {
    onProductClick?.(product)
  }

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center space-x-3 p-3 rounded-lg border hover:shadow-md transition-shadow',
          className
        )}
        onClick={handleProductClick}
      >
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-md"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{product.name}</div>
          <div className="text-sm text-gray-500">{product.unit}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatPriceText(product.price)}</div>
          <Badge className={cn('text-xs', stockInfo.color)}>
            <StockIcon className="w-3 h-3 mr-1" />
            {stockInfo.label}
          </Badge>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1',
          className
        )}
        onClick={handleProductClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.description}</p>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{formatPriceText(product.price)}</div>
                <Badge className={cn('text-xs', stockInfo.color)}>
                  <StockIcon className="w-3 h-3 mr-1" />
                  {stockInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>

        {showAddToCart && (
          <CardFooter className="p-4 pt-0">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleAddToCart()
              }}
              disabled={product.stock_quantity <= 0}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              კალათაში
            </Button>
          </CardFooter>
        )}
      </Card>
    )
  }

  // Default variant
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-2 overflow-hidden',
        className
      )}
      onClick={handleProductClick}
    >
      {product.image_url && (
        <div className="aspect-square overflow-hidden relative">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {product.category}
              </span>
              <span className="text-xs text-gray-500">{product.unit}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">{formatPriceText(product.price)}</div>
            <Badge className={cn('text-xs', stockInfo.color)}>
              <StockIcon className="w-3 h-3 mr-1" />
              {stockInfo.label}
            </Badge>
          </div>

          {product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0 && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              მხოლოდ {product.stock_quantity} ერთეული დარჩა
            </div>
          )}
        </div>
      </CardContent>

      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
            }}
            disabled={product.stock_quantity <= 0}
            className="w-full"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock_quantity <= 0 ? 'მარაგი არ არის' : 'კალათაში'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
})

export default ProductCard
