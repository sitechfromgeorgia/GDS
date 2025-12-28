'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { isInstalled, canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user previously dismissed the prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't render on server or if already installed/dismissed
  if (!mounted || isInstalled || !canInstall || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-40',
        'lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm',
        'bg-gradient-to-r from-primary to-purple-600',
        'text-primary-foreground rounded-lg shadow-lg',
        'p-4 animate-in slide-in-from-bottom-4 duration-500'
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-primary-foreground/70 hover:text-primary-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 bg-white/20 rounded-lg p-2">
          <Download className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            დააინსტალირეთ აპლიკაცია
          </h3>
          <p className="text-xs text-primary-foreground/90 mb-3">
            დაამატეთ ჩვენი აპლიკაცია მთავარ ეკრანზე სწრაფი წვდომისთვის და
            ოფლაინ მუშაობისთვის
          </p>

          <Button
            onClick={handleInstall}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            დაყენება
          </Button>
        </div>
      </div>
    </div>
  );
}
