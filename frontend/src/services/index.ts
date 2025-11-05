// Auth services
export {
  authService,
  type SignInInput,
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from './auth/auth.service'

// Order services
export {
  orderService,
  type OrderItem,
  type OrderCreateInput,
  type OrderUpdateInput,
  orderItemSchema,
  orderCreateSchema,
  orderUpdateSchema,
} from './orders/order.service'

// Order submission services
export {
  OrderSubmissionService,
  createOrderSubmissionService,
  orderSubmissionService,
} from './order-submission.service'
export type {
  OrderSubmissionInput,
  OrderSubmissionResult,
  OrderWithItems,
  CartToOrderConversion,
  OrderConfirmation,
  OrderSubmissionEvent,
  OrderSubmissionStats,
  BulkOrderSubmission,
  BulkOrderResult,
} from '@/types/order-submission'

// Admin services
export { adminService } from './admin/admin.service'

// Product services
export { productService } from './products/product.service'

// Cart services
export { cartService } from './cart/cart.service'
export type {
  Cart,
  CartItem,
  CartItemInput,
  CartUpdateInput,
  CartFilters,
  CartValidationResult,
  CartStatistics,
} from '@/types/cart'

// Real-time cart services
export { RealtimeCartService, getRealtimeCartService, realtimeCart } from './realtime-cart.service'
export type {
  CartSession,
  RealtimeCartUpdate,
  CartActivityType,
  CartSessionSummary,
} from '@/types/realtime-cart'

// Export all service classes
export { AuthService } from './auth/auth.service'
export { OrderService } from './orders/order.service'
export { AdminService } from './admin/admin.service'
export { CartService } from './cart/cart.service'
