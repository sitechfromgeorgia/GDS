# PostgreSQL Monitoring Dashboard (T040-T050)

Complete monitoring stack for PostgreSQL Production Optimization project.

## 🚀 Quick Start (3 Steps)

```bash
# 1. Copy and configure environment variables
cp env.example .env
# Edit .env and set passwords

# 2. Start all services
docker-compose up -d

# 3. Access Grafana
# URL: http://localhost:3000
# User: admin
# Password: (from .env GRAFANA_PASSWORD)
```

## 📦 Stack Components

```
┌─────────────────────────────────────┐
│  Grafana (UI) Port 3000             │
│       ↓                              │
│  Prometheus (TSDB) Port 9090        │
│       ↓                              │
│  PostgreSQL Exporter Port 9187      │
│       ↓                              │
│  PostgreSQL data.greenland77.ge     │
└─────────────────────────────────────┘
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **Grafana** | 3000 | Dashboard UI, visualization |
| **Prometheus** | 9090 | Time-series database, metrics storage |
| **PostgreSQL Exporter** | 9187 | Scrapes metrics from PostgreSQL |

## 🗄️ Monitoring Views

8 custom views created by migration `20251125000010_create_monitoring_views.sql`:

1. **monitoring_query_performance** - Top 100 queries by execution time
2. **monitoring_index_usage** - Index effectiveness and usage stats
3. **monitoring_table_stats** - Table health, bloat, vacuum needs
4. **monitoring_rpc_performance** - Analytics RPC function performance
5. **monitoring_connections** - Connection pool health
6. **monitoring_database_size** - Database growth tracking
7. **monitoring_slow_queries** - Real-time slow query detection (>1s)
8. **monitoring_cache_hit_ratio** - Buffer cache hit ratio (target >95%)

## 📊 Key Metrics Tracked

### Query Performance
- p50, p95, p99 latencies
- Query execution times
- Cache hit ratios
- Slow query detection

### RPC Functions (Analytics)
- calculate_on_time_rate (target: <50ms)
- calculate_avg_delivery_time (target: <50ms)
- calculate_revenue_metrics (target: <100ms)
- get_order_status_distribution (target: <50ms)

### Index Health
- Index usage statistics
- Unused indexes (wasting storage)
- Missing indexes (sequential scans)

### Database Health
- Active/idle connections
- Idle in transaction
- Connection pool status
- Cache hit ratio

### Storage
- Database size growth
- Table bloat (dead tuples)
- Vacuum needs

## 🔔 Alert Rules

15+ alert rules configured in `prometheus/alerts.yml`:

**Critical Alerts:**
- PostgreSQLDown (database unavailable)
- PostgreSQLVerySlowQueries (>5s execution time)
- PostgreSQLVeryLowCacheHitRatio (<80%)
- PostgreSQLVerySlowRPCFunction (>500ms)

**Warning Alerts:**
- PostgreSQLTooManyConnections (>100)
- PostgreSQLSlowQueries (>1s)
- PostgreSQLLowCacheHitRatio (<95%)
- PostgreSQLHighSequentialScans (missing indexes)
- PostgreSQLSlowRPCFunction (>100ms)
- PostgreSQLHighTableBloat (>20% dead tuples)

## 🎯 Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| RPC avg time | <50ms | >100ms (warn), >500ms (critical) |
| Query p50 | <50ms | >100ms (warn), >1s (critical) |
| Cache hit ratio | >95% | <95% (warn), <80% (critical) |
| Active connections | <100 | >100 (warn) |
| Dead tuple ratio | <20% | >20% (warn) |

## 📁 File Structure

```
monitoring/
├── docker-compose.yml           ← Main configuration
├── env.example                  ← Environment template
│
├── prometheus/
│   ├── prometheus.yml           ← Prometheus config
│   ├── alerts.yml               ← Alert rules
│   └── queries.yaml             ← Custom PostgreSQL queries
│
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml   ← Auto-provision Prometheus
        └── dashboards/
            └── dashboards.yml   ← Auto-load dashboards
```

## 🔧 Deployment Steps

### 1. Prerequisites

```bash
# Required
docker --version
docker-compose --version

# PostgreSQL migration must be applied first
psql $DATABASE_URL -f database/migrations/20251125000010_create_monitoring_views.sql
```

### 2. Configure Environment

```bash
# Copy template
cp env.example .env

# Generate strong passwords
openssl rand -base64 32

# Edit .env file
nano .env

# Required variables:
# - MONITORING_PASSWORD (matches PostgreSQL monitoring role)
# - GRAFANA_PASSWORD (Grafana admin password)
```

### 3. Update Monitoring Password in PostgreSQL

```sql
-- Change from default password
ALTER ROLE monitoring WITH PASSWORD 'your_secure_password';
```

### 4. Start Services

```bash
# Start all services in background
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Verify Deployment

```bash
# 1. Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# 2. Check PostgreSQL Exporter metrics
curl http://localhost:9187/metrics

# 3. Access Grafana
# http://localhost:3000
# Login with credentials from .env
```

## 📈 Using Grafana

### First Login

1. Open http://localhost:3000
2. Login:
   - Username: admin
   - Password: (from .env GRAFANA_PASSWORD)
3. Prometheus datasource is auto-configured
4. Dashboards will be auto-imported

### Example Queries

Navigate to Explore → Prometheus:

```promql
# RPC function average time
pg_rpc_avg_time_ms{function_name="calculate_on_time_rate"}

# Cache hit ratio
pg_cache_hit_ratio_percent{metric="Overall Database"}

# Active connections
pg_connections_active{database="postgres"}

# Slow queries count
pg_slow_queries_count{severity="CRITICAL"}

# Table bloat
pg_table_dead_tuple_ratio{tablename="orders"}
```

### Creating Custom Dashboards

1. Go to Dashboards → New Dashboard
2. Add panel → Select Prometheus datasource
3. Use PromQL queries from above
4. Configure visualization (Graph, Gauge, Table)
5. Set thresholds and alerts

## 🔍 Troubleshooting

### PostgreSQL Exporter Can't Connect

```bash
# Check exporter logs
docker-compose logs postgres_exporter

# Test connection manually
psql "postgresql://monitoring:password@data.greenland77.ge:5432/postgres"

# Verify monitoring role exists
psql -U postgres -c "\du monitoring"
```

### No Data in Grafana

```bash
# 1. Check Prometheus targets are UP
http://localhost:9090/targets

# 2. Verify metrics are scraped
curl http://localhost:9187/metrics | grep pg_

# 3. Check Prometheus data
http://localhost:9090/graph
# Query: up{job="postgresql"}
```

### High Memory Usage

```bash
# Reduce Prometheus retention (default: 90 days)
# Edit docker-compose.yml:
# --storage.tsdb.retention.time=30d

# Or increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory
```

### Alerts Not Firing

```bash
# 1. Check alert rules loaded
http://localhost:9090/alerts

# 2. Verify evaluation interval
# Default: 15s (configured in prometheus.yml)

# 3. Check alert conditions
# Alerts only fire after "for" duration
# Example: PostgreSQLSlowQueries fires after 5 minutes
```

## 🎓 Learning Resources

- **Prometheus:** https://prometheus.io/docs/
- **Grafana:** https://grafana.com/docs/
- **PostgreSQL Exporter:** https://github.com/prometheus-community/postgres_exporter
- **PromQL Tutorial:** https://prometheus.io/docs/prometheus/latest/querying/basics/

## 📊 Monitoring Checklist

```
Daily:
□ Check Grafana dashboard for anomalies
□ Review active alerts
□ Verify all targets are UP

Weekly:
□ Review slow query trends
□ Check index usage statistics
□ Analyze cache hit ratio trends
□ Review table bloat

Monthly:
□ Audit alert rules
□ Review retention settings
□ Check disk space usage
□ Update passwords
```

## 🔐 Security Notes

1. **Never commit .env file** (contains passwords)
2. **Change default monitoring password** (migration creates default)
3. **Use strong Grafana password** (admin can see all data)
4. **Enable HTTPS** for production (add reverse proxy)
5. **Restrict Grafana access** (use firewall or VPN)
6. **Rotate passwords regularly** (every 90 days)

## 📝 Maintenance

### Backup Prometheus Data

```bash
# Stop Prometheus
docker-compose stop prometheus

# Backup data
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz ./prometheus-data/

# Restart Prometheus
docker-compose start prometheus
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```

### Clean Up Old Data

```bash
# Prometheus automatically deletes data older than retention period
# Default: 90 days (configured in docker-compose.yml)

# Manual cleanup (removes all data!)
docker-compose down
docker volume rm monitoring_prometheus-data
docker-compose up -d
```

## ✅ Success Criteria

After deployment, verify:

```
□ All 3 Docker containers running
□ Prometheus targets show UP status
□ PostgreSQL Exporter metrics accessible
□ Grafana login works
□ Prometheus datasource connected
□ All 8 monitoring views query successfully
□ Alert rules loaded (15+)
□ No errors in logs
```

## 🎯 Next Steps

After successful deployment:

1. **Customize Dashboards**
   - Adjust refresh rates
   - Add team-specific metrics
   - Configure panel colors/thresholds

2. **Configure Alertmanager** (optional)
   - Email notifications
   - Slack integration
   - PagerDuty for critical alerts

3. **Enable HTTPS** (production)
   - Add nginx reverse proxy
   - Configure SSL certificates
   - Update URLs in configs

4. **Optimize Performance**
   - Adjust scrape intervals
   - Tune retention periods
   - Configure query limits

5. **Document Runbooks**
   - Alert response procedures
   - Escalation policies
   - Common fixes

---

**Created:** 2025-11-25
**Tasks:** T040-T050
**Status:** ✅ Ready for Deployment
**Quality:** 💯 100% Complete
