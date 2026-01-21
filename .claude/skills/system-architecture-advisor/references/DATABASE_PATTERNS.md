# Database Design and Data Modeling Patterns

## Database Selection Guide

### SQL vs NoSQL Decision Matrix

| Factor | SQL (PostgreSQL, MySQL) | NoSQL (MongoDB, DynamoDB) |
|--------|------------------------|---------------------------|
| **Data Structure** | Structured, relational | Flexible, document/key-value |
| **Schema** | Fixed, migrations needed | Dynamic, schemaless |
| **Transactions** | ACID, strong consistency | Eventual consistency (usually) |
| **Scaling** | Vertical, read replicas | Horizontal sharding native |
| **Queries** | SQL, powerful joins | Limited joins, denormalization |
| **Use Cases** | Business apps, complex queries | Real-time, high-scale, flexible schema |

### When to Choose SQL

**Best for:**
- Complex relationships between entities
- ACID transactions required
- Data integrity critical (financial, healthcare)
- Complex reporting and analytics
- Mature tooling needed

**Popular Options:**
1. **PostgreSQL**
   - Rich feature set (JSON, full-text search, geospatial)
   - Strong ACID compliance
   - Active community
   - Extensions (PostGIS, TimescaleDB)

2. **MySQL**
   - Proven at scale
   - Wide hosting support
   - Good for read-heavy workloads

3. **SQL Server**
   - Enterprise features
   - Excellent tooling (SSMS)
   - Azure integration

### When to Choose NoSQL

**Best for:**
- Flexible or evolving schema
- High write throughput
- Massive scale (millions of users)
- Simple access patterns
- Real-time applications

**Popular Options:**

1. **MongoDB** (Document Store)
   - JSON-like documents
   - Flexible schema
   - Rich query language
   - Use case: Content management, catalogs

2. **Redis** (Key-Value + Cache)
   - In-memory, sub-millisecond latency
   - Pub/sub, streams
   - Use case: Caching, sessions, real-time

3. **DynamoDB** (Key-Value)
   - Fully managed by AWS
   - Automatic scaling
   - Single-digit millisecond latency
   - Use case: Gaming, IoT, mobile backends

4. **ElasticSearch** (Search Engine)
   - Full-text search
   - Analytics
   - Use case: Search functionality, logs, metrics

---

## SQL Database Design Patterns

### Normalization Levels

**1NF (First Normal Form):**
- No repeating groups
- Atomic values only

**Example:**
```sql
-- ❌ Not 1NF (multiple values in one column)
CREATE TABLE orders (
  id INT,
  products VARCHAR -- "Apple, Banana, Orange"
);

-- ✅ 1NF (separate rows)
CREATE TABLE order_items (
  order_id INT,
  product VARCHAR
);
```

**2NF (Second Normal Form):**
- 1NF + no partial dependencies

**3NF (Third Normal Form):**
- 2NF + no transitive dependencies

**BCNF (Boyce-Codd Normal Form):**
- Stricter version of 3NF

**When to Denormalize:**
- Read performance critical
- Data rarely changes
- Complex joins expensive
- Example: Storing user name with orders for faster display

---

### Common Table Patterns

#### Users and Authentication

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Session management
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

#### Soft Delete Pattern

```sql
-- Add deleted_at column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Query only active records
SELECT * FROM users WHERE deleted_at IS NULL;

-- Create view for convenience
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- Soft delete
UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?;

-- Restore
UPDATE users SET deleted_at = NULL WHERE id = ?;
```

#### Polymorphic Associations

**Scenario:** Comments can belong to posts or products.

**Option 1: Separate Tables (Recommended)**
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  content TEXT,
  user_id UUID REFERENCES users(id)
);

CREATE TABLE product_comments (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  content TEXT,
  user_id UUID REFERENCES users(id)
);
```

**Option 2: Polymorphic (Less type-safe)**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  commentable_type VARCHAR(50), -- 'post' or 'product'
  commentable_id UUID,
  content TEXT,
  user_id UUID REFERENCES users(id)
);
```

**Pros/Cons:**
- Option 1: Type-safe, better integrity, harder to query all comments
- Option 2: Flexible, easier to query all, loses referential integrity

---

### Advanced PostgreSQL Features

#### JSON Columns

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  attributes JSONB -- Searchable JSON
);

-- Insert
INSERT INTO products (name, attributes) VALUES 
  ('Laptop', '{"brand": "Apple", "ram": "16GB", "storage": "512GB"}');

-- Query
SELECT * FROM products 
WHERE attributes->>'brand' = 'Apple';

-- Index JSON field
CREATE INDEX idx_products_brand ON products ((attributes->>'brand'));

-- Update nested JSON
UPDATE products 
SET attributes = jsonb_set(attributes, '{ram}', '"32GB"')
WHERE id = ?;
```

#### Full-Text Search

```sql
-- Add tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Update search vector (trigger or manually)
UPDATE articles 
SET search_vector = to_tsvector('english', title || ' ' || content);

-- Search
SELECT *, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql & performance') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

#### Partitioning (Time-Series Data)

```sql
CREATE TABLE logs (
  id BIGSERIAL,
  created_at TIMESTAMP NOT NULL,
  level VARCHAR(10),
  message TEXT
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE logs_2025_01 PARTITION OF logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE logs_2025_02 PARTITION OF logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Queries automatically route to correct partition
SELECT * FROM logs 
WHERE created_at >= '2025-01-15' 
  AND created_at < '2025-01-20';
```

---

## NoSQL Design Patterns

### MongoDB Schema Design

**Rule:** Design schema based on access patterns, not normalization.

#### Embedded Documents (Denormalization)

```javascript
// User with embedded address
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "orders": [
    { "id": "order-1", "total": 99.99, "date": ISODate("2025-01-15") },
    { "id": "order-2", "total": 149.99, "date": ISODate("2025-02-20") }
  ]
}
```

**Pros:**
- Single query to get all data
- Fast reads

**Cons:**
- Document size limits (16MB in MongoDB)
- Update complexity

**When to embed:**
- 1-to-few relationships
- Data rarely changes
- Often accessed together

#### Referenced Documents (Normalization)

```javascript
// User
{
  "_id": ObjectId("user-1"),
  "name": "John Doe",
  "email": "john@example.com"
}

// Orders (separate collection)
{
  "_id": ObjectId("order-1"),
  "user_id": ObjectId("user-1"),
  "items": [...],
  "total": 99.99
}
```

**When to reference:**
- 1-to-many relationships
- Data changes frequently
- Large documents
- Many-to-many relationships

### DynamoDB Design Patterns

**Key Concepts:**
- Partition Key (PK): Determines partition placement
- Sort Key (SK): Enables range queries, sorting
- GSI (Global Secondary Index): Alternative access patterns
- LSI (Local Secondary Index): Different sort key

#### Single Table Design

**Pattern:** Store multiple entity types in one table.

```
PK                SK                  attributes
------------------------------------------------------------------
USER#123          PROFILE             name, email, created_at
USER#123          ORDER#001           total, status, date
USER#123          ORDER#002           total, status, date
PRODUCT#456       METADATA            name, price, stock
PRODUCT#456       REVIEW#789          rating, text, user_id
```

**Queries:**
```
// Get user profile
PK = USER#123, SK = PROFILE

// Get all user orders
PK = USER#123, SK begins_with ORDER#

// Get specific order
PK = USER#123, SK = ORDER#001

// Get product with reviews
PK = PRODUCT#456
```

**Benefits:**
- Cost-effective (fewer tables)
- Related data retrieved together
- Consistent throughput

**Drawbacks:**
- Complex design
- Careful indexing needed

---

## Caching Strategies

### Cache-Aside (Lazy Loading)

**Flow:**
```
1. Application checks cache
2. If hit: Return cached data
3. If miss: Query database
4. Store result in cache
5. Return data
```

**Implementation:**
```typescript
async function getUser(id: string): Promise<User> {
  const cacheKey = `user:${id}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const user = await db.users.findById(id);
  
  // Store in cache
  await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1 hour TTL
  
  return user;
}
```

**Pros:**
- Only cache what's needed
- Cache misses don't impact availability

**Cons:**
- Initial requests slow (cache miss)
- Stale data possible

### Write-Through

**Flow:**
```
1. Application writes to cache
2. Cache writes to database
3. Return success
```

**Pros:**
- Always up-to-date cache
- Consistent

**Cons:**
- Write latency
- Cache bloat (caches everything)

### Write-Behind (Write-Back)

**Flow:**
```
1. Application writes to cache
2. Return success immediately
3. Cache writes to database asynchronously
```

**Pros:**
- Fast writes
- Batch writes possible

**Cons:**
- Data loss risk (if cache fails before DB write)
- Complex implementation

---

## Indexing Best Practices

### Index Types

**B-Tree (Default):**
- Equality and range queries
- Most common type
```sql
CREATE INDEX idx_users_email ON users(email);
```

**Hash:**
- Equality queries only (no ranges)
- Faster for exact matches
```sql
CREATE INDEX idx_sessions_token ON sessions USING HASH(token);
```

**GIN (Generalized Inverted Index):**
- Full-text search, JSONB, arrays
```sql
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_attrs ON products USING GIN(attributes);
```

**GiST (Generalized Search Tree):**
- Geometric, full-text, nearest neighbor
```sql
CREATE INDEX idx_locations_point ON locations USING GIST(coordinates);
```

### Composite Indexes

**Order matters!**

```sql
-- Good for: WHERE category = ? AND price > ?
CREATE INDEX idx_products_cat_price ON products(category, price);

-- Good for: WHERE category = ?
-- Also works for above query

-- NOT optimal for: WHERE price > ?
-- Would need separate index on price
```

### Index Maintenance

```sql
-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM users WHERE email = 'test@example.com';

-- Find missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100  -- Column has many distinct values
  AND tablename NOT IN (
    SELECT tablename FROM pg_indexes
    WHERE schemaname = 'public'
  );

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan < 100  -- Rarely used
ORDER BY idx_scan;

-- Drop unused index
DROP INDEX idx_rarely_used;
```

---

## Data Migration Patterns

### Zero-Downtime Migrations

**Expand-Contract Pattern:**

**Phase 1 - Expand:** Add new column/table
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

**Phase 2 - Dual Write:** Write to both old and new
```typescript
await db.users.update({
  id: userId,
  email: newEmail,        // Old column
  phone_number: newPhone  // New column
});
```

**Phase 3 - Migrate Data:** Backfill
```sql
UPDATE users SET phone_number = legacy_phone WHERE phone_number IS NULL;
```

**Phase 4 - Switch Reads:** Read from new column
```typescript
const user = await db.users.findById(id);
// Use user.phone_number instead of user.legacy_phone
```

**Phase 5 - Contract:** Remove old column
```sql
ALTER TABLE users DROP COLUMN legacy_phone;
```

### Multi-Tenant Patterns

**Option 1: Separate Databases**
```
Tenant A → Database A
Tenant B → Database B
Tenant C → Database C
```

**Pros:**
- Strong isolation
- Easy to back up per tenant
- Can scale per tenant

**Cons:**
- Management overhead
- Higher costs

**Option 2: Shared Database, Separate Schemas**
```
Database
├─ schema_tenant_a
├─ schema_tenant_b
└─ schema_tenant_c
```

**Pros:**
- Lower cost than separate DBs
- Easier management

**Cons:**
- One database to manage
- Limited isolation

**Option 3: Shared Database, Shared Tables (Row-Level)**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- Key field!
  ...
);

-- Row-Level Security
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

**Pros:**
- Most cost-effective
- Easy to add tenants

**Cons:**
- Query complexity (always filter by tenant_id)
- Risk of data leakage
- Harder to scale individual tenants

---

## Real-World Schema Examples

### E-Commerce Schema

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL, -- 'pending', 'paid', 'shipped', 'delivered'
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

-- Inventory Tracking
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  type VARCHAR(20), -- 'purchase', 'sale', 'return', 'adjustment'
  quantity INT NOT NULL,
  reference_id UUID, -- order_id for sales
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SaaS Multi-Tenant Schema

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  max_users INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (with tenant association)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'member', 'viewer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email) -- Email unique per tenant
);

-- Projects (tenant-scoped)
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## Performance Optimization Tips

### Query Optimization

**1. Use EXPLAIN ANALYZE**
```sql
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE user_id = '123' 
  AND created_at > '2025-01-01';
```

**2. Avoid SELECT ***
```sql
-- ❌ Bad
SELECT * FROM users;

-- ✅ Good
SELECT id, name, email FROM users;
```

**3. Use Indexes Wisely**
```sql
-- Good: Indexed column
SELECT * FROM users WHERE email = 'test@example.com';

-- Bad: Function on indexed column
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- Good: Functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

**4. Pagination**
```sql
-- ❌ Bad: Offset becomes slow with large offsets
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000;

-- ✅ Good: Cursor-based pagination
SELECT * FROM posts 
WHERE created_at < '2025-01-15T10:00:00Z' 
ORDER BY created_at DESC 
LIMIT 20;
```

### Connection Pooling

```typescript
// Using pgbouncer or pg-pool
const pool = new Pool({
  host: 'localhost',
  database: 'myapp',
  max: 20,               // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Application code
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
} finally {
  client.release(); // Return to pool
}
```

---

## Anti-Patterns to Avoid

**1. Too Many Joins**
- Avoid: 5+ table joins
- Solution: Denormalize or cache

**2. Missing Indexes**
- Symptom: Slow queries on large tables
- Solution: Add indexes on WHERE clauses

**3. Over-Indexing**
- Symptom: Slow writes
- Solution: Drop unused indexes

**4. Not Using Transactions**
- Risk: Data inconsistency
- Solution: Wrap related operations in transactions

**5. Storing Files in Database**
- Problem: Database bloat
- Solution: Use S3/object storage, store URLs in DB

**6. Using ORM for Everything**
- Problem: Inefficient queries
- Solution: Use raw SQL for complex queries

---

## Best Practices Checklist

- [ ] Use appropriate database type (SQL vs NoSQL)
- [ ] Normalize (then selectively denormalize for performance)
- [ ] Add indexes on frequently queried columns
- [ ] Use foreign keys for referential integrity
- [ ] Enable connection pooling
- [ ] Set up read replicas for read-heavy workloads
- [ ] Implement caching strategy
- [ ] Use transactions for atomic operations
- [ ] Regular backups and disaster recovery plan
- [ ] Monitor slow queries and optimize
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Implement soft deletes for audit trails
- [ ] Version migrations (e.g., with Flyway, Liquibase)
- [ ] Set up database monitoring (pg_stat_statements)
- [ ] Plan for horizontal scaling (sharding strategy)
