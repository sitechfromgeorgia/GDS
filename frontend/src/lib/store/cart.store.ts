import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    category: string
    unit: string
    image_url?: string | null
    cost_price: number
    is_active: boolean
  }
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setIsOpen: (isOpen: boolean) => void
  totalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === newItem.productId)

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === newItem.productId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
              isOpen: true, // Open cart when adding item
            }
          }

          return {
            items: [...state.items, newItem],
            isOpen: true,
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      setIsOpen: (isOpen) => {
        set({ isOpen })
      },

      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'restaurant-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
)
