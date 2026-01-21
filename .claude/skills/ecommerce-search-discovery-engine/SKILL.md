# ecommerce-search-discovery-engine

## SKILL: Build a Production-Ready Search Engine for Georgian Ecommerce (Price Comparison)

**Author Notes:** This skill combines search relevance engineering with practical implementation patterns for a <100k product Georgian marketplace with mixed-script challenges, typo tolerance, and dynamic faceted filtering.

---

## 1. Context & Challenges

### Georgian Market-Specific Challenges

| Challenge | Impact | Solution Strategy |
|-----------|--------|-------------------|
| **Mixed Scripts** | User searches "mobile" (Latin) but catalog has "მობილური" (Georgian) | Transliteration layer + dual-indexing |
| **Typos** | "Iphoen" → "iPhone", "galyaksi" → "გალაქტიკა" | Fuzzy matching + n-gram tokenization |
| **Synonyms** | "Tel" = "Mobile" = "Smartphone", "ტელი" = "მოწყობილობა" | Custom synonym dictionary (Georgian + Latin) |
| **Messy Titles** | "iPhone 15 Pro Max 256GB Space Black A2847" (attributes mixed) | NLP-based attribute extraction + JSONB storage |
| **Dynamic Attributes** | Color, RAM, Storage, Brand vary per product category | Schema-less JSONB facets + smart filtering |

### Performance Targets

- **Search latency:** <100ms for autocomplete (p95)
- **Full-text query:** <300ms for complex faceted filters (p95)
- **Product catalog size:** <100k SKUs (scales to ~500k with optimization)
- **Concurrent users:** 1k concurrent searches during peak

---

## 2. Engine Selection & Recommendation

### Comparison Matrix: PostgreSQL vs MeiliSearch vs Elasticsearch

| Criteria | PostgreSQL FTS | MeiliSearch | Elasticsearch |
|----------|----------------|-------------|---------------|
| **Setup Complexity** | ⭐ (native) | ⭐⭐ (simple) | ⭐⭐⭐⭐⭐ (complex) |
| **Typo Tolerance** | ⚠️ Manual (trgm) | ✅ Built-in (auto) | ✅ Configurable |
| **Multi-language** | ✅ (with config) | ✅ (good) | ✅ (excellent) |
| **Fuzzy Matching** | ⚠️ (trgm) | ✅ (native) | ✅ (native) |
| **Faceted Search** | ✅ (JSONB) | ✅ (native) | ✅✅ (advanced) |
| **Synonym Support** | ⚠️ (via tsvector) | ✅ (native) | ✅ (native) |
| **Real-time Indexing** | ✅ (sub-second) | ✅ (milliseconds) | ✅ (near real-time) |
| **RAM Footprint** | 🟢 Low | 🟢 Low (~140MB) | 🔴 High (1.5GB+) |
| **Scaling** | ✅ Vertical | ✅ Moderate | ✅✅✅ Horizontal |
| **Admin Overhead** | 🟢 Minimal | 🟢 Minimal | 🔴 High |
| **Cost** | 💰 Included | 💰 Free/hosted | 💰💰 Licensed |

### **Recommendation: MeiliSearch (Tier-1 Choice) + PostgreSQL (Fallback)**

**For <100k products with high relevance requirements, MeiliSearch is optimal because:**

1. **Zero Configuration** — Built-in support for fuzzy matching, typo tolerance, synonyms
2. **Search-as-you-type Ready** — Instant results (<50ms) for 100k products
3. **Georgian-Friendly** — UTF-8 support for both Latin and Georgian scripts
4. **Developer Experience** — Simple REST API, JavaScript SDK, no DevOps burden
5. **Cost-Effective** — Can run on a single 2GB container; free self-hosted option

**PostgreSQL as Complementary Choice:**
- **When to use:** If you already have Supabase/RDS infrastructure
- **Advantage:** Single database, ACID compliance, JSONB for attributes
- **Tradeoff:** Manual tuning required for fuzzy matching (trgm extension)

**When NOT to use Elasticsearch:**
- Overkill for <100k products
- Requires dedicated DevOps (Java runtime, monitoring, scaling)
- Memory-hungry (2GB minimum)
- Learning curve for relevance tuning

---

## 3. Relevance Tuning Strategy

### 3.1 Handling Typos & Fuzzy Matching

#### MeiliSearch Implementation

```json
// PUT /indexes/products/settings
{
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 5,      // Words ≥5 chars allow 1 typo
      "twoTypos": 9      // Words ≥9 chars allow 2 typos
    }
  },
  "exactMatchStrategy": [
    "attributeName",      // iPhone (exact) ranks higher
    "word",               // iPhone (as word) second
    "attribute"           // "iPhone" in description third
  ]
}
```

**Examples:**
- Query: "iphoen" → Matches: iPhone, iPod (1 typo)
- Query: "galyaksi" (Georgian) → Matches: გალაქტიკა (Galaxy, 1 typo)
- Query: "samsang" → Matches: Samsung (1 typo)

#### PostgreSQL Implementation (with pg_trgm)

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for typo tolerance
CREATE INDEX products_name_trgm_idx ON products USING gist (name gist_trgm_ops);

-- Fuzzy search with similarity threshold
SELECT 
  id, 
  name, 
  similarity(name, 'iphoen') as score
FROM products
WHERE name % 'iphoen'  -- similarity operator (default 0.3)
ORDER BY score DESC
LIMIT 10;

-- Combined full-text + fuzzy
WITH fuzzy_matches AS (
  SELECT id, name, similarity(name, 'iphoen') as sim
  FROM products
  WHERE name % 'iphoen'
)
SELECT * FROM fuzzy_matches
WHERE sim > 0.4
ORDER BY sim DESC;
```

**Tuning Similarity Threshold:**
- `0.5` — Conservative (high precision, low recall)
- `0.4` — Balanced (recommended)
- `0.3` — Aggressive (high recall, noise)

#### Combining Fuzzy + Full-Text in PostgreSQL

```sql
-- Best approach: Combine tsvector (full-text) + trgm (typos)
SELECT 
  p.id,
  p.name,
  CASE 
    WHEN p.search_index @@ plainto_tsquery('georgian', 'iphoen') THEN 10
    WHEN p.name % 'iphoen' THEN similarity(p.name, 'iphoen') * 5
    ELSE 0
  END as relevance_score
FROM products p
WHERE 
  p.search_index @@ plainto_tsquery('georgian', 'iphoen')
  OR p.name % 'iphoen'
ORDER BY relevance_score DESC;
```

### 3.2 Synonym Dictionary (Georgian + Latin)

#### MeiliSearch Synonyms

```json
// PUT /indexes/products/settings/synonyms
{
  "mobile": ["მობილური", "ტელეფონი", "tel", "სმარტფონი", "smartphone"],
  "ssd": ["მყარი დისკი", "hard drive", "storage", "hdd"],
  "ram": ["ოპერატიული მეხსიერება", "memory", "მეხსიერება"],
  "processor": ["პროცესორი", "cpu", "chip", "chipset"],
  "screen": ["ეკრანი", "display", "monitor", "დისპლეი"],
  "battery": ["ბატარეა", "აკუმულატორი", "power"],
  "iphone": ["აიფონი", "აიფუნი"],  // Georgian misspelling variant
  "samsung": ["სამსუნგი", "samsang"],
  "lg": ["ელჯი", "ელ.ჯი"],
  "macbook": ["მაკბუკი", "apple laptop"]
}
```

#### PostgreSQL Synonym Approach

```sql
-- Create synonym table
CREATE TABLE synonyms (
  id SERIAL PRIMARY KEY,
  base_term VARCHAR(255) NOT NULL,
  synonym_term VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL, -- 'ka', 'en'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(base_term, synonym_term)
);

INSERT INTO synonyms (base_term, synonym_term, language) VALUES
  ('mobile', 'მობილური', 'ka'),
  ('mobile', 'ტელეფონი', 'ka'),
  ('mobile', 'tel', 'en'),
  ('ssd', 'მყარი დისკი', 'ka'),
  ('ssd', 'hard drive', 'en');

-- Search with synonym expansion
CREATE OR REPLACE FUNCTION expand_synonyms(search_term TEXT)
RETURNS TEXT AS $$
DECLARE
  expanded_terms TEXT;
BEGIN
  SELECT STRING_AGG(DISTINCT s.synonym_term, ' | ')
  INTO expanded_terms
  FROM synonyms s
  WHERE s.base_term = search_term
  OR s.synonym_term = search_term;
  
  RETURN COALESCE(expanded_terms, search_term);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM products
WHERE search_index @@ plainto_tsquery(expand_synonyms('mobile'));
```

### 3.3 Mixed Script Handling (Georgian/Latin Transliteration)

#### Transliteration Strategy

```javascript
// transliteration.js - Georgian ↔ Latin mapping

const GEORGIAN_TO_LATIN = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v',
  'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm',
  'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's',
  'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y',
  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჰ': 'h'
};

const LATIN_TO_GEORGIAN = Object.fromEntries(
  Object.entries(GEORGIAN_TO_LATIN).map(([k, v]) => [v, k])
);

function transliterate(text, direction = 'auto') {
  let isGeorgian = /[\u10A0-\u10FF]/.test(text);
  
  if (direction === 'auto') {
    direction = isGeorgian ? 'to-latin' : 'to-georgian';
  }
  
  const mapping = direction === 'to-latin' ? GEORGIAN_TO_LATIN : LATIN_TO_GEORGIAN;
  
  return text
    .split('')
    .map(char => mapping[char] || char)
    .join('');
}

// Examples
console.log(transliterate('მობილური')); // → 'mobiluri'
console.log(transliterate('iphone', 'to-georgian')); // → 'აიფონი'
```

#### Dual-Index Strategy in MeiliSearch

```javascript
// When indexing products, store BOTH Georgian and Latin versions
const products = [
  {
    id: 1,
    name: 'iPhone 15',
    name_georgian: 'აიფონი 15',
    name_transliterated: 'iphone 15',
    description: 'Latest Apple smartphone',
    description_georgian: 'ყველაზე ახალი Apple სმარტფონი'
  }
];

// PUT /indexes/products/documents
fetch('http://meilisearch:7700/indexes/products/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(products)
});

// Search config: search across all variants
// PUT /indexes/products/settings/searchableAttributes
{
  "searchableAttributes": [
    "name",
    "name_georgian",
    "name_transliterated",
    "description",
    "description_georgian"
  ]
}
```

#### Query Pre-processing

```javascript
// search.js
async function smartSearch(query, lang = 'auto') {
  // Detect language
  const isGeorgian = /[\u10A0-\u10FF]/.test(query);
  
  // Create query variants
  const variants = [
    query, // original
    isGeorgian ? transliterate(query, 'to-latin') : transliterate(query, 'to-georgian')
  ];
  
  // Query MeiliSearch with variants (OR logic)
  const results = await fetch(
    `http://meilisearch:7700/indexes/products/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        limit: 20,
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>'
      })
    }
  );
  
  return results.json();
}
```

---

## 4. Faceted Search Architecture

### 4.1 Dynamic Attribute Extraction

#### Problem: Extract "256GB" from "iPhone 15 Pro 256GB Space Black A2847"

```javascript
// attribute-extractor.js
const ATTRIBUTE_PATTERNS = {
  storage: /(\d+)\s*(?:GB|TB|gb|tb)/i,
  ram: /(\d+)\s*(?:GB|gb)\s*(?:RAM|ram)/i,
  color: /(?:color|colour|col)\s*[:-]?\s*(\w+)/i,
  year: /(?:20|19)\d{2}/,
  generation: /(?:Gen|generation|серия)\s*(\d+)/i,
  brand: /^(Apple|Samsung|LG|Sony|Lenovo|ASUS|HP|Dell|Nokia|Motorola)/i
};

function extractAttributes(productTitle, category) {
  const attributes = {
    storage: null,
    ram: null,
    color: null,
    year: null,
    generation: null,
    brand: null
  };

  for (const [attr, pattern] of Object.entries(ATTRIBUTE_PATTERNS)) {
    const match = productTitle.match(pattern);
    if (match) {
      attributes[attr] = match[1];
    }
  }

  // Category-specific extraction
  if (category === 'smartphones') {
    // Try to extract from structured parts
    const parts = productTitle.split(/[\s,/]+/);
    
    // Common pattern: "iPhone 15 Pro 256GB Black"
    // Try to find color (usually last word)
    const lastPart = parts[parts.length - 1];
    if (isColor(lastPart)) {
      attributes.color = lastPart;
    }
  }

  return attributes;
}

function isColor(word) {
  const commonColors = [
    'black', 'white', 'silver', 'gold', 'rose gold',
    'space black', 'midnight', 'blue', 'red', 'green',
    'თეთრი', 'შავი', 'ოქროსფერი', 'ღია' // Georgian
  ];
  return commonColors.some(c => c.includes(word.toLowerCase()));
}

// Usage
const attrs = extractAttributes('iPhone 15 Pro 256GB Space Black A2847', 'smartphones');
// → { storage: '256', ram: null, color: 'Space Black', brand: 'Apple', ... }
```

### 4.2 PostgreSQL JSONB Facet Schema

```sql
-- Products table with JSONB attributes
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  
  -- Full-text search vector
  search_index tsvector,
  
  -- Dynamic attributes as JSONB
  attributes JSONB NOT NULL DEFAULT '{}',
  
  -- Example structure:
  -- {
  --   "storage": ["256GB", "512GB"],
  --   "ram": "8GB",
  --   "color": "Space Black",
  --   "year": 2023,
  --   "brand": "Apple",
  --   "processor": "A17 Pro"
  -- }
  
  price_current DECIMAL(10,2),
  price_original DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for JSONB queries
CREATE INDEX idx_products_attributes ON products USING gin (attributes);
CREATE INDEX idx_products_category_attrs ON products(category_id) INCLUDE (attributes);

-- Index for full-text search
CREATE INDEX idx_products_search ON products USING gin (search_index);

-- JSONB containment queries
SELECT * FROM products 
WHERE attributes @> '{"color": "Space Black"}';

-- JSONB path queries  
SELECT * FROM products
WHERE attributes -> 'storage' ? '256GB';

-- Get all unique colors for a category
SELECT DISTINCT jsonb_object_keys(attributes -> 'colors') as color
FROM products
WHERE category_id = '123e4567-e89b-12d3-a456-426614174000';
```

### 4.3 MeiliSearch Faceted Configuration

```json
// PUT /indexes/products/settings
{
  "filterableAttributes": [
    "category",
    "brand",
    "color",
    "storage",
    "ram",
    "year",
    "price_range",
    "processor"
  ],
  "sortableAttributes": [
    "price_current",
    "created_at",
    "popularity_score"
  ],
  "rankingRules": [
    "sort",
    "words",
    "typo",
    "proximity",
    "attribute",
    "exactness"
  ],
  "displayedAttributes": [
    "id",
    "name",
    "category",
    "brand",
    "color",
    "storage",
    "ram",
    "price_current",
    "image_url"
  ],
  "searchableAttributes": [
    "name",
    "description",
    "brand",
    "category"
  ]
}
```

### 4.4 Facet Response Generation

#### MeiliSearch Faceted Search

```javascript
// search-service.js

async function facetedSearch(query, filters, page = 1) {
  const response = await fetch(
    'http://meilisearch:7700/indexes/products/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        filter: buildFilterString(filters), // e.g., "color = 'Black' AND storage = '256GB'"
        facets: ['color', 'storage', 'ram', 'brand', 'year'],
        limit: 20,
        offset: (page - 1) * 20,
        highlightPreTag: '<em>',
        highlightPostTag: '</em>'
      })
    }
  );

  return response.json();
  // Response includes:
  // {
  //   "results": [...],
  //   "facetDistribution": {
  //     "color": { "Black": 45, "Silver": 32, "Gold": 28 },
  //     "storage": { "256GB": 78, "512GB": 45, "1TB": 12 },
  //     "ram": { "8GB": 92, "16GB": 43 }
  //   }
  // }
}

function buildFilterString(filters) {
  // Input: { color: ['Black', 'Silver'], storage: '256GB' }
  // Output: "color IN ['Black', 'Silver'] AND storage = '256GB'"
  
  return Object.entries(filters)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const quoted = value.map(v => `'${v}'`).join(', ');
        return `${key} IN [${quoted}]`;
      } else {
        return `${key} = '${value}'`;
      }
    })
    .join(' AND ');
}

// Usage
const results = await facetedSearch(
  'iphone',
  { color: ['Black', 'Silver'], storage: '256GB' },
  1
);
```

#### PostgreSQL Faceted Search

```sql
-- Complex faceted query in PostgreSQL
WITH search_results AS (
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.attributes,
    p.price_current,
    ts_rank_cd(p.search_index, q) as rank
  FROM products p,
  plainto_tsquery('english', 'iphone') q
  WHERE p.search_index @@ q
    AND p.attributes @> '{"color": "Black"}'  -- filter by color
    AND (p.attributes -> 'storage' ? '256GB')  -- filter by storage
    AND p.category_id = 'smartphones'
  ORDER BY rank DESC
  LIMIT 20
),

facet_colors AS (
  SELECT jsonb_array_elements_text(attributes -> 'colors') as color, COUNT(*) as count
  FROM products
  WHERE category_id = 'smartphones'
  GROUP BY color
),

facet_storage AS (
  SELECT jsonb_array_elements_text(attributes -> 'storage') as storage, COUNT(*) as count
  FROM products
  WHERE category_id = 'smartphones'
  GROUP BY storage
)

SELECT 
  (SELECT json_agg(json_build_object('color', color, 'count', count)) FROM facet_colors) as color_facets,
  (SELECT json_agg(json_build_object('storage', storage, 'count', count)) FROM facet_storage) as storage_facets,
  (SELECT json_agg(json_build_object('id', id, 'name', name, 'price', price_current)) FROM search_results) as results;
```

---

## 5. Code Implementation: Next.js + Supabase Instant Search

### 5.1 Setup & Architecture

```bash
# Installation
npm install @meilisearch/meilisearch next-search-params
# OR for PostgreSQL
npm install @supabase/supabase-js pg
```

### 5.2 Next.js Search API Route

```typescript
// app/api/search/route.ts

import { MeiliSearch } from 'meilisearch';
import { NextRequest, NextResponse } from 'next/server';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const colors = searchParams.getAll('color[]');
  const storage = searchParams.getAll('storage[]');
  const brands = searchParams.getAll('brand[]');

  if (!q && colors.length === 0) {
    return NextResponse.json({
      results: [],
      facetDistribution: {},
      estimatedTotalHits: 0
    });
  }

  try {
    // Build filter string
    const filters: string[] = [];
    if (colors.length) filters.push(`color IN [${colors.map(c => `'${c}'`).join(', ')}]`);
    if (storage.length) filters.push(`storage IN [${storage.map(s => `'${s}'`).join(', ')}]`);
    if (brands.length) filters.push(`brand IN [${brands.map(b => `'${b}'`).join(', ')}]`);

    const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

    const results = await client.index('products').search(q, {
      limit: 20,
      offset: (page - 1) * 20,
      facets: ['color', 'storage', 'ram', 'brand', 'processor'],
      filter: filterString,
      attributesToHighlight: ['name', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

### 5.3 React Search Component (Instant Search)

```typescript
// components/SearchBar.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';

interface SearchResult {
  id: string;
  name: string;
  price_current: number;
  brand: string;
  color?: string;
  storage?: string;
  _formatted?: {
    name: string;
  };
}

interface FacetDistribution {
  [key: string]: Record<string, number>;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<FacetDistribution>({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setFacets({});
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          ...Object.fromEntries(searchParams.entries())
        });

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        setResults(data.results || []);
        setFacets(data.facetDistribution || {});
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms debounce
    [searchParams]
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    router.push(`/product/${result.id}`);
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search products... (ძებნა...)"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        {loading && <span className="absolute right-3 top-3 text-gray-400">⏳</span>}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Results Section */}
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-600 px-3 py-2">
              Results ({results.length})
            </div>
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
              >
                <div className="font-semibold">
                  {result._formatted?.name ? (
                    <div dangerouslySetInnerHTML={{ __html: result._formatted.name }} />
                  ) : (
                    result.name
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {result.brand} • ₾{result.price_current.toFixed(2)}
                  {result.storage && ` • ${result.storage}`}
                </div>
              </button>
            ))}
          </div>

          {/* Facets Section */}
          {Object.keys(facets).length > 0 && (
            <div className="border-t p-2">
              <div className="text-xs font-semibold text-gray-600 px-3 py-2">
                Filter Results
              </div>
              {Object.entries(facets).slice(0, 3).map(([facetName, facetValues]) => (
                <div key={facetName} className="px-3 py-2">
                  <div className="font-sm text-gray-700 capitalize">{facetName}</div>
                  <div className="text-xs space-y-1 mt-1">
                    {Object.entries(facetValues)
                      .slice(0, 3)
                      .map(([value, count]) => (
                        <button
                          key={value}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.append(`${facetName}[]`, value);
                            router.push(`?${params.toString()}`);
                          }}
                          className="block text-blue-600 hover:underline"
                        >
                          {value} ({count})
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showResults && results.length === 0 && query && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
          No products found. Try different keywords.
        </div>
      )}
    </div>
  );
}
```

### 5.4 Faceted Filter Component

```typescript
// components/FacetFilters.tsx

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface FacetFilterProps {
  facets: Record<string, Record<string, number>>;
  onFilterChange?: () => void;
}

export default function FacetFilters({ facets, onFilterChange }: FacetFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({
    color: true,
    storage: true,
    brand: false
  });

  const toggleFacet = (facetName: string) => {
    setOpenFacets(prev => ({
      ...prev,
      [facetName]: !prev[facetName]
    }));
  };

  const applyFilter = (facetName: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const key = `${facetName}[]`;
    const currentValues = params.getAll(key);

    if (currentValues.includes(value)) {
      // Remove filter
      params.delete(key);
      currentValues
        .filter(v => v !== value)
        .forEach(v => params.append(key, v));
    } else {
      // Add filter
      params.append(key, value);
    }

    router.push(`?${params.toString()}`);
    onFilterChange?.();
  };

  const clearAllFilters = () => {
    router.push('?q=' + (searchParams.get('q') || ''));
  };

  return (
    <aside className="w-64 space-y-6">
      {Object.entries(facets).map(([facetName, facetValues]) => (
        <div key={facetName} className="border rounded-lg p-4">
          <button
            onClick={() => toggleFacet(facetName)}
            className="w-full text-left font-semibold capitalize flex justify-between items-center"
          >
            {facetName}
            <span>{openFacets[facetName] ? '▼' : '▶'}</span>
          </button>

          {openFacets[facetName] && (
            <div className="mt-3 space-y-2">
              {Object.entries(facetValues)
                .sort(([, a], [, b]) => b - a) // Sort by count descending
                .slice(0, 8) // Show top 8
                .map(([value, count]) => (
                  <label key={value} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchParams.getAll(`${facetName}[]`).includes(value)}
                      onChange={() => applyFilter(facetName, value)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {value} <span className="text-gray-500">({count})</span>
                    </span>
                  </label>
                ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={clearAllFilters}
        className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-semibold"
      >
        Clear All Filters
      </button>
    </aside>
  );
}
```

### 5.5 Index Synchronization (Data Pipeline)

```typescript
// scripts/sync-meilisearch.ts

import { MeiliSearch } from 'meilisearch';
import { createClient } from '@supabase/supabase-js';

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function syncProducts() {
  console.log('🔄 Syncing products to MeiliSearch...');

  // Fetch products from Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(100000); // Adjust as needed

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    return;
  }

  // Transform and enrich data
  const enrichedProducts = products.map(product => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category_id,
    brand: product.attributes.brand,
    color: product.attributes.color,
    storage: product.attributes.storage,
    ram: product.attributes.ram,
    processor: product.attributes.processor,
    price_current: product.price_current,
    price_original: product.price_original,
    availability: product.availability
  }));

  // Delete existing index and create new one
  try {
    await meilisearch.deleteIndex('products');
    console.log('✓ Deleted existing index');
  } catch {
    // Index doesn't exist yet
  }

  // Create index with settings
  const index = await meilisearch.createIndex('products', { primaryKey: 'id' });

  // Configure settings
  await index.updateSettings({
    filterableAttributes: ['brand', 'color', 'storage', 'ram', 'category'],
    sortableAttributes: ['price_current', 'created_at'],
    searchableAttributes: ['name', 'description', 'brand'],
    displayedAttributes: ['id', 'sku', 'name', 'brand', 'price_current', 'color', 'storage'],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 }
    }
  });

  // Upload documents in batches (MeiliSearch has 100MB limit per request)
  const batchSize = 10000;
  for (let i = 0; i < enrichedProducts.length; i += batchSize) {
    const batch = enrichedProducts.slice(i, i + batchSize);
    await index.addDocuments(batch);
    console.log(`✓ Uploaded ${Math.min(i + batchSize, enrichedProducts.length)}/${enrichedProducts.length}`);
  }

  console.log('✅ Sync complete!');
}

// Run sync
syncProducts().catch(console.error);
```

---

## 6. PostgreSQL Implementation (Alternative)

### 6.1 Complete PostgreSQL Search Setup

```sql
-- Full-text search with fuzzy matching in PostgreSQL

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create products table with JSONB
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL,
  price_current DECIMAL(10,2),
  
  -- JSONB attributes
  attributes JSONB NOT NULL DEFAULT '{}',
  
  -- Full-text search vector (computed column)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '')) ||
    to_tsvector('english', coalesce(description, ''))
  ) STORED,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_attributes ON products USING gin(attributes);

-- 4. Create synonym table
CREATE TABLE search_synonyms (
  id SERIAL PRIMARY KEY,
  base_term VARCHAR(255) NOT NULL,
  synonym_term VARCHAR(255) NOT NULL,
  language VARCHAR(10),
  UNIQUE(base_term, synonym_term, language)
);

INSERT INTO search_synonyms VALUES
  (1, 'mobile', 'მობილური', 'ka'),
  (2, 'mobile', 'smartphone', 'en'),
  (3, 'mobile', 'tel', 'en'),
  (4, 'ssd', 'მყარი დისკი', 'ka'),
  (5, 'ssd', 'storage', 'en');

-- 5. Search function (full-text + fuzzy + synonyms)
CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_color VARCHAR DEFAULT NULL,
  p_storage VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  price DECIMAL,
  relevance_score FLOAT,
  color VARCHAR,
  storage VARCHAR
) AS $$
WITH search_variants AS (
  -- Generate synonyms
  SELECT s.synonym_term
  FROM search_synonyms s
  WHERE s.base_term = p_query
  UNION ALL
  SELECT p_query
),

scored_results AS (
  SELECT
    p.id,
    p.name,
    p.price_current,
    -- Scoring: 1000 if exact match, else FTS rank, else trigram similarity
    CASE
      WHEN p.name ILIKE p_query THEN 1000
      WHEN p.search_vector @@ plainto_tsquery('english', p_query) THEN
        ts_rank_cd(p.search_vector, plainto_tsquery('english', p_query)) * 100
      WHEN p.name % p_query THEN
        similarity(p.name, p_query) * 50
      ELSE 0
    END as relevance_score,
    p.attributes ->> 'color' as color,
    p.attributes ->> 'storage' as storage
  FROM products p
  WHERE
    (p.search_vector @@ plainto_tsquery('english', p_query)
     OR p.name % p_query
     OR EXISTS (
       SELECT 1 FROM search_variants sv
       WHERE p.search_vector @@ plainto_tsquery('english', sv.synonym_term)
     ))
    AND (p_color IS NULL OR p.attributes ->> 'color' ILIKE p_color)
    AND (p_storage IS NULL OR p.attributes ->> 'storage' ILIKE p_storage)
)

SELECT
  sr.id,
  sr.name,
  sr.price,
  sr.relevance_score,
  sr.color,
  sr.storage
FROM scored_results sr
WHERE sr.relevance_score > 0
ORDER BY sr.relevance_score DESC
LIMIT p_limit OFFSET p_offset;
$$ LANGUAGE SQL;

-- 6. Usage example
SELECT * FROM search_products('iphone', 20, 0, 'Black', '256GB');

-- 7. Get facet counts
CREATE OR REPLACE FUNCTION get_facets(p_query TEXT)
RETURNS TABLE (facet_name TEXT, facet_value TEXT, count BIGINT) AS $$
SELECT
  'color' as facet_name,
  attributes ->> 'color' as facet_value,
  COUNT(*) as count
FROM products p
WHERE p.search_vector @@ plainto_tsquery('english', p_query) OR p.name % p_query
GROUP BY attributes ->> 'color'
UNION ALL
SELECT
  'storage',
  attributes ->> 'storage',
  COUNT(*)
FROM products p
WHERE p.search_vector @@ plainto_tsquery('english', p_query) OR p.name % p_query
GROUP BY attributes ->> 'storage'
UNION ALL
SELECT
  'brand',
  attributes ->> 'brand',
  COUNT(*)
FROM products p
WHERE p.search_vector @@ plainto_tsquery('english', p_query) OR p.name % p_query
GROUP BY attributes ->> 'brand';
$$ LANGUAGE SQL;
```

---

## 7. Performance Optimization Checklist

| Optimization | MeiliSearch | PostgreSQL | Priority |
|--------------|-------------|-----------|----------|
| **Index Size Reduction** | Use `displayedAttributes` to exclude heavy fields | Use partial indexes (e.g., `WHERE availability = true`) | 🔴 High |
| **Query Caching** | Native via settings | Use Redis (25-50% latency reduction) | 🔴 High |
| **Batch Indexing** | Use bulk API (10k docs/batch) | Use COPY or multi-row INSERT | 🔴 High |
| **Pagination Offset Limit** | Use `offset` < 10k (use cursor-based) | Use keyset pagination for large offsets | 🟡 Medium |
| **Synonym Expansion** | Pre-process queries | Use materialized views for hot facets | 🟡 Medium |
| **Facet Caching** | Cache facet counts per query | Use materialized views + refresh | 🟡 Medium |
| **Metric Tracking** | Use Search Analytics API | Use pg_stat_statements | 🟢 Low |

### Redis Caching Pattern

```typescript
// lib/cache.ts

import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});

export async function cachedSearch(
  query: string,
  filters: Record<string, any>,
  ttl = 3600 // 1 hour
) {
  const cacheKey = `search:${query}:${JSON.stringify(filters)}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from MeiliSearch
  const results = await performActualSearch(query, filters);

  // Store in cache
  await redis.setEx(cacheKey, ttl, JSON.stringify(results));

  return results;
}
```

---

## 8. Monitoring & Analytics

### 8.1 Key Metrics

```sql
-- Track search performance (PostgreSQL)
CREATE TABLE search_analytics (
  id SERIAL PRIMARY KEY,
  query_text VARCHAR(500),
  result_count INT,
  execution_time_ms INT,
  user_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- View most common searches
SELECT query_text, COUNT(*) as frequency
FROM search_analytics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY query_text
ORDER BY frequency DESC
LIMIT 20;

-- Searches with zero results (improvement opportunities)
SELECT query_text, COUNT(*) as zero_result_count
FROM search_analytics
WHERE result_count = 0
GROUP BY query_text
ORDER BY zero_result_count DESC
LIMIT 10;
```

### 8.2 MeiliSearch Analytics

```javascript
// Fetch analytics from MeiliSearch API
async function getSearchAnalytics(indexName) {
  const response = await fetch(
    `http://meilisearch:7700/analytics/events`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MEILISEARCH_API_KEY}`
      }
    }
  );
  return response.json();
}
```

---

## 9. Deployment Checklist

### Production Readiness

- [ ] **Search Engine**: MeiliSearch configured with snapshots for backup
- [ ] **Indexing**: Automated pipeline syncs DB → Search every 24h (or real-time via webhooks)
- [ ] **Fuzzy Matching**: Typo tolerance enabled with proper word size thresholds
- [ ] **Synonyms**: Georgian/Latin synonyms dictionary loaded
- [ ] **Faceted Search**: All attributes properly indexed and filterable
- [ ] **Caching**: Redis deployed for query/facet caching
- [ ] **Monitoring**: Search latency & zero-result queries tracked
- [ ] **Testing**: Search quality metrics baseline established
- [ ] **Documentation**: Team trained on relevance tuning
- [ ] **Fallback**: PostgreSQL FTS as secondary search option

---

## 10. References & Further Reading

- **MeiliSearch Docs**: https://docs.meilisearch.com
- **PostgreSQL FTS**: https://www.postgresql.org/docs/current/textsearch.html
- **Fuzzy Matching**: Levenshtein/Damerau-Levenshtein distance algorithms
- **Georgian Transliteration**: https://en.wikipedia.org/wiki/Romanization_of_Georgian
- **Ecommerce Search Best Practices**: https://www.nosto.com/blog/faceted-search-for-ecommerce-best-practices/

---

**Last Updated:** January 2026  
**Status:** Production-Ready  
**Skill Level:** Advanced (Pre-requisites: Node.js, SQL, REST APIs)
