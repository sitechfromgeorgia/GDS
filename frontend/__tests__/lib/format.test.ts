/**
 * Format Utilities Test Suite
 * Tests for date, currency, and text formatting functions
 */

import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatCurrency,
  formatPhone,
  formatOrderNumber,
  formatDistance,
  formatDuration,
  truncateText,
  capitalizeFirst,
  slugify
} from '@/lib/format'

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2025-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should format date with custom format', () => {
      const date = new Date('2025-01-15')
      const formatted = formatDate(date, 'yyyy-MM-dd')
      expect(formatted).toBe('2025-01-15')
    })

    it('should handle ISO string dates', () => {
      const isoString = '2025-01-15T10:30:00.000Z'
      const formatted = formatDate(isoString)
      expect(formatted).toBeTruthy()
    })

    it('should handle timestamp dates', () => {
      const timestamp = Date.now()
      const formatted = formatDate(timestamp)
      expect(formatted).toBeTruthy()
    })

    it('should return empty string for invalid date', () => {
      const formatted = formatDate('invalid-date')
      expect(formatted).toBe('')
    })

    it('should return empty string for null', () => {
      const formatted = formatDate(null as any)
      expect(formatted).toBe('')
    })

    it('should return empty string for undefined', () => {
      const formatted = formatDate(undefined as any)
      expect(formatted).toBe('')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with GEL symbol', () => {
      const formatted = formatCurrency(150.50)
      expect(formatted).toContain('150')
      expect(formatted).toContain('50')
      expect(formatted).toContain('₾')
    })

    it('should format whole numbers', () => {
      const formatted = formatCurrency(100)
      expect(formatted).toContain('100')
      expect(formatted).toContain('₾')
    })

    it('should format decimal numbers', () => {
      const formatted = formatCurrency(99.99)
      expect(formatted).toContain('99')
      expect(formatted).toContain('99')
      expect(formatted).toContain('₾')
    })

    it('should format zero', () => {
      const formatted = formatCurrency(0)
      expect(formatted).toContain('0')
      expect(formatted).toContain('₾')
    })

    it('should format negative numbers', () => {
      const formatted = formatCurrency(-50.25)
      expect(formatted).toBeTruthy()
    })

    it('should format large numbers with thousands separator', () => {
      const formatted = formatCurrency(1000000)
      expect(formatted).toBeTruthy()
    })

    it('should round to 2 decimal places', () => {
      const formatted = formatCurrency(99.999)
      expect(formatted).not.toContain('999')
    })
  })

  describe('formatPhone', () => {
    it('should format Georgian mobile number', () => {
      const formatted = formatPhone('+995555123456')
      expect(formatted).toBeTruthy()
    })

    it('should format number without country code', () => {
      const formatted = formatPhone('555123456')
      expect(formatted).toBeTruthy()
    })

    it('should handle numbers with spaces', () => {
      const formatted = formatPhone('+995 555 123 456')
      expect(formatted).toBeTruthy()
    })

    it('should handle numbers with dashes', () => {
      const formatted = formatPhone('+995-555-123-456')
      expect(formatted).toBeTruthy()
    })

    it('should return original for invalid format', () => {
      const phone = 'invalid'
      const formatted = formatPhone(phone)
      expect(formatted).toBe(phone)
    })

    it('should return empty string for empty input', () => {
      const formatted = formatPhone('')
      expect(formatted).toBe('')
    })

    it('should handle null', () => {
      const formatted = formatPhone(null as any)
      expect(formatted).toBe('')
    })
  })

  describe('formatOrderNumber', () => {
    it('should format order number with prefix', () => {
      const date = new Date('2025-01-15')
      const sequence = 1
      const formatted = formatOrderNumber(date, sequence)
      expect(formatted).toContain('ORD')
      expect(formatted).toContain('20250115')
      expect(formatted).toContain('001')
    })

    it('should pad sequence number with zeros', () => {
      const date = new Date('2025-01-15')
      const sequence = 5
      const formatted = formatOrderNumber(date, sequence)
      expect(formatted).toContain('005')
    })

    it('should handle large sequence numbers', () => {
      const date = new Date('2025-01-15')
      const sequence = 999
      const formatted = formatOrderNumber(date, sequence)
      expect(formatted).toContain('999')
    })

    it('should handle sequence numbers over 999', () => {
      const date = new Date('2025-01-15')
      const sequence = 1234
      const formatted = formatOrderNumber(date, sequence)
      expect(formatted).toContain('1234')
    })
  })

  describe('formatDistance', () => {
    it('should format distance in meters', () => {
      const formatted = formatDistance(500)
      expect(formatted).toBe('500 m')
    })

    it('should format distance in kilometers', () => {
      const formatted = formatDistance(1500)
      expect(formatted).toBe('1.5 km')
    })

    it('should format whole kilometers', () => {
      const formatted = formatDistance(5000)
      expect(formatted).toBe('5 km')
    })

    it('should handle zero distance', () => {
      const formatted = formatDistance(0)
      expect(formatted).toBe('0 m')
    })

    it('should round to 1 decimal place', () => {
      const formatted = formatDistance(1234)
      expect(formatted).toBe('1.2 km')
    })

    it('should format large distances', () => {
      const formatted = formatDistance(100000)
      expect(formatted).toBe('100 km')
    })
  })

  describe('formatDuration', () => {
    it('should format duration in minutes', () => {
      const formatted = formatDuration(150) // 2.5 minutes
      expect(formatted).toContain('min')
    })

    it('should format duration in hours', () => {
      const formatted = formatDuration(3600) // 1 hour
      expect(formatted).toContain('hour')
    })

    it('should format duration in hours and minutes', () => {
      const formatted = formatDuration(3750) // 1 hour 2.5 minutes
      expect(formatted).toBeTruthy()
    })

    it('should handle zero duration', () => {
      const formatted = formatDuration(0)
      expect(formatted).toBe('0 min')
    })

    it('should handle seconds less than a minute', () => {
      const formatted = formatDuration(30)
      expect(formatted).toBe('< 1 min')
    })

    it('should pluralize correctly', () => {
      const singular = formatDuration(60) // 1 minute
      const plural = formatDuration(120) // 2 minutes
      expect(singular).not.toContain('minutes')
      expect(plural).toContain('min')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated'
      const truncated = truncateText(longText, 20)
      expect(truncated.length).toBeLessThanOrEqual(23) // 20 + '...'
      expect(truncated).toContain('...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      const result = truncateText(shortText, 20)
      expect(result).toBe(shortText)
      expect(result).not.toContain('...')
    })

    it('should handle empty string', () => {
      const result = truncateText('', 10)
      expect(result).toBe('')
    })

    it('should handle text exactly at max length', () => {
      const text = '12345'
      const result = truncateText(text, 5)
      expect(result).toBe(text)
    })

    it('should use custom suffix', () => {
      const text = 'This is a long text'
      const result = truncateText(text, 10, '…')
      expect(result).toContain('…')
      expect(result).not.toContain('...')
    })

    it('should handle null', () => {
      const result = truncateText(null as any, 10)
      expect(result).toBe('')
    })

    it('should handle undefined', () => {
      const result = truncateText(undefined as any, 10)
      expect(result).toBe('')
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      const result = capitalizeFirst('hello')
      expect(result).toBe('Hello')
    })

    it('should handle already capitalized text', () => {
      const result = capitalizeFirst('Hello')
      expect(result).toBe('Hello')
    })

    it('should handle single character', () => {
      const result = capitalizeFirst('h')
      expect(result).toBe('H')
    })

    it('should handle empty string', () => {
      const result = capitalizeFirst('')
      expect(result).toBe('')
    })

    it('should not affect rest of string', () => {
      const result = capitalizeFirst('hello WORLD')
      expect(result).toBe('Hello WORLD')
    })

    it('should handle numbers', () => {
      const result = capitalizeFirst('123abc')
      expect(result).toBe('123abc')
    })

    it('should handle special characters', () => {
      const result = capitalizeFirst('!hello')
      expect(result).toBe('!hello')
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      const result = slugify('Hello World')
      expect(result).toBe('hello-world')
    })

    it('should handle special characters', () => {
      const result = slugify('Hello, World!')
      expect(result).toBe('hello-world')
    })

    it('should handle multiple spaces', () => {
      const result = slugify('Hello   World')
      expect(result).toBe('hello-world')
    })

    it('should handle leading/trailing spaces', () => {
      const result = slugify('  Hello World  ')
      expect(result).toBe('hello-world')
    })

    it('should handle underscores', () => {
      const result = slugify('Hello_World')
      expect(result).toBe('hello-world')
    })

    it('should handle numbers', () => {
      const result = slugify('Product 123')
      expect(result).toBe('product-123')
    })

    it('should handle mixed case', () => {
      const result = slugify('HeLLo WoRLd')
      expect(result).toBe('hello-world')
    })

    it('should handle empty string', () => {
      const result = slugify('')
      expect(result).toBe('')
    })

    it('should remove consecutive hyphens', () => {
      const result = slugify('Hello---World')
      expect(result).toBe('hello-world')
    })

    it('should handle accented characters', () => {
      const result = slugify('Café')
      expect(result).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers in formatCurrency', () => {
      const result = formatCurrency(999999999.99)
      expect(result).toBeTruthy()
    })

    it('should handle very small numbers in formatCurrency', () => {
      const result = formatCurrency(0.01)
      expect(result).toBeTruthy()
    })

    it('should handle negative distance', () => {
      const result = formatDistance(-100)
      expect(result).toBeTruthy()
    })

    it('should handle negative duration', () => {
      const result = formatDuration(-60)
      expect(result).toBeTruthy()
    })

    it('should handle Unicode characters in truncateText', () => {
      const text = '你好世界 Hello World'
      const result = truncateText(text, 10)
      expect(result.length).toBeLessThanOrEqual(13)
    })

    it('should handle emoji in truncateText', () => {
      const text = '😀😁😂🤣😃😄😅'
      const result = truncateText(text, 5)
      expect(result).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should handle large batch of format operations', () => {
      const iterations = 1000
      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        formatCurrency(i * 1.5)
        formatDate(new Date())
        formatPhone('+995555123456')
        truncateText('This is a test string', 10)
        slugify('Test Product Name')
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete 1000 iterations in less than 1 second
      expect(duration).toBeLessThan(1000)
    })
  })
})
