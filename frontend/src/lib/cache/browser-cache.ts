import { logger } from '@/lib/logger'

/**
 * Advanced Browser Cache Management for Georgian Distribution System
 * Optimized for Georgian food distribution workflows with intelligent invalidation
 */

export interface BrowserCacheConfig {
  enableServiceWorker?: boolean
  maxCacheSize?: number
  defaultTTL?: number
  cacheStrategies?: {
    api?: CacheStrategy
    static?: CacheStrategy
    documents?: CacheStrategy
  }
}

export interface CacheStrategy {
  name: string
  maxAge: number // in seconds
  staleWhileRevalidate: boolean
  cacheFirst: boolean
  networkFirst: boolean
}

export interface GeorgianDistributionCacheEntry {
  key: string
  data: any
  timestamp: number
  expiresAt: number
  accessCount: number
  lastAccessed: number
  size: number
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  totalRequests: number
  cacheSize: number
  storageUsed: number
  gcRuns: number
}

class GeorgianDistributionBrowserCache {
  private config: Required<BrowserCacheConfig>
  private cache: Map<string, GeorgianDistributionCacheEntry> = new Map()
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheSize: 0,
    storageUsed: 0,
    gcRuns: 0,
  }

  // Georgian Distribution specific cache strategies
  private readonly CACHE_STRATEGIES = {
    // Georgian food orders - need frequent updates
    orders: {
      name: 'gds-orders',
      maxAge: 60, // 1 minute - orders change frequently
      staleWhileRevalidate: true,
      cacheFirst: false,
      networkFirst: true,
    },

    // Georgian product catalog - stable data
    products: {
      name: 'gds-products',
      maxAge: 300, // 5 minutes - product catalog changes less frequently
      staleWhileRevalidate: true,
      cacheFirst: true,
      networkFirst: false,
    },

    // Georgian user profiles - very stable
    profiles: {
      name: 'gds-profiles',
      maxAge: 1800, // 30 minutes - profiles rarely change
      staleWhileRevalidate: false,
      cacheFirst: true,
      networkFirst: false,
    },

    // Georgian system health - needs frequent updates
    health: {
      name: 'gds-health',
      maxAge: 30, // 30 seconds - health checks frequent
      staleWhileRevalidate: false,
      cacheFirst: false,
      networkFirst: true,
    },

    // Georgian analytics - medium frequency
    analytics: {
      name: 'gds-analytics',
      maxAge: 120, // 2 minutes - analytics update frequently
      staleWhileRevalidate: true,
      cacheFirst: false,
      networkFirst: true,
    },
  }

  constructor(config: BrowserCacheConfig = {}) {
    this.config = {
      enableServiceWorker: config.enableServiceWorker ?? true,
      maxCacheSize: config.maxCacheSize ?? 50 * 1024 * 1024, // 50MB
      defaultTTL: config.defaultTTL ?? 300, // 5 minutes
      cacheStrategies: config.cacheStrategies ?? {
        api: this.CACHE_STRATEGIES.products,
        static: this.CACHE_STRATEGIES.products,
        documents: this.CACHE_STRATEGIES.profiles,
      },
    }

    // Initialize cache from localStorage
    this.loadFromStorage()

    // Setup automatic garbage collection
    this.setupGarbageCollection()

    // Setup service worker if enabled
    if (this.config.enableServiceWorker) {
      this.setupServiceWorker()
    }
  }

  /**
   * Set cache with Georgian Distribution specific logic
   */
  async set(
    key: string,
    data: any,
    strategy: keyof typeof this.CACHE_STRATEGIES = 'products'
  ): Promise<boolean> {
    try {
      this.metrics.totalRequests++

      // Serialize data and calculate size
      const serialized = JSON.stringify(data)
      const size = new Blob([serialized]).size

      // Check cache size limit
      if (this.metrics.cacheSize + size > this.config.maxCacheSize) {
        await this.evictOldest()
      }

      const entry: GeorgianDistributionCacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_STRATEGIES[strategy].maxAge * 1000,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
      }

      this.cache.set(key, entry)
      this.metrics.cacheSize += size

      // Save to localStorage
      await this.saveToStorage()

      logger.info(
        `💾 Georgian Distribution Browser Cache SET: ${key} (${size} bytes, TTL: ${this.CACHE_STRATEGIES[strategy].maxAge}s)`
      )

      this.metrics.hitRate++
      return true
    } catch (error) {
      logger.error('Georgian Distribution Browser Cache SET error:', error)
      this.metrics.missRate++
      return false
    }
  }

  /**
   * Get cache with Georgian Distribution specific handling
   */
  async get(key: string): Promise<any> {
    this.metrics.totalRequests++

    try {
      const entry = this.cache.get(key)

      if (!entry) {
        logger.info(`📦 Georgian Distribution Browser Cache MISS: ${key}`)
        this.metrics.missRate++
        return null
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        logger.info(`⏰ Georgian Distribution Browser Cache EXPIRED: ${key}`)
        await this.delete(key)
        this.metrics.missRate++
        return null
      }

      // Update access metrics
      entry.accessCount++
      entry.lastAccessed = Date.now()

      logger.info(
        `🎯 Georgian Distribution Browser Cache HIT: ${key} (accesses: ${entry.accessCount})`
      )

      // Handle stale-while-revalidate
      const strategy = this.getStrategyForKey(key)
      if (
        strategy?.staleWhileRevalidate &&
        Date.now() > entry.timestamp + strategy.maxAge * 1000 * 0.8
      ) {
        // Background revalidation
        this.backgroundRevalidate(key, entry.data)
      }

      this.metrics.hitRate++
      return entry.data
    } catch (error) {
      logger.error('Georgian Distribution Browser Cache GET error:', error)
      this.metrics.missRate++
      return null
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.metrics.cacheSize -= entry.size
        await this.saveToStorage()
        logger.info(`🗑️ Georgian Distribution Browser Cache DELETE: ${key}`)
        return true
      }
      return false
    } catch (error) {
      logger.error('Georgian Distribution Browser Cache DELETE error:', error)
      return false
    }
  }

  /**
   * Georgian Distribution System specific cache operations
   */
  async cacheOrderData(orderId: string, orderData: any): Promise<void> {
    await this.set(`order:${orderId}`, orderData, 'orders')
  }

  async getOrderData(orderId: string): Promise<any> {
    return await this.get(`order:${orderId}`)
  }

  async cacheProductData(productId: string, productData: any): Promise<void> {
    await this.set(`product:${productId}`, productData, 'products')
  }

  async getProductData(productId: string): Promise<any> {
    return await this.get(`product:${productId}`)
  }

  async cacheUserProfile(userId: string, profileData: any): Promise<void> {
    await this.set(`profile:${userId}`, profileData, 'profiles')
  }

  async getUserProfile(userId: string): Promise<any> {
    return await this.get(`profile:${userId}`)
  }

  async cacheSystemHealth(healthData: any): Promise<void> {
    await this.set('health:current', healthData, 'health')
  }

  async getSystemHealth(): Promise<any> {
    return await this.get('health:current')
  }

  async cacheAnalytics(analyticsData: any): Promise<void> {
    await this.set('analytics:dashboard', analyticsData, 'analytics')
  }

  async getAnalytics(): Promise<any> {
    return await this.get('analytics:dashboard')
  }

  /**
   * Georgian Distribution System cache invalidation
   */
  async invalidateOrderCache(orderId?: string, restaurantId?: string): Promise<void> {
    if (orderId) {
      await this.delete(`order:${orderId}`)
    }

    // Invalidate all orders if no specific ID
    if (!orderId) {
      const orderKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith('order:'))
      for (const key of orderKeys) {
        await this.delete(key)
      }
    }

    // Invalidate restaurant-specific cache
    if (restaurantId) {
      const restaurantKeys = Array.from(this.cache.keys()).filter((key) =>
        key.includes(`restaurant:${restaurantId}`)
      )
      for (const key of restaurantKeys) {
        await this.delete(key)
      }
    }

    // Invalidate dashboard analytics
    await this.delete('analytics:dashboard')
  }

  async invalidateProductCache(category?: string): Promise<void> {
    if (category) {
      const categoryKeys = Array.from(this.cache.keys()).filter((key) =>
        key.includes(`category:${category}`)
      )
      for (const key of categoryKeys) {
        await this.delete(key)
      }
    } else {
      // Invalidate all products
      const productKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith('product:'))
      for (const key of productKeys) {
        await this.delete(key)
      }
    }

    // Invalidate product catalog
    await this.delete('products:catalog')
  }

  /**
   * Cache warming for Georgian Distribution System
   */
  async warmCache(): Promise<void> {
    logger.info('🔥 Georgian Distribution Browser Cache Warming Started')

    try {
      // Pre-warm critical data
      const now = Date.now()

      // Warm system health
      await this.set('health:current', { status: 'ok', timestamp: now }, 'health')

      // Warm default analytics structure
      await this.set(
        'analytics:dashboard',
        {
          orders: { total: 0, pending: 0, completed: 0 },
          products: { total: 0, active: 0 },
          users: { total: 0, restaurants: 0, drivers: 0 },
        },
        'analytics'
      )

      logger.info('✅ Georgian Distribution Browser Cache Warming Completed')
    } catch (error) {
      logger.error('❌ Georgian Distribution Browser Cache Warming Failed:', error)
    }
  }

  /**
   * Get cache metrics for Georgian Distribution System
   */
  getMetrics(): CacheMetrics {
    // Recalculate rates
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = this.metrics.hitRate / this.metrics.totalRequests
      this.metrics.missRate = this.metrics.missRate / this.metrics.totalRequests
    }

    return { ...this.metrics }
  }

  /**
   * Get cache statistics
   */
  getStatistics() {
    const entries = Array.from(this.cache.values())

    return {
      totalEntries: entries.length,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      avgEntrySize:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + entry.size, 0) / entries.length
          : 0,
      oldestEntry:
        entries.length > 0
          ? entries.reduce(
              (oldest, entry) => (entry.timestamp < oldest.timestamp ? entry : oldest),
              entries[0]!
            )
          : null,
      mostAccessed:
        entries.length > 0
          ? entries.reduce(
              (most, entry) => (entry.accessCount > most.accessCount ? entry : most),
              entries[0]!
            )
          : null,
      cacheUtilization: (this.metrics.cacheSize / this.config.maxCacheSize) * 100,
    }
  }

  /**
   * Private methods
   */
  private getStrategyForKey(key: string): CacheStrategy | undefined {
    if (key.startsWith('order:')) return this.CACHE_STRATEGIES.orders
    if (key.startsWith('product:')) return this.CACHE_STRATEGIES.products
    if (key.startsWith('profile:')) return this.CACHE_STRATEGIES.profiles
    if (key.startsWith('health:')) return this.CACHE_STRATEGIES.health
    if (key.startsWith('analytics:')) return this.CACHE_STRATEGIES.analytics

    return this.config.cacheStrategies.api
  }

  private async backgroundRevalidate(key: string, cachedData: any): Promise<void> {
    // Trigger background revalidation (implement based on your API structure)
    logger.info(`🔄 Background revalidation for: ${key}`)

    // This would typically make a fetch request to refresh the data
    // For now, just log the revalidation
  }

  private async evictOldest(): Promise<void> {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed) // LRU

    // Remove 25% of oldest entries
    const toRemove = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      const item = entries[i]
      if (item) {
        const [key] = item
        await this.delete(key)
      }
    }

    logger.info(`🧹 Evicted ${toRemove} oldest entries from Georgian Distribution Browser Cache`)
  }

  private setupGarbageCollection(): void {
    // Run garbage collection every 5 minutes
    setInterval(
      () => {
        this.runGarbageCollection()
      },
      5 * 60 * 1000
    )
  }

  private async runGarbageCollection(): Promise<void> {
    const now = Date.now()
    const expiredKeys = Array.from(this.cache.keys()).filter((key) => {
      const entry = this.cache.get(key)
      return entry && now > entry.expiresAt
    })

    for (const key of expiredKeys) {
      await this.delete(key)
    }

    this.metrics.gcRuns++

    if (expiredKeys.length > 0) {
      logger.info(
        `🧹 Georgian Distribution Browser Cache GC: Removed ${expiredKeys.length} expired entries`
      )
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('gds-browser-cache')
      if (stored) {
        const data = JSON.parse(stored)

        for (const [key, entry] of Object.entries(data)) {
          const typedEntry = entry as GeorgianDistributionCacheEntry

          // Only restore non-expired entries
          if (Date.now() < typedEntry.expiresAt) {
            this.cache.set(key, typedEntry)
            this.metrics.cacheSize += typedEntry.size
          }
        }

        logger.info(
          `📦 Georgian Distribution Browser Cache: Restored ${this.cache.size} entries from storage`
        )
      }
    } catch (error) {
      logger.warn('⚠️ Failed to load Georgian Distribution Browser Cache from storage', { error })
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data: Record<string, GeorgianDistributionCacheEntry> = {}

      // Only save non-expired entries
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now < entry.expiresAt) {
          data[key] = entry
        }
      }

      const serialized = JSON.stringify(data)
      localStorage.setItem('gds-browser-cache', serialized)
    } catch (error) {
      logger.warn('⚠️ Failed to save Georgian Distribution Browser Cache to storage', { error })
    }
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.info('✅ Georgian Distribution Service Worker registered')
        })
        .catch((error) => {
          logger.warn('⚠️ Service Worker registration failed:', error)
        })
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.metrics.cacheSize = 0
    localStorage.removeItem('gds-browser-cache')
    logger.info('🧽 Georgian Distribution Browser Cache Cleared')
  }
}

// Export singleton instance
export const georgianDistributionBrowserCache = new GeorgianDistributionBrowserCache()

// Export convenience functions
export const gdsBrowserCache = {
  set: (key: string, data: any, strategy?: any) =>
    georgianDistributionBrowserCache.set(key, data, strategy),
  get: (key: string) => georgianDistributionBrowserCache.get(key),
  delete: (key: string) => georgianDistributionBrowserCache.delete(key),
  invalidateOrder: (orderId?: string, restaurantId?: string) =>
    georgianDistributionBrowserCache.invalidateOrderCache(orderId, restaurantId),
  invalidateProduct: (category?: string) =>
    georgianDistributionBrowserCache.invalidateProductCache(category),
  warmCache: () => georgianDistributionBrowserCache.warmCache(),
  getMetrics: () => georgianDistributionBrowserCache.getMetrics(),
  getStatistics: () => georgianDistributionBrowserCache.getStatistics(),
  clear: () => georgianDistributionBrowserCache.clear(),
}

export default GeorgianDistributionBrowserCache
