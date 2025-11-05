'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Package, DollarSign, Star, Clock, Users } from 'lucide-react'

export default function RestaurantAnalyticsPage() {
  // Mock data
  const stats = {
    today: {
      orders: 45,
      revenue: '₾2,345.50',
      avgOrderValue: '₾52.10',
      rating: 4.7,
      avgPrepTime: '14 წთ',
      cancelRate: '2.3%',
    },
    week: {
      orders: 312,
      revenue: '₾16,234.80',
      avgOrderValue: '₾52.03',
      rating: 4.8,
      avgPrepTime: '15 წთ',
      cancelRate: '1.8%',
    },
    month: {
      orders: 1247,
      revenue: '₾64,892.40',
      avgOrderValue: '₾52.03',
      rating: 4.8,
      avgPrepTime: '16 წთ',
      cancelRate: '2.1%',
    },
  }

  const topProducts = [
    { name: 'პიცა მარგარიტა', orders: 156, revenue: '₾7,800', trend: '+12%' },
    { name: 'ხაჭაპური', orders: 134, revenue: '₾6,700', trend: '+8%' },
    { name: 'ბურგერი', orders: 98, revenue: '₾5,880', trend: '+15%' },
    { name: 'ქაბაბი', orders: 87, revenue: '₾5,220', trend: '+5%' },
    { name: 'ცეზარის სალათი', orders: 76, revenue: '₾3,800', trend: '-2%' },
  ]

  const peakHours = [
    { hour: '12:00-13:00', orders: 23, revenue: '₾1,196' },
    { hour: '13:00-14:00', orders: 34, revenue: '₾1,768' },
    { hour: '14:00-15:00', orders: 28, revenue: '₾1,456' },
    { hour: '19:00-20:00', orders: 41, revenue: '₾2,132' },
    { hour: '20:00-21:00', orders: 38, revenue: '₾1,976' },
  ]

  const customerFeedback = [
    { category: 'ხარისხი', rating: 4.8, reviews: 156 },
    { category: 'სისწრაფე', rating: 4.6, reviews: 145 },
    { category: 'შეფუთვა', rating: 4.7, reviews: 132 },
    { category: 'კურიერი', rating: 4.9, reviews: 148 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ანალიტიკა</h1>
        <p className="text-muted-foreground mt-2">თქვენი რესტორნის მუშაობის დეტალური სტატისტიკა</p>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">დღეს</TabsTrigger>
          <TabsTrigger value="week">კვირა</TabsTrigger>
          <TabsTrigger value="month">თვე</TabsTrigger>
        </TabsList>

        {/* Today Stats */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.orders}</div>
                <p className="text-xs text-muted-foreground mt-1">+8 გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.revenue}</div>
                <p className="text-xs text-muted-foreground mt-1">+12% გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო შეკვეთა</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.avgOrderValue}</div>
                <p className="text-xs text-muted-foreground mt-1">+3% გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">45 შეფასებიდან</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მომზადების დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.avgPrepTime}</div>
                <p className="text-xs text-muted-foreground mt-1">-2 წთ გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">გაუქმების %</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.cancelRate}</div>
                <p className="text-xs text-muted-foreground mt-1">-0.5% გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Today */}
          <Card>
            <CardHeader>
              <CardTitle>ყველაზე პოპულარული პროდუქტები</CardTitle>
              <CardDescription>დღევანდელი ლიდერები</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.slice(0, 3).map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.orders} შეკვეთა</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{product.revenue}</p>
                      <p
                        className={`text-sm ${product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {product.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Week Stats */}
        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.orders}</div>
                <p className="text-xs text-muted-foreground mt-1">+15% გასული კვირის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.revenue}</div>
                <p className="text-xs text-muted-foreground mt-1">+18% გასული კვირის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო შეკვეთა</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.avgOrderValue}</div>
                <p className="text-xs text-muted-foreground mt-1">იგივე, რაც გასულ კვირაში</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">312 შეფასებიდან</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მომზადების დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.avgPrepTime}</div>
                <p className="text-xs text-muted-foreground mt-1">-1 წთ გასული კვირის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">გაუქმების %</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.cancelRate}</div>
                <p className="text-xs text-muted-foreground mt-1">-0.8% გასული კვირის შედარებით</p>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>პიკის საათები</CardTitle>
              <CardDescription>ყველაზე დატვირთული დრო</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{hour.hour}</p>
                      <p className="text-sm text-muted-foreground">{hour.orders} შეკვეთა</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{hour.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month Stats */}
        <TabsContent value="month" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.orders}</div>
                <p className="text-xs text-muted-foreground mt-1">+22% გასული თვის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.revenue}</div>
                <p className="text-xs text-muted-foreground mt-1">+25% გასული თვის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო შეკვეთა</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.avgOrderValue}</div>
                <p className="text-xs text-muted-foreground mt-1">იგივე, რაც გასულ თვეში</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">1,247 შეფასებიდან</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მომზადების დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.avgPrepTime}</div>
                <p className="text-xs text-muted-foreground mt-1">იგივე, რაც გასულ თვეში</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">გაუქმების %</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.cancelRate}</div>
                <p className="text-xs text-muted-foreground mt-1">-0.3% გასული თვის შედარებით</p>
              </CardContent>
            </Card>
          </div>

          {/* All Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>ტოპ 5 პროდუქტი</CardTitle>
              <CardDescription>ყველაზე პოპულარული პროდუქტები თვის განმავლობაში</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.orders} შეკვეთა</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{product.revenue}</p>
                      <p
                        className={`text-sm ${product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {product.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>მომხმარებელთა შეფასება</CardTitle>
              <CardDescription>კატეგორიების მიხედვით</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerFeedback.map((feedback, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{feedback.category}</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{feedback.rating}</span>
                        <span className="text-sm text-muted-foreground">({feedback.reviews})</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${(feedback.rating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
