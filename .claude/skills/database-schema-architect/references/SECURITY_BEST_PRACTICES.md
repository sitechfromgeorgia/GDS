# Database Security Best Practices

## Overview
This guide covers comprehensive database security patterns including Row-Level Security (RLS), audit logging, encryption, access control, and compliance requirements.

---

## Row-Level Security (RLS)

### What is RLS?
Row-Level Security automatically filters database rows based on user context, providing data isolation without application logic.

**Supported by**: PostgreSQL, Oracle, SQL Server (always encrypted), some NoSQL databases

### Basic RLS Implementation (PostgreSQL)

**Step 1: Enable RLS on Table**
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

**Step 2: Create Policies**
```sql
-- Policy: Users see only their own orders
CREATE POLICY orders_select_policy ON orders
    FOR SELECT
    USING (customer_id = current_setting('app.current_user_id')::INTEGER);

-- Policy: Users can insert only their own orders
CREATE POLICY orders_insert_policy ON orders
    FOR INSERT
    WITH CHECK (customer_id = current_setting('app.current_user_id')::INTEGER);

-- Policy: Users can update only their own orders
CREATE POLICY orders_update_policy ON orders
    FOR UPDATE
    USING (customer_id = current_setting('app.current_user_id')::INTEGER);
```

**Step 3: Set User Context (from application)**
```sql
-- Set the current user ID for the session
SET LOCAL app.current_user_id = '12345';

-- Now all queries respect RLS
SELECT * FROM orders;  -- Returns only orders for user 12345
```

### Multi-Tenant RLS Pattern

**Complete Example: SaaS with Organization Isolation**

```sql
-- Tenants table
CREATE TABLE organizations (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(org_id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL  -- 'admin', 'user', 'viewer'
);

-- Projects table (multi-tenant)
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(org_id),
    name VARCHAR(200) NOT NULL,
    created_by INTEGER REFERENCES users(user_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only projects from their organization
CREATE POLICY projects_tenant_isolation ON projects
    FOR ALL
    USING (org_id = current_setting('app.current_org_id')::INTEGER);

-- Policy: Allow organization admins full access
CREATE POLICY projects_admin_access ON projects
    FOR ALL
    USING (
        org_id = current_setting('app.current_org_id')::INTEGER
        AND current_setting('app.user_role') = 'admin'
    );
```

### RLS with Different Permissions

```sql
-- Separate policies for different operations
CREATE POLICY projects_read ON projects
    FOR SELECT
    USING (
        org_id = current_setting('app.current_org_id')::INTEGER
        AND (
            -- User is in org
            current_setting('app.user_role') IN ('admin', 'user', 'viewer')
        )
    );

CREATE POLICY projects_write ON projects
    FOR INSERT
    WITH CHECK (
        org_id = current_setting('app.current_org_id')::INTEGER
        AND current_setting('app.user_role') IN ('admin', 'user')
    );

CREATE POLICY projects_update ON projects
    FOR UPDATE
    USING (
        org_id = current_setting('app.current_org_id')::INTEGER
        AND (
            current_setting('app.user_role') = 'admin'
            OR created_by = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY projects_delete ON projects
    FOR DELETE
    USING (
        org_id = current_setting('app.current_org_id')::INTEGER
        AND current_setting('app.user_role') = 'admin'
    );
```

### RLS Performance Considerations

**Index Support Columns Used in Policies**:
```sql
-- Critical: Index columns used in RLS policies
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
```

**Test Policy Performance**:
```sql
-- Check execution plan
EXPLAIN ANALYZE SELECT * FROM projects WHERE name LIKE '%test%';
```

---

## Audit Logging

### Standard Audit Log Schema

```sql
CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
    user_id INTEGER,
    username VARCHAR(100),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100)
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
```

### Trigger-Based Audit Logging

**Audit Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs;
    old_data JSONB;
    new_data JSONB;
    changed_cols TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get old and new data as JSON
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        old_data = row_to_json(OLD)::JSONB;
    END IF;
    
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        new_data = row_to_json(NEW)::JSONB;
    END IF;
    
    -- For UPDATE, identify changed columns
    IF TG_OP = 'UPDATE' THEN
        SELECT ARRAY_AGG(key) INTO changed_cols
        FROM jsonb_each(old_data)
        WHERE old_data->>key IS DISTINCT FROM new_data->>key;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_logs (
        table_name,
        record_id,
        operation,
        user_id,
        old_values,
        new_values,
        changed_columns,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,  -- Adjust based on your PK column name
        TG_OP,
        current_setting('app.current_user_id', TRUE)::INTEGER,
        old_data,
        new_data,
        changed_cols,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Apply Trigger to Tables**:
```sql
-- Apply to sensitive tables
CREATE TRIGGER audit_customers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Application-Level Audit Logging

```python
# Python example with SQLAlchemy
def log_audit(session, table_name, record_id, operation, old_values=None, new_values=None):
    audit_log = AuditLog(
        table_name=table_name,
        record_id=str(record_id),
        operation=operation,
        user_id=current_user.id,
        old_values=old_values,
        new_values=new_values,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    session.add(audit_log)
```

---

## Data Encryption

### Encryption at Rest

**PostgreSQL pgcrypto Extension**:
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
CREATE TABLE user_secrets (
    user_id INTEGER PRIMARY KEY,
    ssn_encrypted BYTEA,  -- Encrypted field
    credit_card_encrypted BYTEA
);

-- Insert encrypted data
INSERT INTO user_secrets (user_id, ssn_encrypted)
VALUES (1, pgp_sym_encrypt('123-45-6789', 'encryption_key'));

-- Query encrypted data
SELECT 
    user_id,
    pgp_sym_decrypt(ssn_encrypted, 'encryption_key') AS ssn
FROM user_secrets
WHERE user_id = 1;
```

**Best Practice**: Store encryption keys in environment variables or key management services (AWS KMS, Azure Key Vault), never in code.

### Encryption in Transit

**Always use SSL/TLS for database connections**:

```python
# Python example
DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"
```

**PostgreSQL SSL Configuration**:
```sql
-- Require SSL for specific users
ALTER USER app_user WITH PASSWORD 'password' ENCRYPTED;
ALTER USER app_user SET ssl = on;

-- Or in pg_hba.conf
hostssl all all 0.0.0.0/0 md5
```

---

## Access Control

### Role-Based Access Control (RBAC)

```sql
-- Create roles
CREATE ROLE read_only;
CREATE ROLE app_user;
CREATE ROLE admin;

-- Grant permissions to roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- Create database users and assign roles
CREATE USER analyst WITH PASSWORD 'secure_password';
GRANT read_only TO analyst;

CREATE USER api_service WITH PASSWORD 'secure_password';
GRANT app_user TO api_service;
```

### Principle of Least Privilege

```sql
-- Grant only necessary permissions
REVOKE ALL ON orders FROM app_user;
GRANT SELECT, INSERT ON orders TO app_user;
GRANT UPDATE (status, updated_at) ON orders TO app_user;  -- Column-level permissions

-- Deny DELETE except for admin
REVOKE DELETE ON orders FROM app_user;
```

---

## Sensitive Data Protection

### Personal Identifiable Information (PII)

**Identify PII Fields**:
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- Physical addresses
- Biometric data
- IP addresses

**Protection Strategies**:

1. **Tokenization** (for payment data):
```sql
CREATE TABLE payment_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    payment_token VARCHAR(100),  -- Token from payment processor
    last_four VARCHAR(4),         -- Display only
    card_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Hashing** (for passwords):
```sql
-- Never store plain text passwords
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt/argon2 hash
    salt VARCHAR(100)
);
```

3. **Masking** (for display):
```sql
-- Function to mask email
CREATE OR REPLACE FUNCTION mask_email(email VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN REGEXP_REPLACE(email, '(.{2}).*(@.*)', '\1****\2');
END;
$$ LANGUAGE plpgsql;

-- Usage: j.doe@example.com → j.****@example.com
SELECT mask_email(email) FROM users;
```

---

## SQL Injection Prevention

### Parameterized Queries (ALWAYS)

**❌ Vulnerable**:
```python
# NEVER DO THIS
query = f"SELECT * FROM users WHERE email = '{user_input}'"
cursor.execute(query)
```

**✅ Secure**:
```python
# Use parameterized queries
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (user_input,))
```

### Input Validation

```python
# Validate before database operations
import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    # Remove non-numeric characters
    clean_phone = re.sub(r'\D', '', phone)
    return len(clean_phone) >= 10
```

---

## Database User Security

### Connection Pooling Security

```python
# Use connection pooling with timeout
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:pass@host/db',
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_pre_ping=True  # Verify connections
)
```

### Credential Management

**Use environment variables**:
```bash
# .env file (never commit to git)
DB_HOST=localhost
DB_NAME=myapp
DB_USER=app_user
DB_PASSWORD=secure_random_password
DB_PORT=5432
```

**Or use secret management services**:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Google Secret Manager

---

## Monitoring and Alerting

### What to Monitor

```sql
-- Failed login attempts
SELECT username, COUNT(*) as failed_attempts
FROM audit_logs
WHERE operation = 'LOGIN_FAILED'
  AND changed_at > NOW() - INTERVAL '1 hour'
GROUP BY username
HAVING COUNT(*) > 5;

-- Unusual data access patterns
SELECT user_id, COUNT(*) as query_count
FROM audit_logs
WHERE operation = 'SELECT'
  AND changed_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 1000;  -- Threshold

-- Privilege escalation attempts
SELECT * FROM audit_logs
WHERE operation = 'GRANT'
  AND user_id NOT IN (SELECT user_id FROM admins);
```

### Alert on Suspicious Activity

- Multiple failed login attempts
- Bulk data exports
- Access outside business hours
- Privilege changes
- Schema modifications
- Unusual query patterns

---

## Compliance Checklists

### GDPR Compliance
- [ ] Audit logging for all PII access
- [ ] Data retention policies implemented
- [ ] Right to be forgotten (anonymization) support
- [ ] Consent tracking mechanism
- [ ] Data export capabilities
- [ ] Encryption at rest and in transit
- [ ] Access controls and RLS
- [ ] Regular security audits

### SOC 2 Compliance
- [ ] Access logs for all data access
- [ ] Change management for schema
- [ ] Regular backups with testing
- [ ] Encryption for sensitive data
- [ ] Role-based access control
- [ ] Incident response procedures
- [ ] Vendor risk management

### HIPAA Compliance (Healthcare)
- [ ] Audit controls (all data access logged)
- [ ] Authentication and authorization
- [ ] Encryption (at rest and in transit)
- [ ] Data backup and disaster recovery
- [ ] Access controls and user roles
- [ ] Integrity controls (audit trail)
- [ ] Transmission security (TLS/SSL)

---

## Security Checklist

Before production deployment:

- [ ] All passwords use strong hashing (bcrypt, argon2)
- [ ] Encryption enabled for sensitive data
- [ ] SSL/TLS required for all connections
- [ ] SQL injection protection (parameterized queries)
- [ ] RLS enabled for multi-tenant tables
- [ ] Audit logging on sensitive tables
- [ ] Database users follow least privilege
- [ ] Secrets stored in secure managers (not code)
- [ ] Regular security audits scheduled
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented

---

## Resources

**See also**:
- assets/audit_log_setup.sql - Complete audit logging implementation
- GDPR_COMPLIANCE.md - Detailed GDPR patterns
- Security monitoring queries and scripts

**Further Reading**:
- OWASP Database Security Cheat Sheet
- CIS Database Security Benchmarks
- NIST Cybersecurity Framework
