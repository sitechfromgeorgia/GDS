'use client'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    full_name: '',
    restaurant_name: '',
  })

  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('პაროლები არ ემთხვევა')
      return
    }

    if (!formData.role) {
      toast.error('აირჩიეთ როლი')
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            restaurant_name: formData.role === 'restaurant' ? formData.restaurant_name : null,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast.success('რეგისტრაცია წარმატებით დასრულდა! გთხოვთ შეამოწმოთ ელ.ფოსტა დასადასტურებლად.')
        router.push('/login')
      }
    } catch (error: any) {
      logger.error('Registration error:', error)
      toast.error(error.message || 'რეგისტრაცია ვერ მოხერხდა')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>რეგისტრაცია</CardTitle>
          <CardDescription>შექმენით ანგარიში სისტემაში</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">სახელი, გვარი</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ელ. ფოსტა</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">როლი</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიეთ როლი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">რესტორანი</SelectItem>
                  <SelectItem value="driver">მძღოლი</SelectItem>
                  <SelectItem value="admin">ადმინისტრატორი</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'restaurant' && (
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">რესტორნის სახელი</Label>
                <Input
                  id="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">პაროლი</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">გაიმეორეთ პაროლი</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'რეგისტრირდება...' : 'რეგისტრაცია'}
            </Button>

            <div className="text-center text-sm">
              უკვე გაქვთ ანგარიში?{' '}
              <Button variant="link" className="p-0" onClick={() => router.push('/login')}>
                შესვლა
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
