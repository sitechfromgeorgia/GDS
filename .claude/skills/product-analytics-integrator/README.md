# Product Analytics Integrator - Claude Skill

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** November 2025

---

## Overview

The **Product Analytics Integrator** skill transforms Claude into an expert product analytics specialist capable of:

- 🎯 Designing semantic event tracking systems
- 📊 Implementing analytics SDKs (PostHog, Mixpanel, GA4, Amplitude)
- 📋 Creating standardized event taxonomies
- 🔍 Validating data quality and instrumentation
- 📈 Building dashboards and interpreting metrics
- 👥 Analyzing user behavior, retention, and funnels
- 🔒 Ensuring privacy compliance (GDPR/CCPA)

---

## Quick Start

### Installation

1. **Download/Create ZIP**
   ```
   Right-click 'product-analytics-integrator' folder → Send to → Compressed (zipped) folder
   ```

2. **Upload to Claude**
   - Open Claude Desktop
   - Go to Settings → Capabilities
   - Click "Upload skill"
   - Select the ZIP file

3. **Enable the Skill**
   - Find "product-analytics-integrator" in your skills list
   - Toggle it ON

4. **Restart Claude Desktop** (if needed)

### First Use

Try these prompts to activate the skill:

```
"Help me design an event tracking system for my SaaS product"

"What's the difference between PostHog and Mixpanel?"

"Create a tracking plan for an e-commerce checkout flow"

"How do I implement Amplitude in my React app?"
```

---

## What This Skill Does

### 1. Event Tracking Design

**Semantic Event Naming:**
- Object-Action framework implementation
- Consistent naming conventions (Title Case events, snake_case properties)
- Category prefixes for context (app:, checkout:, onboarding:)
- Past tense verb recommendations

**Example:**
```javascript
// Good naming (skill-guided)
track('Product Added', {
  product_id: 'prod_123',
  product_name: 'Premium Plan',
  price_usd: 29.99,
  cart_value_usd: 29.99
})

// Bad naming (skill will correct)
track('add_product', {
  productID: 'prod_123',  // Wrong casing
  ProductName: 'Premium Plan',  // Wrong casing
  Price: 29.99  // Missing unit
})
```

### 2. Analytics SDK Integration

**Supported Platforms:**
- ✅ **PostHog**: Product analytics + session replay + feature flags
- ✅ **Mixpanel**: Advanced behavioral analysis
- ✅ **Google Analytics 4**: Marketing-focused analytics
- ✅ **Amplitude**: Enterprise-grade product analytics

**Integration Guidance:**
- Setup instructions for each platform
- Code examples (JavaScript, Python, etc.)
- Best practices for each tool
- Performance optimization tips
- Privacy configuration

### 3. Tracking Strategy

**Autocapture vs Custom Events:**
- When to use autocapture (fast setup, exploration)
- When to use custom events (precision, clarity)
- Hybrid approaches for optimal results
- Event prioritization frameworks

### 4. Dashboard Design

**Dashboard Templates:**
- Product Health Dashboard (DAU/WAU/MAU, retention)
- Conversion Funnel Dashboard (drop-off analysis)
- Engagement Dashboard (feature usage)
- Retention Dashboard (cohort analysis)

### 5. Data Validation

**Quality Assurance:**
- Pre-launch validation checklist
- Post-launch monitoring guidelines
- Common data quality issues and fixes
- Testing strategies (manual + automated)

### 6. Behavioral Analysis

**Analysis Workflows:**
- Funnel drop-off analysis
- Feature engagement analysis
- User journey mapping
- Churn prediction patterns

---

## File Structure

```
product-analytics-integrator/
├── SKILL.md                                    # Main skill instructions (600+ lines)
│
├── scripts/
│   ├── validate_events.py                     # Event naming validator (297 lines)
│   └── example_events.json                    # Test event data (61 lines)
│
├── references/
│   ├── PLATFORM_COMPARISON.md                 # Tool comparison guide (297 lines)
│   └── TRACKING_PLAN_TEMPLATE.md              # Complete tracking plan (380 lines)
│
└── README.md                                   # This file
```

**Total:** 1,635+ lines of analytics expertise

---

## Key Features

### 1. Event Naming Standards

The skill enforces industry-standard naming conventions:

**Event Names:**
```
✅ Product Added
✅ User Signed Up
✅ checkout: Payment Completed
✅ app: Dashboard Viewed

❌ product_added (wrong casing)
❌ addProduct (wrong order)
❌ User signs up (wrong tense)
```

**Property Names:**
```
✅ product_id
✅ price_usd
✅ session_duration_seconds
✅ is_premium

❌ productId (camelCase)
❌ Price (Title Case)
❌ duration (missing unit)
```

### 2. Platform Comparison

Comprehensive comparison of analytics platforms:

| Feature | PostHog | Mixpanel | GA4 | Amplitude |
|---------|---------|----------|-----|-----------|
| Free Tier | 1M events/mo | 20M/year | Unlimited | 10M events/mo |
| Session Replay | ✅ | ❌ | ❌ | ❌ |
| Autocapture | ✅ | ❌ | ✅ | ❌ |
| Real-time | ✅ | ✅ | ❌ | ✅ |
| Best For | Product teams | Behavioral | Marketing | Enterprise |

**See:** `references/PLATFORM_COMPARISON.md` for full details

### 3. Complete Tracking Plan Template

Ready-to-use tracking plan including:
- ✅ User properties schema
- ✅ 8 event categories (Auth, Onboarding, Engagement, etc.)
- ✅ 50+ event examples with properties
- ✅ Implementation checklist
- ✅ Validation plan
- ✅ Maintenance schedule

**Location:** `references/TRACKING_PLAN_TEMPLATE.md`

### 4. Event Validation Script

Python script that validates:
- ✅ Event names follow Title Case
- ✅ Properties use snake_case
- ✅ No forbidden characters
- ✅ Proper verb tense
- ✅ Reasonable length and complexity

**Usage:**
```bash
# Validate events from JSON file
python scripts/validate_events.py scripts/example_events.json

# Quick single event check
python scripts/validate_events.py --check-string "Product Added"
```

---

## Usage Examples

### Example 1: Choosing an Analytics Platform

**User:** "I'm building a SaaS product. Should I use PostHog or Mixpanel?"

**Claude (with skill):**
```
Based on your SaaS product needs, here's my recommendation:

Choose PostHog if:
- You want all-in-one solution (analytics + session replay + feature flags)
- You need session replay for debugging user issues
- You want cost-effective scaling ($0.00045/event)
- You prefer self-hosted option for data privacy

Choose Mixpanel if:
- You need advanced behavioral segmentation
- You want intuitive, easy-to-use interface for non-technical users
- You require detailed cohort analysis
- You need real-time revenue tracking

For most early-stage SaaS products, I recommend PostHog because:
1. Lower cost at scale
2. Session replay helps understand user struggles
3. Built-in feature flags for gradual rollouts
4. Comprehensive free tier to start

[Provides detailed implementation guidance]
```

### Example 2: Creating a Tracking Plan

**User:** "Create a tracking plan for my e-commerce checkout flow"

**Claude (with skill):**
```
I'll create a comprehensive tracking plan for your e-commerce checkout flow.

Event Taxonomy:

1. Product Viewed
   Properties: product_id, product_name, product_category, price_usd, referrer

2. Product Added
   Properties: product_id, quantity, cart_value_usd, cart_item_count

3. Cart Viewed
   Properties: item_count, cart_value_usd, has_discount

4. Checkout Started
   Properties: item_count, cart_value_usd, shipping_method

5. Payment Info Entered
   Properties: payment_method

6. Order Completed
   Properties: order_id, revenue_usd, items[], payment_method, discount_code

7. Order Failed
   Properties: failure_reason, payment_method, attempted_amount_usd

[Provides implementation code for each event]
[Includes validation checklist]
[Provides dashboard recommendations]
```

### Example 3: Implementing PostHog

**User:** "Show me how to implement PostHog in my React app"

**Claude (with skill):**
```javascript
// Install PostHog
npm install posthog-js

// Initialize PostHog (in your App.js or index.js)
import posthog from 'posthog-js'

posthog.init('<your_project_api_key>', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2025-05-24',
  capture_pageview: 'history_change', // For React Router
  autocapture: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '.sensitive'
  }
})

// Track custom events
posthog.capture('Product Added', {
  product_id: 'prod_123',
  product_name: 'Premium Plan',
  price_usd: 29.99
})

// Identify users
posthog.identify('user_123', {
  email: 'user@example.com',
  plan: 'premium',
  signup_date: '2025-01-15'
})

[Provides best practices]
[Includes privacy configuration]
[Shows testing guidelines]
```

### Example 4: Fixing Data Quality Issues

**User:** "We're getting duplicate events. How do I fix this?"

**Claude (with skill):**
```
Duplicate events are a common issue. Here's how to diagnose and fix:

Root Causes:
1. Multiple SDK initializations
2. Button double-clicks triggering multiple events
3. React component re-renders firing events

Solutions:

1. Ensure Single SDK Init:
// ❌ Bad: Multiple inits
function MyComponent() {
  posthog.init(...)  // Fires on every render!
}

// ✅ Good: Single init
// In App.js (outside component)
posthog.init(...)

2. Debounce Event Tracking:
import { debounce } from 'lodash'

const trackProductAdded = debounce((product) => {
  analytics.track('Product Added', product)
}, 300)

3. Track Only Once Per Action:
const [hasTracked, setHasTracked] = useState(false)

function handleClick() {
  if (!hasTracked) {
    track('Button Clicked')
    setHasTracked(true)
  }
}

[Provides validation script usage]
[Shows monitoring setup]
```

---

## Advanced Features

### 1. Cohort Analysis Patterns

The skill provides templates for:
- Time-based cohorts (signup date, feature launch)
- Behavioral cohorts (power users, trial users)
- Demographic cohorts (location, plan type)

### 2. Privacy Compliance

Guidance for GDPR/CCPA compliance:
- Consent management
- PII masking
- Data deletion workflows
- Cookie-less tracking options

### 3. Data Validation

Multi-layered validation approach:
- Pre-launch validation checklist
- Post-launch monitoring guidelines
- Automated testing examples
- Common pitfalls and solutions

---

## Troubleshooting

### Skill Not Activating

**Problem:** Claude isn't using the skill when expected

**Solutions:**
1. Use explicit triggers: "Use product analytics skill to..."
2. Mention platform names: "PostHog", "Mixpanel", "GA4"
3. Use analytics keywords: "event tracking", "funnel analysis"
4. Check skill is enabled: Settings → Capabilities
5. Restart Claude Desktop

### Script Errors

**Problem:** validate_events.py script fails

**Solutions:**
1. Ensure Python 3 is installed
2. Check JSON file format matches example
3. Verify file paths are correct
4. Run with: `python3 scripts/validate_events.py events.json`

### Event Naming Confusion

**Problem:** Not sure if event name is correct

**Solutions:**
1. Ask Claude: "Is 'Product Added' a good event name?"
2. Use validation script: `python scripts/validate_events.py --check-string "Your Event Name"`
3. Reference SKILL.md examples
4. Follow Object-Action pattern

---

## Best Practices

### 1. Start Simple

Begin with critical events:
- User authentication (signup, login)
- Core conversion actions
- Key feature usage

Expand gradually based on insights.

### 2. Document Everything

Use the tracking plan template to:
- Document all events and properties
- Share with team
- Version control changes
- Review quarterly

### 3. Validate Early

Run validation script before launch:
```bash
python scripts/validate_events.py tracking_plan.json
```

### 4. Monitor Continuously

Set up alerts for:
- Unexpected event volume drops
- New null/undefined values
- Funnel conversion rate changes

### 5. Test Across Platforms

Test tracking on:
- Different browsers
- Mobile devices
- Various user segments

---

## Integration with Other Tools

### With MCP (Model Context Protocol)

The skill works seamlessly with MCP servers:
- Query analytics data from databases
- Fetch metrics from analytics platforms
- Automate report generation
- Sync data to data warehouses

### With Other Skills

Combines well with:
- **Technical SEO Specialist**: Combine analytics with SEO data
- **Conversion Optimizer**: Use analytics for CRO insights
- **Data Visualization**: Create custom charts from analytics

---

## Resources

### Official Platform Documentation
- [PostHog Docs](https://posthog.com/docs)
- [Mixpanel Docs](https://docs.mixpanel.com)
- [GA4 Help Center](https://support.google.com/analytics)
- [Amplitude Docs](https://amplitude.com/docs)

### Learning Resources
- [Segment Academy](https://segment.com/academy/)
- [Amplitude Academy](https://academy.amplitude.com/)
- [PostHog Blog](https://posthog.com/blog)

### Community
- PostHog Community Slack
- Mixpanel Community Forum
- r/analytics subreddit

---

## Version History

**v1.0** (November 2025)
- Initial release
- Support for PostHog, Mixpanel, GA4, Amplitude
- Event validation script
- Complete tracking plan template
- Platform comparison guide

---

## License

Apache License 2.0

---

## Support

**Issues with this skill:**
- Review this README
- Check SKILL.md for detailed instructions
- Use validation script for event naming questions

**Claude Support:**
- Help Center: https://support.claude.com
- Documentation: https://docs.claude.com

---

## Contributing

Found ways to improve this skill? Suggestions:
1. Document your use case
2. Share improved naming patterns
3. Add platform-specific tips
4. Report any issues

---

**Ready to start?** 🚀

1. Install the skill (see Quick Start above)
2. Try: "Help me choose between PostHog and Mixpanel"
3. Start building data-driven products!
