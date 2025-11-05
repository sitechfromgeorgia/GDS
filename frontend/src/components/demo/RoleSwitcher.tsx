'use client'

import { useDemo } from '@/hooks/useDemo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Package, Truck } from 'lucide-react'
import { DEMO_ROLES } from '@/types/demo'

export function RoleSwitcher() {
  const { currentRole, switchRole } = useDemo()

  const roles = [
    {
      id: 'admin' as const,
      label: 'Admin',
      icon: Users,
      description: 'System administration and analytics',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    },
    {
      id: 'restaurant' as const,
      label: 'Restaurant',
      icon: Package,
      description: 'Menu management and order processing',
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
    },
    {
      id: 'driver' as const,
      label: 'Driver',
      icon: Truck,
      description: 'Delivery management and tracking',
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    },
  ]

  return (
    <div className="role-switcher bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Experience Different Roles</h2>
            <Badge variant="outline" className="text-xs">
              Demo Mode
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {roles.map((role) => {
              const Icon = role.icon
              const isActive = currentRole === role.id

              return (
                <Button
                  key={role.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchRole(role.id)}
                  className={`flex items-center gap-2 transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : role.color
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {role.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Role Description */}
        <div className="mt-2 text-sm text-gray-600">
          {roles.find((r) => r.id === currentRole)?.description}
        </div>
      </div>
    </div>
  )
}
