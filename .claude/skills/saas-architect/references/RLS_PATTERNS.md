# Row Level Security (RLS) Policy Templates

## Why RLS is Critical for SaaS

Row Level Security is PostgreSQL's built-in way to enforce data isolation at the database level. For multi-tenant SaaS applications, RLS is **mandatory** - it's your last line of defense against data leaks.

**Benefits:**
- Data isolation enforced at database level
- Works even if application code has bugs
- Simplifies application logic
- Auditable security policies
- Performance-optimized by PostgreSQL

## Core RLS Patterns

### Pattern 1: User Owns Resource

**Use Case:** User profiles, settings, personal data

```sql
-- Table: user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (user_id = auth.uid());
```

### Pattern 2: Organization Membership

**Use Case:** Organization-scoped resources (most SaaS tables)

```sql
-- Table: projects (belongs to organization)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view org projects
CREATE POLICY "Org members can view org projects"
  ON projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can create projects
CREATE POLICY "Org members can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can update projects
CREATE POLICY "Org members can update projects"
  ON projects
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org admins can delete projects
CREATE POLICY "Org admins can delete projects"
  ON projects
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### Pattern 3: Role-Based Access

**Use Case:** Different permissions based on user role

```sql
-- Table: organization_settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: All members can view settings
CREATE POLICY "Members can view settings"
  ON organization_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only owners and admins can update settings
CREATE POLICY "Admins can update settings"
  ON organization_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Only owners and admins can insert settings
CREATE POLICY "Admins can insert settings"
  ON organization_settings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### Pattern 4: Creator Can Manage

**Use Case:** Resources where creator has special permissions

```sql
-- Table: comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view comments
CREATE POLICY "Members can view comments"
  ON comments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can create comments
CREATE POLICY "Members can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Creator or admins can update
CREATE POLICY "Creator or admins can update comments"
  ON comments
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Creator or admins can delete
CREATE POLICY "Creator or admins can delete comments"
  ON comments
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### Pattern 5: Public Read, Member Write

**Use Case:** Public-facing content, member management

```sql
-- Table: public_pages
CREATE TABLE public_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published pages
CREATE POLICY "Anyone can view published pages"
  ON public_pages
  FOR SELECT
  USING (is_published = true);

-- Policy: Org members can view all org pages
CREATE POLICY "Members can view all org pages"
  ON public_pages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can create pages
CREATE POLICY "Members can create pages"
  ON public_pages
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can update org pages
CREATE POLICY "Members can update pages"
  ON public_pages
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

### Pattern 6: Assigned User Access

**Use Case:** Tasks assigned to specific users

```sql
-- Table: tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Assigned user or org members can view
CREATE POLICY "Assigned or members can view tasks"
  ON tasks
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Org members can create tasks
CREATE POLICY "Members can create tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Assigned user can update their tasks
CREATE POLICY "Assigned can update tasks"
  ON tasks
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

## Advanced Patterns

### Pattern 7: Time-Based Access

**Use Case:** Trial periods, scheduled content

```sql
-- Table: premium_features
CREATE TABLE premium_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;

-- Policy: Access if subscription active or within trial
CREATE POLICY "Access premium features"
  ON premium_features
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE (
        -- Active subscription
        (subscription_status = 'active')
        OR
        -- Within trial period
        (trial_ends_at IS NOT NULL AND trial_ends_at > NOW())
      )
      AND id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );
```

### Pattern 8: Hierarchical Access

**Use Case:** Nested resources (project > task > comment)

```sql
-- Comments inherit project permissions
CREATE POLICY "Members can view comments"
  ON comments
  FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE project_id IN (
        SELECT id FROM projects
        WHERE organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );
```

### Pattern 9: Service Role Bypass

**Use Case:** Admin operations, system tasks

```sql
-- Policy: Service role has full access
CREATE POLICY "Service role full access"
  ON any_table
  FOR ALL
  USING (
    auth.role() = 'service_role'
  );

-- Usage in code:
-- Use service role key for admin operations
-- const supabase = createClient(url, serviceRoleKey)
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting WITH CHECK on INSERT
```sql
-- WRONG: Only checks USING for INSERT
CREATE POLICY "Members can create"
  ON projects FOR INSERT
  USING (organization_id IN (...));

-- RIGHT: Use WITH CHECK for INSERT
CREATE POLICY "Members can create"
  ON projects FOR INSERT
  WITH CHECK (organization_id IN (...));
```

### ❌ Mistake 2: Not Enabling RLS
```sql
-- WRONG: Policies won't apply
CREATE POLICY "..." ON table_name ...;

-- RIGHT: Enable RLS first
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON table_name ...;
```

### ❌ Mistake 3: Overly Complex Policies
```sql
-- WRONG: Multiple JOINs, subqueries in subqueries
CREATE POLICY "Complex mess"
  ON table_name FOR SELECT
  USING (
    id IN (
      SELECT t1.id FROM table1 t1
      JOIN table2 t2 ON t1.id = t2.ref_id
      WHERE t2.org_id IN (
        SELECT org_id FROM orgs
        WHERE ...
      )
    )
  );

-- RIGHT: Keep it simple, use functions if needed
CREATE POLICY "Simple check"
  ON table_name FOR SELECT
  USING (check_user_access(id, auth.uid()));
```

### ❌ Mistake 4: Not Testing Policies
```sql
-- Always test with different users
-- Use Supabase SQL Editor with "Run as authenticated user"
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"user-uuid"}';
SELECT * FROM your_table;
```

## Testing RLS Policies

### Method 1: SQL Editor
```sql
-- Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"<user-uuid>"}';

-- Try operations
SELECT * FROM projects;
INSERT INTO projects (...) VALUES (...);
UPDATE projects SET ... WHERE id = '...';
DELETE FROM projects WHERE id = '...';
```

### Method 2: In Application
```typescript
// Create test users
const { data: user1 } = await supabase.auth.signUp({
  email: 'test1@example.com',
  password: 'password'
});

// Test as user1
const supabase1 = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${user1.session.access_token}` }}
});

// Should succeed: Insert own org data
const { data, error } = await supabase1
  .from('projects')
  .insert({ organization_id: user1OrgId, name: 'Test' });

// Should fail: Insert other org data
const { error: shouldFail } = await supabase1
  .from('projects')
  .insert({ organization_id: otherOrgId, name: 'Test' });
```

## Performance Considerations

### Use Indexes
```sql
-- Index foreign keys used in policies
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
```

### Optimize Subqueries
```sql
-- Instead of subquery per row
CREATE POLICY "Slow policy"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Create function that caches
CREATE OR REPLACE FUNCTION user_organizations(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = user_uuid;
$$ LANGUAGE SQL STABLE;

CREATE POLICY "Faster policy"
  ON projects FOR SELECT
  USING (organization_id IN (SELECT user_organizations(auth.uid())));
```

## Complete Example: SaaS Setup

```sql
-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Profiles: Users own their data
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- 3. Organizations: Members can view
CREATE POLICY "Members can view org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- 4. Organizations: Only owners can update
CREATE POLICY "Owners can update org"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 5. Projects: Org members have full access
CREATE POLICY "Members manage projects"
  ON projects FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- 6. Tasks: Org members + assigned users
CREATE POLICY "Members and assigned can manage tasks"
  ON tasks FOR ALL
  USING (
    assigned_to = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## Summary

**Key Principles:**
1. **Always enable RLS** on multi-tenant tables
2. **Test policies** with real users before production
3. **Keep policies simple** - complexity kills performance
4. **Use indexes** on columns used in policy checks
5. **Document your policies** - future you will thank you

**Common Policy Pattern:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "descriptive_name"
  ON table_name
  FOR SELECT | INSERT | UPDATE | DELETE | ALL
  USING (condition)        -- For SELECT, UPDATE, DELETE
  WITH CHECK (condition);  -- For INSERT, UPDATE
```

RLS is your security safety net. Even if your application code has bugs, RLS ensures data isolation at the database level.
