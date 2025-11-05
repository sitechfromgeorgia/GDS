'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Phone, Package, Clock, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DriverMapPage() {
  const { toast } = useToast()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [tracking, setTracking] = useState(false)

  useEffect(() => {
    if (tracking && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          toast({
            title: 'GPS შეცდომა',
            description: 'მდებარეობის განსაზღვრა ვერ მოხერხდა',
            variant: 'destructive',
          })
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
    return undefined
  }, [tracking, toast])

  const toggleTracking = () => {
    setTracking(!tracking)
    toast({
      title: tracking ? 'GPS გამორთულია' : 'GPS ჩართულია',
      description: tracking
        ? 'თქვენი მდებარეობა აღარ გაზიარდება'
        : 'თქვენი მდებარეობა ახლა გაზიარებულია',
    })
  }

  // Mock active delivery
  const activeDelivery = {
    orderId: 'ORD-2025-001',
    customerName: 'გიორგი მამულაშვილი',
    phone: '+995 555 123 456',
    address: 'ვაჟა-ფშაველას 45, თბილისი',
    items: 3,
    totalAmount: '₾89.50',
    estimatedTime: '15 წუთი',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS მონიტორინგი</h1>
          <p className="text-muted-foreground mt-2">თქვენი მდებარეობა და აქტიური მიწოდება</p>
        </div>
        <Button
          onClick={toggleTracking}
          variant={tracking ? 'destructive' : 'default'}
          className="gap-2"
        >
          <Navigation className="h-4 w-4" />
          {tracking ? 'GPS გამორთვა' : 'GPS ჩართვა'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Map Placeholder */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>რუკა</CardTitle>
            <CardDescription>თქვენი რეალურ დროის მდებარეობა</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">რუკის ინტეგრაცია (Google Maps / Mapbox)</p>
                {location && (
                  <div className="mt-4 text-sm">
                    <p>განედი: {location.lat.toFixed(6)}</p>
                    <p>გრძედი: {location.lng.toFixed(6)}</p>
                  </div>
                )}
                {!tracking && <p className="mt-2 text-sm text-destructive">GPS არ არის ჩართული</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              მიმდინარე მდებარეობა
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">სტატუსი</span>
                <Badge variant={tracking ? 'default' : 'secondary'}>
                  {tracking ? 'აქტიური' : 'გამორთული'}
                </Badge>
              </div>
              {location && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">განედი</span>
                    <span className="text-sm font-mono">{location.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">გრძედი</span>
                    <span className="text-sm font-mono">{location.lng.toFixed(6)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">სიზუსტე</span>
                <span className="text-sm">±10m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ბოლო განახლება</span>
                <span className="text-sm">2 წამის წინ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              აქტიური მიწოდება
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">შეკვეთის ID</p>
                <p className="font-medium">{activeDelivery.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">მომხმარებელი</p>
                <p className="font-medium">{activeDelivery.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ტელეფონი</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{activeDelivery.phone}</p>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Phone className="h-3 w-3" />
                    დარეკვა
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">მისამართი</p>
                <p className="font-medium">{activeDelivery.address}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">პროდუქტები</p>
                  <p className="font-medium">{activeDelivery.items} ერთეული</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ჯამი</p>
                  <p className="font-bold text-lg">{activeDelivery.totalAmount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>მიწოდების დრო: {activeDelivery.estimatedTime}</span>
              </div>
            </div>
            <Button className="w-full gap-2">
              <CheckCircle className="h-4 w-4" />
              მიწოდება დასრულდა
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
