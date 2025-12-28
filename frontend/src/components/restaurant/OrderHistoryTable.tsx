import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/constants/georgian'
import Link from 'next/link'
import { Eye } from 'lucide-react'

interface OrderHistoryTableProps {
  orders: any[]
  onViewOrder?: (order: any) => void
}

export function OrderHistoryTable({ orders, onViewOrder }: OrderHistoryTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">შეკვეთები არ მოიძებნა</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>შეკვეთის ID</TableHead>
            <TableHead>თარიღი</TableHead>
            <TableHead>სტატუსი</TableHead>
            <TableHead>პროდუქტები</TableHead>
            <TableHead className="text-right">თანხა</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
              <TableCell>{formatDate(order.created_at)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {getStatusLabel(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {order.items.map((item: any) => item.product.name).join(', ')}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
              <TableCell>
                {onViewOrder ? (
                  <Button variant="ghost" size="icon" onClick={() => onViewOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/restaurant/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
