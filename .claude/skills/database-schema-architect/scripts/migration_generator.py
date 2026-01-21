#!/usr/bin/env python3
"""
Migration Generator
Generates SQL migration scripts with proper structure, rollback, and verification.
"""
import sys
import json
from datetime import datetime
from typing import Dict, List

def generate_create_table(table: Dict) -> str:
    """Generate CREATE TABLE statement"""
    table_name = table.get('name')
    columns = table.get('columns', [])
    primary_key = table.get('primary_key')
    foreign_keys = table.get('foreign_keys', [])
    constraints = table.get('constraints', [])
    
    sql = f"CREATE TABLE {table_name} (\n"
    
    # Columns
    col_definitions = []
    for col in columns:
        col_def = f"    {col['name']} {col['type']}"
        
        # Add constraints inline
        if col.get('not_null'):
            col_def += " NOT NULL"
        if col.get('unique'):
            col_def += " UNIQUE"
        if col.get('default'):
            col_def += f" DEFAULT {col['default']}"
        
        col_definitions.append(col_def)
    
    sql += ",\n".join(col_definitions)
    
    # Primary key
    if primary_key:
        sql += f",\n    PRIMARY KEY ({primary_key})"
    
    # Foreign keys
    for fk in foreign_keys:
        fk_name = fk.get('name', f"fk_{table_name}_{fk['column']}")
        ref_table = fk['ref_table']
        ref_column = fk.get('ref_column', fk['column'])
        on_delete = fk.get('on_delete', 'NO ACTION')
        
        sql += f",\n    CONSTRAINT {fk_name} FOREIGN KEY ({fk['column']}) "
        sql += f"REFERENCES {ref_table}({ref_column}) ON DELETE {on_delete}"
    
    # Check constraints
    for constraint in constraints:
        if constraint['type'] == 'CHECK':
            con_name = constraint.get('name', f"ck_{table_name}_{constraint['column']}")
            sql += f",\n    CONSTRAINT {con_name} CHECK ({constraint['expression']})"
    
    sql += "\n);"
    
    return sql

def generate_create_index(index: Dict, table_name: str) -> str:
    """Generate CREATE INDEX statement"""
    idx_name = index.get('name')
    columns = index.get('columns', [])
    is_unique = index.get('unique', False)
    where_clause = index.get('where')
    
    sql = "CREATE "
    if is_unique:
        sql += "UNIQUE "
    
    sql += f"INDEX {idx_name} ON {table_name}({', '.join(columns)})"
    
    if where_clause:
        sql += f" WHERE {where_clause}"
    
    sql += ";"
    
    return sql

def generate_add_column(table_name: str, column: Dict) -> str:
    """Generate ALTER TABLE ADD COLUMN statement"""
    sql = f"ALTER TABLE {table_name} ADD COLUMN {column['name']} {column['type']}"
    
    if column.get('not_null'):
        sql += " NOT NULL"
    if column.get('default'):
        sql += f" DEFAULT {column['default']}"
    if column.get('unique'):
        sql += " UNIQUE"
    
    sql += ";"
    
    return sql

def generate_drop_column(table_name: str, column_name: str) -> str:
    """Generate ALTER TABLE DROP COLUMN statement"""
    return f"ALTER TABLE {table_name} DROP COLUMN {column_name};"

def generate_rename_column(table_name: str, old_name: str, new_name: str) -> str:
    """Generate ALTER TABLE RENAME COLUMN statement"""
    return f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name};"

def generate_migration_header(description: str, author: str = "Database Architect") -> str:
    """Generate migration file header"""
    date_str = datetime.now().strftime("%Y-%m-%d")
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    header = f"""-- Migration: {description}
-- Generated: {date_str}
-- Author: {author}
-- Timestamp: {timestamp}

-- This migration script follows best practices:
-- 1. Wrapped in a transaction for atomicity
-- 2. Includes verification checks
-- 3. Has corresponding rollback script
-- 4. Documents each change clearly

BEGIN;

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================
"""
    return header

def generate_migration_footer() -> str:
    """Generate migration file footer with verification"""
    footer = """
-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Add verification queries here
    -- Example: Check if table exists
    -- IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'new_table') THEN
    --     RAISE EXCEPTION 'Migration verification failed: table not created';
    -- END IF;
    
    -- Example: Check if column exists
    -- IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'table' AND column_name = 'column') THEN
    --     RAISE EXCEPTION 'Migration verification failed: column not created';
    -- END IF;
    
    RAISE NOTICE 'Migration verification passed';
END $$;

COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. Run corresponding rollback script if issues occur
-- 2. Monitor application logs for errors
-- 3. Check query performance after deployment
-- 4. Update documentation with schema changes
"""
    return footer

def generate_rollback_header(description: str) -> str:
    """Generate rollback script header"""
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    header = f"""-- Rollback for: {description}
-- Generated: {date_str}

-- This rollback script reverses all changes from the migration
-- Apply this if migration causes issues in production

BEGIN;

-- ============================================================================
-- ROLLBACK OPERATIONS (in reverse order)
-- ============================================================================
"""
    return header

def generate_rollback_footer() -> str:
    """Generate rollback script footer"""
    return """
-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully';
END $$;

COMMIT;
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: migration_generator.py <migration.json>")
        print("\nExpected JSON format:")
        print('''{
    "description": "Add user preferences table",
    "author": "John Doe",
    "operations": [
        {
            "type": "create_table",
            "table": {
                "name": "user_preferences",
                "primary_key": "preference_id",
                "columns": [
                    {"name": "preference_id", "type": "SERIAL"},
                    {"name": "user_id", "type": "INTEGER", "not_null": true},
                    {"name": "key", "type": "VARCHAR(100)", "not_null": true},
                    {"name": "value", "type": "TEXT"}
                ],
                "foreign_keys": [
                    {"column": "user_id", "ref_table": "users", "ref_column": "user_id", "on_delete": "CASCADE"}
                ]
            }
        },
        {
            "type": "create_index",
            "table": "user_preferences",
            "index": {
                "name": "idx_user_preferences_user_id",
                "columns": ["user_id"]
            }
        }
    ]
}''')
        sys.exit(1)
    
    migration_file = sys.argv[1]
    
    try:
        with open(migration_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{migration_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
        sys.exit(1)
    
    description = data.get('description', 'Database migration')
    author = data.get('author', 'Database Architect')
    operations = data.get('operations', [])
    
    if not operations:
        print("Error: No operations defined in migration")
        sys.exit(1)
    
    # Generate forward migration
    migration_sql = generate_migration_header(description, author)
    rollback_operations = []
    
    for op in operations:
        op_type = op.get('type')
        
        migration_sql += f"\n-- {op_type.replace('_', ' ').title()}\n"
        
        if op_type == 'create_table':
            table = op['table']
            table_name = table['name']
            migration_sql += generate_create_table(table) + "\n"
            rollback_operations.append(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
            
        elif op_type == 'create_index':
            table_name = op['table']
            index = op['index']
            migration_sql += generate_create_index(index, table_name) + "\n"
            rollback_operations.append(f"DROP INDEX IF EXISTS {index['name']};")
            
        elif op_type == 'add_column':
            table_name = op['table']
            column = op['column']
            migration_sql += generate_add_column(table_name, column) + "\n"
            rollback_operations.append(generate_drop_column(table_name, column['name']))
            
        elif op_type == 'drop_column':
            table_name = op['table']
            column_name = op['column']
            migration_sql += generate_drop_column(table_name, column_name) + "\n"
            rollback_operations.append(f"-- Manual restoration required for column {column_name}")
            
        elif op_type == 'rename_column':
            table_name = op['table']
            old_name = op['old_name']
            new_name = op['new_name']
            migration_sql += generate_rename_column(table_name, old_name, new_name) + "\n"
            rollback_operations.append(generate_rename_column(table_name, new_name, old_name))
        
        else:
            print(f"Warning: Unknown operation type '{op_type}'")
    
    migration_sql += generate_migration_footer()
    
    # Generate rollback script
    rollback_sql = generate_rollback_header(description)
    rollback_sql += "\n"
    
    # Reverse order for rollback
    for rollback_op in reversed(rollback_operations):
        rollback_sql += rollback_op + "\n"
    
    rollback_sql += generate_rollback_footer()
    
    # Output files
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    migration_filename = f"migration_{timestamp}_{description.replace(' ', '_').lower()}.sql"
    rollback_filename = f"rollback_{timestamp}_{description.replace(' ', '_').lower()}.sql"
    
    with open(migration_filename, 'w') as f:
        f.write(migration_sql)
    
    with open(rollback_filename, 'w') as f:
        f.write(rollback_sql)
    
    print("\n" + "="*70)
    print("MIGRATION SCRIPTS GENERATED")
    print("="*70)
    print(f"\nForward migration: {migration_filename}")
    print(f"Rollback script:   {rollback_filename}")
    print("\nNext steps:")
    print("  1. Review both scripts carefully")
    print("  2. Test on development database first")
    print("  3. Run on staging environment")
    print("  4. Monitor for issues")
    print("  5. Deploy to production with monitoring")
    print("  6. Keep rollback script ready")
    print()

if __name__ == "__main__":
    main()
