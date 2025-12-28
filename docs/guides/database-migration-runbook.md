# Database Migration Runbook

## Overview

This document provides a comprehensive guide for migrating the Georgian Distribution System database from supabase.com (cloud) to the self-hosted Supabase instance on the VPS at data.greenland77.ge.

**Migration Scope:**
- PostgreSQL database migration
- Row Level Security (RLS) policies
- Storage bucket configuration
- Application data integrity

**Estimated Time:** 2-4 hours (depending on data volume)
**Downtime Required:** 1-2 hours (minimal application downtime)

## Prerequisites

### Environment Setup

Ensure the following environment variables are configured:

```bash
# Cloud Supabase (source)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Self-hosted Supabase (target)
export SELF_HOSTED_DB_HOST="data.greenland77.ge"
export SELF_HOSTED_DB_NAME="postgres"
export SELF_HOSTED_DB_USER="postgres"
export SELF_HOSTED_DB_PASSWORD="your-self-hosted-password"

# Optional backup control
export BACKUP_BEFORE_IMPORT="true"
```

### Required Tools

- PostgreSQL client tools (pg_dump, psql)
- Bash shell environment
- Database access to both environments
- File system access for temporary storage

### Permissions Required

- **Cloud Supabase:** Service role key with full database access
- **Self-hosted Supabase:** PostgreSQL superuser access
- **File System:** Write access to migration export directory

## Pre-Migration Checklist

### 1. System Preparation

- [ ] **Backup Current Production Data**
  ```bash
  # Create full backup of current database
  pg_dump --host ${SUPABASE_URL#https://} --username postgres --database postgres \
    --verbose --clean --create > production_backup_$(date +%Y%m%d).sql
  ```

- [ ] **Verify Self-Hosted Supabase is Running**
  ```bash
  # Test connection to self-hosted database
  pg_isready -h data.greenland77.ge -p 5432 -U postgres -d postgres
  ```

- [ ] **Check Available Disk Space**
  - Ensure self-hosted server has sufficient disk space (2x current database size)
  - Verify export directory has write permissions

- [ ] **Notify Stakeholders**
  - Inform users of planned maintenance window
  - Prepare status page updates
  - Schedule communication to restaurant partners

### 2. Application State

- [ ] **Set Application to Maintenance Mode**
  ```bash
  # Update application configuration
  # frontend/.env.production -> maintenance=true
  ```

- [ ] **Disable Active User Sessions**
  - Implement session timeout for active users
  - Prepare notification messages for users

- [ ] **Stop Background Jobs**
  - Suspend scheduled tasks
  - Pause analytics data collection

### 3. Data Verification

- [ ] **Document Current Table Counts**
  ```bash
  # Run against cloud Supabase
  psql --host ${SUPABASE_URL#https://} -U postgres -d postgres -c "
    SELECT 
      'profiles' as table_name, COUNT(*) FROM public.profiles
    UNION ALL
    SELECT 
      'products', COUNT(*) FROM public.products
    UNION ALL
    SELECT 
      'orders', COUNT(*) FROM public.orders
    UNION ALL
    SELECT 
      'order_items', COUNT(*) FROM public.order_items
    UNION ALL
    SELECT 
      'notifications', COUNT(*) FROM public.notifications
    UNION ALL
    SELECT 
      'demo_sessions', COUNT(*) FROM public.demo_sessions
    ORDER BY table_name;
  "
  ```

- [ ] **Check for Critical Business Data**
  - Verify all pending orders are in expected state
  - Confirm user roles are properly configured
  - Review product catalog completeness

### 4. Documentation and Logs

- [ ] **Prepare Migration Log Directory**
  ```bash
  mkdir -p database/migration-tools/exports
  ```

- [ ] **Document Current Application URLs**
  - Frontend: https://greenland77.ge
  - Backend: https://data.greenland77.ge
  - Current cloud URL: https://your-project.supabase.co

## Migration Process

### Step 1: Export from Cloud Supabase

**Duration:** 30-60 minutes

1. **Run Export Script**
   ```bash
   cd database/migration-tools
   chmod +x export-from-cloud.sh
   ./export-from-cloud.sh
   ```

2. **Verify Export Completion**
   ```bash
   # Check for generated files
   ls -la exports/
   
   # Expected files:
   # - schema_TIMESTAMP.sql
   # - data_TIMESTAMP.sql
   # - rls_policies_TIMESTAMP.sql
   # - rls_policies_script_TIMESTAMP.sql
   # - storage_config_TIMESTAMP.sql
   # - migration_summary_TIMESTAMP.txt
   # - migration_log_TIMESTAMP.log
   ```

3. **Review Export Summary**
   ```bash
   cat exports/migration_summary_TIMESTAMP.txt
   ```

4. **Validate Export Integrity**
   ```bash
   # Check schema file size (should be non-empty)
   wc -l exports/schema_TIMESTAMP.sql
   
   # Check data file size
   wc -l exports/data_TIMESTAMP.sql
   
   # Verify no errors in log
   grep -i error exports/migration_log_TIMESTAMP.log
   ```

**Rollback Point:** If export fails, restart from Step 1 with corrected environment variables.

### Step 2: Import to Self-Hosted Supabase

**Duration:** 30-90 minutes

1. **Run Dry Run First (Recommended)**
   ```bash
   ./import-to-selfhosted.sh --dry-run
   ```

2. **Full Import**
   ```bash
   # For initial migration (no existing data)
   ./import-to-selfhosted.sh
   
   # For partial import (skip schema if tables exist)
   ./import-to-selfhosted.sh --skip-schema
   
   # For force import (overwrite existing data)
   ./import-to-selfhosted.sh --force
   ```

3. **Monitor Import Progress**
   ```bash
   # Watch import log in real-time
   tail -f exports/import_log_TIMESTAMP.log
   ```

4. **Verify Import Success**
   ```bash
   # Check import summary
   cat exports/import_summary_TIMESTAMP.txt
   
   # Verify database connectivity
   pg_isready -h data.greenland77.ge -p 5432 -U postgres -d postgres
   ```

**Rollback Point:** If import fails:
1. Restore from backup (if BACKUP_BEFORE_IMPORT was enabled)
2. Re-run export with corrected parameters
3. Attempt import again

### Step 3: Verify Migration Integrity

**Duration:** 15-30 minutes

1. **Run Verification Script**
   ```bash
   ./verify-migration.sh
   ```

2. **Review Verification Report**
   ```bash
   cat exports/verification_report_TIMESTAMP.txt
   ```

3. **Run Detailed Verification (if needed)**
   ```bash
   ./verify-migration.sh --detailed --verbose
   ```

4. **Critical Verification Checks**
   - [ ] Table counts match source
   - [ ] Row counts are consistent
   - [ ] RLS policies are active
   - [ ] Foreign key constraints are valid
   - [ ] Business logic validation passes
   - [ ] Performance indexes are present

**Rollback Point:** If verification fails:
1. Review failed checks in detail
2. Compare with source database
3. Fix identified issues
4. Re-run verification

## Post-Migration Verification

### 1. Database Connectivity Test

```bash
# Test basic connectivity
psql -h data.greenland77.ge -U postgres -d postgres -c "SELECT version();"

# Test table access
psql -h data.greenland77.ge -U postgres -d postgres -c "
  SELECT COUNT(*) as table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
"
```

### 2. Application Configuration Update

1. **Update Frontend Environment Variables**
   ```bash
   # Update frontend/.env.production
   NEXT_PUBLIC_SUPABASE_URL="https://data.greenland77.ge"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[update with self-hosted anon key]"
   ```

2. **Test Environment Configuration**
   ```bash
   # Verify new environment works
   cd frontend && npm run build
   
   # Test in development
   npm run dev
   ```

### 3. Functional Testing

1. **Authentication Testing**
   - [ ] User login works
   - [ ] Role-based access control functions
   - [ ] Session management operates correctly

2. **Core Functionality Testing**
   - [ ] Order creation and management
   - [ ] Product catalog access
   - [ ] User profile management
   - [ ] Notification system
   - [ ] Demo mode functionality

3. **Real-time Features Testing**
   - [ ] Order status updates
   - [ ] Live notifications
   - [ ] Driver assignment updates

### 4. Performance Validation

```bash
# Run database performance checks
./verify-migration.sh --critical-only

# Test application response times
curl -w "@curl-format.txt" -s -o /dev/null https://greenland77.ge

# Monitor database connections
psql -h data.greenland77.ge -U postgres -d postgres -c "
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE state = 'active';
"
```

## Rollback Procedures

### Scenario 1: Migration Fails During Import

**Immediate Actions:**
1. **Stop Migration Process**
   ```bash
   # Kill any running migration processes
   pkill -f import-to-selfhosted.sh
   ```

2. **Restore from Backup (if available)**
   ```bash
   # Restore self-hosted database from backup
   psql -h data.greenland77.ge -U postgres -d postgres < exports/backup_before_import_TIMESTAMP.sql
   ```

3. **Verify Rollback**
   ```bash
   # Confirm database is restored to pre-migration state
   psql -h data.greenland77.ge -U postgres -d postgres -c "SELECT COUNT(*) FROM public.orders;"
   ```

### Scenario 2: Application Issues After Migration

**Short-term Rollback:**
1. **Revert Frontend Configuration**
   ```bash
   # Restore previous environment variables
   NEXT_PUBLIC_SUPABASE_URL="[previous-cloud-url]"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[previous-anon-key]"
   ```

2. **Restart Application**
   ```bash
   # Redeploy frontend with previous configuration
   npm run build
   npm run start
   ```

### Scenario 3: Data Integrity Issues

**Recovery Actions:**
1. **Identify Failed Tables**
   ```bash
   # Run verification with detailed output
   ./verify-migration.sh --detailed
   ```

2. **Selective Data Recovery**
   ```bash
   # Re-import only problematic tables
   ./import-to-selfhosted.sh --skip-schema --skip-rls
   ```

3. **Manual Data Fixes**
   ```bash
   # Use psql to fix specific data issues
   psql -h data.greenland77.ge -U postgres -d postgres
   ```

## Monitoring and Validation

### Success Criteria

- [ ] **Data Integrity**: All data successfully migrated with matching counts
- [ ] **Functionality**: All application features work as expected
- [ ] **Performance**: Database and application performance meet baseline
- [ ] **Security**: RLS policies and user permissions function correctly
- [ ] **Real-time**: WebSocket connections and notifications work

### Post-Migration Monitoring (24-48 hours)

1. **System Monitoring**
   - Database connection stability
   - Application error rates
   - User session management
   - Real-time feature functionality

2. **Business Monitoring**
   - Order processing accuracy
   - User role functionality
   - Notification delivery
   - Analytics data collection

3. **Performance Monitoring**
   - Database query performance
   - Application response times
   - Memory and CPU utilization
   - Disk space usage

### Cleanup Actions

After successful migration (24-48 hours post-migration):

1. **Remove Cloud Data (if required)**
   ```bash
   # Archive important cloud data before deletion
   # Coordinate with Supabase support for data deletion
   ```

2. **Update Documentation**
   - Update environment URLs
   - Revise deployment procedures
   - Update monitoring configurations

3. **Retire Migration Tools**
   - Archive migration scripts
   - Update system architecture documentation
   - Revise disaster recovery procedures

## Emergency Contacts

### System Administrators
- **Primary**: System Administrator
- **Secondary**: Database Administrator
- **Escalation**: DevOps Team Lead

### External Support
- **Supabase Support**: For self-hosted issues
- **VPS Provider**: For infrastructure problems
- **Application Support**: For frontend issues

### Business Stakeholders
- **Restaurant Partners**: For user impact coordination
- **End Users**: For system status communication
- **Management**: For strategic decisions

## Additional Resources

### Migration Scripts
- **Export Script**: `database/migration-tools/export-from-cloud.sh`
- **Import Script**: `database/migration-tools/import-to-selfhosted.sh`
- **Verification Script**: `database/migration-tools/verify-migration.sh`

**Next Review**: After migration completion  
**Approved By**: System Administrator

This runbook should be reviewed and updated after each migration to incorporate lessons learned and system changes.