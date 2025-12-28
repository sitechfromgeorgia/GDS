/**
 * Cart Service
 * Handles shopping cart operations
 * Supports both Authenticated (Supabase) and Guest (LocalStorage) modes
 */

import { createBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'

type CartSnapshot = Database['public']['Tables']['cart_snapshots']['Row']

export interface CartItem {
  id: string // Constructed from product_id for frontend compatibility
  user_id: string
  product_id: string
  quantity: number
  created_at?: string
  updated_at?: string
  product?: any // Join result
}

const CART_STORAGE_KEY = 'distribution_system_cart'

export class CartService {
  private static get supabase() {
    return createBrowserClient()
  }

  static async getCartItems(userId?: string): Promise<CartItem[]> {
    if (userId) {
      // Authenticated: Fetch from Supabase
      const { data, error } = await this.supabase
        .from('cart_snapshots')
        .select(
          `
          *,
          product:products(*)
        `
        )
        .eq('restaurant_id', userId)

      if (error) {
        logger.error('Error fetching cart:', error)
        return []
      }

      return (data || []).map((item: any) => ({
        id: item.product_id, // Use product_id as ID since it's part of PK
        user_id: item.restaurant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        updated_at: item.updated_at,
        product: item.product,
      }))
    } else {
      // Guest: Fetch from LocalStorage
      if (typeof window === 'undefined') return []
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
      } catch (e) {
        logger.error('Error reading cart from local storage', e)
        return []
      }
    }
  }

  static async addToCart(
    userId: string | undefined,
    productId: string,
    quantity: number
  ): Promise<CartItem | null> {
    const items = await this.getCartItems(userId)
    const existing = items.find((i) => i.product_id === productId)
    const newQuantity = (existing?.quantity || 0) + quantity

    if (userId) {
      // Authenticated
      const { data, error } = await this.supabase
        .from('cart_snapshots')
        .upsert({
          restaurant_id: userId,
          product_id: productId,
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        logger.error('Error adding to cart:', error)
        return null
      }

      return {
        id: productId,
        user_id: userId,
        product_id: productId,
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      }
    } else {
      // Guest
      const newItem: CartItem = existing
        ? { ...existing, quantity: newQuantity, updated_at: new Date().toISOString() }
        : {
            id: productId,
            user_id: 'guest',
            product_id: productId,
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          }

      const newItems = existing
        ? items.map((i) => (i.product_id === productId ? newItem : i))
        : [...items, newItem]

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
      return newItem
    }
  }

  static async updateCartItem(
    userId: string | undefined,
    productId: string,
    quantity: number
  ): Promise<boolean> {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId)
    }

    if (userId) {
      const { error } = await this.supabase.from('cart_snapshots').upsert({
        restaurant_id: userId,
        product_id: productId,
        quantity: quantity,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        logger.error('Error updating cart item:', error)
        return false
      }
      return true
    } else {
      const items = await this.getCartItems(userId)
      const newItems = items.map((i) =>
        i.product_id === productId ? { ...i, quantity, updated_at: new Date().toISOString() } : i
      )
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
      return true
    }
  }

  static async removeFromCart(userId: string | undefined, productId: string): Promise<boolean> {
    if (userId) {
      const { error } = await this.supabase
        .from('cart_snapshots')
        .delete()
        .eq('restaurant_id', userId)
        .eq('product_id', productId)

      if (error) {
        logger.error('Error removing cart item:', error)
        return false
      }
      return true
    } else {
      const items = await this.getCartItems(userId)
      const newItems = items.filter((i) => i.product_id !== productId)
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
      return true
    }
  }

  static async clearCart(userId?: string): Promise<boolean> {
    if (userId) {
      const { error } = await this.supabase
        .from('cart_snapshots')
        .delete()
        .eq('restaurant_id', userId)

      if (error) {
        logger.error('Error clearing cart:', error)
        return false
      }
      return true
    } else {
      localStorage.removeItem(CART_STORAGE_KEY)
      return true
    }
  }

  /**
   * Syncs local storage cart with Supabase database after login
   */
  static async syncLocalCartToDatabase(userId: string): Promise<void> {
    const localItems = await this.getCartItems(undefined) // Get guest items
    if (localItems.length === 0) return

    // Upload each item
    for (const item of localItems) {
      await this.addToCart(userId, item.product_id, item.quantity)
    }

    // Clear local storage
    this.clearCart(undefined)
  }
}
