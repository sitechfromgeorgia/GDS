'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react'

export function AdminDashboardContent() {
  // Mock data - will be replaced with real data from API
  const stats = {
    totalUsers: 156,
    activeUsers: 142,
    totalProducts: 89,
    activeProducts: 76,
    totalOrders: 234,
    pendingOrders: 12,
    completedOrders: 198,
    totalRevenue: 45678.9,
  }

  const recentOrders = [
    {
      id: 'ORD-001',
      restaurant: 'კაფე თბილისი',
      status: 'pending',
      amount: 125.5,
      time: '10 წუთის წინ',
    },
    {
      id: 'ORD-002',
      restaurant: 'რესტორანი მამული',
      status: 'confirmed',
      amount: 89.3,
      time: '25 წუთის წინ',
    },
    {
      id: 'ORD-003',
      restaurant: 'ბარი ცენტრი',
      status: 'completed',
      amount: 156.75,
      time: '1 საათის წინ',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            მოლოდინში
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            დადასტურებული
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            დასრულებული
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ადმინისტრატორის პანელი</h1>
        <p className="text-muted-foreground">მართეთ მომხმარებლები, პროდუქტები და შეკვეთები</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მომხმარებლები</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} აქტიური</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">პროდუქტები</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.activeProducts} აქტიური</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingOrders} მოლოდინში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +12% წინა თვესთან შედარებით
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>ბოლო შეკვეთები</CardTitle>
            <CardDescription>უახლესი შეკვეთები სისტემაში</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{order.restaurant}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.id} • {order.time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    <div className="text-sm font-medium">₾{order.amount}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                ყველა შეკვეთის ნახვა
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>სწრაფი მოქმედებები</CardTitle>
            <CardDescription>ხშირად გამოყენებადი ფუნქციები</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              ახალი მომხმარებლის დამატება
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              ახალი პროდუქტის დამატება
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              შეკვეთების მართვა
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              ანალიტიკის ნახვა
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
            შეტყობინებები
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">12 შეკვეთა მოლოდინშია</p>
                <p className="text-sm text-muted-foreground">
                  გთხოვთ გადაამოწმოთ და დაადასტუროთ მოლოდინში მყოფი შეკვეთები
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">სისტემა განახლდა</p>
                <p className="text-sm text-muted-foreground">
                  ახალი ფუნქციები და გაუმჯობესებები ხელმისაწვდომია
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
