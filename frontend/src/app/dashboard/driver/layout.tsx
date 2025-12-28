import { verifyUserRole } from '@/lib/auth/server-auth'
import DriverLayoutClient from './layout-client'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  // Verify user has driver role
  await verifyUserRole('driver')

  return <DriverLayoutClient>{children}</DriverLayoutClient>
}
