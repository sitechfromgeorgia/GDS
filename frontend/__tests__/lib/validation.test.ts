/**
 * Validation Utilities Test Suite
 * Tests for form validation functions and schemas
 */

import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  productSchema,
  orderSchema,
  profileSchema,
  categorySchema
} from '@/lib/validation'
import { z } from 'zod'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(validLogin)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidLogin = {
        email: 'notanemail',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email')
      }
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: 'Pass123'
      }

      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('password')
      }
    })

    it('should reject empty fields', () => {
      const emptyLogin = {
        email: '',
        password: ''
      }

      const result = loginSchema.safeParse(emptyLogin)
      expect(result.success).toBe(false)
    })
  })

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validSignup = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        fullName: 'John Doe',
        phone: '+995555123456',
        role: 'restaurant'
      }

      const result = signupSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      const invalidSignup = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'John Doe',
        phone: 'invalid-phone',
        role: 'restaurant'
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid roles', () => {
      const invalidSignup = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'John Doe',
        phone: '+995555123456',
        role: 'invalid-role'
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should accept valid roles: admin, restaurant, driver', () => {
      const roles = ['admin', 'restaurant', 'driver']

      roles.forEach(role => {
        const signup = {
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'John Doe',
          phone: '+995555123456',
          role
        }

        const result = signupSchema.safeParse(signup)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('productSchema', () => {
    it('should validate correct product data', () => {
      const validProduct = {
        name: 'Fresh Milk',
        description: 'Organic whole milk',
        sku: 'MILK-001',
        price: 5.50,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        stock: 100,
        unit: 'liter',
        isAvailable: true
      }

      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it('should reject negative prices', () => {
      const invalidProduct = {
        name: 'Fresh Milk',
        sku: 'MILK-001',
        price: -5.50,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        stock: 100,
        unit: 'liter'
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })

    it('should reject negative stock', () => {
      const invalidProduct = {
        name: 'Fresh Milk',
        sku: 'MILK-001',
        price: 5.50,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        stock: -10,
        unit: 'liter'
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })

    it('should require minimum name length', () => {
      const invalidProduct = {
        name: 'M',
        sku: 'MILK-001',
        price: 5.50,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        stock: 100,
        unit: 'liter'
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })

    it('should require minimum SKU length', () => {
      const invalidProduct = {
        name: 'Fresh Milk',
        sku: 'M',
        price: 5.50,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        stock: 100,
        unit: 'liter'
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })
  })

  describe('orderSchema', () => {
    it('should validate correct order data', () => {
      const validOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        deliveryAddress: '123 Main St, Tbilisi',
        deliveryNotes: 'Ring doorbell',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 2,
            unitPrice: 5.50
          }
        ]
      }

      const result = orderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('should reject empty delivery address', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        deliveryAddress: '',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 2,
            unitPrice: 5.50
          }
        ]
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })

    it('should reject orders with no items', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        deliveryAddress: '123 Main St',
        items: []
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })

    it('should reject items with zero quantity', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        deliveryAddress: '123 Main St',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 0,
            unitPrice: 5.50
          }
        ]
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })

    it('should reject items with negative unit price', () => {
      const invalidOrder = {
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        deliveryAddress: '123 Main St',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 2,
            unitPrice: -5.50
          }
        ]
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })
  })

  describe('profileSchema', () => {
    it('should validate correct profile data', () => {
      const validProfile = {
        fullName: 'John Doe',
        phone: '+995555123456',
        address: '123 Main St, Tbilisi',
        role: 'restaurant'
      }

      const result = profileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should require full name', () => {
      const invalidProfile = {
        fullName: '',
        phone: '+995555123456',
        role: 'restaurant'
      }

      const result = profileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should validate phone number format', () => {
      const invalidProfile = {
        fullName: 'John Doe',
        phone: '123',
        role: 'restaurant'
      }

      const result = profileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should accept optional address', () => {
      const validProfile = {
        fullName: 'John Doe',
        phone: '+995555123456',
        role: 'restaurant'
      }

      const result = profileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })
  })

  describe('categorySchema', () => {
    it('should validate correct category data', () => {
      const validCategory = {
        name: 'Beverages',
        description: 'Drinks and beverages'
      }

      const result = categorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should require category name', () => {
      const invalidCategory = {
        name: '',
        description: 'Some description'
      }

      const result = categorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('should accept category without description', () => {
      const validCategory = {
        name: 'Beverages'
      }

      const result = categorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should require minimum name length', () => {
      const invalidCategory = {
        name: 'B'
      }

      const result = categorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined values', () => {
      const result = loginSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should handle null values', () => {
      const result = loginSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should handle extra properties', () => {
      const loginWithExtra = {
        email: 'test@example.com',
        password: 'Password123',
        extraField: 'should be ignored'
      }

      const result = loginSchema.safeParse(loginWithExtra)
      expect(result.success).toBe(true)
    })

    it('should trim whitespace from strings', () => {
      const loginWithWhitespace = {
        email: '  test@example.com  ',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(loginWithWhitespace)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error messages for invalid email', () => {
      const invalid = {
        email: 'notanemail',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('email')
      }
    })

    it('should provide clear error messages for short password', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Pass'
      }

      const result = loginSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('8')
      }
    })
  })
})
