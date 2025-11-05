/**
 * API Helpers Test Suite
 * Tests for API utility functions and error handling
 */

import { describe, it, expect, vi } from 'vitest'
import {
  handleApiError,
  buildQueryString,
  formatApiResponse,
  retry,
  withTimeout,
  parseApiError
} from '@/lib/api-helpers'

describe('API Helpers', () => {
  describe('handleApiError', () => {
    it('should handle Supabase error format', () => {
      const error = {
        message: 'Database error',
        code: 'PGRST116',
        details: 'Row not found'
      }

      const result = handleApiError(error)

      expect(result.message).toBeTruthy()
      expect(result.userMessage).toBeTruthy()
    })

    it('should handle network errors', () => {
      const error = new Error('Network request failed')

      const result = handleApiError(error)

      expect(result.message).toContain('Network')
      expect(result.userMessage).toBeTruthy()
    })

    it('should handle authentication errors', () => {
      const error = {
        message: 'JWT expired',
        status: 401
      }

      const result = handleApiError(error)

      expect(result.userMessage).toContain('authentication')
    })

    it('should handle authorization errors', () => {
      const error = {
        message: 'Insufficient permissions',
        status: 403
      }

      const result = handleApiError(error)

      expect(result.userMessage).toContain('permission')
    })

    it('should handle not found errors', () => {
      const error = {
        message: 'Resource not found',
        status: 404
      }

      const result = handleApiError(error)

      expect(result.userMessage).toContain('not found')
    })

    it('should handle validation errors', () => {
      const error = {
        message: 'Validation failed',
        status: 422,
        errors: [
          { field: 'email', message: 'Invalid email format' }
        ]
      }

      const result = handleApiError(error)

      expect(result.userMessage).toContain('validation')
      expect(result.validationErrors).toBeDefined()
    })

    it('should handle unknown errors', () => {
      const error = 'Something went wrong'

      const result = handleApiError(error)

      expect(result.message).toBeTruthy()
      expect(result.userMessage).toBeTruthy()
    })

    it('should include error code when available', () => {
      const error = {
        message: 'Error',
        code: 'ERR_123'
      }

      const result = handleApiError(error)

      expect(result.code).toBe('ERR_123')
    })
  })

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const params = {
        search: 'milk',
        category: 'dairy',
        limit: 10
      }

      const result = buildQueryString(params)

      expect(result).toBe('?search=milk&category=dairy&limit=10')
    })

    it('should handle empty object', () => {
      const params = {}

      const result = buildQueryString(params)

      expect(result).toBe('')
    })

    it('should skip null and undefined values', () => {
      const params = {
        search: 'milk',
        category: null,
        limit: undefined,
        page: 1
      }

      const result = buildQueryString(params)

      expect(result).toBe('?search=milk&page=1')
    })

    it('should handle array values', () => {
      const params = {
        categories: ['dairy', 'beverages'],
        tags: ['organic']
      }

      const result = buildQueryString(params)

      expect(result).toContain('categories=dairy')
      expect(result).toContain('categories=beverages')
      expect(result).toContain('tags=organic')
    })

    it('should encode special characters', () => {
      const params = {
        search: 'milk & honey',
        note: 'hello world!'
      }

      const result = buildQueryString(params)

      expect(result).toContain('milk%20%26%20honey')
      expect(result).toContain('hello%20world!')
    })

    it('should handle boolean values', () => {
      const params = {
        isAvailable: true,
        inStock: false
      }

      const result = buildQueryString(params)

      expect(result).toBe('?isAvailable=true&inStock=false')
    })

    it('should handle number values', () => {
      const params = {
        price: 10.50,
        quantity: 5
      }

      const result = buildQueryString(params)

      expect(result).toBe('?price=10.5&quantity=5')
    })

    it('should handle empty strings', () => {
      const params = {
        search: '',
        category: 'dairy'
      }

      const result = buildQueryString(params)

      expect(result).toBe('?category=dairy')
    })
  })

  describe('formatApiResponse', () => {
    it('should format successful response', () => {
      const data = { id: '1', name: 'Product' }

      const result = formatApiResponse(data, null)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
      expect(result.success).toBe(true)
    })

    it('should format error response', () => {
      const error = { message: 'Error occurred' }

      const result = formatApiResponse(null, error)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(result.success).toBe(false)
    })

    it('should include metadata', () => {
      const data = { id: '1' }
      const metadata = { timestamp: Date.now(), requestId: 'req-123' }

      const result = formatApiResponse(data, null, metadata)

      expect(result.metadata).toEqual(metadata)
    })

    it('should handle both data and error', () => {
      const data = { id: '1' }
      const error = { message: 'Warning' }

      const result = formatApiResponse(data, error)

      expect(result.data).toEqual(data)
      expect(result.error).toBeTruthy()
      expect(result.success).toBe(true)
    })
  })

  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await retry(fn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const result = await retry(fn, { maxRetries: 3, delay: 10 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fail'))

      await expect(retry(fn, { maxRetries: 3, delay: 10 })).rejects.toThrow('Always fail')
      expect(fn).toHaveBeenCalledTimes(4) // initial + 3 retries
    })

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const startTime = Date.now()
      await retry(fn, { maxRetries: 3, delay: 100, exponentialBackoff: true })
      const duration = Date.now() - startTime

      // Should take at least 100ms + 200ms = 300ms
      expect(duration).toBeGreaterThanOrEqual(300)
    })

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()

      await retry(fn, { maxRetries: 2, delay: 10, onRetry })

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1)
    })

    it('should retry only retryable errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ message: 'Network error', retryable: true })
        .mockRejectedValueOnce({ message: 'Auth error', retryable: false })

      const shouldRetry = (error: any) => error.retryable === true

      await expect(retry(fn, { maxRetries: 3, delay: 10, shouldRetry })).rejects.toThrow('Auth error')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('withTimeout', () => {
    it('should resolve before timeout', async () => {
      const fn = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 100)
      })

      const result = await withTimeout(fn(), 200)

      expect(result).toBe('success')
    })

    it('should timeout if takes too long', async () => {
      const fn = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 200)
      })

      await expect(withTimeout(fn(), 100)).rejects.toThrow('timeout')
    })

    it('should use custom timeout message', async () => {
      const fn = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 200)
      })

      await expect(
        withTimeout(fn(), 100, 'Custom timeout message')
      ).rejects.toThrow('Custom timeout message')
    })

    it('should handle rejected promises', async () => {
      const fn = () => Promise.reject(new Error('Failed'))

      await expect(withTimeout(fn(), 100)).rejects.toThrow('Failed')
    })
  })

  describe('parseApiError', () => {
    it('should parse standard error object', () => {
      const error = new Error('Something went wrong')

      const result = parseApiError(error)

      expect(result.message).toBe('Something went wrong')
    })

    it('should parse error with response data', () => {
      const error = {
        response: {
          data: {
            message: 'API error',
            code: 'ERR_001'
          }
        }
      }

      const result = parseApiError(error)

      expect(result.message).toBe('API error')
      expect(result.code).toBe('ERR_001')
    })

    it('should parse Supabase error', () => {
      const error = {
        message: 'Database error',
        code: 'PGRST116',
        details: 'Details here',
        hint: 'Hint here'
      }

      const result = parseApiError(error)

      expect(result.message).toBe('Database error')
      expect(result.code).toBe('PGRST116')
      expect(result.details).toBe('Details here')
      expect(result.hint).toBe('Hint here')
    })

    it('should parse string error', () => {
      const error = 'Simple error message'

      const result = parseApiError(error)

      expect(result.message).toBe('Simple error message')
    })

    it('should handle unknown error type', () => {
      const error = { foo: 'bar' }

      const result = parseApiError(error)

      expect(result.message).toBeTruthy()
    })

    it('should extract status code', () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: 'Not found'
          }
        }
      }

      const result = parseApiError(error)

      expect(result.status).toBe(404)
    })

    it('should handle nested error messages', () => {
      const error = {
        error: {
          message: 'Nested error'
        }
      }

      const result = parseApiError(error)

      expect(result.message).toBe('Nested error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null input in buildQueryString', () => {
      const result = buildQueryString(null as any)

      expect(result).toBe('')
    })

    it('should handle undefined input in buildQueryString', () => {
      const result = buildQueryString(undefined as any)

      expect(result).toBe('')
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }
      obj.circular = obj

      expect(() => buildQueryString(obj)).not.toThrow()
    })

    it('should handle very long query strings', () => {
      const params = {}
      for (let i = 0; i < 100; i++) {
        params[`param${i}`] = `value${i}`
      }

      const result = buildQueryString(params)

      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle retry with zero retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'))

      await expect(retry(fn, { maxRetries: 0, delay: 10 })).rejects.toThrow('Fail')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should handle timeout of zero', async () => {
      const fn = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 10)
      })

      await expect(withTimeout(fn(), 0)).rejects.toThrow('timeout')
    })
  })
})
