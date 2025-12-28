'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  Truck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { ORDER_SUBMISSION_GEORGIAN } from '@/types/order-submission'

interface CheckoutFormProps {
  onSubmit: (formData: CheckoutFormData) => void
  isLoading?: boolean
  validationErrors?: string[]
  initialData?: Partial<CheckoutFormData>
}

export interface CheckoutFormData {
  contactPhone: string
  deliveryAddress: string
  specialInstructions: string
  preferredDeliveryDate: string
  paymentMethod: 'cash' | 'card' | 'transfer'
  priority: 'normal' | 'urgent'
}

export default function CheckoutForm({
  onSubmit,
  isLoading = false,
  validationErrors = [],
  initialData = {},
}: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    contactPhone: initialData.contactPhone || '',
    deliveryAddress: initialData.deliveryAddress || '',
    specialInstructions: initialData.specialInstructions || '',
    preferredDeliveryDate: initialData.preferredDeliveryDate || '',
    paymentMethod: initialData.paymentMethod || 'cash',
    priority: initialData.priority || 'normal',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Phone validation
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'ტელეფონის ნომერი აუცილებელია'
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.contactPhone.replace(/[\s-]/g, ''))) {
      newErrors.contactPhone = 'ტელეფონის ნომერი არასწორია'
    }

    // Address validation
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'მიწოდების მისამართი აუცილებელია'
    } else if (formData.deliveryAddress.length < 10) {
      newErrors.deliveryAddress = 'მიწოდების მისამართი ძალიან მოკლეა'
    }

    // Delivery date validation (optional but if provided, should be in future)
    if (formData.preferredDeliveryDate) {
      const deliveryDate = new Date(formData.preferredDeliveryDate)
      const now = new Date()
      if (deliveryDate <= now) {
        newErrors.preferredDeliveryDate = 'მოსალოდნელი მიწოდების თარიღი უნდა იყოს მომავალში'
      }
    }

    // Special instructions validation
    if (formData.specialInstructions.length > 500) {
      newErrors.specialInstructions =
        'განსაკუთრებული ინსტრუქციები ძალიან გრძელია (მაქსიმუმ 500 სიმბოლო)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const formatPhoneForInput = (phone: string) => {
    // Remove all non-digits and + signs
    const cleaned = phone.replace(/[^\d+]/g, '')

    // Format Georgian numbers
    if (cleaned.startsWith('+995')) {
      return cleaned // Keep international format
    } else if (cleaned.startsWith('995')) {
      return `+${cleaned}` // Add + if missing
    } else if (cleaned.startsWith('0')) {
      return `+995${cleaned.substring(1)}` // Replace 0 with +995
    } else if (cleaned.length >= 9) {
      return `+995${cleaned}` // Assume Georgian number
    }

    return phone
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1) // Add 1 hour as minimum
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  }

  const getNextHour = () => {
    const nextHour = new Date()
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    return nextHour.toISOString().slice(0, 16)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            კონტაქტული ინფორმაცია
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">ტელეფონის ნომერი *</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+995 XXX XXX XXX"
              value={formatPhoneForInput(formData.contactPhone)}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              className={errors.contactPhone ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.contactPhone && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.contactPhone}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            მიწოდების ინფორმაცია
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">მიწოდების მისამართი *</Label>
            <Textarea
              id="deliveryAddress"
              placeholder="ჩაწერეთ სრული მისამართი რუქისა და ქუჩის დასახელებით"
              value={formData.deliveryAddress}
              onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
              className={errors.deliveryAddress ? 'border-red-500' : ''}
              rows={3}
              disabled={isLoading}
            />
            {errors.deliveryAddress && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.deliveryAddress}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredDeliveryDate">
              მოსალოდნელი მიწოდების თარიღი (არასავალდებულო)
            </Label>
            <Input
              id="preferredDeliveryDate"
              type="datetime-local"
              min={getCurrentDateTime()}
              value={formData.preferredDeliveryDate}
              onChange={(e) => handleInputChange('preferredDeliveryDate', e.target.value)}
              className={errors.preferredDeliveryDate ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.preferredDeliveryDate && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.preferredDeliveryDate}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ამ ველის ცარიელად დატოვების შემთხვევაში, მიწოდების დრო შეთანხმების საფუძველზე
              განისაზღვრება
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            გადახდის მეთოდი
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="cash"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === 'cash'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600"
              />
              <Label htmlFor="cash">ნაღდი ფული</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="card"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === 'card'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600"
              />
              <Label htmlFor="card">ბარათი</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="transfer"
                name="paymentMethod"
                value="transfer"
                checked={formData.paymentMethod === 'transfer'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600"
              />
              <Label htmlFor="transfer">გადარიცხვა</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            მიწოდების პრიორიტეტი
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="normal"
                  name="priority"
                  value="normal"
                  checked={formData.priority === 'normal'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600"
                />
                <Label htmlFor="normal">
                  <div>
                    <div className="font-medium">რუტინული</div>
                    <div className="text-sm text-muted-foreground">
                      1-2 საათის განმავლობაში - უფასო
                    </div>
                  </div>
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">ჩვეულებრივი ფასი</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="urgent"
                  name="priority"
                  value="urgent"
                  checked={formData.priority === 'urgent'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600"
                />
                <Label htmlFor="urgent">
                  <div>
                    <div className="font-medium">ექსპრეს</div>
                    <div className="text-sm text-muted-foreground">
                      45 წუთის განმავლობაში - 10 ლარით მეტი
                    </div>
                  </div>
                </Label>
              </div>
              <Badge variant="destructive" className="text-xs">
                +10 ₾
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            განსაკუთრებული ინსტრუქციები
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="დაამატეთ ნებისმიერი განსაკუთრებული მოთხოვნა ან ინსტრუქცია..."
            value={formData.specialInstructions}
            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            className={errors.specialInstructions ? 'border-red-500' : ''}
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">მაქსიმუმ 500 სიმბოლო</p>
            <span className="text-xs text-muted-foreground">
              {formData.specialInstructions.length}/500
            </span>
          </div>
          {errors.specialInstructions && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.specialInstructions}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">ვალიდაციის შეცდომები:</p>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            გაგზავნისთვის მომზადება...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            შეკვეთის გაგზავნა
          </>
        )}
      </Button>

      {/* Order Summary Notice */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          შეკვეთის გაგზავნის შემდეგ, თქვენი შეკვეთა გაეგზავნება რესტორანს და შესაბამისი განმარტება
          მოგეკითხებათ.
        </p>
      </div>
    </form>
  )
}
