import { logger } from '@/lib/logger'
import type {
  AdminOperationType,
  AdminValidationError,
  AdminValidationResult,
  AdminBatchOperation,
  AuditLogEntry,
  BulkPriceUpdate,
  AdminAnalytics,
} from '@/types/admin'

// Admin validation utilities
class AdminValidator {
  static validateEmail(email: string): AdminValidationResult {
    const errors: AdminValidationError[] = []

    if (!email || typeof email !== 'string') {
      errors.push({
        field: 'email',
        code: 'required',
        message: 'Email is required',
        severity: 'error',
      })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        code: 'invalid_format',
        message: 'Email format is invalid',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }

  static validateUserData(data: {
    email: string
    full_name: string
    role: string
    phone?: string
  }): AdminValidationResult {
    const errors: AdminValidationError[] = []
    const warnings: AdminValidationError[] = []

    // Email validation
    const emailValidation = this.validateEmail(data.email)
    errors.push(...emailValidation.errors)

    // Full name validation
    if (!data.full_name || data.full_name.trim().length === 0) {
      errors.push({
        field: 'full_name',
        code: 'required',
        message: 'Full name is required',
        severity: 'error',
      })
    } else if (data.full_name.trim().length < 2) {
      errors.push({
        field: 'full_name',
        code: 'too_short',
        message: 'Full name must be at least 2 characters',
        severity: 'error',
      })
    }

    // Role validation
    if (!data.role || !['admin', 'restaurant', 'driver', 'demo'].includes(data.role)) {
      errors.push({
        field: 'role',
        code: 'invalid',
        message: 'Role must be admin, restaurant, driver, or demo',
        severity: 'error',
      })
    }

    // Phone validation (optional but if provided should be valid)
    if (data.phone) {
      const georgianPhoneRegex = /^(\+995|995|0)?[0-9]{9}$/
      if (!georgianPhoneRegex.test(data.phone.replace(/\s/g, ''))) {
        warnings.push({
          field: 'phone',
          code: 'format_warning',
          message: 'Georgian phone format recommended (e.g., +995555123456)',
          severity: 'warning',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateProductData(data: {
    name: string
    category: string
    unit: string
    price: number
  }): AdminValidationResult {
    const errors: AdminValidationError[] = []

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        code: 'required',
        message: 'Product name is required',
        severity: 'error',
      })
    }

    // Category validation
    if (!data.category || data.category.trim().length === 0) {
      errors.push({
        field: 'category',
        code: 'required',
        message: 'Product category is required',
        severity: 'error',
      })
    }

    // Unit validation
    if (!data.unit || data.unit.trim().length === 0) {
      errors.push({
        field: 'unit',
        code: 'required',
        message: 'Product unit is required',
        severity: 'error',
      })
    }

    // Price validation
    if (typeof data.price !== 'number' || data.price < 0) {
      errors.push({
        field: 'price',
        code: 'invalid',
        message: 'Price must be a positive number',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }

  static validateBulkPriceUpdates(updates: BulkPriceUpdate[]): AdminValidationResult {
    const errors: AdminValidationError[] = []

    if (!Array.isArray(updates) || updates.length === 0) {
      errors.push({
        field: 'updates',
        code: 'required',
        message: 'Price updates array is required',
        severity: 'error',
      })
      return {
        isValid: false,
        errors,
        warnings: [],
      }
    }

    updates.forEach((update, index) => {
      if (!update.id) {
        errors.push({
          field: `updates[${index}].id`,
          code: 'required',
          message: 'Product ID is required for each update',
          severity: 'error',
        })
      }

      if (typeof update.price !== 'number' || update.price < 0) {
        errors.push({
          field: `updates[${index}].price`,
          code: 'invalid',
          message: 'Price must be a positive number',
          severity: 'error',
        })
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }
}

// Admin audit logging utilities
class AdminAuditLogger {
  private static logEntries: AuditLogEntry[] = []

  static log(
    action: AdminOperationType,
    resource: string,
    resourceId: string | null,
    performedBy: string,
    details: Record<string, any> = {}
  ): void {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      resource,
      resource_id: resourceId || undefined,
      performed_by: performedBy,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        ip_address: 'server', // Would be populated in real implementation
      },
      created_at: new Date().toISOString(),
    }

    this.logEntries.push(entry)

    // In production, this would send to a logging service
    logger.info('[ADMIN AUDIT]', entry)
  }

  static getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logEntries
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  static getLogsByAction(action: AdminOperationType): AuditLogEntry[] {
    return this.logEntries.filter((entry) => entry.action === action)
  }

  static getLogsByResource(resource: string): AuditLogEntry[] {
    return this.logEntries.filter((entry) => entry.resource === resource)
  }

  static clearLogs(): void {
    this.logEntries = []
  }
}

// Admin batch operation utilities
class AdminBatchProcessor {
  private static activeBatches: Map<string, AdminBatchOperation> = new Map()

  static createBatch(
    type: AdminOperationType,
    totalItems: number,
    details: Record<string, any> = {}
  ): AdminBatchOperation {
    const batch: AdminBatchOperation = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      total_items: totalItems,
      processed_items: 0,
      success_count: 0,
      error_count: 0,
      created_at: new Date().toISOString(),
    }

    this.activeBatches.set(batch.id, batch)
    return batch
  }

  static updateBatchProgress(
    batchId: string,
    processedItems: number,
    successCount: number,
    errors?: Array<{ item_id: string; error: string }>
  ): AdminBatchOperation | null {
    const batch = this.activeBatches.get(batchId)
    if (!batch) return null

    batch.processed_items = processedItems
    batch.success_count = successCount
    batch.error_count = processedItems - successCount

    if (errors && errors.length > 0) {
      batch.errors = errors
    }

    // Auto-complete if all items processed
    if (batch.processed_items >= batch.total_items) {
      batch.status = batch.error_count > 0 ? 'failed' : 'completed'
      batch.completed_at = new Date().toISOString()
    }

    this.activeBatches.set(batchId, batch)
    return batch
  }

  static completeBatch(
    batchId: string,
    status: 'completed' | 'failed'
  ): AdminBatchOperation | null {
    const batch = this.activeBatches.get(batchId)
    if (!batch) return null

    batch.status = status
    batch.completed_at = new Date().toISOString()

    this.activeBatches.set(batchId, batch)
    return batch
  }

  static getBatch(batchId: string): AdminBatchOperation | null {
    return this.activeBatches.get(batchId) || null
  }

  static getActiveBatches(): AdminBatchOperation[] {
    return Array.from(this.activeBatches.values()).filter(
      (batch) => batch.status === 'pending' || batch.status === 'processing'
    )
  }

  static getAllBatches(): AdminBatchOperation[] {
    return Array.from(this.activeBatches.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  static cleanupCompletedBatches(olderThanHours: number = 24): void {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours)

    for (const [batchId, batch] of this.activeBatches.entries()) {
      if (batch.completed_at && new Date(batch.completed_at) < cutoffTime) {
        this.activeBatches.delete(batchId)
      }
    }
  }

  static clear(): void {
    this.activeBatches.clear()
  }
}

// Admin data processing utilities
class AdminDataProcessor {
  static formatCurrency(amount: number, currency: string = 'GEL'): string {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  static formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('ka-GE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      case 'time':
        return dateObj.toLocaleTimeString('ka-GE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      default:
        return dateObj.toLocaleDateString('ka-GE')
    }
  }

  static generateAnalyticsReport(analytics: AdminAnalytics): string {
    const report = `
# Georgian Distribution System - Analytics Report

Generated: ${new Date().toLocaleString('ka-GE')}

## Summary
- **Total Orders**: ${analytics.totalOrders}
- **Total Revenue**: ${this.formatCurrency(analytics.totalRevenue)}
- **Average Order Value**: ${this.formatCurrency(analytics.averageOrderValue)}

## Orders by Status
${Object.entries(analytics.ordersByStatus)
  .map(([status, count]) => `- **${status}**: ${count}`)
  .join('\n')}

## Revenue by Day
${Object.entries(analytics.revenueByDay)
  .map(([date, revenue]) => `- **${date}**: ${this.formatCurrency(revenue)}`)
  .join('\n')}

## Top Products
${analytics.topProducts
  .map(
    (product) => `- **${product.rank}. ${product.name}**: ${this.formatCurrency(product.revenue)}`
  )
  .join('\n')}
`

    return report
  }

  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  static formatPercentage(percentage: number, decimals: number = 1): string {
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(decimals)}%`
  }

  static validateCsvHeaders(headers: string[], requiredHeaders: string[]): AdminValidationResult {
    const errors: AdminValidationError[] = []

    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))

    if (missingHeaders.length > 0) {
      errors.push({
        field: 'csv_headers',
        code: 'missing_headers',
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }
}

// Admin security utilities
class AdminSecurityHelper {
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  static validateFileUpload(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
  ): AdminValidationResult {
    const errors: AdminValidationError[] = []

    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file_type',
        code: 'invalid_type',
        message: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        severity: 'error',
      })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      errors.push({
        field: 'file_size',
        code: 'too_large',
        message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    }
  }

  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

// Export all admin utilities
export {
  AdminValidator,
  AdminAuditLogger,
  AdminBatchProcessor,
  AdminDataProcessor,
  AdminSecurityHelper,
}
