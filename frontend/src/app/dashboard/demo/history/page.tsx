'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Filter, Download } from 'lucide-react'
import { RestaurantUtils } from '@/lib/restaurant-utils'

const MOCK_HISTORY = [
  { id: 'ORD-001', date: '2024-03-20', total: 150.5, status: 'completed', items: 5 },
  { id: 'ORD-002', date: '2024-03-19', total: 75.2, status: 'completed', items: 3 },
  { id: 'ORD-003', date: '2024-03-18', total: 230.0, status: 'cancelled', items: 8 },
  { id: 'ORD-004', date: '2024-03-17', total: 45.0, status: 'completed', items: 2 },
  { id: 'ORD-005', date: '2024-03-16', total: 120.0, status: 'completed', items: 4 },
]

export default function DemoHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">შეკვეთების ისტორია</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          ექსპორტი
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ისტორია</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ძებნა..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>შეკვეთის ID</TableHead>
                <TableHead>თარიღი</TableHead>
                <TableHead>რაოდენობა</TableHead>
                <TableHead>თანხა</TableHead>
                <TableHead>სტატუსი</TableHead>
                <TableHead className="text-right">მოქმედება</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_HISTORY.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.items} პროდუქტი</TableCell>
                  <TableCell>{RestaurantUtils.formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'completed' ? 'default' : 'destructive'}>
                      {order.status === 'completed' ? 'დასრულებული' : 'გაუქმებული'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      ნახვა
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
