'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, ChefHat, BarChart3, ArrowRight, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function HeroSection() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container relative px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            🚀 Now Live in Georgia - Join 500+ Restaurants
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Transform Your Food
            <span className="block text-primary">Distribution Business</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Connect restaurants, distributors, and drivers with our comprehensive platform.
            Real-time tracking, automated pricing, and seamless logistics for modern food
            distribution in Georgia.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" asChild className="px-8">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="px-8">
                  <Link href="/demo">
                    Try Free Demo
                    <Play className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-8">
                  <Link href="#pricing">View Pricing</Link>
                </Button>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Trusted by leading restaurants and distributors across Georgia
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">500+ Restaurants</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">200+ Drivers</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">10,000+ Orders/Month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Icons Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">For Restaurants</h3>
            <p className="text-sm text-muted-foreground text-center">
              Easy ordering, real-time tracking, and automated pricing for seamless operations.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">For Distributors</h3>
            <p className="text-sm text-muted-foreground text-center">
              Comprehensive management tools, analytics, and automated workflows.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">For Drivers</h3>
            <p className="text-sm text-muted-foreground text-center">
              Mobile-optimized interface with GPS tracking and delivery management.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
