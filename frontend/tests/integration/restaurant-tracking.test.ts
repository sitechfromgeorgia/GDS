import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock functions for channel - hoisted with vi.hoisted
const { mockSubscribe, mockOn, mockChannel } = vi.hoisted(() => {
  const mockSubscribe = vi.fn()
  const mockOn = vi.fn()
  const mockChannel = vi.fn(() => ({
    on: mockOn,
    subscribe: mockSubscribe,
    unsubscribe: vi.fn(),
  }))
  // Set up the chaining: on() returns object with subscribe
  mockOn.mockReturnValue({ subscribe: mockSubscribe })
  return { mockSubscribe, mockOn, mockChannel }
})

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    channel: mockChannel,
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

// Import after mock
import { orderService } from '@/lib/services/restaurant/order.service'

describe('Order Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock return chain
    mockOn.mockReturnValue({ subscribe: mockSubscribe })
  })

  it('subscribes to order status changes', () => {
    const callback = vi.fn()
    orderService.subscribeToOrderStatus('order-123', callback)

    // Check channel was called with correct name
    expect(mockChannel).toHaveBeenCalledWith('order-status-order-123')

    // Check on() was called with correct arguments
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        table: 'orders',
        filter: 'id=eq.order-123',
      }),
      expect.any(Function)
    )
    expect(mockSubscribe).toHaveBeenCalled()
  })
})
