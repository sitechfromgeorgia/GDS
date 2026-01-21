# Data Types Reference Guide

## Overview
Choosing the right data type is critical for storage efficiency, query performance, and data integrity. This guide provides comprehensive data type recommendations for common scenarios.

---

## General Principles

1. **Use the smallest appropriate type** - Saves storage and improves performance
2. **Be specific** - VARCHAR(255) is often overkill
3. **Never use FLOAT for money** - Use DECIMAL
4. **Consider future growth** - But don't over-provision
5. **Use NOT NULL when appropriate** - Improves query optimization

---

## Numeric Types

### Integers

| Type | Storage | Range | Use Case |
|------|---------|-------|----------|
| **SMALLINT** | 2 bytes | -32,768 to 32,767 | Age, quantity (small numbers) |
| **INTEGER** | 4 bytes | -2B to 2B | Most counters, IDs for medium datasets |
| **BIGINT** | 8 bytes | -9 quintillion to 9 quintillion | Large datasets, timestamps |

**Choosing Integer Types**:
```sql
-- ✅ Good choices
age SMALLINT              -- Age will never exceed 32,767
quantity INTEGER          -- Order quantity
user_id BIGINT           -- Large user base expected

-- ❌ Over-provisioned
age BIGINT               -- Wastes 6 bytes per row
small_count BIGINT       -- Use SMALLINT or INTEGER
```

### Serial Types (Auto-increment)

```sql
-- PostgreSQL
id SERIAL PRIMARY KEY           -- INTEGER auto-increment
id BIGSERIAL PRIMARY KEY        -- BIGINT auto-increment

-- MySQL
id INT AUTO_INCREMENT PRIMARY KEY
id BIGINT AUTO_INCREMENT PRIMARY KEY
```

**When to use BIGINT for IDs**:
- Expected > 2 billion records
- Distributed systems (to avoid ID collisions)
- High insert rate (> 1000 inserts/second sustained)

### Decimals (Money and Precision)

| Type | Storage | Precision | Use Case |
|------|---------|-----------|----------|
| **DECIMAL(p,s)** | Variable | Exact | Money, scientific data |
| **FLOAT** | 4 bytes | ~7 digits | ❌ Never for money |
| **DOUBLE** | 8 bytes | ~15 digits | ❌ Never for money |

**Money Columns**:
```sql
-- ✅ Correct: Exact precision
price DECIMAL(10, 2)        -- $99,999,999.99
amount DECIMAL(19, 4)       -- For high precision accounting

-- ❌ Wrong: Rounding errors
price FLOAT                 -- $10.00 might become $9.999999
```

**Common DECIMAL Sizes**:
```sql
-- Retail prices
price DECIMAL(10, 2)        -- Up to $99,999,999.99

-- Accounting (requires more precision)
amount DECIMAL(19, 4)       -- Up to $999,999,999,999,999.9999

-- Percentages
tax_rate DECIMAL(5, 4)      -- 0.0000 to 9.9999 (0% to 999.99%)

-- Exchange rates
rate DECIMAL(18, 8)         -- High precision for currency conversion
```

---

## String Types

### VARCHAR vs TEXT

```sql
-- Use VARCHAR with specific size for predictable data
email VARCHAR(255)          -- Max email length
phone VARCHAR(20)           -- Phone with country code
postal_code VARCHAR(10)     -- Postal code
sku VARCHAR(50)             -- Product SKU

-- Use TEXT for unpredictable length
description TEXT            -- Product description
bio TEXT                    -- User biography
notes TEXT                  -- Comments/notes
```

### Common String Sizes

```sql
-- Names
first_name VARCHAR(100)
last_name VARCHAR(100)
company_name VARCHAR(200)

-- Identifiers
sku VARCHAR(50)
invoice_number VARCHAR(30)
order_number VARCHAR(20)

-- Contact
email VARCHAR(255)          -- Standard max
phone VARCHAR(20)           -- +1 (555) 123-4567
url VARCHAR(2000)           -- URLs can be long

-- Addresses
street VARCHAR(200)
city VARCHAR(100)
state_province VARCHAR(100)
postal_code VARCHAR(10)
country VARCHAR(100)

-- Short fixed values
status VARCHAR(20)          -- 'pending', 'active', 'cancelled'
currency_code VARCHAR(3)    -- 'USD', 'EUR', 'GBP'
country_code VARCHAR(2)     -- 'US', 'GB', 'DE'
```

### CHAR vs VARCHAR

```sql
-- Use CHAR for fixed-length data
country_code CHAR(2)        -- Always 2 characters: 'US', 'GB'
currency_code CHAR(3)       -- Always 3: 'USD', 'EUR'
gender CHAR(1)              -- 'M', 'F', 'O'

-- Use VARCHAR for variable length
email VARCHAR(255)          -- Varies: a@b.com to long@company.com
name VARCHAR(100)           -- Varies in length
```

**Performance**: CHAR is slightly faster for fixed-length lookups, but difference is negligible.

---

## Date and Time Types

```sql
-- Date only (no time)
birth_date DATE             -- 1990-01-15

-- Date and time (no timezone)
created_at TIMESTAMP        -- 2025-01-15 14:30:00

-- Date and time (with timezone) - RECOMMENDED
created_at TIMESTAMPTZ      -- 2025-01-15 14:30:00+00
event_start TIMESTAMPTZ     -- Always store in UTC

-- Time only
business_hours_start TIME   -- 09:00:00
```

**Best Practice**: Always use TIMESTAMPTZ (timestamp with timezone) for datetime fields. Store in UTC, convert to user timezone in application.

**Common Datetime Columns**:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
deleted_at TIMESTAMPTZ      -- Soft delete (nullable)
last_login_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
```

---

## Boolean Type

```sql
-- Use BOOLEAN for yes/no, true/false
is_active BOOLEAN NOT NULL DEFAULT TRUE
has_subscription BOOLEAN NOT NULL DEFAULT FALSE
is_verified BOOLEAN NOT NULL DEFAULT FALSE

-- ❌ Don't use INTEGER for booleans
is_active INTEGER          -- Wrong: wastes 3 bytes, less clear
```

**Naming Convention**: Prefix with `is_`, `has_`, `can_`, or `should_` for clarity.

---

## JSON Types

```sql
-- PostgreSQL JSON types
metadata JSON               -- JSON text (slower)
metadata JSONB              -- Binary JSON (faster, indexable) ✅

-- Use JSONB for:
settings JSONB              -- User preferences
attributes JSONB            -- Product attributes
metadata JSONB              -- Flexible data
audit_data JSONB            -- Log entries
```

**JSONB Indexes**:
```sql
-- Index specific JSON keys
CREATE INDEX idx_users_settings_theme 
ON users((settings->>'theme'));

-- GIN index for full JSON search
CREATE INDEX idx_products_attributes 
ON products USING GIN(attributes);
```

---

## Binary Types

```sql
-- Binary data (files, images, encrypted data)
profile_picture BYTEA       -- Small files only (< 1MB)
encrypted_ssn BYTEA         -- Encrypted data
file_hash BYTEA             -- SHA256 hash
```

**Best Practice**: Store large files (images, documents) in object storage (S3, Azure Blob) and store URLs in database:
```sql
profile_picture_url VARCHAR(500)  -- Better for large files
document_url VARCHAR(500)
```

---

## UUID Type

```sql
-- Use UUID for globally unique identifiers
user_id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- When to use UUID:
-- 1. Distributed systems (avoid ID conflicts)
-- 2. Security (non-sequential IDs)
-- 3. Merging databases
```

**UUID vs INT Performance**:
- UUID: 16 bytes (larger indexes, slower joins)
- INT: 4 bytes (smaller, faster)
- BIGINT: 8 bytes (middle ground)

Use UUID when uniqueness across systems is critical, otherwise use BIGINT for IDs.

---

## Array Types (PostgreSQL)

```sql
-- Arrays for multi-value columns
tags TEXT[]                 -- ['postgresql', 'database', 'sql']
allowed_ips INET[]          -- ['192.168.1.1', '10.0.0.1']
features VARCHAR(100)[]     -- Product features
```

**When to use arrays**:
- Small, fixed set of values
- Rarely queried individually
- Performance-critical (avoid joins)

**When NOT to use arrays**:
- Need to query individual items frequently
- Maintain referential integrity
- Complex relationships

---

## Enum Types

```sql
-- PostgreSQL enum type
CREATE TYPE order_status AS ENUM (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    status order_status NOT NULL DEFAULT 'pending'
);
```

**Pros**: Type-safe, efficient storage
**Cons**: Hard to modify, database-specific

**Alternative: CHECK constraint**:
```sql
status VARCHAR(20) NOT NULL DEFAULT 'pending',
CONSTRAINT ck_order_status CHECK (
    status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
)
```

---

## Special Data Types

### IP Addresses (PostgreSQL)
```sql
ip_address INET             -- IPv4 or IPv6
ip_address CIDR             -- Network address with subnet
```

### Geographic Data
```sql
-- PostGIS extension for geographic data
location GEOMETRY(POINT, 4326)  -- Latitude/longitude
area GEOMETRY(POLYGON, 4326)    -- Boundaries
```

### Money Type (PostgreSQL)
```sql
-- Money type (deprecated - use DECIMAL instead)
price MONEY                 -- ❌ Avoid: limited precision, locale-dependent

-- ✅ Use DECIMAL instead
price DECIMAL(10, 2)        -- Better: Precise, portable
```

---

## Type Selection Decision Tree

```
What kind of data?

INTEGER?
  ├─ Small range (-32K to 32K)? → SMALLINT
  ├─ Normal range (-2B to 2B)? → INTEGER
  └─ Large range or distributed? → BIGINT

DECIMAL?
  ├─ Money? → DECIMAL(10, 2) or DECIMAL(19, 4)
  ├─ Percentage? → DECIMAL(5, 4)
  └─ Scientific? → Consider precision needs

STRING?
  ├─ Fixed length? → CHAR(n)
  ├─ Known max < 1000? → VARCHAR(n)
  └─ Unknown/large? → TEXT

DATETIME?
  ├─ Date only? → DATE
  ├─ Time only? → TIME
  └─ Date + Time? → TIMESTAMPTZ (with timezone)

YES/NO?
  └─ BOOLEAN

UNIQUE ID?
  ├─ Single database? → SERIAL/BIGSERIAL
  └─ Distributed? → UUID
```

---

## Database-Specific Considerations

### PostgreSQL
- Prefers TEXT over VARCHAR for variable strings
- JSONB is faster than JSON
- Native UUID type
- Rich type system (arrays, enums, ranges, etc.)

### MySQL
- VARCHAR requires size specification
- JSON support (no JSONB)
- Use BIGINT UNSIGNED for IDs when possible

### SQL Server
- NVARCHAR for Unicode (international)
- VARCHAR for ASCII only
- DATETIME2 instead of DATETIME

---

## Common Mistakes

### Mistake 1: Over-sized VARCHAR
```sql
❌ name VARCHAR(255)        -- When max is 50
✅ name VARCHAR(100)        -- Right-sized
```

### Mistake 2: Using FLOAT for Money
```sql
❌ price FLOAT
✅ price DECIMAL(10, 2)
```

### Mistake 3: Not Using NOT NULL
```sql
❌ email VARCHAR(255)       -- Allows NULL (confusion)
✅ email VARCHAR(255) NOT NULL  -- Clear requirement
```

### Mistake 4: Using TEXT When VARCHAR Works
```sql
❌ status TEXT              -- Overkill for small values
✅ status VARCHAR(20)       -- Sized appropriately
```

### Mistake 5: BIGINT Everywhere
```sql
❌ age BIGINT               -- Wastes 6 bytes
✅ age SMALLINT             -- Appropriate size
```

---

## Performance Impact

**Storage Comparison** (10 million rows):

| Type | Size per Row | Total Size |
|------|--------------|------------|
| SMALLINT | 2 bytes | 20 MB |
| INTEGER | 4 bytes | 40 MB |
| BIGINT | 8 bytes | 80 MB |
| VARCHAR(100) | Avg 25 bytes | 250 MB |
| TEXT | Avg 200 bytes | 2 GB |
| UUID | 16 bytes | 160 MB |

**Choosing the right type** = Faster queries + Less storage + Better indexes

---

## Best Practices Summary

1. ✅ Use DECIMAL for money, never FLOAT
2. ✅ Size VARCHAR appropriately (not always 255)
3. ✅ Use TIMESTAMPTZ for datetime (store UTC)
4. ✅ Use BOOLEAN for yes/no (not INTEGER)
5. ✅ Choose INTEGER size based on expected range
6. ✅ Use TEXT only when size is truly unpredictable
7. ✅ Add NOT NULL constraints when data is required
8. ✅ Consider future growth but don't over-provision
9. ✅ Use UUID for distributed systems, BIGINT otherwise
10. ✅ Test storage and performance implications

---

## Validation Script

Use `scripts/datatype_optimizer.py` to analyze your schema and get data type recommendations.
