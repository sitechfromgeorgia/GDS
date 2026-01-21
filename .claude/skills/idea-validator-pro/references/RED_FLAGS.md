# Red Flags Reference

## Overview

This document catalogs warning signs that often predict product failure. Recognizing these early can save months of wasted effort and thousands of dollars.

---

## Critical Red Flags 🚨

### 1. "Nice-to-Have" vs "Must-Have"

**Warning Sign:**
- Users say "that's interesting" but don't ask when it's available
- No urgency in user feedback
- People can't articulate how much time/money it would save
- Users aren't willing to beta test

**Why It's Dangerous:**
People might buy "nice-to-have" products once, but they won't pay recurring fees or recommend them. These products fail slowly as churn exceeds new signups.

**How to Test:**
Ask: "If I could build this for you right now, how much would you pay?"
- Immediate number = must-have
- "I'd have to think about it" = nice-to-have
- "Maybe $5-10?" = not valuable enough

**Real Example:**
Many "better bookmarking" tools fall into this trap. Users think "that's cool" but keep using browser bookmarks because the pain isn't severe enough.

---

### 2. "Vitamin" vs "Painkiller"

**Warning Sign:**
- Product improves something already working
- Benefits are marginal improvements
- Adoption requires behavior change
- No clear ROI calculation possible

**Why It's Dangerous:**
Vitamins are preventative and optional. Painkillers solve acute problems. People delay buying vitamins indefinitely but buy painkillers immediately.

**Classification:**
- **Painkiller:** "Our invoicing is costing us 10 hours/week"
- **Vitamin:** "We could probably optimize our workflow"
- **Painkiller:** "We're losing customers because checkout breaks"
- **Vitamin:** "Our UI could be prettier"

**How to Test:**
Ask: "What happens if you don't solve this problem?"
- Serious consequences = painkiller
- "Nothing really" = vitamin

---

### 3. Solution Looking for a Problem

**Warning Signs:**
- You built technology then sought problems
- You're passionate about the tech, not the problem
- You describe features before benefits
- Users don't understand what it does

**Why It's Dangerous:**
You'll waste time pivoting to find a problem that fits your solution, when you should start with a problem and build the right solution.

**Self-Test:**
Can you describe the problem in one sentence without mentioning your solution?
- Yes = problem-first ✓
- No = solution-first ✗

**Real Example:**
"We use blockchain for X" - if blockchain is in the pitch, you're probably solution-first. Users don't care about your tech stack.

---

### 4. Founder's Problem ≠ Market's Problem

**Warning Sign:**
- "I had this problem once..."
- Can't name 10 others with this problem
- Problem only exists in specific context
- Friends/family say "interesting" not "I need this"

**Why It's Dangerous:**
Your unique situation might not generalize. What's painful for you might be rare or already solved for others.

**How to Validate:**
- Find 20 people with this exact problem
- They must have tried to solve it
- They must be actively looking for solutions
- They must represent a reachable market

**Warning Questions:**
- "As a developer who also does design..." (too niche)
- "As someone who works from coffee shops..." (too specific)
- "When I was learning..." (timebound problem)

---

### 5. Extremely Crowded Market

**Warning Signs:**
- 20+ direct competitors
- Big tech players in the space
- Competitors look nearly identical
- Hard to explain differentiation
- New entrants appearing constantly

**Why It's Dangerous:**
You'll compete on price, which means racing to the bottom. Customer acquisition costs skyrocket. Switching costs are low.

**When Crowdedness Is OK:**
- You have unique distribution channel
- You're targeting underserved niche
- You can be 10x better on one dimension
- You have unfair advantage (expertise, network, etc.)

**When It's Not:**
- "We're just better" (not specific)
- "Better UI" (shallow moat)
- "We'll add AI" (everyone can)
- "Lower price" (race to bottom)

**Test:**
List your top 3 competitors. If you struggle to differentiate yourself in 10 seconds, market is too crowded.

---

### 6. No Clear Monetization Path

**Warning Signs:**
- "We'll figure out monetization later"
- "Ads or premium, we're not sure"
- Can't name willing-to-pay segment
- Revenue model requires huge scale
- No proof people pay for this

**Why It's Dangerous:**
Products that fail to monetize early rarely find monetization later. "Build audience first" works for <1% of products.

**Critical Questions:**
- Have you talked to potential customers about price?
- Is anyone currently paying for this solution?
- What's your customer acquisition cost?
- What's realistic lifetime value?
- Can you afford CAC with LTV?

**Red Flag Statements:**
- "Users will pay for premium features" (which ones?)
- "We'll build it and see" (not a strategy)
- "Free for individuals, paid for teams" (used to work, rarely works now)

---

### 7. Requires Network Effects to Work

**Warning Signs:**
- "It gets better with more users"
- Useless until you have X users
- Chicken-and-egg problem
- Requires both sides of marketplace

**Why It's Dangerous:**
Network effects are incredibly hard to bootstrap. Most network-effect products fail before reaching critical mass.

**When It Works:**
- You can fake network effects initially
- Single-player mode works
- You have access to one side already
- You can focus on small geographic area

**When It Doesn't:**
- Needs national scale from day 1
- No way to provide value without network
- Both sides need to adopt simultaneously
- Long payback period

**Test:**
Can you provide value to user #1? If no, you have a problem.

---

### 8. Requires Behavior Change

**Warning Signs:**
- "If people would just..."
- Success requires users to change habits
- Replaces something that "just works"
- Requires daily/weekly usage to see value
- Onboarding takes >5 minutes

**Why It's Dangerous:**
People hate changing behavior. Even when your solution is better, inertia wins. Old habits are powerful.

**Behavior Change Difficulty:**
- Easy: "Do the same thing, but here" (Notion vs. Evernote)
- Medium: "Do this new thing weekly" (new analytics tool)
- Hard: "Change your entire workflow" (most B2B)
- Impossible: "Stop using Facebook" (social network alternatives)

**When It Can Work:**
- 10x better, not 2x
- New users (no old habits)
- Pain is severe enough
- Can show immediate value

---

### 9. Long Sales Cycle with Low ACV

**Warning Signs:**
- B2B product with $20/month pricing
- Requires talking to multiple people
- 3+ month sales cycle
- Complex integration required

**Why It's Dangerous:**
The math doesn't work. If it takes 3 months and 20 hours of your time to close a $20/month deal, you're losing money.

**Deal Economics:**
```
Annual Contract Value (ACV): $240
Time to Close: 20 hours × $100/hour = $2,000
Customer Acquisition Cost: $2,000
Payback Period: 8.3 years
Result: Unsustainable
```

**Better Combinations:**
- High-touch sales + High ACV ($10k+)
- Self-serve + Low ACV ($20-200)
- Product-led + Medium ACV ($200-1k)

---

### 10. Commoditized Service You're Trying to SaaS

**Warning Signs:**
- "We automate X service"
- Service providers resist your tool
- Tool needs human judgment
- Every customer wants customization
- Output requires expert review

**Why It's Dangerous:**
Some services can't be fully automated without losing quality. Partial automation often doesn't save enough time to justify purchase.

**When It Works:**
- Completely eliminates human
- 80% solution good enough
- Human review is optional
- Standardized workflow

**When It Doesn't:**
- Human judgment critical
- High variance between use cases
- Liability concerns if wrong
- Customers won't trust automation

---

## Market-Specific Red Flags

### B2B Red Flags

**Warning Signs:**
- ❌ Target customer is "small business" (too broad)
- ❌ Buyer isn't budget owner
- ❌ ROI isn't measurable
- ❌ Long procurement processes
- ❌ Requires IT approval/integration
- ❌ Regulatory compliance required

**Why Dangerous:**
B2B is complex. Wrong target = months of sales cycles that don't convert.

---

### B2C Red Flags

**Warning Signs:**
- ❌ Depends on viral growth
- ❌ Low retention (users churn fast)
- ❌ High CAC (>$50 for <$10 product)
- ❌ Seasonal demand only
- ❌ Requires constant content

**Why Dangerous:**
B2C economics are brutal. Unit economics must work at small scale.

---

### SaaS Red Flags

**Warning Signs:**
- ❌ Feature parity with free alternatives
- ❌ Depends on integration partnerships
- ❌ Data portability issues
- ❌ Can't explain monthly value
- ❌ One-time problem (no recurring need)

**Why Dangerous:**
Subscription fatigue is real. Users won't pay monthly for something they use once.

---

## Timing Red Flags

### Too Early

**Warning Signs:**
- Technology doesn't exist yet
- Market not ready (education needed)
- Regulations not clear
- Infrastructure not available
- User behavior hasn't shifted

**Example:**
VR social networks 2015 (too early) vs 2025 (maybe now)

### Too Late

**Warning Signs:**
- Market consolidating
- Declining search trends
- Technology being replaced
- Major players divesting
- Users moving to alternatives

**Example:**
RSS readers after Google Reader shutdown (declining interest)

---

## Team Red Flags

### Solo Founder Warning Signs

**When It's a Problem:**
- ❌ Need deep expertise in multiple domains
- ❌ Need constant availability (support/sales)
- ❌ Complex technical + complex business model
- ❌ High-touch sales required
- ❌ Need fast execution across many fronts

**When It's OK:**
- ✅ Technical founder building dev tools
- ✅ Can automate/outsource non-core
- ✅ Asynchronous business model
- ✅ Clear expertise match
- ✅ Can focus deeply on one thing

---

## Financial Red Flags

### Unsustainable Unit Economics

**Warning Signs:**
```
CAC (Customer Acquisition Cost): $500
LTV (Lifetime Value): $400
Gross Margin: 40%

Result: Lose $100 per customer
```

**Critical Ratios:**
- LTV:CAC ratio should be >3:1
- CAC payback should be <12 months
- Gross margin should be >70% for SaaS
- Churn should be <5% monthly for SMB, <2% for Enterprise

### Pricing Red Flags

**Warning Signs:**
- Can't explain price to customer
- Price is "what competitors charge"
- No willingness-to-pay research
- Hoping for "volume"
- Pricing below your costs

---

## How to Use This Document

### During Idea Validation:
1. Read through each red flag
2. Honestly assess if your idea has it
3. For each red flag present, document:
   - Is it addressable?
   - What's your mitigation strategy?
   - Is it a deal-breaker?

### Red Flag Scoring:
- **0-2 red flags:** Probably OK, address them
- **3-4 red flags:** Serious concerns, may need pivot
- **5+ red flags:** Reconsider this idea entirely

### Important Notes:

**Not All Red Flags Are Equal:**
- Critical: Solution looking for problem, no monetization, no demand
- Serious: Crowded market, behavior change, poor economics
- Moderate: Team gaps, timing questions

**Having One Doesn't Kill You:**
If you have ONE red flag but can clearly articulate how you'll address it with evidence, proceed carefully.

**Having Multiple Does:**
Multiple red flags compound. Three separate "maybe OK" issues create an impossible situation.

---

## Case Studies

### Failed Despite Hype: Quibi

**Red Flags Present:**
- Solution looking for problem ✗
- Required behavior change ✗
- Crowded market ✗
- Bad timing (pandemic) ✗
- Poor product-market fit ✗

**Result:** $1.75B raised, shut down in 6 months

---

### Success Despite Red Flags: Notion

**Red Flags Present:**
- Extremely crowded market (productivity) ✓
- Required behavior change ✓

**But They Had:**
- 10x better product ✓
- Network effects ✓
- Strong viral growth ✓
- Product-led growth ✓

**Result:** Multi-billion dollar valuation

---

## Questions to Ask Yourself

1. **Am I being honest about these red flags?**
   - Founder delusion is real
   - Get external feedback
   - Look for disconfirming evidence

2. **Can I articulate how I'll overcome each red flag?**
   - Vague plans don't count
   - Need specific strategies
   - Evidence-based assumptions

3. **Am I ignoring red flags because I love the idea?**
   - Emotional attachment clouds judgment
   - Ideas are cheap, execution is hard
   - Better to find better idea than force bad one

4. **Would I invest my own money in this based on red flags?**
   - Pretend it's someone else's idea
   - Would you invest?
   - If no, why are you building it?

---

## Final Thought

**Red flags are gifts.** 

They're early warning signals that save you from wasting months or years on an idea that won't work. Finding red flags is success, not failure - because you found them before spending resources.

The best founders are the ones who:
1. Actively look for red flags
2. Honestly assess them
3. Either address them or pivot
4. Don't let attachment override judgment

**Your goal isn't to eliminate all red flags (impossible).** 

Your goal is to understand which red flags are present, decide if they're addressable, and make an informed decision about whether to proceed.

Remember: **It's better to kill a bad idea early than to slowly watch it die over 12 months.**