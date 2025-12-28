'use client'
import { logger } from '@/lib/logger'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Cart } from '@/types/cart'
import { CartItem, CartItemInput, CartUpdateInput } from '@/types/cart'
import { RealtimeCartService } from '@/services/realtime-cart.service'
import type { CartSession, RealtimeCartUpdate } from '@/types/realtime-cart'

interface RealtimeCartContextValue {
  // Cart state
  cart: Cart | null
  isEmpty: boolean
  itemCount: number
  totalPrice: number

  // Cart state management
  setCart: (cart: Cart | null) => void
  clearCart: () => Promise<void>

  // Cart operations
  addProductToCart: (productId: string, quantity?: number, notes?: string) => Promise<void>
  updateProductQuantity: (productId: string, quantity: number, notes?: string) => Promise<void>
  removeProductFromCart: (productId: string) => Promise<void>

  // UI state
  isLoading: boolean
  error: string | null
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void

  // Real-time state
  isRealtimeEnabled: boolean
  isConnected: boolean
  session: CartSession | null
  enableRealtime: (enabled: boolean) => void

  // Utilities
  formatTotal: (amount: number) => string
}

const RealtimeCartContext = createContext<RealtimeCartContextValue | undefined>(undefined)

export function useRealtimeCartContext() {
  const context = useContext(RealtimeCartContext)
  if (!context) {
    throw new Error('useRealtimeCartContext must be used within a RealtimeCartProvider')
  }
  return context
}

export interface RealtimeCartProviderProps {
  children: React.ReactNode
  userId?: string
  enableRealTime?: boolean
  sessionToken?: string
}

export function RealtimeCartProvider({
  children,
  userId,
  enableRealTime = true,
  sessionToken,
}: RealtimeCartProviderProps) {
  const { toast } = useToast()

  // Core cart state
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Real-time state
  const [realtimeService, setRealtimeService] = useState<RealtimeCartService | null>(null)
  const [session, setSession] = useState<CartSession | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeEnabled, setRealtimeEnabled] = useState(enableRealTime)

  // Initialize real-time service
  useEffect(() => {
    if (!realtimeEnabled) {
      return
    }

    const service = new RealtimeCartService({
      enableRealTime: true,
      userId,
      sessionToken,
    })

    setRealtimeService(service)

    // Initialize session
    service
      .initializeSession()
      .then((sessionData) => {
        setSession(sessionData)
        setIsConnected(true)
      })
      .catch((err) => {
        logger.warn('Failed to initialize real-time cart session:', err)
        setIsConnected(false)
      })

    return () => {
      service.unsubscribe()
    }
  }, [realtimeEnabled, userId, sessionToken])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!realtimeService || !session) return

    const unsubscribe = realtimeService.subscribeToCartUpdates((update: RealtimeCartUpdate) => {
      handleRealtimeUpdate(update)
    })

    return unsubscribe
  }, [realtimeService, session])

  const handleRealtimeUpdate = useCallback(
    (update: RealtimeCartUpdate) => {
      logger.info('Real-time cart update received:', update)

      // Refresh cart data when updates are received
      if (realtimeService) {
        realtimeService
          .getCart()
          .then((updatedCart) => {
            setCart(updatedCart)
            setError(null)
          })
          .catch((err) => {
            logger.error('Failed to refresh cart after real-time update:', err)
          })
      }

      // Show appropriate toast notifications
      switch (update.type) {
        case 'item_added':
          toast({
            title: 'პროდუქტი დაემატა',
            description: 'პროდუქტი წარმატებით დაემატა კალათაში',
          })
          break
        case 'item_updated':
          toast({
            title: 'კალათა განახლდა',
            description: 'კალათის ელემენტი წარმატებით განახლდა',
          })
          break
        case 'item_removed':
          toast({
            title: 'პროდუქტი წაიშლა',
            description: 'პროდუქტი წაიშლა კალათიდან',
          })
          break
        case 'cart_cleared':
          toast({
            title: 'კალათა გასუფთავდა',
            description: 'კალათის ყველა ელემენტი წაიშლა',
          })
          break
      }
    },
    [realtimeService, toast]
  )

  // Load cart from real-time service
  const loadCart = useCallback(async () => {
    if (!realtimeService) return

    try {
      setIsLoading(true)
      setError(null)

      const cartData = await realtimeService.getCart()
      setCart(cartData)
    } catch (err) {
      logger.error('Failed to load cart:', err)
      setError(err instanceof Error ? err.message : 'კალათის ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setIsLoading(false)
    }
  }, [realtimeService])

  // Load cart on initialization
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Cart operations
  const addProductToCart = useCallback(
    async (productId: string, quantity = 1, notes?: string) => {
      try {
        setIsLoading(true)
        setError(null)

        if (realtimeService) {
          await realtimeService.addItem({ productId, quantity, notes })
        } else {
          // Fallback to local storage cart (would need local cart service)
          throw new Error('Real-time service not available')
        }

        // Reload cart to get updated data
        await loadCart()

        toast({
          title: 'პროდუქტი დაემატა',
          description: `${quantity} ერთეული კალათაში დაემატა`,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'პროდუქტის დამატება ვერ მოხერხდა'
        setError(errorMessage)
        toast({
          title: 'შეცდომა',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [realtimeService, loadCart, toast]
  )

  const updateProductQuantity = useCallback(
    async (productId: string, quantity: number, notes?: string) => {
      try {
        setIsLoading(true)
        setError(null)

        if (realtimeService && cart) {
          const item = cart.items.find((item) => item.productId === productId)
          if (!item) {
            throw new Error('პროდუქტი კალათაში არ მოიძებნა')
          }

          await realtimeService.updateItem({ itemId: item.id, quantity, notes })
        } else {
          throw new Error('Real-time service not available')
        }

        // Reload cart to get updated data
        await loadCart()

        toast({
          title: 'რაოდენობა განახლდა',
          description: `რაოდენობა ${quantity}-მდე განახლდა`,
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'რაოდენობის განახლება ვერ მოხერხდა'
        setError(errorMessage)
        toast({
          title: 'შეცდომა',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [realtimeService, cart, loadCart, toast]
  )

  const removeProductFromCart = useCallback(
    async (productId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        if (realtimeService && cart) {
          const item = cart.items.find((item) => item.productId === productId)
          if (!item) {
            throw new Error('პროდუქტი კალათაში არ მოიძებნა')
          }

          await realtimeService.removeItem(item.id)
        } else {
          throw new Error('Real-time service not available')
        }

        // Reload cart to get updated data
        await loadCart()

        toast({
          title: 'პროდუქტი წაიშლა',
          description: 'პროდუქტი წარმატებით წაიშლა კალათიდან',
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'პროდუქტის წაშლა ვერ მოხერხდა'
        setError(errorMessage)
        toast({
          title: 'შეცდომა',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [realtimeService, cart, loadCart, toast]
  )

  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (realtimeService) {
        await realtimeService.clearCart()
      } else {
        throw new Error('Real-time service not available')
      }

      // Reload cart to get updated data
      await loadCart()

      toast({
        title: 'კალათა გასუფთავდა',
        description: 'კალათის ყველა ელემენტი წაიშლა',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'კალათის გასუფთავება ვერ მოხერხდა'
      setError(errorMessage)
      toast({
        title: 'შეცდომა',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [realtimeService, loadCart, toast])

  const enableRealtime = useCallback((enabled: boolean) => {
    setRealtimeEnabled(enabled)
  }, [])

  // Utility functions
  const formatTotal = useCallback((amount: number): string => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  // Derived values
  const isEmpty = !cart || cart.items.length === 0
  const itemCount = cart?.totalItems || 0
  const totalPrice = cart?.totalPrice || 0

  const contextValue: RealtimeCartContextValue = {
    // Cart state
    cart,
    isEmpty,
    itemCount,
    totalPrice,

    // Cart state management
    setCart,
    clearCart,

    // Cart operations
    addProductToCart,
    updateProductQuantity,
    removeProductFromCart,

    // UI state
    isLoading,
    error,
    isCartOpen,
    setIsCartOpen,

    // Real-time state
    isRealtimeEnabled: realtimeEnabled,
    isConnected,
    session,
    enableRealtime,

    // Utilities
    formatTotal,
  }

  return (
    <RealtimeCartContext.Provider value={contextValue}>{children}</RealtimeCartContext.Provider>
  )
}
