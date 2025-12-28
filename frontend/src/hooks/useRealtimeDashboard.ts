import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useRealtimeDashboard(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          console.log('Realtime update:', payload)
          onUpdate()

          if (payload.eventType === 'INSERT') {
            toast.info('New order received!')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
