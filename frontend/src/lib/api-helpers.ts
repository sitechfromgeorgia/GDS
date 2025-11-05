/**
 * API Helper Utilities
 * Common functions for API requests and responses
 */

import { logger } from '@/lib/logger'

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

/**
 * Generic API fetch wrapper with error handling
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('API request failed', { url, status: response.status, data })
      return {
        error: data.error || 'Request failed',
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    logger.error('API request error', error as Error)
    return {
      error: 'Network error',
      status: 500,
    }
  }
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `?${query}` : ''
}

/**
 * Handle API errors with user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'დაფიქსირდა შეცდომა'
}
