/**
 * useChatMessages Hook
 *
 * Provides real-time chat functionality between restaurant and driver
 * Features:
 * - Send and receive messages in real-time
 * - Read receipts
 * - Typing indicators
 * - Message history
 * - Unread count
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { ChatMessage, ChatMessageInsert } from '@/types/database'

interface UseChatMessagesOptions {
  orderId: string
  userId: string
  autoSubscribe?: boolean
  markAsReadOnReceive?: boolean
}

interface UseChatMessagesReturn {
  // Messages
  messages: ChatMessage[]
  unreadCount: number

  // Loading & error states
  isLoading: boolean
  isConnected: boolean
  error: Error | null

  // Actions
  sendMessage: (message: string, type?: string) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>

  // Typing indicator
  isOtherUserTyping: boolean
  startTyping: () => void
  stopTyping: () => void

  // Utilities
  loadMore: () => Promise<void>
  hasMore: boolean
  refresh: () => Promise<void>
}

export function useChatMessages(options: UseChatMessagesOptions): UseChatMessagesReturn {
  const { orderId, userId, autoSubscribe = true, markAsReadOnReceive = true } = options

  const supabase = createBrowserClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const MESSAGES_PER_PAGE = 50

  /**
   * Load messages from database
   */
  const loadMessages = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true)
        const currentOffset = reset ? 0 : offset

        const {
          data,
          error: fetchError,
          count,
        } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact' })
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + MESSAGES_PER_PAGE - 1)

        if (fetchError) throw fetchError

        if (reset) {
          setMessages(data?.reverse() || [])
        } else {
          setMessages((prev) => [...(data?.reverse() || []), ...prev])
        }

        setHasMore((count || 0) > currentOffset + MESSAGES_PER_PAGE)
        setOffset(reset ? MESSAGES_PER_PAGE : currentOffset + MESSAGES_PER_PAGE)

        // Calculate unread count
        const unread = data?.filter((m: ChatMessage) => !m.is_read && m.sender_id !== userId).length || 0
        setUnreadCount(unread)

        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load messages')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [orderId, userId, offset, supabase]
  )

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (message: string, type = 'text') => {
      if (!message.trim()) return

      try {
        const messageData: ChatMessageInsert = {
          order_id: orderId,
          sender_id: userId,
          message: message.trim(),
          message_type: type,
        }

        const { data, error: insertError } = await supabase
          .from('chat_messages')
          .insert(messageData)
          .select()
          .single()

        if (insertError) throw insertError

        // Message will be added via real-time subscription
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message')
        setError(error)
        throw error
      }
    },
    [orderId, userId, supabase]
  )

  /**
   * Mark a message as read
   */
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', messageId)
          .eq('order_id', orderId)

        if (updateError) throw updateError

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
          )
        )

        setUnreadCount((prev) => Math.max(0, prev - 1))
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to mark message as read')
        setError(error)
      }
    },
    [orderId, supabase]
  )

  /**
   * Mark all messages as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .eq('is_read', false)
        .neq('sender_id', userId)

      if (updateError) throw updateError

      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id !== userId && !m.is_read
            ? { ...m, is_read: true, read_at: new Date().toISOString() }
            : m
        )
      )

      setUnreadCount(0)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark all messages as read')
      setError(error)
    }
  }, [orderId, userId, supabase])

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('chat_messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', userId)

        if (deleteError) throw deleteError

        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete message')
        setError(error)
        throw error
      }
    },
    [userId, supabase]
  )

  /**
   * Start typing indicator
   */
  const startTyping = useCallback(() => {
    if (!channelRef.current) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: true },
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [userId])

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    if (!channelRef.current) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: false },
    })
  }, [userId])

  /**
   * Load more messages
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await loadMessages(false)
  }, [hasMore, isLoading, loadMessages])

  /**
   * Refresh messages
   */
  const refresh = useCallback(async () => {
    await loadMessages(true)
  }, [loadMessages])

  /**
   * Load initial messages
   */
  useEffect(() => {
    loadMessages(true)
  }, [orderId])

  /**
   * Subscribe to real-time messages
   */
  useEffect(() => {
    if (!autoSubscribe) return

    const channel = supabase
      .channel(`chat:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          const newMessage = payload.new as ChatMessage

          setMessages((prev) => [...prev, newMessage])

          // Update unread count if message is from other user
          if (newMessage.sender_id !== userId) {
            setUnreadCount((prev) => prev + 1)

            // Auto-mark as read if enabled
            if (markAsReadOnReceive) {
              markAsRead(newMessage.id)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          const updatedMessage = payload.new as ChatMessage
          setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)))
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { userId: typingUserId, isTyping } = payload.payload
        if (typingUserId !== userId) {
          setIsOtherUserTyping(isTyping)

          // Auto-clear typing indicator after 5 seconds
          if (isTyping) {
            setTimeout(() => setIsOtherUserTyping(false), 5000)
          }
        }
      })
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [orderId, userId, autoSubscribe, markAsReadOnReceive, supabase, markAsRead])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    messages,
    unreadCount,
    isLoading,
    isConnected,
    error,
    sendMessage,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    isOtherUserTyping,
    startTyping,
    stopTyping,
    loadMore,
    hasMore,
    refresh,
  }
}
