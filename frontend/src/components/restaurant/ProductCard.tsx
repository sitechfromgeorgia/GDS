import type { Product } from '@/lib/services/restaurant/product.service'
import { useCartStore } from '@/lib/store/cart.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { GEORGIAN_UNITS } from '@/lib/constants/georgian'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity,
      product,
    })
    setQuantity(1)
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <Badge variant="secondary">{product.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          ერთეული: {GEORGIAN_UNITS[product.unit as keyof typeof GEORGIAN_UNITS] || product.unit}
        </p>
      </CardContent>
      <CardFooter className="p-4 flex gap-2">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button className="flex-1" onClick={handleAddToCart}>
          დამატება
        </Button>
      </CardFooter>
    </Card>
  )
}
