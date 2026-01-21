# SaaS Pricing Strategies - Complete Reference

## Pricing Model Types

### 1. Tiered Pricing (RECOMMENDED for most SaaS)
**When to use**: Clear feature differentiation, different customer segments

**Structure**:
```
Starter: $29/month
- Core features only
- Single user/workspace
- Email support
- Perfect for: Solopreneurs

Pro: $79/month  
- All Starter features
- Multiple users (up to 5)
- Priority support
- Advanced features
- Perfect for: Small teams

Enterprise: Custom
- Everything in Pro
- Unlimited users
- Custom integrations
- Dedicated support
- Perfect for: Large organizations
```

**Pros**:
- Easy to understand
- Matches customer growth
- Natural upgrade path
- Predictable revenue

**Cons**:
- Requires clear feature differentiation
- Can be complex to manage

**Examples**:
- Notion: Free, Plus, Business, Enterprise
- Slack: Free, Pro, Business+, Enterprise Grid
- Stripe: Integrated Pricing, Volume Pricing

---

### 2. Per-Seat Pricing
**When to use**: Team collaboration tools, multi-user products

**Structure**:
```
$15/user/month
- Each additional user = $15/month
- Team admin dashboard
- Shared resources
```

**Pros**:
- Revenue scales with customer growth
- Simple pricing logic
- Aligns incentives (more users = more value)

**Cons**:
- Can limit adoption (team hesitant to add users)
- May incentivize workarounds (account sharing)

**Examples**:
- Figma: $12/editor/month
- GitHub: $4/user/month
- Asana: $10.99/user/month

---

### 3. Usage-Based Pricing
**When to use**: APIs, storage, processing tools where usage varies greatly

**Structure**:
```
Base: $10/month
+ $0.01 per API call
+ $0.10 per GB storage
```

**Pros**:
- Fair pricing (pay for what you use)
- Lower entry barrier
- Scales automatically

**Cons**:
- Unpredictable revenue
- Can surprise users with large bills
- Requires usage tracking

**Examples**:
- AWS: Pay per resource
- Twilio: Per SMS/call
- OpenAI: Per token

---

### 4. Freemium
**When to use**: Viral products, marketplace-style apps, need rapid user growth

**Structure**:
```
Free: Forever
- Limited features
- Usage caps
- Community support

Paid: $29/month
- Full features
- Higher limits
- Priority support
```

**Pros**:
- Low barrier to entry
- Viral growth potential
- Large user base

**Cons**:
- Low conversion rates (typically 2-5%)
- High support costs for free users
- Must have clear paid upgrade path

**Examples**:
- Dropbox: 2GB free, paid plans for more
- Zoom: Free 40-min meetings, paid for longer
- Canva: Free design tools, paid for premium features

---

## Pricing Strategy Selection

**Decision Tree**:
```
IF product requires teams → Per-Seat Pricing
ELSE IF usage varies greatly → Usage-Based Pricing  
ELSE IF clear feature differentiation → Tiered Pricing
ELSE IF need viral growth → Freemium
```

---

## Trial Strategies

### Option A: No Credit Card Required (RECOMMENDED for MVP)

**Setup**:
- 14-day free trial
- Full access to Pro features
- Email reminders at day 3, 7, 12
- Soft paywall on day 14

**Pros**:
✅ Higher signup rate (60-80% more signups)
✅ Builds trust and removes friction
✅ Users can fully explore product
✅ Better for cold traffic

**Cons**:
❌ Lower trial-to-paid conversion (5-10%)
❌ More unqualified signups
❌ Requires strong activation strategy

**Best for**:
- New products without brand recognition
- Complex products needing exploration time
- High-value B2B products
- Products with strong activation hooks

---

### Option B: Credit Card Required

**Setup**:
- 7-day free trial
- Card charged on day 8
- Email reminder at day 5
- Easy cancellation before charge

**Pros**:
✅ Higher conversion rate (15-25%)
✅ Qualified leads only
✅ Immediate revenue potential
✅ Less support burden

**Cons**:
❌ Lower signup rate (40-60% fewer signups)
❌ Higher friction in signup flow
❌ Requires strong value proposition
❌ Risk of payment failures

**Best for**:
- Established brands
- Simple products with quick time-to-value
- Products with strong demand
- B2C products with clear benefits

---

## Trial Optimization Tactics

### Email Sequence

**Day 1: Welcome Email**
```
Subject: Welcome to [Product]! Let's get you started 🚀

Hi [Name],

Thanks for starting your 14-day trial! Here's how to get the most value:

1. [Quick action 1] (takes 2 minutes)
2. [Quick action 2] (takes 5 minutes)
3. [Quick action 3] (takes 10 minutes)

Need help? Reply to this email or check out our [quick start guide].

[Your Name]
```

**Day 3: Check-in Email**
```
Subject: Quick question about your [Product] trial

Hi [Name],

Just checking in! Have you had a chance to [key action]?

If you're stuck or have questions, I'm here to help. What would make [Product] more valuable for you?

[Your Name]
```

**Day 7: Value Highlight**
```
Subject: You've achieved [X] with [Product]! 🎉

Hi [Name],

Great progress! You've:
- [Achievement 1]
- [Achievement 2]
- [Achievement 3]

You're now in the top 20% of users. Here's what to try next...

[Your Name]
```

**Day 12: Upgrade Prompt**
```
Subject: Only 2 days left on your trial

Hi [Name],

Your trial ends in 2 days. Don't lose access to:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

[Upgrade now] and save 20% with code TRIAL20

[Your Name]
```

**Day 14: Final Reminder**
```
Subject: Your trial expires today - here's a special offer

Hi [Name],

Your trial ends today. As a thank you for trying [Product], here's an exclusive offer:

🎁 20% off your first 3 months with code LASTCHANCE

This offer expires in 24 hours.

[Upgrade now] or [Schedule a call] if you have questions.

[Your Name]
```

---

## In-App Conversion Tactics

### 1. Trial Countdown Banner
Display prominently in header:
```
🎁 14 days left in trial | Upgrade to Pro →
```

### 2. Feature Upsells
When user tries Pro feature:
```
This is a Pro feature! 

Upgrade now to unlock:
✓ [Feature 1]
✓ [Feature 2]
✓ [Feature 3]

[Upgrade to Pro] [Learn more]
```

### 3. Value Moments
After user achieves something:
```
Congratulations! 🎉

You've [achievement]. Users who upgrade typically achieve [bigger goal] 3x faster.

[Upgrade to Pro] to accelerate your progress.
```

### 4. Usage Limits
When approaching free tier limits:
```
You've used 8/10 projects this month.

Upgrade to Pro for unlimited projects + [other benefits].

[Upgrade now] or [Learn more]
```

---

## Pricing Psychology

### Best Practices

**Price Endings**:
✅ Use 9: $29, $79, $199 (feels cheaper)
❌ Avoid 5: $25, $75, $195 (no psychological benefit)

**Annual Plans**:
✅ Offer 20% discount: "Save $192/year!"
✅ Highlight savings clearly
✅ Monthly billing still available

**Most Popular Tag**:
✅ Highlight middle tier
✅ Use visual distinction (border, badge)
✅ "Most Popular" or "Best Value"

**Feature Comparison**:
✅ Keep comparisons simple
✅ Use checkmarks, not text
✅ Highlight key differentiators

**Social Proof**:
✅ "Used by 10,000+ teams"
✅ Customer testimonials on pricing page
✅ Logos of notable customers

---

## Conversion Metrics

### Key Metrics to Track

**Trial Signup Rate**:
- Target: 5-10% of landing page visitors
- Formula: (Trial Signups / Landing Page Visitors) × 100

**Activation Rate**:
- Target: 60%+ complete key action within 24h
- Formula: (Users completing key action / Trial signups) × 100

**Trial-to-Paid Conversion**:
- Target: 10-15% (industry standard)
- Formula: (Paid subscribers / Trial signups) × 100

**Time to First Value**:
- Target: <5 minutes from signup
- Measure: Time to complete first key action

**Time to Upgrade**:
- Typical: 7-14 days into trial
- Track: Average days from signup to first payment

---

## Pricing Page Optimization

### Essential Elements

**Hero Section**:
```
Clear headline: "Simple, transparent pricing"
Subheadline: "No hidden fees. Cancel anytime."
Toggle: [Monthly] [Annual - Save 20%]
```

**Pricing Tiers** (3 columns maximum):
```
[Starter]       [Pro - MOST POPULAR]       [Enterprise]
$29/month       $79/month                  Custom

Feature list    Feature list                Feature list
(5-7 items)     (5-7 items)                (5-7 items)

[Start Trial]   [Start Trial]              [Contact Sales]
```

**FAQ Section**:
- "Can I change plans later?" (Yes, anytime)
- "What payment methods?" (All major cards, PayPal)
- "Is there a refund policy?" (30-day money back)
- "What happens after trial?" (Auto-charge or manual upgrade)

**Social Proof**:
- Customer logos
- Testimonials
- "Trusted by 10,000+ teams"

---

## Common Pricing Mistakes

### ❌ Mistake 1: Too Many Tiers
**Problem**: 5+ pricing tiers confuse customers
**Solution**: Start with 2-3 clear tiers

### ❌ Mistake 2: Unclear Differentiation
**Problem**: Similar features across tiers
**Solution**: Clear value progression (Basic → Pro → Enterprise)

### ❌ Mistake 3: Complex Pricing
**Problem**: Multiple variables (seats × features × usage)
**Solution**: One primary pricing model, keep it simple

### ❌ Mistake 4: Underpricing
**Problem**: $9/month when competitors charge $49/month
**Solution**: Match market rates, compete on value not price

### ❌ Mistake 5: No Annual Plans
**Problem**: Missing 20-30% revenue opportunity
**Solution**: Always offer annual with 15-20% discount

---

## A/B Testing Ideas

**Test 1: Trial Length**
- A: 7-day trial (credit card required)
- B: 14-day trial (no credit card)
- Measure: Trial-to-paid conversion × trial signups

**Test 2: Pricing Display**
- A: Monthly price prominent
- B: Annual price prominent (with monthly equivalent)
- Measure: Annual vs monthly subscription ratio

**Test 3: Most Popular Tag**
- A: No tag
- B: "Most Popular" badge on middle tier
- Measure: Distribution across tiers

**Test 4: Feature Names**
- A: Technical names (e.g., "API Access")
- B: Benefit names (e.g., "Automate Your Workflow")
- Measure: Upgrade rate

---

## Pricing Evolution Strategy

### MVP Launch (Month 1-3)
- Start with 2 pricing tiers only
- Simple feature differentiation
- Focus on getting first 10 paying customers
- Goal: Validate willingness to pay

### Growth Phase (Month 4-12)
- Add third tier if needed
- Introduce annual plans
- Optimize trial-to-paid conversion
- Goal: Reach $10k MRR

### Scale Phase (Year 2+)
- Add enterprise tier with custom pricing
- Introduce usage-based add-ons
- Optimize price points based on data
- Goal: Maximize revenue per customer

---

**Remember**: Pricing is never "done" - it evolves with your product and market understanding.