# GDPR Compliance Implementation Guide

## Overview
The General Data Protection Regulation (GDPR) requires specific technical implementations for handling personal data. This guide provides database-level patterns for GDPR compliance.

---

## GDPR Core Principles

1. **Lawfulness, fairness, and transparency**
2. **Purpose limitation**
3. **Data minimization**
4. **Accuracy**
5. **Storage limitation**
6. **Integrity and confidentiality**
7. **Accountability**

---

## Personal Data Identification

### What is Personal Data under GDPR?

**Directly Identifiable**:
- Name, email, phone number
- Physical address
- Social Security Number / National ID
- Passport number
- Driver's license number
- Financial information
- IP addresses

**Indirectly Identifiable** (when combined):
- Location data
- Device identifiers
- Online identifiers (cookies, tracking IDs)
- Demographic data
- Behavioral data

### Schema Audit for Personal Data

```sql
-- Identify tables with personal data
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name IN ('email', 'phone', 'address', 'ssn', 'name', 'dob')
    OR column_name LIKE '%email%'
    OR column_name LIKE '%phone%'
    OR column_name LIKE '%address%'
  )
ORDER BY table_name, ordinal_position;
```

---

## 1. Right to Access (Data Portability)

Users have the right to receive their personal data in a structured, machine-readable format.

### Implementation: Data Export Function

```sql
CREATE OR REPLACE FUNCTION export_user_data(user_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'personal_information', (
            SELECT row_to_json(u)
            FROM (
                SELECT 
                    user_id,
                    email,
                    first_name,
                    last_name,
                    phone,
                    created_at
                FROM users
                WHERE user_id = user_id_param
            ) u
        ),
        'addresses', (
            SELECT jsonb_agg(row_to_json(a))
            FROM (
                SELECT 
                    address_type,
                    street,
                    city,
                    postal_code,
                    country
                FROM addresses
                WHERE user_id = user_id_param
            ) a
        ),
        'orders', (
            SELECT jsonb_agg(row_to_json(o))
            FROM (
                SELECT 
                    order_id,
                    order_date,
                    total_amount,
                    status
                FROM orders
                WHERE customer_id = user_id_param
            ) o
        ),
        'preferences', (
            SELECT row_to_json(p)
            FROM (
                SELECT 
                    language,
                    timezone,
                    newsletter_opt_in,
                    marketing_opt_in
                FROM user_preferences
                WHERE user_id = user_id_param
            ) p
        )
    ) INTO user_data;
    
    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage
SELECT export_user_data(12345);
```

### Application-Level Export

```python
# Python example
def export_user_data(user_id):
    """Export all user data in JSON format"""
    data = {
        'personal_information': get_user_info(user_id),
        'addresses': get_user_addresses(user_id),
        'orders': get_user_orders(user_id),
        'preferences': get_user_preferences(user_id),
        'consent_history': get_consent_history(user_id)
    }
    
    return json.dumps(data, indent=2)
```

---

## 2. Right to Erasure ("Right to be Forgotten")

Users can request deletion of their personal data under certain conditions.

### Soft Delete Implementation

```sql
-- Add deleted_at column to tables with personal data
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE addresses ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE user_preferences ADD COLUMN deleted_at TIMESTAMPTZ;

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_user(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Mark user as deleted
    UPDATE users 
    SET 
        deleted_at = CURRENT_TIMESTAMP,
        email = 'deleted_' || user_id || '@anonymized.local',
        first_name = 'DELETED',
        last_name = 'DELETED',
        phone = NULL
    WHERE user_id = user_id_param;
    
    -- Mark related data as deleted
    UPDATE addresses 
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
    
    UPDATE user_preferences 
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
    
    -- Log the deletion
    INSERT INTO audit_logs (
        table_name, 
        record_id, 
        operation, 
        user_id
    ) VALUES (
        'users', 
        user_id_param::TEXT, 
        'GDPR_DELETE', 
        user_id_param
    );
END;
$$ LANGUAGE plpgsql;
```

### Anonymization (Alternative to Deletion)

```sql
CREATE OR REPLACE FUNCTION anonymize_user(user_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    random_suffix TEXT;
BEGIN
    random_suffix := MD5(random()::TEXT);
    
    UPDATE users 
    SET 
        email = 'anon_' || random_suffix || '@anonymized.local',
        first_name = 'Anonymous',
        last_name = 'User',
        phone = NULL,
        date_of_birth = NULL,
        deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
    
    -- Remove personally identifiable address details
    UPDATE addresses 
    SET 
        street = 'ANONYMIZED',
        postal_code = 'XXXXX',
        deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param;
    
    -- Log anonymization
    INSERT INTO audit_logs (
        table_name, 
        record_id, 
        operation
    ) VALUES (
        'users', 
        user_id_param::TEXT, 
        'GDPR_ANONYMIZE'
    );
END;
$$ LANGUAGE plpgsql;
```

### When You CANNOT Delete Data

Certain data must be retained for legal/financial reasons:

```sql
-- Retain order history but anonymize customer reference
CREATE OR REPLACE FUNCTION anonymize_customer_orders(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Keep orders (legal requirement) but remove customer link
    UPDATE orders 
    SET 
        customer_id = NULL,  -- Break the link
        customer_notes = 'Customer data deleted per GDPR request'
    WHERE customer_id = user_id_param;
    
    -- Or create an "anonymous" customer placeholder
    UPDATE orders 
    SET customer_id = -1  -- Special "deleted customer" ID
    WHERE customer_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Consent Management

Track and manage user consent for different purposes.

### Consent Tracking Schema

```sql
CREATE TABLE consent_purposes (
    purpose_id SERIAL PRIMARY KEY,
    purpose_name VARCHAR(100) UNIQUE NOT NULL,  -- 'marketing', 'analytics', 'profiling'
    description TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,  -- Required for service?
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_consents (
    consent_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    purpose_id INTEGER NOT NULL REFERENCES consent_purposes(purpose_id),
    consented BOOLEAN NOT NULL,
    consent_given_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consent_withdrawn_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    consent_version VARCHAR(50),  -- Track consent text version
    CONSTRAINT uq_user_purpose UNIQUE (user_id, purpose_id)
);

-- Index for fast lookup
CREATE INDEX idx_user_consents_user ON user_consents(user_id);
CREATE INDEX idx_user_consents_purpose ON user_consents(purpose_id);
```

### Consent Management Functions

```sql
-- Record consent
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id INTEGER,
    p_purpose_name VARCHAR,
    p_consented BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_purpose_id INTEGER;
BEGIN
    -- Get purpose ID
    SELECT purpose_id INTO v_purpose_id
    FROM consent_purposes
    WHERE purpose_name = p_purpose_name;
    
    IF v_purpose_id IS NULL THEN
        RAISE EXCEPTION 'Unknown consent purpose: %', p_purpose_name;
    END IF;
    
    -- Insert or update consent
    INSERT INTO user_consents (
        user_id, 
        purpose_id, 
        consented, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id, 
        v_purpose_id, 
        p_consented, 
        p_ip_address, 
        p_user_agent
    )
    ON CONFLICT (user_id, purpose_id) 
    DO UPDATE SET
        consented = EXCLUDED.consented,
        consent_given_at = CASE 
            WHEN EXCLUDED.consented = TRUE THEN CURRENT_TIMESTAMP
            ELSE user_consents.consent_given_at
        END,
        consent_withdrawn_at = CASE 
            WHEN EXCLUDED.consented = FALSE THEN CURRENT_TIMESTAMP
            ELSE NULL
        END,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent;
END;
$$ LANGUAGE plpgsql;

-- Check if user has consented
CREATE OR REPLACE FUNCTION has_consent(
    p_user_id INTEGER,
    p_purpose_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_consented BOOLEAN;
BEGIN
    SELECT uc.consented INTO v_consented
    FROM user_consents uc
    JOIN consent_purposes cp ON uc.purpose_id = cp.purpose_id
    WHERE uc.user_id = p_user_id
      AND cp.purpose_name = p_purpose_name
      AND uc.consent_withdrawn_at IS NULL;
    
    RETURN COALESCE(v_consented, FALSE);
END;
$$ LANGUAGE plpgsql;
```

### Application Usage

```python
# Check consent before processing
if has_consent(user_id, 'marketing'):
    send_marketing_email(user_id)

# Record consent
record_consent(
    user_id=user_id,
    purpose_name='analytics',
    consented=True,
    ip_address=request.remote_addr,
    user_agent=request.headers.get('User-Agent')
)
```

---

## 4. Data Retention Policies

Automatically delete or anonymize old data.

### Retention Policy Schema

```sql
CREATE TABLE retention_policies (
    policy_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,  -- 'DELETE' or 'ANONYMIZE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Example policies
INSERT INTO retention_policies (table_name, retention_days, action) VALUES
('audit_logs', 2555, 'DELETE'),      -- 7 years
('user_sessions', 90, 'DELETE'),     -- 90 days
('deleted_users', 30, 'DELETE');     -- 30 days after soft delete
```

### Automated Cleanup Job

```sql
CREATE OR REPLACE FUNCTION apply_retention_policies()
RETURNS TABLE(policy_name TEXT, records_affected INTEGER) AS $$
DECLARE
    policy RECORD;
    affected_count INTEGER;
BEGIN
    FOR policy IN SELECT * FROM retention_policies WHERE is_active = TRUE
    LOOP
        IF policy.action = 'DELETE' THEN
            EXECUTE format(
                'DELETE FROM %I WHERE created_at < NOW() - INTERVAL ''%s days''',
                policy.table_name,
                policy.retention_days
            );
            GET DIAGNOSTICS affected_count = ROW_COUNT;
        ELSIF policy.action = 'ANONYMIZE' THEN
            -- Custom anonymization per table
            -- Example for users table
            IF policy.table_name = 'users' THEN
                EXECUTE format(
                    'UPDATE %I SET email = ''anon_'' || user_id || ''@anon.local'', 
                     first_name = ''Anonymous'', last_name = ''User'' 
                     WHERE created_at < NOW() - INTERVAL ''%s days'' 
                     AND deleted_at IS NOT NULL',
                    policy.table_name,
                    policy.retention_days
                );
                GET DIAGNOSTICS affected_count = ROW_COUNT;
            END IF;
        END IF;
        
        RETURN QUERY SELECT policy.table_name::TEXT, affected_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule with cron (pg_cron extension)
SELECT cron.schedule(
    'retention-cleanup',
    '0 2 * * *',  -- Daily at 2 AM
    'SELECT apply_retention_policies()'
);
```

---

## 5. Data Processing Records

Track what processing activities occur on personal data.

```sql
CREATE TABLE data_processing_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    processing_purpose VARCHAR(100) NOT NULL,  -- 'profile_update', 'order_processing'
    legal_basis VARCHAR(50) NOT NULL,  -- 'consent', 'contract', 'legitimate_interest'
    data_categories TEXT[],  -- ['name', 'email', 'address']
    processing_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processor_identity VARCHAR(200),  -- Which service/user processed
    ip_address INET,
    CONSTRAINT ck_legal_basis CHECK (
        legal_basis IN ('consent', 'contract', 'legal_obligation', 
                       'vital_interests', 'public_task', 'legitimate_interest')
    )
);

CREATE INDEX idx_data_processing_user ON data_processing_log(user_id);
CREATE INDEX idx_data_processing_timestamp ON data_processing_log(processing_timestamp);
```

---

## 6. Data Breach Notification

Track and manage data breaches.

```sql
CREATE TABLE data_breaches (
    breach_id SERIAL PRIMARY KEY,
    discovered_at TIMESTAMPTZ NOT NULL,
    breach_description TEXT NOT NULL,
    affected_records INTEGER,
    data_categories_affected TEXT[],
    breach_type VARCHAR(50),  -- 'unauthorized_access', 'data_leak', 'ransomware'
    severity VARCHAR(20),  -- 'low', 'medium', 'high', 'critical'
    notified_authorities BOOLEAN DEFAULT FALSE,
    notified_authorities_at TIMESTAMPTZ,
    notified_users BOOLEAN DEFAULT FALSE,
    notified_users_at TIMESTAMPTZ,
    mitigation_steps TEXT,
    resolved_at TIMESTAMPTZ
);

-- Affected users tracking
CREATE TABLE breach_affected_users (
    breach_id INTEGER REFERENCES data_breaches(breach_id),
    user_id INTEGER REFERENCES users(user_id),
    notified_at TIMESTAMPTZ,
    PRIMARY KEY (breach_id, user_id)
);
```

---

## 7. Privacy by Design Checklist

Database-level implementation:

- [ ] **Data Minimization**: Only collect necessary personal data
- [ ] **Encryption**: Encrypt sensitive data at rest
- [ ] **Access Controls**: RLS and role-based permissions
- [ ] **Audit Logging**: Track all access to personal data
- [ ] **Consent Tracking**: Record and manage user consents
- [ ] **Data Portability**: Export function ready
- [ ] **Right to Erasure**: Deletion/anonymization functions
- [ ] **Retention Policies**: Automated data cleanup
- [ ] **Pseudonymization**: Where possible, replace identifiers
- [ ] **Breach Detection**: Monitoring and alerting system

---

## 8. GDPR Compliance Queries

### Users Who Haven't Consented to Marketing
```sql
SELECT u.user_id, u.email
FROM users u
LEFT JOIN user_consents uc ON u.user_id = uc.user_id 
    AND uc.purpose_id = (SELECT purpose_id FROM consent_purposes WHERE purpose_name = 'marketing')
WHERE uc.consented IS NULL OR uc.consented = FALSE;
```

### Data Retention Report
```sql
SELECT 
    table_name,
    retention_days,
    action,
    COUNT(*) FILTER (
        WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    ) as records_to_process
FROM retention_policies
GROUP BY table_name, retention_days, action;
```

### Personal Data Access Report
```sql
SELECT 
    user_id,
    COUNT(*) as access_count,
    MAX(changed_at) as last_access
FROM audit_logs
WHERE operation = 'SELECT'
  AND table_name IN ('users', 'addresses', 'orders')
  AND changed_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY access_count DESC;
```

---

## Compliance Checklist

### Technical Measures
- [ ] Encryption at rest for sensitive data
- [ ] SSL/TLS for data in transit
- [ ] Access controls and RLS implemented
- [ ] Audit logging on all personal data tables
- [ ] Automated retention policy enforcement
- [ ] Data export functionality
- [ ] Anonymization/deletion procedures

### Procedural Measures
- [ ] Data processing impact assessment (DPIA) completed
- [ ] Privacy policy published and accessible
- [ ] Consent mechanisms in place
- [ ] Data breach response plan documented
- [ ] Staff training on GDPR requirements
- [ ] Third-party processor agreements
- [ ] Regular security audits scheduled

---

## Resources

**Further Reading**:
- GDPR Official Text: https://gdpr-info.eu/
- ICO Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/
- EDPB Guidelines: https://edpb.europa.eu/

**Related Documentation**:
- SECURITY_BEST_PRACTICES.md - Encryption and access control
- assets/audit_log_setup.sql - Audit logging implementation
