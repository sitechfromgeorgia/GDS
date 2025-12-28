'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { logger } from '@/lib/logger'
import { UserTableSkeleton } from '@/components/admin/UserTableSkeleton'
import { UserModal } from '@/components/admin/UserModal'
import { userService } from '@/lib/services/admin/user.service'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { User, UserFormData } from '@/types/admin'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load UserTable
// Why: Large table component with complex user management, filtering, and role handling (~11-13 KB)
// Expected impact: 12-15% bundle reduction for drivers page
const UserTable = lazy(() =>
  import('@/components/admin/UserTable').then((m) => ({ default: m.UserTable }))
)

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null)

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const data = await userService.getUsers({ role: 'driver' })
      setDrivers(data)
    } catch (error) {
      logger.error('Failed to load drivers:', error)
      toast.error('მძღოლების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDrivers()
  }, [])

  const handleCreateDriver = () => {
    setSelectedDriver(null)
    setIsModalOpen(true)
  }

  const handleEditDriver = (driver: User) => {
    setSelectedDriver(driver)
    setIsModalOpen(true)
  }

  const handleDeleteDriver = async (userId: string) => {
    try {
      await userService.deleteUser(userId)
      toast.success('მძღოლი წარმატებით წაიშალა')
      await loadDrivers()
    } catch (error) {
      logger.error('Failed to delete driver:', error)
      toast.error('მძღოლის წაშლა ვერ მოხერხდა')
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await userService.toggleUserStatus(userId, isActive)
      toast.success('სტატუსი წარმატებით შეიცვალა')
      await loadDrivers()
    } catch (error) {
      logger.error('Failed to toggle driver status:', error)
      toast.error('სტატუსის შეცვლა ვერ მოხერხდა')
    }
  }

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      if (selectedDriver) {
        await userService.updateUser(selectedDriver.id, data)
        toast.success('მძღოლი წარმატებით განახლდა')
      } else {
        // TODO: Implement user creation with Auth
        toast.info('ახალი მძღოლის დამატება დროებით შეზღუდულია (საჭიროებს სერვერის მხარდაჭერას)')
        return
      }
      setIsModalOpen(false)
      await loadDrivers()
    } catch (error) {
      logger.error('Failed to save driver:', error)
      toast.error('მძღოლის შენახვა ვერ მოხერხდა')
    }
  }

  const handleBulkAction = (action: string, userIds: string[]) => {
    logger.info('Bulk action:', { action, userIds })
    toast.info('ჯგუფური მოქმედებები მალე დაემატება')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">მძღოლები</h1>
          <p className="text-muted-foreground">სისტემის მძღოლების მართვა</p>
        </div>
        <Button onClick={handleCreateDriver}>
          <Plus className="mr-2 h-4 w-4" />
          დამატება
        </Button>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable
          users={drivers}
          loading={loading}
          onEdit={handleEditDriver}
          onDelete={handleDeleteDriver}
          onToggleStatus={handleToggleStatus}
          onBulkAction={handleBulkAction}
        />
      </Suspense>

      <UserModal
        user={selectedDriver}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
