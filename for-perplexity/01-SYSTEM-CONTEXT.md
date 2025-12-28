# System Context - Georgian Distribution Management System

## Business Domain & Market Context

### Industry Overview

The **Georgian food distribution market** is characterized by:

- **Fragmented supply chain** - Many small restaurants ordering from multiple distributors
- **Manual processes** - Phone calls, WhatsApp messages, handwritten orders
- **Limited visibility** - No real-time tracking, poor inventory management
- **Payment inefficiencies** - Cash-on-delivery, delayed invoicing
- **Language barrier** - Bilingual support (Georgian + English) required

### Market Opportunity

**Target Market:**
- **Primary:** 500+ restaurants in Tbilisi and surrounding areas
- **Secondary:** Regional restaurants across Georgia
- **Growth:** Expanding to other cities (Batumi, Kutaisi)

**Pain Points We Solve:**
1. **For Restaurants:** Streamlined ordering, real-time tracking, digital invoices
2. **For Distributors:** Order management, analytics, driver coordination
3. **For Drivers:** Route optimization, delivery tracking, proof of delivery

### Competitive Landscape

**Existing Solutions:**
- Traditional phone/WhatsApp ordering (90% of market)
- Basic Excel-based systems
- No comprehensive SaaS solution in Georgian market

**Our Differentiation:**
- Real-time order tracking
- Multi-language support (Georgian priority)
- Mobile-first PWA design
- Offline capability
- Self-hosted data (privacy compliance)

---

## User Roles & Workflows

### 1. Administrator Role

**Responsibilities:**
- System configuration and user management
- Order oversight and pricing control
- Analytics and reporting
- Product catalog management
- Driver assignment and coordination

**Key Workflows:**

**A. Order Management:**
```
1. View all orders (real-time dashboard)
2. Filter by status, date, restaurant, driver
3. Manually adjust pricing if needed
4. Assign drivers to orders
5. Monitor delivery progress
6. Generate reports and analytics
```

**B. User Management:**
```
1. Create new restaurant accounts
2. Onboard new drivers
3. Manage user permissions
4. Deactivate/reactivate accounts
5. View user activity logs
```

**C. Product Management:**
```
1. Add new products to catalog
2. Update pricing (bilingual)
3. Manage categories
4. Set availability status
5. Upload product images
```

**D. Analytics & Reporting:**
```
1. View KPI dashboard (orders, revenue, AOV)
2. Generate date-range reports
3. Export CSV data
4. Analyze trends by restaurant/driver
5. Monitor system performance
```

### 2. Restaurant Role

**Responsibilities:**
- Browse product catalog
- Place orders for delivery
- Track order status in real-time
- View order history
- Manage account settings

**Key Workflows:**

**A. Order Placement:**
```
1. Browse product catalog (bilingual)
2. Filter by category
3. Add products to cart
4. Specify quantities
5. Add order comments/notes
6. Review total cost
7. Submit order
8. Receive confirmation
```

**B. Order Tracking:**
```
1. View pending orders
2. Real-time status updates:
   - Pending (awaiting confirmation)
   - Confirmed (distributor accepted)
   - Picked Up (driver has order)
   - Delivered (complete)
3. Estimated delivery time
4. Driver contact information
5. GPS tracking (when available)
```

**C. Order History:**
```
1. View past orders (last 30/60/90 days)
2. Filter by date range, status
3. Search by order number
4. Export order history (CSV)
5. Quick reorder from history
6. View invoices/receipts
```

**D. Account Management:**
```
1. Update business information
2. Manage delivery address
3. Set notification preferences
4. View account balance
5. Access billing history
```

### 3. Driver Role

**Responsibilities:**
- View assigned deliveries
- Update delivery status
- Navigate to delivery locations
- Collect proof of delivery
- Track delivery history

**Key Workflows:**

**A. Delivery Management:**
```
1. View assigned deliveries (today's route)
2. See delivery details:
   - Restaurant address
   - Order items summary
   - Delivery instructions
   - Contact phone
3. Update status:
   - Accept delivery
   - Mark as Picked Up
   - Mark as Delivered
4. Upload proof of delivery (photo/signature)
```

**B. Navigation & GPS:**
```
1. Get directions to restaurant
2. Real-time GPS tracking (admin visibility)
3. Optimized route suggestions
4. Traffic updates
5. Estimated arrival time
```

**C. Delivery History:**
```
1. View completed deliveries
2. Track daily/weekly totals
3. Performance metrics
4. Earnings summary
5. Rating/feedback
```

### 4. Demo Role

**Purpose:**
- Showcase platform capabilities
- Lead generation
- Feature demonstration without data risk

**Restrictions:**
- Read-only access (no data mutation)
- Limited to last 7 days of data
- Sample data only
- Conversion prompts to full account

**Workflows:**
```
1. Explore dashboard (limited data)
2. View sample orders
3. Browse product catalog
4. See analytics (demo data)
5. Receive conversion prompts
6. Upgrade to full account
```

---

## Order Lifecycle & Status Workflow

### Status Transitions

```
┌─────────────┐
│   PENDING   │ ← Restaurant submits order
└──────┬──────┘
       │ Admin/system reviews
       ▼
┌─────────────┐
│  CONFIRMED  │ ← Order accepted, driver assigned
└──────┬──────┘
       │ Driver collects order
       ▼
┌─────────────┐
│  PICKED_UP  │ ← Driver has order, en route
└──────┬──────┘
       │ Driver reaches destination
       ▼
┌─────────────┐
│  DELIVERED  │ ← Order complete, proof captured
└─────────────┘

       Alternative path:
       ┌─────────────┐
       │  CANCELLED  │ ← Any status can be cancelled
       └─────────────┘
```

### Status Details

**PENDING:**
- Trigger: Restaurant submits order
- Notification: Admin notified
- Actions: Admin can confirm/cancel, adjust pricing
- Timeline: <30 minutes typical

**CONFIRMED:**
- Trigger: Admin confirms order
- Notification: Restaurant + Driver notified
- Actions: Driver assigned, can view details
- Timeline: <1 hour before pickup

**PICKED_UP:**
- Trigger: Driver marks as picked up
- Notification: Restaurant + Admin notified
- Actions: GPS tracking active
- Timeline: <1 hour to delivery

**DELIVERED:**
- Trigger: Driver marks as delivered
- Notification: Restaurant + Admin notified
- Actions: Proof of delivery uploaded
- Timeline: Order complete

**CANCELLED:**
- Trigger: Manual cancellation (any role with permission)
- Notification: All stakeholders notified
- Actions: Reason recorded
- Timeline: N/A

---

## Data Relationships & Business Logic

### Core Entities

**Profile (User):**
- Unique user account
- Single role per user (admin/restaurant/driver/demo)
- Links to all user-specific data

**Product:**
- Bilingual catalog item (Georgian + English)
- Category, unit, price
- Availability flag
- Image reference

**Order:**
- Master order record
- Links to restaurant (buyer)
- Links to driver (assigned)
- Status workflow
- Timestamps for each status change
- Total amount calculation

**Order Item:**
- Line item in order
- Links to product
- Quantity, unit price, total price
- Historical pricing (snapshot at order time)

**Notification:**
- User-specific alerts
- Type-based (order update, system message)
- Read/unread tracking
- Auto-deletion after 30 days

### Business Rules

**Order Creation:**
1. Restaurant must be authenticated
2. Cart must contain at least 1 item
3. Products must be available
4. Total amount calculated automatically
5. Order created with status = PENDING

**Order Confirmation:**
1. Only Admin can confirm
2. Driver must be assigned
3. Pricing can be adjusted
4. Restaurant notified via real-time channel

**Order Pickup:**
1. Only assigned Driver can mark as picked up
2. Cannot skip CONFIRMED status
3. GPS tracking begins
4. Timestamp recorded

**Order Delivery:**
1. Only assigned Driver can mark as delivered
2. Must be in PICKED_UP status
3. Proof of delivery required (optional: photo/signature)
4. Timestamp recorded, order finalized

**Order Cancellation:**
1. Admin can cancel any status
2. Restaurant can cancel PENDING only
3. Driver cannot cancel
4. Reason required
5. Notifications sent

---

## Multi-Tenant Isolation Strategy

### Tenant Definition

**Tenant = Restaurant Business Entity**

Each restaurant is an isolated tenant with:
- Own order data
- Own user profiles (restaurant role)
- Own analytics
- No visibility into other restaurants' data

### Isolation Layers

**Database Layer (Primary):**
- RLS policies enforce `restaurant_id = auth.uid()`
- No cross-tenant data leakage possible
- Admin override with explicit role check

**Application Layer (Secondary):**
- UI components filter by user context
- API routes validate user permissions
- Client-side checks for UX (not security)

**API Layer (Tertiary):**
- JWT validation on all requests
- Role claims checked
- CSRF protection
- Rate limiting per tenant

---

## Business Metrics & KPIs

### Key Performance Indicators

**Order Metrics:**
- Total Orders (daily/weekly/monthly)
- Orders by Status (pending/confirmed/delivered/cancelled)
- Average Order Value (AOV)
- Order Completion Rate (delivered / total)
- Order Cancellation Rate

**Revenue Metrics:**
- Total Revenue (sum of delivered orders)
- Revenue by Restaurant
- Revenue by Product Category
- Revenue Trends (daily/weekly comparisons)

**Operational Metrics:**
- Average Delivery Time (picked_up → delivered)
- Driver Utilization (deliveries per driver)
- Order Confirmation Time (pending → confirmed)
- Peak Order Hours
- Restaurant Reorder Rate

**User Metrics:**
- Active Restaurants (ordered in last 30 days)
- Active Drivers (deliveries in last 30 days)
- New User Signups
- Demo-to-Paid Conversion Rate

### Analytics Dashboard

**Components:**
- Real-time KPI cards
- Interactive line charts (daily trends)
- Bar charts (orders by status, restaurant, driver)
- Date range selector (7/14/30 days, custom)
- Status filter
- CSV export

---

## Georgian Language & Localization

### Bilingual Support

**Languages:**
1. **Georgian (ქართული)** - Primary language
2. **English** - Secondary for international users

**Localized Content:**
- Product names and descriptions
- Category labels
- UI text and labels
- Error messages
- Email notifications
- Invoice templates

**Implementation:**
- Database stores both Georgian and English fields
- UI displays based on user preference
- Default: Georgian
- Language switcher in settings

### Georgian-Specific Considerations

**Currency:**
- Georgian Lari (GEL / ₾)
- Display format: "₾ 150.00"

**Date/Time:**
- Format: DD/MM/YYYY (European format)
- 24-hour time display
- Timezone: Asia/Tbilisi (GMT+4)

**Phone Numbers:**
- Format: +995 XXX XX XX XX
- Validation for Georgian mobile/landline

**Address Format:**
- Street address
- City
- Postal code (optional, not widely used)
- Georgian address conventions

---

## Integration Points

### External Services

**Sentry (Error Tracking):**
- Frontend errors captured
- Backend errors logged
- Performance monitoring
- User context attached
- Release tracking

**MCP Servers (Development):**
- Supabase integration
- GitHub operations
- Perplexity research
- Chrome DevTools debugging

**Future Integrations (Planned):**
- Payment Gateway (TBC Bank, BOG)
- SMS Notifications (Magti, Beeline)
- Email Service (SendGrid, Mailgun)
- Maps API (Google Maps, OpenStreetMap)
- Accounting Software (1C, Zoho Books)

### Internal Services

**Authentication (Supabase GoTrue):**
- Email/password authentication
- MFA support (planned)
- JWT token generation
- Password reset flow
- Email verification

**Real-time (Supabase Realtime):**
- WebSocket connections
- Postgres change subscriptions
- Presence tracking
- Broadcast messages

**Storage (Supabase Storage):**
- Product images
- Proof of delivery photos
- User avatars
- Invoice PDFs

---

## Security & Compliance

### Data Privacy

**GDPR-Like Compliance (Georgian Context):**
- User consent for data collection
- Right to data export
- Right to data deletion
- Data retention policies
- Audit logging

**PII Handling:**
- Names, phone numbers encrypted at rest
- No credit card storage (future: tokenization)
- User data isolated by tenant
- Minimal data collection principle

### Access Control

**Authentication:**
- Strong password requirements (8+ chars, mixed case, numbers)
- Session timeout (24 hours)
- Refresh token rotation
- MFA capability (planned)

**Authorization:**
- Role-based access control (RBAC)
- RLS at database level
- API permission checks
- Client-side route guards

**Audit Trail:**
- All order status changes logged
- User actions tracked
- Admin actions recorded
- Timestamp and user ID captured

---

## Business Continuity & Disaster Recovery

### Backup Strategy

**Database Backups:**
- Daily automated backups
- 30-day retention
- Offsite storage
- Restoration tested monthly

**Application Backups:**
- Git repository (GitHub)
- Docker images (Docker Hub)
- Environment configs (encrypted)

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**Failover Procedures:**
1. Detect outage (monitoring alerts)
2. Assess impact
3. Restore from backup
4. Verify data integrity
5. Resume operations
6. Post-mortem analysis

---

## Growth & Scalability Considerations

### Phase 1: MVP (Current - 50-100 users)
- Single VPS server
- Monolith architecture
- Manual deployment
- Basic monitoring

### Phase 2: Growth (100-500 users)
- Database read replicas
- Caching layer (Redis)
- CDN for static assets
- Automated deployment
- Enhanced monitoring

### Phase 3: Scale (500-2000 users)
- Horizontal scaling (multiple app instances)
- Load balancing
- Distributed tracing
- Microservices (potential)
- Multi-region (if needed)

---

**This document provides the complete business and domain context for the Georgian Distribution Management System, covering user roles, workflows, data relationships, localization, and growth strategy.**
