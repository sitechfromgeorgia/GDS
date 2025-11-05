'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Package, Clock, DollarSign, Star, Award, Target, Wallet } from 'lucide-react'

export default function DriverAnalyticsPage() {
  // Mock driver compensation data
  const compensation = {
    baseSalary: 800,
    perDeliveryRate: 5,
    bonusAmount: 150,
  }

  // Mock data
  const stats = {
    today: {
      deliveries: 12,
      earnings: 12 * compensation.perDeliveryRate,
      averageTime: '18 წთ',
      rating: 4.8,
    },
    week: {
      deliveries: 78,
      earnings: 78 * compensation.perDeliveryRate,
      averageTime: '19 წთ',
      rating: 4.7,
    },
    month: {
      deliveries: 324,
      earnings:
        compensation.baseSalary + 324 * compensation.perDeliveryRate + compensation.bonusAmount,
      averageTime: '20 წთ',
      rating: 4.8,
    },
  }

  const recentDeliveries = [
    { id: 'ORD-001', time: '14:30', duration: '15 წთ', amount: '₾45.50', rating: 5 },
    { id: 'ORD-002', time: '15:15', duration: '22 წთ', amount: '₾67.20', rating: 5 },
    { id: 'ORD-003', time: '16:00', duration: '18 წთ', amount: '₾34.80', rating: 4 },
    { id: 'ORD-004', time: '16:45', duration: '20 წთ', amount: '₾52.00', rating: 5 },
    { id: 'ORD-005', time: '17:30', duration: '16 წთ', amount: '₾35.00', rating: 5 },
  ]

  const achievements = [
    {
      title: 'სწრაფი მიმწოდებელი',
      description: '50+ მიწოდება 15 წუთში',
      icon: Award,
      earned: true,
    },
    {
      title: 'კმაყოფილი კლიენტები',
      description: '4.8+ რეიტინგი 100 მიწოდებაზე',
      icon: Star,
      earned: true,
    },
    { title: 'მარათონელი', description: '500+ შესრულებული მიწოდება', icon: Target, earned: false },
    {
      title: 'პიკის ვარსკვლავი',
      description: '30+ მიწოდება პიკის საათებში',
      icon: TrendingUp,
      earned: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ანალიტიკა</h1>
        <p className="text-muted-foreground mt-2">თქვენი მუშაობის სტატისტიკა და მიღწევები</p>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">დღეს</TabsTrigger>
          <TabsTrigger value="week">კვირა</TabsTrigger>
          <TabsTrigger value="month">თვე</TabsTrigger>
        </TabsList>

        {/* Today Stats */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მიწოდებები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.deliveries}</div>
                <p className="text-xs text-muted-foreground mt-1">+2 გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">დღევანდელი ანაზღაურება</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₾{stats.today.earnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.today.deliveries} მიწოდება × ₾{compensation.perDeliveryRate}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.averageTime}</div>
                <p className="text-xs text-muted-foreground mt-1">-2 წთ გუშინდელთან შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">12 შეფასებიდან</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle>დღევანდელი მიწოდებები</CardTitle>
              <CardDescription>თქვენი ბოლო 5 მიწოდება</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{delivery.id}</p>
                        <p className="text-sm text-muted-foreground">{delivery.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">ხანგრძლივობა</p>
                        <p className="font-medium">{delivery.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">თანხა</p>
                        <p className="font-medium">{delivery.amount}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{delivery.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Week Stats */}
        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მიწოდებები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.deliveries}</div>
                <p className="text-xs text-muted-foreground mt-1">+8% გასული კვირის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">კვირის ანაზღაურება</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₾{stats.week.earnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.week.deliveries} მიწოდება × ₾{compensation.perDeliveryRate}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.averageTime}</div>
                <p className="text-xs text-muted-foreground mt-1">-1 წთ გასული კვირის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">78 შეფასებიდან</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Month Stats */}
        <TabsContent value="month" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">მიწოდებები</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.deliveries}</div>
                <p className="text-xs text-muted-foreground mt-1">+18% გასული თვის შედარებით</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">თვიური ანაზღაურება</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₾{stats.month.earnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  სრული ხელფასი + მიწოდებები + ბონუსი
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.averageTime}</div>
                <p className="text-xs text-muted-foreground mt-1">იგივე, რაც გასულ თვეს</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.month.rating}</div>
                <p className="text-xs text-muted-foreground mt-1">324 შეფასებიდან</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Salary Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                თვიური ხელფასის დეტალური ანგარიში
              </CardTitle>
              <CardDescription>თქვენი ანაზღაურების სრული დაშლა</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <p className="font-medium">საბაზისო ხელფასი</p>
                    <p className="text-sm text-muted-foreground">თვიური ფიქსირებული ანაზღაურება</p>
                  </div>
                  <p className="text-lg font-bold">₾{compensation.baseSalary.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <p className="font-medium">მიწოდებებიდან ანაზღაურება</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.month.deliveries} მიწოდება × ₾{compensation.perDeliveryRate.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    ₾{(stats.month.deliveries * compensation.perDeliveryRate).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <p className="font-medium">ბონუსი</p>
                    <p className="text-sm text-muted-foreground">შესრულებაზე დაფუძნებული ბონუსი</p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    +₾{compensation.bonusAmount.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 bg-primary/5 p-4 rounded-lg">
                  <div>
                    <p className="text-lg font-bold">სულ ხელფასი</p>
                    <p className="text-sm text-muted-foreground">
                      მიმდინარე თვის მთლიანი ანაზღაურება
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ₾{stats.month.earnings.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">საშუალო დღიური</p>
                    <p className="text-xl font-bold">₾{(stats.month.earnings / 30).toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">თითო მიწოდებაზე</p>
                    <p className="text-xl font-bold">
                      ₾{(stats.month.earnings / stats.month.deliveries).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>მიღწევები</CardTitle>
          <CardDescription>თქვენი ჯილდოები და მიღწევები</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    achievement.earned ? 'bg-primary/5 border-primary' : 'bg-muted/50 border-muted'
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      achievement.earned
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.earned && <p className="text-xs text-primary mt-1">✓ მიღწეული</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
