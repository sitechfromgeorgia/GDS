// User Roles and Authentication
export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT: 'restaurant',
  DRIVER: 'driver',
  DEMO: 'demo',
} as const

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password must be at least 6 characters',
  INVALID_EMAIL: 'Invalid email address',
  NETWORK_ERROR: 'Network error occurred',
} as const

// Order Management
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PRICED: 'priced',
  ASSIGNED: 'assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებული',
  preparing: 'მზადება',
  out_for_delivery: 'მიტანაზე',
  delivered: 'მიტანილი',
  completed: 'დასრულებული',
  cancelled: 'გაუქმებული',
} as const

export const ORDER_STATUS_COLORS = {
  pending: 'secondary',
  confirmed: 'default',
  preparing: 'outline',
  out_for_delivery: 'default',
  delivered: 'success',
  completed: 'success',
  cancelled: 'destructive',
} as const

// Products and Categories
export const PRODUCT_CATEGORIES = [
  'ბოსტნეული',
  'ხილი',
  'ხორცი',
  'ზღვის პროდუქტები',
  'რძის პროდუქტები',
  'ცერეალები',
  'სანელებლები',
  'სასმელები',
  'სხვა',
] as const

export const UNITS = ['კგ', 'ცალი', 'ყუთი', 'ლიტრი', 'პაკეტი'] as const

// UI Constants
export const UI = {
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
  DEFAULTS: {
    PAGE_SIZE: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    TIMEOUT: 30000, // 30 seconds
  },
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: '/auth/signin',
    SIGN_UP: '/auth/signup',
    SIGN_OUT: '/auth/signout',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ORDERS: {
    BASE: '/orders',
    CREATE: '/orders',
    UPDATE: (id: string) => `/orders/${id}`,
    DELETE: (id: string) => `/orders/${id}`,
    ANALYTICS: '/orders/analytics',
  },
  PRODUCTS: {
    BASE: '/products',
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },
  USERS: {
    BASE: '/users',
    UPDATE_PROFILE: '/users/profile',
    UPDATE_ROLE: (id: string) => `/users/${id}/role`,
  },
} as const

// Notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

export const NOTIFICATION_MESSAGES = {
  ORDER_CREATED: 'შეკვეთა წარმატებით შეიქმნა',
  ORDER_UPDATED: 'შეკვეთა განახლდა',
  ORDER_DELETED: 'შეკვეთა წაიშალა',
  PRODUCT_CREATED: 'პროდუქტი წარმატებით შეიქმნა',
  PRODUCT_UPDATED: 'პროდუქტი განახლდა',
  PRODUCT_DELETED: 'პროდუქტი წაიშალა',
  USER_CREATED: 'მომხმარებელი წარმატებით შეიქმნა',
  USER_UPDATED: 'მომხმარებლის მონაცემები განახლდა',
  PROFILE_UPDATED: 'პროფილი წარმატებით განახლდა',
} as const

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MIN_LENGTH: 10,
} as const

// Routes
export const ROUTES = {
  LANDING: '/landing',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: {
    BASE: '/dashboard/admin',
    USERS: '/dashboard/admin/users',
    PRODUCTS: '/dashboard/admin/products',
    ORDERS: '/dashboard/admin/orders',
    ANALYTICS: '/dashboard/admin/analytics',
    SETTINGS: '/dashboard/admin/settings',
  },
  RESTAURANT: {
    BASE: '/dashboard/restaurant',
    ORDERS: '/dashboard/restaurant/orders',
    HISTORY: '/dashboard/restaurant/history',
  },
  DRIVER: {
    BASE: '/dashboard/driver',
    DELIVERIES: '/dashboard/driver/deliveries',
    HISTORY: '/dashboard/driver/history',
  },
  DEMO: {
    BASE: '/dashboard/demo',
  },
} as const

// Environment
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Export types
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
export type Unit = (typeof UNITS)[number]
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]
export type Environment = (typeof ENV)[keyof typeof ENV]
