import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/cart.store'
import { cartService } from '@/lib/services/restaurant/cart.service'
import { createBrowserClient } from '@/lib/supabase/client'

export function useCartSync() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore()
  const supabase = createBrowserClient()

  // Load initial cart from server
  useEffect(() => {
    const loadCart = async () => {
      const serverItems = await cartService.loadCartSnapshot()
      if (serverItems && serverItems.length > 0) {
        // We could implement a merge strategy here, but for now server wins
        // or we could just use server items if local is empty
        if (items.length === 0) {
          serverItems.forEach((item) => addItem(item))
        }
      }
    }
    loadCart()
  }, [])

  // Sync changes to server
  // Sync changes to server
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (items.length > 0) {
      timer = setTimeout(() => {
        cartService.saveCartSnapshot(items)
      }, 1000) // Debounce saves
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [items])

  // Listen for real-time updates from other devices
  useEffect(() => {
    const channel = supabase
      .channel('cart-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_snapshots',
        },
        async (payload: any) => {
          // Reload cart on any change from other sessions
          // We should ideally check if the change originated from this session
          // but for MVP this ensures consistency
          const serverItems = await cartService.loadCartSnapshot()
          if (serverItems) {
            // Update store without triggering another save
            // This requires careful state management to avoid loops
            // For now, we'll just log it
            console.log('Cart updated from another device', payload)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])
}
