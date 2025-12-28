// Unit tests for Analytics Dashboard
// Based on specs/001-analytics-dashboard/plan.md

import { describe, it, expect } from 'vitest'
import { validateDateRange, isLargeDateRange, parseStatusParam } from '@/lib/validators/analytics'

describe('Analytics Validators', () => {
  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      const result = validateDateRange('2025-01-01T00:00:00Z', '2025-01-07T23:59:59Z')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject when from date is after to date', () => {
      const result = validateDateRange('2025-01-07T00:00:00Z', '2025-01-01T00:00:00Z')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('before or equal')
    })

    it('should reject date range greater than 365 days', () => {
      const result = validateDateRange('2024-01-01T00:00:00Z', '2025-02-01T00:00:00Z')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('365 days')
    })
  })

  describe('isLargeDateRange', () => {
    it('should return true for range greater than 90 days', () => {
      const result = isLargeDateRange('2024-10-01T00:00:00Z', '2025-01-15T00:00:00Z')
      expect(result).toBe(true)
    })

    it('should return false for range less than or equal to 90 days', () => {
      const result = isLargeDateRange('2025-01-01T00:00:00Z', '2025-03-01T00:00:00Z')
      expect(result).toBe(false)
    })
  })

  describe('parseStatusParam', () => {
    it('should parse comma-separated status values', () => {
      const result = parseStatusParam('delivered,completed')
      expect(result).toEqual(['delivered', 'completed'])
    })

    it('should return undefined for empty string', () => {
      const result = parseStatusParam('')
      expect(result).toBeUndefined()
    })

    it('should throw error for invalid status', () => {
      expect(() => parseStatusParam('delivered,invalid')).toThrow('Invalid status values')
    })
  })
})
