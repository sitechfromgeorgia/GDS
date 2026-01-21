# Database Normalization Guide

## Overview
Normalization is the process of organizing database tables to reduce redundancy and improve data integrity. This guide covers the most important normal forms with practical examples.

## Normal Forms Summary

| Form | Key Requirement | Common Issues |
|------|----------------|---------------|
| **1NF** | Atomic values only | Arrays, comma-separated values |
| **2NF** | Full dependency on PK | Partial dependencies in composite keys |
| **3NF** | No transitive dependencies | Non-key attributes depending on other non-key attributes |
| **BCNF** | Every determinant is a candidate key | Rare in practice |

**Start with 3NF for most applications**

---

## First Normal Form (1NF)

### Requirements
- Each column contains atomic (indivisible) values
- No repeating groups or arrays
- Each row is unique
- Order doesn't matter

### ❌ Violates 1NF
```sql
CREATE TABLE customers_bad (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone_numbers VARCHAR(255)  -- "555-1234, 555-5678" ❌
);
```

### ✅ Satisfies 1NF
```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE customer_phones (
    phone_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    phone_number VARCHAR(20),
    phone_type VARCHAR(20)  -- 'mobile', 'home', 'work'
);
```

---

## Second Normal Form (2NF)

### Requirements
- Must be in 1NF
- All non-key attributes must depend on the ENTIRE primary key (relevant for composite keys)
- No partial dependencies

### ❌ Violates 2NF
```sql
CREATE TABLE order_items_bad (
    order_id INTEGER,
    product_id INTEGER,
    product_name VARCHAR(100),    -- ❌ Depends only on product_id
    product_price DECIMAL(10,2),  -- ❌ Depends only on product_id
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);
```

**Problem**: `product_name` and `product_price` depend only on `product_id`, not on the full composite key.

### ✅ Satisfies 2NF
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    base_price DECIMAL(10,2)
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER,
    price_at_purchase DECIMAL(10,2)  -- Historical price
);
```

---

## Third Normal Form (3NF)

### Requirements
- Must be in 2NF
- No transitive dependencies (non-key attributes shouldn't depend on other non-key attributes)

### ❌ Violates 3NF
```sql
CREATE TABLE employees_bad (
    employee_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER,
    department_name VARCHAR(100),    -- ❌ Transitive dependency
    department_location VARCHAR(100) -- ❌ Transitive dependency
);
```

**Problem**: `department_name` and `department_location` depend on `department_id`, not directly on `employee_id`.

### ✅ Satisfies 3NF
```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER REFERENCES departments(department_id)
);
```

---

## Boyce-Codd Normal Form (BCNF)

### Requirements
- Must be in 3NF
- Every determinant must be a candidate key
- Stricter than 3NF (rarely needed in practice)

**Use case**: Very specific scenarios with overlapping candidate keys. Most applications don't need BCNF.

---

## When to Denormalize

### Valid Denormalization Scenarios

**1. Lookup/Reference Tables (Stable Data)**
```sql
-- OK to denormalize country codes (rarely change)
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    street VARCHAR(200),
    city VARCHAR(100),
    country_code VARCHAR(2),     -- Denormalized
    country_name VARCHAR(100)    -- Denormalized (OK for display)
);
```

**2. Performance-Critical Queries**
```sql
-- Denormalize for read-heavy dashboards
CREATE TABLE order_summary (
    order_id INTEGER PRIMARY KEY,
    customer_name VARCHAR(200),     -- Denormalized
    total_items INTEGER,            -- Calculated
    total_amount DECIMAL(10,2),     -- Calculated
    order_date TIMESTAMP
);

-- Maintain with triggers or scheduled updates
```

**3. Reporting/Analytics Tables**
```sql
-- Separate denormalized reporting schema
CREATE TABLE sales_fact (
    date_id INTEGER,
    product_id INTEGER,
    customer_id INTEGER,
    sales_amount DECIMAL(10,2),
    quantity INTEGER,
    -- Denormalized dimensions for fast queries
    customer_name VARCHAR(200),
    product_name VARCHAR(200),
    category_name VARCHAR(100)
);
```

**Rule**: Keep normalized master tables, create denormalized copies for specific use cases.

---

## Practical Normalization Workflow

### Step 1: List All Data
Write down every piece of data your application needs to store.

### Step 2: Identify Entities
Group related data into logical entities (customers, orders, products, etc.).

### Step 3: Apply 1NF
Ensure all values are atomic. Break down any arrays or repeating groups.

### Step 4: Apply 2NF
Check for partial dependencies on composite keys. Split if needed.

### Step 5: Apply 3NF
Remove transitive dependencies. Create separate tables for indirectly related data.

### Step 6: Verify Relationships
Ensure all relationships are properly represented with foreign keys.

---

## Common Normalization Mistakes

### Mistake 1: Over-Normalization
```sql
-- Too normalized (impractical)
CREATE TABLE person_name_parts (
    person_id INTEGER,
    name_part_type VARCHAR(20),  -- 'first', 'middle', 'last'
    name_part_value VARCHAR(100)
);

-- Better (practical 3NF)
CREATE TABLE persons (
    person_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);
```

### Mistake 2: Storing Calculated Values
```sql
-- Bad: Calculated value (violates normalization)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total DECIMAL(10,2)  -- ❌ Should be calculated: subtotal + tax_amount
);

-- Good: Calculate on read or use computed column
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2)
    -- total calculated in query: SELECT subtotal + tax_amount AS total
);
```

**Exception**: Store calculated values for:
- Historical data (prices at time of purchase)
- Performance-critical aggregations
- Audit trails

### Mistake 3: Natural Keys as Primary Keys
```sql
-- Risky: Using email as primary key
CREATE TABLE users_bad (
    email VARCHAR(255) PRIMARY KEY,  -- ❌ What if user changes email?
    name VARCHAR(100)
);

-- Better: Surrogate key
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100)
);
```

---

## E-Commerce Example (Complete)

### Fully Normalized Schema (3NF)

```sql
-- Customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Products
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL
);

-- Order Items (with historical price)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL  -- Historical price
);

-- Addresses
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    address_type VARCHAR(20),  -- 'billing' or 'shipping'
    street VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100)
);

-- Indexes for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
```

---

## Quick Decision Tree

```
Is data atomic? 
  No → Apply 1NF (split into atomic values)
  Yes ↓

Does table have composite primary key?
  No → Skip to 3NF check
  Yes ↓
    Do non-key columns depend on entire PK?
      No → Apply 2NF (split table)
      Yes ↓

Do non-key columns depend only on PK?
  No → Apply 3NF (extract dependent data to new table)
  Yes → Already in 3NF ✓
```

---

## Best Practices

1. **Start with 3NF**: It's the sweet spot for most applications
2. **Use surrogate keys**: Don't use natural keys as primary keys
3. **Denormalize consciously**: Only when you have clear performance needs
4. **Document decisions**: Record why you denormalized specific data
5. **Keep master tables normalized**: Create denormalized views/tables for reporting
6. **Test queries**: Verify normalization doesn't create performance issues

---

## Tools for Checking Normalization

Use `scripts/normalization_checker.py` to validate your schema's normalization level.
