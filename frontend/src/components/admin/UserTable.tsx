'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  Upload,
} from 'lucide-react'
import type { User } from '@/types/admin'
import { FilterParams, AdminAction } from '@/types/admin'
import { USER_ROLES } from '@/constants'

interface UserTableProps {
  users: User[]
  loading?: boolean
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onToggleStatus: (userId: string, isActive: boolean) => void
  onBulkAction: (action: string, userIds: string[]) => void
}

export function UserTable({
  users,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onBulkAction,
}: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === '' ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) return

    switch (action) {
      case 'activate':
        onBulkAction('activate', selectedUsers)
        break
      case 'deactivate':
        onBulkAction('deactivate', selectedUsers)
        break
      case 'delete':
        // Handle bulk delete confirmation
        break
      case 'export':
        onBulkAction('export', selectedUsers)
        break
    }
    setSelectedUsers([])
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">ადმინისტრატორი</Badge>
      case 'restaurant':
        return <Badge variant="default">რესტორანი</Badge>
      case 'driver':
        return <Badge variant="secondary">მძღოლი</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">
        <UserCheck className="w-3 h-3 mr-1" />
        აქტიური
      </Badge>
    ) : (
      <Badge variant="secondary">
        <UserX className="w-3 h-3 mr-1" />
        არააქტიური
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="მოძებნა მომხმარებლების მიხედვით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="როლი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა როლი</SelectItem>
              <SelectItem value="admin">ადმინისტრატორი</SelectItem>
              <SelectItem value="restaurant">რესტორანი</SelectItem>
              <SelectItem value="driver">მძღოლი</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="სტატუსი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა სტატუსი</SelectItem>
              <SelectItem value="active">აქტიური</SelectItem>
              <SelectItem value="inactive">არააქტიური</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
              გააქტიურება ({selectedUsers.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
              დეაქტივაცია ({selectedUsers.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
              <Download className="w-4 h-4 mr-1" />
              ექსპორტი
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>სახელი</TableHead>
              <TableHead>რესტორანი</TableHead>
              <TableHead>როლი</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead>ტელეფონი</TableHead>
              <TableHead>შექმნილი</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  მომხმარებლები არ მოიძებნა
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked: boolean) => handleSelectUser(user.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.full_name || 'უსახელო'}</TableCell>
                  <TableCell>{user.restaurant_name || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('ka-GE')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>მოქმედებები</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          რედაქტირება
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(user.id, !user.is_active)}>
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              დეაქტივაცია
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              გააქტიურება
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          წაშლა
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>მომხმარებლის წაშლა</DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ რომ გსურთ წაშალოთ მომხმარებელი "{userToDelete?.full_name}"? ეს
              მოქმედება შეუქცევადია.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              გაუქმება
            </Button>
            <Button
              onClick={() => {
                if (userToDelete) {
                  onDelete(userToDelete.id)
                  setDeleteDialogOpen(false)
                  setUserToDelete(null)
                }
              }}
              variant="destructive"
            >
              წაშლა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
