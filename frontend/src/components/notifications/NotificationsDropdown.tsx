'use client'

import { useState, useEffect } from 'react'
import { Bell, Package, Truck, MessageSquare, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'
import { useNotifications } from '@/lib/realtime'
import { playNotificationSound, vibrateDevice } from '@/lib/pwa'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  title_ka: string | null
  message: string
  message_ka: string | null
  is_read: boolean
  created_at: string
}

interface NotificationsDropdownProps {
  userId: string
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [settings, setSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
  })

  const supabase = createBrowserClient()

  // Load user settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('driverSettings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings({
        soundEnabled: parsed.preferences?.soundEnabled ?? true,
        vibrationEnabled: parsed.preferences?.vibrationEnabled ?? true,
      })
    }
  }, [])

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications()
  }, [userId])

  // Subscribe to real-time notifications
  const { subscribe, unsubscribe } = useNotifications(userId)

  useEffect(() => {
    subscribe((notification: any) => {
      const newNotification = notification.new || notification
      const notificationData: Notification = {
        id: newNotification.id,
        user_id: newNotification.user_id,
        type: newNotification.type,
        title: newNotification.title,
        title_ka: newNotification.title_ka,
        message: newNotification.message,
        message_ka: newNotification.message_ka,
        is_read: newNotification.is_read || false,
        created_at: newNotification.created_at,
      }

      setNotifications((prev) => [notificationData, ...prev])

      // Play sound if enabled
      if (settings.soundEnabled && !notificationData.is_read) {
        playNotificationSound()
      }

      // Vibrate if enabled
      if (settings.vibrationEnabled && !notificationData.is_read) {
        vibrateDevice()
      }

      // Show browser notification
      if (
        !notificationData.is_read &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(notificationData.title_ka || notificationData.title, {
          body: notificationData.message_ka || notificationData.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: notificationData.id,
          requireInteraction: false,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userId, settings.soundEnabled, settings.vibrationEnabled, subscribe, unsubscribe])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

      if (error) throw error

      const wasUnread = notifications.find((n) => n.id === notificationId)?.is_read === false
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'order_update':
        return <Truck className="h-4 w-4 text-green-500" />
      case 'admin_message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'restaurant_message':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffInMinutes < 1) return 'ახლა'
    if (diffInMinutes < 60) return `${diffInMinutes} წუთის წინ`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} საათის წინ`
    return `${Math.floor(diffInMinutes / 1440)} დღის წინ`
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">შეტყობინებები</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              ყველას წაკითხვა
            </Button>
          )}
        </div>

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="unread" className="flex-1">
              ახალი ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="flex-1">
              წაკითხული ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[400px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">ახალი შეტყობინებები არ არის</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-accent/50 cursor-pointer transition-colors',
                        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">
                              {notification.title_ka || notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message_ka || notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="read" className="m-0">
            <ScrollArea className="h-[400px]">
              {readNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">წაკითხული შეტყობინებები არ არის</p>
                </div>
              ) : (
                <div className="divide-y">
                  {readNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 opacity-50">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm opacity-75">
                              {notification.title_ka || notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 opacity-75">
                            {notification.message_ka || notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
