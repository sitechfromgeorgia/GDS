'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Package, Users, Truck } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut, isAdmin, isRestaurant, isDriver } = useAuth()
  const { t } = useLanguage()

  const getRoleIcon = () => {
    if (isAdmin()) return <Users className="h-4 w-4" />
    if (isRestaurant()) return <Package className="h-4 w-4" />
    if (isDriver()) return <Truck className="h-4 w-4" />
    return null
  }

  const getRoleText = () => {
    if (isAdmin()) return t('common.admin')
    if (isRestaurant()) return t('common.restaurant')
    if (isDriver()) return t('common.driver')
    return t('common.unknown')
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
              <LanguageSwitcher />
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.restaurant_name || t('common.user')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
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
