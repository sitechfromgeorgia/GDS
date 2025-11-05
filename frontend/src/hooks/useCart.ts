import { useState, useEffect, useCallback } from 'react'
import { cartService } from '@/services/cart/cart.service'
import { Cart, CartItem, CartItemInput, CartUpdateInput } from '@/types/cart'

interface UseCartReturn {
  // Cart state
  cart: Cart | null
  itemCount: number
  totalPrice: number
  isEmpty: boolean

  // Loading states
  isLoading: boolean
  isAdding: boolean
  isUpdating: boolean
  isRemoving: boolean
  isClearing: boolean

  // Error state
  error: Error | null

  // Actions
  addItem: (input: CartItemInput) => Promise<void>
  updateItem: (input: CartUpdateInput) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>

  // Helpers
  hasItem: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  getItemByProductId: (productId: string) => CartItem | undefined
  formatTotal: (total?: number) => string
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const currentCart = cartService.getCurrentCart()
      setCart(currentCart)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load cart'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addItem = useCallback(async (input: CartItemInput) => {
    try {
      setIsAdding(true)
      setError(null)
      const updatedCart = await cartService.addItemToCart(input)
      setCart(updatedCart)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add item'))
      throw err
    } finally {
      setIsAdding(false)
    }
  }, [])

  const updateItem = useCallback(async (input: CartUpdateInput) => {
    try {
      setIsUpdating(true)
      setError(null)
      const updatedCart = await cartService.updateCartItem(input)
      setCart(updatedCart)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update item'))
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setIsRemoving(true)
      setError(null)
      const updatedCart = await cartService.removeItemFromCart(itemId)
      setCart(updatedCart)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove item'))
      throw err
    } finally {
      setIsRemoving(false)
    }
  }, [])

  const clearCart = useCallback(async () => {
    try {
      setIsClearing(true)
      setError(null)
      const updatedCart = await cartService.clearCart()
      setCart(updatedCart)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear cart'))
      throw err
    } finally {
      setIsClearing(false)
    }
  }, [])

  // Helper functions
  const hasItem = useCallback(
    (productId: string): boolean => {
      return cart ? cart.items.some((item) => item.productId === productId) : false
    },
    [cart]
  )

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const item = cart?.items.find((item) => item.productId === productId)
      return item ? item.quantity : 0
    },
    [cart]
  )

  const getItemByProductId = useCallback(
    (productId: string): CartItem | undefined => {
      return cart?.items.find((item) => item.productId === productId)
    },
    [cart]
  )

  const formatTotal = useCallback(
    (total?: number): string => {
      return cartService.formatCartTotal(total ?? (cart?.totalPrice || 0))
    },
    [cart]
  )

  const itemCount = cart ? cart.totalItems : 0
  const totalPrice = cart ? cart.totalPrice : 0
  const isEmpty = !cart || cart.items.length === 0

  return {
    // Cart state
    cart,
    itemCount,
    totalPrice,
    isEmpty,

    // Loading states
    isLoading,
    isAdding,
    isUpdating,
    isRemoving,
    isClearing,

    // Error state
    error,

    // Actions
    addItem,
    updateItem,
    removeItem,
    clearCart,

    // Helpers
    hasItem,
    getItemQuantity,
    getItemByProductId,
    formatTotal,
  }
}
