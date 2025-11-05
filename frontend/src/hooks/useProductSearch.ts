import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/products/product.service'
import { ProductFilterInput } from '@/lib/validators/products/products'
import { useCallback } from 'react'

interface UseProductSearchParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  category?: string
  search?: string
  min_price?: number
  max_price?: number
}

export function useProductSearch(searchQuery: string, params: UseProductSearchParams = {}) {
  const queryClient = useQueryClient()

  const queryKey = ['products-search', searchQuery, params]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return {
          products: [],
          pagination: {
            page: 0,
            limit: params.limit || 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          filters: {},
          categories: [],
        }
      }

      // Use getProductsPaginated with search
      const result = await productService.getProductsPaginated(
        params.page || 1,
        params.limit || 20,
        {
          category: params.category,
          search: searchQuery,
          min_price: params.min_price,
          max_price: params.max_price,
        }
      )

      // Get categories separately
      const categories = await productService.getCategories()

      return {
        products: result.products,
        pagination: {
          page: result.currentPage,
          limit: params.limit || 20,
          total: result.totalCount,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        },
        filters: {
          category: params.category,
          search: searchQuery,
          min_price: params.min_price,
          max_price: params.max_price,
        },
        categories,
      }
    },
    enabled: true, // Always enabled, returns empty data if no search query
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    refetchOnWindowFocus: false,
  })

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products-search'] })
  }, [queryClient])

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error,
    refetch,
  }
}
