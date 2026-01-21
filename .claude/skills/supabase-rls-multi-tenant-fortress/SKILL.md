## SKILL 3: Supabase Row-Level Security Multi-Tenant Fortress

### Metadata
- **Name:** Supabase Row-Level Security Multi-Tenant Fortress
- **Category:** Database Security & Authorization
- **Priority:** P0 (Foundation for data isolation)
- **Domain:** PostgreSQL RLS, Supabase auth, multi-role enforcement
- **Owner Role:** Backend/Security Engineer
- **Complexity:** High
- **Skills Required:** PostgreSQL, RLS policies, Supabase auth, JWT claims

### Mission
Design and maintain bulletproof Row-Level Security (RLS) policies enforcing complete data isolation across Admin, Restaurant, and Driver roles. Use hierarchical RLS with helper functions, JWT custom claims, and SECURITY DEFINER functions to prevent unauthorized access even if client code is compromised.

### Key Directives

1. **Hierarchical Role Model**
   - **Admin**: Access all data across all organizations; create new restaurants/drivers
   - **Restaurant Manager**: Access own restaurant + owned orders/deliveries/inventory; manage drivers assigned to restaurant
   - **Driver**: Access assigned deliveries, own location data; read-only order details
   - Roles stored in Supabase auth JWT: `custom_claims.role` and `custom_claims.restaurant_id` and `custom_claims.organization_id`

2. **RLS Policy Layer Stack**
   ```
   Auth Layer: Is user authenticated? (auth.uid() != null)
   ↓
   Role Layer: What is user's role? (auth.jwt() ->> 'role')
   ↓
   Resource Layer: Does user's restaurant/org own this resource?
   ↓
   Field Layer: Are certain fields restricted even for owners?
   ```

3. **Security Definer Helper Functions**
   - Create PL/pgSQL functions with `SECURITY DEFINER` for elevated operations
   - Example: `is_organization_admin(org_id UUID, user_id UUID) -> BOOLEAN`
   - These functions bypass RLS when called from restricted contexts
   - Use for complex membership checks that would require expensive joins

4. **JWT Custom Claims Strategy**
   - After Supabase auth, use `auth.setSession()` to inject custom claims
   - Embed: `organization_id`, `restaurant_id`, `role`, `driver_id`
   - Update claims on auth state change (use onAuthStateChange + setSession)
   - Never trust client-provided role; always validate in Server Actions

5. **Table-Level RLS Enforcement**
   - Every table must have RLS enabled
   - Provide explicit POLICY for SELECT, INSERT, UPDATE, DELETE
   - Default deny: create restrictive policies first, then selectively allow
   - Review policies quarterly; log policy changes to audit table

6. **Audit Logging**
   - Create `audit_logs` table with immutable trigger
   - Log: operation (SELECT, INSERT, UPDATE, DELETE), table, user_id, old_data, new_data, timestamp
   - Use trigger for automatic logging: cannot be bypassed by RLS
   - Encrypt sensitive fields before logging (e.g., payment info)

### Workflows

**Workflow: Multi-Tenant Resource Access**
```sql
-- Enable RLS on critical tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 1. Admin can access all orders
CREATE POLICY "Admin access all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- 2. Restaurant manager can access own orders
CREATE POLICY "Restaurant access own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id = (auth.jwt() ->> 'restaurant_id')::uuid
  );

-- 3. Driver can access assigned delivery orders
CREATE POLICY "Driver access assigned orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT order_id FROM public.deliveries
      WHERE driver_id = auth.uid()
    )
  );

-- 4. Only restaurants can insert orders (no driver-created orders)
CREATE POLICY "Only restaurants create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'restaurant'
    AND restaurant_id = (auth.jwt() ->> 'restaurant_id')::uuid
  );

-- 5. Restaurants can only update own orders, drivers can only update delivery status
CREATE POLICY "Update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'restaurant' 
    AND restaurant_id = (auth.jwt() ->> 'restaurant_id')::uuid
  )
  WITH CHECK (restaurant_id = (auth.jwt() ->> 'restaurant_id')::uuid);

-- Helper function: Check if user is organization admin
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = user_id
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only operations use helper
CREATE POLICY "Admin operations"
  ON public.restaurants
  FOR DELETE
  TO authenticated
  USING (
    is_organization_admin(organization_id, auth.uid())
  );
```

**Workflow: Update JWT Claims on Login**
```typescript
// lib/supabase/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function enrichAuthClaims() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return;

  // Fetch user's role and restaurant association
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, restaurant_id, organization_id')
    .eq('user_id', session.user.id)
    .single();

  if (profile) {
    // Refresh session with custom claims (via Edge Function)
    const { data: newSession } = await supabase.functions.invoke('refresh-auth', {
      body: { 
        userId: session.user.id,
        role: profile.role,
        restaurantId: profile.restaurant_id,
        organizationId: profile.organization_id,
      },
    });

    if (newSession?.session) {
      await supabase.auth.setSession(newSession.session);
    }
  }
}

// Call on app startup and auth state change
supabase.auth.onAuthStateChange(() => {
  enrichAuthClaims();
});
```

### Tooling

**Core**
- PostgreSQL with Supabase hosting
- pgAdmin or DBeaver for RLS policy development + testing
- `supabase` CLI for policy versioning

**Utilities**
- Policy testing helper: function to verify SELECT/INSERT/UPDATE/DELETE access
- SQL comment generator: auto-document policy intent
- Audit query builder: easy audit log inspection

**Testing**
- Playwright: create test users with different roles, verify access isolation
- Vitest: unit test RLS helper functions with mocked user_id
- Database snapshot: test against realistic data distribution

**Monitoring**
- Alert on RLS policy violations (logged to audit_logs)
- Monitor denied access attempts per user
- Quarterly policy review checklist
