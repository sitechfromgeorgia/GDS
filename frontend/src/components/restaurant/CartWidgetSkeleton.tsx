import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

export function CartWidgetSkeleton() {
  return (
    <Button variant="outline" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
    </Button>
  )
}
