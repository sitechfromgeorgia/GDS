# PgBouncer Setup Guide

## Overview

PgBouncer is a lightweight connection pooler for PostgreSQL. This setup achieves **5X connection efficiency** by pooling client connections.

**Benefits:**
- Reduces connections from 500 → 100 (5X improvement)
- Faster connection establishment (connection reuse)
- Better query throughput (reduced overhead)
- Graceful handling of connection spikes

## Quick Start

### 1. Generate User Authentication File

PgBouncer requires an authentication file (`userlist.txt`) with MD5-hashed passwords.

```bash
# Format: "username" "md5<hash>"
# Where hash = MD5(password + username)

# Example for postgres user:
# If password is "mypassword" and username is "postgres"
echo -n "mypasswordpostgres" | md5sum
# Output: d8578edf8458ce06fbc5bb76a58c5ca4

# Create userlist.txt
echo '"postgres" "md5d8578edf8458ce06fbc5bb76a58c5ca4"' > userlist.txt
```

**Helper script** (save as `generate-userlist.sh`):

```bash
#!/bin/bash
# Usage: ./generate-userlist.sh <username> <password>

USERNAME=$1
PASSWORD=$2

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <username> <password>"
  exit 1
fi

# Generate MD5 hash
HASH=$(echo -n "${PASSWORD}${USERNAME}" | md5sum | cut -d' ' -f1)

# Create userlist.txt
echo "\"${USERNAME}\" \"md5${HASH}\"" > userlist.txt

echo "Created userlist.txt for user: $USERNAME"
cat userlist.txt
```

### 2. Configure Environment Variables

Create a `.env` file in this directory:

```bash
# Production database
DATABASE_URL=postgres://postgres:your_password@data.greenland77.ge:5432/postgres

# Or use individual variables
DB_HOST=data.greenland77.ge
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Start PgBouncer

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f pgbouncer

# Check health
docker-compose ps
```

### 4. Verify Connection

```bash
# Connect to PgBouncer admin database
psql -h localhost -p 6432 -U postgres pgbouncer

# View pool statistics
SHOW POOLS;
SHOW STATS;
SHOW DATABASES;
```

### 5. Update Application Connection String

**Before (direct PostgreSQL):**
```
postgres://user:password@data.greenland77.ge:5432/postgres
```

**After (via PgBouncer):**
```
postgres://user:password@localhost:6432/production
```

## Configuration Details

### Pool Mode: Transaction

**Best for:** Stateless web applications (like Next.js + Supabase)

**How it works:**
- Client connects → Gets server connection from pool
- Transaction completes → Server connection returns to pool
- Next client → Reuses same server connection

**Result:** 4:1 pooling ratio (100 clients → 25 server connections)

### Pool Sizing

```ini
default_pool_size = 20       # Target server connections per database
reserve_pool_size = 5        # Extra connections during bursts
max_client_conn = 100        # Maximum client connections allowed
```

**Calculation:**
- Normal load: 20 server connections handle 80 clients (4:1 ratio)
- Peak load: 25 server connections handle 100 clients
- Connection efficiency: **5X improvement** vs direct connections

### Timeouts

```ini
server_idle_timeout = 600    # Close idle connections after 10 min
server_lifetime = 3600       # Recycle connections after 1 hour
query_timeout = 120          # Kill queries after 2 minutes
```

## Monitoring

### View Pool Status

```sql
-- Connect to PgBouncer admin database
psql -h localhost -p 6432 -U postgres pgbouncer

-- Check pool status
SHOW POOLS;

-- Expected output:
--  database   | user     | cl_active | cl_waiting | sv_active | sv_idle | sv_used
-- ------------+----------+-----------+------------+-----------+---------+---------
--  production | postgres |        15 |          0 |         8 |       2 |      10

-- cl_active: Active client connections
-- sv_active: Active server connections
-- sv_idle: Idle server connections available for reuse
```

### View Statistics

```sql
SHOW STATS;

-- Expected output:
--  database   | total_xact_count | total_query_count | total_received | total_sent
-- ------------+------------------+-------------------+----------------+------------
--  production |           15234  |            15234  |     1234567890 |  987654321
```

### View Connections

```sql
SHOW CLIENTS;  -- Client connections
SHOW SERVERS;  -- Server connections
```

### Reload Configuration

```sql
-- After editing pgbouncer.ini
RELOAD;

-- View current configuration
SHOW CONFIG;
```

## Troubleshooting

### Connection Refused

```bash
# Check if PgBouncer is running
docker-compose ps

# Check logs
docker-compose logs pgbouncer

# Verify port is listening
netstat -an | grep 6432
```

### Authentication Failures

```bash
# Verify userlist.txt format
cat userlist.txt

# Should be: "username" "md5<hash>"
# Example: "postgres" "md5d8578edf8458ce06fbc5bb76a58c5ca4"

# Regenerate if needed
./generate-userlist.sh postgres mypassword
```

### Pool Exhausted (Waiting Clients)

```sql
-- Check pool status
SHOW POOLS;

-- If cl_waiting > 0, increase pool size in pgbouncer.ini:
-- default_pool_size = 30  (was 20)
-- reserve_pool_size = 10  (was 5)

-- Then reload
RELOAD;
```

### Slow Queries

```sql
-- Check for long-running queries
SHOW CLIENTS;

-- Kill stuck client (if needed)
KILL <client_id>;
```

## Performance Validation

### Before PgBouncer

```sql
-- Direct PostgreSQL connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
-- Typically: 100-500 connections
```

### After PgBouncer

```sql
-- Server connections (via PgBouncer admin)
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS"
-- Expected: 20-25 server connections
```

### Success Criteria

✅ Client connections: 100
✅ Server connections: 20-25
✅ **Connection efficiency: 5X** (100 clients → 20 servers)
✅ Query latency: No degradation (<100ms p95)
✅ Connection wait time: <100ms

## Production Deployment

### 1. Test in Development First

```bash
# Start with development database
DATABASE_URL=postgres://...@db.akxmacfsltzhbnunoepb.supabase.co:5432/postgres

docker-compose up -d

# Run load test
k6 run ../../scripts/load-tests/baseline-test.js --env BASE_URL=http://localhost:3000
```

### 2. Deploy to Production

```bash
# Update to production database
DATABASE_URL=postgres://...@data.greenland77.ge:5432/postgres

# Deploy during low-traffic window (2am-4am UTC)
docker-compose up -d

# Monitor for 30 minutes
docker-compose logs -f pgbouncer

# Check pool stats every 5 minutes
watch -n 300 'psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS"'
```

### 3. Update Application

```typescript
// frontend/src/lib/supabase/server.ts

// Before:
const supabase = createClient(
  'https://data.greenland77.ge',
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
  }
)

// After (via PgBouncer):
const supabase = createClient(
  'https://data.greenland77.ge',  // Still use same Supabase URL
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
      // PgBouncer runs on same VPS, internal connection
    },
    auth: {
      persistSession: false,
    },
  }
)

// Note: Supabase handles internal routing to PgBouncer
```

### 4. Rollback Plan

```bash
# If issues occur, rollback immediately:
docker-compose down

# Application will connect directly to PostgreSQL
# No code changes needed
```

## Resources

- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [PgBouncer Features](https://www.pgbouncer.org/features.html)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)

## Next Steps

After PgBouncer is deployed:

1. ✅ Phase 2: Create database indexes (T007-T009)
2. ✅ Phase 2: Optimize queries (T013-T018)
3. ✅ Phase 2: Set up monitoring dashboard (T040-T050)
