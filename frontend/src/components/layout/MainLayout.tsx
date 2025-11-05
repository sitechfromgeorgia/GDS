'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Package, Users, Truck } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut, isAdmin, isRestaurant, isDriver } = useAuth()

  const getRoleIcon = () => {
    if (isAdmin()) return <Users className="h-4 w-4" />
    if (isRestaurant()) return <Package className="h-4 w-4" />
    if (isDriver()) return <Truck className="h-4 w-4" />
    return null
  }

  const getRoleText = () => {
    if (isAdmin()) return 'ადმინისტრატორი'
    if (isRestaurant()) return 'რესტორანი'
    if (isDriver()) return 'მძღოლი'
    return 'უცნობი'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Georgian Distribution System</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                {getRoleIcon()}
                {getRoleText()}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.restaurant_name || 'მომხმარებელი'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                გასვლა
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
