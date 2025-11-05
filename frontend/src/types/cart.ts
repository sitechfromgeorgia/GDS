// Cart Types for Georgian Distribution System
export interface CartItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    name_ka: string
    price: number
    unit: string
    image_url?: string
    category: string
  }
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Cart {
  id: string
  sessionToken?: string
  userId?: string
  restaurantId?: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  status: 'active' | 'submitted' | 'expired'
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

export interface CartItemInput {
  productId: string
  quantity?: number
  notes?: string
}

export interface CartUpdateInput {
  itemId: string
  quantity: number
  notes?: string
}

export interface CartFilters {
  userId?: string
  restaurantId?: string
  status?: 'active' | 'submitted' | 'expired'
  createdAfter?: Date
  createdBefore?: Date
}

export interface CartStatistics {
  totalCarts: number
  activeCarts: number
  submittedCarts: number
  averageItemsPerCart: number
  averageValuePerCart: number
  mostAddedProducts: Array<{
    productId: string
    productName: string
    addCount: number
  }>
}

export interface CartValidationResult {
  isValid: boolean
  errors: CartValidationError[]
  warnings: CartValidationWarning[]
}

export interface CartValidationError {
  code: string
  message: string
  itemId?: string
  field?: string
}

export interface CartValidationWarning {
  code: string
  message: string
  itemId?: string
  field?: string
}

export type CartActionType =
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'REMOVE_ITEM'
  | 'CLEAR_CART'
  | 'SUBMIT_CART'
  | 'LOAD_CART'
  | 'SYNC_CART'

export interface CartAction {
  type: CartActionType
  payload?: any
  timestamp: Date
}
