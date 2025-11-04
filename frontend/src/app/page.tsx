import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, ChefHat, BarChart3, Play, Shield, Zap } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Georgian Distribution</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            v2.1 - Live in Georgia
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            🚀 Now Live in Georgia - Join 500+ Restaurants
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6">
            Transform Your Food
            <span className="block text-primary">Distribution Business</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground mb-8">
            Connect restaurants, distributors, and drivers with our comprehensive platform.
            Real-time tracking, automated pricing, and seamless logistics for modern food distribution in Georgia.
          </p>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-12">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">For Restaurants</h3>
              <p className="text-sm text-muted-foreground text-center">
                Easy ordering, real-time tracking, and automated pricing.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">For Distributors</h3>
              <p className="text-sm text-muted-foreground text-center">
                Complete management tools, analytics, and automation.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">For Drivers</h3>
              <p className="text-sm text-muted-foreground text-center">
                Mobile-optimized interface with GPS tracking.
              </p>
            </div>
          </div>
        </section>

        {/* Auth Section */}
        <section className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account or try our demo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/dashboard/demo">
                  <Play className="mr-2 h-4 w-4" />
                  Try Demo
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by leading restaurants and distributors across Georgia
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-70">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Secure & Reliable</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Advanced Analytics</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Built with Next.js • TypeScript • Supabase • Tailwind CSS • shadcn/ui</p>
            <p className="mt-2">Georgian Distribution System v2.1 - Development Environment</p>
          </div>
        </div>
      </footer>
    </div>
  )
}