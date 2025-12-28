'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Truck,
  ChefHat,
  BarChart3,
  Menu,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react'
import { CartWidget } from '@/components/restaurant/CartWidget'
import { useToast } from '@/hooks/use-toast'

const navigation = [
  { name: 'მთავარი', href: '/dashboard/demo', icon: LayoutDashboard },
  { name: 'შეკვეთა', href: '/dashboard/demo/order', icon: ShoppingCart },
  { name: 'ისტორია', href: '/dashboard/demo/history', icon: History },
  { name: 'ანალიტიკა', href: '/dashboard/demo/analytics', icon: BarChart3 },
  { name: 'პარამეტრები', href: '/dashboard/demo/settings', icon: Settings },
]

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { toast } = useToast()
  return (
    <div className={cn('flex flex-col h-full', mobile ? 'w-full' : 'w-64')}>
      <div className="flex items-center justify-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-primary">Demo Restaurant</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={item.name === 'მთავარი' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              if (item.name !== 'მთავარი' && item.name !== 'შეკვეთა') {
                toast({
                  title: 'Demo Limitation',
                  description: 'This feature is disabled in the demo version.',
                  variant: 'default',
                })
              }
              if (onClose) onClose()
            }}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
        <Link href="/">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Exit Demo
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r bg-card">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="p-0 w-64" side="left">
          <Sidebar mobile onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 border-b bg-card md:px-6">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="ml-4 md:ml-0">
              <Badge variant="secondary">Demo Mode</Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <CartWidget isDemo />
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
