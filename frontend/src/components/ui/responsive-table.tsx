'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'
import { Card, CardContent } from '@/components/ui/card'

export interface ResponsiveTableColumn {
  key: string
  label: string
  render?: (value: any, item: any) => React.ReactNode
  className?: string
  mobileLabel?: string // Optional custom label for mobile view
}

export interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[]
  data: any[]
  keyExtractor: (item: any) => string | number
  className?: string
  mobileCardClassName?: string
  emptyMessage?: string
}

/**
 * Responsive Table Component
 * Displays as a table on desktop and cards on mobile
 */
export function ResponsiveTable({
  columns,
  data,
  keyExtractor,
  className,
  mobileCardClassName,
  emptyMessage = 'No data available',
}: ResponsiveTableProps) {
  const { isMobile } = useResponsive()

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  // Mobile view - Card layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <Card key={keyExtractor(item)} className={cn('overflow-hidden', mobileCardClassName)}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {columns.map((column) => {
                  const value = item[column.key]
                  const displayValue = column.render ? column.render(value, item) : value

                  return (
                    <div key={column.key} className="flex justify-between items-start gap-4">
                      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                        {column.mobileLabel || column.label}:
                      </span>
                      <span className={cn('text-sm flex-1 text-right', column.className)}>
                        {displayValue}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop view - Table layout
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'text-left p-4 font-medium text-sm text-muted-foreground',
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="border-b hover:bg-muted/50 transition-colors">
              {columns.map((column) => {
                const value = item[column.key]
                const displayValue = column.render ? column.render(value, item) : value

                return (
                  <td key={column.key} className={cn('p-4 text-sm', column.className)}>
                    {displayValue}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
