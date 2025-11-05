// Order Submission Types for Georgian Distribution System
// Integration with real-time cart synchronization

export interface OrderSubmissionInput {
  restaurantId: string
  cartSessionId?: string
  specialInstructions?: string
  preferredDeliveryDate?: string
  contactPhone?: string
  deliveryAddress?: string
  priority?: 'normal' | 'urgent'
  paymentMethod?: 'cash' | 'card' | 'transfer'
}

export interface OrderSubmissionResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  estimatedDeliveryDate?: string
  totalAmount: number
  message: string
  validationErrors?: OrderSubmissionValidationError[]
}

export interface OrderSubmissionValidationError {
  field: string
  code: string
  message: string
  georgianMessage: string
}

export interface OrderWithItems {
  id: string
  restaurantId: string
  status: OrderStatus
  totalAmount: number
  createdAt: string
  updatedAt: string
  specialInstructions?: string
  preferredDeliveryDate?: string
  contactPhone?: string
  deliveryAddress?: string
  orderNumber?: string
  items: OrderSubmissionItem[]
}

export interface OrderSubmissionItem {
  id: string
  productId: string
  productName: string
  productNameKa: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit: string
  notes?: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface OrderSubmissionStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  averageOrderValue: number
  popularProducts: Array<{
    productId: string
    productName: string
    orderCount: number
  }>
}

export interface OrderSubmissionConfiguration {
  enableRealTimeNotifications: boolean
  requireDeliveryAddress: boolean
  allowGuestOrders: boolean
  maxOrderValue: number
  minOrderValue: number
  deliveryFee: number
  freeDeliveryThreshold: number
}

export interface OrderSubmissionContext {
  restaurantId: string
  userId?: string
  cartSessionId?: string
  orderType: 'new' | 'repeat'
  isRushOrder: boolean
  paymentMethod: string
}

// Cart to Order Conversion
export interface CartToOrderConversion {
  cartId: string
  items: CartOrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  estimatedDeliveryTime: number // minutes
}

export interface CartOrderItem {
  productId: string
  productName: string
  productNameKa: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit: string
  notes?: string
}

// Order Submission Events
export interface OrderSubmissionEvent {
  type: 'order_submitted' | 'order_confirmed' | 'order_cancelled' | 'order_updated'
  orderId: string
  restaurantId: string
  timestamp: string
  data?: any
}

// Real-time Order Updates
export interface OrderUpdate {
  id: string
  orderId: string
  status: OrderStatus
  estimatedDeliveryTime?: string
  driverName?: string
  driverPhone?: string
  message: string
  timestamp: string
}

// Order Confirmation
export interface OrderConfirmation {
  orderId: string
  orderNumber: string
  restaurantName: string
  totalAmount: number
  estimatedDeliveryTime: string
  status: OrderStatus
  items: OrderSubmissionItem[]
  contactInfo: {
    phone?: string
    address?: string
    specialInstructions?: string
  }
  trackingInfo?: {
    trackingNumber?: string
    driverInfo?: {
      name: string
      phone: string
      location?: string
    }
  }
}

// Bulk Order Operations
export interface BulkOrderSubmission {
  orders: OrderSubmissionInput[]
  bulkNotes?: string
  prioritizedDelivery: boolean
  combinedPayment: boolean
}

export interface BulkOrderResult {
  successfulOrders: string[] // Order IDs
  failedOrders: Array<{
    input: OrderSubmissionInput
    error: string
    errorCode: string
  }>
  totalAmount: number
  estimatedDeliveryWindow: string
}

// Order Workflow States
export interface OrderWorkflowState {
  currentState:
    | 'cart_review'
    | 'order_submission'
    | 'order_confirmation'
    | 'order_processing'
    | 'completed'
  previousStates: string[]
  canGoBack: boolean
  canProceed: boolean
  validationErrors: string[]
  progress: number // 0-100
}

// Order Analytics
export interface OrderAnalytics {
  dailyOrders: number
  weeklyOrders: number
  monthlyOrders: number
  averageOrderValue: number
  peakHours: Array<{
    hour: number
    orderCount: number
  }>
  popularCategories: Array<{
    category: string
    orderCount: number
    revenue: number
  }>
  customerSatisfaction: {
    averageRating: number
    totalReviews: number
    ratingDistribution: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
}

// Order Submission Hook Types
export interface UseOrderSubmissionOptions {
  restaurantId: string
  enableNotifications?: boolean
  autoConfirm?: boolean
  rushDeliveryAvailable?: boolean
}

export interface OrderSubmissionProgress {
  step: 'review' | 'validate' | 'submit' | 'confirm' | 'complete'
  isLoading: boolean
  error: string | null
  progress: number
  estimatedTime: number // seconds
}

// Georgian Localization for Order Submission
export const ORDER_SUBMISSION_GEORGIAN = {
  labels: {
    orderNumber: 'შეკვეთის ნომერი',
    status: 'სტატუსი',
    totalAmount: 'ჯამური თანხა',
    estimatedDelivery: 'მოსალოდნელი მიწოდება',
    specialInstructions: 'განსაკუთრებული ინსტრუქციები',
    contactPhone: 'საკონტაქტო ტელეფონი',
    deliveryAddress: 'მიწოდების მისამართი',
    priority: 'პრიორიტეტი',
    paymentMethod: 'გადახდის მეთოდი',
    checkout: 'გადახდა',
  },
  status: {
    pending: 'მოლოდინში',
    confirmed: 'დადასტურებული',
    preparing: 'მზადების პროცესში',
    out_for_delivery: 'მიწოდების გზაზე',
    delivered: 'მიწოდებულია',
    completed: 'დასრულებული',
    cancelled: 'გაუქმებული',
  },
  messages: {
    orderSubmitted: 'შეკვეთა წარმატებით გაიგზავნა',
    orderConfirmed: 'შეკვეთა დადასტურდა',
    orderCancelled: 'შეკვეთა გაუქმდა',
    validationFailed: 'მონაცემების ვალიდაცია ვერ მოხერხდა',
    networkError: 'ქსელის შეცდომა',
    minimumOrderValue: 'შეკვეთის მინიმალური თანხა',
    maximumOrderValue: 'შეკვეთის მაქსიმალური თანხა',
    invalidAddress: 'მიწოდების მისამართი არასწორია',
    required: 'ამ ველის შევსება აუცილებელია',
    submitting: 'შეკვეთა გაგზავნისთვის მომზადება',
    success: 'შეკვეთა წარმატებით გაიგზავნა',
  },
  actions: {
    submitOrder: 'შეკვეთის გაგზავნა',
    confirmOrder: 'შეკვეთის დადასტურება',
    cancelOrder: 'შეკვეთის გაუქმება',
    viewOrder: 'შეკვეთის ნახვა',
    trackOrder: 'შეკვეთის თვალყურის დევნება',
  },
} as const

export type GeorgianOrderLabels = typeof ORDER_SUBMISSION_GEORGIAN.labels
export type GeorgianOrderStatus = typeof ORDER_SUBMISSION_GEORGIAN.status
export type GeorgianOrderMessages = typeof ORDER_SUBMISSION_GEORGIAN.messages
