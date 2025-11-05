/**
 * Product Service Test Suite
 * Tests for product service layer functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  searchProducts
} from '@/services/product-service'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('Product Service', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn()
      }
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  describe('getProducts', () => {
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

      const result = await getProducts()

      expect(result.data).toEqual(mockProducts)
      expect(result.error).toBeNull()
    })

    it('should filter products by category', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', categoryId: 'cat-1' }
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

      const result = await getProducts({ categoryId: 'cat-1' })

      expect(result.data).toEqual(mockProducts)
      expect(result.error).toBeNull()
    })

    it('should filter available products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', isAvailable: true }
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

      const result = await getProducts({ isAvailable: true })

      expect(result.data).toEqual(mockProducts)
      expect(result.error).toBeNull()
    })

    it('should include category data', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          category: { id: 'cat-1', name: 'Category 1' }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      })

      const result = await getProducts()

      expect(result.data[0].category).toBeDefined()
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

      const result = await getProducts()

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('getProductById', () => {
    it('should fetch product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        price: 10.50
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProduct,
              error: null
            })
          })
        })
      })

      const result = await getProductById('1')

      expect(result.data).toEqual(mockProduct)
      expect(result.error).toBeNull()
    })

    it('should handle product not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Product not found' }
            })
          })
        })
      })

      const result = await getProductById('invalid-id')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'Product description',
        sku: 'PROD-001',
        price: 15.50,
        categoryId: 'cat-1',
        stock: 100,
        unit: 'piece',
        isAvailable: true
      }

      const createdProduct = {
        id: '1',
        ...newProduct
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [createdProduct],
          error: null
        })
      })

      const result = await createProduct(newProduct)

      expect(result.data).toEqual(createdProduct)
      expect(result.error).toBeNull()
    })

    it('should validate required fields', async () => {
      const invalidProduct = {
        name: '',
        sku: '',
        price: -10,
        stock: -5
      }

      const result = await createProduct(invalidProduct as any)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should validate price is positive', async () => {
      const invalidProduct = {
        name: 'Product',
        sku: 'SKU-001',
        price: -10,
        categoryId: 'cat-1',
        stock: 100,
        unit: 'piece'
      }

      const result = await createProduct(invalidProduct)

      expect(result.data).toBeNull()
      expect(result.error).toContain('price')
    })

    it('should validate stock is non-negative', async () => {
      const invalidProduct = {
        name: 'Product',
        sku: 'SKU-001',
        price: 10,
        categoryId: 'cat-1',
        stock: -5,
        unit: 'piece'
      }

      const result = await createProduct(invalidProduct)

      expect(result.data).toBeNull()
      expect(result.error).toContain('stock')
    })

    it('should handle duplicate SKU', async () => {
      const newProduct = {
        name: 'Product',
        sku: 'DUPLICATE-SKU',
        price: 10,
        categoryId: 'cat-1',
        stock: 100,
        unit: 'piece'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'duplicate key value violates unique constraint' }
        })
      })

      const result = await createProduct(newProduct)

      expect(result.data).toBeNull()
      expect(result.error).toContain('SKU')
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updates = {
        name: 'Updated Product',
        price: 20.00,
        stock: 150
      }

      const updatedProduct = {
        id: '1',
        ...updates
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [updatedProduct],
            error: null
          })
        })
      })

      const result = await updateProduct('1', updates)

      expect(result.data).toEqual(updatedProduct)
      expect(result.error).toBeNull()
    })

    it('should validate price when updating', async () => {
      const updates = {
        price: -10
      }

      const result = await updateProduct('1', updates)

      expect(result.data).toBeNull()
      expect(result.error).toContain('price')
    })

    it('should validate stock when updating', async () => {
      const updates = {
        stock: -5
      }

      const result = await updateProduct('1', updates)

      expect(result.data).toBeNull()
      expect(result.error).toContain('stock')
    })

    it('should handle update error', async () => {
      const updates = {
        name: 'Updated Product'
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to update product' }
          })
        })
      })

      const result = await updateProduct('1', updates)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await deleteProduct('1')

      expect(result.error).toBeNull()
    })

    it('should handle delete error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to delete product' }
          })
        })
      })

      const result = await deleteProduct('1')

      expect(result.error).toBeTruthy()
    })

    it('should not delete product with active orders', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'item-1', productId: '1' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const result = await deleteProduct('1')

      expect(result.error).toContain('active orders')
    })
  })

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null
          })
        })
      })

      const result = await getCategories()

      expect(result.data).toEqual(mockCategories)
      expect(result.error).toBeNull()
    })

    it('should include product count', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', products: [1, 2, 3] }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null
          })
        })
      })

      const result = await getCategories()

      expect(result.data[0].products).toBeDefined()
    })
  })

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 150 }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', stock: 100 },
              error: null
            })
          })
        })
      })

      const result = await updateStock('1', 50)

      expect(result.data.stock).toBe(150)
      expect(result.error).toBeNull()
    })

    it('should decrease stock', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 50 }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', stock: 100 },
              error: null
            })
          })
        })
      })

      const result = await updateStock('1', -50)

      expect(result.data.stock).toBe(50)
      expect(result.error).toBeNull()
    })

    it('should not allow negative stock', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', stock: 10 },
              error: null
            })
          })
        })
      })

      const result = await updateStock('1', -20)

      expect(result.data).toBeNull()
      expect(result.error).toContain('insufficient stock')
    })

    it('should handle product not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Product not found' }
            })
          })
        })
      })

      const result = await updateStock('invalid-id', 10)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('searchProducts', () => {
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

      const result = await searchProducts('milk')

      expect(result.data).toEqual(mockProducts)
      expect(result.error).toBeNull()
    })

    it('should search products by SKU', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', sku: 'MILK-001' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      })

      const result = await searchProducts('MILK-001')

      expect(result.data).toEqual(mockProducts)
      expect(result.error).toBeNull()
    })

    it('should handle empty search query', async () => {
      const result = await searchProducts('')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle no results', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const result = await searchProducts('nonexistent')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should search case-insensitively', async () => {
      const mockProducts = [
        { id: '1', name: 'MILK', price: 5.50 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        })
      })

      const result = await searchProducts('milk')

      expect(result.data).toEqual(mockProducts)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large price', async () => {
      const product = {
        name: 'Expensive Product',
        sku: 'EXP-001',
        price: 999999.99,
        categoryId: 'cat-1',
        stock: 1,
        unit: 'piece'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [{ id: '1', ...product }],
          error: null
        })
      })

      const result = await createProduct(product)

      expect(result.data).toBeTruthy()
    })

    it('should handle very large stock', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', stock: 1000000 }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', stock: 0 },
              error: null
            })
          })
        })
      })

      const result = await updateStock('1', 1000000)

      expect(result.data.stock).toBe(1000000)
    })

    it('should handle special characters in product name', async () => {
      const product = {
        name: 'Product & "Special" Characters',
        sku: 'SPEC-001',
        price: 10,
        categoryId: 'cat-1',
        stock: 100,
        unit: 'piece'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [{ id: '1', ...product }],
          error: null
        })
      })

      const result = await createProduct(product)

      expect(result.data).toBeTruthy()
    })
  })
})
