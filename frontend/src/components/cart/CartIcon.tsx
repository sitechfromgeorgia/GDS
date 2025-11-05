'use client'

import React from 'react'
import { ShoppingCart, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartContext } from '@/contexts/CartContext'
import { cn } from '@/lib/utils'

interface CartIconProps {
  className?: string
  showLabel?: boolean
  onClick?: () => void
  variant?: 'default' | 'minimal' | 'floating'
}

export function CartIcon({
  className,
  showLabel = true,
  onClick,
  variant = 'default',
}: CartIconProps) {
  const { itemCount, isCartOpen, setIsCartOpen } = useCartContext()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setIsCartOpen(!isCartOpen)
    }
  }

  const baseClasses = cn('relative transition-all duration-200', className)

  if (variant === 'floating') {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        className={cn(
          'relative h-10 w-10 rounded-full shadow-lg hover:shadow-xl',
          'bg-white border-2 border-orange-200 hover:border-orange-300',
          'transition-all duration-200 hover:scale-105',
          className
        )}
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-5 w-5 text-orange-600" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-600 text-white border-2 border-white"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    )
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn('relative', className)}
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn(
        'relative gap-2',
        'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700',
        'transition-all duration-200',
        className
      )}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-4 w-4" />
      {showLabel && <span>კალათა</span>}
      {itemCount > 0 && (
        <Badge variant="destructive" className="ml-1 bg-orange-500 hover:bg-orange-600 text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  )
}

// Floating Cart Button for mobile
export function FloatingCartButton() {
  const { itemCount, setIsCartOpen } = useCartContext()

  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <Button
        onClick={() => setIsCartOpen(true)}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg hover:shadow-xl',
          'bg-orange-500 hover:bg-orange-600 text-white',
          'transition-all duration-200 hover:scale-105',
          'flex items-center justify-center gap-0'
        )}
        aria-label={`Open cart with ${itemCount} items`}
      >
        <ShoppingCart className="h-6 w-6" />
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-white"
        >
          {itemCount > 9 ? '9+' : itemCount}
        </Badge>
      </Button>
    </div>
  )
}
