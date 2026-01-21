## SKILL 12: Analytics Insight Generator

### Metadata
- **Name:** Analytics Insight Generator
- **Category:** Data Visualization & Reporting
- **Priority:** P2 (Admin value add)
- **Domain:** Recharts, Supabase aggregations, SQL views
- **Owner Role:** Full-Stack Engineer
- **Complexity:** Medium
- **Skills Required:** Recharts, SQL Group By/Window Functions, Performance tuning

### Mission
Construct high-performance analytics dashboards for Admins and Restaurant Managers. visualize trends (revenue, order volume, delivery times) using Recharts. Balance real-time needs with expensive query costs using materialized views or caching.

### Key Directives

1. **Visualization Library**
   - Use `recharts` for all charts: accessible, composable, React-native
   - Shared Chart Components: `<LineChartCard>`, `<BarChartCard>`, `<KPICard>`
   - Responsive containers (`ResponsiveContainer`): charts adapt to sidebar toggle/mobile
   - Consistent colors: map chart colors to CSS variables (`--chart-1`, `--chart-2`)

2. **Data Aggregation Strategy**
   - **Real-time (Live)**: Active orders, current driver locations (Direct table query / Realtime)
   - **Historical (Trends)**: Revenue by month, Orders by day
     - *Don't* query `count(*)` on millions of rows in real-time API
     - *Do* use Database Views or Materialized Views (refresh concurrently)
     - *Do* use Supabase `.rpc()` to call SQL aggregation functions

3. **Performance & Caching**
   - Cache dashboard API responses for 5-60 minutes depending on metric
   - Use `Suspense` with skeletons while charts load
   - Client-side: use TanStack Query with `staleTime: Infinity` for historical reports

4. **KPI Metrics Definition**
   - **Revenue**: Total value of *completed* orders (exclude cancelled/refunded)
   - **AOV (Average Order Value)**: Revenue / Count
   - **Delivery Time**: timestamp_delivered - timestamp_created
   - **Fulfillment Rate**: (Total - Cancelled) / Total * 100%

5. **Interactivity**
   - Date Range Picker: Preset ranges (Today, 7D, 30D, YTD) + Custom
   - Filter by Restaurant/Driver (for Admin view)
   - Tooltips: Custom tooltip component matching shadcn/ui style
   - Click-through: Click bar segment to drill down into order list

### Workflows

**Workflow: High-Performance SQL Aggregation**
```sql
-- Create a view for easy access (but still computed on read)
CREATE OR REPLACE VIEW view_daily_sales AS
SELECT
  date_trunc('day', created_at) as day,
  restaurant_id,
  count(*) as total_orders,
  sum(total_amount) as total_revenue
FROM orders
WHERE status = 'delivered'
GROUP BY 1, 2;

-- RPC Function for filtered ranges (more performant with index)
CREATE OR REPLACE FUNCTION get_sales_analytics(
  start_date timestamptz,
  end_date timestamptz,
  target_restaurant_id uuid default null
)
RETURNS TABLE (
  day timestamptz,
  revenue numeric,
  orders bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at) as day,
    sum(total_amount) as revenue,
    count(*) as orders
  FROM orders
  WHERE created_at BETWEEN start_date AND end_date
    AND status = 'delivered'
    AND (target_restaurant_id IS NULL OR restaurant_id = target_restaurant_id)
  GROUP BY 1
  ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql;
```

**Workflow: Recharts Component**
```typescript
// components/analytics/RevenueChart.tsx
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RevenueChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="day"
              tickFormatter={(val) => new Date(val).toLocaleDateString()}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(val) => `₾${val}`}
              fontSize={12}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-bold text-muted-foreground">Revenue</span>
                      <span className="text-right font-mono">
                        ₾{payload[0].value}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="revenue"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Tooling

**Core**
- `recharts` - Charting library
- SQL Views / Functions

**Utilities**
- Date helpers (`date-fns`) for range generation
- Number formatter for currency axes
- Mock data generator for development preview

**Testing**
- Vitest: Validating data transformation logic (backend → chart format)
- Playwright: Verify charts render without error

**Monitoring**
- Query performance: `get_sales_analytics` response time
- Slow query log in Supabase
