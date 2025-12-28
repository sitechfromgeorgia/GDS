import { Check, Clock, Package, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled'

interface OrderStatusTimelineProps {
  status: OrderStatus
}

const STEPS = [
  { id: 'pending', label: 'მიღებულია', icon: Clock },
  { id: 'preparing', label: 'მზადდება', icon: Package },
  { id: 'delivering', label: 'გზაშია', icon: Truck },
  { id: 'delivered', label: 'ჩაბარებულია', icon: Check },
]

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const currentStepIndex = STEPS.findIndex((step) => step.id === status)
  // If status is not found (e.g. cancelled or ready which maps to preparing/delivering logic), handle gracefully
  // For MVP, we'll map 'ready' to 'preparing' visually or add a step

  const getStepStatus = (index: number) => {
    if (status === 'cancelled') return 'cancelled'
    if (index < currentStepIndex) return 'completed'
    if (index === currentStepIndex) return 'current'
    return 'upcoming'
  }

  return (
    <div className="w-full py-4">
      <div className="relative flex justify-between">
        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index)
          const Icon = step.icon

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-background',
                  stepStatus === 'completed' && 'border-primary bg-primary text-primary-foreground',
                  stepStatus === 'current' && 'border-primary text-primary animate-pulse',
                  stepStatus === 'upcoming' && 'border-muted text-muted-foreground',
                  stepStatus === 'cancelled' && 'border-destructive text-destructive'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium transition-colors duration-300',
                  stepStatus === 'completed' && 'text-primary',
                  stepStatus === 'current' && 'text-primary',
                  stepStatus === 'upcoming' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 w-full h-[2px] -z-10',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
