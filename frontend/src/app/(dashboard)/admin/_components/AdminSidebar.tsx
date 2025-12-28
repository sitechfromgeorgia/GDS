'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from 'next-themes'

export const navigation = [
  { name: 'მთავარი', href: '/admin', icon: LayoutDashboard },
  { name: 'მომხმარებლები', href: '/admin/users', icon: Users },
  { name: 'პროდუქტები', href: '/admin/products', icon: Package },
  { name: 'შეკვეთები', href: '/admin/orders', icon: ShoppingCart },
  { name: 'ანალიტიკა', href: '/admin/analytics', icon: BarChart3 },
  { name: 'პარამეტრები', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', mobile ? 'w-full' : 'w-64')}>
      <div className="flex items-center justify-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-primary">ადმინისტრატორი</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && onClose?.()}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {profile?.full_name?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || 'ადმინისტრატორი'}
              </p>
              <Badge variant="secondary" className="text-xs">
                {profile?.role || 'admin'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start"
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'სინათლე' : 'მუქი'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            გასვლა
          </Button>
        </div>
      </div>
    </div>
  )
}
