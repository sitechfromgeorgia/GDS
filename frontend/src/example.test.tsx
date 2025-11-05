import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test-utils'

// Simple test component
const TestButton = ({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) => (
  <button data-testid="test-button" onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

describe('Vitest Configuration Test', () => {
  it('should render a simple component', () => {
    render(<TestButton>ტესტის ღილაკი</TestButton>)
    expect(screen.getByText('ტესტის ღილაკი')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<TestButton onClick={handleClick}>ღილაკი</TestButton>)

    fireEvent.click(screen.getByTestId('test-button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle disabled state', () => {
    render(<TestButton disabled>გამორთული ღილაკი</TestButton>)

    const button = screen.getByTestId('test-button')
    expect(button).toBeDisabled()
  })

  it('should support Georgian text', () => {
    render(<TestButton>ქართული ტექსტი</TestButton>)

    expect(screen.getByText('ქართული ტექსტი')).toBeInTheDocument()
  })
})

describe('Georgian Distribution System - Test Examples', () => {
  const georgianTexts = {
    welcome: 'კეთილი იყოს თქვენი მობრძანება',
    order: 'შეკვეთა',
    product: 'პროდუქტი',
    restaurant: 'რესტორანი',
    driver: 'მძღოლი',
    admin: 'ადმინისტრატორი',
  }

  it('supports Georgian business terminology', () => {
    render(<TestButton>{georgianTexts.order}</TestButton>)
    expect(screen.getByText(georgianTexts.order)).toBeInTheDocument()
  })

  it('handles Georgian address formatting', () => {
    const address = 'თბილისი, რუსთაველის გამზირი 12, 0108'
    expect(address).toMatch(/თბილისი/)
    expect(address).toMatch(/\d{4}$/)
  })

  it('validates Georgian phone numbers', () => {
    const validPhone = '+995555123456'
    const invalidPhone = '+995123456789'

    expect(validPhone).toMatch(/^\+995[5-9]\d{8}$/)
    expect(invalidPhone).not.toMatch(/^\+995[5-9]\d{8}$/)
  })
})
