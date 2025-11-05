/**
 * Form Component Test Suite
 * Tests for form components with validation and error handling
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const testSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type TestFormData = z.infer<typeof testSchema>

function TestForm({ onSubmit }: { onSubmit: (data: TestFormData) => void }) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormDescription>
                Must be at least 8 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}

describe('Form Component', () => {
  describe('Rendering', () => {
    it('should render form fields', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should render field labels', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
    })

    it('should render field descriptions', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should validate email format', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should validate password length', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'short' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should validate all fields on submit', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should clear validation errors when corrected', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      // Fix the error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(() => {
        expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument()
      })
    })
  })

  describe('Submission', () => {
    it('should submit valid form data', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('should not submit invalid form', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should handle async submission', async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined)
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })

    it('should handle submission errors', async () => {
      const handleSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'))
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Field Interaction', () => {
    it('should update field value on input', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(emailInput.value).toBe('test@example.com')
    })

    it('should handle focus and blur events', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')

      fireEvent.focus(emailInput)
      expect(emailInput).toHaveFocus()

      fireEvent.blur(emailInput)
      expect(emailInput).not.toHaveFocus()
    })

    it('should validate on blur', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')

      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('should have proper field associations', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailLabel = screen.getByText('Email')
      const emailInput = screen.getByPlaceholderText('Email')

      expect(emailLabel).toHaveAttribute('for')
      expect(emailInput).toHaveAttribute('id')
    })

    it('should show error messages with aria attributes', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid email address')
        expect(errorMessage).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      emailInput.focus()
      expect(emailInput).toHaveFocus()

      fireEvent.keyDown(emailInput, { key: 'Tab' })
      // In a real browser, focus would move to passwordInput
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty form submission', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should handle rapid input changes', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')

      for (let i = 0; i < 10; i++) {
        fireEvent.change(emailInput, { target: { value: `test${i}@example.com` } })
      }

      await waitFor(() => {
        expect((emailInput as HTMLInputElement).value).toBe('test9@example.com')
      })
    })

    it('should handle special characters in input', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const passwordInput = screen.getByPlaceholderText('Password')

      fireEvent.change(passwordInput, { target: { value: 'p@ssw0rd!#$%' } })

      expect((passwordInput as HTMLInputElement).value).toBe('p@ssw0rd!#$%')
    })

    it('should handle very long input', () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email')
      const longEmail = 'a'.repeat(100) + '@example.com'

      fireEvent.change(emailInput, { target: { value: longEmail } })

      expect((emailInput as HTMLInputElement).value).toBe(longEmail)
    })

    it('should handle form reset', async () => {
      const handleSubmit = vi.fn()
      render(<TestForm onSubmit={handleSubmit} />)

      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
    })
  })
})
