'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Play, LogIn } from 'lucide-react'

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Content Container - z-index ensures it's above the background */}
      <div className="relative z-10 text-center space-y-8 p-8 max-w-2xl mx-auto backdrop-blur-sm bg-background/30 rounded-3xl border border-white/10 shadow-2xl">
        {/* Title Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Georgian Distribution System
          </h1>
          <p className="text-xl text-muted-foreground">Modern B2B Food Distribution Platform</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Button
            size="lg"
            asChild
            className="h-14 px-8 text-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" />
              {t('common.login')}
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-14 px-8 text-lg w-full sm:w-auto backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/dashboard/demo">
              <Play className="mr-2 h-5 w-5" />
              {t('common.live_demo')}
            </Link>
          </Button>
        </div>

        {/* Footer/Status */}
        <div className="pt-8 text-sm text-muted-foreground/60">
          <p>Secure • Real-time • Efficient</p>
        </div>
      </div>
    </div>
  )
}
