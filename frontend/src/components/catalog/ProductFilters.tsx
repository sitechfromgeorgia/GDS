import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Filter, X, RotateCcw, DollarSign, Package, Tag } from 'lucide-react'
import { ProductFilterInput } from '@/lib/validators/products/products'

interface ProductFiltersProps {
  filters: ProductFilterInput
  categories: string[]
  onFiltersChange: (filters: ProductFilterInput) => void
  onReset: () => void
  className?: string
  showAdvancedFilters?: boolean
  priceRange?: { min: number; max: number }
}

export function ProductFilters({
  filters,
  categories,
  onFiltersChange,
  onReset,
  className,
  showAdvancedFilters = true,
  priceRange = { min: 0, max: 1000 },
}: ProductFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === 'all' ? undefined : value,
    })
  }

  const clearSearch = () => {
    handleSearchChange('')
  }

  const clearCategory = () => {
    onFiltersChange({
      ...filters,
      category: undefined,
    })
  }

  const clearPriceRange = () => {
    onFiltersChange({
      ...filters,
      min_price: undefined,
      max_price: undefined,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onReset()
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.min_price !== undefined ||
      filters.max_price !== undefined
  )

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.category) count++
    if (filters.min_price !== undefined || filters.max_price !== undefined) count++
    return count
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            ფილტრები
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              გასუფთავება
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            ძიება
          </Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="პროდუქტის დასახელება..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-8"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={clearSearch}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            კატეგორია
          </Label>
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="აირჩიეთ კატეგორია" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა კატეგორია</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.category && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Package className="w-3 h-3 mr-1" />
                {filters.category}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearCategory}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {showAdvancedFilters && (
          <>
            <Separator />

            {/* Price Range Filter */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ფასის დიაპაზონი
              </Label>

              {/* Current Price Range Display */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  მინ. ფას:{' '}
                  <span className="font-medium">
                    {filters.min_price !== undefined ? `${filters.min_price} ₾` : 'ყველა'}
                  </span>
                </div>
                <div>
                  მაქს. ფას:{' '}
                  <span className="font-medium">
                    {filters.max_price !== undefined ? `${filters.max_price} ₾` : 'ყველა'}
                  </span>
                </div>
              </div>

              {/* Min Price Input */}
              <div className="space-y-2">
                <Label className="text-xs">მინიმალური ფას</Label>
                <Input
                  type="number"
                  placeholder={`${priceRange.min}₾-დან`}
                  value={filters.min_price || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      min_price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  min={priceRange.min}
                  max={priceRange.max}
                  step={10}
                />
              </div>

              {/* Max Price Input */}
              <div className="space-y-2">
                <Label className="text-xs">მაქსიმალური ფას</Label>
                <Input
                  type="number"
                  placeholder={`${priceRange.max}₾-მდე`}
                  value={filters.max_price || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      max_price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  min={priceRange.min}
                  max={priceRange.max}
                  step={10}
                />
              </div>

              {(filters.min_price !== undefined || filters.max_price !== undefined) && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ფასის დიაპაზონი
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={clearPriceRange}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">აქტიური ფილტრები:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="default" className="text-xs">
                    <Search className="w-3 h-3 mr-1" />"{filters.search}"
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="default" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {filters.category}
                  </Badge>
                )}
                {(filters.min_price !== undefined || filters.max_price !== undefined) && (
                  <Badge variant="default" className="text-xs">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ფას: {filters.min_price || '0'} - {filters.max_price || '∞'}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductFilters
