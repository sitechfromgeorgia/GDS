// Georgian Distribution System Query Client Configuration
// Dedicated to optimizing React Query for Georgian Distribution System

import { logger } from '@/lib/logger'
import { QueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'

// Georgian Distribution System specific query configuration
export interface GDSQueryConfig {
  staleTime: number
  gcTime: number
  retry: (failureCount: number, error: any) => boolean
  retryDelay: (attemptIndex: number) => number
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  refetchOnMount: boolean
}

// Georgian Distribution System environment settings
export interface GDSEnvironment {
  isDevelopment: boolean
  isProduction: boolean
  isLocal: boolean
  enableDevtools: boolean
  enablePersistence: boolean
  networkMode: 'good' | 'poor' | 'offline'
}

// Georgian Distribution System query metrics
export interface GDSQueryMetrics {
  cacheHitRate: number
  averageResponseTime: number
  errorRate: number
  retryRate: number
}

// Default Georgian Distribution System settings
export const GDS_DEFAULT_CONFIG: GDSQueryConfig = {
  staleTime: 1000 * 60 * 2, // 2 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
  retry: (failureCount: number, error: any) => {
    // Georgian network conditions - be more forgiving
    if (error?.status >= 400 && error?.status < 500) {
      return false // Don't retry client errors
    }
    return failureCount < 3 // Retry up to 3 times
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
}

// Network mode detection for Georgian infrastructure
export const detectNetworkMode = (): GDSEnvironment['networkMode'] => {
  if (typeof navigator === 'undefined') return 'good'

  // Check connection API if available
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection
  if (connection) {
    const effectiveType = connection.effectiveType
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'poor'
    }
    if (effectiveType === '3g') {
      return 'poor'
    }
    if (effectiveType === '4g' || effectiveType === '5g') {
      return 'good'
    }
  }

  // Fallback to online status
  return navigator.onLine ? 'good' : 'offline'
}

// Environment detection for Georgian Distribution System
export const getGDSEnvironment = (): GDSEnvironment => {
  const networkMode = detectNetworkMode()

  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isLocal: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') || false,
    enableDevtools: process.env.NODE_ENV === 'development' && typeof window !== 'undefined',
    enablePersistence: process.env.NODE_ENV === 'production' && networkMode !== 'poor',
    networkMode,
  }
}

// Georgian Distribution System specific query client factory
export function createGDSQueryClient(): QueryClient {
  const env = getGDSEnvironment()

  // Adjust config based on environment and network conditions
  let adjustedConfig = { ...GDS_DEFAULT_CONFIG }

  // Poor network conditions
  if (env.networkMode === 'poor') {
    adjustedConfig = {
      ...adjustedConfig,
      staleTime: adjustedConfig.staleTime * 3, // Cache longer
      retry: (failureCount: number) => failureCount < 2, // Fewer retries
    }
  }

  // Offline mode
  if (env.networkMode === 'offline') {
    adjustedConfig = {
      ...adjustedConfig,
      staleTime: Infinity, // Never refetch when offline
      retry: () => false,
    }
  }

  // Development optimizations
  if (env.isDevelopment) {
    adjustedConfig = {
      ...adjustedConfig,
      staleTime: Math.min(adjustedConfig.staleTime, 30000), // Faster stale time for dev
    }
  }

  return new QueryClient({
    defaultOptions: {
      queries: {
        ...adjustedConfig,
        // Georgian-specific query options
        meta: {
          gds: true, // Mark as Georgian Distribution System query
          environment: env.networkMode,
        },
      },
      mutations: {
        retry: env.networkMode === 'poor' ? 1 : 2,
        meta: {
          gds: true,
          environment: env.networkMode,
        },
      },
    },
  })
}

// Georgian Distribution System cache keys factory
export const GDS_CACHE_KEYS = {
  // Entity keys
  orders: (filters?: any) => ['gds', 'orders', filters].filter(Boolean),
  products: (filters?: any) => ['gds', 'products', filters].filter(Boolean),
  profiles: (filters?: any) => ['gds', 'profiles', filters].filter(Boolean),
  users: (filters?: any) => ['gds', 'users', filters].filter(Boolean),
  analytics: (filters?: any) => ['gds', 'analytics', filters].filter(Boolean),
  dashboard: (filters?: any) => ['gds', 'dashboard', filters].filter(Boolean),

  // Complex keys with multiple parameters
  ordersByRestaurant: (restaurantId: string, status?: string) =>
    ['gds', 'orders', 'by-restaurant', restaurantId, status].filter(Boolean),

  productsByCategory: (category: string, active?: boolean) =>
    ['gds', 'products', 'by-category', category, active].filter(Boolean),

  analyticsTimeRange: (startDate: string, endDate: string) =>
    ['gds', 'analytics', 'time-range', startDate, endDate].filter(Boolean),

  // User-specific keys
  userOrders: (userId: string) => ['gds', 'user', userId, 'orders'],
  userProfile: (userId: string) => ['gds', 'user', userId, 'profile'],
} as const

// Georgian Distribution System query utilities
export const GDSQueryUtils = {
  // Network-aware query configuration
  getNetworkOptimizedConfig: () => {
    const env = getGDSEnvironment()
    const baseConfig = GDS_DEFAULT_CONFIG

    switch (env.networkMode) {
      case 'poor':
        return {
          ...baseConfig,
          staleTime: baseConfig.staleTime * 3,
          retry: (failureCount: number) => failureCount < 2,
        }
      case 'offline':
        return {
          ...baseConfig,
          staleTime: Infinity,
          retry: () => false,
        }
      default:
        return baseConfig
    }
  },

  // Georgian-specific error messages
  getErrorMessage: (error: any, language: 'ka' | 'en' = 'ka'): string => {
    if (error?.code === 'PGRST116') {
      return language === 'ka' ? 'მონაცემები ვერ მოიძებნა' : 'Data not found'
    }

    if (error?.code === '42501') {
      return language === 'ka' ? 'არ გაქვთ წვდომა ამ მონაცემებზე' : 'Access denied'
    }

    if (error?.code === '23505') {
      return language === 'ka' ? 'ეს ჩანაწერი უკვე არსებობს' : 'Record already exists'
    }

    // Default network error
    if (error?.message?.includes('fetch')) {
      return language === 'ka'
        ? 'ქსელის შეცდომა - შეამოწმეთ კავშირი'
        : 'Network error - please check your connection'
    }

    return error?.message || (language === 'ka' ? 'გაურკვეველი შეცდომა' : 'Unknown error')
  },

  // Cache management utilities
  invalidateGDSQueries: (queryClient: QueryClient) => {
    // Invalidate all Georgian Distribution System queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'gds'
      },
    })
  },

  // Prefetch common data for Georgian users
  prefetchCommonData: async (queryClient: QueryClient) => {
    const supabase = createBrowserClient()

    try {
      // Prefetch common products
      await queryClient.prefetchQuery({
        queryKey: GDS_CACHE_KEYS.products({ active: true }),
        queryFn: async () => {
          const { data } = await supabase.from('products').select('*').eq('active', true).limit(50)
          return data
        },
        staleTime: GDS_DEFAULT_CONFIG.staleTime,
      })

      // Prefetch user profile if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await queryClient.prefetchQuery({
          queryKey: GDS_CACHE_KEYS.userProfile(user.id),
          queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            return data
          },
          staleTime: GDS_DEFAULT_CONFIG.staleTime,
        })
      }
    } catch (error) {
      logger.warn('Failed to prefetch common data:', { error })
    }
  },
}

export default {
  createGDSQueryClient,
  GDS_CACHE_KEYS,
  GDSQueryUtils,
  getGDSEnvironment,
  GDS_DEFAULT_CONFIG,
}
