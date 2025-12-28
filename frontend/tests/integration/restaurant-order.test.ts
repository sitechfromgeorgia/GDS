import { describe, it, expect, vi } from 'vitest'
import { orderService } from '@/lib/services/restaurant/order.service'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'new-order-id', status: 'pending' },
      error: null,
    }),
    rpc: vi.fn().mockResolvedValue({ data: 'new-order-id', error: null }),
  }),
}))

describe('Order Submission', () => {
  it('creates an order successfully', async () => {
    const orderData = {
      items: [{ productId: '1', quantity: 2, price: 10 }],
      totalAmount: 20,
      deliveryAddress: 'Test Address',
      contactPhone: '555123456',
    }

    const result = await orderService.createOrder(orderData)

    expect(result).toBeDefined()
    expect(result.id).toBe('new-order-id')
  })
})
