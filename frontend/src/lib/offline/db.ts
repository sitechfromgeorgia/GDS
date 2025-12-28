import Dexie, { type Table } from 'dexie'
import { logger } from '@/lib/logger'

export interface OfflineOrder {
  id?: number
  restaurant_id: string
  items: any[]
  total_amount: number
  status: 'pending_sync'
  created_at: string
}

export class OfflineDatabase extends Dexie {
  orders!: Table<OfflineOrder, number>

  constructor() {
    super('georgian-distribution-db')
    this.version(1).stores({
      orders: '++id, restaurant_id, status, created_at',
    })
  }
}

export const db = new OfflineDatabase()

export async function saveOrderOffline(order: Omit<OfflineOrder, 'id' | 'status'>) {
  try {
    await db.orders.add({
      ...order,
      status: 'pending_sync',
    })

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready
      // @ts-ignore - SyncManager is not yet in standard types
      if (registration.sync) {
        // @ts-ignore
        await registration.sync.register('sync-orders')
      }
    }
  } catch (error) {
    logger.error('Failed to save order offline:', error)
    throw error
  }
}
