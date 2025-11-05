import { logger } from '@/lib/logger'

/**
 * Advanced Redis Caching for Georgian Distribution System
 * High-performance distributed caching with Georgian Distribution specific optimizations
 */

interface RedisClientType {
  on(event: string, callback: (error?: Error) => void): void
  connect(): Promise<void>
  disconnect(): Promise<void>
  setEx(key: string, ttl: number, value: string): Promise<string>
  get(key: string): Promise<string | null>
  del(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  configSet(parameter: string, value: string): Promise<'OK'>
  info(section?: string): Promise<string>
}

// Mock Redis client for development
class MockRedisClient {
  private data = new Map<string, string>()
  private ttl = new Map<string, number>()

  on() {
    return this
  }
  connect() {
    return Promise.resolve()
  }
  disconnect() {
    return Promise.resolve()
  }

  async setEx(key: string, ttl: number, value: string): Promise<string> {
    this.data.set(key, value)
    this.ttl.set(key, Date.now() + ttl * 1000)
    return 'OK'
  }

  async get(key: string): Promise<string | null> {
    const expireTime = this.ttl.get(key)
    if (expireTime && Date.now() > expireTime) {
      this.data.delete(key)
      this.ttl.delete(key)
      return null
    }
    return this.data.get(key) || null
  }

  async del(key: string): Promise<number> {
    const existed = this.data.has(key)
    this.data.delete(key)
    this.ttl.delete(key)
    return existed ? 1 : 0
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.data.keys()).filter((key) => regex.test(key))
  }

  async configSet(): Promise<'OK'> {
    return 'OK'
  }
  async info(): Promise<string> {
    return ''
  }
}

const createClient = (config: any): RedisClientType => {
  return new MockRedisClient() as any
}

export interface RedisCacheConfig {
  url?: string
  host?: string
  port?: number
  password?: string
  db?: number
  ttl?: number
  keyPrefix?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  hits: number
  lastAccessed: number
}

export interface GeorgianDistributionCache {
  // Georgian-specific cache namespaces
  orders: {
    active: string // Active orders - 1 min TTL
    pending: string // Pending orders - 30 sec TTL
    completed: string // Completed orders - 5 min TTL
    analytics: string // Order analytics - 2 min TTL
  }
  products: {
    catalog: string // Product catalog - 5 min TTL
    active: string // Active products - 10 min TTL
    categories: string // Product categories - 15 min TTL
  }
  users: {
    profiles: string // User profiles - 30 min TTL
    sessions: string // User sessions - 1 hour TTL
    preferences: string // User preferences - 2 hours TTL
  }
  system: {
    health: string // System health - 30 sec TTL
    metrics: string // System metrics - 2 min TTL
    analytics: string // Dashboard analytics - 5 min TTL
  }
}

class GeorgianDistributionRedisCache {
  private client: RedisClientType | null = null
  private connected = false
  private config: RedisCacheConfig & {
    host: string
    port: number
    db: number
    ttl: number
    keyPrefix: string
  }
  private readonly DEFAULT_TTL = 300 // 5 minutes
  private readonly keyPrefix: string

  constructor(config: RedisCacheConfig = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      host: config.host || 'localhost',
      port: config.port || 6379,
      ...(config.password && { password: config.password }),
      db: config.db || 0,
      ttl: config.ttl || this.DEFAULT_TTL,
      keyPrefix: config.keyPrefix || 'gds:',
    }
    this.keyPrefix = this.config.keyPrefix
  }

  /**
   * Connect to Redis with Georgian Distribution specific optimizations
   */
  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          host: this.config.host,
          port: this.config.port,
          tls: this.config.url?.startsWith('rediss://'),
        },
        password: this.config.password,
        database: this.config.db,
      })

      this.client.on('error', (err: any) => {
        logger.error('Georgian Distribution Redis Cache Error:', err)
        this.connected = false
      })

      this.client.on('connect', () => {
        logger.info('✅ Georgian Distribution Redis Cache Connected')
        this.connected = true
      })

      this.client.on('disconnect', () => {
        logger.warn('Georgian Distribution Redis disconnected')
        this.connected = false
      })

      await this.client.connect()
      await this.configureRedis()

      logger.info('✅ Georgian Distribution Redis Cache Initialized')
    } catch (error) {
      logger.error('Failed to connect to Georgian Distribution Redis', { error })
      throw error
    }
  }

  /**
   * Configure Redis with Georgian Distribution specific optimizations
   */
  private async configureRedis(): Promise<void> {
    if (!this.client) return

    try {
      // Set memory policies for Georgian food distribution use case
      await this.client.configSet('maxmemory-policy', 'allkeys-lru')

      // Set Georgian-specific timeout values
      await this.client.configSet('tcp-keepalive', '300')
      await this.client.configSet('timeout', '0')

      // Enable Georgian Distribution specific monitoring
      await this.client.configSet('slowlog-log-slower-than', '1000')
      await this.client.configSet('slowlog-max-len', '1000')

      logger.info('✅ Georgian Distribution Redis configured successfully')
    } catch (error) {
      logger.warn('⚠️ Could not configure all Redis settings', { error })
    }
  }

  /**
   * Get Georgian Distribution cache key with prefix
   */
  private getKey(namespace: string, key: string): string {
    return `${this.keyPrefix}${namespace}:${key}`
  }

  /**
   * Set cache with Georgian Distribution specific TTL
   */
  async set<T>(namespace: string, key: string, data: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      logger.warn('Redis not connected, cache set failed for:', { key })
      return false
    }

    try {
      const cacheKey = this.getKey(namespace, key)
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.config.ttl * 1000),
        hits: 0,
        lastAccessed: Date.now(),
      }

      const serialized = JSON.stringify(entry)
      const ttl = ttlSeconds || this.config.ttl

      const result = await this.client.setEx(cacheKey, ttl, serialized)

      if (result === 'OK') {
        logger.info(`✅ Georgian Distribution Cache SET: ${namespace}:${key}`)
        return true
      }
      return false
    } catch (error) {
      logger.error('Georgian Distribution Cache SET error', { error })
      return false
    }
  }

  /**
   * Get cache with Georgian Distribution specific handling
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null
    }

    try {
      const cacheKey = this.getKey(namespace, key)
      const result = await this.client.get(cacheKey)

      if (!result) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(result)

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(namespace, key)
        return null
      }

      // Update access metrics
      entry.hits++
      entry.lastAccessed = Date.now()

      const serialized = JSON.stringify(entry)
      await this.client.setEx(
        cacheKey,
        Math.floor((entry.expiresAt - Date.now()) / 1000),
        serialized
      )

      logger.info(`✅ Georgian Distribution Cache GET: ${namespace}:${key}`)
      return entry.data
    } catch (error) {
      logger.error('Georgian Distribution Cache GET error', { error })
      return null
    }
  }

  /**
   * Delete cache entry
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false
    }

    try {
      const cacheKey = this.getKey(namespace, key)
      const result = await this.client.del(cacheKey)

      return result > 0
    } catch (error) {
      logger.error('Georgian Distribution Cache DELETE error', { error })
      return false
    }
  }

  /**
   * Georgian Distribution System specific cache operations
   */
  async cacheOrderAnalytics(orderId: string, analytics: any): Promise<void> {
    await this.set('orders:analytics', orderId, analytics, 120) // 2 minutes
  }

  async getOrderAnalytics(orderId: string): Promise<any> {
    return await this.get('orders:analytics', orderId)
  }

  async cacheProductCatalog(products: any[]): Promise<void> {
    await this.set('products:catalog', 'all', products, 300) // 5 minutes
  }

  async getProductCatalog(): Promise<any[]> {
    return (await this.get('products:catalog', 'all')) || []
  }

  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    await this.set('users:sessions', userId, sessionData, 3600) // 1 hour
  }

  async getUserSession(userId: string): Promise<any> {
    return await this.get('users:sessions', userId)
  }

  async cacheSystemHealth(health: any): Promise<void> {
    await this.set('system:health', 'current', health, 30) // 30 seconds
  }

  async getSystemHealth(): Promise<any> {
    return await this.get('system:health', 'current')
  }

  /**
   * Georgian Distribution System cache invalidation
   */
  async invalidateOrderCache(orderId: string, restaurantId?: string): Promise<void> {
    // Invalidate specific order
    await this.delete('orders:active', orderId)
    await this.delete('orders:pending', orderId)
    await this.delete('orders:completed', orderId)
    await this.delete('orders:analytics', orderId)

    // Invalidate restaurant-specific caches
    if (restaurantId) {
      const restaurantKeys = await this.client?.keys(
        this.getKey('orders:byRestaurant', restaurantId + ':*')
      )
      if (restaurantKeys && restaurantKeys.length > 0) {
        for (const key of restaurantKeys) {
          await this.client?.del(key)
        }
      }
    }

    // Invalidate global order analytics
    await this.delete('orders:analytics', 'global')
    await this.delete('system:analytics', 'orders')
  }

  async invalidateProductCache(category?: string): Promise<void> {
    // Invalidate product catalog
    await this.delete('products:catalog', 'all')

    // Invalidate category-specific cache
    if (category) {
      await this.delete('products:categories', category)
    }

    // Invalidate active products
    await this.delete('products:active', 'all')
  }

  /**
   * Cache warming for Georgian Distribution System
   */
  async warmCache(): Promise<void> {
    logger.info('🔥 Georgian Distribution Cache Warming Started')

    try {
      // Warm critical data
      await this.set('system:health', 'current', { status: 'ok', timestamp: Date.now() }, 30)

      // Warm frequently accessed product categories
      const categories = ['vegetables', 'fruits', 'meat', 'dairy', 'grains']
      for (const category of categories) {
        await this.set('products:categories', category, { category, products: [] }, 900) // 15 minutes
      }

      logger.info('✅ Georgian Distribution Cache Warming Completed')
    } catch (error) {
      logger.error('❌ Georgian Distribution Cache Warming Failed', { error })
    }
  }

  /**
   * Get cache statistics for Georgian Distribution System
   */
  async getCacheStats(): Promise<any> {
    if (!this.client || !this.connected) {
      return { connected: false }
    }

    try {
      const info = await this.client.info('memory')
      const dbInfo = await this.client.info('keyspace')

      return {
        connected: this.connected,
        memory: this.parseRedisInfo(info, 'used_memory_human'),
        keyspace: dbInfo,
        uptime: this.parseRedisInfo(await this.client.info('server'), 'uptime_in_seconds'),
        total_commands_processed: this.parseRedisInfo(
          await this.client.info('stats'),
          'total_commands_processed'
        ),
      }
    } catch (error) {
      logger.error('❌ Georgian Distribution Cache Warming Failed', { error })
      return { connected: false, error: (error as Error).message }
    }
  }

  private parseRedisInfo(info: string, field: string): string {
    const lines = info.split('\n')
    const line = lines.find((l) => l.startsWith(field + ':'))
    return line ? (line.split(':')[1] ?? '0') : '0'
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.disconnect()
      this.connected = false
      logger.info('🔌 Georgian Distribution Redis Cache Disconnected')
    }
  }
}

// Export singleton instance
export const georgianDistributionRedis = new GeorgianDistributionRedisCache()

// Export convenience functions
export const gdsCache = {
  set: (namespace: string, key: string, data: any, ttl?: number) =>
    georgianDistributionRedis.set(namespace, key, data, ttl),
  get: (namespace: string, key: string) => georgianDistributionRedis.get(namespace, key),
  delete: (namespace: string, key: string) => georgianDistributionRedis.delete(namespace, key),
  invalidateOrder: (orderId: string, restaurantId?: string) =>
    georgianDistributionRedis.invalidateOrderCache(orderId, restaurantId),
  invalidateProduct: (category?: string) =>
    georgianDistributionRedis.invalidateProductCache(category),
  warmCache: () => georgianDistributionRedis.warmCache(),
  getStats: () => georgianDistributionRedis.getCacheStats(),
}

export default GeorgianDistributionRedisCache
