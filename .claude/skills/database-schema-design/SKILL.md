---
name: database-schema-architect
description: Expert guidance for designing, optimizing, and maintaining database schemas for SQL and NoSQL systems. Use when creating new databases, optimizing existing schemas, planning migrations, implementing security policies, or ensuring GDPR compliance. Covers normalization, indexing, data types, relationships, performance optimization, and audit logging.
---

# Database Schema Architect

## Overview
This skill provides comprehensive guidance for database schema design, from initial planning through production deployment and ongoing maintenance. It covers both relational (SQL) and NoSQL databases with focus on scalability, performance, security, and compliance.

## Core Design Principles

### 1. Start with Requirements Analysis
Before designing any schema:
- Identify primary use cases and query patterns
- Determine read/write ratio (OLTP vs OLAP)
- Establish data volume projections (current and 2-5 year growth)
- Define compliance requirements (GDPR, HIPAA, SOC2, etc.)
- List critical performance requirements (response times, throughput)

### 2. Naming Conventions (Critical for Maintainability)

**Tables**: Plural nouns in lowercase
- ✅ `customers`, `orders`, `order_items`
- ❌ `Customer`, `order`, `OrderItem`

**Columns**: Singular nouns, descriptive
- ✅ `customer_id`, `email_address`, `created_at`
- ❌ `custId`, `e_mail`, `date`

**Primary Keys**: `table_name_id` format
- ✅ `customer_id`, `order_id`
- Use SERIAL/AUTO_INCREMENT for SQL
- Use UUID for distributed systems

**Foreign Keys**: Reference the table they point to
- ✅ `customer_id`, `product_id`
- Always index foreign key columns

**Indexes**: Prefix with `idx_` followed by table and columns
- ✅ `idx_orders_customer_id`, `idx_products_category_status`

**Constraints**: Descriptive of their purpose
- ✅ `fk_orders_customer_id`, `ck_price_positive`, `uq_email_address`

### 3. Normalization Strategy
- **3NF (Third Normal Form)**: Default starting point for transactional (OLTP) systems. Ensures data integrity and reduces redundancy.
- **Denormalization**: Apply deliberately only when performance monitoring proves distinct need for read-heavy operations or reporting (OLAP). *Document every denormalization decision.*

## Schema Design Patterns

### 1. Identity & Access Management (IAM)
Standard pattern for users and roles:
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id INT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(user_id),
    role_id INT REFERENCES roles(role_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

### 2. Audit Logging (Compliance)
Track who changed what and when:
```sql
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    changed_by UUID REFERENCES users(user_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Soft Deletes
Preserve data instead of permanent removal:
```sql
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
-- View for active records
CREATE VIEW active_orders AS SELECT * FROM orders WHERE deleted_at IS NULL;
```

## Performance Optimization

1.  **Index Strategy**:
    - Index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
    - Use Composite Indexes for multi-column queries (order matters: equality first, then range).
    - Monitor unused indexes and remove them to speed up writes.

2.  **Data Types**:
    - Use efficient types: `INT` vs `BIGINT`, `VARCHAR(n)` vs `TEXT`.
    - Use `JSONB` for flexible schema within SQL, but index specific keys if queried often.

3.  **Partitioning**:
    - Implement table partitioning for massive tables (millions of rows) based on date ranges or regions to improve query speed.

## Security & Access Control

1.  **Row Level Security (RLS)**: Essential for multi-tenant SaaS.
    ```sql
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    CREATE POLICY order_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
    ```

2.  **Principle of Least Privilege**:
    - Application user should only have permissions required (SELECT, INSERT, UPDATE).
    - No DDL access (CREATE, DROP) for the application user.

## Migration Workflow
1.  **Version Control**: Migration scripts (`V1__init.sql`, `V2__add_column.sql`) stored in Git.
2.  **Idempotency**: Scripts should be runnable multiple times without error (use `IF NOT EXISTS`).
3.  **Testing**: Verify "Up" and "Down" (rollback) migrations in a staging environment before production.
