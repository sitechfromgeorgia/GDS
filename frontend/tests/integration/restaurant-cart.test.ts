import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/store/cart.store'
import { cartService } from '@/lib/services/restaurant/cart.service'

// Mock cart service
vi.mock('@/lib/services/restaurant/cart.service', () => ({
  cartService: {
    saveCartSnapshot: vi.fn(),
    loadCartSnapshot: vi.fn().mockResolvedValue([]),
  },
}))

describe('Cart State Management', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
    vi.clearAllMocks()
  })

  it('adds items to cart and updates total', () => {
    const store = useCartStore.getState()

    store.addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        is_active: true,
        cost_price: 10,
      },
    })

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().totalItems()).toBe(1)
  })

  it('updates quantity of existing item', () => {
    const store = useCartStore.getState()

    store.addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test',
        category: 'meat',
        unit: 'kg',
        is_active: true,
        cost_price: 10,
      },
    })

    store.addItem({
      productId: '1',
      quantity: 2,
      product: {
        id: '1',
        name: 'Test',
        category: 'meat',
        unit: 'kg',
        is_active: true,
        cost_price: 10,
      },
    })

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0]?.quantity).toBe(3)
  })

  it('removes item from cart', () => {
    const store = useCartStore.getState()

    store.addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test',
        category: 'meat',
        unit: 'kg',
        is_active: true,
        cost_price: 10,
      },
    })

    store.removeItem('1')

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
