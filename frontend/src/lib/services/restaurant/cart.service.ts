import { createBrowserClient } from '@/lib/supabase/client'
import type { CartItem } from '@/lib/store/cart.store'
import { logger } from '@/lib/logger'
import { Database } from '@/types/restaurant-temp'

export class CartService {
  private supabase = createBrowserClient()

  async saveCartSnapshot(items: CartItem[]) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return

    // Prepare data for upsert
    const snapshots = items.map((item) => ({
      restaurant_id: user.id,
      product_id: item.productId,
      quantity: item.quantity,
      updated_at: new Date().toISOString(),
    }))

    // First, delete existing snapshot items that are no longer in the cart
    // This is a simple strategy: delete all for this user and re-insert
    // A more efficient way would be to diff, but this ensures consistency
    const { error: deleteError } = await this.supabase
      .from('cart_snapshots')
      .delete()
      .eq('restaurant_id', user.id)

    if (deleteError) {
      logger.error('Error clearing old cart snapshot:', deleteError)
      return
    }

    if (snapshots.length > 0) {
      const { error: insertError } = await this.supabase.from('cart_snapshots').insert(snapshots)

      if (insertError) {
        logger.error('Error saving cart snapshot:', insertError)
      }
    }
  }

  async loadCartSnapshot(): Promise<CartItem[] | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('cart_snapshots')
      .select(
        `
        quantity,
        product:products (
          id,
          name,
          category,
          unit,
          image_url:image,
          is_active
        )
      `
      )
      .eq('restaurant_id', user.id)

    if (error) {
      logger.error('Error loading cart snapshot:', error)
      return null
    }

    if (!data) return []

    // Map the response to CartItem format
    // Note: We need to cast the response because the types might not match exactly
    // until we have the full generated types
    return data.map((item: any) => ({
      productId: item.product.id,
      quantity: item.quantity,
      product: item.product,
    }))
  }
}

export const cartService = new CartService()
