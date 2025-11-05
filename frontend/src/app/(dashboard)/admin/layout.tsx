import { MainLayout } from '@/components/layout/MainLayout'
import AdminNavigation from './_components/AdminNavigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <AdminNavigation />
      {children}
    </MainLayout>
  )
}
