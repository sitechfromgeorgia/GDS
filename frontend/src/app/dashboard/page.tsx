/**
 * Dashboard Root Page
 *
 * Automatically redirects users to their role-specific dashboard.
 * This page handles the bare /dashboard route and ensures users
 * land on the correct dashboard based on their profile role.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If not authenticated, redirect to login
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If profile not found or error, redirect to login
  if (profileError || !profile) {
    redirect('/login')
  }

  // Redirect to role-specific dashboard
  const role = profile.role || 'demo'

  switch (role) {
    case 'admin':
      redirect('/dashboard/admin')
    case 'restaurant':
      redirect('/dashboard/restaurant')
    case 'driver':
      redirect('/dashboard/driver')
    case 'demo':
      redirect('/dashboard/demo')
    default:
      // Unknown role - redirect to demo dashboard as fallback
      redirect('/dashboard/demo')
  }
}
