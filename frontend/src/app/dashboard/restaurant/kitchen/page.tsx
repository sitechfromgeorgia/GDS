'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChefHat, Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function RestaurantKitchenPage() {
  const { toast } = useToast()

  // Mock orders
  const pendingOrders = [
    {
      orderId: 'ORD-2025-004',
      customerName: 'ნინო გელაშვილი',
      items: [
        { name: 'პიცა პეპერონი', quantity: 2, notes: 'დამატებითი ყველი' },
        { name: 'ცეზარის სალათი', quantity: 1, notes: '' },
      ],
      priority: 'high',
      createdAt: '3 წუთის წინ',
      estimatedTime: '15 წუთი',
    },
    {
      orderId: 'ORD-2025-005',
      customerName: 'გიორგი ბერიძე',
      items: [
        { name: 'ბურგერი', quantity: 1, notes: 'გარეშე ხახვი' },
        { name: 'ფრი კარტოფილი', quantity: 2, notes: '' },
        { name: 'კოკა-კოლა', quantity: 2, notes: '' },
      ],
      priority: 'normal',
      createdAt: '5 წუთის წინ',
      estimatedTime: '12 წუთი',
    },
  ]

  const preparingOrders = [
    {
      orderId: 'ORD-2025-003',
      customerName: 'ანა ქავთარაძე',
      items: [
        { name: 'ხაჭაპური', quantity: 1, notes: 'კარგად გამომცხვარი' },
        { name: 'ლობიანი', quantity: 2, notes: '' },
      ],
      priority: 'normal',
      startedAt: '8 წუთის წინ',
      estimatedTime: '7 წუთი დარჩენილი',
      progress: 60,
    },
  ]

  const readyOrders = [
    {
      orderId: 'ORD-2025-002',
      customerName: 'სალომე ნიკოლეიშვილი',
      items: [
        { name: 'ქაბაბი', quantity: 3, notes: '' },
        { name: 'პური', quantity: 3, notes: '' },
      ],
      readyAt: '2 წუთის წინ',
      waitingTime: '2 წუთი',
    },
  ]

  const handleStartOrder = (orderId: string) => {
    toast({
      title: 'შეკვეთა დაწყებულია',
      description: `${orderId} - მომზადება დაწყებულია`,
    })
  }

  const handleCompleteOrder = (orderId: string) => {
    toast({
      title: 'შეკვეთა მზადაა',
      description: `${orderId} - მზად არის მიწოდებისთვის`,
    })
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">სწრაფი</Badge>
      case 'normal':
        return <Badge variant="secondary">ჩვეულებრივი</Badge>
      default:
        return <Badge>უცნობი</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">სამზარეულო</h1>
        <p className="text-muted-foreground mt-2">შეკვეთების მართვა და მომზადება</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მოლოდინში</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">დასამუშავებელი</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მზადდება</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparingOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">პროცესში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მზადაა</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">მიწოდების მოლოდინში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 წთ</div>
            <p className="text-xs text-muted-foreground mt-1">მომზადების დრო</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            მოლოდინში ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="gap-2">
            <ChefHat className="h-4 w-4" />
            მზადდება ({preparingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            მზადაა ({readyOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders */}
        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.map((order) => (
            <Card key={order.orderId} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.orderId}</CardTitle>
                    <CardDescription>{order.customerName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(order.priority)}
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {order.createdAt}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    სავარაუდო დრო: {order.estimatedTime}
                  </p>
                  <Button onClick={() => handleStartOrder(order.orderId)} className="gap-2">
                    <ChefHat className="h-4 w-4" />
                    მომზადების დაწყება
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">არ არის ახალი შეკვეთები</p>
                <p className="text-sm text-muted-foreground">ყველა შეკვეთა მუშავდება</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preparing Orders */}
        <TabsContent value="preparing" className="space-y-4">
          {preparingOrders.map((order) => (
            <Card key={order.orderId} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.orderId}</CardTitle>
                    <CardDescription>{order.customerName}</CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Timer className="h-3 w-3" />
                    {order.startedAt}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">პროგრესი</span>
                    <span className="font-medium">{order.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    დრო დარჩენილი: {order.estimatedTime}
                  </p>
                  <Button onClick={() => handleCompleteOrder(order.orderId)} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    დასრულება
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {preparingOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">არცერთი შეკვეთა არ მზადდება</p>
                <p className="text-sm text-muted-foreground">დაიწყეთ ახალი შეკვეთების მომზადება</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ready Orders */}
        <TabsContent value="ready" className="space-y-4">
          {readyOrders.map((order) => (
            <Card key={order.orderId} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.orderId}</CardTitle>
                    <CardDescription>{order.customerName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      მზადაა
                    </Badge>
                    <Badge variant="outline">{order.readyAt}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Waiting Time */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">მოლოდინში: {order.waitingTime}</p>
                  <Button variant="outline">დეტალები</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {readyOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">არ არის მზადი შეკვეთები</p>
                <p className="text-sm text-muted-foreground">დასრულებული შეკვეთები გამოჩნდება აქ</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
