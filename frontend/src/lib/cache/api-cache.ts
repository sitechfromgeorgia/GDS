/**
 * Advanced API Cache for Georgian Distribution System
 * Intelligent API caching with Georgian food distribution specific optimizations
 */

import { logger } from '@/lib/logger'
import { gdsCache } from './redis-cache'
import { gdsBrowserCache } from './browser-cache'

export interface APICacheConfig {
  enableRedis?: boolean
  enableBrowser?: boolean
  enableCompression?: boolean
  defaultTTL?: number
  maxRetries?: number
  retryDelay?: number
}

export interface APICacheEntry {
  url: string
  method: string
  data: any
  timestamp: number
  expiresAt: number
  headers: Record<string, string>
  status: number
  size: number
  hits: number
  lastAccessed: number
}

export interface GeorgianDistributionAPIEndpoints {
  orders: {
    list: string
    detail: string
    create: string
    update: string
    analytics: string
  }
  products: {
    catalog: string
    detail: string
    categories: string
    search: string
  }
  users: {
    profiles: string
    sessions: string
    preferences: string
  }
  analytics: {
    dashboard: string
    reports: string
    metrics: string
  }
  system: {
    health: string
    status: string
    metrics: string
  }
}

export interface CacheStrategy {
  ttl: number
  compression: boolean
  invalidateOnUpdate: boolean
  backgroundRefresh: boolean
}

class GeorgianDistributionAPICache {
  private config: Required<APICacheConfig>
  private cache: Map<string, APICacheEntry> = new Map()
  private compressionEnabled: boolean
  private endpoints: GeorgianDistributionAPIEndpoints

  // Georgian Distribution specific API endpoints
  private readonly GDS_ENDPOINTS: GeorgianDistributionAPIEndpoints = {
    orders: {
      list: '/api/orders',
      detail: '/api/orders/:id',
      create: '/api/orders',
      update: '/api/orders/:id',
      analytics: '/api/analytics/orders',
    },
    products: {
      catalog: '/api/products',
      detail: '/api/products/:id',
      categories: '/api/products/categories',
      search: '/api/products/search',
    },
    users: {
      profiles: '/api/profiles',
      sessions: '/api/auth/session',
      preferences: '/api/preferences',
    },
    analytics: {
      dashboard: '/api/analytics/dashboard',
      reports: '/api/analytics/reports',
      metrics: '/api/analytics/metrics',
    },
    system: {
      health: '/api/health',
      status: '/api/status',
      metrics: '/api/metrics',
    },
  }

  // Georgian Distribution specific cache strategies
  private readonly CACHE_STRATEGIES: Record<string, CacheStrategy> = {
    // Georgian orders - frequent updates needed
    'orders:list': {
      ttl: 30,
      compression: false,
      invalidateOnUpdate: true,
      backgroundRefresh: true,
    },
    'orders:detail': {
      ttl: 60,
      compression: true,
      invalidateOnUpdate: true,
      backgroundRefresh: true,
    },
    'orders:analytics': {
      ttl: 120,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: true,
    },

    // Georgian products - more stable data
    'products:catalog': {
      ttl: 300,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: false,
    },
    'products:detail': {
      ttl: 600,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: false,
    },
    'products:categories': {
      ttl: 900,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: false,
    },

    // Georgian users - very stable
    'users:profiles': {
      ttl: 1800,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: false,
    },
    'users:sessions': {
      ttl: 3600,
      compression: false,
      invalidateOnUpdate: true,
      backgroundRefresh: false,
    },

    // Georgian analytics - medium frequency
    'analytics:dashboard': {
      ttl: 120,
      compression: true,
      invalidateOnUpdate: true,
      backgroundRefresh: true,
    },
    'analytics:metrics': {
      ttl: 60,
      compression: true,
      invalidateOnUpdate: true,
      backgroundRefresh: true,
    },

    // Georgian system - frequent health checks
    'system:health': {
      ttl: 30,
      compression: false,
      invalidateOnUpdate: false,
      backgroundRefresh: true,
    },
    'system:metrics': {
      ttl: 60,
      compression: true,
      invalidateOnUpdate: false,
      backgroundRefresh: true,
    },
  }

  constructor(config: APICacheConfig = {}) {
    this.config = {
      enableRedis: config.enableRedis ?? true,
      enableBrowser: config.enableBrowser ?? true,
      enableCompression: config.enableCompression ?? true,
      defaultTTL: config.defaultTTL ?? 300,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    }

    this.compressionEnabled = this.config.enableCompression
    this.endpoints = this.GDS_ENDPOINTS

    logger.info('🚀 Georgian Distribution API Cache initialized', {
      redis: this.config.enableRedis,
      browser: this.config.enableBrowser,
      compression: this.compressionEnabled,
    })
  }

  /**
   * Get cached data with Georgian Distribution specific logic
   */
  async get(url: string, method: string = 'GET'): Promise<any> {
    const cacheKey = this.getCacheKey(url, method)
    const entry = this.cache.get(cacheKey)

    if (!entry) {
      logger.info(`📦 Georgian Distribution API Cache MISS: ${method} ${url}`)
      return null
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      logger.info(`⏰ Georgian Distribution API Cache EXPIRED: ${method} ${url}`)
      await this.delete(url, method)

      // Background refresh for important endpoints
      const strategy = this.getStrategyForEndpoint(url)
      if (strategy?.backgroundRefresh) {
        this.backgroundRefresh(url, method)
      }

      return null
    }

    // Update access metrics
    entry.hits++
    entry.lastAccessed = Date.now()

    logger.info(`🎯 Georgian Distribution API Cache HIT: ${method} ${url} (hits: ${entry.hits})`)

    return entry.data
  }

  /**
   * Set cached data with Georgian Distribution specific logic
   */
  async set(
    url: string,
    method: string,
    data: any,
    headers: Record<string, string> = {},
    status: number = 200
  ): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(url, method)
      const strategy = this.getStrategyForEndpoint(url) || {
        ttl: this.config.defaultTTL,
        compression: this.compressionEnabled,
        invalidateOnUpdate: false,
        backgroundRefresh: false,
      }

      // Compress data if enabled
      let processedData = data
      let size = JSON.stringify(data).length

      if (strategy.compression && this.compressionEnabled) {
        processedData = this.compressData(data)
        size = new Blob([JSON.stringify(processedData)]).size
      }

      const entry: APICacheEntry = {
        url,
        method: method.toUpperCase(),
        data: processedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + strategy.ttl * 1000,
        headers,
        status,
        size,
        hits: 0,
        lastAccessed: Date.now(),
      }

      this.cache.set(cacheKey, entry)

      // Sync to external caches
      await this.syncToExternalCaches(cacheKey, entry)

      logger.info(
        `💾 Georgian Distribution API Cache SET: ${method} ${url} (TTL: ${strategy.ttl}s, Size: ${size} bytes)`
      )

      return true
    } catch (error) {
      logger.error('Georgian Distribution API Cache SET error:', error)
      return false
    }
  }

  /**
   * Delete cached data
   */
  async delete(url: string, method: string = 'GET'): Promise<boolean> {
    const cacheKey = this.getCacheKey(url, method)
    const entry = this.cache.get(cacheKey)

    if (entry) {
      this.cache.delete(cacheKey)
      await this.deleteFromExternalCaches(cacheKey)
      logger.info(`🗑️ Georgian Distribution API Cache DELETE: ${method} ${url}`)
      return true
    }

    return false
  }

  /**
   * Georgian Distribution System specific API cache operations
   */
  async cacheOrderList(params: any = {}): Promise<any> {
    const url = `${this.endpoints.orders.list}${this.buildQueryString(params)}`
    return await this.get(url)
  }

  async setOrderList(orders: any, params: any = {}): Promise<void> {
    const url = `${this.endpoints.orders.list}${this.buildQueryString(params)}`
    await this.set(url, 'GET', orders)
  }

  async cacheOrderDetail(orderId: string): Promise<any> {
    const url = this.endpoints.orders.detail.replace(':id', orderId)
    return await this.get(url)
  }

  async setOrderDetail(orderId: string, orderData: any): Promise<void> {
    const url = this.endpoints.orders.detail.replace(':id', orderId)
    await this.set(url, 'GET', orderData)
  }

  async cacheProductCatalog(filters: any = {}): Promise<any> {
    const url = `${this.endpoints.products.catalog}${this.buildQueryString(filters)}`
    return await this.get(url)
  }

  async setProductCatalog(products: any, filters: any = {}): Promise<void> {
    const url = `${this.endpoints.products.catalog}${this.buildQueryString(filters)}`
    await this.set(url, 'GET', products)
  }

  async cacheSystemHealth(): Promise<any> {
    return await this.get(this.endpoints.system.health)
  }

  async setSystemHealth(healthData: any): Promise<void> {
    await this.set(this.endpoints.system.health, 'GET', healthData)
  }

  async cacheAnalyticsDashboard(): Promise<any> {
    return await this.get(this.endpoints.analytics.dashboard)
  }

  async setAnalyticsDashboard(analyticsData: any): Promise<void> {
    await this.set(this.endpoints.analytics.dashboard, 'GET', analyticsData)
  }

  /**
   * Georgian Distribution System cache invalidation
   */
  async invalidateOrderCache(orderId?: string, restaurantId?: string): Promise<void> {
    // Invalidate order list
    await this.delete(this.endpoints.orders.list)

    // Invalidate specific order detail
    if (orderId) {
      const orderUrl = this.endpoints.orders.detail.replace(':id', orderId)
      await this.delete(orderUrl)
    }

    // Invalidate order analytics
    await this.delete(this.endpoints.orders.analytics)

    // Invalidate dashboard analytics
    await this.delete(this.endpoints.analytics.dashboard)

    logger.info('🔄 Georgian Distribution API Cache: Order cache invalidated')
  }

  async invalidateProductCache(category?: string): Promise<void> {
    // Invalidate product catalog
    await this.delete(this.endpoints.products.catalog)

    // Invalidate product categories
    await this.delete(this.endpoints.products.categories)

    logger.info('🔄 Georgian Distribution API Cache: Product cache invalidated')
  }

  async invalidateUserCache(userId?: string): Promise<void> {
    // Invalidate user profiles
    await this.delete(this.endpoints.users.profiles)

    // Invalidate user sessions
    await this.delete(this.endpoints.users.sessions)

    logger.info('🔄 Georgian Distribution API Cache: User cache invalidated')
  }

  /**
   * Cache warming for Georgian Distribution System
   */
  async warmCache(): Promise<void> {
    logger.info('🔥 Georgian Distribution API Cache Warming Started')

    try {
      // Pre-warm critical endpoints
      const criticalEndpoints = [
        this.endpoints.system.health,
        this.endpoints.analytics.dashboard,
        this.endpoints.products.categories,
      ]

      for (const endpoint of criticalEndpoints) {
        try {
          // Simulate fetching and caching data
          await this.set(endpoint, 'GET', { warmed: true, timestamp: Date.now() })
        } catch (error) {
          logger.warn(`Failed to warm endpoint: ${endpoint}`, { error })
        }
      }

      logger.info('✅ Georgian Distribution API Cache Warming Completed')
    } catch (error) {
      logger.error('❌ Georgian Distribution API Cache Warming Failed:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics() {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)

    return {
      totalEntries: entries.length,
      totalSize,
      avgSize: entries.length > 0 ? totalSize / entries.length : 0,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      mostAccessed:
        entries.length > 0
          ? entries.reduce((most, entry) => (entry.hits > most.hits ? entry : most), entries[0]!)
          : null,
      oldestEntry:
        entries.length > 0
          ? entries.reduce(
              (oldest, entry) => (entry.timestamp < oldest.timestamp ? entry : oldest),
              entries[0]!
            )
          : null,
      compressionRatio: this.calculateCompressionRatio(),
      cacheUtilization: (totalSize / (50 * 1024 * 1024)) * 100, // 50MB limit
    }
  }

  /**
   * Private methods
   */
  private getCacheKey(url: string, method: string): string {
    return `${method.toUpperCase()}:${url}`
  }

  private getStrategyForEndpoint(url: string): CacheStrategy | undefined {
    // Find matching strategy based on URL patterns
    for (const [pattern, strategy] of Object.entries(this.CACHE_STRATEGIES)) {
      if (this.matchesPattern(url, pattern)) {
        return strategy
      }
    }
    return undefined
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Simple pattern matching for Georgian Distribution endpoints
    if (pattern.includes(':id')) {
      const regex = new RegExp(pattern.replace(':id', '\\d+'))
      return regex.test(url)
    }
    return url.includes(pattern.replace(':', ''))
  }

  private buildQueryString(params: Record<string, any>): string {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    return query ? `?${query}` : ''
  }

  private compressData(data: any): any {
    // Simple compression logic (in real implementation, use gzip/deflate)
    if (typeof data === 'string') {
      return { _compressed: true, data: data }
    }
    if (Array.isArray(data)) {
      return { _compressed: true, data: data }
    }
    return data
  }

  private async syncToExternalCaches(key: string, entry: APICacheEntry): Promise<void> {
    const promises: Promise<any>[] = []

    // Sync to Redis cache
    if (this.config.enableRedis) {
      promises.push(
        gdsCache.set('api', key, entry, Math.floor((entry.expiresAt - Date.now()) / 1000))
      )
    }

    // Sync to browser cache
    if (this.config.enableBrowser) {
      promises.push(gdsBrowserCache.set(key, entry, 'api'))
    }

    await Promise.allSettled(promises)
  }

  private async deleteFromExternalCaches(key: string): Promise<void> {
    const promises: Promise<any>[] = []

    // Delete from Redis cache
    if (this.config.enableRedis) {
      promises.push(gdsCache.delete('api', key))
    }

    // Delete from browser cache
    if (this.config.enableBrowser) {
      promises.push(gdsBrowserCache.delete(key))
    }

    await Promise.allSettled(promises)
  }

  private async backgroundRefresh(url: string, method: string): Promise<void> {
    logger.info(`🔄 Background refresh triggered for: ${method} ${url}`)

    // This would typically trigger a fetch to refresh the data
    // Implementation depends on your API structure
  }

  private calculateCompressionRatio(): number {
    const entries = Array.from(this.cache.values())
    if (entries.length === 0) return 0

    const totalOriginalSize = entries.reduce((sum, entry) => {
      // Estimate original size (compressed data would be smaller)
      return sum + entry.size
    }, 0)

    const totalCompressedSize = entries.reduce((sum, entry) => {
      // Current size (already compressed if compression was used)
      return sum + entry.size
    }, 0)

    return totalOriginalSize > 0 ? (1 - totalCompressedSize / totalOriginalSize) * 100 : 0
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.cache.clear()

    // Clear external caches
    if (this.config.enableRedis) {
      // Clear API cache from Redis
    }

    if (this.config.enableBrowser) {
      // Clear API cache from browser
    }

    logger.info('🧽 Georgian Distribution API Cache Cleared')
  }
}

// Export singleton instance
export const georgianDistributionAPICache = new GeorgianDistributionAPICache()

// Export convenience functions
export const gdsAPICache = {
  get: (url: string, method?: string) => georgianDistributionAPICache.get(url, method),
  set: (url: string, method: string, data: any, headers?: any) =>
    georgianDistributionAPICache.set(url, method, data, headers),
  delete: (url: string, method?: string) => georgianDistributionAPICache.delete(url, method),
  invalidateOrder: (orderId?: string, restaurantId?: string) =>
    georgianDistributionAPICache.invalidateOrderCache(orderId, restaurantId),
  invalidateProduct: (category?: string) =>
    georgianDistributionAPICache.invalidateProductCache(category),
  invalidateUser: (userId?: string) => georgianDistributionAPICache.invalidateUserCache(userId),
  warmCache: () => georgianDistributionAPICache.warmCache(),
  getStatistics: () => georgianDistributionAPICache.getStatistics(),
  clear: () => georgianDistributionAPICache.clear(),
}

export default GeorgianDistributionAPICache
