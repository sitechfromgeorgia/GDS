# Products API Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Base URL**: Database queries to `products` table
**Authentication**: Required (all endpoints)

---

## Overview

The Products API provides comprehensive product management functionality for the Distribution Management System. Products are organized by categories and can be filtered, searched, and paginated efficiently.

---

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'unit',  -- 'unit', 'kg', 'liter', etc.
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity > 0),
  max_order_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);
CREATE INDEX idx_products_created_at ON products(created_at);
```

---

## Endpoints

### 1. List Products

**Method**: `GET`
**Query**: `supabase.from('products').select()`
**Description**: Retrieves paginated list of products with filtering and sorting

**Query Parameters**:
```typescript
{
  page?: number                    // Page number (default: 1)
  limit?: number                   // Items per page (default: 20, max: 100)
  sortBy?: string                  // Sort field (default: 'name')
  sortOrder?: 'asc' | 'desc'       // Sort direction (default: 'asc')
  categoryId?: string              // Filter by category UUID
  search?: string                  // Search in name/description
  isAvailable?: boolean            // Filter by availability
  minPrice?: number                // Minimum price filter
  maxPrice?: number                // Maximum price filter
}
```

**Response** (Success - 200):
```typescript
{
  products: [
    {
      id: string
      name: string
      description: string | null
      category_id: string | null
      category: {
        id: string
        name: string
        is_active: boolean
      } | null
      price: number
      unit: string
      sku: string | null
      barcode: string | null
      image_url: string | null
      is_available: boolean
      stock_quantity: number
      min_order_quantity: number
      max_order_quantity: number | null
      created_at: string
      updated_at: string
    }
  ],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  },
  categories: [
    {
      id: string
      name: string
      product_count: number
    }
  ]
}
```

**Example Usage**:
```typescript
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

async function getProducts(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  categoryId?: string
  search?: string
  isAvailable?: boolean
  minPrice?: number
  maxPrice?: number
}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    categoryId,
    search,
    isAvailable,
    minPrice,
    maxPrice
  } = params

  let query = supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        is_active
      )
    `, { count: 'exact' })

  // Apply filters
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (isAvailable !== undefined) {
    query = query.eq('is_available', isAvailable)
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  const totalPages = count ? Math.ceil(count / limit) : 0

  return {
    products: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }
}
```

---

### 2. Get Product by ID

**Method**: `GET`
**Query**: `supabase.from('products').select().eq('id', id).single()`
**Description**: Retrieves a single product by its UUID

**Path Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Response** (Success - 200):
```typescript
{
  id: string
  name: string
  description: string | null
  category_id: string | null
  category: {
    id: string
    name: string
    description: string | null
    is_active: boolean
  } | null
  price: number
  unit: string
  sku: string | null
  barcode: string | null
  image_url: string | null
  is_available: boolean
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity: number | null
  created_at: string
  updated_at: string
}
```

**Response** (Not Found - 404):
```typescript
{
  error: {
    message: "Product not found"
    code: "PGRST116"
  }
}
```

**Example Usage**:
```typescript
async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Product not found')
    }
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data
}
```

---

### 3. Create Product

**Method**: `POST`
**Query**: `supabase.from('products').insert()`
**Description**: Creates a new product
**Permission**: Admin only

**Request Body**:
```typescript
{
  name: string                      // Required, max 255 chars
  description?: string              // Optional
  category_id?: string              // Optional, must be valid category UUID
  price: number                     // Required, must be >= 0
  unit?: string                     // Default: 'unit'
  sku?: string                      // Optional, must be unique
  barcode?: string                  // Optional
  image_url?: string                // Optional
  is_available?: boolean            // Default: true
  stock_quantity?: number           // Default: 0, must be >= 0
  min_order_quantity?: number       // Default: 1, must be > 0
  max_order_quantity?: number       // Optional
}
```

**Response** (Success - 201):
```typescript
{
  id: string
  name: string
  description: string | null
  category_id: string | null
  price: number
  unit: string
  sku: string | null
  barcode: string | null
  image_url: string | null
  is_available: boolean
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity: number | null
  created_at: string
  updated_at: string
}
```

**Response** (Validation Error - 400):
```typescript
{
  error: {
    message: string
    details: string
    code: string
  }
}
```

**Example Usage**:
```typescript
async function createProduct(product: {
  name: string
  description?: string
  category_id?: string
  price: number
  unit?: string
  sku?: string
  barcode?: string
  image_url?: string
  is_available?: boolean
  stock_quantity?: number
  min_order_quantity?: number
  max_order_quantity?: number
}) {
  // Validate price
  if (product.price < 0) {
    throw new Error('Price must be non-negative')
  }

  // Validate stock quantity
  if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
    throw new Error('Stock quantity must be non-negative')
  }

  // Validate min order quantity
  if (product.min_order_quantity !== undefined && product.min_order_quantity <= 0) {
    throw new Error('Minimum order quantity must be positive')
  }

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {  // Unique constraint violation
      throw new Error('SKU already exists')
    }
    throw new Error(`Failed to create product: ${error.message}`)
  }

  return data
}
```

---

### 4. Update Product

**Method**: `PATCH`
**Query**: `supabase.from('products').update()`
**Description**: Updates an existing product
**Permission**: Admin only

**Path Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Request Body** (partial update allowed):
```typescript
{
  name?: string
  description?: string
  category_id?: string | null
  price?: number
  unit?: string
  sku?: string
  barcode?: string
  image_url?: string
  is_available?: boolean
  stock_quantity?: number
  min_order_quantity?: number
  max_order_quantity?: number | null
}
```

**Response** (Success - 200):
```typescript
{
  id: string
  name: string
  description: string | null
  category_id: string | null
  price: number
  unit: string
  sku: string | null
  barcode: string | null
  image_url: string | null
  is_available: boolean
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity: number | null
  created_at: string
  updated_at: string
}
```

**Example Usage**:
```typescript
async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Product not found')
    }
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return data
}
```

---

### 5. Delete Product

**Method**: `DELETE`
**Query**: `supabase.from('products').delete()`
**Description**: Deletes a product (soft delete recommended)
**Permission**: Admin only

**Path Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Response** (Success - 204):
```typescript
{
  // No content
}
```

**Example Usage (Soft Delete - Recommended)**:
```typescript
async function deleteProduct(id: string) {
  // Soft delete by setting is_available to false
  const { data, error } = await supabase
    .from('products')
    .update({
      is_available: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  return data
}
```

**Example Usage (Hard Delete - Use with Caution)**:
```typescript
async function hardDeleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    if (error.code === '23503') {  // Foreign key constraint
      throw new Error('Cannot delete product: it is referenced in existing orders')
    }
    throw new Error(`Failed to delete product: ${error.message}`)
  }
}
```

---

### 6. Search Products

**Method**: `GET`
**Query**: Full-text search with PostgreSQL
**Description**: Advanced product search with fuzzy matching

**Query Parameters**:
```typescript
{
  query: string                    // Search query (required)
  limit?: number                   // Max results (default: 20)
  categoryId?: string              // Filter by category
  isAvailable?: boolean            // Filter by availability
}
```

**Response** (Success - 200):
```typescript
{
  products: Product[]
  count: number
  query: string
}
```

**Example Usage**:
```typescript
async function searchProducts(
  query: string,
  options?: {
    limit?: number
    categoryId?: string
    isAvailable?: boolean
  }
) {
  const { limit = 20, categoryId, isAvailable = true } = options || {}

  let dbQuery = supabase
    .from('products')
    .select(`
      *,
      categories (*)
    `, { count: 'exact' })
    .eq('is_available', isAvailable)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(limit)

  if (categoryId) {
    dbQuery = dbQuery.eq('category_id', categoryId)
  }

  const { data, error, count } = await dbQuery

  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }

  return {
    products: data || [],
    count: count || 0,
    query
  }
}
```

---

### 7. Get Products by Category

**Method**: `GET`
**Query**: Filter products by category
**Description**: Retrieves all products in a specific category

**Path Parameters**:
```typescript
{
  categoryId: string  // Category UUID
}
```

**Query Parameters**:
```typescript
{
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isAvailable?: boolean
}
```

**Response**: Same as List Products endpoint

**Example Usage**:
```typescript
async function getProductsByCategory(
  categoryId: string,
  options?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    isAvailable?: boolean
  }
) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    isAvailable = true
  } = options || {}

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('products')
    .select(`
      *,
      categories (*)
    `, { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('is_available', isAvailable)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return {
    products: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPreviousPage: page > 1
    }
  }
}
```

---

### 8. Update Stock Quantity

**Method**: `PATCH`
**Query**: Atomic stock update
**Description**: Updates product stock quantity atomically
**Permission**: Admin, Restaurant (for their products)

**Path Parameters**:
```typescript
{
  id: string  // Product UUID
}
```

**Request Body**:
```typescript
{
  quantity: number      // New stock quantity (must be >= 0)
  operation?: 'set' | 'increment' | 'decrement'  // Default: 'set'
}
```

**Response** (Success - 200):
```typescript
{
  id: string
  stock_quantity: number
  updated_at: string
}
```

**Example Usage**:
```typescript
async function updateStock(
  id: string,
  quantity: number,
  operation: 'set' | 'increment' | 'decrement' = 'set'
) {
  let newQuantity: number

  if (operation === 'set') {
    newQuantity = quantity
  } else {
    // Fetch current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', id)
      .single()

    if (!product) {
      throw new Error('Product not found')
    }

    if (operation === 'increment') {
      newQuantity = product.stock_quantity + quantity
    } else {
      newQuantity = Math.max(0, product.stock_quantity - quantity)
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, stock_quantity, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to update stock: ${error.message}`)
  }

  return data
}
```

---

## TypeScript Types

```typescript
export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string | null
  category?: Category
  price: number
  unit: string
  sku: string | null
  barcode: string | null
  image_url: string | null
  is_available: boolean
  stock_quantity: number
  min_order_quantity: number
  max_order_quantity: number | null
  created_at: string
  updated_at: string
}

export interface ProductFilterInput {
  categoryId?: string
  search?: string
  isAvailable?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface ProductCreateInput {
  name: string
  description?: string
  category_id?: string
  price: number
  unit?: string
  sku?: string
  barcode?: string
  image_url?: string
  is_available?: boolean
  stock_quantity?: number
  min_order_quantity?: number
  max_order_quantity?: number
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  categories?: Array<{
    id: string
    name: string
    product_count: number
  }>
}
```

---

## Performance Optimizations

### 1. Database Indexes

All product queries benefit from these indexes:
- `idx_products_category_id` - Fast category filtering
- `idx_products_is_available` - Fast availability filtering
- `idx_products_category_available` - Combined category + availability
- `idx_products_created_at` - Fast sorting by date

### 2. Query Optimization

```typescript
// ❌ BAD: Fetches all columns unnecessarily
const { data } = await supabase.from('products').select('*')

// ✅ GOOD: Only fetch needed columns
const { data } = await supabase
  .from('products')
  .select('id, name, price, image_url, is_available')
```

### 3. Pagination

Always use `.range()` for pagination:
```typescript
const from = (page - 1) * limit
const to = from + limit - 1
query = query.range(from, to)
```

### 4. Caching

Product data is cached with React Query:
```typescript
// Products have 5-minute stale time
useQuery({
  queryKey: ['products', filters],
  queryFn: () => getProducts(filters),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000   // 10 minutes
})
```

---

## Error Handling

```typescript
async function handleProductError(error: any) {
  switch (error.code) {
    case 'PGRST116':
      return 'Product not found'
    case '23505':
      return 'SKU already exists'
    case '23503':
      return 'Cannot delete: product is referenced in orders'
    case '23514':
      return 'Validation error: check constraints'
    default:
      return 'An unexpected error occurred'
  }
}
```

---

## Related Files

- [products.ts](cci:1://file:///c:/Users/SITECH/Desktop/DEV/Distribution-Managment/frontend/src/lib/validators/products/products.ts:0:0-0:0) - Validation schemas
- [useProductCatalog.ts](cci:1://file:///c:/Users/SITECH/Desktop/DEV/Distribution-Managment/frontend/src/hooks/useProductCatalog.ts:0:0-0:0) - React Query hook
- [ProductCard.tsx](cci:1://file:///c:/Users/SITECH/Desktop/DEV/Distribution-Managment/frontend/src/components/catalog/ProductCard.tsx:0:0-0:0) - UI component

---

**Last Updated**: 2025-11-05
**Maintained By**: Development Team
**Status**: ✅ Production Ready
