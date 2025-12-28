import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * NotificationsDropdownSkeleton
 * Loading skeleton for NotificationsDropdown component
 *
 * Matches structure:
 * - Bell icon button with badge placeholder
 * - Simple loading state without popover content
 */
export function NotificationsDropdownSkeleton() {
  return (
    <Button variant="ghost" size="sm" className="relative" disabled>
      <Bell className="h-5 w-5 animate-pulse" />
      {/* Badge placeholder - animated pulse to show loading */}
      <div className="absolute -top-1 -right-1 h-5 w-5 bg-muted rounded-full animate-pulse" />
    </Button>
  )
}
