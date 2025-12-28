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
      data: { id: 'comment-1', content: 'Test comment' },
      error: null,
    }),
  }),
}))

describe('Order Comments', () => {
  it('adds a comment to an order', async () => {
    const comment = await orderService.addComment('order-1', 'Test comment')
    expect(comment).toBeDefined()
    expect(comment.content).toBe('Test comment')
  })
})
