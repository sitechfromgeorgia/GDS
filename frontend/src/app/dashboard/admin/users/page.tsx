'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { UserTableSkeleton } from '@/components/admin/UserTableSkeleton'
import { Button } from '@/components/ui/button'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load UserTable
// Why: Large component with complex filtering, bulk operations, and date formatting (~10-12 KB)
// Expected impact: 10-15% bundle reduction for admin users page
const UserTable = lazy(() =>
  import('@/components/admin/UserTable').then((m) => ({ default: m.UserTable }))
)
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import type { User, UserFormData } from '@/types/admin'

import { createBrowserClient } from '@/lib/supabase'
import type { Database, Profile } from '@/types/database'
import { ProfileInsert, ProfileUpdate } from '@/types/database'
import { useToast } from '@/hooks/use-toast'

// Create Supabase client instance
const supabase = createBrowserClient()

// NOTE: Using 'as any' for Supabase operations due to schema recognition issues.
// This is a temporary workaround for TypeScript errors where Supabase client
// returns 'never' types. The database operations work correctly at runtime.

// Valid role types
const VALID_ROLES = ['admin', 'restaurant', 'driver'] as const
type ValidRole = (typeof VALID_ROLES)[number]

// Helper to validate and cast role
function validateRole(role: string): ValidRole {
  return VALID_ROLES.includes(role as any) ? (role as ValidRole) : 'restaurant'
}

const userFormSchema = z.object({
  email: z.string().email('არასწორი ელ-ფოსტა'),
  password: z.string().min(6, 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო').optional(),
  full_name: z.string().min(1, 'სახელი აუცილებელია'),
  restaurant_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  google_maps_link: z.string().url('არასწორი URL').optional().or(z.literal('')),
  base_salary: z.number().min(0).optional(),
  per_delivery_rate: z.number().min(0).optional(),
  bonus_amount: z.number().min(0).optional(),
  role: z.enum(['admin', 'restaurant', 'driver']),
  is_active: z.boolean(),
})

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      restaurant_name: '',
      phone: '',
      address: '',
      google_maps_link: '',
      base_salary: 0,
      per_delivery_rate: 0,
      bonus_amount: 0,
      role: 'restaurant',
      is_active: true,
    },
  })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      // Validate and cast roles to match User type
      const validatedUsers = (data || []).map((user: Profile) => ({
        ...user,
        role: validateRole(user.role),
      })) as User[]
      setUsers(validatedUsers)
    } catch (error) {
      logger.error(
        'Error loading users:',
        error instanceof Error ? error.message : JSON.stringify(error)
      )
      toast({
        title: 'შეცდომა',
        description: 'მომხმარებლების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleCreateUser = async (data: UserFormData) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || 'temp123456', // Temporary password
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile
        const profileData = {
          id: authData.user.id,
          role: data.role,
          full_name: data.full_name,
          restaurant_name: data.restaurant_name || null,
          phone: data.phone || null,
          address: data.address || null,
          is_active: data.is_active,
        }

        const { error: profileError } = await (supabase.from('profiles') as any).insert(profileData)

        if (profileError) throw profileError

        toast({
          title: 'წარმატება',
          description: 'მომხმარებელი წარმატებით შეიქმნა',
        })

        setDialogOpen(false)
        form.reset()
        loadUsers()
      }
    } catch (error) {
      logger.error('Error creating user:', error)
      toast({
        title: 'შეცდომა',
        description: 'მომხმარებლის შექმნა ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleEditUser = async (data: UserFormData) => {
    if (!editingUser) return

    try {
      const updateData = {
        role: data.role,
        full_name: data.full_name,
        restaurant_name: data.restaurant_name || null,
        phone: data.phone || null,
        address: data.address || null,
        google_maps_link: data.google_maps_link || null,
        base_salary: data.base_salary || 0,
        per_delivery_rate: data.per_delivery_rate || 0,
        bonus_amount: data.bonus_amount || 0,
        is_active: data.is_active,
      }

      const { error } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', editingUser.id)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'მომხმარებელი წარმატებით განახლდა',
      })

      setDialogOpen(false)
      setEditingUser(null)
      form.reset()
      loadUsers()
    } catch (error) {
      logger.error('Error updating user:', error)
      toast({
        title: 'შეცდომა',
        description: 'მომხმარებლის განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete profile first
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)

      if (profileError) throw profileError

      // Delete auth user (this might not work in production without service role)
      // In production, this should be done via admin API

      toast({
        title: 'წარმატება',
        description: 'მომხმარებელი წარმატებით წაიშალა',
      })

      loadUsers()
    } catch (error) {
      logger.error('Error deleting user:', error)
      toast({
        title: 'შეცდომა',
        description: 'მომხმარებლის წაშლა ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ is_active: isActive })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: `მომხმარებელი ${isActive ? 'გააქტიურდა' : 'დეაქტივირდა'}`,
      })

      loadUsers()
    } catch (error) {
      logger.error('Error toggling user status:', error)
      toast({
        title: 'შეცდომა',
        description: 'სტატუსის შეცვლა ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleBulkAction = async (action: string, userIds: string[]) => {
    try {
      let updateData: Database['public']['Tables']['profiles']['Update'] = {}

      switch (action) {
        case 'activate':
          updateData = { is_active: true }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'export':
          // Handle export logic
          toast({
            title: 'ინფორმაცია',
            description: 'ექსპორტის ფუნქცია მალე დაემატება',
          })
          return
      }

      const { error } = await (supabase.from('profiles') as any)
        .update(updateData)
        .in('id', userIds)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: `${userIds.length} მომხმარებელი წარმატებით განახლდა`,
      })

      loadUsers()
    } catch (error) {
      logger.error('Error performing bulk action:', error)
      toast({
        title: 'შეცდომა',
        description: 'ბულქ მოქმედება ვერ შესრულდა',
        variant: 'destructive',
      })
    }
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    form.reset({
      email: '',
      password: '',
      full_name: '',
      restaurant_name: '',
      phone: '',
      address: '',
      role: 'restaurant',
      is_active: true,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    form.reset({
      email: user.email || '',
      password: '', // Don't show existing password
      full_name: user.full_name || '',
      restaurant_name: user.restaurant_name || '',
      phone: user.phone || '',
      address: user.address || '',
      google_maps_link: user.google_maps_link || '',
      base_salary: user.base_salary || 0,
      per_delivery_rate: user.per_delivery_rate || 0,
      bonus_amount: user.bonus_amount || 0,
      role: user.role,
      is_active: user.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      handleEditUser(data)
    } else {
      handleCreateUser(data)
    }
  }

  const activeUsers = users.filter((u) => u.is_active).length
  const inactiveUsers = users.filter((u) => !u.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">მომხმარებლები</h1>
          <p className="text-muted-foreground">მართეთ მომხმარებლები და მათი უფლებები</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          ახალი მომხმარებელი
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">სულ მომხმარებელი</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <UserCheck className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{activeUsers}</p>
            <p className="text-sm text-muted-foreground">აქტიური</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <UserX className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold">{inactiveUsers}</p>
            <p className="text-sm text-muted-foreground">არააქტიური</p>
          </div>
        </div>
      </div>

      {/* User Table */}
      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable
          users={users}
          loading={loading}
          onEdit={openEditDialog}
          onDelete={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onBulkAction={handleBulkAction}
        />
      </Suspense>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'მომხმარებლის რედაქტირება' : 'ახალი მომხმარებელი'}
            </DialogTitle>
            <DialogDescription>შეავსეთ მომხმარებლის დეტალები</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ელ-ფოსტა</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={Boolean(editingUser)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!editingUser && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>პაროლი</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>სახელი</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>როლი</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="აირჩიეთ როლი" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurant">რესტორანი</SelectItem>
                        <SelectItem value="driver">მძღოლი</SelectItem>
                        <SelectItem value="admin">ადმინისტრატორი</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('role') === 'restaurant' && (
                <>
                  <FormField
                    control={form.control}
                    name="restaurant_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>რესტორანის სახელი</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="google_maps_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps ლინკი</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://maps.google.com/?q=..." />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Google Maps-დან დააკოპირეთ მდებარეობის ლინკი
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch('role') === 'driver' && (
                <>
                  <FormField
                    control={form.control}
                    name="base_salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>საბაზისო ხელფასი (₾)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          თვიური/საათობრივი საბაზისო ანაზღაურება
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="per_delivery_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ტარიფი თითო მიწოდებაზე (₾)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          გადასახადი ყოველი მიწოდებისთვის
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bonus_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ბონუსი (₾)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          შესრულებაზე დაფუძნებული ბონუსი
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ტელეფონი</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>მისამართი</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  გაუქმება
                </Button>
                <Button type="submit">{editingUser ? 'განახლება' : 'შექმნა'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
