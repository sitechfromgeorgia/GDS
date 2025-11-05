'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Star,
} from 'lucide-react'

interface AnalyticsDashboardProps {
  dateRange: { from?: Date; to?: Date }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AnalyticsDashboard({ dateRange }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true)

  const [analyticsData, setAnalyticsData] = useState<any>({
    revenue: [],
    orders: [],
    customers: [],
    products: [],
    topProducts: [],
    orderStatus: [],
    revenueByCategory: [],
  })

  const setAnalyticsDataWithMock = (data: any) => {
    setAnalyticsData(data)
  }

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      const mockData = {
        revenue: [
          { month: 'იან', revenue: 45000, orders: 120 },
          { month: 'თებ', revenue: 52000, orders: 145 },
          { month: 'მარ', revenue: 48000, orders: 132 },
          { month: 'აპრ', revenue: 61000, orders: 168 },
          { month: 'მაი', revenue: 55000, orders: 152 },
          { month: 'ივნ', revenue: 67000, orders: 185 },
        ],
        orders: [
          { date: '2024-01-01', orders: 12 },
          { date: '2024-01-02', orders: 15 },
          { date: '2024-01-03', orders: 8 },
          { date: '2024-01-04', orders: 22 },
          { date: '2024-01-05', orders: 18 },
          { date: '2024-01-06', orders: 25 },
          { date: '2024-01-07', orders: 20 },
        ],
        customers: [
          { month: 'იან', new: 45, returning: 120 },
          { month: 'თებ', new: 52, returning: 135 },
          { month: 'მარ', new: 38, returning: 142 },
          { month: 'აპრ', new: 67, returning: 158 },
          { month: 'მაი', new: 43, returning: 165 },
          { month: 'ივნ', new: 71, returning: 178 },
        ],
        products: [
          { category: 'საკვები', sold: 1250, revenue: 37500 },
          { category: 'სასმელები', sold: 890, revenue: 26700 },
          { category: 'რძის პროდუქტები', sold: 650, revenue: 19500 },
          { category: 'საცხობი', sold: 420, revenue: 12600 },
          { category: 'ხილი და ბოსტნეული', sold: 380, revenue: 11400 },
        ],
        topProducts: [
          { name: 'ხაჭაპური', sold: 245, revenue: 7350 },
          { name: 'ლობიოს ხინკალი', sold: 189, revenue: 5670 },
          { name: 'ხინკალი', sold: 156, revenue: 4680 },
          { name: 'აჭარული ხაჭაპური', sold: 134, revenue: 4020 },
          { name: 'საცივი ბორშჩი', sold: 98, revenue: 2940 },
        ],
        orderStatus: [
          { name: 'დასრულებული', value: 1167, color: '#00C49F' },
          { name: 'მიტანა', value: 12, color: '#FFBB28' },
          { name: 'მზადება', value: 45, color: '#0088FE' },
          { name: 'მოლოდინში', value: 23, color: '#FF8042' },
        ],
        revenueByCategory: [
          { category: 'საკვები', revenue: 37500, percentage: 45.2 },
          { category: 'სასმელები', revenue: 26700, percentage: 32.1 },
          { category: 'რძის პროდუქტები', revenue: 19500, percentage: 23.5 },
          { category: 'სხვა', revenue: 13600, percentage: 16.4 },
        ],
      }
      setAnalyticsDataWithMock(mockData)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [dateRange])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">მიმოხილვა</TabsTrigger>
        <TabsTrigger value="sales">გაყიდვები</TabsTrigger>
        <TabsTrigger value="products">პროდუქტები</TabsTrigger>
        <TabsTrigger value="customers">მომხმარებლები</TabsTrigger>
        <TabsTrigger value="performance">წარმადობა</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>შემოსავალი და შეკვეთები</CardTitle>
              <CardDescription>თვიური სტატისტიკა</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="შემოსავალი (₾)" />
                  <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="შეკვეთები" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>შეკვეთების სტატუსი</CardTitle>
              <CardDescription>მიმდინარე შეკვეთების განაწილება</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.orderStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {}
                    {analyticsData.orderStatus.map((entry: any, index: any) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>ტოპ პროდუქტები</CardTitle>
              <CardDescription>ყველაზე პოპულარული პროდუქტები</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {}
                {analyticsData.topProducts.map((product: any, index: any) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          გაყიდული: {product.sold} ერთეული
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">{product.revenue}₾</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>შემოსავალი კატეგორიების მიხედვით</CardTitle>
              <CardDescription>კატეგორიების წილი შემოსავალში</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.revenueByCategory} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}₾`, 'შემოსავალი']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="sales" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Orders Trend */}
          <Card>
            <CardHeader>
              <CardTitle>შეკვეთების ტენდენცია</CardTitle>
              <CardDescription>ყოველდღიური შეკვეთების რაოდენობა</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.orders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>შემოსავლის ტენდენცია</CardTitle>
              <CardDescription>თვიური შემოსავლის ცვლილება</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}₾`, 'შემოსავალი']} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="products" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Performance */}
          <Card>
            <CardHeader>
              <CardTitle>პროდუქტების წარმადობა</CardTitle>
              <CardDescription>გაყიდვები კატეგორიების მიხედვით</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sold" fill="#8884d8" name="გაყიდული ერთეული" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Product Category */}
          <Card>
            <CardHeader>
              <CardTitle>შემოსავალი კატეგორიების მიხედვით</CardTitle>
              <CardDescription>კატეგორიების შემოსავლის წილი</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {}
                    {analyticsData.revenueByCategory.map((entry: any, index: any) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}₾`, 'შემოსავალი']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="customers" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Growth */}
          <Card>
            <CardHeader>
              <CardTitle>მომხმარებელთა ზრდა</CardTitle>
              <CardDescription>ახალი და დაბრუნებული მომხმარებლები</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.customers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new" stackId="a" fill="#8884d8" name="ახალი" />
                  <Bar dataKey="returning" stackId="a" fill="#82ca9d" name="დაბრუნებული" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>მომხმარებელთა მეტრიკები</CardTitle>
              <CardDescription>მნიშვნელოვანი მაჩვენებლები</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">სულ მომხმარებლები</span>
                <span className="text-2xl font-bold">3,456</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ახალი ამ თვეში</span>
                <span className="text-2xl font-bold text-green-600">+71</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">დაბრუნების მაჩვენებელი</span>
                <span className="text-2xl font-bold">78.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">საშუალო შეკვეთა</span>
                <span className="text-2xl font-bold">₾99.80</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="performance" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>სისტემის წარმადობა</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">საშუალო რეაგირების დრო</span>
                <Badge variant="default">245ms</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">უფლების დონე</span>
                <Badge variant="default">99.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">მომხმარებელთა კმაყოფილება</span>
                <Badge variant="default">4.8/5</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Fulfillment Time */}
          <Card>
            <CardHeader>
              <CardTitle>შეკვეთების შესრულება</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">საშუალო დრო</span>
                <span className="font-bold">32 წთ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">მაქსიმალური დრო</span>
                <span className="font-bold">2 სთ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">დროზე შესრულება</span>
                <span className="font-bold text-green-600">94.2%</span>
              </div>
            </CardContent>
          </Card>

          {/* Business Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>ბიზნეს მეტრიკები</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">მოგება</span>
                <span className="font-bold text-green-600">₾34,567</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">მოგების მარჟა</span>
                <span className="font-bold">27.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ROI</span>
                <span className="font-bold text-green-600">156%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
