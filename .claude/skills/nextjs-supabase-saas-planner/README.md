# Next.js + Supabase SaaS Planner - Installation & Usage Guide

## What This Skill Does

The Next.js + Supabase SaaS Planner is your **comprehensive SaaS planning assistant**. It transforms product ideas into production-ready technical roadmaps, covering everything from database design to deployment strategies.

### 🎯 Core Capabilities

✅ **End-to-End Planning** - From idea to launch  
✅ **Database Schema Design** - Complete SQL schemas with RLS  
✅ **Authentication Patterns** - Email, OAuth, magic links, MFA  
✅ **Stripe Billing Integration** - Subscriptions, webhooks, usage tracking  
✅ **Multi-Tenancy Strategies** - Organization-based or subdomain-based  
✅ **File Structure Templates** - Production-ready Next.js 15 structure  
✅ **Development Roadmaps** - Week-by-week implementation plans  
✅ **Best Practices** - Security, performance, UX patterns  

---

## Installation Steps

### Step 1: Create ZIP File

1. Navigate to: `C:\Users\SITECH\Desktop\claude-skills\`
2. Right-click the `nextjs-supabase-saas-planner` folder
3. Select **"Send to" → "Compressed (zipped) folder"**
4. Name it: `nextjs-supabase-saas-planner.zip`

**Important:** ZIP structure must be:
```
nextjs-supabase-saas-planner.zip
└── nextjs-supabase-saas-planner/  ← Folder at root
    ├── SKILL.md
    └── references/
        ├── AUTHENTICATION_PATTERNS.md
        └── BILLING_PATTERNS.md
```

### Step 2: Upload to Claude Desktop

1. Open **Claude Desktop**
2. Go to **Settings** → **Capabilities** → **Skills**
3. Click **"Upload Skill"**
4. Select your ZIP file
5. Wait for upload to complete
6. **Enable** the skill

### Step 3: Test It

Restart Claude Desktop, then try:

> "I want to build a project management SaaS with Next.js and Supabase. Help me plan it."

Claude should provide comprehensive planning with database schemas, file structure, and roadmap!

---

## How to Use This Skill

### Example Queries

**Full SaaS Planning:**
- "Plan a SaaS for [industry] with Next.js and Supabase"
- "Help me architect a subscription-based platform"
- "Create a technical roadmap for my SaaS idea"

**Database Design:**
- "Design a database schema for multi-tenant SaaS"
- "Show me RLS policies for team-based access"
- "Create tables for subscription management"

**Authentication:**
- "Set up OAuth authentication with Supabase"
- "Implement magic link authentication"
- "Add MFA to my application"

**Billing:**
- "Integrate Stripe subscriptions with Next.js"
- "Handle Stripe webhooks for subscription updates"
- "Implement usage-based billing"

**Development Planning:**
- "Create a 4-week MVP roadmap"
- "Prioritize features for first launch"
- "Plan from prototype to production"

---

## What to Expect

### Phase 1: Discovery

Claude will ask clarifying questions:
- What problem does your SaaS solve?
- Who are your target users?
- What's your scale expectation?
- Team size and timeline?
- Pricing model?

### Phase 2: Technical Planning

Claude provides:

1. **Complete Database Schema**
   - SQL with all tables
   - Row Level Security policies
   - Indexes and relationships
   - Multi-tenancy structure

2. **File Structure**
   - Next.js 15 App Router layout
   - Component organization
   - Action and API structure
   - Type definitions

3. **Authentication Setup**
   - Supabase Auth configuration
   - Middleware implementation
   - Protected routes
   - OAuth integration

4. **Billing Integration**
   - Stripe setup
   - Checkout flows
   - Webhook handlers
   - Subscription management

5. **Development Roadmap**
   - Week-by-week breakdown
   - Feature prioritization
   - MVP scope
   - Launch checklist

---

## Skill Contents

### Main SKILL.md (874 lines)

**Planning Workflow:**
- Discovery phase questions
- Architecture decision framework
- Tech stack recommendations
- File structure templates

**Core Patterns:**
- Database schema design
- Authentication flows
- Stripe integration basics
- Multi-tenancy strategies

**MVP Roadmap:**
- Week 1-2: Foundation
- Week 3-4: Core features
- Week 5-6: Monetization
- Week 7-8: Polish
- Week 9: Launch prep

### Reference Documents (Loaded On-Demand)

**AUTHENTICATION_PATTERNS.md** (743 lines)
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic link authentication
- Multi-factor authentication (MFA)
- Password reset flows
- Session management
- Protected routes
- Email verification
- Invitation flows

**BILLING_PATTERNS.md** (850 lines)
- Stripe setup and configuration
- Pricing plans database structure
- Checkout session creation
- Webhook handling (complete)
- Subscription management
- Plan upgrades/downgrades
- Billing portal integration
- Usage-based billing
- Testing and best practices

---

## Tech Stack Covered

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

**Backend:**
- Next.js API Routes
- Server Actions
- Supabase Edge Functions

**Database:**
- PostgreSQL (Supabase)
- Row Level Security (RLS)
- Real-time subscriptions

**Authentication:**
- Supabase Auth
- OAuth providers
- Magic links
- MFA

**Payments:**
- Stripe
- Subscriptions
- Webhooks

**Deployment:**
- Vercel
- Supabase
- Cloudflare

---

## Example Interaction

**You:**
> "I want to build a SaaS for team collaboration with task management. Help me plan it with Next.js and Supabase."

**Claude (with this skill):**

> I'll help you plan a comprehensive team collaboration SaaS. Let me start with some key questions:
>
> **Scale & Timeline:**
> - Expected users in first year?
> - Team size and launch timeline?
> - Budget constraints?
>
> **Features:**
> - Real-time collaboration needed?
> - File attachments?
> - Notifications?
> - Mobile app planned?
>
> **Business Model:**
> - Free trial length?
> - Pricing tiers?
>
> Based on typical requirements, here's a complete technical plan:
>
> **Database Schema:** [provides complete SQL]
> **File Structure:** [shows Next.js organization]
> **Authentication:** [Supabase Auth setup]
> **Billing:** [Stripe integration]
> **8-Week Roadmap:** [detailed breakdown]
>
> Would you like me to dive deeper into any specific area?

---

## What Makes This Skill Special

1. **Complete Planning** - Not just code snippets, full architectural planning
2. **2025 Best Practices** - Next.js 15, Supabase latest patterns
3. **Production-Ready** - Database schemas, RLS policies, webhook handlers
4. **Progressive Detail** - Starts high-level, goes deep when needed
5. **Real-World Patterns** - Based on actual SaaS architectures
6. **MVP-Focused** - Helps prioritize and launch quickly
7. **Security-First** - RLS policies, auth patterns, webhook verification
8. **Billing-Complete** - Full Stripe integration patterns

---

## Use Cases

### 🚀 Startup Founders
- Validate technical feasibility
- Get accurate development estimates
- Plan MVP scope realistically
- Understand architecture decisions

### 👨‍💻 Developers
- Architecture reference
- Code patterns and examples
- Best practices
- Avoid common pitfalls

### 📊 Technical Teams
- Align on architecture
- Plan sprints
- Estimate timelines
- Onboard new developers

### 🎓 Learning
- Understand SaaS architecture
- Learn Next.js + Supabase patterns
- See production-quality code
- Study best practices

---

## Troubleshooting

### Skill Not Activating

Use trigger keywords:
- "SaaS planning"
- "Next.js Supabase"
- "database schema"
- "subscription billing"
- "multi-tenant"

### Want More Detail

Ask specifically:
- "Show me the complete authentication flow"
- "Explain Stripe webhook handling"
- "Generate the database migration SQL"
- "Create a detailed week 1 roadmap"

---

## Installation Verification

After installing, test with:

```
"Help me plan a SaaS application with these features:
- User authentication
- Team workspaces
- Subscription billing
- File uploads

Use Next.js 15 and Supabase."
```

You should receive:
- ✅ Clarifying questions
- ✅ Complete database schema
- ✅ File structure
- ✅ Authentication setup
- ✅ Billing integration plan
- ✅ Development roadmap

---

## Next Steps After Planning

1. **Setup Project**
   ```bash
   npx create-next-app@latest my-saas
   npm install @supabase/supabase-js stripe
   ```

2. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Run database migrations

3. **Configure Stripe**
   - Create Stripe account
   - Add products and prices
   - Set up webhook endpoint

4. **Follow Roadmap**
   - Implement week by week
   - Test thoroughly
   - Deploy incrementally

---

## Updates and Maintenance

To update this skill:
1. Modify SKILL.md or reference files
2. Re-zip the folder
3. Upload again in Claude Settings
4. Old version is replaced

---

**Build your SaaS with confidence!** 🚀✨

Need help? Ask Claude to explain any part of the planning, generate specific code examples, or create detailed documentation for your team.
