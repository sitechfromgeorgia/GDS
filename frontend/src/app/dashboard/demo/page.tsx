'use client'

export const dynamic = 'force-dynamic'

import { useDemo } from '@/hooks/useDemo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Package, Truck, BarChart3, Clock, Star } from 'lucide-react'

export default function DemoDashboard() {
  const { currentRole, sampleData, analyticsData, isLoading } = useDemo()

  // Access the correct analytics data structure
  const adminAnalytics = analyticsData[currentRole || 'admin'] || {
    total_orders: 0,
    total_revenue: 0,
    active_restaurants: 0,
    active_drivers: 0,
    monthly_growth: 0,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Users className="h-5 w-5" />
      case 'restaurant':
        return <Package className="h-5 w-5" />
      case 'driver':
        return <Truck className="h-5 w-5" />
      default:
        return <Users className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary'
      case 'restaurant':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'driver':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Georgian Distribution Demo
            </h1>
            <p className="text-gray-600 mt-1">
              Experience our comprehensive food delivery management system from different
              perspectives
            </p>
          </div>
          <Badge className={`${getRoleColor(currentRole || 'demo')} flex items-center gap-2`}>
            {getRoleIcon(currentRole || 'demo')}
            {(currentRole || 'demo').charAt(0).toUpperCase() +
              (currentRole || 'demo').slice(1)}{' '}
            View
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Demo data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾--</div>
            <p className="text-xs text-muted-foreground">Demo data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Restaurants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Demo environment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Demo environment</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Content */}
      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Overview</CardTitle>
          <CardDescription>Preview of the demo data available in this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">--</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">--</div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">--</div>
              <div className="text-sm text-gray-600">Deliveries</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
