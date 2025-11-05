'use client'
import { logger } from '@/lib/logger'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Cart, CartItem, CartItemInput, CartUpdateInput } from '@/types/cart'
import { useCart } from '@/hooks/useCart'
import { useToast, toast } from '@/hooks/use-toast'

interface CartContextType {
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

  // Cart UI state
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void

  // Actions
  addItem: (input: CartItemInput) => Promise<void>
  updateItem: (input: CartUpdateInput) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>

  // Quick actions for product cards
  addProductToCart: (productId: string, quantity?: number, notes?: string) => Promise<void>
  updateProductQuantity: (productId: string, quantity: number) => Promise<void>
  removeProductFromCart: (productId: string) => Promise<void>

  // Helpers
  hasItem: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  getItemByProductId: (productId: string) => CartItem | undefined
  formatTotal: (total?: number) => string

  // Cart persistence
  syncWithServer: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCartContext() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: React.ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { toast } = useToast()

  const cartHook = useCart()

  // Auto-close cart on successful actions
  useEffect(() => {
    if (
      !cartHook.isAdding &&
      !cartHook.isUpdating &&
      !cartHook.isRemoving &&
      !cartHook.isClearing
    ) {
      return
    }
  }, [cartHook.isAdding, cartHook.isUpdating, cartHook.isRemoving, cartHook.isClearing])

  // Show success/error toasts
  useEffect(() => {
    if (cartHook.error) {
      toast({
        title: 'შეცდომა',
        description: cartHook.error.message,
        variant: 'destructive',
      })
    }
  }, [cartHook.error, toast])

  // Quick add product to cart
  const addProductToCart = async (productId: string, quantity = 1, notes?: string) => {
    try {
      await cartHook.addItem({ productId, quantity, notes })
      toast({
        title: 'წარმატება',
        description: 'პროდუქტი კალათაში დაემატა',
      })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Update product quantity
  const updateProductQuantity = async (productId: string, quantity: number) => {
    try {
      const item = cartHook.getItemByProductId(productId)
      if (!item) {
        toast({
          title: 'შეცდომა',
          description: 'პროდუქტი კალათაში არ მოიძებნა',
          variant: 'destructive',
        })
        return
      }

      await cartHook.updateItem({
        itemId: item.id,
        quantity,
        notes: item.notes,
      })

      if (quantity === 0) {
        toast({
          title: 'წარმატება',
          description: 'პროდუქტი კალათიდან წაიშალა',
        })
      } else {
        toast({
          title: 'წარმატება',
          description: 'რაოდენობა განახლდა',
        })
      }
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Remove product from cart
  const removeProductFromCart = async (productId: string) => {
    try {
      const item = cartHook.getItemByProductId(productId)
      if (!item) {
        toast({
          title: 'შეცდომა',
          description: 'პროდუქტი კალათაში არ მოიძებნა',
          variant: 'destructive',
        })
        return
      }

      await cartHook.removeItem(item.id)
      toast({
        title: 'წარმატება',
        description: 'პროდუქტი კალათიდან წაიშალა',
      })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Sync cart with server (placeholder)
  const syncWithServer = async () => {
    // TODO: Implement server sync when backend cart tables are created
    logger.info('Syncing cart with server...')
  }

  const value: CartContextType = {
    // Cart state
    cart: cartHook.cart,
    itemCount: cartHook.itemCount,
    totalPrice: cartHook.totalPrice,
    isEmpty: cartHook.isEmpty,

    // Loading states
    isLoading: cartHook.isLoading,
    isAdding: cartHook.isAdding,
    isUpdating: cartHook.isUpdating,
    isRemoving: cartHook.isRemoving,
    isClearing: cartHook.isClearing,

    // Error state
    error: cartHook.error,

    // Cart UI state
    isCartOpen,
    setIsCartOpen,

    // Actions
    addItem: cartHook.addItem,
    updateItem: cartHook.updateItem,
    removeItem: cartHook.removeItem,
    clearCart: cartHook.clearCart,

    // Quick actions for product cards
    addProductToCart,
    updateProductQuantity,
    removeProductFromCart,

    // Helpers
    hasItem: cartHook.hasItem,
    getItemQuantity: cartHook.getItemQuantity,
    getItemByProductId: cartHook.getItemByProductId,
    formatTotal: cartHook.formatTotal,

    // Cart persistence
    syncWithServer,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Helper hook for adding products to cart (shortcut)
export function useAddToCart() {
  const { addProductToCart, isAdding } = useCartContext()
  return { addProductToCart, isAdding }
}

// Helper hook for cart item operations (shortcut)
export function useCartItem(productId: string) {
  const cartContext = useCartContext()
  const item = cartContext.getItemByProductId(productId)

  return {
    item,
    quantity: item?.quantity || 0,
    isInCart: cartContext.hasItem(productId),
    addToCart: () => cartContext.addProductToCart(productId),
    updateQuantity: (quantity: number) => cartContext.updateProductQuantity(productId, quantity),
    removeFromCart: () => cartContext.removeProductFromCart(productId),
    isLoading: cartContext.isAdding || cartContext.isUpdating || cartContext.isRemoving,
  }
}
