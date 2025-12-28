import type { Metadata, Viewport } from 'next'
// Temporarily disabled Google Fonts to avoid network issues during build
// import { Inter, Roboto_Mono } from 'next/font/google'
import { Providers } from './providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PWAInstallPrompt } from '@/components/mobile/PWAInstallPrompt'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { GeometricBackground } from '@/components/ui/GeometricBackground'
import './globals.css'

// Using system fonts instead of Google Fonts to avoid network dependencies during build
// const inter = Inter({
//   variable: '--font-inter',
//   subsets: ['latin'],
//   display: 'swap',
// })

// const robotoMono = Roboto_Mono({
//   variable: '--font-roboto-mono',
//   subsets: ['latin'],
//   display: 'swap',
// })

export const metadata: Metadata = {
  title: 'Georgian Distribution System',
  description: 'B2B Food Distribution Management Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Georgian Distribution',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

import { createClient } from '@/lib/supabase/server'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Georgian Distribution" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Georgian Distribution" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <Providers initialUser={user}>
            <GeometricBackground />
            {children}
            <PWAInstallPrompt />
          </Providers>
        </ErrorBoundary>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
