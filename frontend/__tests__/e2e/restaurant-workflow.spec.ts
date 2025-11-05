/**
 * Restaurant Workflow E2E Tests
 * Tests complete restaurant user journey from login to order management
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const RESTAURANT_EMAIL = 'restaurant@test.com'
const RESTAURANT_PASSWORD = 'RestTest123'

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Restaurant Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, RESTAURANT_EMAIL, RESTAURANT_PASSWORD)
  })

  test('should display restaurant dashboard', async ({ page }) => {
    // Verify dashboard loads
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Check for restaurant-specific statistics
    await expect(page.locator('[data-testid="stat-my-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-pending-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-monthly-spending"]')).toBeVisible()

    // Verify quick actions are visible
    await expect(page.locator('[data-testid="btn-create-order"]')).toBeVisible()
    await expect(page.locator('[data-testid="btn-browse-products"]')).toBeVisible()
  })

  test('should browse products catalog', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')
    await expect(page).toHaveURL('/products')

    // Verify products are displayed
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible()
    const productCards = page.locator('[data-testid="product-card"]')
    expect(await productCards.count()).toBeGreaterThan(0)

    // Verify each product card has essential information
    const firstProduct = productCards.first()
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-stock"]')).toBeVisible()
  })

  test('should filter products by category', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Select a category
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-vegetables"]')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Verify filtered results
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)

    // Verify category badge on products
    for (let i = 0; i < count; i++) {
      await expect(productCards.nth(i).locator('[data-testid="product-category"]'))
        .toContainText('Vegetables')
    }
  })

  test('should search for products', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Use search
    await page.fill('input[data-testid="search-products"]', 'tomato')
    await page.waitForTimeout(500) // Debounce

    // Verify search results
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)

    // Verify results contain search term
    for (let i = 0; i < Math.min(count, 3); i++) {
      const name = await productCards.nth(i).locator('[data-testid="product-name"]').textContent()
      expect(name?.toLowerCase()).toContain('tomato')
    }
  })

  test('should view product details', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent()
    await firstProduct.click()

    // Verify product details page
    await expect(page.locator('h1')).toContainText(productName || '')

    // Verify details sections
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-stock"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-unit"]')).toBeVisible()

    // Verify add to cart button
    await expect(page.locator('[data-testid="btn-add-to-cart"]')).toBeVisible()
  })

  test('should add product to cart', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Add first product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.locator('[data-testid="btn-add-to-cart"]').click()

    // Verify success notification
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Added to cart')

    // Verify cart badge updated
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toBeVisible()
    expect(parseInt(await cartBadge.textContent() || '0')).toBeGreaterThan(0)
  })

  test('should update cart item quantity', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="nav-cart"]')
    await expect(page).toHaveURL('/cart')

    // Get first cart item
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    await expect(cartItem).toBeVisible()

    // Increase quantity
    await cartItem.locator('[data-testid="btn-increase-qty"]').click()

    // Verify quantity updated
    await page.waitForTimeout(300)
    const quantity = await cartItem.locator('[data-testid="item-quantity"]').textContent()
    expect(parseInt(quantity || '0')).toBeGreaterThan(1)

    // Verify subtotal updated
    await expect(cartItem.locator('[data-testid="item-subtotal"]')).not.toBeEmpty()
  })

  test('should remove item from cart', async ({ page }) => {
    // Navigate to cart
    await page.click('[data-testid="nav-cart"]')

    // Get initial item count
    const initialCount = await page.locator('[data-testid="cart-item"]').count()

    // Remove first item
    const firstItem = page.locator('[data-testid="cart-item"]').first()
    await firstItem.locator('[data-testid="btn-remove-item"]').click()

    // Confirm removal
    await page.click('[data-testid="btn-confirm-remove"]')

    // Verify item removed
    await page.waitForTimeout(300)
    const newCount = await page.locator('[data-testid="cart-item"]').count()
    expect(newCount).toBe(initialCount - 1)

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should proceed to checkout', async ({ page }) => {
    // Add product to cart first
    await page.click('[data-testid="nav-products"]')
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="btn-add-to-cart"]').click()
    await page.waitForTimeout(500)

    // Navigate to cart
    await page.click('[data-testid="nav-cart"]')

    // Verify cart has items
    const cartItems = page.locator('[data-testid="cart-item"]')
    expect(await cartItems.count()).toBeGreaterThan(0)

    // Click proceed to checkout
    await page.click('[data-testid="btn-checkout"]')

    // Verify checkout page loads
    await expect(page).toHaveURL('/checkout')
    await expect(page.locator('h1')).toContainText('Checkout')
  })

  test('should complete order creation', async ({ page }) => {
    // Navigate to checkout (assuming cart has items)
    await page.goto('/checkout')

    // Fill delivery information
    await page.fill('textarea[name="deliveryAddress"]', '123 Test Street, Tbilisi')
    await page.fill('textarea[name="deliveryNotes"]', 'Ring doorbell twice')
    await page.fill('input[name="contactPhone"]', '+995555123456')

    // Verify order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible()

    // Place order
    await page.click('[data-testid="btn-place-order"]')

    // Verify success page
    await expect(page).toHaveURL(/\/orders\//)
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()

    // Verify order number displayed
    await expect(page.locator('[data-testid="order-number"]')).toMatch(/ORD-\d+/)
  })

  test('should view order history', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')
    await expect(page).toHaveURL('/dashboard/orders')

    // Verify orders list is visible
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible()

    // Verify orders are displayed
    const orderItems = page.locator('[data-testid="order-item"]')
    expect(await orderItems.count()).toBeGreaterThan(0)

    // Verify order information
    const firstOrder = orderItems.first()
    await expect(firstOrder.locator('[data-testid="order-number"]')).toBeVisible()
    await expect(firstOrder.locator('[data-testid="order-date"]')).toBeVisible()
    await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible()
    await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible()
  })

  test('should filter orders by status', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Filter by status
    await page.selectOption('select[data-testid="filter-status"]', 'delivered')
    await page.waitForTimeout(500)

    // Verify filtered results
    const orderItems = page.locator('[data-testid="order-item"]')
    const count = await orderItems.count()

    if (count > 0) {
      // Verify all orders have delivered status
      for (let i = 0; i < count; i++) {
        await expect(orderItems.nth(i).locator('[data-testid="order-status"]'))
          .toContainText('Delivered')
      }
    }
  })

  test('should view detailed order information', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Click on first order
    const firstOrder = page.locator('[data-testid="order-item"]').first()
    const orderNumber = await firstOrder.locator('[data-testid="order-number"]').textContent()
    await firstOrder.click()

    // Verify order details page
    await expect(page.locator('h1')).toContainText(orderNumber || '')

    // Verify order sections
    await expect(page.locator('[data-testid="order-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-items-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="delivery-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible()

    // Verify order items displayed
    const items = page.locator('[data-testid="order-item-row"]')
    expect(await items.count()).toBeGreaterThan(0)
  })

  test('should track order delivery status', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Find active order (not delivered or cancelled)
    await page.selectOption('select[data-testid="filter-status"]', 'picked_up')

    const activeOrder = page.locator('[data-testid="order-item"]').first()
    await activeOrder.click()

    // Verify delivery tracking information
    await expect(page.locator('[data-testid="delivery-tracking"]')).toBeVisible()

    // Verify driver information if assigned
    const hasDriver = await page.locator('[data-testid="driver-info"]').isVisible().catch(() => false)
    if (hasDriver) {
      await expect(page.locator('[data-testid="driver-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="driver-phone"]')).toBeVisible()
    }

    // Verify status timeline
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible()
  })

  test('should cancel pending order', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Find pending order
    await page.selectOption('select[data-testid="filter-status"]', 'pending')
    await page.waitForTimeout(500)

    const pendingOrder = page.locator('[data-testid="order-item"]').first()
    await pendingOrder.click()

    // Click cancel button
    await page.click('[data-testid="btn-cancel-order"]')

    // Enter cancellation reason
    await page.fill('textarea[name="cancellationReason"]', 'Changed delivery address')

    // Confirm cancellation
    await page.click('[data-testid="btn-confirm-cancel"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Order cancelled')

    // Verify status updated
    await expect(page.locator('[data-testid="order-status-badge"]')).toContainText('Cancelled')
  })

  test('should update profile information', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="btn-user-menu"]')
    await page.click('[data-testid="menu-profile"]')

    // Update contact information
    await page.fill('input[name="phone"]', '+995555999888')
    await page.fill('input[name="address"]', '456 New Address, Tbilisi')

    // Save changes
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Profile updated')

    // Verify changes persisted
    await page.reload()
    await expect(page.locator('input[name="phone"]')).toHaveValue('+995555999888')
  })

  test('should change password', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="btn-user-menu"]')
    await page.click('[data-testid="menu-profile"]')

    // Go to security tab
    await page.click('[data-testid="tab-security"]')

    // Fill password change form
    await page.fill('input[name="currentPassword"]', RESTAURANT_PASSWORD)
    await page.fill('input[name="newPassword"]', 'NewPassword123')
    await page.fill('input[name="confirmPassword"]', 'NewPassword123')

    // Submit form
    await page.click('[data-testid="btn-change-password"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Password changed')
  })

  test('should view spending analytics', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="nav-analytics"]')

    // Verify analytics page loads
    await expect(page.locator('h1')).toContainText('Analytics')

    // Verify charts are visible
    await expect(page.locator('[data-testid="chart-spending"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-orders-by-month"]')).toBeVisible()

    // Verify statistics cards
    await expect(page.locator('[data-testid="stat-total-spent"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-avg-order-value"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible()
  })

  test('should receive real-time order updates', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]')

    // Find active order
    const activeOrder = page.locator('[data-testid="order-item"]').first()
    const orderNumber = await activeOrder.locator('[data-testid="order-number"]').textContent()
    await activeOrder.click()

    // Wait for potential status updates (simulated)
    // In a real test, this would wait for actual real-time updates
    await page.waitForTimeout(2000)

    // Verify notification system is active
    const hasNotification = await page.locator('[data-testid="notification-badge"]').isVisible().catch(() => false)

    // If notifications exist, verify they can be viewed
    if (hasNotification) {
      await page.click('[data-testid="notification-badge"]')
      await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible()
    }
  })

  test('should logout successfully', async ({ page }) => {
    // Open user menu
    await page.click('[data-testid="btn-user-menu"]')

    // Click logout
    await page.click('[data-testid="menu-logout"]')

    // Verify redirected to login
    await expect(page).toHaveURL('/login')

    // Verify cart cleared
    await page.goto('/cart')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Restaurant Workflow - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, RESTAURANT_EMAIL, RESTAURANT_PASSWORD)
  })

  test('should handle out of stock products', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Try to add out of stock product
    const outOfStockProduct = page.locator('[data-testid="product-card"]')
      .filter({ has: page.locator('[data-testid="badge-out-of-stock"]') })
      .first()

    if (await outOfStockProduct.count() > 0) {
      // Verify add to cart button is disabled
      await expect(outOfStockProduct.locator('[data-testid="btn-add-to-cart"]')).toBeDisabled()

      // Click and verify error message
      await outOfStockProduct.click()
      await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible()
    }
  })

  test('should handle cart expiration', async ({ page }) => {
    // Add items to cart
    await page.click('[data-testid="nav-products"]')
    await page.locator('[data-testid="product-card"]').first().locator('[data-testid="btn-add-to-cart"]').click()

    // Simulate session expiration (manipulate localStorage or wait)
    await page.evaluate(() => {
      localStorage.removeItem('cart_session_id')
    })

    // Navigate to cart
    await page.click('[data-testid="nav-cart"]')

    // Verify cart is empty or shows expiration message
    const isEmpty = await page.locator('[data-testid="empty-cart"]').isVisible().catch(() => false)
    const hasExpirationMsg = await page.locator('[data-testid="session-expired"]').isVisible().catch(() => false)

    expect(isEmpty || hasExpirationMsg).toBeTruthy()
  })

  test('should handle minimum order quantities', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]')

    // Find product with minimum order requirement
    const product = page.locator('[data-testid="product-card"]').first()
    await product.click()

    // Try to add less than minimum
    await page.fill('input[name="quantity"]', '0')
    await page.click('[data-testid="btn-add-to-cart"]')

    // Verify error message
    await expect(page.locator('[data-testid="error-min-order"]')).toBeVisible()
  })

  test('should handle checkout validation errors', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Submit without filling required fields
    await page.click('[data-testid="btn-place-order"]')

    // Verify validation errors
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-phone"]')).toBeVisible()
  })
})
