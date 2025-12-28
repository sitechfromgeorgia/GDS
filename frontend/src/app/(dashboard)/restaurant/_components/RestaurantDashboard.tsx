
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { orderService } from '@/lib/services/restaurant/order.service'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Clock,
  CreditCard,
  ChevronRight,
  Plus,
  Package,
  ArrowUpRight,
  UtensilsCrossed,
} from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Define a type for the order based on what we expect from the service
interface Order {
  id: string
  status: string
  total_amount: number | null
  created_at: string
  items: any[]
}

export function RestaurantDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const data = await orderService.getOrders()
      setOrders(data || [])
    } catch (error) {
      logger.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(o.status)
  )
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const lastOrder = orders[0]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-600 border-amber-200 hover:bg-amber-500/25'
      case 'confirmed':
        return 'bg-blue-500/15 text-blue-600 border-blue-200 hover:bg-blue-500/25'
      case 'delivered':
        return 'bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/25'
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-600 border-rose-200 hover:bg-rose-500/25'
      default:
        return 'bg-slate-500/15 text-slate-600 border-slate-200 hover:bg-slate-500/25'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'მუშავდება',
      confirmed: 'დადასტურებული',
      priced: 'ფასდება',
      out_for_delivery: 'გზაშია',
      delivered: 'მიღებულია',
      received: 'ჩაბარებული',
      cancelled: 'გაუქმებული',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section with Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12 border border-primary/10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              გამარჯობა, <span className="text-primary">პარტნიორო</span> 👋
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              მართეთ თქვენი რესტორნის შეკვეთები და მომარაგება ერთი ფანჯრიდან.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
          >
            <Link href="/restaurant/orders">
              <Plus className="mr-2 h-5 w-5" />
              ახალი შეკვეთა
            </Link>
          </Button>
        </div>
        {/* Decorative background elements */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              აქტიური შეკვეთები
            </CardTitle>
            <div className="rounded-full bg-amber-500/10 p-2.5 text-amber-600 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">მიმდინარე პროცესში</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              სულ დახარჯული
            </CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 group-hover:scale-110 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSpent.toFixed(2)} ₾</div>
            <p className="text-xs text-muted-foreground mt-1">ჯამური ღირებულება</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ბოლო შეკვეთა
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2.5 text-blue-600 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {lastOrder ? format(new Date(lastOrder.created_at), 'd MMM', { locale: ka }) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastOrder
                ? format(new Date(lastOrder.created_at), 'HH:mm')
                : 'შეკვეთა არ ფიქსირდება'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity Section */}
        <Card className="col-span-4 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">ბოლო შეკვეთები</CardTitle>
              <CardDescription>თქვენი ბოლო 5 შეკვეთის ისტორია</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              asChild
            >
              <Link href="/restaurant/orders/history">
                ყველას ნახვა <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="group flex items-center justify-between rounded-lg border border-transparent p-3 hover:bg-muted/50 hover:border-border/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        შეკვეთა #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || 0} პროდუქტი •{' '}
                        {format(new Date(order.created_at), 'd MMM, HH:mm', { locale: ka })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold">{order.total_amount?.toFixed(2)} ₾</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-2.5 py-0.5 transition-colors',
                        getStatusColor(order.status)
                      )}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">შეკვეთები არ არის</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    თქვენ ჯერ არ გაგიფორმებიათ შეკვეთა. დაიწყეთ პროდუქტების დამატებით.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/restaurant/orders">შეკვეთის გაფორმება</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Promo Card */}
        <div className="col-span-3 space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <CardTitle>სწრაფი მოქმედებები</CardTitle>
              <CardDescription>ხშირად გამოყენებული ფუნქციები</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/restaurant/orders" className="group block">
                <div className="flex items-center rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md hover:scale-[1.02]">
                  <div className="mr-4 rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">პროდუქტების კატალოგი</div>
                    <div className="text-xs text-muted-foreground">დაათვალიერეთ და შეუკვეთეთ</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              <Link href="/restaurant/orders/history" className="group block">
                <div className="flex items-center rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md hover:scale-[1.02]">
                  <div className="mr-4 rounded-full bg-blue-500/10 p-3 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">შეკვეთების ისტორია</div>
                    <div className="text-xs text-muted-foreground">ნახეთ წინა შეკვეთები</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Promo / Info Card */}
          <Card className="border-none bg-primary text-primary-foreground overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <h3 className="text-lg font-bold mb-2">გჭირდებათ დახმარება?</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                ჩვენი მხარდაჭერის გუნდი მზადაა გიპასუხოთ ნებისმიერ კითხვაზე 24/7.
              </p>
              <Button variant="secondary" size="sm" className="w-full font-semibold">
                დაგვიკავშირდით
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
          </Card>
        </div>
      </div>
    </div>
  )
}
