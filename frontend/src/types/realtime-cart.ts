// Real-time Cart Synchronization Types
// Georgian Distribution System - Cart real-time synchronization

export interface CartSession {
  id: string
  userId?: string
  sessionToken: string
  expiresAt: string
  isActive: boolean
  lastActivity: string
  createdAt: string
  updatedAt: string
}

export type CartActivityType = 'item_added' | 'item_updated' | 'item_removed' | 'cart_cleared'

export interface RealtimeCartUpdate {
  type: string
  sessionId: string
  data: any
  timestamp: string
}

export interface CartActivity {
  id: string
  cartSessionId: string
  activityType: CartActivityType
  productId?: string
  oldQuantity?: number
  newQuantity?: number
  notes?: string
  createdAt: string
}

export interface CartSessionSummary {
  id: string
  userId?: string
  sessionToken: string
  expiresAt: string
  isActive: boolean
  lastActivity: string
  createdAt: string
  itemCount: number
  totalPrice: number
  totalQuantity: number
}

export interface RealtimeCartConfig {
  enableRealTime?: boolean
  sessionToken?: string
  userId?: string
}

export interface CartSyncStatus {
  isConnected: boolean
  lastSyncAt?: string
  pendingUpdates: number
  sessionId?: string
}

export interface RealTimeSyncEvent {
  type: 'connected' | 'disconnected' | 'error' | 'cart_updated'
  data?: any
  timestamp: string
}

// Extended Cart interface for real-time features
export interface RealtimeCart {
  id: string
  sessionToken: string
  userId?: string
  items: RealtimeCartItem[]
  totalItems: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  lastActivity: string
  isActive: boolean
  expiresAt: string
}

export interface RealtimeCartItem {
  id: string
  productId: string
  product: any // Product type from existing types
  quantity: number
  notes?: string
  unitPrice: number
  totalPrice: number
  createdAt: string
  updatedAt: string
}

// Sync statistics
export interface CartSyncStatistics {
  totalSessions: number
  activeSessions: number
  itemsSynced: number
  lastSyncTime: string
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
}

// Cleanup results
export interface CleanupResult {
  sessionsDeleted: number
  itemsDeleted: number
  activitiesDeleted: number
}

// Real-time subscription callbacks
export type CartUpdateCallback = (update: RealtimeCartUpdate) => void
export type CartSyncCallback = (event: RealTimeSyncEvent) => void

// Channel events
export interface CartChannelEvent {
  event: string
  schema: string
  table: string
  payload: {
    new?: any
    old?: any
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    timestamp: string
  }
}
