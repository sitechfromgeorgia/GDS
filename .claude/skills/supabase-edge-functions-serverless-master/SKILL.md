## SKILL 10: Supabase Edge Functions Serverless Master

### Metadata
- **Name:** Supabase Edge Functions Serverless Master
- **Category:** Backend Logic & Integrations
- **Priority:** P2 (High performance & integrations)
- **Domain:** Deno, Edge Runtime, Webhooks, Stripe integration
- **Owner Role:** Backend Engineer
- **Complexity:** Medium-High
- **Skills Required:** TypeScript, Deno, HTTP standards, standard library

### Mission
Build low-latency, globally distributed serverless functions using Supabase Edge Functions (Deno). Handle complex business logic, third-party webhooks (Stripe, SMS gateways), and secure admin operations that bypass RLS. Ensure strictly typed payloads and proper error handling.

### Key Directives

1. **Deno Runtime Best Practices**
   - Use `jsr:` or `deno.land` imports; lock versions in `deno.json`
   - Use standard `Request` and `Response` objects (Web Standards)
   - Enable CORS for browser-invoked functions
   - Use `SupabaseClient` with service role key ONLY for admin tasks (bypass RLS)
   - Store secrets in Supabase Dashboard (Environment Variables), access via `Deno.env.get()`

2. **Types & Validation**
   - Share TypeScript types between Next.js app and Edge Functions (via shared package or monorepo)
   - Validate request body with Zod inside the Edge Function
   - Return strictly typed JSON responses

3. **Webhook Handling**
   - Verify webhook signatures (e.g., Stripe `stripe-signature`)
   - Process events asynchronously if possible; return 200 OK quickly
   - Idempotency: check if event ID already processed in DB
   - Stripe events: `checkout.session.completed`, `payment_intent.succeeded`

4. **Scheduled Tasks (Cron)**
   - Use `pg_cron` extensions or reliable 3rd party cron triggers calling Edge Functions
   - Examples: "Daily Order Summary Email" at 08:00 AM
   - Examples: "Cleanup Stale Carts" every hour
   - Secure cron functions: check `Authorization` header for internal secret

5. **Performance Optimization**
   - Keep cold starts low: minimal dependencies
   - Global distribution: deploy to regions closest to users (Supabase default is widespread)
   - Cache expensive computations if applicable

6. **Debugging & Logs**
   - Use `console.log` for structured logging (viewable in Dashboard)
   - Log request ID, user ID, and start/end time
   - Handle global errors (try-catch-finally)

### Workflows

**Workflow: Secure Admin Function (Invite User)**
```typescript
// supabase/functions/invite-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from Invite User Function!");

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create Supabase Client (Admin Context)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Validate Input
    const { email, role, restaurantId } = await req.json();
    if (!email || !role) {
      throw new Error('Missing email or role');
    }

    // 3. Create User in Auth
    const { data: user, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw inviteError;

    // 4. Assign Role in Database
    if (user.user) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ role, restaurant_id: restaurantId })
        .eq('user_id', user.user.id);
      
      if (profileError) throw profileError;
    }

    // 5. Return Success
    return new Response(JSON.stringify({ success: true, userId: user.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

**Workflow: Stripe Webhook Handler**
```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        await handlePaymentSuccess(event.data.object);
        break;
      // ... handle other events
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
```

### Tooling

**Core**
- Deno Runtime
- Supabase CLI (`supabase functions new`, `supabase functions deploy`)
- `stripe-node` (Deno compatible via esm.sh)

**Utilities**
- `cors.ts` shared module
- `supabase-admin` helper creating client with service role key
- Request validation helper

**Testing**
- `supabase functions serve` - Run locally
- Postman / Curl to trigger local function
- Integration test: invoke function from Next.js app and verify DB side effects

**Monitoring**
- Supabase Dashboard: Invocations, Errors, Logs
- Monitor execution time (billing impact)
- Alert on 500 errors
