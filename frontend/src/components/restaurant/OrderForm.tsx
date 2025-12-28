'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCartStore } from '@/lib/store/cart.store'
import { orderService } from '@/lib/services/restaurant/order.service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const orderSchema = z.object({
  deliveryAddress: z.string().min(5, 'მისამართი სავალდებულოა'),
  contactPhone: z.string().min(9, 'ტელეფონი სავალდებულოა'),
  comment: z.string().optional(),
})

type OrderFormValues = z.infer<typeof orderSchema>

export function OrderForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryAddress: '',
      contactPhone: '',
      comment: '',
    },
  })

  async function onSubmit(data: OrderFormValues) {
    if (items.length === 0) {
      toast.error('კალათა ცარიელია')
      return
    }

    setLoading(true)
    try {
      const totalAmount = items.reduce(
        (total, item) => total + item.product.cost_price * item.quantity,
        0
      )

      await orderService.createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.cost_price,
        })),
        totalAmount,
        deliveryAddress: data.deliveryAddress,
        contactPhone: data.contactPhone,
        comment: data.comment,
      })

      clearCart()
      toast.success('შეკვეთა წარმატებით გაიგზავნა')
      router.push('/dashboard/restaurant/orders/history')
    } catch (error) {
      console.error('Order submission error:', error)
      toast.error('შეკვეთის გაგზავნა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>მიწოდების მისამართი</FormLabel>
              <FormControl>
                <Textarea placeholder="შეიყვანეთ ზუსტი მისამართი..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>საკონტაქტო ტელეფონი</FormLabel>
              <FormControl>
                <Input placeholder="555 00 00 00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>კომენტარი (არასავალდებულო)</FormLabel>
              <FormControl>
                <Textarea placeholder="დამატებითი ინფორმაცია..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'იგზავნება...' : 'შეკვეთის დადასტურება'}
        </Button>
      </form>
    </Form>
  )
}
