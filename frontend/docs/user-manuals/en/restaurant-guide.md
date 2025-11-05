# Restaurant User Manual

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Language**: English

---

## Welcome

Welcome to the Distribution Management System! This guide will help you create orders, manage products, and track deliveries efficiently.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating Orders](#creating-orders)
4. [Managing Orders](#managing-orders)
5. [Product Management](#product-management)
6. [Order History](#order-history)
7. [Notifications](#notifications)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Open your web browser
2. Go to the application URL
3. Enter your credentials:
   - **Email**: your-restaurant-email@example.com
   - **Password**: Your password
4. Click **Sign In**

### Forgot Password?

1. Click **Forgot Password** on login page
2. Enter your email address
3. Click **Send Reset Link**
4. Check your email
5. Follow instructions to reset password

---

## Dashboard Overview

Your dashboard shows key information at a glance.

### Dashboard Sections

#### 📊 Today's Statistics

**Orders Today**
- Total orders you've created today
- Breakdown by status

**Pending Orders**
- Orders awaiting confirmation
- **Action required!**

**In Delivery**
- Orders currently being delivered
- Track progress in real-time

**Completed Today**
- Successfully delivered orders
- Today's completion rate

#### 📦 Recent Orders

- Shows your last 10 orders
- Status updates in real-time
- Click to view details

#### 🔔 Notifications

- New messages from admin
- Driver assignment updates
- Delivery confirmations

---

## Creating Orders

### Quick Order Creation

1. Click **New Order** button (big plus icon)
2. Order creation dialog opens
3. Follow the steps below

### Step 1: Delivery Information

Fill in delivery details:

```
Delivery Address*: [Enter full address]
Building/Apartment: [Optional]
Contact Phone*: +995 555 123 456
Delivery Notes: [Optional special instructions]
```

**Tips**:
- Be specific with address
- Include landmarks if needed
- Add phone number for driver contact

### Step 2: Add Products

**Add Items to Order**:

1. Click **Add Item** button
2. Search for product:
   - Type product name in search box
   - Or browse categories
3. Select product from list
4. Enter quantity
5. Click **Add to Order**

**Repeat for all items**.

**Example**:
```
Product: Fresh Milk
Quantity: 10
Unit: Liter

Product: White Bread
Quantity: 20
Unit: Loaf
```

### Step 3: Review Order

Before submitting, review:

- ✅ Delivery address correct
- ✅ All items added
- ✅ Quantities correct
- ✅ Contact phone number included

### Step 4: Create Order

1. Click **Create Order** button
2. Order is created with status **Pending**
3. You'll see order confirmation
4. Order appears in your orders list

---

## Managing Orders

### Viewing Your Orders

1. Click **Orders** in sidebar
2. See all your orders
3. Default view: Today's orders

### Order Statuses

Your orders go through these statuses:

| Status | Description | Your Action |
|--------|-------------|-------------|
| **Pending** | Just created | Confirm order |
| **Confirmed** | You confirmed | Add prices (if needed) |
| **Priced** | Prices added | Wait for driver assignment |
| **Assigned** | Driver assigned | None |
| **Picked Up** | Driver collected | None |
| **In Transit** | Being delivered | None |
| **Delivered** | Completed ✅ | None |
| **Cancelled** | Cancelled ❌ | None |

### Confirming Orders

After creating an order:

1. Open order details
2. Review items and delivery info
3. Click **Confirm Order** button
4. Status changes to **Confirmed**

**⚠️ Important**: Confirm orders quickly to ensure fast delivery!

### Adding/Updating Prices

If you need to add or update prices:

1. Open order details
2. Click **Edit Prices** button
3. Update prices for items
4. Click **Save Prices**
5. Status changes to **Priced**

### Viewing Order Details

1. Click on any order in list
2. Dialog opens showing:
   - Order number
   - Current status
   - Delivery address
   - All items with quantities
   - Total amount
   - Driver info (if assigned)
   - Status history

### Tracking Delivery

**Once Driver Assigned**:

1. Open order details
2. Click **Track Delivery** button
3. See driver location on map
4. Estimated time of arrival shown
5. Updates automatically

### Cancelling Orders

**Can cancel if**:
- Status is Pending, Confirmed, or Priced
- Not yet picked up by driver

**How to cancel**:

1. Open order details
2. Click **Cancel Order** button
3. Select cancellation reason:
   - Customer requested
   - Wrong items
   - Address error
   - Other (specify)
4. Click **Confirm Cancellation**
5. Order marked as Cancelled

**⚠️ Note**: Cannot cancel after driver picks up order!

---

## Product Management

### Viewing Products

1. Click **Products** in sidebar
2. Browse product catalog
3. See available products with prices

### Product Information

Each product shows:
- Product name
- SKU (stock keeping unit)
- Category
- Current price
- Unit (kg, liter, piece, etc.)
- Stock availability

### Searching Products

**Quick Search**:
1. Use search box at top
2. Type product name or SKU
3. Results filter in real-time

**Filter by Category**:
1. Click **Category** dropdown
2. Select category (Dairy, Bakery, etc.)
3. View filtered products

### Requesting New Products

If a product you need is not available:

1. Go to **Products** page
2. Click **Request Product** button
3. Fill in request form:
   ```
   Product Name: Fresh Yogurt
   Category: Dairy
   Suggested Price: 3.50 GEL
   Description: Natural yogurt, 500g
   ```
4. Submit request
5. Admin will review and add if approved

---

## Order History

### Viewing Past Orders

1. Click **Orders** > **History**
2. See all your historical orders
3. Grouped by date

### Filtering History

**By Date Range**:
1. Click date picker
2. Select start date
3. Select end date
4. Click **Apply**

**By Status**:
1. Click status dropdown
2. Select status to view
3. See filtered results

### Generating Reports

**Order Summary Report**:

1. Go to **Reports** section
2. Select date range
3. Click **Generate Report**
4. View summary:
   - Total orders
   - Total amount
   - Orders by status
   - Most ordered products
5. Download PDF or print

**Monthly Report**:
1. Select month
2. Click **Generate Monthly Report**
3. Comprehensive monthly summary

---

## Notifications

### Real-Time Notifications

You receive notifications for:

- ✅ Order confirmed
- 🚚 Driver assigned to order
- 📦 Order picked up
- 🚗 Order in transit
- ✅ Order delivered
- ❌ Order cancelled
- 💬 Messages from admin

### Notification Settings

1. Click your name (top right)
2. Select **Settings**
3. Go to **Notifications** tab
4. Enable/disable notification types:
   - Browser notifications
   - Email notifications
   - SMS notifications (if available)

### Viewing Notifications

1. Click bell icon (🔔) in top bar
2. See recent notifications
3. Click to view details
4. Mark as read

---

## Profile Settings

### Updating Your Profile

1. Click your name (top right)
2. Select **Profile**
3. Update information:
   - Full name
   - Phone number
   - Business address
   - Restaurant name
4. Click **Save Changes**

### Changing Password

1. Go to **Profile** > **Security**
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click **Update Password**

**Password Requirements**:
- Minimum 8 characters
- Mix of letters and numbers
- At least one special character (recommended)

---

## Troubleshooting

### Common Issues

#### Cannot Create Order

**Problem**: "Create Order" button not working

**Solutions**:
1. Check internet connection
2. Refresh page (F5)
3. Try logging out and back in
4. Clear browser cache
5. Contact support if persists

#### Products Not Loading

**Problem**: Product list is empty or not loading

**Solutions**:
1. Refresh page
2. Check search filters
3. Check category filter
4. Try different browser

#### Order Not Updating

**Problem**: Order status not changing

**Solutions**:
1. Refresh page (F5)
2. Check internet connection
3. Wait a few minutes (may be delayed)
4. Contact admin if urgent

#### Cannot Track Delivery

**Problem**: Map not showing or driver location not updating

**Solutions**:
1. Ensure order has driver assigned
2. Refresh page
3. Check browser location permissions
4. Try on different device

### Getting Help

**In-App Support**:
1. Click **Help** icon (?)
2. Browse help articles
3. Search for your issue

**Contact Support**:
- **Email**: support@example.com
- **Phone**: +995 32 123 4567
- **Hours**: Monday-Friday, 9 AM - 6 PM

**Contact Admin**:
- Click **Messages** icon
- Send message to administrator
- Expect response within 1 hour

---

## Best Practices

### Creating Efficient Orders

✅ **DO**:
- Double-check delivery address
- Include contact phone number
- Confirm orders quickly
- Add delivery notes if needed
- Review items before submitting

❌ **DON'T**:
- Leave orders unconfirmed
- Forget to add quantities
- Use incomplete addresses
- Cancel orders unnecessarily
- Wait too long to place orders

### Communication

✅ **DO**:
- Respond to admin messages
- Provide accurate information
- Report issues promptly
- Keep contact info updated

❌ **DON'T**:
- Ignore notifications
- Provide wrong phone numbers
- Wait too long to report problems

### Account Security

✅ **DO**:
- Use strong password
- Log out when done
- Keep login details private
- Change password regularly

❌ **DON'T**:
- Share your password
- Use public computers
- Save password in browser
- Use simple passwords

---

## Keyboard Shortcuts

Make your work faster!

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New order |
| `Ctrl/Cmd + K` | Search products |
| `Ctrl/Cmd + /` | Show all shortcuts |
| `Esc` | Close dialog |
| `Arrow keys` | Navigate lists |
| `Enter` | Open selected item |

---

## Quick Reference Guide

### Daily Workflow

**Morning**:
1. Log in to system
2. Review any pending orders
3. Confirm new orders

**Throughout Day**:
1. Create orders as needed
2. Monitor order progress
3. Respond to notifications

**Evening**:
1. Review today's deliveries
2. Check for any issues
3. Plan tomorrow's orders

### Order Creation Checklist

- [ ] Enter complete delivery address
- [ ] Add contact phone number
- [ ] Search and add all products
- [ ] Verify quantities correct
- [ ] Add delivery notes if needed
- [ ] Review order summary
- [ ] Click Create Order
- [ ] Confirm order promptly

### When to Contact Support

- Order stuck in same status > 1 hour
- Cannot log in after password reset
- Products missing from catalog
- System error messages
- Delivery issues or delays

---

## FAQ

**Q: How long does delivery take?**
A: Average 30-60 minutes after driver assignment. Track in real-time!

**Q: Can I edit order after creation?**
A: Yes, before it's confirmed. After confirmation, contact admin.

**Q: What if I enter wrong address?**
A: Cancel order and create new one if not yet picked up.

**Q: Can I see who my driver is?**
A: Yes, once assigned you'll see driver name and phone.

**Q: What if driver cannot find address?**
A: Driver will call phone number provided. Keep phone nearby!

**Q: Can I place orders for future delivery?**
A: Currently same-day delivery only. Feature coming soon!

**Q: Who sets product prices?**
A: Prices are pre-set. You can request updates through admin.

**Q: What if product is out of stock?**
A: System shows availability. Request alternative or wait for restock.

---

## Contact Information

### Technical Support
- **Email**: support@example.com
- **Phone**: +995 32 123 4567
- **Hours**: Mon-Fri, 9 AM - 6 PM

### Emergency Contact
- **After Hours**: +995 555 911 911
- **For urgent delivery issues**

### Feedback
- **Email**: feedback@example.com
- **We appreciate your suggestions!**

---

**End of Restaurant User Manual**

*For additional help, contact support@example.com*
