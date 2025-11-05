/**
 * React Query Client Configuration
 *
 * Optimized caching configuration for different data types:
 * - Products: 5 minutes stale time (rarely change)
 * - Orders: 30 seconds stale time (change frequently)
 * - Cart: 10 seconds stale time (real-time updates needed)
 *
 * This configuration significantly reduces unnecessary API calls
 * while ensuring data freshness where it matters.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults
      staleTime: 60 * 1000, // 1 minute default
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
      retry: 1, // Only retry failed requests once
    },
  },
})

/**
 * Query Key Factories
 * Consistent query keys across the application
 */
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.orders.lists(), { filters }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    items: () => [...queryKeys.cart.all, 'items'] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    active: () => [...queryKeys.categories.all, 'active'] as const,
  },

  // Users/Profiles
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
  },
}

/**
 * Cache Time Constants
 * Use these constants in your useQuery hooks for consistency
 */
export const CACHE_TIMES = {
  // Products rarely change - longer cache
  PRODUCTS: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Orders change frequently - shorter cache
  ORDERS: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },

  // Cart needs real-time feel - very short cache
  CART: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds
  },

  // Categories rarely change - very long cache
  CATEGORIES: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // User profile - medium cache
  PROFILE: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
}
