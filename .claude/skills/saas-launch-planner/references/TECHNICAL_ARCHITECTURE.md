# SaaS Technical Architecture - Complete Reference

## Tech Stack (Fixed for this Skill)

### Frontend
```
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
```

### Backend
```
- Next.js API Routes
- Supabase (PostgreSQL database)
- Supabase Auth (email + OAuth)
- Supabase Storage
```

### Payments
```
- Stripe Checkout
- Stripe Customer Portal
- Stripe Webhooks
- Stripe Billing
```

### Email
```
- Resend or SendGrid
```

### Hosting
```
- Vercel (Frontend + API)
- Supabase (Database + Auth + Storage)
```

### Analytics & Monitoring (Optional)
```
- Vercel Analytics (built-in)
- Sentry (error tracking)
- PostHog (product analytics)
```

---

## Database Schema

### Core Authentication & User Tables

```sql
-- Users table (handled by Supabase Auth automatically)
-- Located in: auth.users

-- Profiles table (extends auth.users with custom fields)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
```

---

### Subscription & Billing Tables

```sql
-- Customers table (Stripe sync)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view own customer record" 
ON customers FOR SELECT 
USING (auth.uid() = user_id);

---

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing, unpaid
  plan_name TEXT NOT NULL, -- starter, pro, enterprise
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
```

---

### Example Feature Tables (Project Management SaaS)

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- active, archived, completed
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_status_idx ON projects(status);

---

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in own projects" 
ON tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in own projects" 
ON tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks in own projects" 
ON tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks in own projects" 
ON tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX tasks_project_id_idx ON tasks(project_id);
CREATE INDEX tasks_completed_idx ON tasks(completed);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
```

---

### Subscription Access Control Helper Function

```sql
-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's plan name
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  plan TEXT;
BEGIN
  SELECT plan_name INTO plan
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing')
  AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Next.js App Structure

```
app/
├── (auth)/                          # Auth layout group
│   ├── layout.tsx                   # Auth-specific layout (centered form)
│   ├── login/
│   │   └── page.tsx                 # Login with email + Google OAuth
│   ├── signup/
│   │   └── page.tsx                 # Signup form
│   ├── verify-email/
│   │   └── page.tsx                 # Email verification page
│   └── forgot-password/
│       └── page.tsx                 # Password reset request
│
├── (marketing)/                     # Marketing layout group
│   ├── layout.tsx                   # Marketing site layout (header + footer)
│   ├── page.tsx                     # Landing page (hero, features, CTA)
│   ├── pricing/
│   │   └── page.tsx                 # Pricing page with tiers
│   ├── features/
│   │   └── page.tsx                 # Feature details
│   ├── about/
│   │   └── page.tsx                 # About page
│   ├── terms/
│   │   └── page.tsx                 # Terms of Service
│   └── privacy/
│       └── page.tsx                 # Privacy Policy
│
├── (dashboard)/                     # Dashboard layout group
│   ├── layout.tsx                   # Dashboard shell (sidebar + header)
│   ├── page.tsx                     # Dashboard home (overview)
│   │
│   ├── projects/                    # Example feature routes
│   │   ├── page.tsx                 # Projects list
│   │   ├── new/
│   │   │   └── page.tsx             # Create new project
│   │   └── [id]/
│   │       ├── page.tsx             # Project details
│   │       └── edit/
│   │           └── page.tsx         # Edit project
│   │
│   ├── billing/
│   │   └── page.tsx                 # Subscription management
│   │                                # (current plan, upgrade, invoices)
│   │
│   ├── settings/
│   │   ├── page.tsx                 # Profile settings
│   │   ├── account/
│   │   │   └── page.tsx             # Account settings
│   │   └── notifications/
│   │       └── page.tsx             # Notification preferences
│   │
│   └── onboarding/
│       └── page.tsx                 # First-time user onboarding
│
├── api/                             # API routes
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts             # Stripe webhook handler (POST)
│   │
│   ├── stripe/
│   │   ├── create-checkout-session/
│   │   │   └── route.ts             # Create Stripe Checkout (POST)
│   │   └── customer-portal/
│   │       └── route.ts             # Redirect to Customer Portal (POST)
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts             # Supabase OAuth callback (GET)
│   │
│   └── projects/                    # Example API routes
│       ├── route.ts                 # GET (list), POST (create)
│       └── [id]/
│           └── route.ts             # GET, PUT, DELETE
│
├── layout.tsx                       # Root layout
├── globals.css                      # Global styles
├── providers.tsx                    # Context providers (Supabase, theme, etc.)
└── error.tsx                        # Global error boundary

---

components/
├── ui/                              # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
│
├── layout/
│   ├── header.tsx                   # Site header
│   ├── footer.tsx                   # Site footer
│   ├── sidebar.tsx                  # Dashboard sidebar
│   └── nav.tsx                      # Navigation components
│
├── auth/
│   ├── login-form.tsx               # Login form component
│   ├── signup-form.tsx              # Signup form component
│   └── oauth-buttons.tsx            # OAuth provider buttons
│
├── dashboard/
│   ├── dashboard-shell.tsx          # Dashboard layout wrapper
│   ├── subscription-badge.tsx       # Current plan badge
│   └── trial-countdown.tsx          # Trial expiration countdown
│
└── shared/
    ├── loading-spinner.tsx
    ├── error-message.tsx
    └── empty-state.tsx

---

lib/
├── supabase/
│   ├── client.ts                    # Supabase client (browser)
│   ├── server.ts                    # Supabase client (server)
│   └── middleware.ts                # Auth middleware
│
├── stripe/
│   ├── client.ts                    # Stripe client config
│   ├── products.ts                  # Product & price definitions
│   ├── webhooks.ts                  # Webhook event handlers
│   └── checkout.ts                  # Checkout session helpers
│
├── utils/
│   ├── cn.ts                        # className utility
│   ├── date.ts                      # Date formatting
│   └── currency.ts                  # Currency formatting
│
└── validations/
    ├── auth.ts                      # Auth schemas (Zod)
    ├── project.ts                   # Project schemas
    └── task.ts                      # Task schemas
```

---

## Stripe Integration Architecture

### 1. Product & Price Configuration

```typescript
// lib/stripe/products.ts
export const STRIPE_PRODUCTS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    price: 2900, // $29.00 in cents
    features: [
      '20 projects',
      'Single user',
      'Email support',
      'Basic features'
    ]
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 7900, // $79.00 in cents
    features: [
      'Unlimited projects',
      '5 users',
      'Priority support',
      'Advanced features',
      'API access'
    ]
  }
} as const;

export type PlanName = keyof typeof STRIPE_PRODUCTS;
```

---

### 2. Create Checkout Session

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();
    
    // 1. Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Get or create Stripe customer
    let customerId: string;
    
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (customer) {
      customerId = customer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      
      // Save to database
      await supabase.from('customers').insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomer.id
      });
      
      customerId = stripeCustomer.id;
    }
    
    // 3. Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          user_id: user.id
        }
      }
    });
    
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

---

### 3. Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId || !session.subscription) return;
  
  // Subscription will be handled by subscription.created event
  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  
  if (!userId) return;
  
  const priceId = subscription.items.data[0].price.id;
  const planName = getPlanNameFromPriceId(priceId);
  
  // Upsert subscription in database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      plan_name: planName,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      trial_start: subscription.trial_start 
        ? new Date(subscription.trial_start * 1000).toISOString() 
        : null,
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Log successful payment
  console.log(`Invoice ${invoice.id} paid successfully`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Send dunning email to customer
  console.log(`Payment failed for invoice ${invoice.id}`);
  // TODO: Implement email notification
}

function getPlanNameFromPriceId(priceId: string): string {
  // Map price ID to plan name
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'free';
}
```

---

### 4. Customer Portal

```typescript
// app/api/stripe/customer-portal/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get Stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`
    });
    
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# App
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Your SaaS Name

# Email (Resend)
RESEND_API_KEY=re_...
```

---

## Authentication Middleware

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  // Redirect authenticated users away from auth pages
  if (req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/signup')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup']
};
```

---

## Critical Setup Steps

### 1. Supabase Setup
1. Create Supabase project
2. Run database migrations (SQL from above)
3. Enable Email Auth in Authentication settings
4. Add OAuth providers (Google, GitHub, etc.)
5. Configure site URL and redirect URLs

### 2. Stripe Setup
1. Create Stripe account
2. Create products & prices in Stripe Dashboard
3. Copy price IDs to environment variables
4. Set up webhook endpoint URL
5. Copy webhook signing secret
6. Enable Customer Portal in Stripe settings

### 3. Webhook Configuration
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### 4. Test Mode
1. Use Stripe test mode for development
2. Use test cards (4242 4242 4242 4242)
3. Test webhook events with Stripe CLI
4. Switch to live mode only when ready

---

**Remember**: This architecture is battle-tested for SaaS MVPs and handles the most common subscription scenarios. Start here, then customize as needed!