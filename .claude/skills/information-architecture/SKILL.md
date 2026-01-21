---
name: designing-saas-information-architecture
description: Structures intuitive navigation and predictable information hierarchies for complex React/Next.js SaaS dashboards. Implements nested layouts, breadcrumbs, command menus, and object-oriented UX patterns. Use when architecting multi-tenant workspaces, building dashboard navigation, designing hierarchical structures (Workspaces → Projects → Tasks), or improving information discoverability in complex applications.
---

# Designing SaaS Information Architecture

## Quick Start

Map your SaaS hierarchy using three mental models:

```typescript
// 1. Three-Tier Workspace Hierarchy (Most Common Pattern)
const workspaceHierarchy = {
  tier1: "Global OS (company-wide resources, main navigation)",
  tier2: "Departments/Projects (specific domains)",
  tier3: "Private spaces/Tasks (individual items)"
};

// 2. Next.js App Router File Structure Maps to URL + Sidebar
// /app/org/[id]/settings/page.tsx → /org/123/settings
// Automatically creates navigable breadcrumbs from URL segments

// 3. Object-Oriented UX (Design Around Nouns, Not Verbs)
// ✅ GOOD: Navigation around Users, Invoices, Projects
// ❌ BAD: Navigation around Search, Filter, Export
```

## When to Use This Skill

- **Building multi-tenant dashboards** with workspaces/organizations
- **Architecting nested navigation** (Organization → Project → Task)
- **Designing for complex content** where progressive disclosure prevents cognitive overload
- **Validating information architecture** through card sorting and tree testing
- **Creating command palettes** (Cmd+K) for power users
- **Mobile navigation design** needing to balance bottom sheets vs hamburger menus
- **Adding breadcrumbs** that auto-generate from URL structure
- **Reducing navigation friction** in SaaS products

## Key Navigation Patterns

### 1. Sidebar vs. Top Navigation vs. Command Palette

| Pattern | Best For | Mobile | Power Users |
|---------|----------|--------|-------------|
| **Sidebar** | 5-8 primary sections, complex hierarchies | Icon-only collapse | Visible context |
| **Top Navigation** | Flat structure, 3-4 items max | Hamburger menu | Limited access |
| **Command Palette (Cmd+K)** | All actions + navigation in one place | Bottom sheet | 🌟 Excellent |

**Hybrid Approach (Recommended):**
- Sidebar: Primary navigation + workspace switcher
- Bottom Navigation (Mobile): 4-5 core features always visible
- Command Palette: Secondary actions + global search
- Breadcrumbs: Current location + quick navigation up hierarchy

### 2. Next.js App Router Nested Layouts

The file structure directly maps to your URL and layout hierarchy:

```typescript
// app/layout.tsx (Root Layout - header, auth, theme provider)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx (Route Group - sidebar shared layout)
// URL: /dashboard, /projects, /settings (no segment in URL)
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// app/(dashboard)/org/[id]/layout.tsx (Org-scoped layout)
// URL: /org/123, /org/456
export default function OrgLayout({ children, params }) {
  return (
    <OrgProvider orgId={params.id}>
      <OrgHeader orgId={params.id} />
      {children}
    </OrgProvider>
  );
}

// app/(dashboard)/org/[id]/settings/page.tsx
// URL: /org/123/settings
export default function SettingsPage({ params }) {
  return <SettingsForm orgId={params.id} />;
}
```

**Key Concepts:**
- **Route Groups** `(dashboard)` organize without affecting URL
- **Layouts nest automatically** - outer layout wraps inner layout
- **Each segment becomes navigable** in breadcrumbs
- **Dynamic segments** `[id]` become URL params

### 3. Automated Breadcrumbs from URL Structure

```typescript
// lib/breadcrumbs.ts
export interface BreadcrumbItem {
  label: string;
  href: string;
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' }
  ];

  let path = '';
  segments.forEach((segment, index) => {
    path += `/${segment}`;

    // Skip dynamic segments, convert to readable labels
    if (segment.startsWith('[')) return;

    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    breadcrumbs.push({
      label,
      href: path
    });
  });

  return breadcrumbs;
}

// components/Breadcrumbs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { generateBreadcrumbs } from '@/lib/breadcrumbs';

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav aria-label="breadcrumb" className="flex gap-2">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-400">/</span>}
          <Link href={crumb.href} className="hover:underline">
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
```

### 4. Command Palette (Cmd+K) Pattern

```typescript
// components/CommandMenu.tsx
'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

interface CommandItem {
  label: string;
  value: string;
  action: () => void;
  category?: string;
  shortcut?: string;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Commands organized by context
  const commands: CommandItem[] = [
    // Navigation
    {
      label: 'Go to Dashboard',
      value: 'dashboard',
      category: 'Navigation',
      action: () => router.push('/dashboard')
    },
    {
      label: 'Go to Projects',
      value: 'projects',
      category: 'Navigation',
      action: () => router.push('/projects')
    },
    // Actions
    {
      label: 'Create New Project',
      value: 'new-project',
      category: 'Actions',
      action: () => setOpen(false) // Trigger modal separately
    },
    // Settings
    {
      label: 'Settings',
      value: 'settings',
      category: 'Settings',
      action: () => router.push('/settings')
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div 
        className="absolute left-1/2 top-1/4 w-full max-w-md -translate-x-1/2"
        onClick={e => e.stopPropagation()}
      >
        <Command 
          className="rounded-lg border shadow-lg"
          shouldFilter
        >
          <Command.Input 
            placeholder="Search commands..."
            className="px-4 py-2 border-b"
          />
          <Command.List className="max-h-64 overflow-y-auto">
            {/* Group by category */}
            {['Navigation', 'Actions', 'Settings'].map(category => {
              const categoryCommands = commands.filter(c => c.category === category);
              if (categoryCommands.length === 0) return null;

              return (
                <Command.Group key={category} heading={category}>
                  {categoryCommands.map(cmd => (
                    <Command.Item 
                      key={cmd.value}
                      value={cmd.value}
                      onSelect={cmd.action}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    >
                      {cmd.label}
                      {cmd.shortcut && (
                        <span className="ml-auto text-xs text-gray-500">
                          {cmd.shortcut}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
```

**Using cmdk package:**
```bash
npm install cmdk
```

### 5. Object-Oriented UX (OOUX) Mental Model

Design around **nouns** (users, invoices, projects) instead of **verbs** (search, filter, export).

```typescript
// ❌ Action-First (Poor Navigation)
// Home → Search → Results → Click item → View Details → Export
// (Users must remember each verb-based step)

// ✅ Object-First (Intuitive Navigation)
// Dashboard → Projects → Select Project → View Tasks
// (Navigation follows the objects users think about)

// SaaS Navigation Hierarchy (OOUX Pattern)
type SaaSObjects = {
  Workspace: {
    id: string;
    name: string;
    members: User[];
  };
  Project: {
    id: string;
    workspaceId: string;
    name: string;
  };
  Task: {
    id: string;
    projectId: string;
    title: string;
    assignee: User;
  };
  User: {
    id: string;
    email: string;
    workspaces: Workspace[];
  };
};

// URL Structure Mirrors Objects
// /workspace/{id} - See workspace details
// /workspace/{id}/projects - Browse all projects in workspace
// /workspace/{id}/projects/{projectId} - View project
// /workspace/{id}/projects/{projectId}/tasks/{taskId} - View task
```

### 6. Mobile Navigation Patterns (2025 Best Practices)

```typescript
// Bottom Navigation (Recommended for mobile)
export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white flex gap-4 md:hidden">
      {/* 4-5 primary sections, always visible */}
      <NavLink href="/dashboard" icon={Home} label="Dashboard" />
      <NavLink href="/projects" icon={Folder} label="Projects" />
      <NavLink href="/team" icon={Users} label="Team" />
      <NavLink href="/more" icon={Menu} label="More" />
    </nav>
  );
}

// When to use each pattern:
// Bottom Navigation (3-5 items): 
//   - ✅ Always visible, fast access
//   - ✅ Thumb-friendly (bottom of phone)
//   - ❌ Takes permanent screen space
//   - Use for: Core app features

// Hamburger Menu (6+ items):
//   - ✅ Saves screen space
//   - ✅ Can hold unlimited options
//   - ❌ Hidden by default, less discoverable
//   - ❌ Requires extra tap
//   - Use for: Secondary features, settings

// Bottom Sheet (Contextual):
//   - ✅ Temporary, doesn't block main content
//   - ✅ Natural mobile gesture
//   - ❌ Interrupts workflow
//   - Use for: Filters, quick actions, modals
```

## Progressive Disclosure Pattern

Hide complexity until users need it. Reduce cognitive load in complex SaaS.

```typescript
// Example: Settings page with progressive disclosure

export function SettingsForm() {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <form>
      {/* Core Settings - Always Visible */}
      <fieldset>
        <legend>Basic Settings</legend>
        <Input label="Name" />
        <Input label="Email" />
      </fieldset>

      {/* Advanced Settings - Hidden by Default */}
      <button 
        type="button"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="mt-4 text-sm text-blue-600"
      >
        {advancedOpen ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {advancedOpen && (
        <fieldset className="mt-4 border-t pt-4">
          <legend>Advanced Settings</legend>
          <Input label="API Key" />
          <Input label="Webhook URL" />
          <Select label="Data Retention" options={['30d', '90d', '1y']} />
        </fieldset>
      )}
    </form>
  );
}

// Progressive Disclosure Patterns:
// 1. Accordions: Click to expand sections
// 2. Tabs: Switch between feature sets
// 3. Modals: Detailed configuration without leaving page
// 4. Tooltips: Help on hover/click
// 5. "Learn More" links: Direct to documentation
```

## Information Architecture Validation

### Card Sorting (Bottom-Up Validation)

Users organize content into groups, revealing their mental model:

```typescript
// Process:
// 1. List all items (features, pages, settings)
// 2. Ask users to group them logically
// 3. Analyze groupings for patterns
// 4. Use results to create IA structure

// Example Results:
// Users grouped these together:
// - [Invoice, Payment History, Billing]  → "Billing"
// - [Team Members, Roles, Permissions]   → "Team"
// - [Notifications, Email, Preferences]  → "Settings"
```

### Tree Testing (Top-Down Validation)

Test if users can FIND things in your proposed hierarchy:

```typescript
// Example: Test if users can find "Reset Password"
// Given structure:
// Dashboard > Settings > Account > Security > Reset Password

// Test task: "You need to reset your password. Where would you go?"
// Success rate target: 75%+
// If success < 75%: Move "Reset Password" to more discoverable location
```

## Anti-Patterns to Avoid

### 1. Mystery Meat Navigation

Icons without labels confuse users. They shouldn't have to guess.

```typescript
// ❌ WRONG: Icon-only navigation
<nav>
  <button title="Settings">⚙️</button>  {/* What's the plus? */}
  <button title="Add">➕</button>       {/* Add what? */}
  <button title="Menu">◉</button>      {/* What does a circle mean? */}
</nav>

// ✅ RIGHT: Icons + Labels (even on mobile with collapsible sidebar)
<nav>
  <button>⚙️ Settings</button>
  <button>➕ Create New</button>
  <button>☰ More Options</button>
</nav>

// On mobile, collapse to: Icon + Label on bottom nav (3-5 items)
// Hide label if 4+ items, show on hover/label
```

### 2. Deep Nesting (3+ Levels Without Breadcrumbs)

Users get lost and can't navigate back easily.

```typescript
// ❌ WRONG: Deep nesting without escape route
// Workspace → Team → Project → Task → Subtask → Details
// (5 levels deep, users don't know how to get back)

// ✅ RIGHT: Deep nesting WITH breadcrumbs + sidebar + command menu
// Show: Breadcrumbs at top + Workspace switcher in sidebar
// Dashboard / Projects / Q4-Roadmap / Feature-X / Subtask-1
//           ↑ Click here to jump to any level
```

### 3. Pogo Stick Navigation

Users bounce between pages repeatedly because content is split across locations.

```typescript
// ❌ WRONG: Invoice details split across pages
// Invoices → Select Invoice → Details → Click "Payments" 
// → Payments page → Back to Invoices → Select Invoice again

// ✅ RIGHT: Use tabs or progressive disclosure on one page
// Invoices / [Invoice-ID]
//   Tabs: Details | Payments | History | Notes
// (Everything accessible without navigating away)
```

### 4. Inconsistent Terminology

Using different names for same concept causes confusion.

```typescript
// ❌ WRONG: Inconsistent naming
// Sidebar: "Workspaces"
// URL: /organizations/123
// Header: "Teams"
// (Users confused: Are workspaces different from teams?)

// ✅ RIGHT: One term everywhere
// Sidebar: "Workspaces"
// URL: /workspaces/123
// API response: workspaces[]
// Header: "Workspaces"
```

## Best Practices

### 1. Design for Discoverability

Make important features visible without hiding in menus.

```typescript
// ✅ Good: Primary actions visible
// Sidebar has 5-8 main items, user sees everything at a glance
// Frequently used features get 1-click access

// ❌ Bad: "Create" hidden in hamburger menu
// User has to tap menu → find create button → success feels hidden
```

### 2. Maintain Consistent URL Structure

URL is the user's mental model of site structure.

```typescript
// ✅ Predictable URLs
// /org/123 → Organization page
// /org/123/members → Organization members
// /org/123/projects → Organization projects
// Users can guess URLs

// ❌ Inconsistent URLs
// /dashboard/workspace/123
// /workspaces/123/projects
// /projects/123/tasks/new
// (No pattern, users can't predict)
```

### 3. Breadcrumbs + Sidebar Together

Gives users multiple ways to navigate backwards.

```typescript
// Users can escape from deeply nested pages via:
// 1. Breadcrumbs at top (jump to any level)
// 2. Sidebar (see full structure)
// 3. Browser back button
// 4. Command palette (Cmd+K)
```

### 4. Use Workspaces for Multi-Tenant Apps

Workspaces organize the hierarchy.

```typescript
// Standard SaaS Structure:
// Workspace (Organization) → Projects → Tasks/Items
// Each workspace is isolated, but user can switch workspaces

// URL pattern:
// /workspace/{id}/projects
// /workspace/{id}/settings

// Sidebar should show:
// - Workspace switcher (dropdown or icon)
// - Primary navigation (relevant to current workspace)
// - Workspace-scoped settings
```

### 5. Minimize Clicks for Common Tasks

Analyze user workflows, optimize for most frequent paths.

```typescript
// Measure: Most common user journey?
// Optimize: Create that path with 2-3 clicks max

// Example: "View Project Tasks"
// ✅ Optimal: Dashboard → Click Project → See Tasks (2 clicks)
// ❌ Poor: Dashboard → Projects → Select Project 
//         → Tasks → View Task (4 clicks)
```

## Code Example: Complete Sidebar Navigation

```typescript
// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  ChevronDown
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: Folder
    },
    {
      label: 'Team',
      href: '/team',
      icon: Users
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="w-64 border-r bg-gray-50 p-4 h-screen flex flex-col">
      {/* Workspace Switcher */}
      <div className="mb-6">
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-white p-2 hover:bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500" />
            <span className="font-semibold text-sm">Current Workspace</span>
          </div>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigationItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive(item.href)
                ? 'bg-blue-100 text-blue-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Settings at Bottom */}
      <div className="border-t pt-4">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
        >
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <span className="text-sm font-medium">Profile</span>
        </Link>
      </div>
    </aside>
  );
}
```

## Common Errors & Solutions

**Error: Users can't find the "Create" button**
- Solution: Add to command palette, top navigation, or give dedicated placement in UI. Never hide in hamburger menu alone.

**Error: Breadcrumbs don't match URL structure**
- Solution: Auto-generate breadcrumbs from URL segments using `usePathname()`. Test that clicking breadcrumbs navigates correctly.

**Error: Too many items in sidebar (looks overwhelming)**
- Solution: Apply progressive disclosure. Collapse less-used sections into "More" dropdown. Show 5-8 primary items max.

**Error: Users get lost in deep hierarchies**
- Solution: Add breadcrumbs, workspace switcher, and command palette. Limit to 3-level navigation maximum without escape route.

**Error: Mobile navigation takes up entire screen**
- Solution: Use bottom navigation for 4-5 primary items, hamburger menu for everything else. Prioritize what appears in bottom nav.

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Object-Oriented UX (OOUX)](https://alistapart.com/article/object-oriented-ux/)
- [Card Sorting & Tree Testing Guide](https://www.usertesting.com/blog/how-to-use-tree-testing-and-card-sorting)
- [cmdk: Command Menu Library](https://github.com/pacocoursey/cmdk)
- [Progressive Disclosure in UX](https://dev.to/lollypopdesign/the-power-of-progressive-disclosure-in-saas-ux-design-1ma4)
- [SaaS Navigation Patterns 2025](https://dev.to/saifiimuhammad/5-saas-ui-patterns-every-developer-should-steal-with-implementation-examples-kpe)
- [Mobile Navigation: Bottom Sheets vs Hamburger Menus](https://acclaim.agency/blog/the-future-of-mobile-navigation-hamburger-menus-vs-tab-bars)
