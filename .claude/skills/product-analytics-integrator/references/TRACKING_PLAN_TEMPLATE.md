# Tracking Plan Template

## Overview

**Product Name**: [Your Product]
**Last Updated**: [Date]
**Owner**: [Team/Person]
**Analytics Platform**: [PostHog/Mixpanel/GA4/Amplitude]

---

## Goals & Metrics

### Primary Business Goals
1. [Goal 1]: [Metric to measure]
2. [Goal 2]: [Metric to measure]
3. [Goal 3]: [Metric to measure]

### Key Performance Indicators (KPIs)
- **North Star Metric**: [Your primary metric]
- **Supporting Metrics**:
  - [Metric 1]: [Target value]
  - [Metric 2]: [Target value]
  - [Metric 3]: [Target value]

---

## Naming Conventions

### Event Naming
- **Format**: `Object Action` or `Category: Object Action`
- **Casing**: Title Case
- **Tense**: Past tense (e.g., "Button Clicked", not "Button Click")

### Property Naming
- **Format**: `snake_case`
- **Examples**: `product_id`, `user_email`, `session_duration_seconds`

### Categories/Prefixes
- `app:` - Main application events
- `site:` - Marketing website events
- `checkout:` - Checkout flow events
- `onboarding:` - User onboarding events
- `settings:` - Account settings events

---

## User Properties

Properties that identify and describe users across all events.

| Property Name | Type | Description | Example |
|--------------|------|-------------|---------|
| user_id | string | Unique user identifier | "user_12345" |
| email | string | User email address | "user@example.com" |
| signup_date | datetime | When user signed up | "2025-01-15T10:30:00Z" |
| plan_type | string | Subscription plan | "premium", "free", "enterprise" |
| account_status | string | Account status | "active", "trial", "churned" |
| company_name | string | Company name (B2B) | "Acme Corp" |
| company_size | string | Company employee count | "1-10", "11-50", "51-200" |
| industry | string | Company industry | "SaaS", "E-commerce", "Healthcare" |
| referral_source | string | How user found product | "organic", "paid", "referral" |
| utm_source | string | Marketing source | "google", "facebook", "email" |
| utm_campaign | string | Marketing campaign | "spring_promo_2025" |
| location_country | string | User country | "US", "UK", "DE" |
| location_city | string | User city | "San Francisco", "London" |
| timezone | string | User timezone | "America/Los_Angeles" |
| language | string | Preferred language | "en", "es", "fr" |
| created_at | datetime | User creation timestamp | "2025-01-15T10:30:00Z" |
| last_seen_at | datetime | Last activity timestamp | "2025-01-20T14:22:00Z" |

---

## Event Categories

### 1. Authentication Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| User Signed Up | User creates new account | signup_method, referral_source, utm_campaign | Per signup |
| User Logged In | User logs into account | login_method, is_new_device, session_id | Per login |
| User Logged Out | User logs out | session_duration_seconds, pages_viewed | Per logout |
| Password Reset Requested | User requests password reset | email | Per request |
| Password Reset Completed | User completes password reset | - | Per completion |
| Email Verified | User verifies email address | - | Per verification |

**Properties**:
- `signup_method`: "email", "google", "github", "apple"
- `login_method`: "email", "google", "github", "apple"
- `referral_source`: "organic", "paid", "referral", "direct"
- `is_new_device`: boolean
- `session_id`: string (unique session identifier)
- `session_duration_seconds`: integer
- `pages_viewed`: integer

---

### 2. Onboarding Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Onboarding Started | User enters onboarding flow | - | Per onboarding start |
| Onboarding Step Completed | User completes onboarding step | step_number, step_name | Per step |
| Onboarding Skipped | User skips onboarding | reason | Per skip |
| Onboarding Completed | User completes all onboarding | time_to_complete_seconds, steps_completed | Per completion |
| Profile Updated | User updates profile info | fields_updated | Per update |
| First Action Completed | User completes first key action | action_type, time_to_first_action_seconds | Once per user |

**Properties**:
- `step_number`: integer (1, 2, 3, etc.)
- `step_name`: string ("profile_setup", "connect_integrations", "invite_team")
- `reason`: string ("later", "not_relevant", "too_complex")
- `time_to_complete_seconds`: integer
- `steps_completed`: integer
- `fields_updated`: array of strings (["email", "company_name"])
- `action_type`: string (product-specific)
- `time_to_first_action_seconds`: integer

---

### 3. Product Engagement Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Page Viewed | User views a page | page_path, page_title, referrer | Per page view |
| Feature Used | User uses a specific feature | feature_name, usage_count | Per feature use |
| Search Performed | User searches | search_query, results_count | Per search |
| Filter Applied | User applies filter | filter_type, filter_value | Per filter |
| Content Created | User creates content | content_type, content_id | Per creation |
| Content Updated | User updates content | content_type, content_id, fields_updated | Per update |
| Content Deleted | User deletes content | content_type, content_id | Per deletion |
| Content Shared | User shares content | content_type, content_id, share_method | Per share |
| Export Completed | User exports data | export_type, record_count | Per export |
| Import Completed | User imports data | import_type, record_count, success | Per import |

**Properties**:
- `page_path`: string ("/dashboard", "/settings")
- `page_title`: string ("Dashboard", "Settings")
- `referrer`: string (previous page URL)
- `feature_name`: string (product-specific)
- `usage_count`: integer
- `search_query`: string
- `results_count`: integer
- `filter_type`: string ("date_range", "category", "status")
- `filter_value`: string or array
- `content_type`: string ("document", "project", "report")
- `content_id`: string
- `fields_updated`: array of strings
- `share_method`: string ("email", "link", "slack")
- `export_type`: string ("csv", "pdf", "json")
- `import_type`: string ("csv", "api", "integration")
- `record_count`: integer
- `success`: boolean

---

### 4. Conversion Funnel Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Product Viewed | User views product detail | product_id, product_name, product_category, price_usd | Per view |
| Product Added | User adds product to cart | product_id, product_name, price_usd, quantity, cart_value_usd | Per addition |
| Product Removed | User removes from cart | product_id, product_name, reason | Per removal |
| Cart Viewed | User views shopping cart | item_count, cart_value_usd | Per cart view |
| Checkout Started | User begins checkout | item_count, cart_value_usd, shipping_method | Per checkout start |
| Payment Info Entered | User enters payment details | payment_method | Per entry |
| Order Completed | User completes purchase | order_id, revenue_usd, items, payment_method | Per purchase |
| Order Failed | Purchase attempt failed | failure_reason, payment_method | Per failure |

**Properties**:
- `product_id`: string
- `product_name`: string
- `product_category`: string
- `price_usd`: float
- `quantity`: integer
- `cart_value_usd`: float
- `item_count`: integer
- `reason`: string ("too_expensive", "changed_mind", "found_alternative")
- `shipping_method`: string ("standard", "express", "overnight")
- `payment_method`: string ("stripe", "paypal", "apple_pay")
- `order_id`: string
- `revenue_usd`: float
- `items`: array of objects
- `failure_reason`: string ("card_declined", "insufficient_funds", "network_error")

---

### 5. Subscription Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Trial Started | User starts free trial | plan_name, trial_days | Per trial start |
| Subscription Started | User subscribes | plan_name, billing_cycle, price_usd | Per subscription |
| Subscription Upgraded | User upgrades plan | old_plan, new_plan, price_difference_usd | Per upgrade |
| Subscription Downgraded | User downgrades plan | old_plan, new_plan, reason | Per downgrade |
| Subscription Renewed | Subscription auto-renewed | plan_name, renewal_number | Per renewal |
| Subscription Canceled | User cancels subscription | reason, time_to_cancel_days | Per cancellation |
| Subscription Reactivated | User reactivates subscription | plan_name, days_inactive | Per reactivation |
| Payment Succeeded | Payment processed successfully | amount_usd, payment_method | Per payment |
| Payment Failed | Payment attempt failed | failure_reason, amount_usd | Per failure |

**Properties**:
- `plan_name`: string ("free", "basic", "premium", "enterprise")
- `trial_days`: integer
- `billing_cycle`: string ("monthly", "annual")
- `price_usd`: float
- `old_plan`: string
- `new_plan`: string
- `price_difference_usd`: float (positive for upgrade, negative for downgrade)
- `reason`: string (cancellation/downgrade reason)
- `renewal_number`: integer (1, 2, 3, etc.)
- `time_to_cancel_days`: integer
- `days_inactive`: integer
- `amount_usd`: float
- `payment_method`: string
- `failure_reason`: string

---

### 6. Feature Discovery Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Feature Discovered | User first discovers feature | feature_name, discovery_method, days_since_signup | Per discovery |
| Feature Tooltip Viewed | User views feature tooltip | feature_name, tooltip_id | Per view |
| Feature Tutorial Started | User starts feature tutorial | feature_name | Per start |
| Feature Tutorial Completed | User completes tutorial | feature_name, time_to_complete_seconds | Per completion |
| Feature Feedback Provided | User provides feedback | feature_name, rating, feedback_text | Per feedback |

**Properties**:
- `feature_name`: string
- `discovery_method`: string ("tooltip", "menu", "onboarding", "search", "notification")
- `days_since_signup`: integer
- `tooltip_id`: string
- `time_to_complete_seconds`: integer
- `rating`: integer (1-5)
- `feedback_text`: string (optional)

---

### 7. Team & Collaboration Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Team Member Invited | User invites team member | invitee_email, role | Per invitation |
| Invitation Accepted | Invited user accepts | inviter_user_id, role | Per acceptance |
| Team Member Removed | User removes team member | removed_user_id, role | Per removal |
| Permission Changed | User changes permissions | affected_user_id, old_role, new_role | Per change |
| Workspace Created | User creates workspace | workspace_name | Per creation |
| Comment Added | User adds comment | content_type, content_id | Per comment |
| Mention Created | User mentions teammate | mentioned_user_id, context | Per mention |

**Properties**:
- `invitee_email`: string
- `role`: string ("admin", "editor", "viewer")
- `inviter_user_id`: string
- `removed_user_id`: string
- `affected_user_id`: string
- `old_role`: string
- `new_role`: string
- `workspace_name`: string
- `content_type`: string
- `content_id`: string
- `mentioned_user_id`: string
- `context`: string

---

### 8. Support & Help Events

| Event Name | Description | Properties | Frequency |
|------------|-------------|------------|-----------|
| Help Center Viewed | User opens help center | - | Per view |
| Help Article Viewed | User views help article | article_id, article_title, search_query | Per view |
| Support Ticket Created | User creates support ticket | ticket_category, priority | Per creation |
| Chat Started | User starts live chat | - | Per chat start |
| Feedback Submitted | User submits feedback | feedback_type, rating, feedback_text | Per submission |

**Properties**:
- `article_id`: string
- `article_title`: string
- `search_query`: string (how user found article)
- `ticket_category`: string ("bug", "feature_request", "billing", "technical")
- `priority`: string ("low", "medium", "high", "urgent")
- `feedback_type`: string ("bug_report", "feature_request", "general")
- `rating`: integer (1-5)
- `feedback_text`: string

---

## Implementation Checklist

### Phase 1: Critical Events (Week 1)
- [ ] User Signed Up
- [ ] User Logged In
- [ ] Onboarding Completed
- [ ] First Action Completed
- [ ] Subscription Started
- [ ] Order Completed

### Phase 2: Engagement Events (Week 2)
- [ ] Page Viewed
- [ ] Feature Used
- [ ] Content Created
- [ ] Search Performed
- [ ] Export Completed

### Phase 3: Secondary Events (Week 3)
- [ ] Feature Discovered
- [ ] Team Member Invited
- [ ] Support Ticket Created
- [ ] Feedback Submitted

### Phase 4: Optimization Events (Week 4)
- [ ] Cart Viewed
- [ ] Checkout Started
- [ ] Payment Failed
- [ ] Subscription Canceled
- [ ] Feature Tutorial Completed

---

## Data Validation Plan

### Pre-Launch Validation
1. [ ] Test each event fires correctly in development
2. [ ] Verify all required properties are captured
3. [ ] Confirm property data types match specification
4. [ ] Test user identification works across sessions
5. [ ] Validate events fire once (no duplicates)
6. [ ] Confirm PII masking is working
7. [ ] Test cross-platform tracking (if applicable)

### Post-Launch Monitoring (First Week)
1. [ ] Monitor event volume matches expectations
2. [ ] Check for unexpected null/undefined values
3. [ ] Verify user counts align with known metrics
4. [ ] Review session replay samples
5. [ ] Test key funnels work correctly
6. [ ] Confirm automated reports are accurate

---

## Maintenance Schedule

### Weekly
- Review new events added
- Check for data quality issues
- Monitor property value distributions

### Monthly
- Update tracking plan documentation
- Deprecate unused events
- Review and optimize dashboards
- Analyze feature adoption trends

### Quarterly
- Audit full event taxonomy
- Review naming convention compliance
- Optimize event volume and costs
- Update KPI targets based on data

---

## Notes & Decisions

**[Date]**: [Decision or note about tracking plan]
**[Date]**: [Decision or note about tracking plan]
**[Date]**: [Decision or note about tracking plan]

---

## Resources

- **Analytics Platform Docs**: [Link]
- **Internal Wiki**: [Link]
- **Team Slack Channel**: [Link]
- **Dashboard Links**: [Link]
- **Data Dictionary**: [Link]
