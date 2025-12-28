# 📊 Monitoring Dashboard Setup (T040-T050)

**Date:** 2025-11-25
**Phase:** Phase 2 - Database Optimization
**Tasks:** T040-T050 (11 tasks)
**Technology:** Grafana + Prometheus + PostgreSQL Exporter
**Status:** 🔄 **READY TO BUILD**

---

## 📋 Overview

This guide covers the complete setup of a production monitoring dashboard for the PostgreSQL optimization project. The dashboard will track all performance metrics, validate improvements, and provide real-time insights.

### **Goals:**

✅ Monitor database query performance (p50, p95, p99)
✅ Track index usage and effectiveness
✅ Monitor RLS policy performance
✅ Track WebSocket/real-time latency
✅ Monitor RPC function execution times
✅ Track connection pool metrics
✅ Alert on performance degradation
✅ Validate 100X improvement claim
✅ Generate performance reports

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Grafana    │────▶│  Prometheus  │────▶│  Exporters  │ │
│  │   (UI)       │     │   (TSDB)     │     │             │ │
│  │   Port 3000  │     │   Port 9090  │     │  - postgres │ │
│  └──────────────┘     └──────────────┘     │  - node     │ │
│                                             │  - nginx    │ │
│                                             └─────────────┘ │
│                                                   │          │
│                                                   ▼          │
│                                          ┌─────────────────┐ │
│                                          │   PostgreSQL    │ │
│                                          │ data.greenland  │ │
│                                          │     77.ge       │ │
│                                          └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Required Components

### **1. Grafana (Visualization)**
- **Version:** 10.x+
- **Port:** 3000
- **Purpose:** Dashboard visualization, alerting
- **Installation:** Docker container

### **2. Prometheus (Time-Series Database)**
- **Version:** 2.45+
- **Port:** 9090
- **Purpose:** Metrics collection, storage, querying
- **Retention:** 90 days
- **Installation:** Docker container

### **3. PostgreSQL Exporter**
- **Version:** 0.15+
- **Port:** 9187
- **Purpose:** Export PostgreSQL metrics to Prometheus
- **Installation:** Docker container

### **4. Node Exporter (Optional)**
- **Version:** 1.7+
- **Port:** 9100
- **Purpose:** System metrics (CPU, memory, disk)
- **Installation:** Docker container

---

## 🚀 Installation Steps

### **Step 1: Create Docker Compose Configuration**

Create `monitoring/docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=90d'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  postgres_exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres_exporter
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:${POSTGRES_PASSWORD}@data.greenland77.ge:5432/postgres?sslmode=disable"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    restart: unless-stopped
    depends_on:
      - prometheus

  node_exporter:
    image: prom/node-exporter:latest
    container_name: node_exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

### **Step 2: Create Prometheus Configuration**

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'postgres-optimization'
    environment: 'production'

scrape_configs:
  # PostgreSQL Database Metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']
        labels:
          instance: 'data.greenland77.ge'
          database: 'postgres'

  # System Metrics (optional)
  - job_name: 'node'
    static_configs:
      - targets: ['node_exporter:9100']
        labels:
          instance: 'postgres-server'

  # Prometheus Self-Monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### **Step 3: Create Custom Metrics View**

Create `database/create_monitoring_views.sql`:

```sql
-- ============================================================================
-- T040: Create Monitoring Views for Grafana
-- ============================================================================
-- Date: 2025-11-25
-- Purpose: Create PostgreSQL views for custom metrics export
-- Technology: PostgreSQL + pg_stat_statements
-- ============================================================================

BEGIN;

-- Enable pg_stat_statements (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- View 1: Query Performance Metrics
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_query_performance AS
SELECT
  queryid,
  substring(query, 1, 100) as query_snippet,
  calls,
  total_exec_time,
  mean_exec_time,
  min_exec_time,
  max_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 100;

COMMENT ON VIEW monitoring_query_performance IS
'T040: Top 100 queries by average execution time for Grafana monitoring';

-- ============================================================================
-- View 2: Index Usage Statistics
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  pg_relation_size(indexrelid) as index_size_bytes
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW monitoring_index_usage IS
'T041: Index usage statistics for monitoring index effectiveness';

-- ============================================================================
-- View 3: Table Statistics
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_table_stats AS
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  CASE
    WHEN n_live_tup > 0
    THEN 100.0 * n_dead_tup / n_live_tup
    ELSE 0
  END as dead_tuple_ratio,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW monitoring_table_stats IS
'T042: Table statistics for monitoring vacuum needs and table health';

-- ============================================================================
-- View 4: RPC Function Performance
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_rpc_performance AS
SELECT
  p.proname as function_name,
  pg_stat_user_functions.calls,
  pg_stat_user_functions.total_time,
  pg_stat_user_functions.self_time,
  CASE
    WHEN pg_stat_user_functions.calls > 0
    THEN pg_stat_user_functions.total_time / pg_stat_user_functions.calls
    ELSE 0
  END as avg_time_ms
FROM pg_proc p
JOIN pg_stat_user_functions ON p.oid = pg_stat_user_functions.funcid
WHERE p.proname LIKE 'calculate_%' OR p.proname LIKE 'get_order_%'
ORDER BY pg_stat_user_functions.calls DESC;

COMMENT ON VIEW monitoring_rpc_performance IS
'T043: RPC function performance metrics for analytics monitoring';

-- ============================================================================
-- View 5: Connection Statistics
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_connections AS
SELECT
  datname as database,
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
  MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) as max_idle_time_seconds
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname;

COMMENT ON VIEW monitoring_connections IS
'T044: Connection pool monitoring for PgBouncer optimization';

-- ============================================================================
-- View 6: Database Size Metrics
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_database_size AS
SELECT
  datname as database,
  pg_size_pretty(pg_database_size(datname)) as size_pretty,
  pg_database_size(datname) as size_bytes,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public') as table_count,
  (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE schemaname = 'public') as index_count
FROM pg_database
WHERE datname = current_database();

COMMENT ON VIEW monitoring_database_size IS
'T045: Database size growth tracking';

-- ============================================================================
-- View 7: Slow Queries (Real-time)
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_slow_queries AS
SELECT
  pid,
  usename as username,
  application_name,
  client_addr,
  state,
  EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_seconds,
  substring(query, 1, 200) as query_snippet,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
  AND EXTRACT(EPOCH FROM (NOW() - query_start)) > 1
ORDER BY query_start ASC;

COMMENT ON VIEW monitoring_slow_queries IS
'T046: Real-time slow query detection (>1 second)';

-- ============================================================================
-- View 8: Cache Hit Ratio
-- ============================================================================
CREATE OR REPLACE VIEW monitoring_cache_hit_ratio AS
SELECT
  'Overall' as metric,
  SUM(heap_blks_read) as heap_read,
  SUM(heap_blks_hit) as heap_hit,
  CASE
    WHEN SUM(heap_blks_hit) + SUM(heap_blks_read) > 0
    THEN 100.0 * SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read))
    ELSE 0
  END as cache_hit_ratio
FROM pg_statio_user_tables
UNION ALL
SELECT
  tablename as metric,
  heap_blks_read,
  heap_blks_hit,
  CASE
    WHEN heap_blks_hit + heap_blks_read > 0
    THEN 100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read)
    ELSE 0
  END as cache_hit_ratio
FROM pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY heap_blks_read + heap_blks_hit DESC;

COMMENT ON VIEW monitoring_cache_hit_ratio IS
'T047: Buffer cache hit ratio monitoring (target: >95%)';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant SELECT to monitoring role (create if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'monitoring') THEN
    CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_password';
  END IF;
END$$;

GRANT CONNECT ON DATABASE postgres TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
GRANT SELECT ON monitoring_query_performance TO monitoring;
GRANT SELECT ON monitoring_index_usage TO monitoring;
GRANT SELECT ON monitoring_table_stats TO monitoring;
GRANT SELECT ON monitoring_rpc_performance TO monitoring;
GRANT SELECT ON monitoring_connections TO monitoring;
GRANT SELECT ON monitoring_database_size TO monitoring;
GRANT SELECT ON monitoring_slow_queries TO monitoring;
GRANT SELECT ON monitoring_cache_hit_ratio TO monitoring;

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

-- Test all views
SELECT 'monitoring_query_performance' as view_name, COUNT(*) as row_count FROM monitoring_query_performance
UNION ALL
SELECT 'monitoring_index_usage', COUNT(*) FROM monitoring_index_usage
UNION ALL
SELECT 'monitoring_table_stats', COUNT(*) FROM monitoring_table_stats
UNION ALL
SELECT 'monitoring_rpc_performance', COUNT(*) FROM monitoring_rpc_performance
UNION ALL
SELECT 'monitoring_connections', COUNT(*) FROM monitoring_connections
UNION ALL
SELECT 'monitoring_database_size', COUNT(*) FROM monitoring_database_size
UNION ALL
SELECT 'monitoring_slow_queries', COUNT(*) FROM monitoring_slow_queries
UNION ALL
SELECT 'monitoring_cache_hit_ratio', COUNT(*) FROM monitoring_cache_hit_ratio;
```

### **Step 4: Start Monitoring Stack**

```bash
cd monitoring

# Create .env file
cat > .env << EOF
POSTGRES_PASSWORD=your_postgres_password
GRAFANA_PASSWORD=your_grafana_password
EOF

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

### **Step 5: Configure Grafana**

1. **Access Grafana:** http://localhost:3000
2. **Login:** admin / [GRAFANA_PASSWORD]
3. **Add Prometheus Data Source:**
   - URL: http://prometheus:9090
   - Access: Server (default)
   - Save & Test

### **Step 6: Import Dashboard Templates**

Create `monitoring/grafana/provisioning/dashboards/postgres-optimization.json`:

```json
{
  "dashboard": {
    "title": "PostgreSQL Optimization Monitoring",
    "panels": [
      {
        "id": 1,
        "title": "Query Performance (p50, p95, p99)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, pg_stat_statements_mean_exec_time_seconds_bucket)",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, pg_stat_statements_mean_exec_time_seconds_bucket)",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, pg_stat_statements_mean_exec_time_seconds_bucket)",
            "legendFormat": "p99"
          }
        ]
      },
      {
        "id": 2,
        "title": "Index Usage",
        "type": "table",
        "targets": [
          {
            "expr": "pg_stat_user_indexes_idx_scan",
            "format": "table"
          }
        ]
      },
      {
        "id": 3,
        "title": "RPC Function Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_user_functions_total_time_seconds{funcname=~\"calculate_.*\"}",
            "legendFormat": "{{funcname}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "Cache Hit Ratio",
        "type": "gauge",
        "targets": [
          {
            "expr": "pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 80, "color": "yellow" },
                { "value": 95, "color": "green" }
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "id": 5,
        "title": "Active Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "id": 6,
        "title": "Database Size Growth",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_database_size_bytes",
            "legendFormat": "Database Size"
          }
        ]
      }
    ]
  }
}
```

---

## 📊 Key Metrics to Monitor

### **1. Query Performance (T040)**

| Metric | Target | Alert If |
|--------|--------|----------|
| Driver query p95 | <15ms | >50ms |
| Product catalog p95 | <15ms | >50ms |
| Product search p95 | <75ms | >200ms |
| Analytics RPC p95 | <150ms | >500ms |

### **2. Index Usage (T041)**

| Metric | Target | Alert If |
|--------|--------|----------|
| idx_orders_driver_id scans | >1000/day | <100/day |
| idx_products_search_vector scans | >500/day | <50/day |
| idx_orders_active scans | >2000/day | <200/day |

### **3. RPC Function Performance (T043)**

| Function | Target Avg | Alert If |
|----------|------------|----------|
| calculate_on_time_rate | <50ms | >100ms |
| calculate_avg_delivery_time | <50ms | >100ms |
| calculate_revenue_metrics | <100ms | >200ms |

### **4. Cache Hit Ratio (T047)**

| Metric | Target | Alert If |
|--------|--------|----------|
| Overall cache hit ratio | >95% | <80% |
| Orders table cache hit | >98% | <85% |
| Products table cache hit | >98% | <85% |

### **5. Connection Pool (T044)**

| Metric | Target | Alert If |
|--------|--------|----------|
| Active connections | 10-50 | >100 |
| Idle in transaction | <5 | >10 |
| Max idle time | <30s | >300s |

---

## 🚨 Alert Rules

Create `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: postgres_alerts
    interval: 30s
    rules:
      # Query Performance Alerts
      - alert: SlowQueries
        expr: pg_stat_statements_mean_exec_time_seconds > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries detected"
          description: "Query {{ $labels.queryid }} is taking {{ $value }}s on average"

      # Index Usage Alerts
      - alert: IndexNotUsed
        expr: rate(pg_stat_user_indexes_idx_scan[1h]) < 0.01
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Index {{ $labels.indexname }} not being used"

      # Cache Hit Ratio Alert
      - alert: LowCacheHitRatio
        expr: (pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)) * 100 < 80
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Low cache hit ratio: {{ $value }}%"

      # Connection Pool Alert
      - alert: TooManyConnections
        expr: pg_stat_database_numbackends > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Too many connections: {{ $value }}"

      # Dead Tuples Alert
      - alert: HighDeadTupleRatio
        expr: (pg_stat_user_tables_n_dead_tup / pg_stat_user_tables_n_live_tup) * 100 > 20
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High dead tuple ratio in {{ $labels.tablename }}: {{ $value }}%"
```

---

## ✅ Validation Tests

After setup, run these tests to verify monitoring is working:

```bash
# Test 1: Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# Test 2: Check PostgreSQL exporter
curl http://localhost:9187/metrics | grep pg_stat

# Test 3: Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=pg_up'

# Test 4: Check Grafana
curl http://localhost:3000/api/health
```

---

## 📈 Performance Baseline

Run this after deployment to establish baseline metrics:

```sql
-- Get current performance metrics
SELECT
  'Query Performance' as metric_category,
  (SELECT AVG(mean_exec_time) FROM monitoring_query_performance) as avg_value,
  'ms' as unit
UNION ALL
SELECT
  'Cache Hit Ratio',
  (SELECT cache_hit_ratio FROM monitoring_cache_hit_ratio WHERE metric = 'Overall'),
  '%'
UNION ALL
SELECT
  'Active Connections',
  (SELECT active_connections FROM monitoring_connections WHERE database = 'postgres'),
  'connections'
UNION ALL
SELECT
  'Index Scans/Day',
  (SELECT SUM(idx_scan) FROM monitoring_index_usage),
  'scans';
```

---

## 🎯 Success Criteria

### **Setup Complete:**

```
✓ Prometheus running and collecting metrics
✓ PostgreSQL exporter connected
✓ Grafana dashboards created
✓ All 8 monitoring views created
✓ Alert rules configured
✓ Baseline metrics established
```

### **Monitoring Active:**

```
✓ Query performance tracked (p50, p95, p99)
✓ Index usage monitored
✓ RPC function performance tracked
✓ Cache hit ratio >95%
✓ Connection pool healthy
✓ Alerts firing correctly
```

---

## 📝 Maintenance Tasks

### **Daily:**
- Check alert status
- Review slow query log
- Verify cache hit ratio >95%

### **Weekly:**
- Review index usage statistics
- Analyze RPC function performance
- Check dead tuple ratios
- Review connection pool metrics

### **Monthly:**
- Generate performance comparison report
- Update baseline metrics
- Optimize underutilized indexes
- Review alert thresholds

---

**Setup Time:** 2-3 hours
**Maintenance:** 30 minutes/week
**Status:** Ready to deploy after database optimizations

**Next:** Deploy database optimizations, then build monitoring dashboard! 🚀
