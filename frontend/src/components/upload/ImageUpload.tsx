'use client'
import { logger } from '@/lib/logger'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useStorage, FileValidator, STORAGE_BUCKETS } from '@/lib/supabase/storage'

interface ImageUploadProps {
  bucket: string
  path: string
  onUpload?: (file: { url: string; path: string }) => void
  onError?: (error: string) => void
  maxSize?: number
  allowedTypes?: string[]
  className?: string
  accept?: string
  children?: React.ReactNode
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function ImageUpload({
  bucket,
  path,
  onUpload,
  onError,
  maxSize,
  allowedTypes,
  className,
  accept = 'image/*',
  children,
}: ImageUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const storage = useStorage()

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      // Create upload entries
      const newUploads: UploadProgress[] = fileArray.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const,
      }))

      setUploads((prev) => [...prev, ...newUploads])

      // Process uploads
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        if (!file) continue

        const uploadIndex = newUploads.findIndex((u) => u.file === file)

        try {
          // Validate file
          const validation =
            bucket === STORAGE_BUCKETS.PRODUCT_IMAGES
              ? FileValidator.validateImage(file, 'product')
              : bucket === STORAGE_BUCKETS.AVATARS
                ? FileValidator.validateImage(file, 'avatar')
                : bucket === STORAGE_BUCKETS.RESTAURANT_LOGOS
                  ? FileValidator.validateImage(file, 'logo')
                  : FileValidator.validateImage(file, 'product')

          if (!validation.valid) {
            throw new Error(validation.error || 'File validation failed')
          }

          // Generate unique path
          const fileName = `${Date.now()}-${file.name}`
          const fullPath = `${path}/${fileName}`

          // Simulate progress (in a real implementation, you'd track actual upload progress)
          const progressInterval = setInterval(() => {
            setUploads((prev) =>
              prev.map((upload, index) =>
                upload.file === file && upload.status === 'uploading' && upload.progress < 90
                  ? { ...upload, progress: upload.progress + 10 }
                  : upload
              )
            )
          }, 200)

          // Upload file
          const result = await storage.uploadFile(bucket, file, fullPath)

          clearInterval(progressInterval)

          if (result.error) {
            throw result.error
          }

          // Update upload status
          setUploads((prev) =>
            prev.map((upload, index) =>
              upload.file === file
                ? { ...upload, status: 'success' as const, progress: 100 }
                : upload
            )
          )

          // Call success callback
          if (onUpload && result.data) {
            onUpload({
              url: result.data.publicUrl,
              path: fullPath,
            })
          }
        } catch (error) {
          logger.error('Upload error:', error)

          // Update upload status with error
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          setUploads((prev) =>
            prev.map((upload, index) =>
              upload.file === file
                ? { ...upload, status: 'error' as const, error: errorMessage }
                : upload
            )
          )

          // Call error callback
          if (onError) {
            onError(errorMessage)
          }
        }
      }
    },
    [bucket, path, storage, onUpload, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const removeUpload = useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'success':
        return <div className="w-4 h-4 rounded-full bg-green-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <Upload className="w-8 h-8 text-gray-400 mb-4" />

          {children || (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop images here, or{' '}
                <label className="text-blue-600 hover:text-blue-500 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP up to {Math.round((maxSize || 10 * 1024 * 1024) / (1024 * 1024))}MB
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploads</h4>
          {uploads.map((upload, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                  <div className="mt-1">
                    <Progress value={upload.progress} className="h-2" />
                  </div>
                  {upload.error && <p className="text-xs text-red-600 mt-1">{upload.error}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(upload.status)}
                  <Button variant="ghost" size="sm" onClick={() => removeUpload(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Specialized components for Georgian Distribution System

export function ProductImageUpload({
  productId,
  onUpload,
  onError,
}: {
  productId: string
  onUpload?: (file: { url: string; path: string }) => void
  onError?: (error: string) => void
}) {
  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.PRODUCT_IMAGES}
      path={`products/${productId}`}
      onUpload={onUpload}
      onError={onError}
      accept="image/*"
      maxSize={10 * 1024 * 1024} // 10MB
    >
      <div className="text-center">
        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload product image</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 10MB</p>
      </div>
    </ImageUpload>
  )
}

export function UserAvatarUpload({
  userId,
  onUpload,
  onError,
}: {
  userId: string
  onUpload?: (file: { url: string; path: string }) => void
  onError?: (error: string) => void
}) {
  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.AVATARS}
      path={userId}
      onUpload={onUpload}
      onError={onError}
      accept="image/*"
      maxSize={5 * 1024 * 1024} // 5MB
    >
      <div className="text-center">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload avatar</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
      </div>
    </ImageUpload>
  )
}

export function RestaurantLogoUpload({
  restaurantId,
  onUpload,
  onError,
}: {
  restaurantId: string
  onUpload?: (file: { url: string; path: string }) => void
  onError?: (error: string) => void
}) {
  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.RESTAURANT_LOGOS}
      path={restaurantId}
      onUpload={onUpload}
      onError={onError}
      accept="image/*,.svg"
      maxSize={5 * 1024 * 1024} // 5MB
    >
      <div className="text-center">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload restaurant logo</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP, SVG up to 5MB</p>
      </div>
    </ImageUpload>
  )
}

export function DeliveryProofUpload({
  orderId,
  onUpload,
  onError,
}: {
  orderId: string
  onUpload?: (file: { url: string; path: string }) => void
  onError?: (error: string) => void
}) {
  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.DELIVERY_PROOFS}
      path={`orders/${orderId}`}
      onUpload={onUpload}
      onError={onError}
      accept="image/*"
      maxSize={15 * 1024 * 1024} // 15MB
    >
      <div className="text-center">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload delivery proof</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 15MB</p>
      </div>
    </ImageUpload>
  )
}
