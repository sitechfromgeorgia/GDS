import { verifyUserRole } from '@/lib/auth/server-auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth check is handled by sub-layouts and page.tsx
  // This allows /dashboard/demo to be public if needed
  // await verifyUserRole()

  return <div className="min-h-screen bg-background">{children}</div>
}
