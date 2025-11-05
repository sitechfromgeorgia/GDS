'use client'

import { useAuth } from '@/hooks/useAuth'
import { Database } from '@/types/database'

type UserRole = Database['public']['Tables']['profiles']['Row']['role']

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  requireAuth = true,
}: RoleGuardProps) {
  const { user, profile, loading, isAuthenticated } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return fallback
  }

  // Check role permissions
  if (profile && !allowedRoles.includes(profile.role)) {
    return fallback
  }

  return <>{children}</>
}

// Convenience components for specific roles
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function RestaurantOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['restaurant']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function DriverOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['driver']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function AdminOrRestaurant({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'restaurant']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function AdminOrDriver({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'driver']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
