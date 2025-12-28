import type { Metadata } from 'next'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { ContactSection } from '@/components/landing/ContactSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'
import { DemoCTA } from '@/components/landing/DemoCTA'

// ============================================================================
// ISR Configuration (T052)
// ============================================================================
// Revalidate every 1 hour (3600 seconds)
// Why: Landing page content changes infrequently, high traffic, SEO critical
// Expected impact: 4X faster page loads, 85%+ cache hit rate
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Georgian Distribution System - Modern Food Distribution Platform',
  description:
    'Transform your food distribution business with our comprehensive platform. Real-time order tracking, automated pricing, and seamless logistics for restaurants, distributors, and drivers in Georgia.',
  keywords:
    'food distribution, restaurant ordering, delivery management, Georgia, real-time tracking, automated pricing',
  authors: [{ name: 'Georgian Distribution System' }],
  openGraph: {
    title: 'Georgian Distribution System - Modern Food Distribution Platform',
    description: 'Transform your food distribution business with our comprehensive platform.',
    url: 'https://greenland77.ge/landing',
    siteName: 'Georgian Distribution System',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Georgian Distribution System',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Georgian Distribution System - Modern Food Distribution Platform',
    description: 'Transform your food distribution business with our comprehensive platform.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://greenland77.ge/landing',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <DemoCTA />
        <ContactSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
