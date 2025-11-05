// Date Range Filter Component
// Based on specs/001-analytics-dashboard/research.md

'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from '@/types/analytics'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
}

const presets = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState<Date | undefined>(new Date(value.from))
  const [customTo, setCustomTo] = useState<Date | undefined>(new Date(value.to))

  const handlePresetClick = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)

    onChange({
      from: from.toISOString(),
      to: to.toISOString(),
    })
  }

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({
        from: customFrom.toISOString(),
        to: customTo.toISOString(),
      })
      setIsCustomOpen(false)
    }
  }

  const currentLabel = () => {
    const fromDate = new Date(value.from)
    const toDate = new Date(value.to)
    return `${format(fromDate, 'MMM d, yyyy')} - ${format(toDate, 'MMM d, yyyy')}`
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="text-sm font-medium">Date Range:</div>

      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => handlePresetClick(preset.days)}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Custom Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">From:</div>
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">To:</div>
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} />
            </div>
            <Button onClick={handleCustomApply} className="w-full">
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="text-sm text-muted-foreground ml-2">{currentLabel()} (UTC+4)</div>
    </div>
  )
}
