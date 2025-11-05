/**
 * localStorage Utilities Test Suite
 * Tests for localStorage helper functions with type safety and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getFromStorage,
  setToStorage,
  removeFromStorage,
  clearStorage,
  getStorageSize,
  isStorageAvailable
} from '@/lib/localStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('localStorage Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getFromStorage', () => {
    it('should retrieve string value', () => {
      localStorage.setItem('key', 'value')

      const result = getFromStorage('key')

      expect(result).toBe('value')
    })

    it('should retrieve and parse JSON object', () => {
      const obj = { name: 'John', age: 30 }
      localStorage.setItem('user', JSON.stringify(obj))

      const result = getFromStorage('user')

      expect(result).toEqual(obj)
    })

    it('should retrieve and parse JSON array', () => {
      const arr = [1, 2, 3, 4, 5]
      localStorage.setItem('numbers', JSON.stringify(arr))

      const result = getFromStorage('numbers')

      expect(result).toEqual(arr)
    })

    it('should return null for non-existent key', () => {
      const result = getFromStorage('nonexistent')

      expect(result).toBeNull()
    })

    it('should return default value for non-existent key', () => {
      const result = getFromStorage('nonexistent', 'default')

      expect(result).toBe('default')
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('invalid', '{invalid json}')

      const result = getFromStorage('invalid')

      expect(result).toBe('{invalid json}')
    })

    it('should retrieve boolean values', () => {
      localStorage.setItem('flag', JSON.stringify(true))

      const result = getFromStorage('flag')

      expect(result).toBe(true)
    })

    it('should retrieve number values', () => {
      localStorage.setItem('count', JSON.stringify(42))

      const result = getFromStorage('count')

      expect(result).toBe(42)
    })

    it('should handle null values', () => {
      localStorage.setItem('nullable', JSON.stringify(null))

      const result = getFromStorage('nullable')

      expect(result).toBeNull()
    })

    it('should handle empty string', () => {
      localStorage.setItem('empty', '')

      const result = getFromStorage('empty')

      expect(result).toBe('')
    })
  })

  describe('setToStorage', () => {
    it('should store string value', () => {
      setToStorage('key', 'value')

      expect(localStorage.getItem('key')).toBe('value')
    })

    it('should store and stringify object', () => {
      const obj = { name: 'John', age: 30 }
      setToStorage('user', obj)

      const stored = localStorage.getItem('user')
      expect(JSON.parse(stored!)).toEqual(obj)
    })

    it('should store and stringify array', () => {
      const arr = [1, 2, 3, 4, 5]
      setToStorage('numbers', arr)

      const stored = localStorage.getItem('numbers')
      expect(JSON.parse(stored!)).toEqual(arr)
    })

    it('should store boolean values', () => {
      setToStorage('flag', true)

      const stored = localStorage.getItem('flag')
      expect(JSON.parse(stored!)).toBe(true)
    })

    it('should store number values', () => {
      setToStorage('count', 42)

      const stored = localStorage.getItem('count')
      expect(JSON.parse(stored!)).toBe(42)
    })

    it('should store null values', () => {
      setToStorage('nullable', null)

      const stored = localStorage.getItem('nullable')
      expect(stored).toBe('null')
    })

    it('should store undefined as null', () => {
      setToStorage('undefined', undefined)

      const stored = localStorage.getItem('undefined')
      expect(stored).toBe('null')
    })

    it('should overwrite existing values', () => {
      setToStorage('key', 'value1')
      setToStorage('key', 'value2')

      expect(localStorage.getItem('key')).toBe('value2')
    })

    it('should handle complex nested objects', () => {
      const complex = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        },
        items: [1, 2, 3]
      }

      setToStorage('complex', complex)

      const stored = localStorage.getItem('complex')
      expect(JSON.parse(stored!)).toEqual(complex)
    })

    it('should handle Date objects', () => {
      const date = new Date('2025-01-15')
      setToStorage('date', date)

      const stored = localStorage.getItem('date')
      expect(stored).toBeTruthy()
    })
  })

  describe('removeFromStorage', () => {
    it('should remove item from storage', () => {
      localStorage.setItem('key', 'value')

      removeFromStorage('key')

      expect(localStorage.getItem('key')).toBeNull()
    })

    it('should handle removing non-existent key', () => {
      expect(() => removeFromStorage('nonexistent')).not.toThrow()
    })

    it('should remove multiple items', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      localStorage.setItem('key3', 'value3')

      removeFromStorage('key1')
      removeFromStorage('key2')

      expect(localStorage.getItem('key1')).toBeNull()
      expect(localStorage.getItem('key2')).toBeNull()
      expect(localStorage.getItem('key3')).toBe('value3')
    })
  })

  describe('clearStorage', () => {
    it('should clear all items from storage', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      localStorage.setItem('key3', 'value3')

      clearStorage()

      expect(localStorage.length).toBe(0)
    })

    it('should clear storage with prefix', () => {
      localStorage.setItem('app_key1', 'value1')
      localStorage.setItem('app_key2', 'value2')
      localStorage.setItem('other_key', 'value3')

      clearStorage('app_')

      expect(localStorage.getItem('app_key1')).toBeNull()
      expect(localStorage.getItem('app_key2')).toBeNull()
      expect(localStorage.getItem('other_key')).toBe('value3')
    })

    it('should handle empty storage', () => {
      expect(() => clearStorage()).not.toThrow()
    })
  })

  describe('getStorageSize', () => {
    it('should calculate storage size', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')

      const size = getStorageSize()

      expect(size).toBeGreaterThan(0)
    })

    it('should return zero for empty storage', () => {
      const size = getStorageSize()

      expect(size).toBe(0)
    })

    it('should calculate size in bytes', () => {
      const largeString = 'A'.repeat(1000)
      localStorage.setItem('large', largeString)

      const size = getStorageSize()

      expect(size).toBeGreaterThanOrEqual(1000)
    })

    it('should calculate size with prefix filter', () => {
      localStorage.setItem('app_key1', 'value1')
      localStorage.setItem('app_key2', 'value2')
      localStorage.setItem('other_key', 'value3')

      const size = getStorageSize('app_')

      expect(size).toBeGreaterThan(0)
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true when storage is available', () => {
      const result = isStorageAvailable()

      expect(result).toBe(true)
    })

    it('should handle storage quota errors', () => {
      // Mock quota exceeded
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError')
      }

      const result = isStorageAvailable()

      expect(result).toBe(false)

      // Restore
      localStorage.setItem = originalSetItem
    })
  })

  describe('Type Safety', () => {
    it('should preserve types with generic', () => {
      interface User {
        id: string
        name: string
        age: number
      }

      const user: User = { id: '1', name: 'John', age: 30 }
      setToStorage<User>('user', user)

      const retrieved = getFromStorage<User>('user')

      expect(retrieved).toEqual(user)
      expect(retrieved?.name).toBe('John')
    })

    it('should handle array types', () => {
      const numbers: number[] = [1, 2, 3, 4, 5]
      setToStorage<number[]>('numbers', numbers)

      const retrieved = getFromStorage<number[]>('numbers')

      expect(retrieved).toEqual(numbers)
    })

    it('should handle union types', () => {
      type Status = 'pending' | 'confirmed' | 'completed'
      const status: Status = 'confirmed'

      setToStorage<Status>('status', status)

      const retrieved = getFromStorage<Status>('status')

      expect(retrieved).toBe('confirmed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large objects', () => {
      const largeObj = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      }

      expect(() => setToStorage('large', largeObj)).not.toThrow()
    })

    it('should handle special characters in keys', () => {
      setToStorage('key-with-dashes', 'value')
      setToStorage('key_with_underscores', 'value')
      setToStorage('key.with.dots', 'value')

      expect(getFromStorage('key-with-dashes')).toBe('value')
      expect(getFromStorage('key_with_underscores')).toBe('value')
      expect(getFromStorage('key.with.dots')).toBe('value')
    })

    it('should handle special characters in values', () => {
      const specialValue = 'Value with & < > " \' characters'
      setToStorage('special', specialValue)

      expect(getFromStorage('special')).toBe(specialValue)
    })

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍'
      setToStorage('unicode', unicode)

      expect(getFromStorage('unicode')).toBe(unicode)
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }
      obj.circular = obj

      expect(() => setToStorage('circular', obj)).toThrow()
    })

    it('should handle empty objects', () => {
      const empty = {}
      setToStorage('empty', empty)

      expect(getFromStorage('empty')).toEqual({})
    })

    it('should handle empty arrays', () => {
      const empty: any[] = []
      setToStorage('empty', empty)

      expect(getFromStorage('empty')).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should handle rapid consecutive operations', () => {
      for (let i = 0; i < 100; i++) {
        setToStorage(`key${i}`, `value${i}`)
      }

      for (let i = 0; i < 100; i++) {
        expect(getFromStorage(`key${i}`)).toBe(`value${i}`)
      }
    })

    it('should handle large batch operations', () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        setToStorage(`batch_${i}`, { id: i, data: `data_${i}` })
      }

      const duration = Date.now() - startTime

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock storage error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('Storage error')
      }

      expect(() => setToStorage('key', 'value')).toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })

    it('should handle retrieval errors gracefully', () => {
      // Mock retrieval error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => {
        throw new Error('Retrieval error')
      }

      expect(() => getFromStorage('key')).toThrow()

      // Restore
      localStorage.getItem = originalGetItem
    })
  })
})
