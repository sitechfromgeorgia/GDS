import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export type SubscriptionCallback = (payload: any) => void

export class RealtimeService {
  private client: SupabaseClient
  private channels: Map<string, RealtimeChannel> = new Map()

  constructor(client: SupabaseClient) {
    this.client = client
  }

  // Subscribe to order changes
  subscribeToOrders(userId: string, callback: SubscriptionCallback) {
    const channelName = `orders:${userId}`

    // Unsubscribe from existing channel if it exists
    this.unsubscribeFromChannel(channelName)

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to order status changes for drivers
  subscribeToOrderStatusChanges(callback: SubscriptionCallback) {
    const channelName = 'order_status_changes'

    this.unsubscribeFromChannel(channelName)

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: SubscriptionCallback) {
    const channelName = `notifications:${userId}`

    this.unsubscribeFromChannel(channelName)

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to admin dashboard changes
  subscribeToAdminDashboard(callback: SubscriptionCallback) {
    const channelName = 'admin_dashboard'

    this.unsubscribeFromChannel(channelName)

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Generic subscription to any table changes
  subscribeToTable(table: string, filter?: string, callback?: SubscriptionCallback) {
    const channelName = `table:${table}${filter ? `:${filter}` : ''}`

    this.unsubscribeFromChannel(channelName)

    let channel = this.client.channel(channelName)

    const config: any = {
      event: '*',
      schema: 'public',
      table: table,
    }

    if (filter) {
      config.filter = filter
    }

    channel = channel.on('postgres_changes', config, callback || (() => {}))
    channel = channel.subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Unsubscribe from specific channel
  unsubscribeFromChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.client.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Unsubscribe from all channels
  unsubscribeFromAll() {
    this.channels.forEach((channel, channelName) => {
      this.client.removeChannel(channel)
    })
    this.channels.clear()
  }

  // Get current connection status
  getConnectionStatus() {
    return this.client.realtime.getChannels()
  }

  // Send real-time message (for custom events)
  sendMessage(channelName: string, event: string, payload: any) {
    const channel = this.channels.get(channelName)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
    throw new Error(`Channel ${channelName} not found`)
  }

  // Track user presence
  trackUserPresence(channelName: string, userId: string, userData: any = {}) {
    const channel = this.channels.get(channelName)
    if (channel) {
      return channel.track({
        user_id: userId,
        user_name: userData.user_name,
        user_role: userData.user_role,
        online_at: new Date().toISOString(),
      })
    }
    throw new Error(`Channel ${channelName} not found`)
  }

  // Stop tracking user presence
  untrackUserPresence(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      return channel.untrack()
    }
    return Promise.resolve()
  }

  // Check if a channel is active
  isChannelActive(channelName: string): boolean {
    return this.channels.has(channelName)
  }

  // Get all active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Create singleton instance for the current client
export function createRealtimeService(client: SupabaseClient): RealtimeService {
  return new RealtimeService(client)
}

// Default instance that can be used globally
let defaultRealtimeService: RealtimeService | null = null

export function getDefaultRealtimeService(): RealtimeService | null {
  return defaultRealtimeService
}

export function setDefaultRealtimeService(service: RealtimeService) {
  defaultRealtimeService = service
}
