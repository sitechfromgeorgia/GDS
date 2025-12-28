import { verifyUserRole } from '@/lib/auth/server-auth'
import { AdminSidebar } from './_components/AdminSidebar'
import { AdminHeader } from './_components/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyUserRole('admin')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
