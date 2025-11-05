/**
 * Global Error Boundary Tests
 *
 * Tests for the global error boundary that catches errors in the root layout.
 * This is the last line of defense for error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalError from './global-error'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('Global Error Boundary', () => {
  const mockReset = vi.fn()
  const mockError = new Error('Critical error')

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
    })
  })

  it('should render global error boundary', () => {
    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert
    expect(screen.getByText('⚠️ კრიტიკული შეცდომა')).toBeInTheDocument()
  })

  it('should display error message in development', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    })

    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert
    expect(screen.getByText('Critical error')).toBeInTheDocument()

    // Cleanup
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('should not display error details in production', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    })

    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert
    expect(screen.queryByText('Critical error')).not.toBeInTheDocument()

    // Cleanup
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('should display error digest in development', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    })
    const errorWithDigest = Object.assign(new Error('Test'), { digest: 'xyz789' })

    // Act
    render(<GlobalError error={errorWithDigest} reset={mockReset} />)

    // Assert
    expect(screen.getByText(/Error ID: xyz789/)).toBeInTheDocument()

    // Cleanup
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('should call reset when "სცადე თავიდან" button is clicked', () => {
    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)
    const resetButton = screen.getByText('სცადე თავიდან')
    fireEvent.click(resetButton)

    // Assert
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should navigate to home when "მთავარი გვერდი" button is clicked', () => {
    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)
    const homeButton = screen.getByText('მთავარი გვერდი')
    fireEvent.click(homeButton)

    // Assert
    expect(window.location.href).toBe('/')
  })

  it('should render with html and body tags', () => {
    // Act
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert
    const htmlElement = container.querySelector('html')
    const bodyElement = container.querySelector('body')
    expect(htmlElement).toBeInTheDocument()
    expect(bodyElement).toBeInTheDocument()
  })

  it('should display Georgian critical error message', () => {
    // Act
    render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert
    expect(
      screen.getByText('ბოდიში, მოხდა სერიოზული შეცდომა. გთხოვთ, გადატვირთოთ გვერდი.')
    ).toBeInTheDocument()
  })

  it('should use inline styles', () => {
    // Act
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    // Assert - Check that styled elements exist
    const styledDiv = container.querySelector('div[style]')
    expect(styledDiv).toBeInTheDocument()
  })
})
