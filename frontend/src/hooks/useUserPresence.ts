/**
 * useUserPresence Hook
 *
 * Track and display online/offline status of users
 * Features:
 * - Real-time presence updates
 * - Last seen timestamps
 * - Auto-update on activity
 * - Bulk presence tracking
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { UserPresence, UserPresenceInsert, UserPresenceUpdate } from '@/types/database'

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

interface UseUserPresenceOptions {
  userId?: string
  userIds?: string[]
  autoUpdate?: boolean
  awayTimeout?: number // milliseconds
}

interface UseUserPresenceReturn {
  // Single user
  presence: UserPresence | null
  status: PresenceStatus
  lastSeen: Date | null

  // Multiple users
  presences: Map<string, UserPresence>

  // Connection
  isConnected: boolean
  error: Error | null

  // Actions
  updateStatus: (status: PresenceStatus) => Promise<void>
  updateLocation: (latitude: number, longitude: number) => Promise<void>
  goOnline: () => Promise<void>
  goOffline: () => Promise<void>
  goAway: () => Promise<void>
  goBusy: () => Promise<void>
}

export function useUserPresence(options: UseUserPresenceOptions = {}): UseUserPresenceReturn {
  const {
    userId,
    userIds = [],
    autoUpdate = true,
    awayTimeout = 5 * 60 * 1000, // 5 minutes
  } = options

  const supabase = createBrowserClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const [presence, setPresence] = useState<UserPresence | null>(null)
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Update presence status
   */
  const updateStatus = useCallback(
    async (status: PresenceStatus) => {
      if (!userId) return

      try {
        const presenceData: UserPresenceUpdate = {
          status,
          last_seen_at: new Date().toISOString(),
        }

        const { data, error: upsertError } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            ...presenceData,
          } as UserPresenceInsert)
          .eq('user_id', userId)
          .select()
          .single()

        if (upsertError) throw upsertError

        setPresence(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update status')
        setError(error)
        throw error
      }
    },
    [userId, supabase]
  )

  /**
   * Update user location (for drivers)
   */
  const updateLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!userId) return

      try {
        const { data, error: updateError } = await supabase
          .from('user_presence')
          .update({
            current_latitude: latitude,
            current_longitude: longitude,
            last_seen_at: new Date().toISOString(),
          } as UserPresenceUpdate)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) throw updateError

        setPresence(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update location')
        setError(error)
      }
    },
    [userId, supabase]
  )

  /**
   * Quick status setters
   */
  const goOnline = useCallback(() => updateStatus('online'), [updateStatus])
  const goOffline = useCallback(() => updateStatus('offline'), [updateStatus])
  const goAway = useCallback(() => updateStatus('away'), [updateStatus])
  const goBusy = useCallback(() => updateStatus('busy'), [updateStatus])

  /**
   * Handle user activity
   */
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (presence?.status === 'away') {
      goOnline()
    }

    // Reset away timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }

    if (autoUpdate && userId) {
      activityTimeoutRef.current = setTimeout(() => {
        goAway()
      }, awayTimeout)
    }
  }, [presence?.status, autoUpdate, userId, awayTimeout, goOnline, goAway])

  /**
   * Subscribe to presence updates
   */
  useEffect(() => {
    if (!userId && userIds.length === 0) return

    const trackingIds = userId ? [userId, ...userIds] : userIds

    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: trackingIds.length > 0 ? `user_id=in.(${trackingIds.join(',')})` : undefined,
        },
        (payload) => {
          const updatedPresence = payload.new as UserPresence

          // Update single user presence
          if (userId && updatedPresence.user_id === userId) {
            setPresence(updatedPresence)
          }

          // Update multiple users presence
          setPresences((prev) => {
            const newMap = new Map(prev)
            newMap.set(updatedPresence.user_id, updatedPresence)
            return newMap
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [userId, userIds, supabase])

  /**
   * Initialize presence and setup activity tracking
   */
  useEffect(() => {
    if (!userId || !autoUpdate) return

    // Set initial online status
    goOnline()

    // Setup activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Set initial away timeout
    activityTimeoutRef.current = setTimeout(() => {
      goAway()
    }, awayTimeout)

    return () => {
      // Cleanup activity listeners
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })

      // Clear timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }

      // Set offline on unmount
      goOffline()
    }
  }, [userId, autoUpdate, awayTimeout, handleActivity, goOnline, goAway, goOffline])

  return {
    presence,
    status: (presence?.status as PresenceStatus) || 'offline',
    lastSeen: presence?.last_seen_at ? new Date(presence.last_seen_at) : null,
    presences,
    isConnected,
    error,
    updateStatus,
    updateLocation,
    goOnline,
    goOffline,
    goAway,
    goBusy,
  }
}
