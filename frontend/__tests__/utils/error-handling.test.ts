/**
 * Error Handling Utilities Test Suite
 * Tests for centralized error handling and logging
 */

import { describe, it, expect, vi } from 'vitest'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  handleError,
  logError,
  isKnownError,
  getErrorMessage,
  getErrorCode
} from '@/lib/error-handling'

describe('Error Handling Utilities', () => {
  describe('AppError', () => {
    it('should create basic app error', () => {
      const error = new AppError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('AppError')
      expect(error instanceof Error).toBe(true)
    })

    it('should include error code', () => {
      const error = new AppError('Error', 'ERR_001')

      expect(error.code).toBe('ERR_001')
    })

    it('should include additional data', () => {
      const error = new AppError('Error', 'ERR_001', { userId: '123' })

      expect(error.data).toEqual({ userId: '123' })
    })

    it('should be retryable', () => {
      const error = new AppError('Error', 'ERR_001', undefined, true)

      expect(error.isRetryable).toBe(true)
    })

    it('should preserve stack trace', () => {
      const error = new AppError('Error')

      expect(error.stack).toBeTruthy()
    })
  })

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Validation failed')

      expect(error.message).toBe('Validation failed')
      expect(error.name).toBe('ValidationError')
      expect(error instanceof AppError).toBe(true)
    })

    it('should include validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ]

      const error = new ValidationError('Validation failed', validationErrors)

      expect(error.validationErrors).toEqual(validationErrors)
    })

    it('should have validation error code', () => {
      const error = new ValidationError('Validation failed')

      expect(error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Not authenticated')

      expect(error.message).toBe('Not authenticated')
      expect(error.name).toBe('AuthenticationError')
    })

    it('should have authentication error code', () => {
      const error = new AuthenticationError('Not authenticated')

      expect(error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should not be retryable', () => {
      const error = new AuthenticationError('Not authenticated')

      expect(error.isRetryable).toBe(false)
    })
  })

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError('Access denied')

      expect(error.message).toBe('Access denied')
      expect(error.name).toBe('AuthorizationError')
    })

    it('should have authorization error code', () => {
      const error = new AuthorizationError('Access denied')

      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })

    it('should include required permission', () => {
      const error = new AuthorizationError('Access denied', 'admin')

      expect(error.requiredPermission).toBe('admin')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Resource not found')

      expect(error.message).toBe('Resource not found')
      expect(error.name).toBe('NotFoundError')
    })

    it('should have not found error code', () => {
      const error = new NotFoundError('Resource not found')

      expect(error.code).toBe('NOT_FOUND_ERROR')
    })

    it('should include resource type', () => {
      const error = new NotFoundError('Product not found', 'product')

      expect(error.resourceType).toBe('product')
    })

    it('should include resource id', () => {
      const error = new NotFoundError('Product not found', 'product', '123')

      expect(error.resourceId).toBe('123')
    })
  })

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Network request failed')

      expect(error.message).toBe('Network request failed')
      expect(error.name).toBe('NetworkError')
    })

    it('should have network error code', () => {
      const error = new NetworkError('Network request failed')

      expect(error.code).toBe('NETWORK_ERROR')
    })

    it('should be retryable', () => {
      const error = new NetworkError('Network request failed')

      expect(error.isRetryable).toBe(true)
    })

    it('should include status code', () => {
      const error = new NetworkError('Request failed', 500)

      expect(error.statusCode).toBe(500)
    })
  })

  describe('handleError', () => {
    it('should handle AppError', () => {
      const error = new AppError('Error', 'ERR_001')

      const result = handleError(error)

      expect(result.message).toBe('Error')
      expect(result.code).toBe('ERR_001')
      expect(result.isKnownError).toBe(true)
    })

    it('should handle ValidationError', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid' }
      ])

      const result = handleError(error)

      expect(result.validationErrors).toBeDefined()
    })

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Not authenticated')

      const result = handleError(error)

      expect(result.requiresAuth).toBe(true)
    })

    it('should handle AuthorizationError', () => {
      const error = new AuthorizationError('Access denied')

      const result = handleError(error)

      expect(result.requiresPermission).toBeTruthy()
    })

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Not found', 'product', '123')

      const result = handleError(error)

      expect(result.resourceType).toBe('product')
      expect(result.resourceId).toBe('123')
    })

    it('should handle NetworkError', () => {
      const error = new NetworkError('Network failed', 500)

      const result = handleError(error)

      expect(result.isRetryable).toBe(true)
      expect(result.statusCode).toBe(500)
    })

    it('should handle standard Error', () => {
      const error = new Error('Standard error')

      const result = handleError(error)

      expect(result.message).toBe('Standard error')
      expect(result.isKnownError).toBe(false)
    })

    it('should handle string error', () => {
      const error = 'Error string'

      const result = handleError(error)

      expect(result.message).toBe('Error string')
    })

    it('should handle unknown error type', () => {
      const error = { foo: 'bar' }

      const result = handleError(error)

      expect(result.message).toBeTruthy()
    })

    it('should include user-friendly message', () => {
      const error = new AppError('Technical error message')

      const result = handleError(error)

      expect(result.userMessage).toBeTruthy()
    })
  })

  describe('logError', () => {
    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new AppError('Error')
      logError(error)

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should include context in log', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new AppError('Error')
      logError(error, { userId: '123', action: 'create' })

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should log different levels', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const error = new AppError('Warning')
      logError(error, {}, 'warn')

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should handle logging errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        throw new Error('Logging failed')
      })

      expect(() => logError(new AppError('Error'))).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('isKnownError', () => {
    it('should identify AppError', () => {
      const error = new AppError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should identify ValidationError', () => {
      const error = new ValidationError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should identify AuthenticationError', () => {
      const error = new AuthenticationError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should identify AuthorizationError', () => {
      const error = new AuthorizationError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should identify NotFoundError', () => {
      const error = new NotFoundError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should identify NetworkError', () => {
      const error = new NetworkError('Error')

      expect(isKnownError(error)).toBe(true)
    })

    it('should not identify standard Error', () => {
      const error = new Error('Error')

      expect(isKnownError(error)).toBe(false)
    })

    it('should not identify non-error objects', () => {
      expect(isKnownError({ message: 'Error' })).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should get message from Error object', () => {
      const error = new Error('Error message')

      expect(getErrorMessage(error)).toBe('Error message')
    })

    it('should get message from AppError', () => {
      const error = new AppError('App error')

      expect(getErrorMessage(error)).toBe('App error')
    })

    it('should get message from object with message', () => {
      const error = { message: 'Object error' }

      expect(getErrorMessage(error)).toBe('Object error')
    })

    it('should get message from string', () => {
      expect(getErrorMessage('String error')).toBe('String error')
    })

    it('should return default message for unknown', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
    })

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
    })

    it('should handle nested error messages', () => {
      const error = {
        error: {
          message: 'Nested error'
        }
      }

      expect(getErrorMessage(error)).toBeTruthy()
    })
  })

  describe('getErrorCode', () => {
    it('should get code from AppError', () => {
      const error = new AppError('Error', 'ERR_001')

      expect(getErrorCode(error)).toBe('ERR_001')
    })

    it('should get code from ValidationError', () => {
      const error = new ValidationError('Error')

      expect(getErrorCode(error)).toBe('VALIDATION_ERROR')
    })

    it('should return undefined for Error without code', () => {
      const error = new Error('Error')

      expect(getErrorCode(error)).toBeUndefined()
    })

    it('should get code from object with code', () => {
      const error = { code: 'CUSTOM_ERROR' }

      expect(getErrorCode(error)).toBe('CUSTOM_ERROR')
    })

    it('should return undefined for non-error', () => {
      expect(getErrorCode('error')).toBeUndefined()
    })
  })

  describe('Error Recovery', () => {
    it('should suggest retry for NetworkError', () => {
      const error = new NetworkError('Network failed')
      const result = handleError(error)

      expect(result.isRetryable).toBe(true)
      expect(result.suggestedAction).toContain('retry')
    })

    it('should suggest login for AuthenticationError', () => {
      const error = new AuthenticationError('Not authenticated')
      const result = handleError(error)

      expect(result.suggestedAction).toContain('login')
    })

    it('should suggest contact support for unknown errors', () => {
      const error = new Error('Unknown error')
      const result = handleError(error)

      expect(result.suggestedAction).toContain('support')
    })
  })

  describe('Edge Cases', () => {
    it('should handle circular reference in error data', () => {
      const data: any = { name: 'test' }
      data.circular = data

      expect(() => new AppError('Error', 'ERR_001', data)).not.toThrow()
    })

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000)
      const error = new AppError(longMessage)

      expect(error.message).toBe(longMessage)
    })

    it('should handle special characters in error message', () => {
      const message = 'Error: <script>alert("xss")</script>'
      const error = new AppError(message)

      expect(error.message).toBe(message)
    })

    it('should handle unicode in error messages', () => {
      const error = new AppError('შეცდომა 错误 エラー')

      expect(error.message).toBe('შეცდომა 错误 エラー')
    })

    it('should handle null error data', () => {
      const error = new AppError('Error', 'ERR_001', null as any)

      expect(error.data).toBeNull()
    })

    it('should handle undefined error data', () => {
      const error = new AppError('Error', 'ERR_001', undefined)

      expect(error.data).toBeUndefined()
    })
  })
})
