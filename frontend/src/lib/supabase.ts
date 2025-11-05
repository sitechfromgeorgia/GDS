/**
 * Supabase Client Library - Safe Client-Side Export
 *
 * This file safely re-exports only browser-safe exports to avoid importing
 * server-only code (like next/headers) in client components.
 *
 * For server-side code (API routes, Server Components), import directly:
 *   import { createServerClient } from '@/lib/supabase/server'
 *
 * For client-side code (Client Components):
 *   import { createBrowserClient } from '@/lib/supabase'
 */

// Browser client (safe for client components)
export { createBrowserClient } from './supabase/client'

// Type exports (safe everywhere)
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
