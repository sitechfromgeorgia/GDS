'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  CalendarIcon,
  BarChart3,
  Activity,
} from 'lucide-react'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [timeRange, setTimeRange] = useState('30d')
  const { toast } = useToast()

  const handleExportAnalytics = () => {
    toast({
      title: 'ექსპორტი',
      description: 'ანალიტიკის ექსპორტი მიმდინარეობს...',
    })
  }

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    const now = new Date()

    switch (range) {
      case '7d':
        setDateRange({
          from: new Date(now.setDate(now.getDate() - 7)),
          to: new Date(),
        })
        break
      case '30d':
        setDateRange({
          from: new Date(now.setDate(now.getDate() - 30)),
          to: new Date(),
        })
        break
      case '90d':
        setDateRange({
          from: new Date(now.setDate(now.getDate() - 90)),
          to: new Date(),
        })
        break
      case '1y':
        setDateRange({
          from: new Date(now.setFullYear(now.getFullYear() - 1)),
          to: new Date(),
        })
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">ანალიტიკა</h1>
          <p className="text-muted-foreground">სისტემის მუშაობის სტატისტიკა და ანგარიშები</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAnalytics}>
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ შემოსავალი</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾124,567</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              წინა პერიოდთან შედარებით
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2%
              </span>
              წინა პერიოდთან შედარებით
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მომხმარებლები</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.3%
              </span>
              წინა პერიოდთან შედარებით
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო შეკვეთა</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾99.80</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1%
              </span>
              წინა პერიოდთან შედარებით
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>პერიოდის არჩევა</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 დღე</SelectItem>
                  <SelectItem value="30d">30 დღე</SelectItem>
                  <SelectItem value="90d">90 დღე</SelectItem>
                  <SelectItem value="1y">1 წელი</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange?.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy', { locale: ka })} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy', { locale: ka })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy', { locale: ka })
                      )
                    ) : (
                      'თარიღის შერჩევა'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Activity className="mr-1 h-3 w-3" />
                რეალურ დროში
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard dateRange={dateRange || { from: undefined, to: undefined }} />
    </div>
  )
}
