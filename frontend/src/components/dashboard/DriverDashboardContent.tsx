'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Truck,
  Clock,
  DollarSign,
  Star,
  MapPin,
  AlertCircle,
  TrendingUp,
  Calendar,
  Phone,
  Navigation,
} from 'lucide-react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { DELIVERY_STATUSES } from '@/types/driver'

interface DashboardStats {
  todayDeliveries: number
  completedDeliveries: number
  totalEarnings: number
  averageRating: number
  activeDeliveries: number
  pendingDeliveries: number
}

interface RecentDelivery {
  id: string
  order_id: string
  status: keyof typeof DELIVERY_STATUSES
  delivery_address: string
  estimated_delivery_time: string
  total_amount: number
  customer_name?: string
}

export function DriverDashboardContent() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<DashboardStats>({
    todayDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    activeDeliveries: 0,
    pendingDeliveries: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Mock data - replace with actual API calls
  const loadDashboardData = useCallback(async () => {
    // Simulate API call
    setStats({
      todayDeliveries: 8,
      completedDeliveries: 6,
      totalEarnings: 45.5,
      averageRating: 4.8,
      activeDeliveries: 2,
      pendingDeliveries: 1,
    })

    setRecentDeliveries([
      {
        id: '1',
        order_id: 'ORD-001',
        status: 'in_transit',
        delivery_address: 'თბილისი, რუსთაველის გამზირი 10',
        estimated_delivery_time: '14:30',
        total_amount: 25.0,
        customer_name: 'გიორგი მ.',
      },
      {
        id: '2',
        order_id: 'ORD-002',
        status: 'assigned',
        delivery_address: 'თბილისი, მარჯანიშვილის ქუჩა 15',
        estimated_delivery_time: '15:00',
        total_amount: 18.5,
        customer_name: 'მარიამ კ.',
      },
    ])
  }, [])

  useEffect(() => {
    const initializeData = async () => {
      await loadDashboardData()
    }
    initializeData()
  }, [loadDashboardData])

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
  }

  const completionRate =
    stats.todayDeliveries > 0 ? (stats.completedDeliveries / stats.todayDeliveries) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            გამარჯობა, {user?.user_metadata?.full_name || 'მძღოლი'}!
          </h1>
          <p className="text-muted-foreground">დღევანდელი სტატუსი და მიწოდებები</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge
            variant={isOnline ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isOnline ? 'ონლაინ' : 'ოფლაინ'}</span>
          </Badge>
          <Button
            onClick={toggleOnlineStatus}
            variant={isOnline ? 'destructive' : 'default'}
            size="sm"
          >
            {isOnline ? 'გახდი ოფლაინ' : 'გახდი ონლაინ'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დღევანდელი მიწოდებები</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
            <p className="text-xs text-muted-foreground">{stats.completedDeliveries} დასრულებული</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾{stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">დღეს</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">საშუალო</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">აქტიური მიწოდებები</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeliveries}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingDeliveries} მოლოდინში</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>დღევანდელი პროგრესი</span>
            </CardTitle>
            <CardDescription>მიწოდებების დასრულების ტემპი</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">დასრულების კოეფიციენტი</span>
              <span className="text-sm text-muted-foreground">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="w-full" />

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</div>
                <p className="text-xs text-muted-foreground">დასრულებული</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.todayDeliveries - stats.completedDeliveries}
                </div>
                <p className="text-xs text-muted-foreground">დარჩენილი</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>სწრაფი მოქმედებები</CardTitle>
            <CardDescription>ხშირად გამოყენებული ფუნქციები</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Navigation className="mr-2 h-4 w-4" />
              ნავიგაცია
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Phone className="mr-2 h-4 w-4" />
              დაურეკე მომხმარებელს
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              განრიგი
            </Button>
            <Button className="w-full justify-start" variant="destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              გადაუდებელი დახმარება
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>მიმდინარე მიწოდებები</span>
          </CardTitle>
          <CardDescription>თქვენი აქტიური და მოლოდინში მყოფი მიწოდებები</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <span>{DELIVERY_STATUSES[delivery.status].icon}</span>
                      <span>{DELIVERY_STATUSES[delivery.status].label}</span>
                    </Badge>
                    <span className="font-medium">#{delivery.order_id}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {delivery.delivery_address}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      მოსალოდნელი: {delivery.estimated_delivery_time}
                    </p>
                    {delivery.customer_name && (
                      <p className="text-sm text-muted-foreground">
                        მომხმარებელი: {delivery.customer_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₾{delivery.total_amount.toFixed(2)}</p>
                  <Button size="sm" className="mt-2">
                    დეტალები
                  </Button>
                </div>
              </div>
            ))}

            {recentDeliveries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>მიმდინარე მიწოდებები არ არის</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
