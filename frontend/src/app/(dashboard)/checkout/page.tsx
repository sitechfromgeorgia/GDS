'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShoppingCart, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

import type { CheckoutFormData } from '@/components/checkout/CheckoutForm'
import { CheckoutFormSkeleton } from '@/components/checkout/CheckoutFormSkeleton'
import { CheckoutSummarySkeleton } from '@/components/checkout/CheckoutSummarySkeleton'
import { useCart } from '@/hooks/useCart'
import { useOrderSubmission } from '@/hooks/useOrderSubmission'
import { ORDER_SUBMISSION_GEORGIAN } from '@/types/order-submission'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load checkout components (15.24 KB combined)
// Why: Multi-step checkout flow with complex form validation
// Expected impact: 10-15% initial bundle reduction
const CheckoutForm = lazy(() => import('@/components/checkout/CheckoutForm'))
const CheckoutSummary = lazy(() => import('@/components/checkout/CheckoutSummary'))

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const { submitOrder, isLoading, error, success } = useOrderSubmission()

  const [currentStep, setCurrentStep] = useState<'form' | 'summary' | 'success'>('form')
  const [checkoutData, setCheckoutData] = useState<CheckoutFormData | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      router.push('/')
      return
    }
  }, [cart, router])

  // Handle successful order submission
  useEffect(() => {
    if (success && checkoutData) {
      setCurrentStep('success')
      // Clear cart after successful submission
      clearCart()
    }
  }, [success, checkoutData, clearCart])

  const handleFormSubmit = async (formData: CheckoutFormData) => {
    setCheckoutData(formData)
    setValidationErrors([])

    // Create order submission data
    const orderData = {
      restaurantId: cart?.restaurantId || '00000000-0000-0000-0000-000000000000', // Default restaurant ID
      cartSessionId: cart?.id,
      specialInstructions: formData.specialInstructions,
      preferredDeliveryDate: formData.preferredDeliveryDate,
      contactPhone: formData.contactPhone,
      deliveryAddress: formData.deliveryAddress,
      priority: formData.priority,
      paymentMethod: formData.paymentMethod,
    }

    try {
      // Submit order through service
      await submitOrder(orderData)
    } catch (err) {
      logger.error('Order submission failed:', err)
      setValidationErrors(['შეკვეთის გაგზავნა ვერ მოხერხდა. გთხოვთ კიდევ სცადოთ.'])
      setCurrentStep('form') // Go back to form on error
    }
  }

  const handleEditOrder = () => {
    setCurrentStep('form')
    setCheckoutData(null)
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 2,
    }).format(price)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {ORDER_SUBMISSION_GEORGIAN.messages.submitting}
          </h2>
          <p className="text-gray-600">თქვენი შეკვეთა იგზავნება, გთხოვთ დაელოდოთ...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (currentStep === 'success' && checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">
                  {ORDER_SUBMISSION_GEORGIAN.messages.success}
                </CardTitle>
                <p className="text-gray-600 mt-2">თქვენი შეკვეთა წარმატებით გაეგზავნა!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Confirmation Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">შეკვეთის დეტალები:</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">ტელეფონი:</span>
                      <p className="text-gray-900">{checkoutData.contactPhone}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">მეთოდი:</span>
                      <p className="text-gray-900">
                        {checkoutData.paymentMethod === 'cash' && 'ნაღდი ფული'}
                        {checkoutData.paymentMethod === 'card' && 'ბარათი'}
                        {checkoutData.paymentMethod === 'transfer' && 'გადარიცხვა'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">მიწოდების მისამართი:</span>
                      <p className="text-gray-900">{checkoutData.deliveryAddress}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">პრიორიტეტი:</span>
                      <p className="text-gray-900">
                        {checkoutData.priority === 'urgent' ? 'ექსპრეს' : 'რუტინული'}
                        {checkoutData.priority === 'urgent' && ' (+10 ₾)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Estimate */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">მოსალოდნელი მიწოდების დრო:</h3>
                  <p className="text-blue-800">
                    {checkoutData.priority === 'urgent'
                      ? '45 წუთის განმავლობაში'
                      : '1-2 საათის განმავლობაში'}
                  </p>
                  {checkoutData.preferredDeliveryDate && (
                    <p className="text-sm text-blue-600 mt-1">
                      მოსალოდნელი თარიღი:{' '}
                      {new Date(checkoutData.preferredDeliveryDate).toLocaleString('ka-GE')}
                    </p>
                  )}
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">შემდეგი ნაბიჯები:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>შეკვეთა გადაიცემა რესტორანს</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>რესტორანი დაგიკავშირდებათ დასტურისთვის</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>მიწოდების დრო შეთანხმდება ტელეფონით</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleContinueShopping} className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    კიდევ შეკვეთისთვის
                  </Button>
                  <Button onClick={() => router.push('/orders')} className="flex-1">
                    ჩემი შეკვეთები
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main checkout flow
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              უკან
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {ORDER_SUBMISSION_GEORGIAN.labels.checkout}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {currentStep === 'form' && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep === 'form'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      1
                    </div>
                    <h2 className="font-semibold">კონტაქტისა და მიწოდების ინფორმაცია</h2>
                  </div>

                  <Suspense fallback={<CheckoutFormSkeleton />}>
                    <CheckoutForm
                      onSubmit={handleFormSubmit}
                      isLoading={isLoading}
                      validationErrors={validationErrors}
                    />
                  </Suspense>
                </>
              )}

              {currentStep === 'summary' && checkoutData && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-600 text-white">
                      ✓
                    </div>
                    <h2 className="font-semibold">შეკვეთის დასტურება</h2>
                  </div>

                  <Suspense fallback={<CheckoutSummarySkeleton />}>
                    <CheckoutSummary
                      cart={cart!}
                      restaurantName="თქვენი რესტორანი"
                      specialInstructions={checkoutData.specialInstructions}
                      contactPhone={checkoutData.contactPhone}
                      deliveryAddress={checkoutData.deliveryAddress}
                      priority={checkoutData.priority}
                      estimatedDeliveryTime={checkoutData.preferredDeliveryDate}
                      onEditOrder={handleEditOrder}
                      onSubmit={() => handleFormSubmit(checkoutData)}
                      isLoading={isLoading}
                    />
                  </Suspense>
                </>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:sticky lg:top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    შეკვეთის სასტარტო
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items Count */}
                    <div className="flex justify-between text-sm">
                      <span>პროდუქტები:</span>
                      <span className="font-medium">{cart?.totalItems} ერთეული</span>
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span>ქვე-ჯამი:</span>
                      <span className="font-medium">{formatPrice(cart?.totalPrice || 0)}</span>
                    </div>

                    {/* Delivery Fee */}
                    <div className="flex justify-between text-sm">
                      <span>მიწოდება:</span>
                      <span className="font-medium">
                        {cart && cart.totalPrice >= 500 ? 'უფასო' : formatPrice(25)}
                      </span>
                    </div>

                    {/* Urgent Fee */}
                    {checkoutData?.priority === 'urgent' && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>ექსპრეს მიწოდება:</span>
                        <span className="font-medium">+{formatPrice(10)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>ჯამური თანხა:</span>
                        <span className="text-lg">
                          {formatPrice(
                            (cart?.totalPrice || 0) +
                              (cart && cart.totalPrice >= 500 ? 0 : 25) +
                              (checkoutData?.priority === 'urgent' ? 10 : 0)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Estimate */}
                    {checkoutData && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-blue-900 mb-1">მოსალოდნელი დრო:</div>
                        <div className="text-blue-800">
                          {checkoutData.priority === 'urgent' ? '45 წუთი' : '1-2 საათი'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
