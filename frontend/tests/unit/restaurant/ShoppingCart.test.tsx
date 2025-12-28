import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ShoppingCart } from '@/components/restaurant/ShoppingCart'

// Mock the cart store
const mockRemoveItem = vi.fn()
const mockUpdateQuantity = vi.fn()

const mockCartState = {
  items: [
    {
      productId: '1',
      quantity: 2,
      product: {
        id: '1',
        name: 'ქათმის ფილე',
        category: 'meat',
        unit: 'kg',
        cost_price: 12.5,
        image_url: null,
      },
    },
  ],
  removeItem: mockRemoveItem,
  updateQuantity: mockUpdateQuantity,
  totalItems: () => 2,
}

vi.mock('@/lib/store/cart.store', () => ({
  useCartStore: (selector?: (state: typeof mockCartState) => unknown) => {
    if (selector) {
      return selector(mockCartState)
    }
    return mockCartState
  },
}))

describe('ShoppingCart', () => {
  it('renders cart items correctly', () => {
    render(<ShoppingCart />)
    expect(screen.getByText('ქათმის ფილე')).toBeInTheDocument()
    // Check quantity in specific context - quantity display in cart item
    const quantityDisplay = screen.getByText('2', { selector: 'span.w-8' })
    expect(quantityDisplay).toBeInTheDocument()
  })

  it('calls updateQuantity when quantity buttons are clicked', () => {
    render(<ShoppingCart />)
    const plusButton = screen.getByLabelText('Increase quantity')
    fireEvent.click(plusButton)
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3)
  })

  it('calls removeItem when remove button is clicked', () => {
    render(<ShoppingCart />)
    const removeButton = screen.getByLabelText('Remove item')
    fireEvent.click(removeButton)
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
  })
})
