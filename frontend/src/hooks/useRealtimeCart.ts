'use client'

import { useContext } from 'react'
import { useRealtimeCartContext } from '@/contexts/RealtimeCartContext'

/**
 * Hook for accessing real-time cart functionality
 * Provides access to cart state and operations with real-time synchronization
 */
export function useRealtimeCart() {
  const context = useRealtimeCartContext()
  return {
    // Cart state
    cart: context.cart,
    isEmpty: context.isEmpty,
    itemCount: context.itemCount,
    totalPrice: context.totalPrice,

    // Cart state management
    setCart: context.setCart,
    clearCart: context.clearCart,

    // Cart operations
    addProductToCart: context.addProductToCart,
    updateProductQuantity: context.updateProductQuantity,
    removeProductFromCart: context.removeProductFromCart,

    // UI state
    isLoading: context.isLoading,
    error: context.error,
    isCartOpen: context.isCartOpen,
    setIsCartOpen: context.setIsCartOpen,

    // Real-time state
    isRealtimeEnabled: context.isRealtimeEnabled,
    isConnected: context.isConnected,
    session: context.session,
    enableRealtime: context.enableRealtime,

    // Utilities
    formatTotal: context.formatTotal,
  }
}

/**
 * Hook for real-time cart connection status
 */
export function useRealtimeCartConnection() {
  const { isRealtimeEnabled, isConnected, session } = useRealtimeCart()

  return {
    isEnabled: isRealtimeEnabled,
    isConnected,
    session,
    connectionStatus: isConnected ? 'connected' : isRealtimeEnabled ? 'disconnected' : 'disabled',
  }
}

/**
 * Hook for cart statistics
 */
export function useRealtimeCartStats() {
  const { cart, itemCount, totalPrice, formatTotal } = useRealtimeCart()

  return {
    totalItems: itemCount,
    totalValue: totalPrice,
    formattedTotal: formatTotal(totalPrice),
    itemCount: cart?.items.length || 0,
    hasItems: itemCount > 0,
    averageItemPrice: itemCount > 0 ? totalPrice / itemCount : 0,
  }
}

/**
 * Hook for cart items with real-time updates
 */
export function useRealtimeCartItems() {
  const { cart } = useRealtimeCart()

  return {
    items: cart?.items || [],
    itemsCount: cart?.items.length || 0,
    isEmpty: !cart || cart.items.length === 0,
  }
}

/**
 * Hook for cart operations with loading states
 */
export function useRealtimeCartOperations() {
  const { addProductToCart, updateProductQuantity, removeProductFromCart, clearCart, isLoading } =
    useRealtimeCart()

  return {
    addProduct: addProductToCart,
    updateQuantity: updateProductQuantity,
    removeProduct: removeProductFromCart,
    clear: clearCart,
    isLoading,
    canOperate: !isLoading,
  }
}

/**
 * Hook for cart UI state management
 */
export function useRealtimeCartUI() {
  const { isCartOpen, setIsCartOpen } = useRealtimeCart()

  return {
    isOpen: isCartOpen,
    open: () => setIsCartOpen(true),
    close: () => setIsCartOpen(false),
    toggle: () => setIsCartOpen(!isCartOpen),
  }
}

/**
 * Hook for cart session management
 */
export function useRealtimeCartSession() {
  const { session, isConnected, enableRealtime } = useRealtimeCart()

  return {
    sessionId: session?.id,
    sessionToken: session?.sessionToken,
    isActive: session?.isActive ?? false,
    expiresAt: session?.expiresAt,
    lastActivity: session?.lastActivity,
    isConnected,
    enableRealtime,
  }
}

/**
 * Custom hook for cart synchronization status
 */
export function useRealtimeCartSync() {
  const { session, isConnected, isRealtimeEnabled } = useRealtimeCart()

  return {
    isSyncEnabled: isRealtimeEnabled,
    isConnected,
    syncStatus: isConnected ? 'synced' : isRealtimeEnabled ? 'disconnected' : 'disabled',
    lastSync: session?.lastActivity,
    sessionId: session?.id,
    timeSinceLastSync: session?.lastActivity
      ? Date.now() - new Date(session.lastActivity).getTime()
      : null,
  }
}
