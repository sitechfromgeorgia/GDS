import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OrderHistoryTable } from '@/components/restaurant/OrderHistoryTable'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockOrders = [
  {
    id: '12345678-1234-1234-1234-123456789abc',
    created_at: '2023-01-01T12:00:00Z',
    status: 'delivered',
    total_amount: 50,
    items: [{ id: '1', quantity: 2, product: { name: 'ბურგერი' } }],
  },
  {
    id: '87654321-1234-1234-1234-123456789abc',
    created_at: '2023-01-02T12:00:00Z',
    status: 'pending',
    total_amount: 30,
    items: [{ id: '2', quantity: 1, product: { name: 'პიცა' } }],
  },
]

describe('OrderHistoryTable', () => {
  it('renders orders correctly', () => {
    render(<OrderHistoryTable orders={mockOrders} />)
    // Product names should be in the table
    expect(screen.getByText('ბურგერი')).toBeInTheDocument()
    expect(screen.getByText('პიცა')).toBeInTheDocument()
    // Order IDs (first 8 chars with #)
    expect(screen.getByText('#12345678')).toBeInTheDocument()
    expect(screen.getByText('#87654321')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<OrderHistoryTable orders={[]} />)
    expect(screen.getByText('შეკვეთები არ მოიძებნა')).toBeInTheDocument()
  })
})
