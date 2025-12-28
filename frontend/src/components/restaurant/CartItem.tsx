import type { CartItem as CartItemType } from '@/lib/store/cart.store'
import { useCartStore } from '@/lib/store/cart.store'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { GEORGIAN_UNITS } from '@/lib/constants/georgian'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <div className="flex items-center gap-4 py-4 border-b last:border-0">
      <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{item.product.name}</h4>
        <p className="text-sm text-muted-foreground">
          {GEORGIAN_UNITS[item.product.unit as keyof typeof GEORGIAN_UNITS] || item.product.unit}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md h-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => removeItem(item.productId)}
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
