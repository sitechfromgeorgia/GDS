'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marina K.',
    role: 'Restaurant Owner',
    company: 'Tbilisi Bistro',
    content:
      'This platform has transformed how we manage our food distribution. Real-time tracking and automated pricing have saved us hours every week.',
    rating: 5,
    avatar: 'MK',
  },
  {
    name: 'Giorgi M.',
    role: 'Distribution Manager',
    company: 'Caucasus Foods',
    content:
      "The analytics dashboard gives us incredible insights into our operations. We've improved efficiency by 40% since implementing this system.",
    rating: 5,
    avatar: 'GM',
  },
  {
    name: 'Nino T.',
    role: 'Driver',
    company: 'Independent Contractor',
    content:
      'The mobile app is fantastic. GPS tracking, easy navigation, and instant notifications make deliveries so much smoother.',
    rating: 5,
    avatar: 'NT',
  },
  {
    name: 'David L.',
    role: 'Operations Director',
    company: 'Batumi Restaurants Group',
    content:
      'Outstanding platform with excellent support. The multi-role system works perfectly for our complex distribution network.',
    rating: 5,
    avatar: 'DL',
  },
  {
    name: 'Ana P.',
    role: 'Restaurant Manager',
    company: 'Traditional Georgian Cuisine',
    content:
      'Finally, a system that understands the unique needs of Georgian restaurants. The interface is intuitive and the features are comprehensive.',
    rating: 5,
    avatar: 'AP',
  },
  {
    name: 'Levan R.',
    role: 'Fleet Manager',
    company: 'Tbilisi Delivery Services',
    content:
      'Managing 50+ drivers has never been easier. Real-time tracking and automated dispatch have revolutionized our operations.',
    rating: 5,
    avatar: 'LR',
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Customer Success Stories
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Leading Restaurants and Distributors
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our customers say about transforming their food distribution operations with
            our comprehensive platform.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support Available</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">6</div>
            <div className="text-sm text-muted-foreground">Months Average Implementation</div>
          </div>
        </div>
      </div>
    </section>
  )
}
