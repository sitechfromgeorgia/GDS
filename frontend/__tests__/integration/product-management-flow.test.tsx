/**
 * Product Management Flow Integration Tests
 * Tests complete product management workflows including CRUD operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createClient } from '@/lib/supabase/client'
import { useProducts } from '@/hooks/useProducts'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('Product Management Flow Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      storage: {
        from: vi.fn()
      },
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Product Creation Flow', () => {
    it('should create product with image upload', async () => {
      const productData = {
        name: 'Fresh Tomatoes',
        description: 'Organic tomatoes from local farm',
        categoryId: 'cat-1',
        price: 5.99,
        stock: 100,
        unit: 'kg',
        minOrder: 1
      }

      const imageFile = new File(['image content'], 'tomato.jpg', { type: 'image/jpeg' })

      const createdProduct = {
        id: 'prod-1',
        ...productData,
        imageUrl: 'https://storage.supabase.co/products/tomato.jpg',
        createdAt: new Date().toISOString()
      }

      // Mock image upload
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'products/tomato.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/products/tomato.jpg' }
        })
      })

      // Mock product creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdProduct],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'categories') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'cat-1', name: 'Vegetables' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createProduct(productData, imageFile)
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data.name).toBe('Fresh Tomatoes')
      expect(createResult.data.imageUrl).toBeTruthy()
      expect(createResult.data.price).toBe(5.99)
    })

    it('should validate product data before creation', async () => {
      const invalidProductData = {
        name: '',
        description: 'Test',
        categoryId: 'cat-1',
        price: -5,
        stock: -10,
        unit: 'kg',
        minOrder: 0
      }

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createProduct(invalidProductData)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeTruthy()
    })

    it('should prevent duplicate product names', async () => {
      const productData = {
        name: 'Existing Product',
        description: 'Test',
        categoryId: 'cat-1',
        price: 10.00,
        stock: 50,
        unit: 'kg',
        minOrder: 1
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'prod-1', name: 'Existing Product' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createProduct(productData)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toContain('already exists')
    })
  })

  describe('Product Update Flow', () => {
    it('should update product details', async () => {
      const productId = 'prod-1'
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        price: 12.99,
        stock: 75
      }

      const updatedProduct = {
        id: productId,
        ...updateData,
        categoryId: 'cat-1',
        unit: 'kg',
        minOrder: 1,
        updatedAt: new Date().toISOString()
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [updatedProduct],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, name: 'Original Name', price: 10.00 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProduct(productId, updateData)
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.name).toBe('Updated Product Name')
      expect(updateResult.data.price).toBe(12.99)
    })

    it('should update product image', async () => {
      const productId = 'prod-1'
      const newImageFile = new File(['new image'], 'new-image.jpg', { type: 'image/jpeg' })

      const oldImagePath = 'products/old-image.jpg'
      const newImageUrl = 'https://storage.supabase.co/products/new-image.jpg'

      // Mock old product data
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: productId,
                  imageUrl: `https://storage.supabase.co/${oldImagePath}`
                }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: productId,
                  imageUrl: newImageUrl
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      // Mock storage operations
      mockSupabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: null
        }),
        upload: vi.fn().mockResolvedValue({
          data: { path: 'products/new-image.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: newImageUrl }
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProductImage(productId, newImageFile)
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.imageUrl).toBe(newImageUrl)
    })

    it('should validate update data', async () => {
      const productId = 'prod-1'
      const invalidUpdateData = {
        price: -10,
        stock: -5
      }

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProduct(productId, invalidUpdateData)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toBeTruthy()
    })
  })

  describe('Stock Management Flow', () => {
    it('should update product stock', async () => {
      const productId = 'prod-1'
      const stockChange = 25

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, stock: 50 }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, stock: 75 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateStock(productId, stockChange)
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.stock).toBe(75)
    })

    it('should prevent negative stock values', async () => {
      const productId = 'prod-1'
      const stockChange = -100

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, stock: 50 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateStock(productId, stockChange)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('negative')
    })

    it('should track low stock products', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', stock: 5, minOrder: 10 },
        { id: 'prod-2', name: 'Product 2', stock: 50, minOrder: 10 },
        { id: 'prod-3', name: 'Product 3', stock: 3, minOrder: 5 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchLowStockProducts()
      })

      await waitFor(() => {
        expect(result.current.lowStockProducts).toHaveLength(2)
        expect(result.current.lowStockProducts.some(p => p.id === 'prod-1')).toBe(true)
        expect(result.current.lowStockProducts.some(p => p.id === 'prod-3')).toBe(true)
      })
    })
  })

  describe('Product Search and Filter Flow', () => {
    it('should search products by name', async () => {
      const searchQuery = 'tomato'
      const mockProducts = [
        { id: 'prod-1', name: 'Fresh Tomatoes', price: 5.99 },
        { id: 'prod-2', name: 'Cherry Tomatoes', price: 7.99 },
        { id: 'prod-3', name: 'Cucumber', price: 3.99 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: mockProducts.filter(p =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.searchProducts(searchQuery)
      })

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(2)
        expect(result.current.searchResults.every(p =>
          p.name.toLowerCase().includes(searchQuery)
        )).toBe(true)
      })
    })

    it('should filter products by category', async () => {
      const categoryId = 'cat-1'
      const mockProducts = [
        { id: 'prod-1', name: 'Tomatoes', categoryId: 'cat-1' },
        { id: 'prod-2', name: 'Apples', categoryId: 'cat-2' },
        { id: 'prod-3', name: 'Cucumber', categoryId: 'cat-1' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProducts.filter(p => p.categoryId === categoryId),
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.filterByCategory(categoryId)
      })

      await waitFor(() => {
        expect(result.current.filteredProducts).toHaveLength(2)
        expect(result.current.filteredProducts.every(p => p.categoryId === categoryId)).toBe(true)
      })
    })

    it('should filter products by price range', async () => {
      const minPrice = 5.00
      const maxPrice = 10.00

      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', price: 4.99 },
        { id: 'prod-2', name: 'Product 2', price: 7.50 },
        { id: 'prod-3', name: 'Product 3', price: 15.00 },
        { id: 'prod-4', name: 'Product 4', price: 8.99 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: mockProducts.filter(p => p.price >= minPrice && p.price <= maxPrice),
              error: null
            })
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.filterByPriceRange(minPrice, maxPrice)
      })

      await waitFor(() => {
        expect(result.current.filteredProducts).toHaveLength(2)
        expect(result.current.filteredProducts.every(p =>
          p.price >= minPrice && p.price <= maxPrice
        )).toBe(true)
      })
    })

    it('should combine multiple filters', async () => {
      const categoryId = 'cat-1'
      const minPrice = 5.00
      const maxPrice = 10.00
      const searchQuery = 'fresh'

      const mockProducts = [
        { id: 'prod-1', name: 'Fresh Tomatoes', categoryId: 'cat-1', price: 7.99 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({
                  data: mockProducts,
                  error: null
                })
              })
            })
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.applyFilters({
          categoryId,
          minPrice,
          maxPrice,
          search: searchQuery
        })
      })

      await waitFor(() => {
        expect(result.current.filteredProducts).toHaveLength(1)
        expect(result.current.filteredProducts[0].name).toContain('Fresh')
      })
    })
  })

  describe('Product Deletion Flow', () => {
    it('should delete product and its image', async () => {
      const productId = 'prod-1'
      const imageUrl = 'https://storage.supabase.co/products/product-image.jpg'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, imageUrl }],
                error: null
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.deleteProduct(productId)
      })

      expect(deleteResult.success).toBe(true)
    })

    it('should prevent deletion of products in active orders', async () => {
      const productId = 'prod-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ orderId: 'order-1', productId: 'prod-1' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.deleteProduct(productId)
      })

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('active orders')
    })

    it('should soft delete instead of hard delete', async () => {
      const productId = 'prod-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: productId, deletedAt: new Date().toISOString() }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.softDeleteProduct(productId)
      })

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.data.deletedAt).toBeTruthy()
    })
  })

  describe('Category Management Flow', () => {
    it('should fetch products with category details', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Tomatoes',
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Vegetables', nameKa: 'ბოსტნეული' }
        },
        {
          id: 'prod-2',
          name: 'Apples',
          categoryId: 'cat-2',
          category: { id: 'cat-2', name: 'Fruits', nameKa: 'ხილი' }
        }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchProductsWithCategories()
      })

      await waitFor(() => {
        expect(result.current.products).toHaveLength(2)
        expect(result.current.products[0].category).toBeDefined()
        expect(result.current.products[0].category.name).toBe('Vegetables')
      })
    })

    it('should count products per category', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Vegetables', productCount: 10 },
        { id: 'cat-2', name: 'Fruits', productCount: 8 },
        { id: 'cat-3', name: 'Dairy', productCount: 5 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({
          data: mockCategories,
          error: null
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchCategoryStatistics()
      })

      await waitFor(() => {
        expect(result.current.categoryStats).toEqual(mockCategories)
      })
    })
  })

  describe('Real-time Product Updates', () => {
    it('should receive real-time product updates', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'prod-1', name: 'Original', price: 10.00 }],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedProduct = {
        id: 'prod-1',
        name: 'Updated Product',
        price: 12.99
      }

      act(() => {
        subscriptionCallback({
          eventType: 'UPDATE',
          new: updatedProduct,
          old: { id: 'prod-1', name: 'Original', price: 10.00 }
        })
      })

      await waitFor(() => {
        const product = result.current.products.find(p => p.id === 'prod-1')
        expect(product?.name).toBe('Updated Product')
        expect(product?.price).toBe(12.99)
      })
    })

    it('should add new products via real-time subscription', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newProduct = {
        id: 'prod-2',
        name: 'New Product',
        price: 15.00
      }

      act(() => {
        subscriptionCallback({
          eventType: 'INSERT',
          new: newProduct
        })
      })

      await waitFor(() => {
        expect(result.current.products).toContainEqual(newProduct)
      })
    })

    it('should remove deleted products via real-time subscription', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'prod-1', name: 'Product 1' },
              { id: 'prod-2', name: 'Product 2' }
            ],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.products).toHaveLength(2)
      })

      act(() => {
        subscriptionCallback({
          eventType: 'DELETE',
          old: { id: 'prod-1', name: 'Product 1' }
        })
      })

      await waitFor(() => {
        expect(result.current.products).toHaveLength(1)
        expect(result.current.products.find(p => p.id === 'prod-1')).toBeUndefined()
      })
    })
  })

  describe('Bulk Operations Flow', () => {
    it('should update stock for multiple products', async () => {
      const stockUpdates = [
        { productId: 'prod-1', stockChange: 10 },
        { productId: 'prod-2', stockChange: -5 },
        { productId: 'prod-3', stockChange: 20 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{}],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let bulkResult: any
      await act(async () => {
        bulkResult = await result.current.bulkUpdateStock(stockUpdates)
      })

      expect(bulkResult.success).toBe(true)
      expect(bulkResult.updatedCount).toBe(3)
    })

    it('should import products from CSV', async () => {
      const csvData = [
        { name: 'Product 1', price: 10.00, stock: 50, categoryId: 'cat-1' },
        { name: 'Product 2', price: 15.00, stock: 30, categoryId: 'cat-2' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({
          data: csvData,
          error: null
        })
      }))

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let importResult: any
      await act(async () => {
        importResult = await result.current.importProducts(csvData)
      })

      expect(importResult.success).toBe(true)
      expect(importResult.importedCount).toBe(2)
    })
  })
})
