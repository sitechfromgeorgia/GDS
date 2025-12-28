import { createClient } from 'redis'
import { logger } from '@/lib/logger'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

const redis = createClient({
  url: redisUrl,
})

redis.on('error', (err) => logger.error('Redis Client Error', err))

// Connect if not already connected (and not in build time)
if (process.env.NODE_ENV !== 'test' && typeof window === 'undefined') {
  redis.connect().catch((err) => logger.error('Redis connection error', err))
}

export default redis

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error)
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } catch (error) {
      logger.error(`Cache invalidate pattern error for ${pattern}:`, error)
    }
  }
}
