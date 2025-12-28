'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function OrderHistoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [date, setDate] = useState<Date | undefined>()
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search })
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const updateFilters = (newFilters: any) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value as string)
      } else {
        params.delete(key)
      }
    })

    router.push(`?${params.toString()}`)
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      // Convert to UTC Start/End of day to avoid timezone issues
      const startOfDay = new Date(newDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(newDate)
      endOfDay.setHours(23, 59, 59, 999)

      updateFilters({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      })
    } else {
      updateFilters({ startDate: null, endDate: null })
    }
  }

  const handleExport = () => {
    window.location.href = '/api/orders/export'
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 flex gap-2">
        <Input
          placeholder="ძებნა ID-ით..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[200px]"
        />

        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val)
            updateFilters({ status: val })
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="სტატუსი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სტატუსი</SelectItem>
            <SelectItem value="pending">მუშავდება</SelectItem>
            <SelectItem value="confirmed">დადასტურებული</SelectItem>
            <SelectItem value="prepared">მზადაა</SelectItem>
            <SelectItem value="delivered">დასრულებული</SelectItem>
            <SelectItem value="cancelled">გაუქმებული</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP', { locale: ka }) : <span>აირჩიეთ თარიღი</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>

        {(status !== 'all' || date || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStatus('all')
              setDate(undefined)
              setSearch('')
              router.push('?')
            }}
          >
            <X className="h-4 w-4 mr-2" />
            გასუფთავება
          </Button>
        )}
      </div>

      <Button variant="outline" onClick={handleExport}>
        CSV ექსპორტი
      </Button>
    </div>
  )
}
