'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { User, UserFormData } from '@/types/admin'

const userSchema = z.object({
  full_name: z.string().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს'),
  email: z.string().email('არასწორი ელ-ფოსტის ფორმატი'),
  password: z
    .string()
    .min(6, 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'restaurant', 'driver']),
  restaurant_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  base_salary: z.coerce.number().default(0),
  per_delivery_rate: z.coerce.number().default(0),
  bonus_amount: z.coerce.number().default(0),
  is_active: z.boolean(),
})

interface UserModalProps {
  user?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UserFormData) => Promise<void>
}

export function UserModal({ user, open, onOpenChange, onSubmit }: UserModalProps) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'restaurant',
      restaurant_name: '',
      phone: '',
      address: '',
      base_salary: 0,
      per_delivery_rate: 0,
      bonus_amount: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '', // Don't populate password on edit
        role: user.role as 'admin' | 'restaurant' | 'driver',
        restaurant_name: user.restaurant_name || '',
        phone: user.phone || '',
        address: user.address || '',
        base_salary: user.base_salary || 0,
        per_delivery_rate: user.per_delivery_rate || 0,
        bonus_amount: user.bonus_amount || 0,
        is_active: user.is_active,
      })
    } else {
      form.reset({
        full_name: '',
        email: '',
        password: '',
        role: 'restaurant',
        restaurant_name: '',
        phone: '',
        address: '',
        base_salary: 0,
        per_delivery_rate: 0,
        bonus_amount: 0,
        is_active: true,
      })
    }
  }, [user, form, open])

  const handleSubmit = async (values: z.infer<typeof userSchema>) => {
    await onSubmit(values)
    onOpenChange(false)
  }

  const role = form.watch('role')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'მომხმარებლის რედაქტირება' : 'ახალი მომხმარებელი'}</DialogTitle>
          <DialogDescription>შეიყვანეთ მომხმარებლის მონაცემები.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>სახელი, გვარი</FormLabel>
                    <FormControl>
                      <Input placeholder="გიორგი გიორგაძე" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ელ-ფოსტა</FormLabel>
                    <FormControl>
                      <Input placeholder="giorgi@example.com" {...field} disabled={Boolean(user)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!user && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>პაროლი</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ტელეფონი</FormLabel>
                    <FormControl>
                      <Input placeholder="555 12 34 56" {...field} />
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
                        <SelectItem value="admin">ადმინისტრატორი</SelectItem>
                        <SelectItem value="restaurant">რესტორანი</SelectItem>
                        <SelectItem value="driver">მძღოლი</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>აქტიური</FormLabel>
                      <FormDescription>
                        მომხმარებელს ექნება სისტემაში შესვლის უფლება
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>მისამართი</FormLabel>
                  <FormControl>
                    <Input placeholder="თბილისი, რუსთაველის 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'restaurant' && (
              <FormField
                control={form.control}
                name="restaurant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>რესტორნის სახელი</FormLabel>
                    <FormControl>
                      <Input placeholder="რესტორანი 'გემრიელი'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === 'driver' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">მძღოლის დეტალები</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="base_salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ფიქსირებული ხელფასი</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="per_delivery_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ტარიფი შეკვეთაზე</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bonus_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ბონუსი</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                გაუქმება
              </Button>
              <Button type="submit">{user ? 'შენახვა' : 'დამატება'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
