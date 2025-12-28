-- =============================================================================
-- COMPREHENSIVE AUDIT LOGGING SETUP
-- =============================================================================
-- This script sets up a complete audit logging system with:
-- - Audit log table with optimized indexes
-- - Generic trigger function for automatic logging
-- - Helper functions for manual logging
-- - Retention policy management
-- - Query helpers for audit analysis
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    user_id INTEGER,
    username VARCHAR(100),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    application_name VARCHAR(100),
    CONSTRAINT ck_audit_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT'))
);

-- Add table comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for data changes and access';

-- Column comments
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_logs.record_id IS 'Primary key value of the affected record';
COMMENT ON COLUMN audit_logs.operation IS 'Type of operation: INSERT, UPDATE, DELETE, SELECT';
COMMENT ON COLUMN audit_logs.old_values IS 'JSON representation of row before change';
COMMENT ON COLUMN audit_logs.new_values IS 'JSON representation of row after change';
COMMENT ON COLUMN audit_logs.changed_columns IS 'Array of column names that changed (UPDATE only)';

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Composite index for common queries
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Index for user-specific queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Index for time-based queries
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- Index for operation type
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);

-- Composite index for table + time queries
CREATE INDEX idx_audit_logs_table_time ON audit_logs(table_name, changed_at DESC);

-- GIN index for JSONB searching (PostgreSQL)
CREATE INDEX idx_audit_logs_old_values_gin ON audit_logs USING GIN(old_values);
CREATE INDEX idx_audit_logs_new_values_gin ON audit_logs USING GIN(new_values);

-- =============================================================================
-- 3. GENERIC AUDIT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs;
    old_data JSONB;
    new_data JSONB;
    changed_cols TEXT[] := ARRAY[]::TEXT[];
    pk_column TEXT;
    record_id_value TEXT;
BEGIN
    -- Determine the primary key column name (assumes single column PK)
    SELECT a.attname INTO pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID AND i.indisprimary
    LIMIT 1;
    
    -- Get record ID
    IF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT ($1).%I::TEXT', pk_column) INTO record_id_value USING OLD;
    ELSE
        EXECUTE format('SELECT ($1).%I::TEXT', pk_column) INTO record_id_value USING NEW;
    END IF;
    
    -- Convert rows to JSONB
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
    END IF;
    
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        new_data = to_jsonb(NEW);
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
        username,
        old_values,
        new_values,
        changed_columns,
        ip_address,
        application_name
    ) VALUES (
        TG_TABLE_NAME,
        record_id_value,
        TG_OP,
        NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER,
        NULLIF(current_setting('app.username', TRUE), ''),
        old_data,
        new_data,
        changed_cols,
        NULLIF(inet_client_addr(), '127.0.0.1'),  -- Exclude localhost
        current_setting('application_name', TRUE)
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Audit trigger failed for %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. HELPER FUNCTION: ENABLE AUDITING ON TABLE
-- =============================================================================

CREATE OR REPLACE FUNCTION enable_audit_logging(target_table TEXT)
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name := 'audit_' || target_table || '_trigger';
    
    -- Create trigger
    EXECUTE format(
        'CREATE TRIGGER %I
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()',
        trigger_name,
        target_table
    );
    
    RAISE NOTICE 'Audit logging enabled for table: %', target_table;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. HELPER FUNCTION: DISABLE AUDITING ON TABLE
-- =============================================================================

CREATE OR REPLACE FUNCTION disable_audit_logging(target_table TEXT)
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name := 'audit_' || target_table || '_trigger';
    
    -- Drop trigger if exists
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, target_table);
    
    RAISE NOTICE 'Audit logging disabled for table: %', target_table;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. MANUAL AUDIT LOGGING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION log_audit_manual(
    p_table_name VARCHAR,
    p_record_id VARCHAR,
    p_operation VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        operation,
        user_id,
        new_values
    ) VALUES (
        p_table_name,
        p_record_id,
        p_operation,
        COALESCE(p_user_id, NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER),
        jsonb_build_object('description', p_description)
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. AUDIT HISTORY VIEWER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_audit_history(
    p_table_name VARCHAR,
    p_record_id VARCHAR,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    changed_at TIMESTAMPTZ,
    operation VARCHAR,
    username VARCHAR,
    changed_columns TEXT[],
    old_values JSONB,
    new_values JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.changed_at,
        al.operation,
        al.username,
        al.changed_columns,
        al.old_values,
        al.new_values
    FROM audit_logs al
    WHERE al.table_name = p_table_name
      AND al.record_id = p_record_id
    ORDER BY al.changed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. AUDIT RETENTION POLICY
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE changed_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % old audit log records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. QUERY HELPERS FOR AUDIT ANALYSIS
-- =============================================================================

-- Get most active users
CREATE OR REPLACE VIEW audit_user_activity AS
SELECT 
    user_id,
    username,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE operation = 'INSERT') as inserts,
    COUNT(*) FILTER (WHERE operation = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE operation = 'DELETE') as deletes,
    MIN(changed_at) as first_activity,
    MAX(changed_at) as last_activity
FROM audit_logs
WHERE changed_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, username
ORDER BY total_operations DESC;

-- Get most modified tables
CREATE OR REPLACE VIEW audit_table_activity AS
SELECT 
    table_name,
    COUNT(*) as total_changes,
    COUNT(*) FILTER (WHERE operation = 'INSERT') as inserts,
    COUNT(*) FILTER (WHERE operation = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE operation = 'DELETE') as deletes,
    COUNT(DISTINCT record_id) as unique_records_affected
FROM audit_logs
WHERE changed_at > NOW() - INTERVAL '30 days'
GROUP BY table_name
ORDER BY total_changes DESC;

-- Get recent changes to a specific record
CREATE OR REPLACE FUNCTION get_record_history(
    p_table_name VARCHAR,
    p_record_id VARCHAR
)
RETURNS TABLE (
    change_number INTEGER,
    changed_at TIMESTAMPTZ,
    operation VARCHAR,
    username VARCHAR,
    changes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY al.changed_at DESC)::INTEGER,
        al.changed_at,
        al.operation,
        al.username,
        CASE 
            WHEN al.operation = 'INSERT' THEN 'Record created'
            WHEN al.operation = 'DELETE' THEN 'Record deleted'
            WHEN al.operation = 'UPDATE' THEN 
                'Changed: ' || ARRAY_TO_STRING(al.changed_columns, ', ')
            ELSE al.operation
        END
    FROM audit_logs al
    WHERE al.table_name = p_table_name
      AND al.record_id = p_record_id
    ORDER BY al.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. EXAMPLE: ENABLE AUDITING ON SENSITIVE TABLES
-- =============================================================================

-- Uncomment to enable auditing on your tables
-- SELECT enable_audit_logging('users');
-- SELECT enable_audit_logging('orders');
-- SELECT enable_audit_logging('customers');
-- SELECT enable_audit_logging('payments');
-- SELECT enable_audit_logging('sensitive_data');

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

-- View audit history for a specific record:
-- SELECT * FROM get_audit_history('users', '12345');

-- Get formatted change history:
-- SELECT * FROM get_record_history('orders', '98765');

-- View user activity:
-- SELECT * FROM audit_user_activity;

-- View table activity:
-- SELECT * FROM audit_table_activity;

-- Manual audit log:
-- SELECT log_audit_manual('users', '12345', 'SELECT', 'Sensitive data accessed');

-- Clean up old logs (keep last 7 years):
-- SELECT cleanup_old_audit_logs(2555);

COMMIT;

-- =============================================================================
-- POST-SETUP NOTES
-- =============================================================================
-- 
-- 1. Enable auditing on sensitive tables using: SELECT enable_audit_logging('table_name');
-- 2. Set up cron job for periodic cleanup: SELECT cleanup_old_audit_logs(retention_days);
-- 3. Review audit views regularly: audit_user_activity, audit_table_activity
-- 4. For application-level context, set these before operations:
--    SET LOCAL app.current_user_id = '12345';
--    SET LOCAL app.username = 'john.doe';
-- 5. Consider partitioning audit_logs table if volume is very high
-- 
-- =============================================================================
