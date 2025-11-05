/**
 * Logger Tests
 *
 * Tests for the centralized logging system.
 * Covers log levels, environment-aware logging, and performance tracking.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Note: We cannot easily test logging output because the logger module
// is evaluated once on import, and the config.enabled flag is set at that time.
// In test environment, logging might be disabled by default.
// These tests focus on ensuring the API works correctly without throwing errors.

describe('logger', () => {
  // Import after vi.mock
  let logger: any
  let createLogger: any

  // Mock console to avoid test output clutter
  const consoleMocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  }

  beforeAll(async () => {
    // Import logger module
    const loggerModule = await import('./logger')
    logger = loggerModule.logger
    createLogger = loggerModule.createLogger
  })

  afterAll(() => {
    // Restore console
    consoleMocks.log.mockRestore()
    consoleMocks.warn.mockRestore()
    consoleMocks.error.mockRestore()
    consoleMocks.debug.mockRestore()
  })

  describe('info', () => {
    it('should not throw when called with message and context', () => {
      // Arrange
      const message = 'Test info message'
      const context = { userId: '123' }

      // Act & Assert
      expect(() => logger.info(message, context)).not.toThrow()
    })

    it('should not throw when called without context', () => {
      // Arrange
      const message = 'Simple message'

      // Act & Assert
      expect(() => logger.info(message)).not.toThrow()
    })
  })

  describe('warn', () => {
    it('should not throw when called with warning', () => {
      // Arrange
      const message = 'Test warning'
      const context = { action: 'test' }

      // Act & Assert
      expect(() => logger.warn(message, context)).not.toThrow()
    })
  })

  describe('error', () => {
    it('should not throw when called with error and context', () => {
      // Arrange
      const message = 'Test error'
      const error = new Error('Something went wrong')
      const context = { endpoint: '/api/test' }

      // Act & Assert
      expect(() => logger.error(message, error, context)).not.toThrow()
    })

    it('should not throw when called without context', () => {
      // Arrange
      const message = 'Error occurred'
      const error = new Error('Test error')

      // Act & Assert
      expect(() => logger.error(message, error)).not.toThrow()
    })
  })

  describe('performance', () => {
    it('should return a function when starting performance tracking', () => {
      // Arrange
      const label = 'test-operation'

      // Act
      const end = logger.performance.start(label)

      // Assert
      expect(typeof end).toBe('function')
    })

    it('should not throw when calling the end function', () => {
      // Arrange
      const end = logger.performance.start('test')

      // Act & Assert
      expect(() => end()).not.toThrow()
    })

    it('should not throw when logging performance metrics', () => {
      // Arrange
      const label = 'api-call'
      const duration = 150

      // Act & Assert
      expect(() => logger.performance.log(label, duration)).not.toThrow()
    })

    it('should track async operations', async () => {
      // Arrange
      const asyncFn = async () => {
        return 'result'
      }

      // Act
      const result = await logger.performance.track('test-async', asyncFn)

      // Assert
      expect(result).toBe('result')
    }, 5000) // 5 second timeout
  })

  describe('connection', () => {
    it('should not throw when logging connection events', () => {
      // Arrange
      const event = 'connecting'
      const details = { url: 'https://api.example.com' }

      // Act & Assert
      expect(() => logger.connection(event, details)).not.toThrow()
    })
  })

  describe('test logging', () => {
    it('should not throw when logging test pass', () => {
      // Act & Assert
      expect(() => logger.test('should pass test', 'PASS')).not.toThrow()
    })

    it('should not throw when logging test failure', () => {
      // Act & Assert
      expect(() => logger.test('should fail test', 'FAIL', { error: 'Test failed' })).not.toThrow()
    })

    it('should not throw when logging test skip', () => {
      // Act & Assert
      expect(() => logger.test('should skip test', 'SKIP')).not.toThrow()
    })
  })

  describe('child loggers', () => {
    it('should create child logger without throwing', () => {
      // Act & Assert
      expect(() => logger.child({ module: 'auth' })).not.toThrow()
    })

    it('should allow child logger to log without throwing', () => {
      // Arrange
      const childLogger = logger.child({ module: 'orders' })

      // Act & Assert
      expect(() => childLogger.info('Test message')).not.toThrow()
      expect(() => childLogger.warn('Warning', { extra: 'data' })).not.toThrow()
      expect(() => childLogger.error('Error', new Error('Test'))).not.toThrow()
    })
  })

  describe('createLogger', () => {
    it('should create module-specific logger', () => {
      // Act
      const moduleLogger = createLogger('auth')

      // Assert
      expect(moduleLogger).toBeDefined()
      expect(typeof moduleLogger.info).toBe('function')
      expect(typeof moduleLogger.warn).toBe('function')
      expect(typeof moduleLogger.error).toBe('function')
    })

    it('should not throw when using module logger', () => {
      // Arrange
      const moduleLogger = createLogger('orders')

      // Act & Assert
      expect(() => moduleLogger.info('Order created')).not.toThrow()
      expect(() => moduleLogger.warn('Order delayed')).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined context gracefully', () => {
      // Act & Assert
      expect(() => logger.info('Test', undefined)).not.toThrow()
    })

    it('should handle complex nested context objects', () => {
      // Arrange
      const complexContext = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            roles: ['admin', 'user'],
          },
        },
        timestamp: Date.now(),
      }

      // Act & Assert
      expect(() => logger.info('Complex log', complexContext)).not.toThrow()
    })

    it('should handle non-Error objects in error logging', () => {
      // Arrange
      const nonError = { message: 'Not an error object' }

      // Act & Assert
      expect(() => logger.error('Test', nonError)).not.toThrow()
    })
  })
})
