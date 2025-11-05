/**
 * Card Component Test Suite
 * Tests for the Card UI component and its sub-components
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'

describe('Card Component', () => {
  describe('Card', () => {
    it('should render basic card', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toHaveClass('custom-card')
    })

    it('should render children', () => {
      render(
        <Card>
          <div>Child 1</div>
          <div>Child 2</div>
        </Card>
      )
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })

    it('should spread additional props', () => {
      render(<Card data-testid="custom-card">Content</Card>)
      expect(screen.getByTestId('custom-card')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header').parentElement
      expect(header).toHaveClass('custom-header')
    })

    it('should render with CardTitle and CardDescription', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>My Title</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('My Title')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-title')
    })

    it('should render as h3 by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })
  })

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>My description</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('My description')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-desc">Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const desc = screen.getByText('Description')
      expect(desc).toHaveClass('custom-desc')
    })

    it('should render as p by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const desc = screen.getByText('Description')
      expect(desc.tagName).toBe('P')
    })
  })

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <Card>
          <CardContent>Main content</CardContent>
        </Card>
      )
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content').parentElement
      expect(content).toHaveClass('custom-content')
    })

    it('should render complex children', () => {
      render(
        <Card>
          <CardContent>
            <div>Text</div>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </CardContent>
        </Card>
      )
      expect(screen.getByText('Text')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer').parentElement
      expect(footer).toHaveClass('custom-footer')
    })

    it('should render action buttons', () => {
      render(
        <Card>
          <CardFooter>
            <button>Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>
      )
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })

  describe('Full Card Composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Product Card</CardTitle>
            <CardDescription>Product details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Price: $99.99</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Product Card')).toBeInTheDocument()
      expect(screen.getByText('Product details')).toBeInTheDocument()
      expect(screen.getByText('Price: $99.99')).toBeInTheDocument()
      expect(screen.getByText('Add to Cart')).toBeInTheDocument()
    })

    it('should render without header', () => {
      render(
        <Card>
          <CardContent>Content only</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Content only')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    it('should render without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render only content', () => {
      render(
        <Card>
          <CardContent>Just content</CardContent>
        </Card>
      )

      expect(screen.getByText('Just content')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have default card styles', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toBeInTheDocument()
    })

    it('should support responsive classes', () => {
      render(<Card className="w-full md:w-1/2">Responsive</Card>)
      const card = screen.getByText('Responsive').parentElement
      expect(card).toHaveClass('w-full', 'md:w-1/2')
    })

    it('should support hover states', () => {
      render(<Card className="hover:shadow-lg">Hoverable</Card>)
      const card = screen.getByText('Hoverable').parentElement
      expect(card).toHaveClass('hover:shadow-lg')
    })
  })

  describe('Use Cases', () => {
    it('should render order card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Order #ORD-001</CardTitle>
            <CardDescription>Status: Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Total: ₾150.50</p>
            <p>Items: 5</p>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument()
      expect(screen.getByText('Status: Pending')).toBeInTheDocument()
      expect(screen.getByText('Total: ₾150.50')).toBeInTheDocument()
    })

    it('should render product card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Fresh Milk</CardTitle>
            <CardDescription>1 Liter</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Price: ₾5.50</p>
            <p>Stock: 100</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Fresh Milk')).toBeInTheDocument()
      expect(screen.getByText('Price: ₾5.50')).toBeInTheDocument()
    })

    it('should render stats card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl">₾12,345.67</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('₾12,345.67')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Card aria-label="Product card">Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toHaveAttribute('aria-label', 'Product card')
    })

    it('should support role attribute', () => {
      render(<Card role="article">Article content</Card>)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      render(<Card />)
      expect(document.querySelector('.card')).toBeTruthy()
    })

    it('should handle null children', () => {
      render(<Card>{null}</Card>)
      expect(document.querySelector('.card')).toBeTruthy()
    })

    it('should handle undefined children', () => {
      render(<Card>{undefined}</Card>)
      expect(document.querySelector('.card')).toBeTruthy()
    })

    it('should handle very long content', () => {
      const longText = 'A'.repeat(1000)
      render(
        <Card>
          <CardContent>{longText}</CardContent>
        </Card>
      )
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle special characters in title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Order #123 & "Special" Characters</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Order #123 & "Special" Characters')).toBeInTheDocument()
    })
  })

  describe('Multiple Cards', () => {
    it('should render multiple cards independently', () => {
      render(
        <div>
          <Card>
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card>
            <CardTitle>Card 2</CardTitle>
          </Card>
          <Card>
            <CardTitle>Card 3</CardTitle>
          </Card>
        </div>
      )

      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
    })

    it('should render grid of cards', () => {
      render(
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent>Card {i}</CardContent>
            </Card>
          ))}
        </div>
      )

      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
    })
  })
})
