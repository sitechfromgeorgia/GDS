import React, { useCallback, useEffect, useState } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/products/product.service'
import { ProductFilterInput } from '@/lib/validators/products/products'

// Query keys
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters: ProductFilterInput) => [...productQueryKeys.lists(), filters] as const,
  infinite: (filters: ProductFilterInput) =>
    [...productQueryKeys.all, 'infinite', filters] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  categories: () => [...productQueryKeys.all, 'categories'] as const,
  search: (query: string) => [...productQueryKeys.all, 'search', query] as const,
} as const

// Get all products with filtering
export function useProducts(filters: ProductFilterInput = {}) {
  return useQuery({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  })
}

// Get products with infinite scrolling and pagination
export function useInfiniteProducts(filters: ProductFilterInput = {}, limit: number = 50) {
  return useInfiniteQuery({
    queryKey: productQueryKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => productService.getProductsPaginated(pageParam, limit, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Get products by category
export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: [...productQueryKeys.lists(), { category }],
    queryFn: () => productService.getProductsByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Get product categories
export function useProductCategories() {
  return useQuery({
    queryKey: productQueryKeys.categories(),
    queryFn: () => productService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change infrequently
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Get single product by ID
export function useProduct(productId: string) {
  return useQuery({
    queryKey: productQueryKeys.detail(productId),
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Check product availability
export function useProductAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      productService.checkProductAvailability(productId, quantity),
    onSuccess: () => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
    },
  })
}

// Search products (debounced)
export function useProductSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: productQueryKeys.search(query),
    queryFn: () => productService.searchProducts(query, limit),
    enabled: query.length >= 2, // Only search when 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Custom hook for debounced search
export function useDebouncedProductSearch(searchTerm: string, delay: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm, delay])

  return useProductSearch(debouncedSearchTerm)
}

// Subscribe to real-time product updates
export function useProductRealtimeUpdates(
  onUpdate?: (payload: any) => void,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  const handleUpdate = useCallback(
    (payload: any) => {
      // Update the cache with the new product data
      if (payload.new) {
        queryClient.setQueryData(productQueryKeys.detail(payload.new.id), payload.new)
      }

      // Invalidate product lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })

      // Call custom update handler if provided
      onUpdate?.(payload)
    },
    [queryClient, onUpdate]
  )

  // Note: This would need to be set up in a provider or component
  // For now, returning the callback to be used with Supabase subscription
  return { handleUpdate }
}

// Utility hooks for formatted data
export function useProductFormatters() {
  return {
    formatPrice: productService.formatPrice.bind(productService),
    getStockStatus: productService.getStockStatus.bind(productService),
  }
}

// Hook for manual cache invalidation
export function useInvalidateProducts() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
  }, [queryClient])
}

// Combined hook for product catalog with all features
export function useProductCatalog(
  filters: ProductFilterInput = {},
  enableRealtime: boolean = true
) {
  const productsQuery = useProducts(filters)
  const categoriesQuery = useProductCategories()
  const { formatPrice, getStockStatus } = useProductFormatters()
  const invalidateProducts = useInvalidateProducts()

  return {
    // Data
    products: productsQuery.data || [],
    categories: categoriesQuery.data || [],

    // Loading states
    isLoading: productsQuery.isLoading || categoriesQuery.isLoading,
    isError: productsQuery.isError || categoriesQuery.isError,
    error: productsQuery.error || categoriesQuery.error,

    // Formatters
    formatPrice,
    getStockStatus,

    // Actions
    invalidateProducts,

    // Metadata
    productsCount: productsQuery.data?.length || 0,
    categoriesCount: categoriesQuery.data?.length || 0,
  }
}
