import { describe, it, expect, vi } from 'vitest'
import { orderService } from '@/lib/services/restaurant/order.service'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        { id: '1', status: 'delivered' },
        { id: '2', status: 'pending' },
      ],
      error: null,
    }),
  }),
}))

describe('Order History API', () => {
  it('fetches order history', async () => {
    const orders = await orderService.getOrders()
    expect(orders).toHaveLength(2)
    expect(orders[0].id).toBe('1')
    expect(orders[1].status).toBe('pending')
  })
})
