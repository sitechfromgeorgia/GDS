// Admin Services Module
// This module provides a comprehensive set of services for admin operations
// using both regular client and service role client capabilities

import { AdminService } from './admin.service'
import { AuditService } from './audit.service'
import { BulkService } from './bulk.service'

export { AdminService }
export { AuditService }
export { BulkService }

// Admin service instances
export const adminService = new AdminService()
export const auditService = new AuditService()
export const bulkService = new BulkService()

// Re-export types for convenience
export type {
  AdminEnvironmentInfo,
  AdminConnectionInfo,
  AdminSystemHealth,
  BulkPriceUpdate,
  AdminOrder,
  AdminAnalytics,
  AuditLogEntry,
  AdminOperationType,
  AdminValidationError,
  AdminValidationResult,
  AdminBatchOperation,
} from '@/types/admin'

// Admin client and utilities
export {
  getAdminClient,
  adminDatabase,
  checkAdminConnection,
  getAdminEnvironmentInfo,
  adminClient,
} from '@/lib/supabase/admin'

export {
  AdminValidator,
  AdminAuditLogger,
  AdminBatchProcessor,
  AdminDataProcessor,
  AdminSecurityHelper,
} from '@/lib/admin-utils'

// Convenience re-exports from existing modules
export { AdminService as default } from './admin.service'
