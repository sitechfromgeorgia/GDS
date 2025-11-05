/**
 * LiveChat Component
 *
 * Real-time chat interface for restaurant-driver communication
 * Features:
 * - Real-time message updates
 * - Typing indicators
 * - Read receipts
 * - Auto-scroll to bottom
 * - Message timestamps
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useUserPresence } from '@/hooks/useUserPresence'
import type { ChatMessage } from '@/types/database'
import { logger } from '@/lib/logger'

interface LiveChatProps {
  orderId: string
  userId: string
  otherUserId: string
  otherUserName: string
  className?: string
}

export function LiveChat({
  orderId,
  userId,
  otherUserId,
  otherUserName,
  className = '',
}: LiveChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [messageText, setMessageText] = useState('')
  const [isTypingLocal, setIsTypingLocal] = useState(false)

  const {
    messages,
    unreadCount,
    isLoading,
    isConnected,
    error,
    sendMessage,
    markAllAsRead,
    isOtherUserTyping,
    startTyping,
    stopTyping,
  } = useChatMessages({
    orderId,
    userId,
    markAsReadOnReceive: true,
  })

  const { presences } = useUserPresence({
    userIds: [otherUserId],
  })

  const otherUserPresence = presences.get(otherUserId)
  const isOtherUserOnline =
    otherUserPresence?.status === 'online' || otherUserPresence?.status === 'busy'

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Handle send message
   */
  const handleSendMessage = async () => {
    if (!messageText.trim()) return

    try {
      await sendMessage(messageText)
      setMessageText('')
      stopTyping()
      setIsTypingLocal(false)

      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    } catch (err) {
      logger.error('Failed to send chat message', err as Error, { orderId })
    }
  }

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value)

    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'

    // Typing indicator
    if (!isTypingLocal && e.target.value) {
      setIsTypingLocal(true)
      startTyping()
    } else if (isTypingLocal && !e.target.value) {
      setIsTypingLocal(false)
      stopTyping()
    }
  }

  /**
   * Handle key press
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
  }

  /**
   * Group messages by sender for better UI
   */
  const groupMessages = (msgs: ChatMessage[]) => {
    const grouped: ChatMessage[][] = []
    let currentGroup: ChatMessage[] = []
    let lastSenderId: string | null = null

    msgs.forEach((msg) => {
      if (msg.sender_id !== lastSenderId) {
        if (currentGroup.length > 0) {
          grouped.push(currentGroup)
        }
        currentGroup = [msg]
        lastSenderId = msg.sender_id
      } else {
        currentGroup.push(msg)
      }
    })

    if (currentGroup.length > 0) {
      grouped.push(currentGroup)
    }

    return grouped
  }

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Mark messages as read when component mounts
   */
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead()
    }
  }, [unreadCount, markAllAsRead])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
            {isOtherUserOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
            <p className="text-xs text-gray-500">{isOtherUserOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isConnected && (
            <span className="text-xs text-amber-600 flex items-center">
              <span className="w-2 h-2 bg-amber-600 rounded-full mr-1 animate-pulse"></span>
              Connecting...
            </span>
          )}
          {isConnected && (
            <span className="text-xs text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start a conversation!</p>
          </div>
        ) : (
          <>
            {groupMessages(messages).map((group, groupIndex) => {
              const isOwnMessage = group[0]?.sender_id === userId
              return (
                <div
                  key={groupIndex}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col space-y-1 max-w-[70%]`}>
                    {group.map((message, index) => (
                      <div
                        key={message.id}
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        {index === group.length - 1 && (
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            <span>{formatTime(message.created_at)}</span>
                            {isOwnMessage && message.is_read && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg rounded-bl-none px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[42px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !isConnected}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 h-[42px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
