// Analytics Dashboard Types
// Generated from specs/001-analytics-dashboard/data-model.md

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'priced'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface DateRange {
  from: string // ISO 8601 timestamp (UTC+4 Georgia time)
  to: string // ISO 8601 timestamp (UTC+4 Georgia time)
}

export interface FilterCriteria {
  status?: OrderStatus[] // Optional status filter values
}

export interface KPISummary {
  orders_per_day: number | null // Average orders per calendar day in range
  on_time_rate: number | null // Percentage of orders delivered on time (0-100)
  avg_delivery_time: number | null // Average duration in minutes
  total_orders: number // Count of orders matching filters
  excluded_count: number // Orders excluded due to missing data
  date_range: DateRange // Applied date filter
  filters: FilterCriteria // Applied status filters
}

export interface OrderExportRow {
  order_id: string // UUID as string
  restaurant_name: string // Joined from profiles table
  driver_name: string | null // Joined from profiles table (nullable)
  status: OrderStatus // Current order status
  created_at: string // ISO 8601 formatted timestamp
  delivery_time: string | null // ISO 8601 formatted timestamp (nullable)
  duration_minutes: number | null // Calculated delivery duration
  total_amount: string // Formatted as "125.50 GEL"
  delivery_fee: string // Formatted as "10.00 GEL"
  tax_amount: string // Formatted as "15.50 GEL"
}

// UI-specific types

export interface KPICardData {
  label: string
  value: string | number
  unit?: string
  tooltip?: string
  isLoading?: boolean
  error?: string
}

export interface DateRangePreset {
  label: string
  value: string
  days: number
}

export interface AnalyticsFilters {
  dateRange: DateRange
  status: OrderStatus[]
}

// API Request/Response types

export interface KPIQueryParams {
  from: string
  to: string
  status?: string // Comma-separated status values
}

export interface ExportQueryParams {
  from: string
  to: string
  status?: string // Comma-separated status values
}

export interface APIError {
  error: string
  message: string
  details?: unknown
}
