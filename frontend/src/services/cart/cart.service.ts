import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import {
  Cart,
  CartItem,
  CartItemInput,
  CartUpdateInput,
  CartFilters,
  CartValidationResult,
  CartStatistics,
} from '@/types/cart'
import { productService } from '@/services/products/product.service'
import { z } from 'zod'

// Cart validation schemas
const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1).max(1000),
  notes: z.string().max(500).optional(),
})

const cartUpdateInputSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional(),
})

export class CartService {
  private supabase = createBrowserClient()
  private readonly STORAGE_KEY = 'georgian-distribution-cart'
  private readonly CART_TTL = 24 * 60 * 60 * 1000 // 24 hours

  // Generate unique cart ID
  private generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get current user from session
  private async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser()
    if (error) {
      logger.error('Error getting current user:', error)
      return null
    }
    return user
  }

  // Cart persistence to localStorage
  saveCartToStorage(cart: Cart): void {
    try {
      const cartData = {
        ...cart,
        expiresAt: new Date(Date.now() + this.CART_TTL),
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartData))
    } catch (error) {
      logger.error('Error saving cart to localStorage:', error)
    }
  }

  // Load cart from localStorage
  loadCartFromStorage(): Cart | null {
    try {
      const cartData = localStorage.getItem(this.STORAGE_KEY)
      if (!cartData) return null

      const cart = JSON.parse(cartData)

      // Check if cart is expired
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        this.clearStorage()
        return null
      }

      // Convert date strings back to Date objects
      cart.createdAt = new Date(cart.createdAt)
      cart.updatedAt = new Date(cart.updatedAt)
      cart.expiresAt = cart.expiresAt ? new Date(cart.expiresAt) : undefined

      // Convert cart items
      cart.items = cart.items.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
        updatedAt: new Date(item.updatedAt),
      }))

      return cart
    } catch (error) {
      logger.error('Error loading cart from localStorage:', error)
      this.clearStorage()
      return null
    }
  }

  // Clear cart storage
  clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      logger.error('Error clearing cart storage:', error)
    }
  }

  // Validate cart item input
  validateCartItemInput(input: CartItemInput): CartValidationResult {
    const errors: { code: string; message: string; field?: string }[] = []
    const warnings: { code: string; message: string; field?: string }[] = []

    try {
      cartItemInputSchema.parse(input)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err: z.ZodIssue) => {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: err.message,
            field: err.path.join('.'),
          })
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Add item to cart
  async addItemToCart(input: CartItemInput): Promise<Cart> {
    const validation = this.validateCartItemInput(input)
    if (!validation.isValid) {
      throw new Error(
        `Cart validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
      )
    }

    const user = await this.getCurrentUser()

    // Load existing cart or create new one
    let cart = this.loadCartFromStorage()
    if (!cart) {
      cart = this.createNewCart(user?.id || 'anonymous')
    }

    // Get product details
    const product = await productService.getProductById(input.productId)
    if (!product) {
      throw new Error(`Product ${input.productId} not found`)
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => item.productId === input.productId)

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cart.items[existingItemIndex]
      if (!existingItem) {
        throw new Error('Item not found in cart')
      }
      const newQuantity = existingItem.quantity + (input.quantity ?? 0)

      cart.items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newQuantity * existingItem.unitPrice,
        updatedAt: new Date().toISOString(),
        notes: input.notes || existingItem.notes,
      }
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: input.productId,
        product: {
          id: (product as any).id,
          name: (product as any).name,
          name_ka: (product as any).name_ka,
          price: (product as any).price,
          unit: (product as any).unit,
          image_url: (product as any).image_url,
          category: (product as any).category,
        },
        quantity: input.quantity ?? 0,
        unitPrice: (product as any).price,
        totalPrice: (product as any).price * (input.quantity ?? 0),
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      cart.items.push(newItem)
    }

    // Recalculate cart totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
    cart.updatedAt = new Date().toISOString()

    // Save to storage
    this.saveCartToStorage(cart)

    // Sync to backend if user is logged in
    if (user) {
      try {
        await this.syncCartToBackend(cart)
      } catch (error) {
        logger.error('Error syncing cart to backend:', error)
        // Continue with local cart even if sync fails
      }
    }

    return cart
  }

  // Update cart item
  async updateCartItem(input: CartUpdateInput): Promise<Cart> {
    const validation = cartUpdateInputSchema.safeParse(input)
    if (!validation.success) {
      throw new Error('Invalid cart update input')
    }

    const cart = this.loadCartFromStorage()
    if (!cart) {
      throw new Error('No active cart found')
    }

    const itemIndex = cart.items.findIndex((item) => item.id === input.itemId)
    if (itemIndex < 0) {
      throw new Error('Cart item not found')
    }

    const item = cart.items[itemIndex]
    if (!item) {
      throw new Error('Cart item not found')
    }

    // If quantity is 0 or less, remove the item
    if (input.quantity !== undefined && input.quantity <= 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      // Update the item
      cart.items[itemIndex] = {
        ...item,
        quantity: input.quantity || item.quantity,
        totalPrice: (input.quantity || item.quantity) * item.unitPrice,
        updatedAt: new Date().toISOString(),
        notes: input.notes !== undefined ? input.notes : item.notes,
      } as CartItem
    }

    // Recalculate cart totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
    cart.updatedAt = new Date().toISOString()

    // Save to storage
    this.saveCartToStorage(cart)

    // Sync to backend if user is logged in
    const user = await this.getCurrentUser()
    if (user) {
      try {
        await this.syncCartToBackend(cart)
      } catch (error) {
        logger.error('Error syncing cart to backend:', error)
      }
    }

    return cart
  }

  // Remove item from cart
  async removeItemFromCart(itemId: string): Promise<Cart> {
    return this.updateCartItem({ itemId, quantity: 0 })
  }

  // Clear entire cart
  async clearCart(): Promise<Cart> {
    const user = await this.getCurrentUser()
    const cartId = user?.id || 'anonymous'

    const cart = this.createNewCart(cartId)
    this.saveCartToStorage(cart)

    // Clear backend cart if user is logged in
    if (user) {
      try {
        await this.clearBackendCart(cartId)
      } catch (error) {
        logger.error('Error clearing backend cart:', error)
      }
    }

    return cart
  }

  // Get current cart
  getCurrentCart(): Cart | null {
    return this.loadCartFromStorage()
  }

  // Create new cart
  private createNewCart(userId: string): Cart {
    const now = new Date().toISOString()
    return {
      id: this.generateCartId(),
      userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + this.CART_TTL).toISOString(),
    }
  }

  // Sync cart to backend
  private async syncCartToBackend(cart: Cart): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    // In a real implementation, this would sync to Supabase
    // For now, we'll just log the sync attempt
    logger.info('Syncing cart to backend', { cartId: cart.id, userId: user.id })

    // TODO: Implement backend cart sync when cart tables are created
    // const { error } = await this.supabase.from('carts').upsert({
    //   id: cart.id,
    //   user_id: user.id,
    //   items: cart.items,
    //   total_items: cart.totalItems,
    //   total_price: cart.totalPrice,
    //   status: cart.status,
    //   created_at: cart.createdAt,
    //   updated_at: cart.updatedAt
    // })
    //
    // if (error) {
    //   throw new Error(`Failed to sync cart: ${error.message}`)
    // }
  }

  // Clear backend cart
  private async clearBackendCart(userId: string): Promise<void> {
    // TODO: Implement backend cart clearing when cart tables are created
    logger.info('Clearing backend cart for user', { userId })
  }

  // Format cart total as currency
  formatCartTotal(total: number): string {
    return `${total.toLocaleString('ka-GE')} ₾`
  }

  // Check if cart has items
  hasItems(cart: Cart | null): boolean {
    return cart ? cart.items.length > 0 : false
  }

  // Get cart item count
  getItemCount(cart: Cart | null): number {
    return cart ? cart.totalItems : 0
  }

  // Get cart total
  getCartTotal(cart: Cart | null): number {
    return cart ? cart.totalPrice : 0
  }

  // Validate cart before checkout
  async validateCartForCheckout(cart: Cart): Promise<CartValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []

    // Check if cart is empty
    if (cart.items.length === 0) {
      errors.push({
        code: 'EMPTY_CART',
        message: 'კალათა ცარიეა',
      })
    }

    // Validate each item
    for (const item of cart.items) {
      if (item.quantity <= 0) {
        errors.push({
          code: 'INVALID_QUANTITY',
          message: 'რაოდენობა უნდა იყოს 0-ზე მეტი',
          itemId: item.id,
        })
      }

      if (item.totalPrice < 0) {
        errors.push({
          code: 'NEGATIVE_TOTAL',
          message: 'ჯამური ფასი არ შეიძლება იყოს უარყოფითი',
          itemId: item.id,
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Get cart statistics (placeholder implementation)
  async getCartStatistics(filters?: CartFilters): Promise<CartStatistics> {
    // TODO: Implement when cart analytics are needed
    return {
      totalCarts: 0,
      activeCarts: 0,
      submittedCarts: 0,
      averageItemsPerCart: 0,
      averageValuePerCart: 0,
      mostAddedProducts: [],
    }
  }
}

export const cartService = new CartService()
