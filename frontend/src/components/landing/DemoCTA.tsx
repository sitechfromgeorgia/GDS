'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, Clock, CheckCircle } from 'lucide-react'

export function DemoCTA() {
  return (
    <section className="py-24 bg-primary/5">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Try It Free
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Experience the Future of Food Distribution
            </h2>
            <p className="text-lg text-muted-foreground">
              See how our platform can transform your operations with our interactive demo. No setup
              required, just click and explore.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Demo Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Multi-Role Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch between restaurant, driver, and admin roles to see the full platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-Time Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Experience live order tracking, notifications, and real-time updates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Full Feature Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore all features including analytics, order management, and reporting.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/demo">
                    <Play className="mr-2 h-4 w-4" />
                    Start Interactive Demo
                  </Link>
                </Button>
              </div>
            </div>

            {/* Demo Preview Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary" />
                  <span>Demo Preview</span>
                </CardTitle>
                <CardDescription>What you&apos;ll experience in our demo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Restaurant Dashboard</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Order Management</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Driver Tracking</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Analytics & Reports</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Real-time Notifications</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Demo Duration</span>
                    <span>15 minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="font-medium">Guided Tour</span>
                    <span>Included</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Ready to get started? Join hundreds of restaurants already using our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/demo">Try Demo Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
