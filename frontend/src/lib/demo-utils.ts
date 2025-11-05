import { logger } from '@/lib/logger'
import { DEMO_SAMPLE_DATA } from './demo-data'
import type { DemoSession, DemoRole } from '@/types/demo'

export class DemoUtils {
  private static currentSession: DemoSession | null = null

  static getCurrentDemoSession(): DemoSession | null {
    return this.currentSession
  }

  static setCurrentDemoSession(session: DemoSession | null) {
    this.currentSession = session
  }

  static async initializeDemoSession(userId: string): Promise<DemoSession> {
    const session: DemoSession = {
      id: this.generateRandomId(),
      role: 'demo',
      data: {},
      startedAt: new Date().toISOString(),
      tourSteps: [],
    }
    this.setCurrentDemoSession(session)
    return session
  }

  static async generateSampleData() {
    return DEMO_SAMPLE_DATA
  }

  static async attemptConversion(sessionId: string, userId: string, conversionType: string) {
    logger.info('Demo conversion attempt:', { sessionId, userId, conversionType })
    // Mock conversion tracking
    return { success: true, conversionType }
  }

  static async trackDemoAction(sessionId: string, userId: string, action: string, metadata?: any) {
    logger.info('Demo action tracked:', { sessionId, userId, action, metadata })
    // Mock action tracking
    return { success: true }
  }

  static generateRandomOrder() {
    return {
      id: `demo_${Date.now()}`,
      customer: 'Demo Restaurant',
      items: ['Product A', 'Product B'],
      total: 49.99,
      status: 'pending',
    }
  }

  static generateRandomUser() {
    return {
      id: `demo_user_${Date.now()}`,
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'restaurant',
    }
  }

  static generateRandomProduct() {
    return {
      id: `demo_product_${Date.now()}`,
      name: 'Demo Product',
      price: 29.99,
      category: 'general',
    }
  }

  static formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
  }

  static formatDate(date: Date) {
    return date.toLocaleDateString()
  }

  static simulateNetworkDelay() {
    return new Promise((resolve) => setTimeout(resolve, 1000))
  }

  static generateRandomId() {
    return Math.random().toString(36).substring(2, 15)
  }

  static getSampleData(role: string) {
    return DEMO_SAMPLE_DATA[role as keyof typeof DEMO_SAMPLE_DATA] || DEMO_SAMPLE_DATA.admin
  }
}
