'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { UserTableSkeleton } from '@/components/admin/UserTableSkeleton'
import { UserModal } from '@/components/admin/UserModal'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load UserTable
// Why: Large component with complex filtering, bulk operations, and date formatting (~10-12 KB)
// Expected impact: 10-15% bundle reduction for admin users page
const UserTable = lazy(() =>
  import('@/components/admin/UserTable').then((m) => ({ default: m.UserTable }))
)
import { userService } from '@/lib/services/admin/user.service'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { User, UserFormData } from '@/types/admin'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      logger.error('Failed to load users:', error)
      toast.error('მომხმარებლების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId)
      toast.success('მომხმარებელი წარმატებით წაიშალა')
      loadUsers()
    } catch (error) {
      logger.error('Failed to delete user:', error)
      toast.error('მომხმარებლის წაშლა ვერ მოხერხდა')
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await userService.toggleUserStatus(userId, isActive)
      toast.success('სტატუსი წარმატებით შეიცვალა')
      loadUsers()
    } catch (error) {
      logger.error('Failed to toggle user status:', error)
      toast.error('სტატუსის შეცვლა ვერ მოხერხდა')
    }
  }

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, data)
        toast.success('მომხმარებელი წარმატებით განახლდა')
      } else {
        // TODO: Implement user creation with Auth
        // For now, we'll show a toast that it's not fully implemented
        // await userService.createUser(data)
        toast.info(
          'ახალი მომხმარებლის დამატება დროებით შეზღუდულია (საჭიროებს სერვერის მხარდაჭერას)'
        )
        return
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (error) {
      logger.error('Failed to save user:', error)
      toast.error('მომხმარებლის შენახვა ვერ მოხერხდა')
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
          <h1 className="text-3xl font-bold">მომხმარებლები</h1>
          <p className="text-muted-foreground">სისტემის მომხმარებლების მართვა</p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="mr-2 h-4 w-4" />
          დამატება
        </Button>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable
          users={users}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onBulkAction={handleBulkAction}
        />
      </Suspense>

      <UserModal
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
