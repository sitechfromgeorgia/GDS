/**
 * Order History Table Loading Skeleton (T065)
 *
 * Loading placeholder for the OrderHistoryTable during code splitting.
 * Provides perceived performance improvement for restaurant order history.
 */

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function OrderHistoryTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-[80px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-[100px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-[80px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-[120px]" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-[60px] ml-auto" />
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Render 5 skeleton rows */}
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[200px]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-[60px] ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
