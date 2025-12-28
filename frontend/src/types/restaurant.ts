import type { Order, OrderItem, Product } from './database'
import { Database } from './database'

// Restaurant-specific order type extending database Order
export interface RestaurantOrder extends Order {
  items: RestaurantOrderItem[]
  driver_name?: string
  estimated_delivery_time?: string
  special_instructions?: string
}

// Extended Product type for restaurant-specific fields
export interface RestaurantProduct extends Product {
  is_available: boolean
  min_order_quantity?: number
  max_order_quantity?: number
}

// Restaurant-specific OrderItem with product details
export interface RestaurantOrderItem extends OrderItem {
  product_name: string
}

// Cart item type for restaurant operations
export interface CartItem {
  product: RestaurantProduct
  quantity: number
  notes?: string
}

export interface RestaurantMetrics {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_spent: number
  average_order_value: number
  most_ordered_products: Array<{
    product_name: string
    quantity: number
  }>
  delivery_performance: {
    on_time_deliveries: number
    late_deliveries: number
    average_delivery_time: number
  }
}

export interface OrderFilters {
  status?: string[]
  date_range?: {
    start: string
    end: string
  }
  min_amount?: number
  max_amount?: number
  search?: string
}

export interface ProductFilters {
  category?: string[]
  price_range?: {
    min: number
    max: number
  }
  search?: string
  available_only?: boolean
}

export type OrderStatus = RestaurantOrder['status']

export const ORDER_STATUSES: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'მოლოდინში', color: 'yellow' },
  confirmed: { label: 'დადასტურებული', color: 'blue' },
  priced: { label: 'ფასირებული', color: 'purple' },
  assigned: { label: 'მინიჭებული', color: 'indigo' },
  out_for_delivery: { label: 'გზაშია', color: 'orange' },
  delivered: { label: 'მიწოდებული', color: 'green' },
  completed: { label: 'დასრულებული', color: 'gray' },
  cancelled: { label: 'გაუქმებული', color: 'red' },
}

export const PRODUCT_CATEGORIES = [
  'ხორცი და ფრინველი',
  'ბოსტნეული და ხილი',
  'საკონდიტრო',
  'სასმელები',
  'სანელებლები',
  'სხვა',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

// Export database types for backward compatibility
export type { Product, Order, OrderItem } from './database'
