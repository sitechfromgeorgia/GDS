'use client'

import {
  Truck,
  Users,
  ChefHat,
  BarChart3,
  Shield,
  Zap,
  Smartphone,
  Globe,
  CheckCircle,
} from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Truck,
    title: 'Real-Time Order Tracking',
    description:
      'Track orders from placement to delivery with real-time status updates and automated notifications.',
    benefits: ['Real-time status', 'Automated notifications', 'Delivery ETA', 'Order history'],
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Comprehensive dashboards with sales analytics, profitability reports, and business insights.',
    benefits: ['Sales analytics', 'Profitability reports', 'Performance metrics', 'Custom reports'],
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-level security with multi-factor authentication, encrypted data, and compliance standards.',
    benefits: ['MFA authentication', 'Encrypted data', 'GDPR compliant', 'Secure payments'],
  },
  {
    icon: Zap,
    title: 'Automated Pricing',
    description:
      'Dynamic pricing algorithms that optimize margins while remaining competitive in the market.',
    benefits: [
      'Dynamic pricing',
      'Margin optimization',
      'Competitive analysis',
      'Price automation',
    ],
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description:
      'Fully responsive platform optimized for mobile devices with dedicated driver and restaurant apps.',
    benefits: ['Mobile optimized', 'Driver app', 'Restaurant app', 'Offline capability'],
  },
  {
    icon: Users,
    title: 'Multi-Role Management',
    description:
      'Comprehensive user management for administrators, restaurants, distributors, and drivers.',
    benefits: ['Role-based access', 'User permissions', 'Team management', 'Bulk operations'],
  },
]

const stats = [
  { label: 'Active Restaurants', value: '500+', icon: ChefHat },
  { label: 'Monthly Orders', value: '10,000+', icon: Truck },
  { label: 'Active Drivers', value: '200+', icon: Users },
  { label: 'Uptime', value: '99.9%', icon: CheckCircle },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Platform Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need for Modern Food Distribution
          </h2>
          <p className="text-lg text-muted-foreground">
            Our comprehensive platform provides all the tools necessary for efficient, scalable food
            distribution operations in Georgia.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter
                  value={parseInt(stat.value.replace(/[^\d]/g, ''))}
                  suffix={stat.value.replace(/[\d]/g, '')}
                />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            <Globe className="h-4 w-4" />
            <span>Available across all major cities in Georgia</span>
          </div>
        </div>
      </div>
    </section>
  )
}
