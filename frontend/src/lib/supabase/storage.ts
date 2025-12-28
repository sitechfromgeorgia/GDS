import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database'

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Storage bucket configurations
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PRODUCT_IMAGES: 'product-images',
  DOCUMENTS: 'documents',
  RESTAURANT_LOGOS: 'restaurant-logos',
  DELIVERY_PROOFS: 'delivery-proofs',
  TEMP_UPLOADS: 'temp-uploads',
} as const

// File type configurations
export const FILE_TYPES = {
  IMAGES: {
    allowed: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'] as const,
    maxSize: {
      avatar: 5 * 1024 * 1024, // 5MB
      product: 10 * 1024 * 1024, // 10MB
      logo: 5 * 1024 * 1024, // 5MB
      delivery: 15 * 1024 * 1024, // 15MB
    },
  },
  DOCUMENTS: {
    allowed: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ] as const,
    maxSize: 25 * 1024 * 1024, // 25MB
  },
} as const

// File validation utilities
export class FileValidator {
  static validateImage(file: File, bucket: string): { valid: boolean; error?: string } {
    if (!FILE_TYPES.IMAGES.allowed.includes(file.type as any)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${FILE_TYPES.IMAGES.allowed.join(', ')}`,
      }
    }

    const maxSize =
      FILE_TYPES.IMAGES.maxSize[bucket as keyof typeof FILE_TYPES.IMAGES.maxSize] ||
      FILE_TYPES.IMAGES.maxSize.product

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
      }
    }

    return { valid: true }
  }

  static validateDocument(file: File): { valid: boolean; error?: string } {
    if (!FILE_TYPES.DOCUMENTS.allowed.includes(file.type as any)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${FILE_TYPES.DOCUMENTS.allowed.join(', ')}`,
      }
    }

    if (file.size > FILE_TYPES.DOCUMENTS.maxSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${FILE_TYPES.DOCUMENTS.maxSize / (1024 * 1024)}MB`,
      }
    }

    return { valid: true }
  }
}

// Storage utilities
export class StorageManager {
  protected supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Generic file upload with validation
  async uploadFile(
    bucket: string,
    file: File,
    path: string,
    options?: {
      cacheControl?: string
      upsert?: boolean
      contentType?: string
    }
  ): Promise<{ data?: any; error?: any }> {
    try {
      // Validate file based on bucket
      const validation = this.validateFileForBucket(file, bucket)
      if (!validation.valid) {
        return { error: new Error(validation.error) }
      }

      // Check if supabase client is properly initialized
      if (!this.supabase?.storage) {
        return { error: new Error('Storage client not initialized') }
      }

      const storageClient = this.supabase.storage.from(bucket)
      if (!storageClient) {
        return { error: new Error('Storage bucket not available') }
      }

      const uploadResult = await storageClient.upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
        contentType: options?.contentType || file.type,
      })

      if (!uploadResult) {
        return { error: new Error('Upload returned no result') }
      }

      if (uploadResult.error) throw uploadResult.error

      // Get public URL if bucket is public
      const urlResult = storageClient.getPublicUrl(path)
      const publicUrl = urlResult?.data?.publicUrl

      return { data: { ...(uploadResult.data || {}), publicUrl } }
    } catch (error) {
      logger.error('Storage upload error:', error)
      return { error }
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    bucket: string,
    files: File[],
    basePath: string
  ): Promise<{ data?: any[]; error?: any }> {
    try {
      const uploadPromises = files.map((file, index) => {
        const path = `${basePath}/${Date.now()}-${index}-${file.name}`
        return this.uploadFile(bucket, file, path)
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter((r) => !r.error).map((r) => r.data)
      const errors = results.filter((r) => r.error).map((r) => r.error)

      if (errors.length > 0) {
        logger.warn('Some uploads failed:', errors)
      }

      return { data: successfulUploads, error: errors.length > 0 ? errors : undefined }
    } catch (error) {
      logger.error('Multiple upload error:', error)
      return { error }
    }
  }

  // Delete file
  async deleteFile(bucket: string, path: string): Promise<{ error?: any }> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path])

      if (error) throw error

      return {}
    } catch (error) {
      logger.error('Storage delete error:', error)
      return { error }
    }
  }

  // Get file URL
  getFileUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(bucket).getPublicUrl(path)

    return publicUrl
  }

  // List files in bucket/path
  async listFiles(
    bucket: string,
    path?: string,
    options?: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    }
  ): Promise<{ data?: any[]; error?: any }> {
    try {
      const { data, error } = await this.supabase.storage.from(bucket).list(path || '', {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: options?.sortBy || { column: 'name', order: 'asc' },
      })

      if (error) throw error

      return { data }
    } catch (error) {
      logger.error('Storage list error:', error)
      return { error }
    }
  }

  // Get file metadata
  async getFileMetadata(bucket: string, path: string): Promise<{ data?: any; error?: any }> {
    try {
      const { data, error } = await this.supabase.storage.from(bucket).list('', {
        search: path,
      })

      if (error) throw error

      return { data: data?.[0] }
    } catch (error) {
      logger.error('Storage metadata error:', error)
      return { error }
    }
  }

  // Private helper: validate file for bucket
  private validateFileForBucket(file: File, bucket: string): { valid: boolean; error?: string } {
    if (
      [
        STORAGE_BUCKETS.AVATARS,
        STORAGE_BUCKETS.PRODUCT_IMAGES,
        STORAGE_BUCKETS.RESTAURANT_LOGOS,
        STORAGE_BUCKETS.DELIVERY_PROOFS,
      ].includes(bucket as any)
    ) {
      return FileValidator.validateImage(
        file,
        bucket.replace('-', '') as keyof typeof FILE_TYPES.IMAGES.maxSize
      )
    }

    if (bucket === STORAGE_BUCKETS.DOCUMENTS) {
      return FileValidator.validateDocument(file)
    }

    return { valid: true }
  }
}

// Specialized upload methods for Georgian Distribution System
export class GeorgianDistributionStorage extends StorageManager {
  // Upload user avatar
  async uploadUserAvatar(userId: string, file: File): Promise<{ data?: any; error?: any }> {
    const path = `${userId}/avatar.${file.name.split('.').pop()}`
    return this.uploadFile(STORAGE_BUCKETS.AVATARS, file, path, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
    })
  }

  // Upload product image
  async uploadProductImage(productId: string, file: File): Promise<{ data?: any; error?: any }> {
    const path = `${productId}/image.${file.name.split('.').pop()}`
    return this.uploadFile(STORAGE_BUCKETS.PRODUCT_IMAGES, file, path, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
    })
  }

  // Upload restaurant logo
  async uploadRestaurantLogo(
    restaurantId: string,
    file: File
  ): Promise<{ data?: any; error?: any }> {
    const path = `${restaurantId}/logo.${file.name.split('.').pop()}`
    return this.uploadFile(STORAGE_BUCKETS.RESTAURANT_LOGOS, file, path, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
    })
  }

  // Upload delivery proof
  async uploadDeliveryProof(orderId: string, file: File): Promise<{ data?: any; error?: any }> {
    const timestamp = Date.now()
    const path = `${orderId}/proof-${timestamp}.${file.name.split('.').pop()}`
    return this.uploadFile(STORAGE_BUCKETS.DELIVERY_PROOFS, file, path, {
      cacheControl: '2592000', // 30 days cache
    })
  }

  // Upload business document
  async uploadBusinessDocument(userId: string, file: File): Promise<{ data?: any; error?: any }> {
    const timestamp = Date.now()
    const path = `${userId}/documents/${timestamp}-${file.name}`
    return this.uploadFile(STORAGE_BUCKETS.DOCUMENTS, file, path, {
      cacheControl: '86400', // 1 day cache
    })
  }

  // Upload temporary file (auto-cleanup)
  async uploadTemporaryFile(file: File, userId: string): Promise<{ data?: any; error?: any }> {
    const timestamp = Date.now()
    const path = `${userId}/temp/${timestamp}-${file.name}`
    return this.uploadFile(STORAGE_BUCKETS.TEMP_UPLOADS, file, path)
  }

  // Get bucket statistics
  async getBucketStatistics(): Promise<{ data?: any; error?: any }> {
    try {
      const { data, error } = await (this.supabase as any).rpc('storage.get_bucket_stats')

      if (error) throw error
      return { data }
    } catch (error) {
      logger.error('Bucket statistics error:', error)
      return { error }
    }
  }

  // Clean up temporary files
  async cleanupTemporaryFiles(): Promise<{ error?: any }> {
    try {
      const { error } = await (this.supabase as any).rpc('storage.cleanup_temp_files')

      if (error) throw error
      return {}
    } catch (error) {
      logger.error('Cleanup error:', error)
      return { error }
    }
  }
}

// Client-side hook for storage operations
export function useStorage() {
  return new GeorgianDistributionStorage()
}

// Export singleton instance
export const storage = new GeorgianDistributionStorage()
