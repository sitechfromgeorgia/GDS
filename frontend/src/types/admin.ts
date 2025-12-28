import type { Database } from './database'

export type User = {
  id: string
  role: 'admin' | 'restaurant' | 'driver'
  full_name: string | null
  restaurant_name: string | null
  phone: string | null
  address: string | null
  google_maps_link: string | null
  base_salary: number
  per_delivery_rate: number
  bonus_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
  email?: string
  last_sign_in_at?: string
  created_at_auth?: string
}

export type Product = Database['public']['Tables']['products']['Row']

export type Order = Database['public']['Tables']['orders']['Row'] & {
  restaurant?: {
    full_name: string | null
    restaurant_name: string | null
  }
  driver?: {
    full_name: string | null
  }
  order_items?: Array<{
    id: string
    product_id: string
    quantity: number
    cost_price: number | null
    selling_price: number | null
    product?: {
      name: string
      unit: string
    }
  }>
}

export type AnalyticsData = {
  totalUsers: number
  activeUsers: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
  topProducts: Array<{
    product_id: string
    name: string
    total_quantity: number
    total_revenue: number
  }>
  userGrowth: Array<{
    month: string
    users: number
  }>
}

export type UserFormData = {
  email: string
  password?: string
  full_name: string
  restaurant_name?: string
  phone?: string
  address?: string
  google_maps_link?: string
  base_salary?: number
  per_delivery_rate?: number
  bonus_amount?: number
  role: 'admin' | 'restaurant' | 'driver'
  is_active: boolean
}

export type ProductFormData = {
  name: string
  category: string
  unit: string
  image_url?: string
  is_active: boolean
}

export type OrderPricingData = {
  order_id: string
  items: Array<{
    id: string
    cost_price: number
    selling_price: number
  }>
}

export type BulkOperationResult = {
  success: boolean
  message: string
  affected_count: number
  errors?: Array<{
    id: string
    error: string
  }>
}

export type AdminApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginationParams = {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export type FilterParams = {
  search?: string
  status?: string
  role?: string
  category?: string
  date_from?: string
  date_to?: string
  is_active?: boolean
}

export type AdminTableColumn<T = unknown> = {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, item: T) => React.ReactNode
}

export type AdminAction<T = unknown> = {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onClick: (item: T) => void
  disabled?: (item: T) => boolean
  confirm?: {
    title: string
    description: string
  }
}

// Service Role Admin Types
export type AdminEnvironmentInfo = {
  url: string
  hasServiceRoleKey: boolean
  isLocal: boolean
  clientInfo: string
}

export type AdminConnectionInfo = {
  clientType: 'server' | 'browser'
  hasAdminClient: boolean
  adminConnection: boolean
  adminEnvironment: AdminEnvironmentInfo | null
  environment: string
  timestamp: string
}

export type AdminSystemHealth = {
  database: boolean
  ordersAccessible: boolean
  productsAccessible: boolean
  profilesAccessible?: boolean
  hasAdminClient?: boolean
  adminClientAvailable?: boolean
  timestamp?: string
}

export type BulkPriceUpdate = {
  id: string
  price: number
}

export type AdminOrder = Database['public']['Tables']['orders']['Row'] & {
  restaurant?: {
    full_name: string | null
    restaurant_name: string | null
  }
  driver?: {
    full_name: string | null
    phone?: string | null
  }
  order_items?: Array<{
    id: string
    product_id: string
    quantity: number
    price: number
    product?: {
      name: string
      unit: string
      category?: string
    }
  }>
}

export type AdminAnalytics = {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: Record<string, number>
  revenueByDay: Record<string, number>
  topProducts: Array<{
    name: string
    revenue: number
    rank: number
  }>
  averageOrderValue: number
}

export type AuditLogEntry = {
  id: string
  action: string
  resource: string
  resource_id?: string
  performed_by: string
  details: Record<string, any>
  created_at: string
}

export type AdminOperationType =
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_status_change'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'product_bulk_update'
  | 'order_status_change'
  | 'order_assignment'
  | 'order_bulk_update'
  | 'system_maintenance'

export type AdminValidationError = {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export type AdminValidationResult = {
  isValid: boolean
  errors: AdminValidationError[]
  warnings: AdminValidationError[]
}

export type AdminBatchOperation = {
  id: string
  type: AdminOperationType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_items: number
  processed_items: number
  success_count: number
  error_count: number
  errors?: Array<{
    item_id: string
    error: string
  }>
  created_at: string
  completed_at?: string
}
