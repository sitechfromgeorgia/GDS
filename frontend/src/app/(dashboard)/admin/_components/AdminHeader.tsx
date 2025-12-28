'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell } from 'lucide-react'
import { AdminSidebar, navigation } from './AdminSidebar'

export function AdminHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const currentRoute = navigation.find((item) => item.href === pathname)?.name || 'ადმინისტრატორი'

  return (
    <header className="bg-background border-b h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Mobile Menu Button */}
        <div className="md:hidden mr-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Title */}
        <h2 className="text-lg font-semibold">{currentRoute}</h2>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
