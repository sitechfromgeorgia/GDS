// Georgian Distribution System Custom React Query Hooks
// Optimized for Georgian Distribution System entities and workflows

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { GDS_CACHE_KEYS, GDSQueryUtils } from '@/lib/query/client'
import type { Database } from '@/lib/supabase'

// Type definitions
type Order = Database['public']['Tables']['orders']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

// Georgian Distribution System Order Hooks
export function useOrders(filters?: {
  restaurant_id?: string
  driver_id?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: GDS_CACHE_KEYS.orders(filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          profiles!orders_restaurant_id_fkey(full_name, restaurant_name),
          order_items(*, products(name, unit))
        `
        )
        .order('created_at', { ascending: false })

      if (filters?.restaurant_id) {
        query = query.eq('restaurant_id', filters.restaurant_id)
      }
      if (filters?.driver_id) {
        query = query.eq('driver_id', filters.driver_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Order[]
    },
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useOrder(orderId: string) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['gds', 'order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          profiles!orders_restaurant_id_fkey(full_name, restaurant_name),
          order_items(*, products(name, unit, price))
        `
        )
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data as Order
    },
    enabled: !!orderId,
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  return useMutation({
    mutationFn: async (orderData: {
      restaurant_id: string
      items: Array<{
        product_id: string
        quantity: number
        price: number
      }>
    }) => {
      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Create order
      const { data: order, error: orderError } = await (supabase.from('orders') as any)
        .insert({
          restaurant_id: orderData.restaurant_id,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const { error: itemsError } = await (supabase.from('order_items') as any).insert(
        orderData.items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }))
      )

      if (itemsError) {
        // Cleanup order if items creation fails
        await supabase.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      return order
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['gds', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['gds', 'dashboard'] })
    },
  })
}

// Georgian Distribution System Product Hooks
export function useProducts(filters?: {
  active?: boolean
  category?: string
  limit?: number
  search?: string
}) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: GDS_CACHE_KEYS.products(filters),
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })

      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useProduct(productId: string) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['gds', 'product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      return data as Product
    },
    enabled: !!productId,
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase.from('products') as any)
        .insert(productData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gds', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['gds', 'dashboard'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await (supabase.from('products') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update specific product cache
      queryClient.setQueryData(['gds', 'product', data.id], data)
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['gds', 'products'] })
    },
  })
}

// Georgian Distribution System Profile/User Hooks
export function useProfiles(filters?: { role?: string; is_active?: boolean }) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: GDS_CACHE_KEYS.profiles(filters),
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Profile[]
    },
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useCurrentProfile() {
  const supabase = createBrowserClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: user ? GDS_CACHE_KEYS.userProfile(user.id) : ['gds', 'profile', 'anonymous'],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!user,
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await (supabase.from('profiles') as any)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (user) {
        // Update current user profile cache
        queryClient.setQueryData(GDS_CACHE_KEYS.userProfile(user.id), data)
        // Invalidate profiles list
        queryClient.invalidateQueries({ queryKey: ['gds', 'profiles'] })
      }
    },
  })
}

// Georgian Distribution System Dashboard Hooks
export function useDashboardData() {
  const supabase = createBrowserClient()
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: GDS_CACHE_KEYS.dashboard({ userId: user?.id, role: profile?.role }),
    queryFn: async () => {
      if (!user || !profile) throw new Error('User not authenticated')

      // Get basic dashboard data based on role
      const queries = [
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      ]

      // Role-specific queries
      switch (profile.role) {
        case 'admin':
          queries.push(
            supabase.from('profiles').select('*') as any,
            supabase.from('products').select('*') as any
          )
          break
        case 'restaurant':
          queries[0] = supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
          break
        case 'driver':
          queries[0] = supabase
            .from('orders')
            .select('*')
            .eq('driver_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
          break
      }

      const results = await Promise.all(queries)
      const [orders, ...additional] = results

      return {
        orders: orders?.data || [],
        profiles: profile.role === 'admin' ? additional[0]?.data || [] : [],
        products: profile.role === 'admin' ? additional[1]?.data || [] : [],
      }
    },
    enabled: !!user && !!profile,
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

// Georgian Distribution System Analytics Hooks
export function useAnalytics(filters?: { startDate?: string; endDate?: string; role?: string }) {
  const supabase = createBrowserClient()
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: GDS_CACHE_KEYS.analytics(filters),
    queryFn: async () => {
      if (!profile || !user) throw new Error('Profile or user not loaded')

      let ordersQuery = supabase.from('orders').select('*')
      let productsQuery = supabase.from('products').select('*')
      let profilesQuery = supabase.from('profiles').select('*')

      // Apply role-based filtering
      switch (profile.role) {
        case 'restaurant':
          ordersQuery = ordersQuery.eq('restaurant_id', user.id)
          break
        case 'driver':
          ordersQuery = ordersQuery.eq('driver_id', user.id)
          break
        // Admin sees all data
      }

      // Apply date filtering
      if (filters?.startDate) {
        ordersQuery = ordersQuery.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        ordersQuery = ordersQuery.lte('created_at', filters.endDate)
      }

      const [ordersData, productsData, profilesData] = await Promise.all([
        ordersQuery,
        productsQuery,
        profilesQuery,
      ])

      // Calculate analytics
      const orders = (ordersData.data || []) as Order[]
      const products = (productsData.data || []) as Product[]
      const profiles = (profilesData.data || []) as Profile[]

      return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        totalProducts: products.length,
        totalUsers: profiles.length,
        ordersByStatus: orders.reduce(
          (acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
        revenueByDay: orders.reduce(
          (acc, order) => {
            const day = new Date(order.created_at).toISOString().split('T')[0]
            if (day) {
              acc[day] = (acc[day] || 0) + (order.total_amount || 0)
            }
            return acc
          },
          {} as Record<string, number>
        ),
      }
    },
    enabled: !!profile,
    staleTime: GDSQueryUtils.getNetworkOptimizedConfig().staleTime,
  })
}

// Georgian Distribution System Real-time Hook
export function useRealtimeUpdates() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  useEffect(() => {
    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Invalidate orders queries when changes occur
          queryClient.invalidateQueries({ queryKey: ['gds', 'orders'] })
          queryClient.invalidateQueries({ queryKey: ['gds', 'dashboard'] })
        }
      )
      .subscribe()

    // Subscribe to products table changes
    const productsSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['gds', 'products'] })
        }
      )
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
      productsSubscription.unsubscribe()
    }
  }, [queryClient, supabase])
}

export default {
  // Orders
  useOrders,
  useOrder,
  useCreateOrder,

  // Products
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,

  // Profiles
  useProfiles,
  useCurrentProfile,
  useUpdateProfile,

  // Dashboard
  useDashboardData,

  // Analytics
  useAnalytics,

  // Real-time
  useRealtimeUpdates,
}
