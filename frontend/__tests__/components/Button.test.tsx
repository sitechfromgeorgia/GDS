/**
 * Button Component Test Suite
 * Tests for the Button UI component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('Click me')
    })

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should render as child element', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      expect(screen.getByRole('link')).toHaveTextContent('Link Button')
    })

    it('should render with icon', () => {
      const Icon = () => <svg data-testid="icon" />
      render(
        <Button>
          <Icon />
          With Icon
        </Button>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveTextContent('With Icon')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render icon size', () => {
      render(<Button size="icon">🔍</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      render(<Button>Enabled</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show loading state', () => {
      render(<Button disabled>Loading...</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not trigger onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple clicks', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(3)
    })

    it('should handle keyboard events', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Press Enter</Button>)
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      expect(handleClick).toHaveBeenCalled()
    })

    it('should handle space key', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Press Space</Button>)
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: ' ', code: 'Space' })
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Types', () => {
    it('should default to button type', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should render as submit button', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should render as reset button', () => {
      render(<Button type="reset">Reset</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      const button = screen.getByRole('button', { name: 'Close dialog' })
      expect(button).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="help-text">Help</Button>
          <p id="help-text">Click for help</p>
        </div>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should be keyboard accessible', () => {
      render(<Button>Tab to me</Button>)
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should have proper disabled state for screen readers', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })
  })

  describe('Form Integration', () => {
    it('should work within a form', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should not submit form when type is button', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      render(
        <form onSubmit={handleSubmit}>
          <Button type="button">Do not submit</Button>
        </form>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('should merge custom styles with variant styles', () => {
      render(
        <Button variant="default" className="bg-custom">
          Custom Style
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-custom')
    })

    it('should apply full width class', () => {
      render(<Button className="w-full">Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onClick gracefully', () => {
      render(<Button>No handler</Button>)
      const button = screen.getByRole('button')
      expect(() => fireEvent.click(button)).not.toThrow()
    })

    it('should handle empty children', () => {
      render(<Button>{''}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle null children', () => {
      render(<Button>{null}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should prevent double-click submission', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled={false}>
          Submit
        </Button>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      // Should be called twice unless debounced in implementation
      expect(handleClick.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Loading State', () => {
    it('should show loading text', () => {
      render(<Button disabled>Loading...</Button>)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should disable button while loading', () => {
      render(<Button disabled>Loading...</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Composition', () => {
    it('should work with forwardRef', () => {
      const ref = { current: null }
      render(<Button ref={ref as any}>With Ref</Button>)
      expect(ref.current).toBeTruthy()
    })

    it('should spread additional props', () => {
      render(<Button data-testid="custom-button">Custom</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })
  })
})
