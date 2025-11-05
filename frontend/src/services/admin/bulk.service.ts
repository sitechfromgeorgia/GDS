import { getAdminClient, adminDatabase } from '@/lib/supabase/admin'
import { AdminBatchProcessor, AdminAuditLogger } from '@/lib/admin-utils'
import type { AdminOperationType, BulkPriceUpdate, AdminBatchOperation } from '@/types/admin'

export class BulkService {
  private adminClient = getAdminClient()

  // Bulk update product prices
  async bulkUpdateProductPrices(
    updates: BulkPriceUpdate[],
    performedBy: string
  ): Promise<{
    batchId: string
    result: AdminBatchOperation
  }> {
    const validation = this.validateBulkPriceUpdates(updates)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`)
    }

    const batch = AdminBatchProcessor.createBatch('product_bulk_update', updates.length, {
      updates_count: updates.length,
    })

    try {
      // Audit log the operation start
      await AdminAuditLogger.log('product_bulk_update', 'products', null, performedBy, {
        updates_count: updates.length,
        batch_id: batch.id,
      })

      // Perform the bulk update using admin client
      const result = await adminDatabase.bulkUpdateProductPrices(updates)

      // Update batch status
      AdminBatchProcessor.completeBatch(batch.id, 'completed')

      // Audit log the completion
      await AdminAuditLogger.log('product_bulk_update', 'products', null, performedBy, {
        batch_id: batch.id,
        success_count: updates.length,
        error_count: 0,
        result: result?.length || 0,
      })

      return {
        batchId: batch.id,
        result: AdminBatchProcessor.getBatch(batch.id)!,
      }
    } catch (error) {
      AdminBatchProcessor.completeBatch(batch.id, 'failed')

      // Audit log the failure
      await AdminAuditLogger.log('product_bulk_update', 'products', null, performedBy, {
        batch_id: batch.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw new Error(
        `Bulk price update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Bulk update user status
  async bulkUpdateUserStatus(
    userIds: string[],
    isActive: boolean,
    performedBy: string
  ): Promise<{
    batchId: string
    result: AdminBatchOperation
  }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required and cannot be empty')
    }

    const batch = AdminBatchProcessor.createBatch('user_status_change', userIds.length, {
      user_ids: userIds,
      is_active: isActive,
    })

    try {
      // Audit log the operation start
      await AdminAuditLogger.log('user_status_change', 'users', null, performedBy, {
        user_count: userIds.length,
        is_active: isActive,
        batch_id: batch.id,
      })

      // Perform the bulk update using admin client
      const result = await adminDatabase.bulkUpdateUserStatus(userIds, isActive)

      // Update batch status
      AdminBatchProcessor.completeBatch(batch.id, 'completed')

      // Audit log the completion
      await AdminAuditLogger.log('user_status_change', 'users', null, performedBy, {
        batch_id: batch.id,
        success_count: result?.length || 0,
        error_count: 0,
        affected_users: result?.map((u) => u.id) || [],
      })

      return {
        batchId: batch.id,
        result: AdminBatchProcessor.getBatch(batch.id)!,
      }
    } catch (error) {
      AdminBatchProcessor.completeBatch(batch.id, 'failed')

      // Audit log the failure
      await AdminAuditLogger.log('user_status_change', 'users', null, performedBy, {
        batch_id: batch.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw new Error(
        `Bulk user status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Bulk delete orders (admin only, with confirmation)
  async bulkDeleteOrders(
    orderIds: string[],
    performedBy: string,
    confirmationToken: string
  ): Promise<{
    batchId: string
    result: AdminBatchOperation
  }> {
    // Security check: require confirmation token for destructive operations
    if (confirmationToken !== 'DELETE_CONFIRMED') {
      throw new Error('Confirmation token required for bulk delete operations')
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required and cannot be empty')
    }

    const batch = AdminBatchProcessor.createBatch('order_bulk_update', orderIds.length, {
      operation: 'bulk_delete',
      order_ids: orderIds,
    })

    try {
      // Audit log the destructive operation
      await AdminAuditLogger.log('order_bulk_update', 'orders', null, performedBy, {
        operation: 'bulk_delete',
        order_count: orderIds.length,
        batch_id: batch.id,
        destructive: true,
        confirmation_token: confirmationToken,
      })

      // Perform the bulk delete using admin client
      const result = await adminDatabase.bulkDeleteOrders(orderIds)

      // Update batch status
      AdminBatchProcessor.completeBatch(batch.id, 'completed')

      // Audit log the completion
      await AdminAuditLogger.log('order_bulk_update', 'orders', null, performedBy, {
        batch_id: batch.id,
        operation: 'bulk_delete',
        success_count: result.deletedCount || 0,
        error_count: 0,
      })

      return {
        batchId: batch.id,
        result: AdminBatchProcessor.getBatch(batch.id)!,
      }
    } catch (error) {
      AdminBatchProcessor.completeBatch(batch.id, 'failed')

      // Audit log the failure
      await AdminAuditLogger.log('order_bulk_update', 'orders', null, performedBy, {
        batch_id: batch.id,
        operation: 'bulk_delete',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw new Error(
        `Bulk order delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Get batch operation status
  async getBatchStatus(batchId: string): Promise<AdminBatchOperation | null> {
    return AdminBatchProcessor.getBatch(batchId)
  }

  // Get all active batch operations
  async getActiveBatches(): Promise<AdminBatchOperation[]> {
    return AdminBatchProcessor.getActiveBatches()
  }

  // Get all batch operations (including completed)
  async getAllBatches(): Promise<AdminBatchOperation[]> {
    return AdminBatchProcessor.getAllBatches()
  }

  // Cancel a pending batch operation
  async cancelBatch(batchId: string, performedBy: string): Promise<void> {
    const batch = AdminBatchProcessor.getBatch(batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }

    if (batch.status !== 'pending') {
      throw new Error('Can only cancel pending batch operations')
    }

    // Update batch status
    AdminBatchProcessor.completeBatch(batchId, 'failed')

    // Audit log the cancellation
    await AdminAuditLogger.log('system_maintenance', 'batch_operations', batchId, performedBy, {
      action: 'cancel',
      original_type: batch.type,
      total_items: batch.total_items,
    })
  }

  // Clean up completed batches
  async cleanupCompletedBatches(olderThanHours: number = 24): Promise<void> {
    AdminBatchProcessor.cleanupCompletedBatches(olderThanHours)
  }

  // Validate bulk operations data
  private validateBulkPriceUpdates(updates: BulkPriceUpdate[]): {
    isValid: boolean
    errors: Array<{ field: string; message: string }>
  } {
    const errors: Array<{ field: string; message: string }> = []

    if (!Array.isArray(updates)) {
      errors.push({ field: 'updates', message: 'Updates must be an array' })
      return { isValid: false, errors }
    }

    if (updates.length === 0) {
      errors.push({ field: 'updates', message: 'At least one update is required' })
      return { isValid: false, errors }
    }

    if (updates.length > 1000) {
      errors.push({ field: 'updates', message: 'Maximum 1000 updates allowed per batch' })
    }

    updates.forEach((update, index) => {
      if (!update.id) {
        errors.push({ field: `updates[${index}].id`, message: 'Product ID is required' })
      }

      if (typeof update.price !== 'number' || update.price < 0) {
        errors.push({
          field: `updates[${index}].price`,
          message: 'Price must be a positive number',
        })
      }

      if (update.price > 999999.99) {
        errors.push({ field: `updates[${index}].price`, message: 'Price cannot exceed 999,999.99' })
      }
    })

    // Check for duplicate IDs
    const ids = updates.map((u) => u.id).filter(Boolean)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      errors.push({ field: 'updates', message: 'Duplicate product IDs found in updates' })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Export bulk operation results to CSV
  async exportBatchResults(batchId: string): Promise<string> {
    const batch = AdminBatchProcessor.getBatch(batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }

    const headers = [
      'Batch ID',
      'Type',
      'Status',
      'Total Items',
      'Processed Items',
      'Success Count',
      'Error Count',
      'Created At',
      'Completed At',
    ]

    const row = [
      batch.id,
      batch.type,
      batch.status,
      batch.total_items.toString(),
      batch.processed_items.toString(),
      batch.success_count.toString(),
      batch.error_count.toString(),
      batch.created_at,
      batch.completed_at || '',
    ]

    return [headers.join(','), row.map((field) => `"${field}"`).join(',')].join('\n')
  }
}

export const bulkService = new BulkService()
