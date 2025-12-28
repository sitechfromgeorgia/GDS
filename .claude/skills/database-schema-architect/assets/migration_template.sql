-- Migration Template
-- Description: [Brief description of changes]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Ticket/Issue: [Reference number if applicable]

-- =============================================================================
-- IMPORTANT: Review this template and customize for your specific migration
-- =============================================================================

BEGIN;

-- =============================================================================
-- MIGRATION METADATA
-- =============================================================================
-- Migration ID: [unique_identifier]
-- Dependencies: [List any dependent migrations]
-- Estimated Duration: [time estimate]
-- Breaking Changes: [Yes/No - List if yes]

-- =============================================================================
-- PRE-MIGRATION CHECKS
-- =============================================================================
DO $$
BEGIN
    -- Example: Verify table doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'new_table') THEN
        RAISE EXCEPTION 'Table new_table already exists - migration may have been applied';
    END IF;
    
    -- Example: Verify required table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'required_table') THEN
        RAISE EXCEPTION 'Required table required_table does not exist';
    END IF;
    
    RAISE NOTICE 'Pre-migration checks passed';
END $$;

-- =============================================================================
-- SCHEMA CHANGES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE TABLES
-- -----------------------------------------------------------------------------

-- Example table creation
CREATE TABLE example_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE example_table IS 'Description of table purpose';

-- -----------------------------------------------------------------------------
-- 2. ALTER EXISTING TABLES
-- -----------------------------------------------------------------------------

-- Add columns
-- ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(100);

-- Add constraints
-- ALTER TABLE existing_table ADD CONSTRAINT ck_positive CHECK (amount >= 0);

-- Add foreign keys
-- ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
--     FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- -----------------------------------------------------------------------------
-- 3. CREATE INDEXES
-- -----------------------------------------------------------------------------

-- Regular index
CREATE INDEX idx_example_table_name ON example_table(name);

-- Composite index
-- CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- Partial index (PostgreSQL)
-- CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- Concurrent index creation (PostgreSQL - doesn't lock table)
-- CREATE INDEX CONCURRENTLY idx_large_table_column ON large_table(column);

-- -----------------------------------------------------------------------------
-- 4. DATA MIGRATIONS
-- -----------------------------------------------------------------------------

-- Example: Populate new column with default values
-- UPDATE users SET status = 'active' WHERE status IS NULL;

-- Example: Migrate data between tables
-- INSERT INTO new_table (column1, column2)
-- SELECT old_column1, old_column2 FROM old_table;

-- -----------------------------------------------------------------------------
-- 5. CREATE FUNCTIONS/TRIGGERS
-- -----------------------------------------------------------------------------

-- Example trigger function
-- CREATE OR REPLACE FUNCTION update_modified_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Example trigger
-- CREATE TRIGGER update_example_table_modtime
--     BEFORE UPDATE ON example_table
--     FOR EACH ROW
--     EXECUTE FUNCTION update_modified_column();

-- -----------------------------------------------------------------------------
-- 6. PERMISSIONS
-- -----------------------------------------------------------------------------

-- Grant permissions to roles
-- GRANT SELECT, INSERT, UPDATE ON example_table TO app_user;
-- GRANT SELECT ON example_table TO read_only_user;

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Example: Verify table was created
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'example_table') THEN
        RAISE EXCEPTION 'Migration verification failed: example_table not created';
    END IF;
    
    -- Example: Verify column was added
    -- IF NOT EXISTS (
    --     SELECT 1 FROM information_schema.columns 
    --     WHERE table_name = 'existing_table' AND column_name = 'new_column'
    -- ) THEN
    --     RAISE EXCEPTION 'Migration verification failed: new_column not added';
    -- END IF;
    
    -- Example: Verify data was migrated
    -- SELECT COUNT(*) INTO row_count FROM example_table;
    -- IF row_count = 0 THEN
    --     RAISE WARNING 'example_table is empty - verify this is expected';
    -- END IF;
    
    -- Example: Verify index was created
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'example_table' AND indexname = 'idx_example_table_name'
    ) THEN
        RAISE EXCEPTION 'Migration verification failed: index not created';
    END IF;
    
    RAISE NOTICE 'Post-migration verification passed';
END $$;

-- =============================================================================
-- COMMIT
-- =============================================================================

COMMIT;

-- =============================================================================
-- POST-DEPLOYMENT NOTES
-- =============================================================================
-- 
-- 1. Run corresponding rollback script if issues occur
-- 2. Monitor application logs for errors after deployment
-- 3. Check query performance on affected tables
-- 4. Update application code if schema changes require it
-- 5. Update documentation with schema changes
-- 6. Notify team of deployment completion
--
-- ROLLBACK SCRIPT: rollback_[timestamp]_[description].sql
-- 
-- =============================================================================
-- ADDITIONAL NOTES
-- =============================================================================
-- 
-- [Add any additional context, warnings, or special instructions]
-- 
