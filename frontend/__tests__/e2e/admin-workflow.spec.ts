/**
 * Admin Workflow E2E Tests
 * Tests complete admin user journey from login to management operations
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const ADMIN_EMAIL = 'admin@test.com'
const ADMIN_PASSWORD = 'AdminTest123'

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  })

  test('should display admin dashboard with statistics', async ({ page }) => {
    // Verify dashboard loads
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Check for key statistics
    await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-total-products"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-total-revenue"]')).toBeVisible()

    // Verify statistics have values
    const totalOrders = await page.locator('[data-testid="stat-total-orders"]').textContent()
    expect(totalOrders).toBeTruthy()
  })

  test('should navigate to user management', async ({ page }) => {
    // Click on user management in sidebar
    await page.click('[data-testid="nav-users"]')
    await expect(page).toHaveURL('/dashboard/users')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Users')

    // Verify user table is visible
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
  })

  test('should create new restaurant user', async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="nav-users"]')
    await expect(page).toHaveURL('/dashboard/users')

    // Click create user button
    await page.click('[data-testid="btn-create-user"]')

    // Fill in user form
    await page.fill('input[name="email"]', `newrest${Date.now()}@test.com`)
    await page.fill('input[name="password"]', 'RestTest123')
    await page.fill('input[name="fullName"]', 'New Restaurant')
    await page.fill('input[name="phone"]', '+995555123456')
    await page.selectOption('select[name="role"]', 'restaurant')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('User created')

    // Verify user appears in table
    await expect(page.locator('[data-testid="users-table"]')).toContainText('New Restaurant')
  })

  test('should update user role', async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="nav-users"]')

    // Find first restaurant user in table
    const firstUser = page.locator('[data-testid="user-row"]').first()
    await firstUser.click()

    // Open role change dialog
    await page.click('[data-testid="btn-change-role"]')

    // Select new role
    await page.selectOption('select[name="role"]', 'driver')

    // Confirm change
    await page.click('[data-testid="btn-confirm-role-change"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Role updated')
  })

  test('should deactivate user account', async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="nav-users"]')

    // Find user to deactivate
    const userRow = page.locator('[data-testid="user-row"]').first()
    await userRow.click()

    // Open actions menu
    await page.click('[data-testid="btn-user-actions"]')

    // Click deactivate
    await page.click('[data-testid="action-deactivate"]')

    // Confirm in dialog
    await page.click('[data-testid="btn-confirm-deactivate"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Verify status badge changed
    await expect(userRow.locator('[data-testid="user-status"]')).toContainText('Inactive')
  })

  test('should search and filter users', async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="nav-users"]')

    // Use search
    await page.fill('input[data-testid="search-users"]', 'restaurant')
    await page.waitForTimeout(500) // Wait for debounce

    // Verify filtered results
    const rows = page.locator('[data-testid="user-row"]')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)

    // Verify all visible users contain search term
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('restaurant')
    }

    // Filter by role
    await page.selectOption('select[data-testid="filter-role"]', 'driver')
    await page.waitForTimeout(500)

    // Verify filtered by role
    const roleRows = page.locator('[data-testid="user-row"]')
    const roleCount = await roleRows.count()
    for (let i = 0; i < roleCount; i++) {
      await expect(roleRows.nth(i).locator('[data-testid="user-role"]')).toContainText('Driver')
    }
  })

  test('should navigate to order management', async ({ page }) => {
    // Click on orders in sidebar
    await page.click('[data-testid="nav-orders"]')
    await expect(page).toHaveURL('/dashboard/orders')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Orders')

    // Verify orders table is visible
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible()
  })

  test('should view order details', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Click on first order
    const firstOrder = page.locator('[data-testid="order-row"]').first()
    const orderNumber = await firstOrder.locator('[data-testid="order-number"]').textContent()
    await firstOrder.click()

    // Verify order details page
    await expect(page.locator('h1')).toContainText(orderNumber || '')

    // Verify order information sections
    await expect(page.locator('[data-testid="order-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible()
  })

  test('should assign driver to order', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Find pending order
    await page.selectOption('select[data-testid="filter-status"]', 'pending')
    await page.waitForTimeout(500)

    const pendingOrder = page.locator('[data-testid="order-row"]').first()
    await pendingOrder.click()

    // Click assign driver
    await page.click('[data-testid="btn-assign-driver"]')

    // Select available driver
    await page.selectOption('select[name="driverId"]', { index: 1 })

    // Confirm assignment
    await page.click('[data-testid="btn-confirm-assign"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Driver assigned')

    // Verify driver info displayed
    await expect(page.locator('[data-testid="order-driver"]')).toBeVisible()
  })

  test('should update order status', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Find confirmed order
    await page.selectOption('select[data-testid="filter-status"]', 'confirmed')
    await page.waitForTimeout(500)

    const order = page.locator('[data-testid="order-row"]').first()
    await order.click()

    // Click update status
    await page.click('[data-testid="btn-update-status"]')

    // Select new status
    await page.selectOption('select[name="status"]', 'preparing')

    // Confirm update
    await page.click('[data-testid="btn-confirm-status"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Verify status badge updated
    await expect(page.locator('[data-testid="order-status-badge"]')).toContainText('Preparing')
  })

  test('should navigate to product management', async ({ page }) => {
    // Click on products in sidebar
    await page.click('[data-testid="nav-products"]')
    await expect(page).toHaveURL('/dashboard/products')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Products')

    // Verify products grid is visible
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible()
  })

  test('should create new product', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Click create product
    await page.click('[data-testid="btn-create-product"]')

    // Fill product form
    await page.fill('input[name="name"]', `Test Product ${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test product description')
    await page.fill('input[name="price"]', '15.99')
    await page.fill('input[name="stock"]', '100')
    await page.selectOption('select[name="categoryId"]', { index: 1 })
    await page.fill('input[name="unit"]', 'kg')
    await page.fill('input[name="minOrder"]', '1')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Product created')
  })

  test('should update product stock', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Find product
    const product = page.locator('[data-testid="product-card"]').first()
    await product.click()

    // Click update stock
    await page.click('[data-testid="btn-update-stock"]')

    // Enter new stock value
    await page.fill('input[name="stockChange"]', '50')

    // Confirm update
    await page.click('[data-testid="btn-confirm-stock-update"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should view reports and analytics', async ({ page }) => {
    // Navigate to reports
    await page.click('[data-testid="nav-reports"]')
    await expect(page).toHaveURL('/dashboard/reports')

    // Verify charts are visible
    await expect(page.locator('[data-testid="chart-revenue"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-orders"]')).toBeVisible()

    // Select date range
    await page.click('[data-testid="btn-date-range"]')
    await page.click('[data-testid="range-last-30-days"]')

    // Verify data updates
    await expect(page.locator('[data-testid="report-total"]')).toBeVisible()
  })

  test('should export report data', async ({ page }) => {
    // Navigate to reports
    await page.click('[data-testid="nav-reports"]')

    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="btn-export-csv"]')
    const download = await downloadPromise

    // Verify download started
    expect(download.suggestedFilename()).toContain('report')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should search across dashboard', async ({ page }) => {
    // Use global search
    await page.click('[data-testid="btn-global-search"]')
    await page.fill('input[data-testid="global-search-input"]', 'ORD-')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Verify results contain orders
    await expect(page.locator('[data-testid="search-results"]')).toContainText('ORD-')

    // Click on result
    await page.locator('[data-testid="search-result-item"]').first().click()

    // Verify navigated to order
    await expect(page).toHaveURL(/\/dashboard\/orders\//)
  })

  test('should update admin profile settings', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="btn-user-menu"]')
    await page.click('[data-testid="menu-profile"]')

    // Update profile information
    await page.fill('input[name="fullName"]', 'Updated Admin Name')
    await page.fill('input[name="phone"]', '+995555999888')

    // Save changes
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Profile updated')
  })

  test('should logout successfully', async ({ page }) => {
    // Open user menu
    await page.click('[data-testid="btn-user-menu"]')

    // Click logout
    await page.click('[data-testid="menu-logout"]')

    // Verify redirected to login
    await expect(page).toHaveURL('/login')

    // Verify cannot access protected route
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Admin Workflow - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  })

  test('should handle validation errors gracefully', async ({ page }) => {
    // Navigate to user creation
    await page.click('[data-testid="nav-users"]')
    await page.click('[data-testid="btn-create-user"]')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Verify validation errors displayed
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-password"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-fullName"]')).toBeVisible()
  })

  test('should handle network errors', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)

    // Try to navigate
    await page.click('[data-testid="nav-orders"]')

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('connection')

    // Reconnect
    await page.context().setOffline(false)

    // Retry
    await page.click('[data-testid="btn-retry"]')

    // Verify page loads
    await expect(page).toHaveURL('/dashboard/orders')
  })

  test('should handle concurrent updates', async ({ page, context }) => {
    // Open two pages
    const page2 = await context.newPage()
    await login(page2, ADMIN_EMAIL, ADMIN_PASSWORD)

    // Navigate both to same order
    await page.click('[data-testid="nav-orders"]')
    const firstOrder = page.locator('[data-testid="order-row"]').first()
    await firstOrder.click()

    await page2.goto(page.url())

    // Update status in first page
    await page.click('[data-testid="btn-update-status"]')
    await page.selectOption('select[name="status"]', 'preparing')
    await page.click('[data-testid="btn-confirm-status"]')

    // Try to update in second page
    await page2.click('[data-testid="btn-update-status"]')

    // Verify conflict warning or auto-refresh
    const hasWarning = await page2.locator('[data-testid="conflict-warning"]').isVisible().catch(() => false)
    const hasRefresh = await page2.locator('[data-testid="order-status-badge"]').textContent() === 'Preparing'

    expect(hasWarning || hasRefresh).toBeTruthy()

    await page2.close()
  })
})
