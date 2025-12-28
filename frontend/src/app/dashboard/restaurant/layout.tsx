import { verifyUserRole } from '@/lib/auth/server-auth'
import RestaurantLayoutClient from './layout-client'

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  // Verify user has restaurant role
  await verifyUserRole('restaurant')

  return <RestaurantLayoutClient>{children}</RestaurantLayoutClient>
}
