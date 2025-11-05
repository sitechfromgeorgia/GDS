/**
 * LocalStorage Utilities
 * Type-safe localStorage wrapper with error handling
 */

import { logger } from '@/lib/logger'

/**
 * Get item from localStorage with type safety
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    logger.error('Failed to get from localStorage', error as Error, { key })
    return defaultValue
  }
}

/**
 * Set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    logger.error('Failed to set in localStorage', error as Error, { key })
    return false
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.removeItem(key)
    return true
  } catch (error) {
    logger.error('Failed to remove from localStorage', error as Error, { key })
    return false
  }
}

/**
 * Clear all items from localStorage
 */
export function clearLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.clear()
    return true
  } catch (error) {
    logger.error('Failed to clear localStorage', error as Error)
    return false
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const testKey = '__test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
