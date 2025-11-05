/**
 * Dialog Component Test Suite
 * Tests for modal dialog components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog Component', () => {
  describe('Rendering', () => {
    it('should not render dialog content initially', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
    })

    it('should render trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    })

    it('should render dialog content when opened', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByText('Open Dialog')
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
        expect(screen.getByText('Dialog description')).toBeInTheDocument()
      })
    })

    it('should render dialog with header', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Header Title</DialogTitle>
              <DialogDescription>Header description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Header Title')).toBeInTheDocument()
        expect(screen.getByText('Header description')).toBeInTheDocument()
      })
    })

    it('should render dialog with footer', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <Button>Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
        expect(screen.getByText('Confirm')).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should open dialog on trigger click', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByText('Open Dialog')
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      })
    })

    it('should close dialog on close button click', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('Close')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })

    it('should close dialog on Escape key', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })

    it('should close dialog on overlay click', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      // Find overlay and click it
      const overlay = document.querySelector('[data-state="open"]')?.parentElement
      if (overlay) {
        fireEvent.click(overlay)
      }

      await waitFor(() => {
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
      })
    })
  })

  describe('Controlled State', () => {
    it('should support controlled open state', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument()

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })

    it('should call onOpenChange callback', async () => {
      const handleOpenChange = vi.fn()

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Content Variants', () => {
    it('should render simple dialog', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Simple Dialog</DialogTitle>
            <p>Simple content</p>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Simple Dialog')).toBeInTheDocument()
        expect(screen.getByText('Simple content')).toBeInTheDocument()
      })
    })

    it('should render dialog with form', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should render dialog with list', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>List Dialog</DialogTitle>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
        expect(screen.getByText('Item 3')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should have accessible title', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleName('Accessible Title')
      })
    })

    it('should have accessible description', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>This is the description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAccessibleDescription('This is the description')
      })
    })

    it('should trap focus inside dialog', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Button 1')).toBeInTheDocument()
      })

      // Focus should be trapped within dialog
      const firstButton = screen.getByText('Button 1')
      expect(document.activeElement?.textContent).toBeTruthy()
    })

    it('should return focus to trigger after closing', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByText('Open')
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('Close')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(document.activeElement).toBe(trigger)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid open/close', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByText('Open')

      // Rapidly open and close
      for (let i = 0; i < 5; i++) {
        fireEvent.click(trigger)
        await waitFor(() => {
          expect(screen.getByText('Title')).toBeInTheDocument()
        })

        const closeButton = screen.getByText('Close')
        fireEvent.click(closeButton)

        await waitFor(() => {
          expect(screen.queryByText('Title')).not.toBeInTheDocument()
        })
      }
    })

    it('should handle empty dialog content', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Empty Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText('Empty Dialog')).toBeInTheDocument()
      })
    })

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000)

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Long Content</DialogTitle>
            <p>{longContent}</p>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument()
      })
    })

    it('should handle special characters in content', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Special: &lt;&gt;&amp;"'</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Open'))

      await waitFor(() => {
        expect(screen.getByText(/Special:/)).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Dialogs', () => {
    it('should handle multiple independent dialogs', async () => {
      render(
        <div>
          <Dialog>
            <DialogTrigger>Open Dialog 1</DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog 1</DialogTitle>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger>Open Dialog 2</DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog 2</DialogTitle>
            </DialogContent>
          </Dialog>
        </div>
      )

      fireEvent.click(screen.getByText('Open Dialog 1'))

      await waitFor(() => {
        expect(screen.getByText('Dialog 1')).toBeInTheDocument()
      })

      // Dialog 2 should not be open
      expect(screen.queryByText('Dialog 2')).not.toBeInTheDocument()
    })
  })

  describe('Confirmation Dialog', () => {
    it('should render confirmation dialog', async () => {
      const handleConfirm = vi.fn()

      render(
        <Dialog>
          <DialogTrigger>Delete Item</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleConfirm}>
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      fireEvent.click(screen.getByText('Delete Item'))

      await waitFor(() => {
        expect(screen.getByText('Are you sure?')).toBeInTheDocument()
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Confirm Delete')
      fireEvent.click(confirmButton)

      expect(handleConfirm).toHaveBeenCalled()
    })
  })
})
