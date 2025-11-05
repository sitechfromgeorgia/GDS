'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Package, Clock, CheckCircle, ExternalLink, Navigation } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Delivery {
  id: string
  orderId: string
  customerName: string
  phone: string
  address: string
  googleMapsLink: string | null
  restaurantName: string
  restaurantAddress: string
  restaurantMapsLink: string | null
  items: number
  totalAmount: string
  estimatedTime: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered'
}

export default function DriverDeliveriesPage() {
  const { toast } = useToast()

  // Mock active deliveries
  const [deliveries] = useState<Delivery[]>([
    {
      id: '1',
      orderId: 'ORD-2025-001',
      customerName: 'გიორგი მამულაშვილი',
      phone: '+995 555 123 456',
      address: 'ვაჟა-ფშაველას 45, თბილისი',
      googleMapsLink: 'https://maps.google.com/?q=41.7151,44.8271',
      restaurantName: 'Georgian Traditional Restaurant',
      restaurantAddress: 'რუსთაველის 20, თბილისი',
      restaurantMapsLink: 'https://maps.google.com/?q=41.7091,44.8015',
      items: 3,
      totalAmount: '₾89.50',
      estimatedTime: '15 წუთი',
      status: 'pending',
    },
    {
      id: '2',
      orderId: 'ORD-2025-002',
      customerName: 'ნინო ბერიძე',
      phone: '+995 555 987 654',
      address: 'აღმაშენებლის 123, თბილისი',
      googleMapsLink: 'https://maps.google.com/?q=41.7200,44.8100',
      restaurantName: 'Khinkali House',
      restaurantAddress: 'მარჯანიშვილის 5, თბილისი',
      restaurantMapsLink: 'https://maps.google.com/?q=41.7200,44.7900',
      items: 5,
      totalAmount: '₾125.00',
      estimatedTime: '20 წუთი',
      status: 'pending',
    },
  ])

  const handleCompleteDelivery = (deliveryId: string) => {
    toast({
      title: 'მიწოდება დასრულდა',
      description: 'შეკვეთა წარმატებით მიტანილია',
    })
    // TODO: Update delivery status in database
  }

  const openInMaps = (link: string | null) => {
    if (link) {
      window.open(link, '_blank')
    } else {
      toast({
        title: 'რუკა მიუწვდომელია',
        description: 'Google Maps ლინკი არ არის დამატებული',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: Delivery['status']) => {
    const statusMap = {
      pending: { label: 'მოლოდინში', variant: 'secondary' as const },
      picked_up: { label: 'აღებულია', variant: 'default' as const },
      in_transit: { label: 'გზაშია', variant: 'default' as const },
      delivered: { label: 'მიტანილია', variant: 'default' as const },
    }
    return statusMap[status]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">აქტიური მიწოდებები</h1>
        <p className="text-muted-foreground mt-2">
          თქვენი მიმდინარე შეკვეთები და მიწოდების დეტალები
        </p>
      </div>

      {/* Deliveries List */}
      <div className="grid gap-6">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ამჟამად აქტიური მიწოდებები არ არის</p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {delivery.orderId}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {delivery.items} პროდუქტი • {delivery.totalAmount}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadge(delivery.status).variant}>
                    {getStatusBadge(delivery.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Restaurant Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>რესტორანი (აღების ადგილი)</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    <p className="font-medium">{delivery.restaurantName}</p>
                    <p className="text-sm text-muted-foreground">{delivery.restaurantAddress}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => openInMaps(delivery.restaurantMapsLink)}
                    >
                      <Navigation className="h-3 w-3" />
                      რუქაზე ნახვა
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="border-t" />

                {/* Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>მომხმარებელი (მიტანის ადგილი)</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    <p className="font-medium">{delivery.customerName}</p>
                    <p className="text-sm text-muted-foreground">{delivery.address}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => openInMaps(delivery.googleMapsLink)}
                      >
                        <Navigation className="h-3 w-3" />
                        რუქაზე ნახვა
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Phone className="h-3 w-3" />
                        დარეკვა
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>სავარაუდო მიტანის დრო: {delivery.estimatedTime}</span>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCompleteDelivery(delivery.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                  მიწოდება დასრულდა
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>დღევანდელი სტატისტიკა</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">აქტიური</p>
              <p className="text-2xl font-bold">{deliveries.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">დასრულებული</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">შემოსავალი</p>
              <p className="text-2xl font-bold">₾120</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
