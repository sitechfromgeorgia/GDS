# Administrator User Manual

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Language**: English

---

## Welcome

Welcome to the Distribution Management System! This guide will help you navigate and use all features available to administrators.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Order Management](#order-management)
5. [Product Management](#product-management)
6. [Driver Management](#driver-management)
7. [Reports and Analytics](#reports-and-analytics)
8. [System Settings](#system-settings)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Open your web browser
2. Navigate to the application URL
3. Enter your admin credentials:
   - **Email**: your-admin-email@example.com
   - **Password**: Your secure password
4. Click **Sign In**

### First-Time Login

If this is your first time logging in:

1. You'll be prompted to change your password
2. Enter a strong password (minimum 8 characters)
3. Click **Update Password**
4. You're now ready to use the system!

---

## Dashboard Overview

The admin dashboard provides a comprehensive view of your system.

### Dashboard Sections

#### 📊 Statistics Cards

**Total Orders**
- Shows total number of orders today
- Click to view detailed order list

**Active Drivers**
- Displays currently available drivers
- Shows drivers on deliveries

**Revenue Today**
- Today's total revenue
- Percentage change from yesterday

**Pending Orders**
- Orders awaiting confirmation
- Requires immediate attention

#### 📈 Charts and Graphs

**Order Status Distribution**
- Pie chart showing order statuses
- Helps identify bottlenecks

**Revenue Trend**
- Line chart showing daily revenue
- Compare with previous periods

**Popular Products**
- Bar chart of best-selling products
- Helps with inventory planning

#### 🔔 Recent Activity

- Real-time feed of system events
- Shows order updates, user activities
- Click any item for details

---

## User Management

### Viewing Users

1. Click **Users** in the left sidebar
2. See list of all system users
3. Filter by role: Admin, Restaurant, Driver
4. Use search box to find specific users

### Creating New User

1. Go to **Users** page
2. Click **Add User** button
3. Fill in user details:
   ```
   Full Name: John Doe
   Email: john@example.com
   Phone: +995 555 123 456
   Role: Select from dropdown
   ```
4. Click **Create User**
5. User will receive email with login credentials

### User Roles

**Admin**
- Full system access
- Can manage all users
- Can view all orders
- Can assign drivers to orders

**Restaurant**
- Can create orders
- Can view own orders
- Can manage products
- Can update order status

**Driver**
- Can view assigned orders
- Can update delivery status
- Can mark deliveries complete
- Can toggle availability

### Editing User

1. Find user in list
2. Click **Edit** icon (pencil)
3. Update information
4. Click **Save Changes**

### Deactivating User

1. Find user in list
2. Click **Actions** dropdown
3. Select **Deactivate**
4. Confirm action
5. User can no longer log in

### Reactivating User

1. Filter by **Inactive Users**
2. Find deactivated user
3. Click **Actions** > **Reactivate**
4. User can now log in again

---

## Order Management

### Viewing All Orders

1. Click **Orders** in sidebar
2. See comprehensive order list
3. Default view shows today's orders

### Filtering Orders

**By Status**:
- Pending
- Confirmed
- Priced
- Assigned
- Picked Up
- In Transit
- Delivered
- Cancelled

**By Date Range**:
1. Click date picker
2. Select start date
3. Select end date
4. Click **Apply**

**By Restaurant**:
1. Click restaurant dropdown
2. Select restaurant name
3. View filtered results

**By Driver**:
1. Click driver dropdown
2. Select driver name
3. View assigned orders

### Viewing Order Details

1. Click on any order in list
2. Dialog opens with full details:
   - Order number and status
   - Restaurant information
   - Delivery address
   - Items ordered with quantities
   - Total amount
   - Driver assignment
   - Status history

### Assigning Driver to Order

1. Open order details
2. Click **Assign Driver** button
3. Select from available drivers list
4. Click **Confirm Assignment**
5. Driver receives notification

**Auto-Assignment** (Coming Soon):
- System automatically assigns nearest available driver
- Based on location and workload

### Updating Order Status

1. Open order details
2. Click **Update Status** button
3. Select new status from dropdown
4. Add notes (optional)
5. Click **Update**

**Status Flow**:
```
Pending → Confirmed → Priced → Assigned →
Picked Up → In Transit → Delivered
```

**Cancellation**:
- Can cancel from any status
- Add cancellation reason
- Notify restaurant and driver

### Manual Order Creation

1. Go to **Orders** page
2. Click **Create Order** button
3. Fill in order form:
   - Select restaurant
   - Add delivery address
   - Add items and quantities
   - Add delivery notes
4. Click **Create Order**

---

## Product Management

### Viewing Products

1. Click **Products** in sidebar
2. Browse product catalog
3. See product details, prices, stock

### Adding New Product

1. Go to **Products** page
2. Click **Add Product** button
3. Fill in product information:
   ```
   Product Name: Fresh Milk
   SKU: MILK-001
   Category: Dairy
   Price: 5.50 GEL
   Unit: Liter
   Stock: 100
   Description: Fresh whole milk
   ```
4. Upload product image (optional)
5. Toggle **Available** if ready to sell
6. Click **Save Product**

### Editing Product

1. Find product in list
2. Click **Edit** icon
3. Update information
4. Click **Save Changes**

### Managing Categories

1. Go to **Products** > **Categories**
2. View all product categories
3. Add new category:
   - Click **Add Category**
   - Enter name and description
   - Click **Save**
4. Edit/delete existing categories

### Stock Management

**Viewing Low Stock**:
1. Go to **Products**
2. Click **Low Stock** filter
3. See products needing restock

**Updating Stock**:
1. Open product details
2. Click **Update Stock**
3. Enter new quantity
4. Click **Save**

**Bulk Stock Update**:
1. Go to **Products** > **Bulk Actions**
2. Upload CSV file
3. System updates all products
4. View import summary

---

## Driver Management

### Viewing Drivers

1. Click **Drivers** in sidebar
2. See all registered drivers
3. View availability status

### Driver Status

**Available** (Green):
- Driver is online and ready
- Can receive new assignments

**Busy** (Orange):
- Driver has active delivery
- Cannot receive new orders

**Offline** (Gray):
- Driver is not available
- Will not receive assignments

### Viewing Driver Location

1. Go to **Drivers** page
2. Click **Map View** button
3. See all drivers on map
4. Real-time location updates

### Driver Performance

1. Click on driver name
2. View driver stats:
   - Total deliveries completed
   - Average delivery time
   - Customer ratings
   - On-time delivery percentage

### Assigning Orders to Drivers

**Manual Assignment**:
1. Open order details
2. Click **Assign Driver**
3. Select driver from list
4. Distances shown for each driver
5. Click **Assign**

**Best Practices**:
- Assign to nearest available driver
- Consider current workload
- Check driver ratings

---

## Reports and Analytics

### Order Reports

**Daily Order Report**:
1. Go to **Reports** > **Orders**
2. Select date range
3. Click **Generate Report**
4. View:
   - Total orders
   - Orders by status
   - Revenue breakdown
5. Export to PDF or Excel

**Monthly Summary**:
1. Go to **Reports** > **Monthly**
2. Select month
3. View comprehensive summary:
   - Total orders and revenue
   - Average order value
   - Top restaurants
   - Top products
   - Driver performance

### Revenue Reports

**Revenue by Period**:
1. Go to **Reports** > **Revenue**
2. Select time period
3. View revenue charts:
   - Daily revenue trend
   - Revenue by restaurant
   - Revenue by product category

**Export Options**:
- PDF for printing
- Excel for analysis
- CSV for import

### Driver Performance Reports

1. Go to **Reports** > **Drivers**
2. Select date range
3. View metrics:
   - Deliveries completed
   - Average delivery time
   - Customer ratings
   - Revenue generated

### Custom Reports

1. Go to **Reports** > **Custom**
2. Select report criteria:
   - Date range
   - Metrics to include
   - Filters to apply
3. Click **Generate**
4. Save report template for reuse

---

## System Settings

### General Settings

1. Go to **Settings** > **General**
2. Configure:
   - System name
   - Contact information
   - Business hours
   - Time zone
   - Currency

### Order Settings

**Order Configuration**:
- Minimum order amount
- Delivery fee structure
- Auto-assignment rules
- Order timeout durations

**Status Transition Rules**:
- Define who can change status
- Set automatic transitions
- Configure notifications

### Notification Settings

**Email Notifications**:
- Order confirmations
- Status updates
- Daily summaries

**SMS Notifications** (if configured):
- Delivery updates
- Driver assignments

**In-App Notifications**:
- Real-time order updates
- System alerts

### User Permissions

1. Go to **Settings** > **Permissions**
2. Configure role-based access:
   - Admin permissions
   - Restaurant permissions
   - Driver permissions
3. Enable/disable features per role

### Backup and Maintenance

**Database Backup**:
- Automatic daily backups at 2 AM
- Retention: 7 days
- Download backup manually

**System Maintenance**:
- Schedule maintenance windows
- Notify users of downtime
- View system health status

---

## Troubleshooting

### Common Issues

#### Users Cannot Log In

**Problem**: User getting "Invalid credentials" error

**Solutions**:
1. Verify email address is correct
2. Check if user account is active
3. Reset password:
   - Go to **Users**
   - Find user
   - Click **Reset Password**
   - User receives email with new password

#### Orders Not Updating

**Problem**: Order status not changing in real-time

**Solutions**:
1. Refresh browser page (F5)
2. Check internet connection
3. Log out and log back in
4. Clear browser cache

#### Driver Not Receiving Orders

**Problem**: Driver says they're available but not getting assignments

**Solutions**:
1. Check driver availability status
2. Verify driver app is open
3. Check internet connection
4. Reassign order manually

#### Reports Not Generating

**Problem**: Report generation fails or takes too long

**Solutions**:
1. Reduce date range
2. Try downloading in different format
3. Check browser console for errors
4. Contact support if persists

### Getting Help

**In-App Support**:
1. Click **Help** icon (question mark)
2. Browse help articles
3. Search for specific topics

**Contact Support**:
- Email: support@example.com
- Phone: +995 32 123 4567
- Hours: Monday-Friday, 9 AM - 6 PM

**Submit Bug Report**:
1. Go to **Settings** > **Support**
2. Click **Report Issue**
3. Describe problem
4. Attach screenshots if possible
5. Submit report

---

## Best Practices

### Order Management

✅ **DO**:
- Confirm orders within 5 minutes
- Assign drivers based on proximity
- Monitor order progress regularly
- Communicate with restaurants/drivers

❌ **DON'T**:
- Leave orders unconfirmed for long periods
- Assign unavailable drivers
- Skip status updates
- Ignore customer complaints

### User Management

✅ **DO**:
- Regularly review user accounts
- Deactivate unused accounts
- Use strong passwords
- Keep contact information updated

❌ **DON'T**:
- Share admin credentials
- Create duplicate accounts
- Leave test accounts active
- Use simple passwords

### System Security

✅ **DO**:
- Log out when done
- Change password regularly (every 3 months)
- Review activity logs
- Report suspicious activity

❌ **DON'T**:
- Share login credentials
- Use public computers
- Save passwords in browser
- Ignore security warnings

---

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New order |
| `Ctrl/Cmd + /` | Show shortcuts |
| `Esc` | Close dialog |
| `Arrow keys` | Navigate lists |
| `Enter` | Open selected item |
| `Ctrl/Cmd + S` | Save changes |

---

## Glossary

**Order Number**: Unique identifier for each order (e.g., ORD-20250105-001)

**SKU**: Stock Keeping Unit - unique product identifier

**RLS**: Row Level Security - database security feature

**Real-time Updates**: Instant notifications when data changes

**Status Transition**: Moving order from one status to another

**Delivery Window**: Time period for delivery

**Fulfillment**: Complete process from order to delivery

---

## Appendix

### Order Status Descriptions

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **Pending** | Order created, awaiting confirmation | Restaurant |
| **Confirmed** | Restaurant confirmed order | Restaurant |
| **Priced** | Prices added/confirmed | Restaurant/Admin |
| **Assigned** | Driver assigned to order | Admin |
| **Picked Up** | Driver collected order | Driver |
| **In Transit** | En route to delivery address | Driver |
| **Delivered** | Successfully delivered | Driver |
| **Cancelled** | Order cancelled | All roles |

### Sample Workflows

**Typical Order Flow**:
1. Restaurant creates order → Pending
2. Restaurant confirms order → Confirmed
3. Restaurant sets prices → Priced
4. Admin assigns driver → Assigned
5. Driver picks up → Picked Up
6. Driver delivers → In Transit → Delivered

**Cancellation Flow**:
1. Any status → Cancelled
2. Add cancellation reason
3. Notify all parties
4. Remove from active orders

---

## Quick Reference Card

Print this page and keep it handy!

### Admin Daily Tasks

**Morning**:
- [ ] Review overnight orders
- [ ] Check driver availability
- [ ] Assign pending orders
- [ ] Review low stock items

**Throughout Day**:
- [ ] Monitor order progress
- [ ] Respond to issues
- [ ] Assist restaurants/drivers
- [ ] Update order statuses

**Evening**:
- [ ] Review day's performance
- [ ] Generate daily report
- [ ] Check for undelivered orders
- [ ] Plan tomorrow's assignments

### Emergency Contacts

| Role | Contact |
|------|---------|
| **Technical Support** | support@example.com |
| **Phone Support** | +995 32 123 4567 |
| **After Hours** | +995 555 911 911 |

---

**End of Administrator User Manual**

*For additional help, contact support@example.com*
