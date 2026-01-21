## SKILL 9: B2B Dynamic Pricing Engine

### Metadata
- **Name:** B2B Dynamic Pricing Engine
- **Category:** Business Logic & Algorithms
- **Priority:** P1 (Revenue critical)
- **Domain:** Pricing algorithms, tiered discounts, bulk order calculations
- **Owner Role:** Full-Stack Engineer + Product
- **Complexity:** High
- **Skills Required:** TypeScript, algorithms, financial math, database design

### Mission
Build sophisticated B2B pricing engine supporting volume tiers, dynamic discounts, bulk order minimums, seasonal pricing, and per-customer negotiated rates. Calculate real-time final prices on cart updates, apply discounts atomically, and prevent margin erosion.

### Key Directives

1. **Pricing Tier Architecture**
   - All-units discount: entire order qualifies for lower price at threshold (simplest)
   - Incremental tiers: different units priced at different rates (more complex, better UX)
   - Configuration: define tiers per product variant
   - Example: 1-10 units @ ₾50, 11-30 @ ₾45, 31+ @ ₾40

2. **Discount Logic Engine**
   - Apply in order: tier discounts → bulk discounts → promotional codes → customer-specific negotiated rates
   - Each discount layer respects minimum margin (e.g., never discount below 15% margin)
   - Display breakdown: show line items, tier applied, discount, final price
   - Atomicity: all-or-nothing; if discount breaks margin, fall back to next tier

3. **Volume-Based Rules**
   - Minimum order quantities per restaurant/customer
   - Maximum order quantities (availability)
   - Increment quantities (e.g., only in batches of 5)
   - Seasonal minimums (higher during off-peak)

4. **Customer-Specific Pricing**
   - Negotiate custom rates per restaurant/customer (stored in DB)
   - Negotiated rates override all other discounts
   - Expiration dates on negotiated rates (e.g., "valid until Q2 2026")
   - Audit trail: log who negotiated, when, expiration

5. **Real-Time Calculation**
   - Recalculate price on every cart change (item add/remove/quantity)
   - Display price breakdown to customer in real-time
   - Save calculation rationale to order (why this price?)
   - Prevent race conditions: lock pricing during checkout

6. **Margin Protection**
   - Define minimum gross margin %: (price - cost) / price >= threshold
   - Cost stored per variant (sourcing cost + overhead allocation)
   - Alert if discount would break margin
   - Fallback: increase volume tier or refuse order

### Workflows

**Workflow: All-Units Tier Calculation**
```typescript
// lib/pricing/tier-calculator.ts
import { z } from 'zod';

interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: number; // ₾
  name: string; // "Bulk", "Wholesale", etc.
}

interface DiscountRule {
  quantity: number;
  percentDiscount: number;
}

interface VariantPricing {
  basePrice: number;
  cost: number; // COGS
  tiers: PriceTier[];
  discountRules: DiscountRule[];
  minMarginPercent: number;
}

interface CalculationResult {
  quantity: number;
  basePricePerUnit: number;
  appliedTier: PriceTier;
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  marginPercent: number;
  viable: boolean;
  reason: string;
}

export function calculateAllUnitsTierPrice(
  quantity: number,
  pricing: VariantPricing,
  discountCodes?: string[]
): CalculationResult {
  // Find applicable tier
  const tier = pricing.tiers
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((t) => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity));

  if (!tier) {
    throw new Error(`No tier found for quantity: ${quantity}`);
  }

  let subtotal = quantity * tier.pricePerUnit;

  // Apply discount rules if quantity triggers one
  const applicableDiscount = pricing.discountRules
    .sort((a, b) => b.quantity - a.quantity)
    .find((rule) => quantity >= rule.quantity);

  const discountAmount = applicableDiscount
    ? subtotal * (applicableDiscount.percentDiscount / 100)
    : 0;

  const total = subtotal - discountAmount;
  const cost = quantity * pricing.cost;
  const marginPercent = ((total - cost) / total) * 100;
  const viable = marginPercent >= pricing.minMarginPercent;

  return {
    quantity,
    basePricePerUnit: tier.pricePerUnit,
    appliedTier: tier,
    subtotal,
    discount: discountAmount,
    discountPercent: applicableDiscount?.percentDiscount ?? 0,
    total,
    marginPercent,
    viable,
    reason: viable
      ? `Tier "${tier.name}" @ ₾${tier.pricePerUnit}/unit (Margin: ${marginPercent.toFixed(1)}%)`
      : `Margin insufficient: ${marginPercent.toFixed(1)}% < ${pricing.minMarginPercent}%`,
  };
}
```

**Workflow: Customer-Specific Negotiated Pricing**
```typescript
// lib/pricing/negotiated-pricing.ts
interface NegotiatedRate {
  id: string;
  restaurantId: string;
  productId: string;
  pricePerUnit: number; // ₾
  minQuantity: number;
  validFrom: Date;
  validUntil: Date;
  negotiatedBy: string; // Admin user ID
  createdAt: Date;
}

export async function getNegotiatedRate(
  restaurantId: string,
  productId: string,
  quantity: number,
  supabase: SupabaseClient
): Promise<NegotiatedRate | null> {
  const now = new Date();

  const { data, error } = await supabase
    .from('negotiated_rates')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('product_id', productId)
    .lte('valid_from', now.toISOString())
    .gte('valid_until', now.toISOString())
    .lte('min_quantity', quantity)
    .order('price_per_unit', { ascending: true })
    .limit(1)
    .single();

  return data as NegotiatedRate | null;
}

export async function calculatePriceWithNegotiation(
  restaurantId: string,
  cartItems: CartItem[],
  supabase: SupabaseClient
): Promise<{ total: number; breakdown: PriceBreakdown[] }> {
  const breakdown: PriceBreakdown[] = [];
  let total = 0;

  for (const item of cartItems) {
    const negotiatedRate = await getNegotiatedRate(
      restaurantId,
      item.productId,
      item.quantity,
      supabase
    );

    if (negotiatedRate) {
      // Use negotiated rate (overrides all other discounts)
      const itemTotal = item.quantity * negotiatedRate.pricePerUnit;
      breakdown.push({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: negotiatedRate.pricePerUnit,
        itemTotal,
        appliedRule: 'negotiated_rate',
      });
      total += itemTotal;
    } else {
      // Fall back to tier-based pricing
      const pricing = await getVariantPricing(item.productId, supabase);
      const tierResult = calculateAllUnitsTierPrice(item.quantity, pricing);

      breakdown.push({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: tierResult.basePricePerUnit,
        itemTotal: tierResult.total,
        appliedRule: tierResult.appliedTier.name,
      });
      total += tierResult.total;
    }
  }

  return { total, breakdown };
}
```

**Server Action for Cart Pricing:**
```typescript
// app/actions/calculateCartPrice.ts
'use server';

import { calculatePriceWithNegotiation } from '@/lib/pricing/negotiated-pricing';
import { createServerClient } from '@/lib/supabase/server';

export async function calculateCartPrice(restaurantId: string, cartItems: CartItem[]) {
  try {
    const supabase = createServerClient();
    const { total, breakdown } = await calculatePriceWithNegotiation(
      restaurantId,
      cartItems,
      supabase
    );

    return {
      success: true,
      data: { total, breakdown },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
```

### Tooling

**Core**
- Supabase tables: `pricing_tiers`, `negotiated_rates`, `discount_rules`, `product_costs`
- TypeScript for type-safe pricing calculations
- Server Actions for atomic price calculations

**Utilities**
- Price calculation engine (standalone functions, unit testable)
- Price history logger (audit trail)
- Margin validator

**Testing**
- Vitest: extensive unit tests for all tier/discount combinations
- Edge cases: zero quantity, expired rates, margin violations
- Load testing: price calculation on 1000-item carts

**Monitoring**
- Track average discount rate per restaurant
- Alert on margin violations (logged, should be zero)
- Monitor negotiated rate utilization
