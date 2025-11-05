export interface DriverDelivery {
  id: string
  order_id: string
  driver_id: string
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled'
  pickup_time?: string
  delivery_time?: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  delivery_address: string
  delivery_coordinates?: {
    latitude: number
    longitude: number
  }
  customer_name?: string
  customer_phone?: string
  special_instructions?: string
  delivery_fee?: number
  distance_km?: number
  estimated_duration_minutes?: number
  actual_duration_minutes?: number
  created_at: string
  updated_at: string
  order?: {
    id: string
    restaurant_name: string
    total_amount: number
    items: Array<{
      product_name: string
      quantity: number
      unit: string
    }>
  }
}

export interface DriverLocation {
  driver_id: string
  latitude: number
  longitude: number
  accuracy?: number
  heading?: number
  speed?: number
  timestamp: string
  is_online: boolean
}

export interface DriverMetrics {
  total_deliveries: number
  completed_deliveries: number
  cancelled_deliveries: number
  average_rating: number
  total_earnings: number
  average_delivery_time: number
  on_time_delivery_rate: number
  customer_satisfaction_score: number
  monthly_stats: Array<{
    month: string
    deliveries: number
    earnings: number
    rating: number
  }>
}

export interface DeliveryAction {
  type: 'pickup' | 'deliver' | 'cancel' | 'update_status'
  delivery_id: string
  notes?: string
  proof_of_delivery?: {
    signature?: string
    photo_url?: string
  }
}

export interface RouteOptimization {
  deliveries: DriverDelivery[]
  optimized_route: Array<{
    delivery_id: string
    sequence: number
    estimated_arrival: string
    distance_from_previous: number
  }>
  total_distance: number
  total_estimated_time: number
}

export type DeliveryStatus = DriverDelivery['status']

export const DELIVERY_STATUSES: Record<
  DeliveryStatus,
  { label: string; color: string; icon: string }
> = {
  assigned: { label: 'დანიშნული', color: 'blue', icon: '📋' },
  picked_up: { label: 'აღებულია', color: 'orange', icon: '📦' },
  in_transit: { label: 'გზაშია', color: 'purple', icon: '🚚' },
  delivered: { label: 'მიწოდებული', color: 'green', icon: '✅' },
  failed: { label: 'წარუმატებელი', color: 'red', icon: '❌' },
  cancelled: { label: 'გაუქმებული', color: 'gray', icon: '🚫' },
}

export interface DriverFilters {
  status?: DeliveryStatus[]
  date_range?: {
    start: string
    end: string
  }
  priority?: 'high' | 'medium' | 'low'
  search?: string
}

export interface DriverSettings {
  notifications_enabled: boolean
  auto_accept_deliveries: boolean
  max_daily_deliveries: number
  preferred_areas: string[]
  vehicle_type: 'car' | 'motorcycle' | 'bicycle' | 'walking'
  working_hours: {
    start: string
    end: string
  }
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface DriverProfile {
  id: string
  full_name: string
  phone: string
  email: string
  license_number?: string
  vehicle_info?: {
    type: string
    model: string
    license_plate: string
  }
  emergency_contacts: EmergencyContact[]
  settings: DriverSettings
  is_online: boolean
  current_location?: DriverLocation
  rating: number
  total_deliveries: number
}
