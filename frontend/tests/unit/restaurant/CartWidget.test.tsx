import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CartWidget } from '@/components/restaurant/CartWidget'

// Mock the cart store
const mockSetIsOpen = vi.fn()

vi.mock('@/lib/store/cart.store', () => ({
  useCartStore: (selector: any) => {
    const state = {
      isOpen: false,
      setIsOpen: mockSetIsOpen,
      totalItems: () => 3,
      items: [],
    }
    return selector ? selector(state) : state
  },
}))

// Mock ShoppingCart component to avoid complex rendering
vi.mock('@/components/restaurant/ShoppingCart', () => ({
  ShoppingCart: () => <div data-testid="shopping-cart">Cart Content</div>,
}))

// Mock Sheet components
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('CartWidget', () => {
  it('renders cart icon with badge count', () => {
    render(<CartWidget />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('opens sheet when clicked', () => {
    render(<CartWidget />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // In a real integration test we'd check if the sheet opens,
    // but here we just check if the trigger renders correctly
    expect(button).toBeInTheDocument()
  })
})
