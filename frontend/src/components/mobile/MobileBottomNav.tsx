'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'
import { Home, Package, ShoppingCart, Users, BarChart3, Truck, Receipt } from 'lucide-react'

export interface MobileNavItem {
  href: string
  label: string
  icon: React.ReactNode
  activePattern?: RegExp
}

interface MobileBottomNavProps {
  items?: MobileNavItem[]
  className?: string
}

// Default navigation items for different user roles
const defaultAdminItems: MobileNavItem[] = [
  {
    href: '/dashboard/admin',
    label: 'მთავარი',
    icon: <Home className="h-5 w-5" />,
    activePattern: /^\/dashboard\/admin$/,
  },
  {
    href: '/dashboard/admin/orders',
    label: 'შეკვეთები',
    icon: <Receipt className="h-5 w-5" />,
    activePattern: /^\/dashboard\/admin\/orders/,
  },
  {
    href: '/dashboard/admin/products',
    label: 'პროდუქტები',
    icon: <Package className="h-5 w-5" />,
    activePattern: /^\/dashboard\/admin\/products/,
  },
  {
    href: '/dashboard/admin/analytics',
    label: 'ანალიტიკა',
    icon: <BarChart3 className="h-5 w-5" />,
    activePattern: /^\/dashboard\/admin\/analytics/,
  },
]

const defaultRestaurantItems: MobileNavItem[] = [
  {
    href: '/dashboard/restaurant',
    label: 'მთავარი',
    icon: <Home className="h-5 w-5" />,
    activePattern: /^\/dashboard\/restaurant$/,
  },
  {
    href: '/dashboard/restaurant/order',
    label: 'შეკვეთა',
    icon: <ShoppingCart className="h-5 w-5" />,
    activePattern: /^\/dashboard\/restaurant\/order/,
  },
  {
    href: '/dashboard/restaurant/history',
    label: 'ისტორია',
    icon: <Receipt className="h-5 w-5" />,
    activePattern: /^\/dashboard\/restaurant\/history/,
  },
]

const defaultDriverItems: MobileNavItem[] = [
  {
    href: '/dashboard/driver',
    label: 'მთავარი',
    icon: <Home className="h-5 w-5" />,
    activePattern: /^\/dashboard\/driver$/,
  },
  {
    href: '/dashboard/driver/deliveries',
    label: 'მიწოდებები',
    icon: <Truck className="h-5 w-5" />,
    activePattern: /^\/dashboard\/driver\/deliveries/,
  },
  {
    href: '/dashboard/driver/history',
    label: 'ისტორია',
    icon: <Receipt className="h-5 w-5" />,
    activePattern: /^\/dashboard\/driver\/history/,
  },
]

export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { triggerHaptic } = useHaptic()

  // Auto-detect navigation items based on current route
  const navItems =
    items ||
    (() => {
      if (pathname.startsWith('/dashboard/restaurant')) {
        return defaultRestaurantItems
      } else if (pathname.startsWith('/dashboard/driver')) {
        return defaultDriverItems
      } else if (pathname.startsWith('/dashboard/admin')) {
        return defaultAdminItems
      }
      return defaultAdminItems
    })()

  const isActive = (item: MobileNavItem) => {
    if (item.activePattern) {
      return item.activePattern.test(pathname)
    }
    return pathname === item.href
  }

  const handleClick = () => {
    triggerHaptic('light')
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-sm border-t border-border',
        'lg:hidden', // Hide on desktop
        'safe-area-inset-bottom', // iOS safe area
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                'flex flex-col items-center justify-center',
                'flex-1 h-full gap-1',
                'transition-colors duration-200',
                'active:scale-95 touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn('transition-transform duration-200', active && 'scale-110')}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Export default items for reuse
export { defaultAdminItems, defaultRestaurantItems, defaultDriverItems }
