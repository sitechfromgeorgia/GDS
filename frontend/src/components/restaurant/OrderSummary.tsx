import { useCartStore } from '@/lib/store/cart.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/constants/georgian'

export function OrderSummary() {
  const items = useCartStore((state) => state.items)

  const totalAmount = items.reduce(
    (total, item) => total + item.product.cost_price * item.quantity,
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>შეკვეთის შეჯამება</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <span>{formatCurrency(item.product.cost_price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>სულ:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
