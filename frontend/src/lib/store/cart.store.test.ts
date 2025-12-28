import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cart.store'

describe('Cart Store', () => {
  beforeEach(() => {
    // Clear cart before each test
    useCartStore.getState().clearCart()
  })

  it('should start with empty cart', () => {
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().totalItems()).toBe(0)
  })

  it('should add items to cart', () => {
    useCartStore.getState().addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        cost_price: 10,
        is_active: true,
      },
    })

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().totalItems()).toBe(1)
  })

  it('should increment quantity for existing item', () => {
    useCartStore.getState().addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        cost_price: 10,
        is_active: true,
      },
    })

    useCartStore.getState().addItem({
      productId: '1',
      quantity: 2,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        cost_price: 10,
        is_active: true,
      },
    })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0]?.quantity).toBe(3)
  })

  it('should remove item from cart', () => {
    useCartStore.getState().addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        cost_price: 10,
        is_active: true,
      },
    })

    useCartStore.getState().removeItem('1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('should update quantity', () => {
    useCartStore.getState().addItem({
      productId: '1',
      quantity: 1,
      product: {
        id: '1',
        name: 'Test Product',
        category: 'meat',
        unit: 'kg',
        cost_price: 10,
        is_active: true,
      },
    })

    useCartStore.getState().updateQuantity('1', 5)
    const state = useCartStore.getState()
    expect(state.items[0]?.quantity).toBe(5)
  })
})
