'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Menu,
  Settings,
  Bell,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from 'next-themes'

const navigation = [
  { name: 'მთავარი', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'მომხმარებლები', href: '/dashboard/admin/users', icon: Users },
  { name: 'პროდუქტები', href: '/dashboard/admin/products', icon: Package },
  { name: 'შეკვეთები', href: '/dashboard/admin/orders', icon: ShoppingCart },
  { name: 'ანალიტიკა', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'პარამეტრები', href: '/dashboard/admin/settings', icon: Settings },
]

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn('flex flex-col h-full', mobile ? 'w-full' : 'w-64')}>
      <div className="flex items-center justify-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-primary">ადმინისტრატორი</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
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

      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
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

        <div className="mt-4 space-y-2">
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

export default function AdminNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r bg-card">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="p-0 w-64">
          <Sidebar mobile onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </Sheet>
      </div>

      {/* Page Title */}
      <div className="ml-4 md:ml-0">
        <h2 className="text-lg font-semibold">
          {navigation.find((item) => item.href === pathname)?.name || 'ადმინისტრატორი'}
        </h2>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}
