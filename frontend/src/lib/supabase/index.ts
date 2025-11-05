/**
 * Supabase Client Library - Barrel Export
 *
 * Centralized exports for Supabase clients and types.
 * Import from this file for consistency across the application.
 *
 * Browser Usage:
 *   import { createBrowserClient } from '@/lib/supabase'
 *   const supabase = createBrowserClient()
 *
 * Server Usage:
 *   import { createServerClient } from '@/lib/supabase/server'
 *   const supabase = await createServerClient()
 *
 * Admin Usage (server-only):
 *   import { createAdminClient } from '@/lib/supabase'
 *   const supabase = createAdminClient()
 */

// Browser client
export { createBrowserClient } from './client'

// Server clients - DO NOT IMPORT FROM INDEX IN CLIENT COMPONENTS
// Import directly from '@/lib/supabase/server' instead
// export {
//   createServerClient,
//   createAdminClient,
//   createRouteHandlerClient,
//   createServerActionClient
// } from './server'

// Type exports
export type { Database } from '@/types/database'
export type {
  Tables,
  Inserts,
  Updates,
  Profile,
  Product,
  Order,
  OrderItem,
  Notification,
  DemoSession,
  OrderStatusHistory,
  OrderAuditLog,
  Delivery,
  UserRole,
  OrderStatus,
  NotificationType,
  DeliveryStatus,
} from '@/types/database'
