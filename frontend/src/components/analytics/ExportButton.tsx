// Export Button Component
// Based on specs/001-analytics-dashboard/plan.md

'use client'

import { Button } from '@/components/ui/button'
import { DownloadIcon } from 'lucide-react'

interface ExportButtonProps {
  onClick: () => void
  isExporting?: boolean
  disabled?: boolean
}

export function ExportButton({
  onClick,
  isExporting = false,
  disabled = false,
}: ExportButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <DownloadIcon className="h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  )
}
