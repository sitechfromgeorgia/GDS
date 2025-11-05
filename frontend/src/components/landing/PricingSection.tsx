'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Check, Star, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small restaurants getting started',
    monthlyPrice: 49,
    annualPrice: 490,
    features: [
      'Up to 100 orders/month',
      'Basic analytics',
      'Email support',
      'Mobile app access',
      'Standard integrations',
    ],
    limitations: ['Limited to 1 restaurant location', 'Basic reporting only'],
    popular: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    description: 'Ideal for growing restaurants and small chains',
    monthlyPrice: 149,
    annualPrice: 1490,
    features: [
      'Unlimited orders',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom integrations',
      'Multi-location support',
      'API access',
      'Advanced user management',
    ],
    limitations: [],
    popular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    description: 'For large distributors and restaurant chains',
    monthlyPrice: 399,
    annualPrice: 3990,
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom development',
      'Advanced security features',
      'White-label solution',
      '24/7 phone support',
      'SLA guarantees',
      'Custom training',
    ],
    limitations: [],
    popular: false,
    cta: 'Contact Sales',
  },
]

const addons = [
  {
    name: 'Advanced Analytics',
    description: 'Enhanced reporting and business intelligence',
    price: 99,
    period: 'month',
  },
  {
    name: 'Custom Integrations',
    description: 'Connect with your existing systems',
    price: 199,
    period: 'month',
  },
  {
    name: 'Dedicated Support',
    description: 'Priority support with faster response times',
    price: 299,
    period: 'month',
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Choose the Perfect Plan for Your Business
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start free and scale as you grow. All plans include our core features with no hidden
            fees or setup costs.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span
              className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span
              className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              Annual
            </span>
            <Badge variant="secondary" className="ml-2">
              Save 20%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
                  {isAnnual && (
                    <div className="text-sm text-muted-foreground mt-1">
                      ${plan.monthlyPrice}/month billed annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Limitations:</p>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="text-sm text-muted-foreground">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                  <Link href={plan.cta === 'Contact Sales' ? '#contact' : '/demo'}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Optional Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addons.map((addon, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">${addon.price}</span>
                    <span className="text-muted-foreground">/{addon.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-primary/5 rounded-lg p-8 max-w-2xl mx-auto">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6">
              Join hundreds of restaurants already using our platform. Start your free trial today
              with no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/demo">Start Free Trial</Link>
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
