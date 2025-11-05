'use client'
import { logger } from '@/lib/logger'

import React, { useState, useCallback, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { ProductFilters } from '@/components/catalog/ProductFilters'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductListView } from '@/components/catalog/ProductListView'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Grid,
  List,
  SlidersHorizontal,
  Package,
  Loader2,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProductCatalog } from '@/hooks/useProductCatalog'
import { useProductSearch } from '@/hooks/useProductSearch'
import { productFilterSchema } from '@/lib/validators/products/products'
import { ProductFilterInput } from '@/lib/validators/products/products'

type ViewMode = 'grid' | 'list'

export default function ProductCatalogPage() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<ProductFilterInput>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Debounce search query to avoid excessive API calls (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Sort state
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Price range for filters
  const priceRange = { min: 0, max: 1000 }

  // Query parameters - use debounced search query
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    sortBy: sortField,
    sortOrder: sortDirection,
    ...filters,
    search: debouncedSearchQuery || undefined,
  }

  // Data fetching hooks
  const {
    data: catalogData,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErrorDetail,
    refetch: refetchCatalog,
  } = useProductCatalog(queryParams)

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErrorDetail,
    refetch: refetchSearch,
  } = useProductSearch(searchQuery, queryParams)

  // Determine which data to use
  const isLoading = searchQuery ? searchLoading : catalogLoading
  const isError = searchQuery ? searchError : catalogError
  const error = searchQuery ? searchErrorDetail : catalogErrorDetail
  const data = searchQuery ? searchData : catalogData
  const products = data?.products || []
  const pagination = data?.pagination
  const categories = data?.categories || []

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on new search
  }, [])

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: ProductFilterInput) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  const handleFiltersReset = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }, [])

  // Sort handlers
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
    setCurrentPage(1) // Reset to first page on sort change
  }, [])

  // Pagination handlers
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // View mode toggle
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))
  }, [])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (searchQuery) {
      refetchSearch()
    } else {
      refetchCatalog()
    }
  }, [searchQuery, refetchSearch, refetchCatalog])

  // Price formatting function
  const formatPrice = useCallback((price: number) => {
    return `${price.toLocaleString('ka-GE')} ₾`
  }, [])

  // Mock add to cart handler (for demonstration)
  const handleAddToCart = useCallback((product: any, quantity: number = 1) => {
    // In real implementation, this would add to cart context
    logger.info(`Add to cart: ${product.name} x ${quantity}`)

    // Show toast notification
    alert(`პროდუქტი "${product.name}" კალათაშია`)
  }, [])

  // Mock product click handler
  const handleProductClick = useCallback((product: any) => {
    logger.info(`Product clicked: ${product.name}`)
    // In real implementation, this would open product detail or modal
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">პროდუქტების კატალოგი</h1>
              <p className="text-gray-600">შეარჩიეთ პროდუქტები თქვენი რესტორნისთვის</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-gray-100')}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                ფილტრები
                {(Object.keys(filters).length > 0 || searchQuery) && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(filters).length + (searchQuery ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ძიება პროდუქტებში..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => handleSearchChange('')}
                >
                  ×
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ProductFilters
                  filters={filters}
                  categories={categories}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleFiltersReset}
                  priceRange={priceRange}
                  showAdvancedFilters={true}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={cn('space-y-4', showFilters ? 'lg:col-span-3' : 'lg:col-span-4')}>
            {/* View Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="view-toggle">ხედი:</Label>
                      <div className="flex border rounded-lg">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="rounded-r-none"
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page">გვერდზე:</Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results Summary */}
                  {pagination && (
                    <div className="text-sm text-gray-600">
                      ნაჩვენებია {products.length} პროდუქტი
                      {pagination.total > 0 && (
                        <span className="ml-1">(სულ: {pagination.total})</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sort Options */}
            {viewMode === 'list' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Label>დახარისხება:</Label>
                    <Select
                      value={`${sortField}-${sortDirection}`}
                      onValueChange={(value) => {
                        const [field, direction] = value.split('-') as [string, 'asc' | 'desc']
                        handleSortChange(field, direction)
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">დასახელება (A-Z)</SelectItem>
                        <SelectItem value="name-desc">დასახელება (Z-A)</SelectItem>
                        <SelectItem value="price-asc">ფასი (ზრდადობით)</SelectItem>
                        <SelectItem value="price-desc">ფასი (კლებადობით)</SelectItem>
                        <SelectItem value="category-asc">კატეგორია (A-Z)</SelectItem>
                        <SelectItem value="created_at-desc">ახლახანს დამატებული</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Display */}
            {viewMode === 'grid' ? (
              <ProductGrid
                products={products}
                isLoading={isLoading}
                isError={isError}
                error={error}
                filters={filters}
                onAddToCart={handleAddToCart}
                onProductClick={handleProductClick}
                formatPrice={formatPrice}
                variant="default"
                columns={showFilters ? 3 : 4}
                pagination={{
                  hasNextPage: pagination?.hasNextPage || false,
                  hasPreviousPage: pagination?.hasPreviousPage || false,
                  onNextPage: () => handlePageChange(currentPage + 1),
                  onPreviousPage: () => handlePageChange(currentPage - 1),
                  isLoading,
                }}
                emptyState={{
                  title: 'პროდუქტები არ მოიძებნა',
                  description: 'სცადეთ შეცვალოთ ძიების პირობები ან ფილტრები',
                }}
              />
            ) : (
              <ProductListView
                products={products}
                isLoading={isLoading}
                isError={isError}
                error={error}
                filters={filters}
                onAddToCart={handleAddToCart}
                onProductClick={handleProductClick}
                formatPrice={formatPrice}
                showAddToCart={true}
                showSort={false}
                pagination={{
                  hasNextPage: pagination?.hasNextPage || false,
                  hasPreviousPage: pagination?.hasPreviousPage || false,
                  onNextPage: () => handlePageChange(currentPage + 1),
                  onPreviousPage: () => handlePageChange(currentPage - 1),
                  isLoading,
                }}
                emptyState={{
                  title: 'პროდუქტები არ მოიძებნა',
                  description: 'სცადეთ შეცვალოთ ძიების პირობები ან ფილტრები',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
