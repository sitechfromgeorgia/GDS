import { logger } from '@/lib/logger'
import { Database, OrderStatus } from '@/types/database'
import { ORDER_STATUSES, USER_ROLES } from '@/constants'
import { createServerClient } from '@/lib/supabase/server'

type Order = Database['public']['Tables']['orders']['Row']
type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Order status change history entry
 */
export interface OrderStatusHistory {
  id: string
  order_id: string
  old_status: OrderStatus | null
  new_status: OrderStatus
  changed_by: string
  changed_by_role: UserRole
  changed_at: string
  notes?: string
  metadata?: Record<string, unknown>
}

/**
 * Order audit log entry
 */
export interface OrderAuditLog {
  id: string
  order_id: string
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'status_changed'
    | 'assigned'
    | 'priced'
    | 'delivered'
    | 'completed'
  user_id: string
  user_role: UserRole
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  timestamp: string
  ip_address?: string
  user_agent?: string
}

/**
 * Order History Manager
 * Tracks all status changes and audit logs for orders
 */
export class OrderHistoryManager {
  /**
   * Record a status change in history
   */
  static async recordStatusChange(
    orderId: string,
    oldStatus: OrderStatus | null,
    newStatus: OrderStatus,
    userId: string,
    userRole: UserRole,
    notes?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = await createServerClient()

      // Insert status change record
      const { error } = await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: userId,
        changed_by_role: userRole,
        changed_at: new Date().toISOString(),
        notes,
        metadata,
      } as any)

      if (error) {
        logger.error('Failed to record status change:', error)
        // Don't throw - logging failure shouldn't break the main flow
      }

      // Also create audit log entry
      await this.createAuditLog({
        order_id: orderId,
        action: 'status_changed',
        user_id: userId,
        user_role: userRole,
        old_data: oldStatus ? { status: oldStatus } : undefined,
        new_data: { status: newStatus },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Error recording status change:', error)
    }
  }

  /**
   * Get status history for an order
   */
  static async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('order_status_history')
        .select(
          `
          id,
          order_id,
          old_status,
          new_status,
          changed_by,
          changed_by_role,
          changed_at,
          notes,
          metadata,
          profiles!order_status_history_changed_by_fkey (
            full_name
          )
        `
        )
        .eq('order_id', orderId)
        .order('changed_at', { ascending: true })

      if (error) {
        logger.error('Failed to get order status history:', error)
        return []
      }

      return (data || []) as any
    } catch (error) {
      logger.error('Error getting order status history:', error)
      return []
    }
  }

  /**
   * Get audit log for an order
   */
  static async getOrderAuditLog(orderId: string): Promise<OrderAuditLog[]> {
    try {
      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('order_audit_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true })

      if (error) {
        logger.error('Failed to get order audit log:', error)
        return []
      }

      return (data || []) as any
    } catch (error) {
      logger.error('Error getting order audit log:', error)
      return []
    }
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(logEntry: Omit<OrderAuditLog, 'id'>): Promise<void> {
    try {
      const supabase = await createServerClient()

      const { error } = await supabase.from('order_audit_logs').insert(logEntry as any)

      if (error) {
        logger.error('Failed to create audit log:', error)
      }
    } catch (error) {
      logger.error('Error creating audit log:', error)
    }
  }

  /**
   * Get order timeline (combines status changes and other events)
   */
  static async getOrderTimeline(orderId: string): Promise<
    Array<{
      id: string
      type: 'status_change' | 'assignment' | 'delivery' | 'completion' | 'cancellation'
      timestamp: string
      description: string
      user?: string
      metadata?: Record<string, unknown>
    }>
  > {
    try {
      const [statusHistory, auditLogs] = await Promise.all([
        this.getOrderStatusHistory(orderId),
        this.getOrderAuditLog(orderId),
      ])

      const timeline: Array<{
        id: string
        type: 'status_change' | 'assignment' | 'delivery' | 'completion' | 'cancellation'
        timestamp: string
        description: string
        user?: string
        metadata?: Record<string, unknown>
      }> = []

      // Add status changes
      statusHistory.forEach((entry) => {
        timeline.push({
          id: entry.id,
          type: 'status_change',
          timestamp: entry.changed_at,
          description: `Status changed from ${entry.old_status || 'none'} to ${entry.new_status}`,
          user: String(entry.changed_by || 'System'),
          metadata: {
            old_status: entry.old_status,
            new_status: entry.new_status,
            notes: entry.notes,
          },
        })
      })

      // Add other audit events
      auditLogs.forEach((log) => {
        if (log.action !== 'status_changed') {
          // Avoid duplicates
          timeline.push({
            id: log.id,
            type: this.mapAuditActionToType(log.action),
            timestamp: log.timestamp,
            description: this.getAuditDescription(log),
            user: 'System', // Would need to join with profiles table
            metadata: undefined,
          })
        }
      })

      // Sort by timestamp
      return timeline.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    } catch (error) {
      logger.error('Error getting order timeline:', error)
      return []
    }
  }

  /**
   * Get orders modified by a user within a date range
   */
  static async getUserActivity(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<OrderStatusHistory[]> {
    try {
      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('order_status_history')
        .select(
          `
          *,
          orders (
            id,
            restaurant_id,
            profiles!orders_restaurant_id_fkey (
              restaurant_name,
              full_name
            )
          )
        `
        )
        .eq('changed_by', userId)
        .gte('changed_at', startDate)
        .lte('changed_at', endDate)
        .order('changed_at', { ascending: false })

      if (error) {
        logger.error('Failed to get user activity:', error)
        return []
      }

      return (data || []) as any
    } catch (error) {
      logger.error('Error getting user activity:', error)
      return []
    }
  }

  /**
   * Get status change statistics
   */
  static async getStatusChangeStats(
    startDate: string,
    endDate: string
  ): Promise<{
    totalChanges: number
    changesByStatus: Record<string, number>
    changesByUser: Record<string, number>
    averageTimeInStatus: Record<string, number>
  }> {
    try {
      const supabase = await createServerClient()

      const { data: changes, error } = await supabase
        .from('order_status_history')
        .select('old_status, new_status, changed_by, changed_at')
        .gte('changed_at', startDate)
        .lte('changed_at', endDate)

      if (error || !changes) {
        logger.error('Failed to get status change stats:', error)
        return {
          totalChanges: 0,
          changesByStatus: {},
          changesByUser: {},
          averageTimeInStatus: {},
        }
      }

      const changesByStatus: Record<string, number> = {}
      const changesByUser: Record<string, number> = {}

      const typedChanges = (changes || []) as Array<{ new_status: string; changed_by: string }>
      typedChanges.forEach((change) => {
        // Count changes by new status
        changesByStatus[change.new_status] = (changesByStatus[change.new_status] || 0) + 1

        // Count changes by user
        changesByUser[change.changed_by] = (changesByUser[change.changed_by] || 0) + 1
      })

      return {
        totalChanges: changes.length,
        changesByStatus,
        changesByUser,
        averageTimeInStatus: {}, // Would need more complex calculation
      }
    } catch (error) {
      logger.error('Error getting status change stats:', error)
      return {
        totalChanges: 0,
        changesByStatus: {},
        changesByUser: {},
        averageTimeInStatus: {},
      }
    }
  }

  /**
   * Clean up old history records (for data retention compliance)
   */
  static async cleanupOldHistory(daysToKeep: number = 365): Promise<{ deleted: number }> {
    try {
      const supabase = await createServerClient()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from('order_status_history')
        .delete()
        .lt('changed_at', cutoffDate.toISOString())
        .select('id')

      if (error) {
        logger.error('Failed to cleanup old history:', error)
        return { deleted: 0 }
      }

      return { deleted: data?.length || 0 }
    } catch (error) {
      logger.error('Error cleaning up old history:', error)
      return { deleted: 0 }
    }
  }

  /**
   * Map audit action to timeline type
   */
  private static mapAuditActionToType(
    action: OrderAuditLog['action']
  ): 'status_change' | 'assignment' | 'delivery' | 'completion' | 'cancellation' {
    switch (action) {
      case 'assigned':
        return 'assignment'
      case 'delivered':
        return 'delivery'
      case 'completed':
        return 'completion'
      case 'deleted':
      case 'updated':
        return 'status_change'
      default:
        return 'status_change'
    }
  }

  /**
   * Get description for audit log entry
   */
  private static getAuditDescription(log: OrderAuditLog): string {
    switch (log.action) {
      case 'created':
        return 'Order was created'
      case 'updated':
        return 'Order was updated'
      case 'deleted':
        return 'Order was deleted'
      case 'assigned':
        return 'Order was assigned to driver'
      case 'priced':
        return 'Order was priced'
      case 'delivered':
        return 'Order was marked as delivered'
      case 'completed':
        return 'Order was completed'
      default:
        return `Order ${log.action}`
    }
  }
}
