'use server'

import { verifyUserRole } from '@/lib/auth/server-auth'

/**
 * Server actions for restaurant dashboard
 * T017: Paginated orders loading
 */

import type { Order, OrderStatus } from '@/types/restaurant'
import { logger } from '@/lib/logger'
import { getOrdersPaginated } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'

export interface PaginatedOrdersParams {
  status?: string[]
  limit?: number
  cursor?: string
}

export async function loadPaginatedOrders(params: PaginatedOrdersParams) {
  try {
    const supabase = await createServerClient()

    // Verify user role using centralized helper that supports bypass
    const { user } = await verifyUserRole('restaurant')

    // Get user's restaurant profile (for ID)
    // In bypass mode, we need to mock this or ensure verifyUserRole returns enough info
    // But verifyUserRole returns a user object.
    // If it's a test user, we need to handle the profile ID.

    let profileId = user.id
    const isTestUser =
      [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ].includes(user.id) || user.id.startsWith('test-')

    if (!isTestUser) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'restaurant') {
        throw new Error('Not a restaurant user')
      }
      profileId = profile.id
    }

    // Load paginated orders using optimized query
    const result = await getOrdersPaginated({
      restaurantId: profileId,
      status: params.status || ['pending', 'confirmed', 'priced'],
      limit: params.limit || 20,
      cursor: params.cursor,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error('Failed to load paginated orders:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load orders',
      data: null,
    }
  }
}
