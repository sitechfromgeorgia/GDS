import { logger } from '@/lib/logger'
import type { Database, OrderStatus } from '@/types/database'
import { ORDER_STATUSES, USER_ROLES } from '@/constants'
import { OrderWorkflowEngine } from './order-workflow'
import { OrderNotificationManager } from './order-notifications'
import { createServerClient } from '@/lib/supabase/server'

type Order = Database['public']['Tables']['orders']['Row']
type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean
  total: number
  successful: number
  failed: number
  errors: Array<{
    orderId: string
    error: string
  }>
  warnings: Array<{
    orderId: string
    warning: string
  }>
}

/**
 * Bulk operation options
 */
export interface BulkOperationOptions {
  continueOnError?: boolean
  maxConcurrent?: number
  dryRun?: boolean
  notifyOnCompletion?: boolean
}

/**
 * Bulk Operations Manager
 * Handles bulk operations on orders with proper validation, error handling, and progress tracking
 */
export class BulkOperationsManager {
  /**
   * Bulk status update for multiple orders
   */
  static async bulkUpdateStatus(
    orderIds: string[],
    newStatus: OrderStatus,
    userId: string,
    userRole: UserRole,
    options: BulkOperationOptions = {},
    notes?: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      total: orderIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      warnings: [],
    }

    const {
      continueOnError = true,
      maxConcurrent = 5,
      dryRun = false,
      notifyOnCompletion = true,
    } = options

    // Validate user permissions for bulk operations
    if (userRole !== USER_ROLES.ADMIN) {
      return {
        ...result,
        success: false,
        errors: [{ orderId: 'all', error: 'Only administrators can perform bulk operations' }],
      }
    }

    // Get all orders to validate
    const supabase = await createServerClient()
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, restaurant_id, driver_id')
      .in('id', orderIds)

    if (error || !orders) {
      return {
        ...result,
        success: false,
        errors: [{ orderId: 'all', error: 'Failed to fetch orders for validation' }],
      }
    }

    // Validate all transitions first
    const typedOrders = (orders || []) as Array<{
      id: string
      status: string
      restaurant_id: string
      driver_id: string | null
    }>
    const validationResults = await Promise.all(
      typedOrders.map(async (order) => {
        const validation = await OrderWorkflowEngine.validateTransition(
          order.status as OrderStatus,
          newStatus,
          userRole,
          userId,
          order as Order
        )
        return { order, validation }
      })
    )

    // Check for validation failures
    const failedValidations = validationResults.filter((r) => !r.validation.valid)
    if (failedValidations.length > 0) {
      result.success = false
      result.errors = failedValidations.map((r) => ({
        orderId: r.order.id,
        error: r.validation.reason || 'Validation failed',
      }))
      return result
    }

    if (dryRun) {
      // Return preview without making changes
      return {
        ...result,
        successful: orderIds.length,
        warnings: [{ orderId: 'all', warning: 'Dry run - no changes made' }],
      }
    }

    // Process orders in batches
    const batches = this.chunkArray(orderIds, maxConcurrent)

    for (const batch of batches) {
      const batchPromises = batch.map(async (orderId) => {
        try {
          const statusResult = await OrderWorkflowEngine.executeStatusChange(
            orderId,
            newStatus,
            userId,
            userRole,
            notes
          )

          if (statusResult.success) {
            result.successful++
          } else {
            result.failed++
            result.errors.push({
              orderId,
              error: statusResult.error || 'Unknown error',
            })
          }
        } catch (error) {
          result.failed++
          result.errors.push({
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })

      await Promise.all(batchPromises)

      // Stop if not continuing on error and we have failures
      if (!continueOnError && result.failed > 0) {
        break
      }
    }

    // Send completion notification
    if (notifyOnCompletion && result.successful > 0) {
      await this.sendBulkOperationNotification('status_update', result, userId, newStatus)
    }

    return result
  }

  /**
   * Bulk assign orders to a driver
   */
  static async bulkAssignDriver(
    orderIds: string[],
    driverId: string,
    userId: string,
    userRole: UserRole,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      total: orderIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      warnings: [],
    }

    if (userRole !== USER_ROLES.ADMIN) {
      return {
        ...result,
        success: false,
        errors: [{ orderId: 'all', error: 'Only administrators can perform bulk assignments' }],
      }
    }

    // Validate driver exists
    const supabase = await createServerClient()
    const { data: driver, error: driverError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', driverId)
      .eq('role', USER_ROLES.DRIVER)
      .single()

    if (driverError || !driver) {
      return {
        ...result,
        success: false,
        errors: [{ orderId: 'all', error: 'Invalid driver selected' }],
      }
    }

    // Process assignments
    for (const orderId of orderIds) {
      try {
        const statusResult = await OrderWorkflowEngine.executeStatusChange(
          orderId,
          ORDER_STATUSES.ASSIGNED,
          userId,
          userRole,
          `Bulk assigned to ${(driver as { full_name?: string } | null)?.full_name ?? 'driver'}`,
          { driver_id: driverId }
        )

        if (statusResult.success) {
          result.successful++
        } else {
          result.failed++
          result.errors.push({
            orderId,
            error: statusResult.error || 'Assignment failed',
          })
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Send assignment notifications
    if (result.successful > 0 && orderIds[0]) {
      await OrderNotificationManager.notifyOrderAssigned(orderIds[0], driverId) // Simplified - send for first order
    }

    return result
  }

  /**
   * Bulk cancel orders
   */
  static async bulkCancelOrders(
    orderIds: string[],
    userId: string,
    userRole: UserRole,
    reason: string,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult> {
    return this.bulkUpdateStatus(
      orderIds,
      ORDER_STATUSES.CANCELLED,
      userId,
      userRole,
      options,
      `Bulk cancelled: ${reason}`
    )
  }

  /**
   * Bulk confirm orders (admin operation)
   */
  static async bulkConfirmOrders(
    orderIds: string[],
    userId: string,
    userRole: UserRole,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult> {
    return this.bulkUpdateStatus(
      orderIds,
      ORDER_STATUSES.CONFIRMED,
      userId,
      userRole,
      options,
      'Bulk confirmed by admin'
    )
  }

  /**
   * Get bulk operation preview
   */
  static async getBulkOperationPreview(
    orderIds: string[],
    operation: 'status_update' | 'assign_driver' | 'cancel' | 'confirm',
    userId: string,
    userRole: UserRole,
    newStatus?: OrderStatus,
    driverId?: string
  ): Promise<{
    valid: boolean
    preview: Array<{
      orderId: string
      currentStatus: OrderStatus
      newStatus: OrderStatus
      valid: boolean
      reason?: string
    }>
    summary: {
      total: number
      valid: number
      invalid: number
    }
  }> {
    const supabase = await createServerClient()
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, restaurant_id, driver_id')
      .in('id', orderIds)

    if (error || !orders) {
      return {
        valid: false,
        preview: [],
        summary: { total: 0, valid: 0, invalid: 0 },
      }
    }

    const typedOrders2 = (orders || []) as Array<{
      id: string
      status: string
      restaurant_id: string
      driver_id: string | null
    }>
    const preview = await Promise.all(
      typedOrders2.map(async (order) => {
        let targetStatus = newStatus

        // Determine target status based on operation
        switch (operation) {
          case 'assign_driver':
            targetStatus = ORDER_STATUSES.ASSIGNED
            break
          case 'cancel':
            targetStatus = ORDER_STATUSES.CANCELLED
            break
          case 'confirm':
            targetStatus = ORDER_STATUSES.CONFIRMED
            break
          case 'status_update':
            if (!newStatus) throw new Error('New status required for status_update')
            targetStatus = newStatus
            break
        }

        const validation = await OrderWorkflowEngine.validateTransition(
          order.status as OrderStatus,
          targetStatus!,
          userRole,
          userId,
          order as unknown as Order
        )

        return {
          orderId: order.id,
          currentStatus: order.status as OrderStatus,
          newStatus: targetStatus!,
          valid: validation.valid,
          reason: validation.reason,
        }
      })
    )

    const summary = {
      total: preview.length,
      valid: preview.filter((p) => p.valid).length,
      invalid: preview.filter((p) => !p.valid).length,
    }

    return {
      valid: summary.invalid === 0,
      preview,
      summary,
    }
  }

  /**
   * Get bulk operation statistics
   */
  static async getBulkOperationStats(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    operationsByType: Record<string, number>
    averageProcessingTime: number
  }> {
    // This would require additional logging table for bulk operations
    // For now, return placeholder data
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      operationsByType: {},
      averageProcessingTime: 0,
    }
  }

  /**
   * Send bulk operation completion notification
   */
  private static async sendBulkOperationNotification(
    operationType: string,
    result: BulkOperationResult,
    userId: string,
    newStatus?: OrderStatus
  ): Promise<void> {
    try {
      const message = `Bulk ${operationType} completed: ${result.successful}/${result.total} orders ${newStatus ? `set to ${newStatus}` : 'processed'}`

      await OrderNotificationManager.sendBulkNotifications([
        {
          order_id: 'bulk-operation',
          type: 'status_change',
          message,
          recipient_id: userId,
          recipient_role: 'admin',
          data: {
            operation_type: operationType,
            result,
            new_status: newStatus,
          },
        },
      ])
    } catch (error) {
      logger.error('Failed to send bulk operation notification:', error)
    }
  }

  /**
   * Utility function to chunk arrays
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Validate bulk operation permissions
   */
  static validateBulkPermissions(userRole: UserRole): boolean {
    return userRole === USER_ROLES.ADMIN
  }

  /**
   * Get maximum allowed bulk operation size
   */
  static getMaxBulkSize(userRole: UserRole): number {
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return 100 // Admins can process up to 100 orders at once
      default:
        return 0 // Others cannot perform bulk operations
    }
  }
}
