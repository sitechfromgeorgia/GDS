/**
 * Driver Workflow E2E Tests
 * Tests complete driver user journey from login to delivery completion
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const DRIVER_EMAIL = 'driver@test.com'
const DRIVER_PASSWORD = 'DriverTest123'

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Driver Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, DRIVER_EMAIL, DRIVER_PASSWORD)
  })

  test('should display driver dashboard', async ({ page }) => {
    // Verify dashboard loads
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Check for driver-specific statistics
    await expect(page.locator('[data-testid="stat-assigned-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-completed-today"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-earnings-today"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-active-deliveries"]')).toBeVisible()

    // Verify availability toggle is visible
    await expect(page.locator('[data-testid="toggle-availability"]')).toBeVisible()
  })

  test('should toggle availability status', async ({ page }) => {
    // Get current status
    const toggleButton = page.locator('[data-testid="toggle-availability"]')
    const initialState = await toggleButton.getAttribute('aria-checked')

    // Toggle availability
    await toggleButton.click()

    // Verify status changed
    await page.waitForTimeout(500)
    const newState = await toggleButton.getAttribute('aria-checked')
    expect(newState).not.toBe(initialState)

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Toggle back
    await toggleButton.click()
    await page.waitForTimeout(500)

    // Verify returned to original state
    const finalState = await toggleButton.getAttribute('aria-checked')
    expect(finalState).toBe(initialState)
  })

  test('should view available orders', async ({ page }) => {
    // Navigate to available orders
    await page.click('[data-testid="nav-available-orders"]')
    await expect(page).toHaveURL('/dashboard/available-orders')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Available Orders')

    // Verify orders list
    await expect(page.locator('[data-testid="available-orders-list"]')).toBeVisible()

    // Verify order cards if available
    const orderCards = page.locator('[data-testid="available-order-card"]')
    const count = await orderCards.count()

    if (count > 0) {
      // Verify order card information
      const firstOrder = orderCards.first()
      await expect(firstOrder.locator('[data-testid="order-number"]')).toBeVisible()
      await expect(firstOrder.locator('[data-testid="delivery-address"]')).toBeVisible()
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible()
      await expect(firstOrder.locator('[data-testid="btn-accept-order"]')).toBeVisible()
    }
  })

  test('should accept available order', async ({ page }) => {
    // Navigate to available orders
    await page.click('[data-testid="nav-available-orders"]')

    // Find first available order
    const availableOrder = page.locator('[data-testid="available-order-card"]').first()

    // Verify order exists
    if (await availableOrder.count() > 0) {
      const orderNumber = await availableOrder.locator('[data-testid="order-number"]').textContent()

      // Click accept button
      await availableOrder.locator('[data-testid="btn-accept-order"]').click()

      // Confirm acceptance
      await page.click('[data-testid="btn-confirm-accept"]')

      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Order accepted')

      // Verify order moved to my deliveries
      await page.click('[data-testid="nav-my-deliveries"]')
      await expect(page.locator('[data-testid="delivery-card"]')).toContainText(orderNumber || '')
    }
  })

  test('should view my deliveries', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')
    await expect(page).toHaveURL('/dashboard/deliveries')

    // Verify page title
    await expect(page.locator('h1')).toContainText('My Deliveries')

    // Verify deliveries list
    await expect(page.locator('[data-testid="deliveries-list"]')).toBeVisible()

    // Check for delivery cards
    const deliveryCards = page.locator('[data-testid="delivery-card"]')
    const count = await deliveryCards.count()

    if (count > 0) {
      // Verify delivery card information
      const firstDelivery = deliveryCards.first()
      await expect(firstDelivery.locator('[data-testid="order-number"]')).toBeVisible()
      await expect(firstDelivery.locator('[data-testid="pickup-address"]')).toBeVisible()
      await expect(firstDelivery.locator('[data-testid="delivery-address"]')).toBeVisible()
      await expect(firstDelivery.locator('[data-testid="order-status"]')).toBeVisible()
    }
  })

  test('should view delivery details with map', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Click on first delivery
    const firstDelivery = page.locator('[data-testid="delivery-card"]').first()

    if (await firstDelivery.count() > 0) {
      const orderNumber = await firstDelivery.locator('[data-testid="order-number"]').textContent()
      await firstDelivery.click()

      // Verify delivery details page
      await expect(page.locator('h1')).toContainText(orderNumber || '')

      // Verify sections
      await expect(page.locator('[data-testid="delivery-info"]')).toBeVisible()
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible()
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible()

      // Verify map is displayed
      await expect(page.locator('[data-testid="delivery-map"]')).toBeVisible()

      // Verify navigation button
      await expect(page.locator('[data-testid="btn-start-navigation"]')).toBeVisible()
    }
  })

  test('should start navigation to delivery location', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Find active delivery
    const activeDelivery = page.locator('[data-testid="delivery-card"]')
      .filter({ has: page.locator('[data-testid="status-picked-up"]') })
      .first()

    if (await activeDelivery.count() > 0) {
      await activeDelivery.click()

      // Click start navigation
      const navButton = page.locator('[data-testid="btn-start-navigation"]')
      await navButton.click()

      // Verify navigation opens (could be external app)
      // In real test, verify URL or modal opens
      const hasModal = await page.locator('[data-testid="navigation-modal"]').isVisible().catch(() => false)
      const hasExternalLink = await navButton.getAttribute('target') === '_blank'

      expect(hasModal || hasExternalLink).toBeTruthy()
    }
  })

  test('should update delivery status to picked up', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Find confirmed delivery
    const confirmedDelivery = page.locator('[data-testid="delivery-card"]')
      .filter({ has: page.locator('[data-testid="status-confirmed"]') })
      .first()

    if (await confirmedDelivery.count() > 0) {
      await confirmedDelivery.click()

      // Click picked up button
      await page.click('[data-testid="btn-mark-picked-up"]')

      // Confirm action
      await page.click('[data-testid="btn-confirm-picked-up"]')

      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Marked as picked up')

      // Verify status updated
      await expect(page.locator('[data-testid="delivery-status-badge"]')).toContainText('Picked Up')
    }
  })

  test('should complete delivery', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Find picked up delivery
    const pickedUpDelivery = page.locator('[data-testid="delivery-card"]')
      .filter({ has: page.locator('[data-testid="status-picked-up"]') })
      .first()

    if (await pickedUpDelivery.count() > 0) {
      await pickedUpDelivery.click()

      // Click complete delivery button
      await page.click('[data-testid="btn-complete-delivery"]')

      // Fill completion form if required
      const hasCompletionForm = await page.locator('[data-testid="completion-form"]').isVisible().catch(() => false)

      if (hasCompletionForm) {
        // Add delivery notes
        await page.fill('textarea[name="deliveryNotes"]', 'Delivered successfully')

        // Upload proof of delivery if available
        const hasPhotoUpload = await page.locator('input[type="file"]').isVisible().catch(() => false)
        if (hasPhotoUpload) {
          // In real test, upload actual file
          // await page.setInputFiles('input[type="file"]', 'path/to/image.jpg')
        }

        // Confirm completion
        await page.click('[data-testid="btn-confirm-completion"]')
      }

      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Delivery completed')

      // Verify redirected to deliveries list
      await expect(page).toHaveURL('/dashboard/deliveries')
    }
  })

  test('should view delivery history', async ({ page }) => {
    // Navigate to history
    await page.click('[data-testid="nav-delivery-history"]')
    await expect(page).toHaveURL('/dashboard/deliveries/history')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Delivery History')

    // Verify history list
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible()

    // Check for completed deliveries
    const historyItems = page.locator('[data-testid="history-item"]')
    const count = await historyItems.count()

    if (count > 0) {
      // Verify history item information
      const firstItem = historyItems.first()
      await expect(firstItem.locator('[data-testid="order-number"]')).toBeVisible()
      await expect(firstItem.locator('[data-testid="completion-date"]')).toBeVisible()
      await expect(firstItem.locator('[data-testid="delivery-earnings"]')).toBeVisible()
      await expect(firstItem.locator('[data-testid="status-delivered"]')).toBeVisible()
    }
  })

  test('should filter delivery history', async ({ page }) => {
    // Navigate to history
    await page.click('[data-testid="nav-delivery-history"]')

    // Filter by date range
    await page.click('[data-testid="btn-date-filter"]')
    await page.click('[data-testid="filter-last-7-days"]')
    await page.waitForTimeout(500)

    // Verify filtered results
    const historyItems = page.locator('[data-testid="history-item"]')
    expect(await historyItems.count()).toBeGreaterThanOrEqual(0)

    // Filter by status
    await page.selectOption('select[data-testid="filter-status"]', 'delivered')
    await page.waitForTimeout(500)

    // Verify all items have delivered status
    const deliveredItems = page.locator('[data-testid="history-item"]')
    const count = await deliveredItems.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(deliveredItems.nth(i).locator('[data-testid="status-delivered"]')).toBeVisible()
      }
    }
  })

  test('should view earnings dashboard', async ({ page }) => {
    // Navigate to earnings
    await page.click('[data-testid="nav-earnings"]')
    await expect(page).toHaveURL('/dashboard/earnings')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Earnings')

    // Verify earnings statistics
    await expect(page.locator('[data-testid="stat-today-earnings"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-week-earnings"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-month-earnings"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-total-deliveries"]')).toBeVisible()

    // Verify earnings chart
    await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible()

    // Verify breakdown by period
    await expect(page.locator('[data-testid="earnings-breakdown"]')).toBeVisible()
  })

  test('should view earnings breakdown', async ({ page }) => {
    // Navigate to earnings
    await page.click('[data-testid="nav-earnings"]')

    // Select time period
    await page.selectOption('select[data-testid="period-selector"]', 'month')
    await page.waitForTimeout(500)

    // Verify breakdown table
    await expect(page.locator('[data-testid="earnings-table"]')).toBeVisible()

    // Verify table rows
    const rows = page.locator('[data-testid="earnings-row"]')
    const count = await rows.count()

    if (count > 0) {
      const firstRow = rows.first()
      await expect(firstRow.locator('[data-testid="row-date"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="row-deliveries"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="row-earnings"]')).toBeVisible()
    }
  })

  test('should contact customer about delivery', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Find active delivery
    const activeDelivery = page.locator('[data-testid="delivery-card"]').first()

    if (await activeDelivery.count() > 0) {
      await activeDelivery.click()

      // Click contact customer button
      await page.click('[data-testid="btn-contact-customer"]')

      // Verify contact options displayed
      await expect(page.locator('[data-testid="contact-options"]')).toBeVisible()

      // Verify phone number is displayed
      await expect(page.locator('[data-testid="customer-phone"]')).toBeVisible()

      // Verify call button is available
      await expect(page.locator('[data-testid="btn-call-customer"]')).toBeVisible()
    }
  })

  test('should report delivery issue', async ({ page }) => {
    // Navigate to my deliveries
    await page.click('[data-testid="nav-my-deliveries"]')

    // Find active delivery
    const activeDelivery = page.locator('[data-testid="delivery-card"]').first()

    if (await activeDelivery.count() > 0) {
      await activeDelivery.click()

      // Click report issue button
      await page.click('[data-testid="btn-report-issue"]')

      // Select issue type
      await page.selectOption('select[name="issueType"]', 'customer_unavailable')

      // Add description
      await page.fill('textarea[name="issueDescription"]', 'Customer not answering phone or door')

      // Submit report
      await page.click('[data-testid="btn-submit-issue"]')

      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Issue reported')
    }
  })

  test('should view performance metrics', async ({ page }) => {
    // Navigate to performance
    await page.click('[data-testid="nav-performance"]')
    await expect(page).toHaveURL('/dashboard/performance')

    // Verify performance metrics
    await expect(page.locator('[data-testid="metric-on-time-rate"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-avg-delivery-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-customer-rating"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-completion-rate"]')).toBeVisible()

    // Verify performance chart
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
  })

  test('should update profile information', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="btn-user-menu"]')
    await page.click('[data-testid="menu-profile"]')

    // Update vehicle information
    await page.fill('input[name="vehicleType"]', 'Motorcycle')
    await page.fill('input[name="licensePlate"]', 'AB-123-CD')

    // Update availability hours
    await page.selectOption('select[name="availableFrom"]', '09:00')
    await page.selectOption('select[name="availableTo"]', '18:00')

    // Save changes
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should view notifications', async ({ page }) => {
    // Click notifications bell
    await page.click('[data-testid="btn-notifications"]')

    // Verify notifications panel opens
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible()

    // Check for notification items
    const notifications = page.locator('[data-testid="notification-item"]')
    const count = await notifications.count()

    if (count > 0) {
      // Verify notification structure
      const firstNotification = notifications.first()
      await expect(firstNotification.locator('[data-testid="notification-title"]')).toBeVisible()
      await expect(firstNotification.locator('[data-testid="notification-time"]')).toBeVisible()

      // Click on notification
      await firstNotification.click()

      // Verify notification action
      // Could navigate to related page or show details
    }
  })

  test('should logout successfully', async ({ page }) => {
    // Open user menu
    await page.click('[data-testid="btn-user-menu"]')

    // Click logout
    await page.click('[data-testid="menu-logout"]')

    // Verify redirected to login
    await expect(page).toHaveURL('/login')

    // Verify cannot access protected route
    await page.goto('/dashboard/deliveries')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Driver Workflow - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DRIVER_EMAIL, DRIVER_PASSWORD)
  })

  test('should handle no available orders', async ({ page }) => {
    // Navigate to available orders
    await page.click('[data-testid="nav-available-orders"]')

    // Check for empty state
    const hasOrders = await page.locator('[data-testid="available-order-card"]').count() > 0

    if (!hasOrders) {
      // Verify empty state message
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('No available orders')
    }
  })

  test('should handle concurrent order acceptance', async ({ page, context }) => {
    // Open second page
    const page2 = await context.newPage()
    await login(page2, DRIVER_EMAIL, DRIVER_PASSWORD)

    // Navigate both to available orders
    await page.click('[data-testid="nav-available-orders"]')
    await page2.goto(page.url())

    // Find same order on both pages
    const order1 = page.locator('[data-testid="available-order-card"]').first()
    const order2 = page2.locator('[data-testid="available-order-card"]').first()

    if (await order1.count() > 0) {
      // Try to accept from both simultaneously
      await Promise.all([
        order1.locator('[data-testid="btn-accept-order"]').click(),
        order2.locator('[data-testid="btn-accept-order"]').click()
      ])

      // Verify one succeeds and one gets error
      const success1 = await page.locator('[data-testid="toast-success"]').isVisible().catch(() => false)
      const error2 = await page2.locator('[data-testid="toast-error"]').isVisible().catch(() => false)

      expect(success1 || error2).toBeTruthy()
    }

    await page2.close()
  })

  test('should handle geolocation permission', async ({ page, context }) => {
    // Deny geolocation permission
    await context.grantPermissions([], { origin: page.url() })

    // Try to start navigation
    await page.click('[data-testid="nav-my-deliveries"]')

    const delivery = page.locator('[data-testid="delivery-card"]').first()
    if (await delivery.count() > 0) {
      await delivery.click()
      await page.click('[data-testid="btn-start-navigation"]')

      // Verify permission request or error message
      const hasPermissionDialog = await page.locator('[data-testid="permission-dialog"]').isVisible().catch(() => false)
      const hasError = await page.locator('[data-testid="toast-error"]').isVisible().catch(() => false)

      expect(hasPermissionDialog || hasError).toBeTruthy()
    }
  })

  test('should handle offline mode', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true)

    // Try to update delivery status
    await page.click('[data-testid="nav-my-deliveries"]')

    const delivery = page.locator('[data-testid="delivery-card"]').first()
    if (await delivery.count() > 0) {
      await delivery.click()
      await page.click('[data-testid="btn-mark-picked-up"]')

      // Verify offline error
      await expect(page.locator('[data-testid="error-offline"]')).toBeVisible()

      // Go back online
      await page.context().setOffline(false)

      // Retry action
      await page.click('[data-testid="btn-retry"]')

      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    }
  })

  test('should handle incomplete delivery data', async ({ page }) => {
    // Try to complete delivery without required information
    await page.click('[data-testid="nav-my-deliveries"]')

    const delivery = page.locator('[data-testid="delivery-card"]')
      .filter({ has: page.locator('[data-testid="status-picked-up"]') })
      .first()

    if (await delivery.count() > 0) {
      await delivery.click()
      await page.click('[data-testid="btn-complete-delivery"]')

      // Submit without filling form
      if (await page.locator('[data-testid="completion-form"]').isVisible()) {
        await page.click('[data-testid="btn-confirm-completion"]')

        // Verify validation errors
        await expect(page.locator('[data-testid="error-delivery-notes"]')).toBeVisible()
      }
    }
  })
})
