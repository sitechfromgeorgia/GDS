/**
 * Data Table Component
 * Generic table component using @tanstack/react-table
 * TODO: Implement full data table functionality
 */

'use client'

import type { ColumnDef } from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="p-2 text-left">
                {/* TODO: Implement column headers */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="p-2">
                  {/* TODO: Implement cell rendering */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
