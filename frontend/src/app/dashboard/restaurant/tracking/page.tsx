'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock, CheckCircle, Truck, Package } from 'lucide-react'

export default function RestaurantTrackingPage() {
  // Mock active deliveries
  const activeDeliveries = [
    {
      orderId: 'ORD-2025-001',
      driverName: 'გიორგი მამულაშვილი',
      driverPhone: '+995 555 123 456',
      customerName: 'ნინო გელაშვილი',
      customerPhone: '+995 555 789 012',
      address: 'ვაჟა-ფშაველას 45, თბილისი',
      items: 3,
      totalAmount: '₾89.50',
      status: 'delivering',
      estimatedTime: '10 წუთი',
      progress: 70,
      location: { lat: 41.7151, lng: 44.8271 },
    },
    {
      orderId: 'ORD-2025-002',
      driverName: 'დავით ბერიძე',
      driverPhone: '+995 555 234 567',
      customerName: 'ანა ქავთარაძე',
      customerPhone: '+995 555 890 123',
      address: 'რუსთაველის 25, თბილისი',
      items: 5,
      totalAmount: '₾124.80',
      status: 'picked_up',
      estimatedTime: '15 წუთი',
      progress: 40,
      location: { lat: 41.6938, lng: 44.8015 },
    },
    {
      orderId: 'ORD-2025-003',
      driverName: 'ლევან თოდუა',
      driverPhone: '+995 555 345 678',
      customerName: 'სალომე ნიკოლეიშვილი',
      customerPhone: '+995 555 901 234',
      address: 'აღმაშენებლის 102, თბილისი',
      items: 2,
      totalAmount: '₾56.20',
      status: 'on_the_way',
      estimatedTime: '5 წუთი',
      progress: 90,
      location: { lat: 41.7194, lng: 44.7926 },
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivering':
        return <Badge className="bg-blue-500">მიწოდებაში</Badge>
      case 'picked_up':
        return <Badge className="bg-purple-500">აღებული</Badge>
      case 'on_the_way':
        return <Badge className="bg-green-500">გზაში</Badge>
      default:
        return <Badge>უცნობი</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">მიწოდების მონიტორინგი</h1>
        <p className="text-muted-foreground mt-2">თვალი ადევნეთ აქტიურ მიწოდებებს რეალურ დროში</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">აქტიური მიწოდებები</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeliveries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">ამჟამად გზაში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დღევანდელი</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">მიწოდებული შეკვეთები</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 წთ</div>
            <p className="text-xs text-muted-foreground mt-1">მიწოდების საშუალო დრო</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>რეალურ დროის რუკა</CardTitle>
          <CardDescription>ყველა აქტიური მიწოდების მდებარეობა</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">რუკის ინტეგრაცია (Google Maps / Mapbox)</p>
              <p className="text-sm text-muted-foreground mt-2">
                აქტიური მიმწოდებლები: {activeDeliveries.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Deliveries List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">აქტიური მიწოდებები</h2>

        {activeDeliveries.map((delivery) => (
          <Card key={delivery.orderId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{delivery.orderId}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {delivery.estimatedTime} დარჩენილი
                  </CardDescription>
                </div>
                {getStatusBadge(delivery.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">პროგრესი</span>
                  <span className="font-medium">{delivery.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${delivery.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Driver Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">მიმწოდებელი</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{delivery.driverName}</p>
                      <p className="text-sm text-muted-foreground">{delivery.driverPhone}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Phone className="h-3 w-3" />
                      დარეკვა
                    </Button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">მომხმარებელი</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{delivery.customerName}</p>
                      <p className="text-sm text-muted-foreground">{delivery.customerPhone}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Phone className="h-3 w-3" />
                      დარეკვა
                    </Button>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-sm font-medium">მისამართი</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{delivery.address}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">პროდუქტები</p>
                    <p className="font-medium">{delivery.items} ერთეული</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ჯამი</p>
                    <p className="font-bold text-lg">{delivery.totalAmount}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  დეტალები
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (if no deliveries) */}
      {activeDeliveries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">არ არის აქტიური მიწოდებები</p>
            <p className="text-sm text-muted-foreground">
              ამჟამად არცერთი მიწოდება არ მიმდინარეობს
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
