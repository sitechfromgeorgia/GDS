'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Download,
  Calendar,
  DollarSign,
  Clock,
  Star,
  MapPin,
  CheckCircle,
} from 'lucide-react'
import type { DriverDelivery } from '@/types/driver'
import { DELIVERY_STATUSES } from '@/types/driver'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

interface DeliveryHistoryItem extends DriverDelivery {
  rating?: number
  customer_feedback?: string
  tips_earned?: number
}

interface HistoryStats {
  totalDeliveries: number
  totalEarnings: number
  averageRating: number
  onTimeDeliveries: number
  totalTips: number
  averageDeliveryTime: number
}

export default function DriverHistoryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [stats, setStats] = useState<HistoryStats>({
    totalDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    onTimeDeliveries: 0,
    totalTips: 0,
    averageDeliveryTime: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  // Mock data - replace with actual API calls
  const loadHistoryData = useCallback(async () => {
    const mockDeliveries: DeliveryHistoryItem[] = [
      {
        id: '1',
        order_id: 'ORD-001',
        driver_id: 'driver-1',
        status: 'delivered',
        pickup_time: '2024-01-15T13:00:00Z',
        delivery_time: '2024-01-15T13:45:00Z',
        estimated_delivery_time: '14:00',
        actual_delivery_time: '13:45',
        delivery_address: 'თბილისი, რუსთაველის გამზირი 10',
        delivery_coordinates: { latitude: 41.7167, longitude: 44.7833 },
        customer_name: 'გიორგი მ.',
        customer_phone: '+995 555 123 456',
        delivery_fee: 3.0,
        distance_km: 2.5,
        estimated_duration_minutes: 25,
        actual_duration_minutes: 45,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T13:45:00Z',
        rating: 5,
        customer_feedback: 'სწრაფი და პროფესიონალი მომსახურება',
        tips_earned: 2.0,
        order: {
          id: 'ORD-001',
          restaurant_name: 'სამზარეულო #1',
          total_amount: 25.0,
          items: [{ product_name: 'ხორცი', quantity: 2, unit: 'კგ' }],
        },
      },
      {
        id: '2',
        order_id: 'ORD-002',
        driver_id: 'driver-1',
        status: 'delivered',
        pickup_time: '2024-01-14T14:00:00Z',
        delivery_time: '2024-01-14T14:30:00Z',
        estimated_delivery_time: '14:45',
        actual_delivery_time: '14:30',
        delivery_address: 'თბილისი, მარჯანიშვილის ქუჩა 15',
        delivery_coordinates: { latitude: 41.7267, longitude: 44.7933 },
        customer_name: 'მარიამ კ.',
        customer_phone: '+995 555 987 654',
        delivery_fee: 3.0,
        distance_km: 3.2,
        estimated_duration_minutes: 30,
        actual_duration_minutes: 30,
        created_at: '2024-01-14T13:30:00Z',
        updated_at: '2024-01-14T14:30:00Z',
        rating: 4,
        customer_feedback: 'კარგი მომსახურება',
        tips_earned: 1.5,
        order: {
          id: 'ORD-002',
          restaurant_name: 'სამზარეულო #2',
          total_amount: 18.5,
          items: [{ product_name: 'სასმელი', quantity: 6, unit: 'ლ' }],
        },
      },
      {
        id: '3',
        order_id: 'ORD-003',
        driver_id: 'driver-1',
        status: 'cancelled',
        pickup_time: undefined,
        delivery_time: undefined,
        estimated_delivery_time: '16:00',
        delivery_address: 'თბილისი, აღმაშენებლის გამზირი 5',
        delivery_coordinates: { latitude: 41.7367, longitude: 44.8033 },
        customer_name: 'ნიკა ჯ.',
        customer_phone: '+995 555 456 789',
        delivery_fee: 3.0,
        distance_km: 4.1,
        estimated_duration_minutes: 35,
        created_at: '2024-01-13T15:00:00Z',
        updated_at: '2024-01-13T15:30:00Z',
        rating: undefined,
        customer_feedback: 'შეკვეთა გაუქმდა',
        tips_earned: 0,
        order: {
          id: 'ORD-003',
          restaurant_name: 'სამზარეულო #3',
          total_amount: 32.0,
          items: [{ product_name: 'ხილი', quantity: 5, unit: 'კგ' }],
        },
      },
    ]

    setDeliveries(mockDeliveries)

    // Calculate stats
    const completedDeliveries = mockDeliveries.filter((d) => d.status === 'delivered')
    const totalEarnings = completedDeliveries.reduce(
      (sum, d) => sum + (d.delivery_fee || 0) + (d.tips_earned || 0),
      0
    )
    const totalTips = completedDeliveries.reduce((sum, d) => sum + (d.tips_earned || 0), 0)
    const averageRating =
      completedDeliveries.reduce((sum, d) => sum + (d.rating || 0), 0) / completedDeliveries.length
    const onTimeDeliveries = completedDeliveries.filter(
      (d) => (d.actual_duration_minutes || 0) <= (d.estimated_duration_minutes || 0)
    ).length
    const averageDeliveryTime =
      completedDeliveries.reduce((sum, d) => sum + (d.actual_duration_minutes || 0), 0) /
      completedDeliveries.length

    setStats({
      totalDeliveries: mockDeliveries.length,
      totalEarnings,
      averageRating: isNaN(averageRating) ? 0 : averageRating,
      onTimeDeliveries,
      totalTips,
      averageDeliveryTime: isNaN(averageDeliveryTime) ? 0 : averageDeliveryTime,
    })
  }, [])

  // Filter deliveries
  const updateFilteredDeliveries = useCallback(() => {
    let filtered = deliveries

    if (searchTerm) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((delivery) => delivery.status === statusFilter)
    }

    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter)
      filtered = filtered.filter((delivery) => delivery.rating === rating)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((delivery) => new Date(delivery.created_at) >= filterDate)
    }

    setFilteredDeliveries(filtered)
  }, [deliveries, searchTerm, statusFilter, ratingFilter, dateFilter])

  useEffect(() => {
    const initializeData = async () => {
      await loadHistoryData()
    }
    initializeData()
  }, [loadHistoryData])

  useEffect(() => {
    const updateFilters = async () => {
      await updateFilteredDeliveries()
    }
    updateFilters()
  }, [updateFilteredDeliveries])

  const exportHistory = () => {
    // Implement CSV export
    logger.info('Exporting delivery history...')
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} წთ`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}სთ ${mins}წთ`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ka })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ისტორია</h1>
          <p className="text-muted-foreground">თქვენი მიწოდებების ისტორია და სტატისტიკა</p>
        </div>
        <Button onClick={exportHistory} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          ექსპორტი
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მიწოდებები</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">სულ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შემოსავალი</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾{stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+₾{stats.totalTips.toFixed(2)} ჩაი</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">რეიტინგი</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">საშუალო</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო დრო</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averageDeliveryTime)}</div>
            <p className="text-xs text-muted-foreground">{stats.onTimeDeliveries} დროულად</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა შეკვეთის ID, მისამართი ან მომხმარებელი..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტატუსი</SelectItem>
                {Object.entries(DELIVERY_STATUSES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="პერიოდი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა დრო</SelectItem>
                <SelectItem value="today">დღეს</SelectItem>
                <SelectItem value="week">ბოლო კვირა</SelectItem>
                <SelectItem value="month">ბოლო თვე</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="რეიტინგი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                <SelectItem value="3">⭐⭐⭐</SelectItem>
                <SelectItem value="2">⭐⭐</SelectItem>
                <SelectItem value="1">⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>მიწოდებების ისტორია</CardTitle>
          <CardDescription>{filteredDeliveries.length} მიწოდება ნაპოვნია</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>შეკვეთა</TableHead>
                <TableHead>მისამართი</TableHead>
                <TableHead>დრო</TableHead>
                <TableHead>სტატუსი</TableHead>
                <TableHead>შემოსავალი</TableHead>
                <TableHead>რეიტინგი</TableHead>
                <TableHead>შეფასება</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{delivery.order_id}</div>
                      <div className="text-sm text-muted-foreground">{delivery.customer_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{delivery.delivery_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(delivery.created_at)}</div>
                      {delivery.actual_duration_minutes && (
                        <div className="text-muted-foreground">
                          {formatDuration(delivery.actual_duration_minutes)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                      <span>{DELIVERY_STATUSES[delivery.status].icon}</span>
                      <span>{DELIVERY_STATUSES[delivery.status].label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">₾{(delivery.delivery_fee || 0).toFixed(2)}</div>
                      {delivery.tips_earned && delivery.tips_earned > 0 && (
                        <div className="text-muted-foreground">
                          +₾{delivery.tips_earned.toFixed(2)} ჩაი
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.rating ? (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{delivery.rating}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate text-sm">
                      {delivery.customer_feedback || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDeliveries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>მიწოდებების ისტორია არ არის</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
