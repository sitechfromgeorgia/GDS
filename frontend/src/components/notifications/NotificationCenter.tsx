'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertTriangle, Truck, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/lib/realtime'
import { useAuth } from '@/hooks/useAuth'
import { OrderNotification } from '@/lib/realtime'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItemProps {
  notification: OrderNotification
  onMarkRead: (notificationId: string) => void
  onDismiss: (notificationId: string) => void
}

function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'status_change':
        return <Package className="h-4 w-4" />
      case 'assigned':
        return <Truck className="h-4 w-4" />
      case 'delivery_update':
        return <Truck className="h-4 w-4" />
      case 'created':
        return <Package className="h-4 w-4" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = () => {
    const priority = (notification.data as any)?.priority as string | undefined
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="flex items-start space-x-3 p-3 border-b last:border-b-0">
      <div
        className={`p-2 rounded-full ${notification.data?.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
      >
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">{notification.message}</p>
          <Badge variant={getPriorityColor()} className="ml-2 text-xs">
            {String((notification.data as any)?.priority ?? 'low')}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">Order #{notification.order_id.slice(-8)}</p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(), { addSuffix: true })}
          </p>
        </div>

        {Boolean((notification.data as any)?.restaurant_name) && (
          <p className="text-xs text-gray-500 mt-1">
            {String((notification.data as any)?.restaurant_name)}
          </p>
        )}
      </div>

      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMarkRead(notification.order_id)}
          className="h-8 w-8 p-0"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(notification.order_id)}
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const { subscribe, unsubscribe } = useNotifications(user?.id || '')

  useEffect(() => {
    if (!user?.id) return

    const unsubscribeFromNotifications = subscribe((notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, subscribe])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.order_id === notificationId ? { ...notification, read: true } : notification
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.order_id !== notificationId)
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <NotificationItem
                    key={`${notification.order_id}-${index}`}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDismiss={dismissNotification}
                  />
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
