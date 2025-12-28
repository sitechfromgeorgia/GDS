// Georgian Distribution System Cache Management & Invalidation Strategies
// Advanced cache management for Georgian Distribution System entities

import { logger } from '@/lib/logger'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { GDS_CACHE_KEYS } from './client'

// Cache management configuration
export interface GDSCacheConfig {
  // Georgian-specific cache durations (in milliseconds)
  orders: {
    default: number // 2 minutes
    pending: number // 30 seconds - pending orders change frequently
    active: number // 1 minute - active orders need updates
    completed: number // 5 minutes - completed orders stable
  }
  products: {
    default: number // 5 minutes
    active: number // 10 minutes - active products stable
    inactive: number // 30 minutes - inactive products change rarely
  }
  profiles: {
    default: number // 10 minutes
    current: number // 30 minutes - user profile rarely changes
  }
  analytics: {
    default: number // 2 minutes
    detailed: number // 10 minutes - detailed analytics less frequent
  }
}

// Georgian Distribution System cache configuration
export const GDS_CACHE_CONFIG: GDSCacheConfig = {
  orders: {
    default: 1000 * 60 * 2, // 2 minutes
    pending: 1000 * 30, // 30 seconds
    active: 1000 * 60 * 1, // 1 minute
    completed: 1000 * 60 * 5, // 5 minutes
  },
  products: {
    default: 1000 * 60 * 5, // 5 minutes
    active: 1000 * 60 * 10, // 10 minutes
    inactive: 1000 * 60 * 30, // 30 minutes
  },
  profiles: {
    default: 1000 * 60 * 10, // 10 minutes
    current: 1000 * 60 * 30, // 30 minutes
  },
  analytics: {
    default: 1000 * 60 * 2, // 2 minutes
    detailed: 1000 * 60 * 10, // 10 minutes
  },
}

// Cache invalidation patterns for Georgian Distribution System
export const GDSInvalidationPatterns = {
  // Order-related invalidations
  orders: {
    all: ['gds', 'orders'],
    byStatus: (status: string) => ['gds', 'orders', { status }],
    byRestaurant: (restaurantId: string) => ['gds', 'orders', { restaurant_id: restaurantId }],
    byDriver: (driverId: string) => ['gds', 'orders', { driver_id: driverId }],
    specific: (orderId: string) => ['gds', 'order', orderId],
  },

  // Product-related invalidations
  products: {
    all: ['gds', 'products'],
    byCategory: (category: string) => ['gds', 'products', { category }],
    active: ['gds', 'products', { active: true }],
    specific: (productId: string) => ['gds', 'product', productId],
  },

  // Profile/user-related invalidations
  profiles: {
    all: ['gds', 'profiles'],
    byRole: (role: string) => ['gds', 'profiles', { role }],
    specific: (userId: string) => ['gds', 'user', userId, 'profile'],
  },

  // Dashboard and analytics
  dashboard: {
    all: ['gds', 'dashboard'],
    byUser: (userId: string) => ['gds', 'dashboard', { userId }],
  },

  analytics: {
    all: ['gds', 'analytics'],
    byTimeRange: (startDate: string, endDate: string) => [
      'gds',
      'analytics',
      { startDate, endDate },
    ],
  },
}

// Advanced cache management utilities
export class GDSCacheManager {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  // Georgian-specific cache warming strategies
  async warmCache() {
    try {
      logger.info('[GDS Cache] Starting cache warming...')

      // Preload frequently accessed data
      await Promise.allSettled([
        this.preloadProducts(),
        this.preloadOrders(),
        this.preloadAnalytics(),
      ])

      logger.info('[GDS Cache] Cache warming completed')
    } catch (error) {
      logger.warn('[GDS Cache] Cache warming failed:', { error })
    }
  }

  // Prefetch products for Georgian users
  private async preloadProducts() {
    await this.queryClient.prefetchQuery({
      queryKey: GDS_CACHE_KEYS.products({ active: true }),
      queryFn: async () => {
        // This will use the actual query function from useProducts
        return []
      },
      staleTime: GDS_CACHE_CONFIG.products.default,
    })
  }

  // Prefetch recent orders
  private async preloadOrders() {
    await this.queryClient.prefetchQuery({
      queryKey: GDS_CACHE_KEYS.orders({ limit: 10 }),
      queryFn: async () => {
        return []
      },
      staleTime: GDS_CACHE_CONFIG.orders.default,
    })
  }

  // Prefetch analytics data
  private async preloadAnalytics() {
    await this.queryClient.prefetchQuery({
      queryKey: GDS_CACHE_KEYS.analytics(),
      queryFn: async () => {
        return {}
      },
      staleTime: GDS_CACHE_CONFIG.analytics.default,
    })
  }

  // Smart invalidation based on entity changes
  invalidateEntity(entity: 'order' | 'product' | 'profile', data: any) {
    switch (entity) {
      case 'order':
        this.invalidateOrder(data)
        break
      case 'product':
        this.invalidateProduct(data)
        break
      case 'profile':
        this.invalidateProfile(data)
        break
    }
  }

  // Order-specific invalidation
  private invalidateOrder(orderData: any) {
    // Invalidate all orders
    this.queryClient.invalidateQueries({
      queryKey: GDSInvalidationPatterns.orders.all,
    })

    // Invalidate status-specific orders
    if (orderData.status) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.orders.byStatus(orderData.status),
      })
    }

    // Invalidate restaurant-specific orders
    if (orderData.restaurant_id) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.orders.byRestaurant(orderData.restaurant_id),
      })
    }

    // Invalidate driver-specific orders
    if (orderData.driver_id) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.orders.byDriver(orderData.driver_id),
      })
    }

    // Invalidate specific order
    if (orderData.id) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.orders.specific(orderData.id),
      })
    }

    // Invalidate dashboard
    this.queryClient.invalidateQueries({
      queryKey: GDSInvalidationPatterns.dashboard.all,
    })

    // Invalidate analytics
    this.queryClient.invalidateQueries({
      queryKey: GDSInvalidationPatterns.analytics.all,
    })
  }

  // Product-specific invalidation
  private invalidateProduct(productData: any) {
    // Invalidate all products
    this.queryClient.invalidateQueries({
      queryKey: GDSInvalidationPatterns.products.all,
    })

    // Invalidate category-specific products
    if (productData.category) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.products.byCategory(productData.category),
      })
    }

    // Invalidate active products
    if (productData.active) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.products.active,
      })
    }

    // Invalidate specific product
    if (productData.id) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.products.specific(productData.id),
      })
    }
  }

  // Profile-specific invalidation
  private invalidateProfile(profileData: any) {
    // Invalidate all profiles
    this.queryClient.invalidateQueries({
      queryKey: GDSInvalidationPatterns.profiles.all,
    })

    // Invalidate role-specific profiles
    if (profileData.role) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.profiles.byRole(profileData.role),
      })
    }

    // Invalidate specific profile
    if (profileData.id) {
      this.queryClient.invalidateQueries({
        queryKey: GDSInvalidationPatterns.profiles.specific(profileData.id),
      })
    }
  }

  // Georgian-specific cache optimization
  optimizeCache() {
    // Remove stale queries based on Georgian user patterns
    this.queryClient.removeQueries({
      predicate: (query) => {
        // Remove queries that haven't been used recently
        if (query.isStale() && query.state.dataUpdatedAt) {
          const timeSinceLastUse = Date.now() - query.state.dataUpdatedAt
          return timeSinceLastUse > GDS_CACHE_CONFIG.analytics.detailed
        }
        return false
      },
    })
  }

  // Cache statistics for monitoring
  getCacheStats() {
    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale).length,
      errorQueries: queries.filter((q) => q.getObserversCount() > 0 && q.getObserversCount() > 0)
        .length,
      cacheSize: JSON.stringify(queries.map((q) => q.state.data)).length,
    }
  }
}

// React hook for cache management
export function useGDSCacheManager() {
  const queryClient = useQueryClient()
  return new GDSCacheManager(queryClient)
}

// Georgian-specific cache strategies
export const GDS_CACHE_STRATEGIES = {
  // Optimistic updates for better UX
  optimisticUpdate: {
    orders: (orderData: any) => ({
      ...orderData,
      updated_at: new Date().toISOString(),
    }),
    products: (productData: any) => ({
      ...productData,
      updated_at: new Date().toISOString(),
    }),
    profiles: (profileData: any) => ({
      ...profileData,
      updated_at: new Date().toISOString(),
    }),
  },

  // Background refetching for critical data
  backgroundRefetch: {
    orders: true, // Orders should be refreshed in background
    products: false, // Products can be refreshed on focus
    profiles: false, // Profiles rarely need background updates
    analytics: true, // Analytics should be refreshed in background
  },

  // Georgian-specific retry strategies
  retryStrategies: {
    orders: (failureCount: number, error: any) => {
      // Georgian network - be more patient with orders
      if (error?.status >= 500) return failureCount < 5
      return failureCount < 2
    },
    products: (failureCount: number, error: any) => {
      // Products are less critical - fewer retries
      if (error?.status >= 500) return failureCount < 3
      return failureCount < 1
    },
    profiles: (failureCount: number, error: any) => {
      // Profile data is critical - more retries
      if (error?.status >= 500) return failureCount < 4
      return failureCount < 2
    },
  },
}

// Cache persistence utilities for Georgian users (offline support)
export const GDS_CACHE_PERSISTENCE = {
  // Save cache to localStorage for offline access
  saveCache: (queryClient: QueryClient) => {
    if (typeof window === 'undefined') return

    try {
      const cache = queryClient.getQueryCache()
      const queries = cache.getAll()

      const persistableData = queries
        .filter((query) => query.getObserversCount() === 0) // Only inactive queries
        .map((query) => ({
          key: query.queryKey,
          data: query.state.data,
          updatedAt: query.state.dataUpdatedAt,
          error: query.state.error,
        }))

      localStorage.setItem('gds-cache', JSON.stringify(persistableData))
      logger.info(`[GDS Cache] Saved ${persistableData.length} queries to localStorage`)
    } catch (error) {
      logger.warn('[GDS Cache] Failed to save cache:', { error })
    }
  },

  // Restore cache from localStorage
  restoreCache: (queryClient: QueryClient) => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('gds-cache')
      if (!saved) return

      const persistableData = JSON.parse(saved)
      let restoredCount = 0

      persistableData.forEach((item: any) => {
        // Only restore if data is not too old (24 hours)
        if (Date.now() - item.updatedAt < 1000 * 60 * 60 * 24) {
          queryClient.setQueryData(item.key, item.data)
          restoredCount++
        }
      })

      logger.info(`[GDS Cache] Restored ${restoredCount} queries from localStorage`)
    } catch (error) {
      logger.warn('[GDS Cache] Failed to restore cache:', { error })
    }
  },
}

export default {
  GDS_CACHE_CONFIG,
  GDSInvalidationPatterns,
  GDSCacheManager,
  GDS_CACHE_STRATEGIES,
  GDS_CACHE_PERSISTENCE,
}
