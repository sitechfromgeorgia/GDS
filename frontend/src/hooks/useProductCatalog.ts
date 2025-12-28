import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/products/product.service'
import type { ProductFilterInput } from '@/lib/validators/products/products'
import { useCallback } from 'react'

interface UseProductCatalogParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  category?: string
  search?: string
  min_price?: number
  max_price?: number
}

interface UseProductCatalogReturn {
  data?: {
    products: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    filters: ProductFilterInput
    categories: string[]
  }
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useProductCatalog(params: UseProductCatalogParams = {}): UseProductCatalogReturn {
  const queryClient = useQueryClient()

  const queryKey = ['products-catalog', params]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Use getProductsPaginated to get structured data
      const result = await productService.getProductsPaginated(
        params.page || 1,
        params.limit || 20,
        {
          category: params.category,
          search: params.search,
          min_price: params.min_price,
          max_price: params.max_price,
        }
      )

      // Get categories separately
      const categories = (await productService.getCategories()) as string[]

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
          search: params.search,
          min_price: params.min_price,
          max_price: params.max_price,
        },
        categories,
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products-catalog'] })
  }, [queryClient])

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error,
    refetch,
  }
}
