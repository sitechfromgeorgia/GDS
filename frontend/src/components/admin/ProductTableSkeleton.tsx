/**
 * Product Table Loading Skeleton (T065)
 *
 * Loading placeholder for the ProductTable during code splitting.
 * Provides perceived performance improvement for admin product management.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ProductTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table Header with Skeleton */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[60px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[60px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-[70px]" />
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Render 5 skeleton rows */}
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-10 w-10 rounded" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[120px]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[60px]" />
          <Skeleton className="h-9 w-[70px]" />
        </div>
      </div>
    </div>
  )
}
