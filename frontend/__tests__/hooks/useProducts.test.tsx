/**
 * useProducts Hook Test Suite
 * Tests for products management hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProducts } from '@/hooks/useProducts'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('useProducts Hook', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetching Products', () => {
    it('should fetch all products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10.50, stock: 100 },
        { id: '2', name: 'Product 2', price: 20.00, stock: 50 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toEqual(mockProducts)
      expect(result.current.products).toHaveLength(2)
    })

    it('should filter products by category', async () => {
      const mockProducts = [
        { id: '1', name: 'Milk', categoryId: 'dairy' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockProducts,
              error: null
            })
          })
        })
      })

      const { result } = renderHook(() => useProducts({ categoryId: 'dairy' }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toEqual(mockProducts)
    })

    it('should filter available products', async () => {
      const mockProducts = [
        { id: '1', name: 'Available Product', isAvailable: true }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockProducts,
              error: null
            })
          })
        })
      })

      const { result } = renderHook(() => useProducts({ isAvailable: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products.every(p => p.isAvailable)).toBe(true)
    })

    it('should handle fetch error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to fetch products' }
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.products).toEqual([])
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Search Products', () => {
    it('should search products by name', async () => {
      const mockProducts = [
        { id: '1', name: 'Milk', price: 5.50 },
        { id: '2', name: 'Chocolate Milk', price: 6.00 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let searchResult: any
      await act(async () => {
        searchResult = await result.current.searchProducts('milk')
      })

      expect(searchResult).toEqual(mockProducts)
    })

    it('should handle empty search results', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let searchResult: any
      await act(async () => {
        searchResult = await result.current.searchProducts('nonexistent')
      })

      expect(searchResult).toEqual([])
    })
  })

  describe('Creating Products', () => {
    it('should create product successfully', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'PROD-001',
        price: 15.50,
        categoryId: 'cat-1',
        stock: 100,
        unit: 'piece'
      }

      const createdProduct = {
        id: '1',
        ...newProduct
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdProduct],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
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
        createResult = await result.current.createProduct(newProduct)
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data).toEqual(createdProduct)
    })

    it('should validate product data', async () => {
      const invalidProduct = {
        name: '',
        sku: '',
        price: -10,
        stock: -5
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createProduct(invalidProduct as any)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeTruthy()
    })
  })

  describe('Updating Products', () => {
    it('should update product successfully', async () => {
      const updates = {
        name: 'Updated Product',
        price: 20.00
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', ...updates }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProduct('1', updates)
      })

      expect(updateResult.success).toBe(true)
    })

    it('should update stock', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 150 }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 100 }],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateStock('1', 50)
      })

      expect(updateResult.success).toBe(true)
    })

    it('should not allow negative stock', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 10 }],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateStock('1', -20)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('insufficient')
    })
  })

  describe('Deleting Products', () => {
    it('should delete product successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.deleteProduct('1')
      })

      expect(deleteResult.success).toBe(true)
    })
  })

  describe('Categories', () => {
    it('should fetch categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockCategories,
                error: null
              })
            })
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
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

      expect(result.current.categories).toEqual(mockCategories)
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to product updates', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      renderHook(() => useProducts({ enableRealtime: true }))

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('products')
      })

      expect(mockSubscription.on).toHaveBeenCalled()
      expect(mockSubscription.subscribe).toHaveBeenCalled()
    })

    it('should handle INSERT event', async () => {
      let insertCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'postgres_changes') {
            insertCallback = callback
          }
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newProduct = {
        id: '1',
        name: 'New Product',
        price: 10.50
      }

      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: newProduct
        })
      })

      await waitFor(() => {
        expect(result.current.products).toContainEqual(newProduct)
      })
    })

    it('should handle UPDATE event', async () => {
      let updateCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'postgres_changes') {
            updateCallback = callback
          }
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Product 1', price: 10 }],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        updateCallback({
          eventType: 'UPDATE',
          new: { id: '1', name: 'Updated Product', price: 20 }
        })
      })

      await waitFor(() => {
        expect(result.current.products[0].name).toBe('Updated Product')
      })
    })

    it('should handle DELETE event', async () => {
      let deleteCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'postgres_changes') {
            deleteCallback = callback
          }
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Product 1' }],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useProducts({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        deleteCallback({
          eventType: 'DELETE',
          old: { id: '1' }
        })
      })

      await waitFor(() => {
        expect(result.current.products).toHaveLength(0)
      })
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn()

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe
        })
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { unmount } = renderHook(() => useProducts({ enableRealtime: true }))

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled()
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
