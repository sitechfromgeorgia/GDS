import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, Package, Truck, AlertCircle } from 'lucide-react'

interface OrderCardProps {
  order: {
    id: string
    status: string
    created_at: string
    delivery_address: string
    delivery_notes?: string
    total_price?: number
    total_amount?: number
    restaurant?: {
      name: string
      email: string
    }
    driver?: {
      full_name: string
      phone: string
    }
  }
  onViewDetails?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function OrderCard({ order, onViewDetails, onEdit, onDelete }: OrderCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'preparing':
        return 'default'
      case 'ready':
        return 'default'
      case 'in_delivery':
        return 'default'
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'preparing':
        return <Package className="h-4 w-4" />
      case 'ready':
        return <Package className="h-4 w-4" />
      case 'in_delivery':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Restaurant</h4>
              <p className="text-sm text-gray-600">{order.restaurant?.name}</p>
              <p className="text-xs text-gray-500">{order.restaurant?.email}</p>
            </div>
            <div>
              <h4 className="font-medium">Driver</h4>
              {order.driver ? (
                <>
                  <p className="text-sm text-gray-600">{order.driver.full_name}</p>
                  <p className="text-xs text-gray-500">{order.driver.phone}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Unassigned</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium">Delivery Address</h4>
            <p className="text-sm text-gray-600">{order.delivery_address}</p>
            {order.delivery_notes && (
              <p className="text-xs text-gray-500 mt-1">Notes: {order.delivery_notes}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">
                ₾{(order.total_price || order.total_amount || 0).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails}>
                  View Details
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
