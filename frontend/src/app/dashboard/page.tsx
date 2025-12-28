/**
 * Dashboard Root Page
 *
 * Automatically redirects users to their role-specific dashboard.
 * This page handles the bare /dashboard route and ensures users
 * land on the correct dashboard based on their profile role.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { verifyUserRole } from '@/lib/auth/server-auth'

export default async function DashboardPage() {
  logger.info('--- DashboardPage Started ---')

  // Use verifyUserRole to handle auth and potential bypass
  // This will return the user (real or mock) if authenticated/bypassed
  // If not authenticated, verifyUserRole might redirect?
  // verifyUserRole redirects if requiredRole is passed and fails.
  // Here we call it without requiredRole, so it returns { user } or redirects to login if no user.
  const { user } = await verifyUserRole()

  // Determine role from metadata (bypass) or fetch from profile
  let role = user.user_metadata?.role

  if (!role) {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    logger.info('Profile:', { profile, profileError })

    if (profileError || !profile) {
      logger.info('Redirecting to /login (No Profile)')
      redirect('/login')
    }
    role = profile.role
  }

  // Redirect to role-specific dashboard
  // Use the role variable we determined above
  const finalRole = role || 'demo'
  logger.info('Redirecting to dashboard for role:', { finalRole })

  switch (finalRole) {
    case 'admin':
      redirect('/dashboard/admin')
      break
    case 'restaurant':
      redirect('/dashboard/restaurant')
      break
    case 'driver':
      redirect('/dashboard/driver')
      break
    case 'demo':
      redirect('/dashboard/demo')
      break
    default:
      // Unknown role - redirect to demo dashboard as fallback
      redirect('/dashboard/demo')
  }
}
