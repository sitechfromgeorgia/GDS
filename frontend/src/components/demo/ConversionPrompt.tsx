'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Rocket, Mail, Phone, Star, CheckCircle } from 'lucide-react'
import { useDemo } from '@/hooks/useDemo'
import { useToast } from '@/hooks/use-toast'

export function ConversionPrompt() {
  const { attemptConversion, submitFeedback } = useDemo()
  const { toast } = useToast()
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignup = async () => {
    try {
      await attemptConversion()
      toast({
        title: 'Redirecting to signup',
        description: 'Taking you to our registration page...',
      })
      // In a real implementation, this would redirect to signup
      window.location.href = '/signup'
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in your name and email.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await attemptConversion()
      await submitFeedback()

      toast({
        title: 'Thank you!',
        description: "We'll get back to you within 24 hours.",
      })

      setShowContactForm(false)
      setContactForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="conversion-prompt fixed bottom-4 right-4 z-30">
      <Card className="w-80 shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            Ready to Get Started?
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Impressed with the demo? Join thousands of restaurants already using our platform.
          </p>

          <div className="space-y-2">
            <Button onClick={handleSignup} className="w-full bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Free Trial
            </Button>

            <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Sales
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Contact Our Sales Team</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+995 XX XXX XXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={contactForm.company}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, company: e.target.value }))
                        }
                        placeholder="Restaurant name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="Tell us about your needs..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleContact} disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Free Setup</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
