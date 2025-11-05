'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Filter, Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { Product, RestaurantProduct, ProductFilters, PRODUCT_CATEGORIES } from '@/types/restaurant'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import { useToast } from '@/hooks/use-toast'

interface ProductCatalogProps {
  onAddToCart: (product: RestaurantProduct, quantity: number, notes?: string) => void
  cartItems: Array<{ product: RestaurantProduct; quantity: number; notes?: string }>
}

export function ProductCatalog({ onAddToCart, cartItems }: ProductCatalogProps) {
  const [products, setProducts] = useState<RestaurantProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ProductFilters>({
    available_only: true,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
  }, [filters])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await RestaurantUtils.getProducts({
        ...filters,
        search: searchQuery || undefined,
      })
      setProducts(data)
    } catch (error) {
      logger.error('Failed to load products:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadProducts()
  }

  const handleAddToCart = (product: RestaurantProduct) => {
    const existingItem = cartItems.find((item) => item.product.id === product.id)
    const currentQuantity = existingItem?.quantity || 0

    if (currentQuantity >= (product.max_order_quantity || 100)) {
      toast({
        title: 'შეზღუდული რაოდენობა',
        description: `მაქსიმუმ ${product.max_order_quantity || 100} ერთეული`,
        variant: 'destructive',
      })
      return
    }

    const newQuantity = Math.min(currentQuantity + 1, product.max_order_quantity || 100)

    onAddToCart(product, newQuantity - currentQuantity)
  }

  const getCartQuantity = (productId: string) => {
    const item = cartItems.find((item) => item.product.id === productId)
    return item?.quantity || 0
  }

  const filteredProducts = products.filter((product) => {
    if (filters.category?.length && !filters.category.includes(product.category)) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            პროდუქტების კატალოგი
          </CardTitle>
          <CardDescription>აირჩიეთ საჭირო პროდუქტები შეკვეთისთვის</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="პროდუქტის ძიება..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium">კატეგორია</label>
                <Select
                  value={filters.category?.[0] || ''}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: value ? [value] : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ყველა კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ყველა კატეგორია</SelectItem>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available-only"
                  checked={filters.available_only}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      available_only: checked as boolean,
                    }))
                  }
                />
                <label htmlFor="available-only" className="text-sm">
                  მხოლოდ ხელმისაწვდომი
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded animate-pulse mb-4" />
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const cartQuantity = getCartQuantity(product.id)
            return (
              <Card key={product.id} className="relative">
                <CardContent className="p-4">
                  {product.image_url && (
                    <div className="h-32 bg-muted rounded mb-4 overflow-hidden">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={600}
                        height={400}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{product.name}</h3>
                      <Badge variant={product.is_available ? 'default' : 'secondary'}>
                        {product.is_available ? 'ხელმისაწვდომი' : 'ამოიწურა'}
                      </Badge>
                    </div>

                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">
                        {RestaurantUtils.formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/{product.unit}</span>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>

                    {cartQuantity > 0 && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <ShoppingCart className="h-4 w-4" />
                        კალათაში: {cartQuantity}
                      </div>
                    )}

                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.is_available}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      დამატება
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">პროდუქტები არ მოიძებნა</div>
      )}
    </div>
  )
}
