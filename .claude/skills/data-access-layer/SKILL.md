---
name: data-access-layer-nextjs-15
description: Implements a type-safe Data Access Layer (Repository Pattern) for Next.js 15 with Supabase, featuring base repositories, service layers, DTOs, and RLS integration. Use when building scalable applications needing separation of concerns, testability, and clean architecture with TypeScript generics and Server Actions.
---

# Data Access Layer Pattern for Next.js 15 + Supabase

## Quick Start

```bash
# Project structure
lib/
├── data/
│   ├── client.ts          # Supabase client initialization
│   ├── database.types.ts  # Generated Supabase types
│   └── utils.ts           # Query helpers and types
├── repositories/
│   ├── base.repository.ts      # Generic base repository
│   ├── user.repository.ts      # User-specific repository
│   └── post.repository.ts      # Post-specific repository
├── services/
│   ├── user.service.ts         # Business logic layer
│   └── post.service.ts         # Business logic layer
└── dtos/
    ├── user.dto.ts             # Data Transfer Objects
    └── post.dto.ts
```

Initialize Supabase with types:

```typescript
// lib/data/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client with admin privileges
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

Generate Supabase types (run after schema changes):

```bash
npx supabase gen types typescript --schema public > lib/data/database.types.ts
```

## When to Use This Skill

- **Building scalable Next.js 15 applications** with structured data access
- **Implementing clean architecture** separating UI, business logic, and persistence
- **Using Supabase with RLS** and needing authorization at data layer
- **Integrating Server Actions** with type-safe queries and mutations
- **Writing testable code** with mocked repositories
- **Avoiding N+1 query problems** through repository pattern abstraction
- **Multi-tenant applications** requiring role-based data filtering
- **Complex domain models** needing DTOs and transformation logic

## Core Concepts

### Repository Pattern vs Active Record

| Aspect | Repository Pattern | Active Record |
|--------|-------------------|----------------|
| **Separation** | Decouples data access from business logic | Combines data + logic in one model |
| **Testability** | Easy to mock for unit tests | Harder to isolate for testing |
| **Flexibility** | Easy to switch persistence mechanisms | Tightly coupled to ORM/DB |
| **Complexity** | Extra abstraction layer | Simple, less overhead |
| **Best For** | Complex apps, clean architecture | Simple CRUD applications |
| **Example** | Repository class + Service class | Model methods handle everything |

**Recommendation for Next.js 15:** Use Repository Pattern for production apps. The abstraction cost is worth the maintainability, testability, and scalability benefits.

### Architectural Layers

```
┌─────────────────────────────────────────┐
│  Pages / Server Components              │  Presentation
├─────────────────────────────────────────┤
│  Service Layer (Business Logic)         │  Application
├─────────────────────────────────────────┤
│  Repository Layer (Data Access)         │  Domain
├─────────────────────────────────────────┤
│  Supabase Client + RLS Policies         │  Infrastructure
└─────────────────────────────────────────┘
```

**Flow:** Page → Service → Repository → Supabase

### DTOs (Data Transfer Objects)

DTOs transform data between layers:

```typescript
// Domain model (what Supabase returns)
interface UserRow {
  id: string;
  email: string;
  password_hash: string;  // never expose to client
  created_at: string;
  updated_at: string;
}

// DTO (what we return to application)
interface UserDTO {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Repository maps: UserRow → UserDTO
```

**Benefits:**
- Hide sensitive fields (passwords, tokens, internal IDs)
- Normalize date formats and field names
- Provide single contract for external consumers
- Allow schema changes without breaking API contracts

### Server Actions Integration

Server Actions execute on the server with direct database access:

```typescript
// app/posts/actions.ts
'use server';

import { postService } from '@/lib/services/post.service';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  
  // Service layer handles business logic + auth
  const newPost = await postService.create({ title });
  
  // Revalidate cached data
  revalidatePath('/posts');
  
  return newPost;
}
```

**Why Server Actions with DAL?**
- Direct server access to database (no API layer needed)
- Request includes auth context automatically
- Type-safe data passing (no JSON serialization)
- Perfect for Next.js 15 unified data flow

## Implementation Guide

### Step 1: Create Base Repository Class

The base repository provides generic CRUD operations with TypeScript generics:

```typescript
// lib/repositories/base.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(query?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T extends { id: string }> 
  implements Repository<T> {
  
  constructor(
    protected client: SupabaseClient,
    protected tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw this.handleError(error);
    }

    return this.mapToDomain(data);
  }

  async findMany(filter?: Record<string, any>): Promise<T[]> {
    let query = this.client.from(this.tableName).select('*');

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;

    if (error) throw this.handleError(error);
    return data.map((item) => this.mapToDomain(item));
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.client
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw this.handleError(error);
    return this.mapToDomain(created);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw this.handleError(error);
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw this.handleError(error);
  }

  // Override in subclasses to transform data
  protected mapToDomain(data: any): T {
    return data as T;
  }

  // Centralized error handling
  protected handleError(error: PostgrestError): Error {
    if (error.code === '23505') {
      return new Error(`Duplicate entry: ${error.message}`);
    }
    if (error.code === '23503') {
      return new Error(`Foreign key violation: ${error.message}`);
    }
    return new Error(`Database error: ${error.message}`);
  }
}
```

### Step 2: Create DTOs

Define Data Transfer Objects for type safety and data transformation:

```typescript
// lib/dtos/user.dto.ts
export interface CreateUserDTO {
  email: string;
  name: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}

// lib/dtos/post.dto.ts
export interface CreatePostDTO {
  title: string;
  content: string;
  published?: boolean;
}

export interface PostDTO {
  id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 3: Create Specific Repositories

Extend base repository with domain-specific logic:

```typescript
// lib/repositories/user.repository.ts
import { supabase } from '@/lib/data/client';
import { BaseRepository } from './base.repository';
import { Database } from '@/lib/data/database.types';
import { UserDTO, CreateUserDTO } from '@/lib/dtos/user.dto';

type UserRow = Database['public']['Tables']['users']['Row'];

export class UserRepository extends BaseRepository<UserRow> {
  constructor() {
    super(supabase, 'users');
  }

  async findByEmail(email: string): Promise<UserDTO | null> {
    const user = await this.findMany({ email });
    return user.length ? this.mapToDomain(user[0]) : null;
  }

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    return this.create(data);
  }

  // Repository-specific methods
  async findActiveUsers(): Promise<UserDTO[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw this.handleError(error);
    return data.map((item) => this.mapToDomain(item));
  }

  // Transform database row to DTO
  protected mapToDomain(row: UserRow): UserDTO {
    return {
      id: row.id,
      email: row.email,
      name: row.name || '',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      // Note: password_hash never included in DTO
    };
  }
}

// lib/repositories/post.repository.ts
import { supabase } from '@/lib/data/client';
import { BaseRepository } from './base.repository';
import { Database } from '@/lib/data/database.types';
import { PostDTO, CreatePostDTO } from '@/lib/dtos/post.dto';

type PostRow = Database['public']['Tables']['posts']['Row'];

export class PostRepository extends BaseRepository<PostRow> {
  constructor() {
    super(supabase, 'posts');
  }

  async findPublished(): Promise<PostDTO[]> {
    return this.findMany({ published: true });
  }

  async findByAuthor(authorId: string): Promise<PostDTO[]> {
    return this.findMany({ author_id: authorId });
  }

  async findPublishedByAuthor(authorId: string): Promise<PostDTO[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('author_id', authorId)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw this.handleError(error);
    return data.map((item) => this.mapToDomain(item));
  }

  protected mapToDomain(row: PostRow): PostDTO {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      published: row.published,
      authorId: row.author_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
```

### Step 4: Create Service Layer

Services orchestrate business logic using repositories:

```typescript
// lib/services/user.service.ts
import { UserRepository } from '@/lib/repositories/user.repository';
import { UserDTO, CreateUserDTO } from '@/lib/dtos/user.dto';

export class UserService {
  private userRepository = new UserRepository();

  async getUserById(id: string): Promise<UserDTO | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<UserDTO | null> {
    return this.userRepository.findByEmail(email);
  }

  async registerUser(data: CreateUserDTO): Promise<UserDTO> {
    // Business logic: validate email, check duplicates
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Additional business logic could go here
    return this.userRepository.createUser(data);
  }

  async updateUser(id: string, data: Partial<UserDTO>): Promise<UserDTO> {
    // Business logic: validate data, trigger side effects
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.userRepository.update(id, data);
  }
}

// lib/services/post.service.ts
import { PostRepository } from '@/lib/repositories/post.repository';
import { UserService } from './user.service';
import { PostDTO, CreatePostDTO } from '@/lib/dtos/post.dto';

export class PostService {
  private postRepository = new PostRepository();
  private userService = new UserService();

  async getPostById(id: string): Promise<PostDTO | null> {
    return this.postRepository.findById(id);
  }

  async getPublishedPosts(): Promise<PostDTO[]> {
    return this.postRepository.findPublished();
  }

  async getAuthorPosts(authorId: string): Promise<PostDTO[]> {
    // Verify user exists
    const author = await this.userService.getUserById(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    return this.postRepository.findByAuthor(authorId);
  }

  async createPost(data: CreatePostDTO, authorId: string): Promise<PostDTO> {
    // Business logic: validate user exists
    const author = await this.userService.getUserById(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    return this.postRepository.create({
      ...data,
      author_id: authorId,
    });
  }

  async publishPost(id: string): Promise<PostDTO> {
    return this.postRepository.update(id, { published: true });
  }
}

// Export singletons for reuse
export const userService = new UserService();
export const postService = new PostService();
```

### Step 5: Use in Server Actions

Integrate with Next.js 15 Server Actions:

```typescript
// app/posts/actions.ts
'use server';

import { postService } from '@/lib/services/post.service';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const authorId = formData.get('authorId') as string;

    const post = await postService.createPost(
      { title, content },
      authorId
    );

    revalidatePath('/posts');
    return { success: true, post };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function publishPost(id: string) {
  try {
    const post = await postService.publishPost(id);
    revalidatePath('/posts');
    return { success: true, post };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// app/posts/components/post-form.tsx
'use client';

import { useActionState } from 'react';
import { createPost } from '../actions';

export function PostForm({ authorId }: { authorId: string }) {
  const [state, formAction] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="authorId" value={authorId} />
      <input type="text" name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create Post</button>
      
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state?.success && <p style={{ color: 'green' }}>Post created!</p>}
    </form>
  );
}
```

### Step 6: RLS Integration

Supabase RLS policies enforce authorization at database level:

```sql
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view published posts
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
TO public
USING (published = true);

-- Policy: Users can view their own posts
CREATE POLICY "Users can view their own posts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- Policy: Users can create posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
```

**Important:** With RLS enabled, the Supabase client automatically respects these policies. Repository queries will only return data the authenticated user has access to.

## Best Practices

### 1. Single Responsibility Principle

Each layer handles one concern:

```typescript
// ❌ WRONG: Repository does business logic
export class UserRepository {
  async registerUser(email: string, password: string) {
    // Hashing passwords in repository
    const hashed = await bcrypt.hash(password, 10);
    // This is business logic!
  }
}

// ✅ RIGHT: Service handles business logic
export class UserService {
  async registerUser(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    return this.userRepository.create({ email, password: hashed });
  }
}
```

**Rationale:** Repositories handle data access only. Business logic (validation, transformation, side effects) belongs in services.

### 2. Avoid N+1 Queries

Use `.select()` with joins, not multiple queries:

```typescript
// ❌ N+1 QUERY PROBLEM:
async getPosts() {
  const posts = await this.postRepository.findMany();
  // This loops N times!
  return posts.map(post => ({
    ...post,
    author: await this.userRepository.findById(post.author_id)
  }));
}

// ✅ CORRECT: Single query with join
async getPosts() {
  const { data } = await this.client
    .from('posts')
    .select('*, author:author_id(id, name, email)')
    .eq('published', true);
  
  return data;
}
```

**Rationale:** Database joins are optimized. Client-side loops cause exponential query growth with large datasets.

### 3. Eager Loading with Supabase Relationships

```typescript
// lib/repositories/post.repository.ts
async findPublishedWithAuthor(): Promise<(PostDTO & { author: UserDTO })[]> {
  const { data, error } = await this.client
    .from('posts')
    .select(`
      *,
      author:author_id(id, email, name)
    `)
    .eq('published', true);

  if (error) throw this.handleError(error);
  
  return data.map(item => ({
    ...this.mapToDomain(item),
    author: this.mapAuthorToDomain(item.author)
  }));
}
```

### 4. Type-Safe Query Builder Pattern

Leverage TypeScript generics for compile-time safety:

```typescript
// lib/repositories/query.builder.ts
export interface QueryFilter<T> {
  where?: Partial<T>;
  orderBy?: keyof T;
  ascending?: boolean;
  limit?: number;
}

export abstract class BaseRepository<T extends { id: string }> {
  async find(filter: QueryFilter<T>): Promise<T[]> {
    let query = this.client.from(this.tableName).select('*');

    if (filter.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    if (filter.orderBy) {
      query = query.order(String(filter.orderBy), {
        ascending: filter.ascending ?? true
      });
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw this.handleError(error);
    return data.map(item => this.mapToDomain(item));
  }
}

// Usage with type checking
const recentPosts = await postRepository.find({
  where: { published: true },
  orderBy: 'created_at',
  ascending: false,
  limit: 10
});
```

### 5. Caching Strategy

Use Next.js caching with DAL:

```typescript
// lib/repositories/post.repository.ts with caching
import { unstable_cache } from 'next/cache';

export class PostRepository extends BaseRepository<PostRow> {
  // ...

  async findPublishedCached(): Promise<PostDTO[]> {
    // Cache for 60 seconds, revalidate on-demand
    return unstable_cache(
      async () => this.findPublished(),
      ['posts-published'],
      { revalidate: 60 }
    )();
  }
}

// In Server Actions, trigger revalidation
export async function publishPost(id: string) {
  const post = await postService.publishPost(id);
  
  // Revalidate the cached query
  revalidateTag('posts-published');
  
  return { success: true, post };
}
```

## Code Examples

### Transaction Handling

```typescript
// lib/repositories/transaction.repository.ts
export class TransactionRepository {
  constructor(private client: SupabaseClient) {}

  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<{ success: boolean }> {
    // Supabase doesn't have explicit transaction support in JS client
    // Best practice: use RPC functions with database-level transactions
    
    const { error } = await this.client.rpc('transfer_funds', {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
    });

    if (error) throw error;
    return { success: true };
  }
}

// SQL function in Supabase (SQL editor):
/*
CREATE OR REPLACE FUNCTION transfer_funds(
  from_user_id UUID,
  to_user_id UUID,
  amount DECIMAL
)
RETURNS void AS $$
BEGIN
  BEGIN
    UPDATE wallets SET balance = balance - amount 
    WHERE user_id = from_user_id;
    
    UPDATE wallets SET balance = balance + amount 
    WHERE user_id = to_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
*/
```

### Dependency Injection Pattern

```typescript
// lib/repositories/base.repository.ts
export abstract class BaseRepository<T extends { id: string }> {
  constructor(
    protected client: SupabaseClient,
    protected tableName: string,
    protected logger?: Logger  // Optional dependency
  ) {}

  async findById(id: string): Promise<T | null> {
    this.logger?.debug(`Fetching ${this.tableName} with id: ${id}`);
    // ... rest of implementation
  }
}

// For testing: inject mock logger
class MockLogger implements Logger {
  debug(msg: string) { /* test assertions */ }
}

const testRepository = new UserRepository(
  mockClient,
  'users',
  new MockLogger()
);
```

### Error Handling Pattern

```typescript
// lib/data/errors.ts
export class DataAccessError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DataAccessError';
  }
}

// lib/repositories/base.repository.ts
protected handleError(error: PostgrestError): Error {
  const errorMap: Record<string, string> = {
    '23505': 'DUPLICATE_ENTRY',
    '23503': 'FOREIGN_KEY_VIOLATION',
    '42P01': 'TABLE_NOT_FOUND',
    '42703': 'COLUMN_NOT_FOUND',
  };

  const code = errorMap[error.code] || 'DATABASE_ERROR';
  
  return new DataAccessError(
    `[${code}] ${error.message}`,
    code,
    new Error(error.details || error.hint || '')
  );
}
```

## Testing Repositories with Mocks

```typescript
// lib/repositories/__mocks__/user.repository.ts
export class MockUserRepository implements Repository<UserDTO> {
  private users: Map<string, UserDTO> = new Map();

  async findById(id: string): Promise<UserDTO | null> {
    return this.users.get(id) ?? null;
  }

  async findMany(): Promise<UserDTO[]> {
    return Array.from(this.users.values());
  }

  async create(data: Partial<UserDTO>): Promise<UserDTO> {
    const user: UserDTO = {
      id: '1',
      email: data.email || '',
      name: data.name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: Partial<UserDTO>): Promise<UserDTO> {
    const user = this.users.get(id)!;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  // Test helper
  reset() {
    this.users.clear();
  }
}

// __tests__/user.service.test.ts
import { UserService } from '@/lib/services/user.service';
import { MockUserRepository } from '@/lib/repositories/__mocks__/user.repository';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
    service = new UserService();
    // Inject mock (requires refactoring service to accept repos)
    service['userRepository'] = mockRepo;
  });

  it('should register a new user', async () => {
    const user = await service.registerUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });

  it('should throw error on duplicate email', async () => {
    await service.registerUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    await expect(
      service.registerUser({
        email: 'test@example.com',
        name: 'Another User',
      })
    ).rejects.toThrow('User with this email already exists');
  });
});
```

## Common Errors & Troubleshooting

### Error: "Row Level Security (RLS) violation"

```
Error: new row violates row-level security policy for table "posts"
```

**Causes:**
- Authenticated user trying to access another user's row
- RLS policy not matching user's auth.uid()
- Using anon key with policies requiring authenticated role

**Solutions:**
```typescript
// 1. Verify RLS policy matches your logic
// In Supabase SQL Editor:
SELECT * FROM posts WHERE author_id = auth.uid();

// 2. Check auth context in Server Actions
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getMyPosts() {
  const supabase = createServerActionClient({ cookies });
  
  // Auth context is automatically included
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id); // Should match policy
  
  return await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user!.id);
}

// 3. Use correct Supabase key for the operation
// Client-side: NEXT_PUBLIC_SUPABASE_ANON_KEY (respects RLS)
// Server-side: SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
```

### Error: "N+1 Query Performance Degradation"

```typescript
// ❌ SYMPTOMS: App slow with many records

// ✅ FIX: Use Supabase joins instead of loops
const posts = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:author_id(id, name)  // One query, one network round-trip
  `)
  .eq('published', true);

// Profile with console:
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  shouldThrowOnError: true,
});

// Enable query logging
supabase.client.realtime.listeners().forEach(listener => {
  console.log('Active realtime listeners:', listener);
});
```

### Error: "Type Safety Issues with Generated Types"

```typescript
// ❌ Problem: Generated types outdated after schema change
interface Database {
  public: {
    Tables: {
      posts: {
        Row: { author_id: string }  // Column was renamed to user_id!
      }
    }
  }
}

// ✅ Solution: Regenerate types after schema changes
npx supabase gen types typescript --schema public > lib/data/database.types.ts

// Commit generated file to version control
git add lib/data/database.types.ts
```

### Error: "DTO Mapping Errors - Missing Fields"

```typescript
// ❌ Problem: Partial mapping causes missing fields
protected mapToDomain(row: UserRow): UserDTO {
  return {
    id: row.id,
    email: row.email,
    // Missing: name, createdAt, updatedAt
  };
}

// ✅ Solution: Use strict type checking
const user: UserDTO = {
  id: row.id,
  email: row.email,
  name: row.name || '',  // Explicit default
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
};

// Or use type assertion with comment
return {
  ...row,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
} as UserDTO;
```

### Error: "Mutation Not Reflected in UI"

```typescript
// ❌ Problem: Data cached, changes don't show
export async function createPost(formData: FormData) {
  await postService.createPost(data);
  // Forgot to revalidate cache!
}

// ✅ Solution: Revalidate after mutations
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  const newPost = await postService.createPost(data);
  
  // Revalidate the page cache
  revalidatePath('/posts');
  
  // Or revalidate specific tags
  revalidateTag('posts-list');
  
  return newPost;
}

// In repository caching:
async findPublishedCached() {
  return unstable_cache(
    async () => this.findPublished(),
    ['posts-published'],  // Tag for revalidation
    { revalidate: 3600 }
  )();
}
```

## Project Structure Guide

```
app/
├── (dashboard)/
│   ├── posts/
│   │   ├── page.tsx           # Server component
│   │   ├── [id]/
│   │   │   └── page.tsx       # Detail page
│   │   ├── actions.ts         # Server Actions (DAL consumers)
│   │   └── components/
│   │       ├── post-form.tsx  # Client component
│   │       └── post-list.tsx  # Client component
│   └── users/
│       └── ...
│
lib/
├── data/
│   ├── client.ts              # Supabase initialization
│   ├── database.types.ts      # Generated types (git-ignored in .env files)
│   └── constants.ts           # Tables, constants
│
├── repositories/              # Data Access Layer
│   ├── base.repository.ts     # Generic base class
│   ├── user.repository.ts     # User-specific repository
│   ├── post.repository.ts     # Post-specific repository
│   └── __mocks__/
│       ├── user.repository.ts # Mock for testing
│       └── post.repository.ts
│
├── services/                  # Business Logic Layer
│   ├── user.service.ts        # User business logic
│   ├── post.service.ts        # Post business logic
│   └── index.ts               # Export singletons
│
├── dtos/                      # Data Transfer Objects
│   ├── user.dto.ts
│   ├── post.dto.ts
│   └── index.ts
│
└── utils/
    ├── validators.ts          # Input validation
    ├── transformers.ts        # Data transformation
    └── errors.ts              # Custom error types
```

## References

- **Next.js Data Access Layer** - https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#creating-a-data-access-layer
- **Supabase TypeScript Support** - https://supabase.com/docs/reference/javascript/typescript-support
- **Supabase Row Level Security** - https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase Generating Types** - https://supabase.com/docs/guides/api/rest/generating-types
- **Repository Pattern (Martin Fowler)** - https://martinfowler.com/eaaCatalog/repository.html
- **Clean Architecture in TypeScript** - https://basarat.gitbook.io/typescript/main-1/dependencyinjection
- **Next.js Server Actions** - https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **PostgreSQL Transactions** - https://www.postgresql.org/docs/current/tutorial-transactions.html
