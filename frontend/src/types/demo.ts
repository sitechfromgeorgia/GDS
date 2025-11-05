export interface DemoSession {
  id: string
  role: DemoRole
  data: any
  startedAt: string
  tourSteps: DemoTourStep[]
}

export type DemoRole = 'admin' | 'restaurant' | 'driver' | 'demo'

export interface DemoTourStep {
  id: number
  title: string
  description: string
  target: string
  autoAdvance?: number
  completed: boolean
  placement?: string
  required?: boolean
  content?: string
}

export const DEMO_LIMITATIONS = [
  {
    icon: 'Lock',
    title: 'Read-Only Access',
    description: 'Demo accounts cannot make real changes to data.',
  },
  {
    icon: 'FileText',
    title: 'Limited Data',
    description: 'Demo uses sample data for safety and privacy.',
  },
  {
    icon: 'Database',
    title: 'No Real Transactions',
    description: 'No real payments or orders are processed in demo mode.',
  },
]

export const DEMO_ROLES: DemoRole[] = ['admin', 'restaurant', 'driver', 'demo']
