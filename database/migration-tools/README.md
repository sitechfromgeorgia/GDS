# Database Migration Tools

This directory contains comprehensive migration utilities for transitioning the Georgian Distribution System from supabase.com (cloud) to self-hosted Supabase on the VPS at data.greenland77.ge.

## Quick Start

### Prerequisites
- PostgreSQL client tools (pg_dump, psql)
- Bash shell environment
- Access to both cloud and self-hosted Supabase instances
- Required environment variables configured

### Basic Migration Workflow

1. **Export from Cloud Supabase:**
   ```bash
   ./export-from-cloud.sh
   ```

2. **Import to Self-Hosted Supabase:**
   ```bash
   ./import-to-selfhosted.sh
   ```

3. **Verify Migration Integrity:**
   ```bash
   ./verify-migration.sh
   ```

4. **Test Migration (Optional):**
   ```bash
   ./test-migration-procedure.sh
   ```

## Available Scripts

### export-from-cloud.sh
Exports database schema, data, and configuration from cloud Supabase.

**Features:**
- Comprehensive schema export
- Selective data migration for core tables
- RLS policy extraction
- Storage configuration backup
- Automated logging and validation

**Usage:**
```bash
./export-from-cloud.sh
```

### import-to-selfhosted.sh
Imports exported data into self-hosted Supabase with integrity checks.

**Features:**
- Transaction-safe imports
- Foreign key validation
- RLS policy restoration
- Backup before import option
- Dry-run capability

**Usage:**
```bash
./import-to-selfhosted.sh          # Standard import
./import-to-selfhosted.sh --dry-run # Preview without executing
./import-to-selfhosted.sh --force   # Overwrite existing data
```

### verify-migration.sh
Validates migration integrity and generates comprehensive reports.

**Features:**
- Table and row count verification
- Foreign key constraint validation
- Business logic validation
- Performance benchmarking
- Detailed reporting

**Usage:**
```bash
./verify-migration.sh              # Standard verification
./verify-migration.sh --detailed   # Comprehensive report
./verify-migration.sh --critical-only # Quick validation
```

### test-migration-procedure.sh
Tests migration process using non-production data.

**Features:**
- Isolated test database creation
- End-to-end migration testing
- Performance benchmarking
- Production readiness validation

**Usage:**
```bash
./test-migration-procedure.sh         # Dry-run test
./test-migration-procedure.sh --live  # Actual test migration
```

## Environment Variables

### Required Variables

```bash
# Cloud Supabase (Source)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Self-hosted Supabase (Target)
export SELF_HOSTED_DB_HOST="data.greenland77.ge"
export SELF_HOSTED_DB_NAME="postgres"
export SELF_HOSTED_DB_USER="postgres"
export SELF_HOSTED_DB_PASSWORD="your-password"
```

### Optional Variables

```bash
export BACKUP_BEFORE_IMPORT="true"     # Create backup before import
export VERBOSE_LOGGING="true"          # Enable detailed logging
export EXPORT_DIR="/custom/export/path" # Custom export directory
```

## Migration Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Pre-Migration | 30 min | Environment setup, backup creation |
| Export | 30-60 min | Data extraction from cloud Supabase |
| Import | 30-90 min | Data loading into self-hosted Supabase |
| Verification | 15-30 min | Migration integrity validation |
| **Total** | **1-3 hours** | Complete migration process |

## Safety Features

### Backup and Rollback
- Automatic backup before import operations
- Multiple rollback points throughout the process
- Detailed logging for audit trails

### Validation Layers
- Export integrity verification
- Import transaction safety
- Post-migration data validation
- Business logic constraint checks

### Error Handling
- Comprehensive error detection
- Graceful failure with detailed messages
- Automatic rollback on critical errors
- Recovery procedures documented

## Troubleshooting

### Common Issues

**Connection Failures:**
```bash
# Test database connectivity
pg_isready -h data.greenland77.ge -p 5432 -U postgres -d postgres
```

**Permission Errors:**
```bash
# Verify database permissions
psql -h data.greenland77.ge -U postgres -d postgres -c "SELECT current_user;"
```

**Export Failures:**
```bash
# Check cloud Supabase connection
pg_isready -h your-project.supabase.co -p 5432 -U postgres -d postgres
```

### Log Files
All operations generate detailed logs in the `exports/` directory:
- `migration_log_TIMESTAMP.log` - Export operations
- `import_log_TIMESTAMP.log` - Import operations
- `verify_log_TIMESTAMP.log` - Verification results

### Getting Help
1. Review migration runbook: `docs/database-migration-runbook.md`
2. Check log files for specific error messages
3. Verify environment variables are correctly set
4. Test connectivity to both databases

## Production Deployment

### Before Production Migration
1. **Execute test migration** using test-migration-procedure.sh
2. **Schedule maintenance window** (1-3 hours recommended)
3. **Notify stakeholders** of planned downtime
4. **Verify backup procedures** are in place

### During Migration
1. **Follow migration runbook** procedures exactly
2. **Monitor logs** for errors or warnings
3. **Validate each phase** before proceeding
4. **Maintain communication** with stakeholders

### After Migration
1. **Run comprehensive verification** using verify-migration.sh
2. **Update application configuration** to use new database
3. **Test all critical functionality** end-to-end
4. **Monitor system performance** for 48 hours

## Support and Maintenance

### Regular Maintenance
- **Weekly:** Review log files and system performance
- **Monthly:** Test backup and recovery procedures
- **Quarterly:** Update migration scripts if needed

### Emergency Contacts
- **System Administrator:** Primary contact for migration issues
- **Database Administrator:** For database-specific problems
- **DevOps Team:** For infrastructure and deployment issues

### Documentation Updates
- Migration runbook should be updated after each migration
- This README should be updated when scripts are modified
- Memory bank context should reflect current migration status

---

**Created:** October 31, 2025  
**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** October 31, 2025