'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I get started with Georgian Distribution?',
        answer:
          "Getting started is easy! Simply contact our sales team, and we will guide you through the setup process. We'll help you configure your account, import your data, and train your team on using the platform.",
      },
      {
        question: 'Do you offer a demo?',
        answer:
          'Yes! We offer a live demo where you can explore all features. No commitment required. During the demo, our team will answer all your questions and show you how the platform fits your business needs.',
      },
      {
        question: 'What types of businesses can use your platform?',
        answer:
          "Our platform is designed for restaurants, food distributors, and delivery drivers. Whether you're a single restaurant, a chain of restaurants, or a food distribution company, our platform scales to meet your needs.",
      },
    ],
  },
  {
    category: 'Features & Functionality',
    questions: [
      {
        question: 'How does real-time order tracking work?',
        answer:
          'Our platform provides real-time status updates for all deliveries. Restaurants can see the status of their orders, estimated delivery times, and receive automatic notifications when orders are picked up, in transit, and delivered.',
      },
      {
        question: 'Can I integrate with my existing systems?',
        answer:
          'Yes! We offer comprehensive API access and pre-built integrations with popular POS systems, accounting software, and other business tools. Our integration team can help you connect your existing systems.',
      },
      {
        question: 'Is the platform mobile-friendly?',
        answer:
          'Absolutely! We have dedicated mobile apps for drivers and a responsive web interface that works perfectly on all devices. Drivers can manage deliveries on the go, and restaurants can access all features from their phones or tablets.',
      },
      {
        question: 'How secure is my data?',
        answer:
          'Security is our top priority. We use bank-level encryption, comply with GDPR standards, and implement multi-factor authentication. Your data is stored securely and never shared with third parties without your consent.',
      },
    ],
  },
  {
    category: 'Pricing & Support',
    questions: [
      {
        question: 'What are your pricing plans?',
        answer:
          'We offer three main plans: Starter, Professional, and Enterprise. Contact our sales team for custom pricing tailored to your business needs.',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          "We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied with our platform, we'll refund your payment in full, no questions asked.",
      },
      {
        question: 'What kind of support do you provide?',
        answer:
          'We provide 24/7 technical support, comprehensive documentation, video tutorials, and dedicated account managers for enterprise customers. Our average response time is under 2 hours.',
      },
      {
        question: 'Can I change my plan later?',
        answer:
          "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments. Contact our support team to make changes to your account.",
      },
    ],
  },
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-lg text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="h-6 w-6 mr-3 text-primary" />
                {category.category}
              </h3>

              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`
                  const isOpen = openItems.includes(itemId)

                  return (
                    <Card key={faqIndex} className="border-0 shadow-sm">
                      <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleItem(itemId)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-left pr-4">{faq.question}</CardTitle>
                          <div className="flex-shrink-0">
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300 ease-in-out',
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <CardContent className="pt-0">
                          <CardDescription className="text-base leading-relaxed">
                            {faq.answer}
                          </CardDescription>
                        </CardContent>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-primary/5 rounded-lg p-8 max-w-2xl mx-auto">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is available 24/7 to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@greenland77.ge"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Contact Support
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Send Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
