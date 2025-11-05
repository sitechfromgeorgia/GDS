import { logger } from '@/lib/logger'
import { getAdminClient } from '@/lib/supabase/admin'
import { AdminAuditLogger } from '@/lib/admin-utils'
import type { AdminOperationType, AuditLogEntry } from '@/types/admin'

export class AuditService {
  private adminClient = getAdminClient()

  // Create audit log entry
  async logAdminAction(
    action: AdminOperationType,
    resource: string,
    resourceId: string | null,
    performedBy: string,
    details: Record<string, any> = {}
  ): Promise<AuditLogEntry> {
    // Log to local utility for immediate access
    AdminAuditLogger.log(action, resource, resourceId, performedBy, details)

    try {
      // In a real implementation, this would persist to a dedicated audit table
      const auditEntry = {
        action,
        resource,
        resource_id: resourceId,
        performed_by: performedBy,
        details,
        created_at: new Date().toISOString(),
      }

      // For now, we'll just return the local entry
      return {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        resource,
        resource_id: resourceId || undefined,
        performed_by: performedBy,
        details,
        created_at: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('Failed to create audit log entry:', error)
      throw new Error('Failed to create audit log entry')
    }
  }

  // Get audit logs with filtering
  async getAuditLogs(
    filters: {
      action?: AdminOperationType
      resource?: string
      performedBy?: string
      dateFrom?: string
      dateTo?: string
      limit?: number
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.adminClient
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.resource) {
        query = query.eq('resource', filters.resource)
      }

      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch audit logs: ${error.message}`)
      }

      return data || []
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error)
      // Fallback to local logs
      return AdminAuditLogger.getRecentLogs(filters.limit || 50)
    }
  }

  // Get audit statistics
  async getAuditStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalEntries: number
    entriesByAction: Record<string, number>
    entriesByResource: Record<string, number>
    mostActiveUsers: Array<{ user: string; count: number }>
    recentActivity: AuditLogEntry[]
  }> {
    try {
      const logs = await this.getAuditLogs({
        dateFrom,
        dateTo,
        limit: 1000, // Get more data for stats
      })

      const stats = {
        totalEntries: logs.length,
        entriesByAction: {} as Record<string, number>,
        entriesByResource: {} as Record<string, number>,
        mostActiveUsers: [] as Array<{ user: string; count: number }>,
        recentActivity: logs.slice(0, 10),
      }

      // Count by action
      logs.forEach((log) => {
        stats.entriesByAction[log.action] = (stats.entriesByAction[log.action] || 0) + 1
        stats.entriesByResource[log.resource] = (stats.entriesByResource[log.resource] || 0) + 1
      })

      // Count by user
      const userCounts = logs.reduce(
        (acc, log) => {
          acc[log.performed_by] = (acc[log.performed_by] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      stats.mostActiveUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([user, count]) => ({ user, count }))

      return stats
    } catch (error) {
      logger.error('Failed to fetch audit stats:', error)
      return {
        totalEntries: 0,
        entriesByAction: {},
        entriesByResource: {},
        mostActiveUsers: [],
        recentActivity: [],
      }
    }
  }

  // Export audit logs to CSV
  async exportAuditLogs(
    filters: {
      dateFrom?: string
      dateTo?: string
      action?: AdminOperationType
    } = {}
  ): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filters)

      if (logs.length === 0) {
        return 'No audit logs found for the specified criteria.'
      }

      const headers = [
        'ID',
        'Action',
        'Resource',
        'Resource ID',
        'Performed By',
        'Created At',
        'Details',
      ]
      const csvRows = [
        headers.join(','),
        ...logs.map((log) =>
          [
            log.id,
            log.action,
            log.resource,
            log.resource_id || '',
            log.performed_by,
            log.created_at,
            JSON.stringify(log.details).replace(/"/g, '""'),
          ]
            .map((field) => `"${field}"`)
            .join(',')
        ),
      ]

      return csvRows.join('\n')
    } catch (error) {
      logger.error('Failed to export audit logs:', error)
      throw new Error('Failed to export audit logs')
    }
  }
}

export const auditService = new AuditService()
