// Status Filter Component
// Based on specs/001-analytics-dashboard/plan.md

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterIcon } from 'lucide-react'
import type { OrderStatus } from '@/types/analytics'

interface StatusFilterProps {
  value: OrderStatus[]
  onChange: (status: OrderStatus[]) => void
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'priced', label: 'Priced' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(value)

  const handleToggle = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const handleApply = () => {
    onChange(selectedStatuses)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedStatuses([])
    onChange([])
    setIsOpen(false)
  }

  const displayLabel =
    value.length === 0
      ? 'All Statuses'
      : `${value.length} Status${value.length > 1 ? 'es' : ''} Selected`

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          {displayLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">Filter by Status:</div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedStatuses.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Apply
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
