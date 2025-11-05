import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderManagementClient } from '@/components/orders/OrderManagementClient'

export default async function OrdersPage() {
  const supabase = await createServerClient()

  // Verify authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check role - only Admin and Restaurant can access orders
  const role = user.app_metadata.role

  if (role !== 'admin' && role !== 'restaurant') {
    redirect('/unauthorized')
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/profile-not-found')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Manage and track all orders in the system</p>
      </div>

      <OrderManagementClient user={profile} role={role} />
    </div>
  )
}
