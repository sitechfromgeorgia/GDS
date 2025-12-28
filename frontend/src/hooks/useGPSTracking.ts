/**
 * @deprecated This hook is no longer used.
 * GPS tracking has been replaced with Google Maps Link-based navigation.
 * Drivers now use external Google Maps links instead of embedded tracking.
 *
 * See frontend/src/app/dashboard/driver/deliveries/page.tsx for the new implementation.
 *
 * This file can be safely deleted.
 *
 * Migration date: 2025-11-05
 *
 * useGPSTracking Hook
 *
 * Provides real-time GPS tracking for delivery locations
 * Features:
 * - Subscribe to live location updates
 * - Update driver location
 * - Track delivery route
 * - Calculate ETA
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { DeliveryLocation, DeliveryLocationInsert } from '@/types/database'

interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
}

interface UseGPSTrackingOptions {
  deliveryId?: string
  driverId?: string
  autoSubscribe?: boolean
  trackHistory?: boolean
  maxHistorySize?: number
}

interface UseGPSTrackingReturn {
  // Current location
  currentLocation: DeliveryLocation | null

  // Location history
  locationHistory: DeliveryLocation[]

  // Connection state
  isConnected: boolean
  isTracking: boolean
  error: Error | null

  // Actions
  startTracking: () => void
  stopTracking: () => void
  updateLocation: (coords: GPSCoordinates) => Promise<void>
  clearHistory: () => void

  // Utilities
  distance: number | null // Distance to destination in km
  eta: number | null // Estimated time of arrival in minutes
}

export function useGPSTracking(options: UseGPSTrackingOptions = {}): UseGPSTrackingReturn {
  const {
    deliveryId,
    driverId,
    autoSubscribe = true,
    trackHistory = true,
    maxHistorySize = 50,
  } = options

  const supabase = createBrowserClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const [currentLocation, setCurrentLocation] = useState<DeliveryLocation | null>(null)
  const [locationHistory, setLocationHistory] = useState<DeliveryLocation[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [eta, setETA] = useState<number | null>(null)

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180)
      const dLon = (lon2 - lon1) * (Math.PI / 180)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    []
  )

  /**
   * Calculate ETA based on distance and speed
   */
  const calculateETA = useCallback((distanceKm: number, speedKmh: number): number => {
    if (speedKmh === 0) return 0
    return (distanceKm / speedKmh) * 60 // Convert to minutes
  }, [])

  /**
   * Update location in database
   */
  const updateLocation = useCallback(
    async (coords: GPSCoordinates) => {
      if (!deliveryId || !driverId) {
        throw new Error('deliveryId and driverId are required to update location')
      }

      try {
        const locationData: DeliveryLocationInsert = {
          delivery_id: deliveryId,
          driver_id: driverId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          heading: coords.heading,
          speed: coords.speed,
          recorded_at: new Date().toISOString(),
        }

        const { data, error: insertError } = await supabase
          .from('delivery_locations')
          .insert(locationData)
          .select()
          .single()

        if (insertError) throw insertError

        setCurrentLocation(data)

        if (trackHistory) {
          setLocationHistory((prev) => {
            const newHistory = [...prev, data]
            return newHistory.slice(-maxHistorySize)
          })
        }

        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update location')
        setError(error)
        throw error
      }
    },
    [deliveryId, driverId, supabase, trackHistory, maxHistorySize]
  )

  /**
   * Start GPS tracking
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'))
      return
    }

    setIsTracking(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const coords: GPSCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
        }

        try {
          await updateLocation(coords)
        } catch (err) {
          logger.error('Failed to update GPS location', err as Error)
        }
      },
      (err) => {
        setError(new Error(`Geolocation error: ${err.message}`))
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )
  }, [updateLocation])

  /**
   * Stop GPS tracking
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  /**
   * Clear location history
   */
  const clearHistory = useCallback(() => {
    setLocationHistory([])
  }, [])

  /**
   * Subscribe to real-time location updates
   */
  useEffect(() => {
    if (!autoSubscribe || !deliveryId) return

    const channel = supabase
      .channel(`delivery-location:${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_locations',
          filter: `delivery_id=eq.${deliveryId}`,
        },
        (payload: RealtimePostgresChangesPayload<DeliveryLocation>) => {
          const newLocation = payload.new as DeliveryLocation
          setCurrentLocation(newLocation)

          if (trackHistory) {
            setLocationHistory((prev) => {
              const newHistory = [...prev, newLocation]
              return newHistory.slice(-maxHistorySize)
            })
          }
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [deliveryId, autoSubscribe, supabase, trackHistory, maxHistorySize])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    currentLocation,
    locationHistory,
    isConnected,
    isTracking,
    error,
    startTracking,
    stopTracking,
    updateLocation,
    clearHistory,
    distance,
    eta,
  }
}
