/**
 * Centralized definition of Supabase Realtime channels and events
 * to ensure consistency across the application.
 */

export const REALTIME_CHANNELS = {
  // Product Catalog
  PRODUCT_CATALOG: 'product-catalog-changes',

  // Orders
  NEW_ORDERS: 'new-orders',

  // Dynamic Channels (require ID)
  cartUpdates: (restaurantId: string) => `cart-updates-${restaurantId}`,
  orderStatus: (orderId: string) => `order-status-${orderId}`,
  orderHistory: (restaurantId: string) => `order-history-updates-${restaurantId}`,
  orderComments: (orderId: string) => `order-comments-${orderId}`,
} as const

export const REALTIME_EVENTS = {
  // Database changes
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',

  // Custom events
  STATUS_CHANGED: 'status-changed',
  NEW_ORDER: 'new-order',
  NEW_COMMENT: 'new-comment',
} as const

export interface ProductChangePayload {
  product_id: string
  action: 'created' | 'updated' | 'deleted'
  changes?: {
    name?: string
    category?: string
    is_active?: boolean
    unit?: string
    image_url?: string
  }
  timestamp: string
}

export interface NewOrderPayload {
  order_id: string
  restaurant_id: string
  restaurant_name: string
  delivery_address: string
  total_items: number
  special_instructions?: string
  timestamp: string
}

export interface OrderStatusPayload {
  order_id: string
  status: string
  previous_status?: string
  driver_id?: string
  estimated_delivery?: string
  timestamp: string
}
