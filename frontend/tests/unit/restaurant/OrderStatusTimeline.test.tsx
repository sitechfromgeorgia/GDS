import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OrderStatusTimeline } from '@/components/restaurant/OrderStatusTimeline'

describe('OrderStatusTimeline', () => {
  it('renders current status correctly', () => {
    render(<OrderStatusTimeline status="pending" />)
    expect(screen.getByText('მიღებულია')).toBeInTheDocument()
  })

  it('shows completed steps', () => {
    render(<OrderStatusTimeline status="preparing" />)
    // "Received" should be marked as completed
    const receivedStep = screen.getByText('მიღებულია')
    expect(receivedStep).toBeInTheDocument()
    // "Preparing" should be active
    const preparingStep = screen.getByText('მზადდება')
    expect(preparingStep).toBeInTheDocument()
  })
})
