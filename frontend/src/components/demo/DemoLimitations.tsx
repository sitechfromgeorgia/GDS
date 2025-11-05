'use client'

import { useDemo } from '@/hooks/useDemo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lock, FileText, Database } from 'lucide-react'
import { DEMO_LIMITATIONS } from '@/types/demo'

export function DemoLimitations() {
  const { checkLimitations } = useDemo()

  const limitations = [
    {
      icon: Database,
      title: 'Limited Data',
      description: 'Demo contains a limited subset of sample orders, users, and products.',
      type: 'info',
    },
    {
      icon: Lock,
      title: 'Read-Only Features',
      description: 'Some write operations are disabled in demo mode.',
      type: 'warning',
    },
    {
      icon: AlertTriangle,
      title: 'Session Timeout',
      description: 'Demo sessions automatically expire after a short period.',
      type: 'warning',
    },
    {
      icon: FileText,
      title: 'Sample Data Only',
      description: 'All data shown is for demonstration purposes',
      type: 'info',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs">
              Demo Limitations
            </Badge>

            <div className="hidden md:flex items-center gap-6">
              {limitations.map((limitation, index) => {
                const Icon = limitation.icon
                return (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon className="h-4 w-4" />
                    <span>{limitation.title}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <Button variant="outline" size="sm">
            View Full Details
          </Button>
        </div>

        {/* Mobile expandable details */}
        <div className="md:hidden mt-3">
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <span>View limitations</span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>

            <div className="mt-3 grid grid-cols-1 gap-3">
              {limitations.map((limitation, index) => {
                const Icon = limitation.icon
                return (
                  <Alert
                    key={index}
                    className={
                      limitation.type === 'warning'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-blue-200 bg-blue-50'
                    }
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        limitation.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                      }`}
                    />
                    <AlertDescription>
                      <div className="font-medium text-sm">{limitation.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{limitation.description}</div>
                    </AlertDescription>
                  </Alert>
                )
              })}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
