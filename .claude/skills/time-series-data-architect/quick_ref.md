# Quick Reference: Time-Series Data Architect

## Core Concepts at a Glance

### Chunk Time Interval Selection
```
Dataset Size          Chunk Interval    Reasoning
< 10M rows/day        7 days           Standard default
10-50M rows/day       1-3 days         Better compression ratio
50-100M rows/day      1 day            Faster chunk rotation
> 100M rows/day       6-12 hours       Consider ClickHouse instead
```

### Compression Ratio Expectations
```
Data Type              Uncompressed    Compressed    Ratio
Price data (tick)      100 MB/day      2-5 MB/day    95-98%
Daily aggregates       10 MB           0.5 MB        95%
Weekly aggregates      2 MB            0.1 MB        95%
With segmentation      100 MB          1-2 MB        98%+
```

### Query Performance SLAs
```
Query Type                    Source              Latency    Index
Price history (1 month)      daily_avg           <10ms      (bucket DESC, product_id)
Last known price            raw (last 24h)      <5ms       (product_id, time DESC)
Price drop detection (24h)   raw + aggregates    <100ms     (merchant_id, product_id, time)
Category top 10             daily_avg           <25ms      (product_id)
```

## Decision Tree: Which Database?

```
Do you need ACID transactions?
├─ YES → PostgreSQL (relational schema)
└─ NO → Continue below

Is data time-series?
├─ NO → PostgreSQL
└─ YES → Continue below

Is ingest rate > 100K/sec?
├─ YES → ClickHouse
└─ NO → Continue below

Do you need OLTP + analytics?
├─ YES → TimescaleDB (best of both)
└─ NO → Pure OLAP? → ClickHouse
```

## Continuous Aggregates: Refresh Mechanics

```
Real-Time Aggregation (TimescaleDB 1.7+)
├─ Query combines: Pre-materialized (old) + Raw (recent)
├─ Refresh policy: Incremental (only new/changed data)
├─ Lag: 5-15 minutes (configurable)
└─ Performance: ~18ms for 1-year query

Without Real-Time (Pre-1.7)
├─ Query only materialized data
├─ Refresh: Full re-computation on schedule
├─ Lag: Until next refresh cycle
└─ Stale if queried between refreshes
```

## Compression Strategy Matrix

```
Scenario                              Strategy
─────────────────────────────────────────────────────────
Need <1ms queries always              Keep all data uncompressed
Need monthly/quarterly reports        Compress data >30 days old
Need <$100/TB storage costs          Compress data >7 days, downsample >1 year
IA (Infrequent Access) workload      Compress data >1 day, delete >1 year
```

## CREATE TABLE Boilerplate: 3 Patterns

### Pattern 1: Basic (Start Here)
```sql
CREATE TABLE product_prices (
    time TIMESTAMP NOT NULL,
    product_id BIGINT NOT NULL,
    merchant_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
SELECT create_hypertable('product_prices', 'time');
SELECT set_chunk_time_interval('product_prices', INTERVAL '1 day');
CREATE INDEX ON product_prices (product_id, time DESC);
```

### Pattern 2: Production (Compression Enabled)
```sql
CREATE TABLE product_prices (
    time TIMESTAMP NOT NULL,
    product_id BIGINT NOT NULL,
    merchant_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
SELECT create_hypertable('product_prices', 'time');
ALTER TABLE product_prices SET (
    timescaledb.compress = true,
    timescaledb.compress_segmentby = 'product_id, merchant_id'
);
SELECT add_compression_policy('product_prices', INTERVAL '7 days');
SELECT add_retention_policy('product_prices', INTERVAL '90 days');
```

### Pattern 3: Scaled (With Continuous Aggregates)
```sql
-- (Create hypertable first, see Pattern 2)
CREATE MATERIALIZED VIEW price_daily_avg
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    product_id, merchant_id,
    MIN(price), MAX(price), AVG(price), COUNT(*)
FROM product_prices
GROUP BY bucket, product_id, merchant_id;

SELECT add_continuous_aggregate_policy(
    'price_daily_avg',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes'
);
```

## Troubleshooting Common Issues

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| Compression ratio <80% | Poor segmentation | Use `compress_segmentby = 'product_id'` |
| Chunk creation slow | Too many simultaneous chunks | Increase chunk_time_interval |
| Aggregates out of date | Refresh policy not running | Check `timescaledb_information.jobs` |
| Queries still slow (>100ms) | Missing indexes | Add composite index: `(product_id, time DESC)` |
| OOM on aggregation | Too many GROUP BY combinations | Use downsampling before aggregation |
| Disk usage > 2TB/day | No compression policy | Run: `add_compression_policy(table, INTERVAL '7 days')` |

## Monitoring Dashboard Queries

```sql
-- CPU pressure (should be < 80%)
SELECT load_average FROM pg_stat_statements LIMIT 1;

-- Chunk distribution
SELECT chunk_name, table_bytes / 1024 / 1024 / 1024 AS size_gb
FROM chunk_compression_stats('product_prices')
ORDER BY table_bytes DESC LIMIT 10;

-- Job status
SELECT job_id, job_status, next_start FROM timescaledb_information.jobs;

-- Top slow queries (>100ms)
SELECT query, calls, mean_exec_time FROM pg_stat_statements
WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 10;
```

## Cost Estimation

```
Base Numbers (1M products × 100 merchants):
- Daily price points: 50M
- Storage per year: ~1.8TB (uncompressed)
- Storage per year: ~90GB (compressed)
- Write throughput: 580/sec (baseline)

Per-Node Capacity (64GB RAM, 4TB SSD):
- Raw storage: ~2 years at native granularity
- Compressed: ~20 years at native + aggregates
- Peak write: 100K/sec (with optimization)
- Memory: Max 512MB indexes per chunk (25% rule)

Cost Breakdown:
- PostgreSQL (relational): $0.2/GB/month
- TimescaleDB (time-series): $0.15/GB/month
- ClickHouse (distributed): $0.1/GB/month
→ 90GB compressed/month ≈ $13-15/month (single node)
```

---

## Essential Formulas

### Chunk Size Estimation
```
bytes_per_row = 8 (time) + 8 (product_id) + 4 (merchant_id) + 8 (price) + overhead
              ≈ 40 bytes per row

rows_per_day = daily_price_points
chunk_size = rows_per_day × bytes_per_row × days_in_chunk

Example: 50M rows/day × 40 bytes × 1 day ≈ 2GB uncompressed
         2GB × 5% (compression) ≈ 100MB compressed
```

### Index Memory (25% Rule)
```
max_chunk_bytes_in_memory = system_ram * 0.25

For 64GB system:
max_chunk_bytes = 16GB
max_daily_ingest = 16GB / 40 bytes ≈ 400M rows/day
recommended_chunk_interval = INTERVAL '1 day'
```

### Continuous Aggregate Refresh Overhead
```
refresh_time = scan_unrefreshed_data + compute_aggregates
            ≈ 0.1ms per 1000 rows (with incremental refresh)

For 50M rows/day, refresh every 5 minutes:
rows_refreshed = 50M / (24 × 60 / 5) ≈ 173K rows
refresh_time ≈ 17ms (negligible, runs in background)
```

---

## Deployment Checklist

### Week 1: Schema Design
- [ ] Document all time-series tables (product_prices, events, etc.)
- [ ] Define chunk_time_interval based on daily ingest rate
- [ ] Plan continuous aggregates (daily, weekly, monthly)
- [ ] Identify segmentation columns (product_id, merchant_id, category_id)

### Week 2: Indexes & Performance
- [ ] Create composite indexes: (product_id, time DESC), (merchant_id, product_id, time DESC)
- [ ] Run ANALYZE on all hypertables
- [ ] Benchmark insert throughput (target: 100K/sec)
- [ ] Profile slow queries with EXPLAIN (ANALYZE, BUFFERS)

### Week 3: Compression & Retention
- [ ] Enable compression with proper segmentation
- [ ] Set compression policy (compress data >7 days old)
- [ ] Set retention policy (keep raw data 90 days)
- [ ] Monitor compression ratio (target: >90%)

### Week 4: Aggregates & Monitoring
- [ ] Create continuous aggregates for daily/weekly/monthly
- [ ] Set refresh policies (5-minute interval for daily)
- [ ] Verify aggregate lag (should be <5 minutes)
- [ ] Set up alerts for failed jobs/compression

### Ongoing: Operations
- [ ] Monitor disk usage (alert if >80%)
- [ ] Review slow query log weekly
- [ ] Adjust chunk_time_interval if needed
- [ ] Plan ClickHouse migration if >1B rows/day

---

**Architect's Note**: This reference card assumes modern TimescaleDB (v2.0+) with continuous aggregates and compression. For older versions, use traditional materialized views instead.
