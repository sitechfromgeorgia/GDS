# Stripe Integration Patterns for Next.js SaaS

## Complete Stripe Setup Guide

### 1. Stripe Account Setup

**Create Products in Stripe Dashboard:**

1. Go to Products in Stripe Dashboard
2. Create a product for each tier:
   - **Free Tier** (Optional - for tracking)
   - **Pro Tier** - $29/month
   - **Enterprise Tier** - $99/month

3. For each product, add prices:
   - Monthly price
   - Annual price (typically 15-20% discount)

### 2. Webhook Events to Handle

**Critical Events:**
```typescript
// Must handle these for subscriptions to work

'checkout.session.completed'        // User completes checkout
'customer.subscription.created'     // Subscription starts
'customer.subscription.updated'     // Tier change, renewal
'customer.subscription.deleted'     // Cancellation
'invoice.payment_succeeded'         // Successful payment
'invoice.payment_failed'            // Payment failure
'customer.updated'                  // Customer info changes
```

**Webhook Handler Pattern:**

```typescript
// app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook error', { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get org from metadata
      const orgId = session.metadata?.organization_id;
      
      if (session.mode === 'subscription') {
        // Create customer record
        await supabase.from('customers').upsert({
          organization_id: orgId,
          stripe_customer_id: session.customer as string,
          email: session.customer_email
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Get price details
      const price = subscription.items.data[0].price;
      
      // Update subscription in database
      await supabase.from('subscriptions').upsert({
        id: subscription.id,
        customer_id: subscription.customer as string,
        status: subscription.status,
        price_id: price.id,
        quantity: subscription.items.data[0].quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      });

      // Update organization tier
      const { data: customer } = await supabase
        .from('customers')
        .select('organization_id')
        .eq('stripe_customer_id', subscription.customer)
        .single();

      if (customer) {
        // Map price to tier
        const tier = getTierFromPriceId(price.id);
        
        await supabase
          .from('organizations')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status
          })
          .eq('id', customer.organization_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          ended_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      // Downgrade org to free tier
      const { data: customer } = await supabase
        .from('customers')
        .select('organization_id')
        .eq('stripe_customer_id', subscription.customer)
        .single();

      if (customer) {
        await supabase
          .from('organizations')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled'
          })
          .eq('id', customer.organization_id);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        // Update subscription status to active
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', invoice.subscription);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', invoice.subscription);
      }
      
      // Send payment failure email
      // await sendPaymentFailureEmail(invoice);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }));
}

function getTierFromPriceId(priceId: string): string {
  // Map your Stripe price IDs to tiers
  const priceToTier: Record<string, string> = {
    'price_1abc...': 'pro',
    'price_2xyz...': 'enterprise',
  };
  
  return priceToTier[priceId] || 'free';
}
```

### 3. Checkout Flow

**Create Checkout Session:**

```typescript
// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { priceId, organizationId } = await req.json();
  
  const supabase = await createClient();
  
  // Verify user owns this org
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get or create Stripe customer
  const { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('organization_id', organizationId)
    .single();

  let customerId = customer?.stripe_customer_id;

  if (!customerId) {
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      metadata: {
        organization_id: organizationId,
      },
    });
    
    customerId = stripeCustomer.id;
    
    await supabase.from('customers').insert({
      organization_id: organizationId,
      stripe_customer_id: customerId,
      email: user.email,
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${organizationId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      organization_id: organizationId,
    },
    subscription_data: {
      trial_period_days: 14, // Optional trial
      metadata: {
        organization_id: organizationId,
      },
    },
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
```

**Frontend Checkout:**

```typescript
// components/billing/checkout-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CheckoutButtonProps {
  priceId: string;
  organizationId: string;
  tierName: string;
}

export function CheckoutButton({ priceId, organizationId, tierName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, organizationId }),
      });

      const { url, error } = await response.json();

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Loading...' : `Upgrade to ${tierName}`}
    </Button>
  );
}
```

### 4. Customer Portal

**Portal Session Endpoint:**

```typescript
// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { organizationId } = await req.json();
  
  const supabase = await createClient();
  
  // Verify user access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get Stripe customer
  const { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('organization_id', organizationId)
    .single();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${organizationId}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

### 5. Usage-Based Billing

**For metered billing (e.g., API calls):**

```typescript
// lib/stripe/report-usage.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function reportUsage(subscriptionItemId: string, quantity: number) {
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(Date.now() / 1000),
  });
}

// Track usage in your app
async function trackApiCall(organizationId: string) {
  // Increment usage counter in database
  await supabase.rpc('increment_usage', {
    org_id: organizationId,
    metric: 'api_calls'
  });
  
  // Report to Stripe (batch this in production)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_item_id')
    .eq('organization_id', organizationId)
    .single();
    
  if (subscription?.stripe_subscription_item_id) {
    await reportUsage(subscription.stripe_subscription_item_id, 1);
  }
}
```

### 6. Testing Locally

**Stripe CLI Setup:**

```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: Download from stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy webhook secret to .env.local
# Output: whsec_xxxxx
```

**Test Cards:**

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
Insufficient funds: 4000 0000 0000 9995
```

### 7. Feature Gating

**Check subscription tier:**

```typescript
// lib/permissions/subscription.ts
import { createClient } from '@/lib/supabase/server';

export async function checkSubscription(organizationId: string) {
  const supabase = await createClient();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status')
    .eq('id', organizationId)
    .single();
    
  return {
    tier: org?.subscription_tier || 'free',
    status: org?.subscription_status || 'inactive',
    isActive: org?.subscription_status === 'active',
    isPro: org?.subscription_tier === 'pro' && org?.subscription_status === 'active',
    isEnterprise: org?.subscription_tier === 'enterprise' && org?.subscription_status === 'active',
  };
}

// Usage in Server Actions
export async function createProject(organizationId: string, data: any) {
  'use server';
  
  const subscription = await checkSubscription(organizationId);
  
  // Count existing projects
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);
    
  // Check limits
  const limits = {
    free: 1,
    pro: 10,
    enterprise: Infinity,
  };
  
  if (count >= limits[subscription.tier]) {
    return {
      error: 'Project limit reached. Please upgrade your plan.',
      upgradeRequired: true,
    };
  }
  
  // Create project...
}
```

### 8. Common Issues & Solutions

**Issue: Webhook not receiving events**
```bash
# Solution: Verify webhook secret
stripe listen --print-secret

# Check webhook endpoint in Stripe dashboard
# Ensure URL is correct: https://yourapp.com/api/stripe/webhook
```

**Issue: Subscription not updating in database**
```typescript
// Solution: Check webhook handler logs
// Add detailed logging in webhook handler
console.log('Received event:', event.type);
console.log('Event data:', event.data.object);
```

**Issue: Test mode vs Production mode**
```bash
# Always use separate keys
# .env.local (Development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vercel (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Summary

**Essential Stripe Integration Steps:**

1. Create products/prices in Stripe Dashboard
2. Implement checkout flow (API route + frontend)
3. Set up webhook handler for subscription events
4. Implement Customer Portal for self-service
5. Add feature gating based on subscription tier
6. Test locally with Stripe CLI
7. Configure production webhooks

**Remember:**
- Always verify webhook signatures
- Handle all subscription lifecycle events
- Test with Stripe CLI before production
- Use metadata to link Stripe objects to your database
- Implement proper error handling and logging
