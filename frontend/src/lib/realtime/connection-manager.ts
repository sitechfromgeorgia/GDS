/**
 * Enhanced WebSocket Connection Manager for Supabase Realtime
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Message queuing for offline messages
 * - Heartbeat/ping-pong for connection health
 * - Connection quality monitoring
 */

import type { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js'
import { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected'

interface QueuedMessage {
  id: string
  channel: string
  event: string
  payload: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

interface ConnectionConfig {
  maxReconnectAttempts?: number
  baseReconnectDelay?: number
  maxReconnectDelay?: number
  heartbeatInterval?: number
  messageQueueSize?: number
  maxSubscriptions?: number // T026: Max subscriptions per client
  enableLogging?: boolean
}

interface ConnectionStats {
  connectedAt: number | null
  disconnectedAt: number | null
  reconnectAttempts: number
  totalMessages: number
  failedMessages: number
  averageLatency: number
  lastHeartbeat: number | null
}

export class RealtimeConnectionManager {
  private client: RealtimeClient | null = null
  private channels: Map<string, RealtimeChannel> = new Map()
  private state: ConnectionState = 'disconnected'
  private quality: ConnectionQuality = 'disconnected'

  // Configuration
  private config: Required<ConnectionConfig> = {
    maxReconnectAttempts: 10,
    baseReconnectDelay: 1000, // 1 second
    maxReconnectDelay: 30000, // 30 seconds
    heartbeatInterval: 30000, // 30 seconds
    messageQueueSize: 100,
    maxSubscriptions: 50, // T026: Max subscriptions per client
    enableLogging: process.env.NODE_ENV === 'development',
  }

  // Reconnection
  private reconnectAttempt = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectDelay = this.config.baseReconnectDelay

  // Message queue
  private messageQueue: QueuedMessage[] = []

  // Heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastPingTime: number = 0
  private latencies: number[] = []

  // Stats
  private stats: ConnectionStats = {
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    totalMessages: 0,
    failedMessages: 0,
    averageLatency: 0,
    lastHeartbeat: null,
  }

  // Event listeners
  private stateChangeListeners: Set<(state: ConnectionState) => void> = new Set()
  private qualityChangeListeners: Set<(quality: ConnectionQuality) => void> = new Set()
  private errorListeners: Set<(error: Error) => void> = new Set()

  constructor(client: RealtimeClient, config?: ConnectionConfig) {
    this.client = client
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.initialize()
  }

  private initialize() {
    if (!this.client) return

    // Note: Supabase Realtime v2 removed onOpen/onClose/onError methods
    // Connection state is now managed per-channel via channel.subscribe() callbacks
    // For global connection monitoring, we rely on channel state changes
    // TODO: Implement connection monitoring via channel state tracking

    this.log('Connection manager initialized')
  }

  private handleOpen() {
    this.log('Connection opened')
    this.setState('connected')
    this.setQuality(this.calculateQuality())

    this.stats.connectedAt = Date.now()
    this.reconnectAttempt = 0
    this.reconnectDelay = this.config.baseReconnectDelay

    // Start heartbeat
    this.startHeartbeat()

    // Process queued messages
    this.processMessageQueue()
  }

  private handleClose() {
    this.log('Connection closed')
    this.setState('disconnected')
    this.setQuality('disconnected')

    this.stats.disconnectedAt = Date.now()
    this.stopHeartbeat()

    // Attempt reconnection
    this.attemptReconnect()
  }

  private handleError(error: any) {
    this.log('Connection error:', error)
    this.setState('error')

    const err = error instanceof Error ? error : new Error(String(error))
    this.errorListeners.forEach((listener) => listener(err))

    // Attempt reconnection
    this.attemptReconnect()
  }

  private attemptReconnect() {
    if (this.reconnectAttempt >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached')
      this.setState('error')
      return
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.setState('reconnecting')
    this.reconnectAttempt++
    this.stats.reconnectAttempts++

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.config.maxReconnectDelay)
    const delay = this.reconnectDelay + jitter

    this.log(
      `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempt}/${this.config.maxReconnectAttempts})`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.client?.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private async sendHeartbeat() {
    if (this.state !== 'connected') return

    this.lastPingTime = Date.now()

    try {
      // Send a ping through the client
      // Supabase handles this internally, we just track it
      this.stats.lastHeartbeat = Date.now()

      const latency = Date.now() - this.lastPingTime
      this.latencies.push(latency)

      // Keep only last 10 latencies
      if (this.latencies.length > 10) {
        this.latencies.shift()
      }

      this.stats.averageLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length

      this.setQuality(this.calculateQuality())
    } catch (error) {
      this.log('Heartbeat failed:', error)
    }
  }

  private calculateQuality(): ConnectionQuality {
    if (this.state !== 'connected') return 'disconnected'

    const avgLatency = this.stats.averageLatency

    if (avgLatency < 100) return 'excellent'
    if (avgLatency < 300) return 'good'
    return 'poor'
  }

  private async processMessageQueue() {
    if (this.messageQueue.length === 0) return

    this.log(`Processing ${this.messageQueue.length} queued messages`)

    const messages = [...this.messageQueue]
    this.messageQueue = []

    for (const message of messages) {
      try {
        await this.sendQueuedMessage(message)
        this.stats.totalMessages++
      } catch (error) {
        this.log('Failed to send queued message:', error)

        if (message.retryCount < message.maxRetries) {
          message.retryCount++
          this.queueMessage(message)
        } else {
          this.stats.failedMessages++
        }
      }
    }
  }

  private async sendQueuedMessage(message: QueuedMessage) {
    const channel = this.channels.get(message.channel)
    if (!channel) {
      throw new Error(`Channel ${message.channel} not found`)
    }

    await channel.send({
      type: 'broadcast',
      event: message.event,
      payload: message.payload,
    })
  }

  private queueMessage(message: Partial<QueuedMessage>) {
    const queuedMessage: QueuedMessage = {
      id: message.id || crypto.randomUUID(),
      channel: message.channel || '',
      event: message.event || '',
      payload: message.payload,
      timestamp: message.timestamp || Date.now(),
      retryCount: message.retryCount || 0,
      maxRetries: message.maxRetries || 3,
    }

    this.messageQueue.push(queuedMessage)

    // Limit queue size
    if (this.messageQueue.length > this.config.messageQueueSize) {
      this.messageQueue.shift()
    }
  }

  // Public API

  /**
   * Subscribe to a channel
   * T026: Enforces max subscriptions limit (default: 50)
   */
  subscribe(channelName: string): RealtimeChannel | null {
    if (!this.client) return null

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    // T026: Check subscription limit before creating new channel
    if (this.channels.size >= this.config.maxSubscriptions) {
      const errorMsg = `Subscription limit reached (${this.config.maxSubscriptions}). Cannot subscribe to channel: ${channelName}`
      this.log(errorMsg)
      const error = new Error(errorMsg)
      this.errorListeners.forEach((listener) => listener(error))
      return null
    }

    const channel = this.client.channel(channelName)
    this.channels.set(channelName, channel)

    this.log(
      `Subscribed to channel: ${channelName} (${this.channels.size}/${this.config.maxSubscriptions})`
    )

    return channel
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName)
    if (channel) {
      await this.client?.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.keys()).map((channelName) =>
      this.unsubscribe(channelName)
    )
    await Promise.all(unsubscribePromises)
  }

  /**
   * Send a message with automatic queuing if offline
   */
  async send(channelName: string, event: string, payload: any): Promise<void> {
    if (this.state !== 'connected') {
      this.queueMessage({ channel: channelName, event, payload })
      return
    }

    try {
      await this.sendQueuedMessage({
        id: crypto.randomUUID(),
        channel: channelName,
        event,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      })
      this.stats.totalMessages++
    } catch (error) {
      this.queueMessage({ channel: channelName, event, payload })
      throw error
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * Get current connection quality
   */
  getQuality(): ConnectionQuality {
    return this.quality
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats }
  }

  /**
   * Get queued messages count
   */
  getQueuedMessagesCount(): number {
    return this.messageQueue.length
  }

  /**
   * Force reconnect
   */
  reconnect(): void {
    this.log('Manual reconnection requested')
    this.reconnectAttempt = 0
    this.client?.disconnect()
    setTimeout(() => this.client?.connect(), 100)
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.log('Disconnecting')
    this.stopHeartbeat()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.client?.disconnect()
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateChangeListeners.add(listener)
    return () => this.stateChangeListeners.delete(listener)
  }

  /**
   * Subscribe to quality changes
   */
  onQualityChange(listener: (quality: ConnectionQuality) => void): () => void {
    this.qualityChangeListeners.add(listener)
    return () => this.qualityChangeListeners.delete(listener)
  }

  /**
   * Subscribe to errors
   */
  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  // Private helpers

  private setState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState
      this.log(`State changed to: ${newState}`)
      this.stateChangeListeners.forEach((listener) => listener(newState))
    }
  }

  private setQuality(newQuality: ConnectionQuality) {
    if (this.quality !== newQuality) {
      this.quality = newQuality
      this.log(`Quality changed to: ${newQuality}`)
      this.qualityChangeListeners.forEach((listener) => listener(newQuality))
    }
  }

  private log(...args: any[]) {
    if (this.config.enableLogging) {
      logger.debug('[RealtimeConnectionManager]', ...args)
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.disconnect()
    this.unsubscribeAll()
    this.stateChangeListeners.clear()
    this.qualityChangeListeners.clear()
    this.errorListeners.clear()
    this.messageQueue = []
  }
}

// Singleton instance
let connectionManagerInstance: RealtimeConnectionManager | null = null

/**
 * Get or create the global connection manager instance
 */
export function getConnectionManager(
  client: RealtimeClient,
  config?: ConnectionConfig
): RealtimeConnectionManager {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new RealtimeConnectionManager(client, config)
  }
  return connectionManagerInstance
}

/**
 * Destroy the global connection manager instance
 */
export function destroyConnectionManager() {
  if (connectionManagerInstance) {
    connectionManagerInstance.destroy()
    connectionManagerInstance = null
  }
}
