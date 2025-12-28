import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/products/route'

// Mock product data
const mockProducts = [{ id: '1', name: 'Test Product', category: 'meat', is_active: true }]

// Create a chainable mock query builder that resolves to { data, error }
const createMockQueryBuilder = () => {
  const queryChain = {
    select: vi.fn(() => queryChain),
    eq: vi.fn(() => queryChain),
    order: vi.fn(() => queryChain),
    ilike: vi.fn(() => queryChain),
    // Make the query awaitable by implementing then
    then: (resolve: (value: { data: typeof mockProducts; error: null }) => void) => {
      resolve({ data: mockProducts, error: null })
    },
  }
  return queryChain
}

// Mock Supabase client - returns object with from() method
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => createMockQueryBuilder()),
  })),
}))

describe('Product Catalog API', () => {
  it('returns products successfully', async () => {
    const request = new Request('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Test Product')
  })

  it('filters by category', async () => {
    const request = new Request('http://localhost:3000/api/products?category=meat')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })
})
