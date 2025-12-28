import { verifyUserRole } from '@/lib/auth/server-auth'
import AdminLayoutClient from './layout-client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verify user has admin role
  await verifyUserRole('admin')

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
