'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MapPin, Phone, User, Store, Truck, Calendar, DollarSign } from 'lucide-react'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row'] & {
  restaurants: { full_name: string | null; phone: string | null; address: string | null } | null
  drivers: { full_name: string | null; phone: string | null } | null
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: { name: string; unit: string } | null
  })[]
}

interface OrderDetailsProps {
  orderId: string
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          restaurants:profiles!restaurant_id(full_name, phone, address),
          drivers:profiles!driver_id(full_name, phone),
          order_items(
            *,
            products(name, unit)
          )
        `
        )
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Cast to unknown first to avoid complex type matching issues with deep joins
      setOrder(data as unknown as Order)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast({
        title: 'შეცდომა',
        description: 'შეკვეთის დეტალების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [orderId, supabase, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true)
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'სტატუსი განახლდა',
      })
      fetchOrder()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'შეცდომა',
        description: 'სტატუსის განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const [drivers, setDrivers] = useState<{ id: string; full_name: string | null }[]>([])
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  const fetchDrivers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'driver')
      .eq('is_active', true)

    if (data) setDrivers(data)
  }, [supabase])

  useEffect(() => {
    if (isAssignDialogOpen) {
      fetchDrivers()
    }
  }, [isAssignDialogOpen, fetchDrivers])

  const handleAssignDriver = async (driverId: string) => {
    try {
      setAssigningDriver(true)
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'მძღოლი მიენიჭა',
      })
      setIsAssignDialogOpen(false)
      fetchOrder()
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast({
        title: 'შეცდომა',
        description: 'მძღოლის მინიჭება ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setAssigningDriver(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-10">შეკვეთა ვერ მოიძებნა</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">შეკვეთა #{order.id.slice(0, 8)}</h2>
          <p className="text-muted-foreground">
            {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ka })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Truck className="mr-2 h-4 w-4" />
                მძღოლის მინიჭება
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>მძღოლის არჩევა</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {drivers.length === 0 ? (
                  <p className="text-center text-muted-foreground">აქტიური მძღოლები არ მოიძებნა</p>
                ) : (
                  <div className="grid gap-2">
                    {drivers.map((driver) => (
                      <Button
                        key={driver.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleAssignDriver(driver.id)}
                        disabled={assigningDriver}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {driver.full_name || 'უცნობი მძღოლი'}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Select value={order.status} onValueChange={handleStatusChange} disabled={updating}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="სტატუსი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">მოლოდინში</SelectItem>
              <SelectItem value="confirmed">დადასტურებული</SelectItem>
              <SelectItem value="priced">ფასდადებული</SelectItem>
              <SelectItem value="assigned">მინიჭებული</SelectItem>
              <SelectItem value="out_for_delivery">გატანილია</SelectItem>
              <SelectItem value="delivered">მიტანილია</SelectItem>
              <SelectItem value="completed">დასრულებული</SelectItem>
              <SelectItem value="cancelled">გაუქმებული</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrder}>
            განახლება
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              მომხმარებელი
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{order.delivery_address}</span>
            </div>
            {order.delivery_notes && (
              <div className="text-muted-foreground pl-6">შენიშვნა: {order.delivery_notes}</div>
            )}
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" />
              რესტორანი
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">{order.restaurants?.full_name || 'უცნობი'}</div>
            {order.restaurants?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.restaurants.phone}</span>
              </div>
            )}
            {order.restaurants?.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.restaurants.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              მძღოლი
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.drivers ? (
              <>
                <div className="font-medium">{order.drivers.full_name}</div>
                {order.drivers.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.drivers.phone}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground italic">მძღოლი არ არის მინიჭებული</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>შეკვეთის დეტალები</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>პროდუქტი</TableHead>
                <TableHead className="text-right">რაოდენობა</TableHead>
                <TableHead className="text-right">ერთ. ფასი</TableHead>
                <TableHead className="text-right">სულ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.products?.name || 'უცნობი პროდუქტი'}</div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground">{item.notes}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.products?.unit}
                  </TableCell>
                  <TableCell className="text-right">{item.unit_price.toFixed(2)}₾</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.subtotal.toFixed(2)}₾
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  სულ:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {order.total_amount.toFixed(2)}₾
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
