/**
 * useRealtime Hook Test Suite
 * Tests for real-time subscription hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useRealtime } from '@/hooks/useRealtime'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('useRealtime Hook', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Subscription Setup', () => {
    it('should create subscription channel', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('orders'))

      expect(mockSupabase.channel).toHaveBeenCalledWith('orders')
    })

    it('should subscribe with event filter', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('orders', {
        event: 'INSERT'
      }))

      expect(mockSubscription.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ event: 'INSERT' }),
        expect.any(Function)
      )
    })

    it('should subscribe with table filter', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('custom-channel', {
        table: 'orders'
      }))

      expect(mockSubscription.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ table: 'orders' }),
        expect.any(Function)
      )
    })

    it('should subscribe with filter condition', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('orders', {
        filter: 'status=eq.pending'
      }))

      expect(mockSubscription.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ filter: 'status=eq.pending' }),
        expect.any(Function)
      )
    })
  })

  describe('Event Handling', () => {
    it('should handle INSERT events', async () => {
      let insertCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          insertCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onInsert = vi.fn()

      renderHook(() => useRealtime('orders', {
        onInsert
      }))

      const newRecord = {
        id: '1',
        orderNumber: 'ORD-001',
        status: 'pending'
      }

      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: newRecord
        })
      })

      await waitFor(() => {
        expect(onInsert).toHaveBeenCalledWith(newRecord)
      })
    })

    it('should handle UPDATE events', async () => {
      let updateCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          updateCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onUpdate = vi.fn()

      renderHook(() => useRealtime('orders', {
        onUpdate
      }))

      const updatedRecord = {
        id: '1',
        orderNumber: 'ORD-001',
        status: 'confirmed'
      }

      act(() => {
        updateCallback({
          eventType: 'UPDATE',
          old: { id: '1', status: 'pending' },
          new: updatedRecord
        })
      })

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          updatedRecord,
          { id: '1', status: 'pending' }
        )
      })
    })

    it('should handle DELETE events', async () => {
      let deleteCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          deleteCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onDelete = vi.fn()

      renderHook(() => useRealtime('orders', {
        onDelete
      }))

      const deletedRecord = {
        id: '1',
        orderNumber: 'ORD-001'
      }

      act(() => {
        deleteCallback({
          eventType: 'DELETE',
          old: deletedRecord
        })
      })

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith(deletedRecord)
      })
    })

    it('should handle all event types', async () => {
      let eventCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          eventCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onChange = vi.fn()

      renderHook(() => useRealtime('orders', {
        onChange
      }))

      act(() => {
        eventCallback({
          eventType: 'INSERT',
          new: { id: '1' }
        })
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({
          eventType: 'INSERT',
          new: { id: '1' }
        })
      })
    })
  })

  describe('Connection Status', () => {
    it('should track connection status', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          callback('SUBSCRIBED')
          return mockSubscription
        })
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { result } = renderHook(() => useRealtime('orders'))

      await waitFor(() => {
        expect(result.current.status).toBe('SUBSCRIBED')
      })
    })

    it('should handle connection errors', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          callback('CHANNEL_ERROR')
          return mockSubscription
        })
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { result } = renderHook(() => useRealtime('orders'))

      await waitFor(() => {
        expect(result.current.status).toBe('CHANNEL_ERROR')
      })
    })

    it('should report connected status', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          callback('SUBSCRIBED')
          return mockSubscription
        })
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { result } = renderHook(() => useRealtime('orders'))

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
    })
  })

  describe('Multiple Subscriptions', () => {
    it('should handle multiple event types', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onInsert = vi.fn()
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      renderHook(() => useRealtime('orders', {
        onInsert,
        onUpdate,
        onDelete
      }))

      expect(mockSubscription.on).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple channels', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('orders'))
      renderHook(() => useRealtime('products'))

      expect(mockSupabase.channel).toHaveBeenCalledWith('orders')
      expect(mockSupabase.channel).toHaveBeenCalledWith('products')
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn()

      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
        unsubscribe: mockUnsubscribe
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { unmount } = renderHook(() => useRealtime('orders'))

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should clean up all subscriptions', () => {
      const mockUnsubscribe = vi.fn()

      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
        unsubscribe: mockUnsubscribe
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { unmount } = renderHook(() => useRealtime('orders', {
        onInsert: vi.fn(),
        onUpdate: vi.fn(),
        onDelete: vi.fn()
      }))

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle subscription errors', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation(() => {
          throw new Error('Subscription failed')
        })
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { result } = renderHook(() => useRealtime('orders'))

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it('should handle callback errors', async () => {
      let eventCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          eventCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onInsert = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })

      renderHook(() => useRealtime('orders', {
        onInsert
      }))

      expect(() => {
        act(() => {
          eventCallback({
            eventType: 'INSERT',
            new: { id: '1' }
          })
        })
      }).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should disable automatic subscription', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      renderHook(() => useRealtime('orders', {
        enabled: false
      }))

      expect(mockSubscription.subscribe).not.toHaveBeenCalled()
    })

    it('should enable subscription later', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const { rerender } = renderHook(
        ({ enabled }) => useRealtime('orders', { enabled }),
        { initialProps: { enabled: false } }
      )

      expect(mockSubscription.subscribe).not.toHaveBeenCalled()

      rerender({ enabled: true })

      await waitFor(() => {
        expect(mockSubscription.subscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Performance', () => {
    it('should handle rapid events', async () => {
      let eventCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, config: any, callback: any) => {
          eventCallback = callback
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)

      const onChange = vi.fn()

      renderHook(() => useRealtime('orders', {
        onChange
      }))

      // Simulate rapid events
      for (let i = 0; i < 100; i++) {
        act(() => {
          eventCallback({
            eventType: 'INSERT',
            new: { id: `${i}` }
          })
        })
      }

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledTimes(100)
      })
    })
  })
})
