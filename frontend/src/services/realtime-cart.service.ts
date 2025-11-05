'use client'
import { logger } from '@/lib/logger'

import { createBrowserClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Cart, CartItem, CartItemInput, CartUpdateInput } from '@/types/cart'
import { CartSession, RealtimeCartUpdate, CartActivityType } from '@/types/realtime-cart'

// Create Supabase client instance
const supabase = createBrowserClient()

export interface RealtimeCartConfig {
  enableRealTime?: boolean
  sessionToken?: string
  userId?: string
}

export class RealtimeCartService {
  private channel: RealtimeChannel | null = null
  private config: RealtimeCartConfig
  private sessionId: string | null = null

  constructor(config: RealtimeCartConfig = {}) {
    this.config = {
      enableRealTime: true,
      ...config,
    }
  }

  /**
   * Initialize cart session for real-time synchronization
   */
  async initializeSession(): Promise<CartSession> {
    try {
      // Generate session token if not provided
      const sessionToken = this.config.sessionToken || this.generateSessionToken()

      // Check for existing active session
      const { data: existingSession, error: sessionError } = await supabase
        .from('cart_sessions' as any)
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw new Error(`Session lookup failed: ${sessionError.message}`)
      }

      if (existingSession) {
        this.sessionId = (existingSession as any).id
        await this.updateSessionActivity((existingSession as any).id)
        return existingSession as any
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('cart_sessions' as any)
        .insert({
          session_token: sessionToken,
          user_id: this.config.userId,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create cart session: ${createError.message}`)
      }

      this.sessionId = (newSession as any).id
      return newSession as any
    } catch (error) {
      logger.error('Failed to initialize cart session:', error)
      throw error
    }
  }

  /**
   * Get cart data from database
   */
  async getCart(): Promise<Cart> {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      // Get cart session with items
      const { data: sessionData, error: sessionError } = await supabase
        .from('cart_sessions' as any)
        .select(
          `
          *,
          cart_items (
            *,
            products (*)
          )
        `
        )
        .eq('id', this.sessionId!)
        .single()

      if (sessionError) {
        throw new Error(`Failed to fetch cart session: ${sessionError.message}`)
      }

      const cartItems = (sessionData as any).cart_items || []

      // Convert to Cart format
      const cart: Cart = {
        id: (sessionData as any).id,
        sessionToken: (sessionData as any).session_token,
        status: 'active',
        items: cartItems.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          product: item.products,
          quantity: item.quantity,
          notes: item.notes,
          unitPrice: parseFloat(item.unit_price || '0'),
          totalPrice: parseFloat(item.total_price || '0'),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        totalItems: cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        totalPrice: cartItems.reduce(
          (sum: number, item: any) => sum + parseFloat(item.total_price || '0'),
          0
        ),
        createdAt: (sessionData as any).created_at,
        updatedAt: (sessionData as any).updated_at,
      }

      return cart
    } catch (error) {
      logger.error('Failed to fetch cart:', error)
      throw error
    }
  }

  /**
   * Add item to cart with real-time sync
   */
  async addItem(input: CartItemInput): Promise<CartItem> {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      // Get product details for pricing
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', input.productId)
        .single()

      if (productError) {
        throw new Error(`Product not found: ${input.productId}`)
      }

      const unitPrice = parseFloat((product as any).price || '0')
      const totalPrice = unitPrice * (input.quantity || 1)

      // Use upsert to handle existing items
      const { data: cartItem, error: upsertError } = await (
        supabase.from('cart_items' as any) as any
      )
        .upsert(
          {
            cart_session_id: this.sessionId!,
            product_id: input.productId,
            quantity: input.quantity || 1,
            notes: input.notes,
            unit_price: unitPrice,
            total_price: totalPrice,
          },
          {
            onConflict: 'cart_session_id,product_id',
          }
        )
        .select(
          `
          *,
          products (*)
        `
        )
        .single()

      if (upsertError) {
        throw new Error(`Failed to add item to cart: ${upsertError.message}`)
      }

      // Log activity
      await this.logCartActivity(
        'item_added',
        input.productId,
        null,
        input.quantity || 1,
        input.notes
      )

      return {
        id: cartItem.id,
        productId: cartItem.product_id,
        product: cartItem.products,
        quantity: cartItem.quantity,
        notes: cartItem.notes,
        unitPrice: parseFloat(cartItem.unit_price || '0'),
        totalPrice: parseFloat(cartItem.total_price || '0'),
        createdAt: cartItem.created_at,
        updatedAt: cartItem.updated_at,
      }
    } catch (error) {
      logger.error('Failed to add item to cart:', error)
      throw error
    }
  }

  /**
   * Update cart item with real-time sync
   */
  async updateItem(input: CartUpdateInput): Promise<CartItem> {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('cart_items' as any)
        .select('*, products(*)')
        .eq('id', input.itemId)
        .eq('cart_session_id', this.sessionId!)
        .single()

      if (fetchError) {
        throw new Error(`Cart item not found: ${input.itemId}`)
      }

      const unitPrice = parseFloat((currentItem as any).unit_price || '0')
      const totalPrice = unitPrice * input.quantity

      // Update the item
      const { data: updatedItem, error: updateError } = await (
        supabase.from('cart_items' as any) as any
      )
        .update({
          quantity: input.quantity,
          notes: input.notes,
          total_price: totalPrice,
        })
        .eq('id', input.itemId)
        .eq('cart_session_id', this.sessionId!)
        .select(
          `
          *,
          products (*)
        `
        )
        .single()

      if (updateError) {
        throw new Error(`Failed to update cart item: ${updateError.message}`)
      }

      // Log activity
      await this.logCartActivity(
        'item_updated',
        (updatedItem as any).product_id,
        (currentItem as any).quantity,
        input.quantity,
        input.notes
      )

      return {
        id: (updatedItem as any).id,
        productId: (updatedItem as any).product_id,
        product: (updatedItem as any).products,
        quantity: (updatedItem as any).quantity,
        notes: (updatedItem as any).notes,
        unitPrice: parseFloat((updatedItem as any).unit_price || '0'),
        totalPrice: parseFloat((updatedItem as any).total_price || '0'),
        createdAt: (updatedItem as any).created_at,
        updatedAt: (updatedItem as any).updated_at,
      }
    } catch (error) {
      logger.error('Failed to update cart item:', error)
      throw error
    }
  }

  /**
   * Remove item from cart with real-time sync
   */
  async removeItem(itemId: string): Promise<void> {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      // Get item data before deletion
      const { data: item, error: fetchError } = await supabase
        .from('cart_items' as any)
        .select('product_id, quantity')
        .eq('id', itemId)
        .eq('cart_session_id', this.sessionId!)
        .single()

      if (fetchError) {
        throw new Error(`Cart item not found: ${itemId}`)
      }

      // Delete the item
      const { error: deleteError } = await supabase
        .from('cart_items' as any)
        .delete()
        .eq('id', itemId)
        .eq('cart_session_id', this.sessionId!)

      if (deleteError) {
        throw new Error(`Failed to remove cart item: ${deleteError.message}`)
      }

      // Log activity
      await this.logCartActivity(
        'item_removed',
        (item as any).product_id,
        (item as any).quantity,
        0
      )
    } catch (error) {
      logger.error('Failed to remove cart item:', error)
      throw error
    }
  }

  /**
   * Clear entire cart with real-time sync
   */
  async clearCart(): Promise<void> {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      // Get all items before clearing
      const { data: items, error: fetchError } = await supabase
        .from('cart_items' as any)
        .select('product_id, quantity')
        .eq('cart_session_id', this.sessionId!)

      if (fetchError) {
        throw new Error(`Failed to fetch cart items: ${fetchError.message}`)
      }

      // Clear all items
      const { error: deleteError } = await supabase
        .from('cart_items' as any)
        .delete()
        .eq('cart_session_id', this.sessionId!)

      if (deleteError) {
        throw new Error(`Failed to clear cart: ${deleteError.message}`)
      }

      // Log activity for each item
      for (const item of items || []) {
        await this.logCartActivity(
          'item_removed',
          (item as any).product_id,
          (item as any).quantity,
          0
        )
      }

      await this.logCartActivity('cart_cleared', null, null, null)
    } catch (error) {
      logger.error('Failed to clear cart:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time cart updates
   */
  subscribeToCartUpdates(callback: (update: RealtimeCartUpdate) => void): () => void {
    if (!this.sessionId || !this.config.enableRealTime) {
      return () => {}
    }

    // Create channel for this cart session
    this.channel = supabase.channel(`cart:${this.sessionId}`)

    // Subscribe to cart_items changes
    this.channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_session_id=eq.${this.sessionId}`,
        },
        (payload) => {
          const update: RealtimeCartUpdate = {
            type: this.mapEventTypeToCartUpdateType(payload.eventType),
            sessionId: this.sessionId!,
            data: payload.new || payload.old,
            timestamp: new Date().toISOString(),
          }
          callback(update)
        }
      )
      .subscribe()

    // Subscribe to cart_activities changes
    this.channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cart_activities',
          filter: `cart_session_id=eq.${this.sessionId}`,
        },
        (payload) => {
          const update: RealtimeCartUpdate = {
            type: 'activity',
            sessionId: this.sessionId!,
            data: payload.new,
            timestamp: new Date().toISOString(),
          }
          callback(update)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      this.unsubscribe()
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('cart_sessions' as any)
        .update({
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    } catch (error) {
      logger.warn('Failed to update session activity', { error })
    }
  }

  /**
   * Log cart activity for real-time updates
   */
  private async logCartActivity(
    activityType: CartActivityType,
    productId: string | null,
    oldQuantity: number | null,
    newQuantity: number | null,
    notes?: string
  ): Promise<void> {
    try {
      await supabase.from('cart_activities' as any).insert({
        cart_session_id: this.sessionId,
        activity_type: activityType,
        product_id: productId,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        notes,
      })
    } catch (error) {
      logger.warn('Failed to log cart activity', { error })
    }
  }

  /**
   * Clean up expired cart sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await (supabase as any).rpc('cleanup_expired_cart_sessions')

      if (error) {
        throw new Error(`Failed to cleanup expired sessions: ${error.message}`)
      }

      return (data as any) || 0
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error)
      throw error
    }
  }

  /**
   * Generate unique session token
   */
  private generateSessionToken(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Map PostgreSQL event type to cart update type
   */
  private mapEventTypeToCartUpdateType(eventType: string): string {
    switch (eventType) {
      case 'INSERT':
        return 'item_added'
      case 'UPDATE':
        return 'item_updated'
      case 'DELETE':
        return 'item_removed'
      default:
        return 'unknown'
    }
  }

  /**
   * Get cart statistics
   */
  async getCartStatistics() {
    if (!this.sessionId) {
      await this.initializeSession()
    }

    try {
      const { data, error } = await supabase
        .from('cart_session_summary' as any)
        .select('*')
        .eq('id', this.sessionId!)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch cart statistics: ${error.message}`)
      }

      return (
        data || {
          item_count: 0,
          total_price: 0,
          total_quantity: 0,
        }
      )
    } catch (error) {
      logger.error('Failed to fetch cart statistics', { error })
      return {
        item_count: 0,
        total_price: 0,
        total_quantity: 0,
      }
    }
  }
}

// Singleton pattern for app-wide service instance
let realtimeCartServiceInstance: RealtimeCartService | null = null

export function getRealtimeCartService(config?: RealtimeCartConfig): RealtimeCartService {
  if (!realtimeCartServiceInstance) {
    realtimeCartServiceInstance = new RealtimeCartService(config)
  }
  return realtimeCartServiceInstance
}

// Export default instance
export const realtimeCart = getRealtimeCartService()
