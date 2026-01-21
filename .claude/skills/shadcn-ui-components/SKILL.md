---
name: shadcn-ui-next-15-react-19-master
description: Master shadcn/ui components for Next.js 15 & React 19 with advanced composition, theming, and responsive patterns. Includes data tables, forms, responsive dialogs, hydration fixes, and CSS variable theming. Use when building accessible, customizable UI systems, implementing form validation with zod, creating data tables with TanStack Table, or setting up multi-theme architectures.
---

# Master shadcn/ui for Next.js 15 & React 19

## Quick Start

**Install with CLI (recommended):**

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app
npx shadcn@latest init -d
```

**For strict TypeScript projects with npm:**

```bash
npx shadcn@latest init -d --skip-git --typescript
# Choose: "New York" style, "Zinc" base color, CSS variables: Yes
```

**Install essential dependencies:**

```bash
npm install react-hook-form zod @hookform/resolvers next-themes lucide-react @tanstack/react-table clsx tailwind-merge
```

**Verify `components.json`:**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## When to Use This Skill

- **Setting up shadcn/ui** in Next.js 15 with React 19 projects
- **Building data tables** with sorting, filtering, and pagination using TanStack Table
- **Creating form layouts** with react-hook-form and Zod validation
- **Implementing responsive UIs** that switch between Dialog (desktop) and Drawer (mobile)
- **Fixing hydration mismatches** in server-rendered components
- **Managing dynamic themes** with CSS variables and dark mode
- **Composing robust components** using slot patterns and cn utility
- **Structuring component architecture** for scalable projects

---

## Installation & Architecture

### CLI vs Manual Setup

**Use CLI when:** First time, standard project structure, want automated setup

```bash
npx shadcn@latest init
# Interactive prompts guide configuration
# Auto-updates tailwind.config.ts, globals.css, creates lib/utils.ts
```

**Use Manual when:** Strict TypeScript requirements, custom structure, monorepos

```bash
# 1. Create lib/utils.ts manually
# 2. Adjust path aliases in tsconfig.json
# 3. Copy components.json to project root
# 4. Run: npx shadcn@latest add button
```

### Recommended Project Structure

```
src/
├── components/
│   ├── ui/                      # shadcn/ui components (auto-added)
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   └── ...
│   ├── shared/                  # Custom composite components
│   │   ├── data-table.tsx       # Table with filtering/sorting
│   │   ├── form-layout.tsx      # Form wrapper component
│   │   └── responsive-dialog.tsx
│   └── providers/
│       └── theme-provider.tsx
├── lib/
│   ├── utils.ts                 # cn() utility, helpers
│   └── types.ts                 # Shared types
├── app/
│   ├── globals.css              # CSS variables, Tailwind
│   └── layout.tsx               # Root layout with ThemeProvider
└── hooks/
    └── use-mobile.ts            # Breakpoint detection hook
```

### Peer Dependency Management

shadcn components may have unmet peer dependencies with React 19. Fix with:

```bash
# Using npm with Next.js 15 + React 19:
npx shadcn@latest init -d --force-npm

# Or in .npmrc:
legacy-peer-deps=true
```

---

## Theming System (CSS Variables)

### HSL Variable Architecture

shadcn uses HSL color variables for maximum flexibility. Structure in `app/globals.css`:

```css
/* Light Mode (Default) */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 91.2% 59.8%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.3% 65.1%;
    --accent: 217.2 91.2% 59.8%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 210 40% 98%;
  }
}

/* Manual Theme Selection (data attribute) */
[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... rest of dark variables */
}

[data-theme="light"] {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... rest of light variables */
}
```

### Dark Mode Setup with next-themes

**Step 1: Install and create ThemeProvider component**

```bash
npm install next-themes
```

```typescript
// app/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

**Step 2: Wrap root layout**

```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 3: Theme toggle component**

```typescript
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

### Custom Brand Themes

Define color systems without CSS variable duplication:

```typescript
// lib/themes.ts
export const THEMES = {
  zinc: {
    light: { "--primary": "222.2 47.4% 11.2%", "--secondary": "217.2 32.6% 17.5%" },
    dark: { "--primary": "210 40% 98%", "--secondary": "217.2 91.2% 59.8%" },
  },
  slate: {
    light: { "--primary": "215.4 16.3% 46.9%", "--secondary": "217.2 32.6% 17.5%" },
    dark: { "--primary": "210 40% 96%", "--secondary": "217.2 91.2% 59.8%" },
  },
  amber: {
    light: { "--primary": "38 92% 50%", "--secondary": "15 100% 50%" },
    dark: { "--primary": "48 96% 53%", "--secondary": "20 84% 39%" },
  },
};

export type ThemeName = keyof typeof THEMES;
```

```typescript
// components/theme-switcher.tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeName } from "@/lib/themes";

export function ThemeSwitcher() {
  const { theme } = useTheme();

  return (
    <div className="flex gap-2">
      {Object.keys(THEMES).map((name) => (
        <button
          key={name}
          onClick={() => {
            const colors = THEMES[name as ThemeName][theme as "light" | "dark"];
            Object.entries(colors).forEach(([key, value]) => {
              document.documentElement.style.setProperty(key, value);
            });
          }}
          className="h-8 w-8 rounded-md border"
        />
      ))}
    </div>
  );
}
```

---

## Key Component Patterns

### Advanced Form Pattern (react-hook-form + Zod)

**Step 1: Define schema**

```typescript
// lib/schemas.ts
import { z } from "zod";

export const profileFormSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
  notifications: z.boolean().default(true),
  bio: z.string().max(500).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
```

**Step 2: Create form component**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { profileFormSchema, type ProfileFormValues } from "@/lib/schemas";

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "user",
      notifications: true,
      bio: "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    console.log("Form data:", data);
    // Submit to API
    const response = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>Your public display name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notifications"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Enable notifications</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Profile</Button>
      </form>
    </Form>
  );
}
```

### Data Table with Filtering & Pagination

**Step 1: Install TanStack Table**

```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

**Step 2: Create reusable DataTable component**

```typescript
// components/shared/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey = "name",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Input
        placeholder={searchPlaceholder}
        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn(searchKey)?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-2 cursor-pointer">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Use the DataTable**

```typescript
// app/users/page.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  status: "active" | "inactive";
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

const USERS: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    status: "active",
  },
  // ... more users
];

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Users</h1>
      <DataTable columns={columns} data={USERS} searchKey="name" />
    </div>
  );
}
```

### Responsive Dialog/Drawer Component

**Step 1: Create useIsMobile hook**

```typescript
// hooks/use-mobile.ts
"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

**Step 2: Create responsive component**

```typescript
// components/shared/responsive-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="px-4 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

**Usage:**

```typescript
<ResponsiveDialog
  trigger={<Button>Open</Button>}
  title="Create User"
  description="Add a new user to the system"
>
  <UserForm />
</ResponsiveDialog>
```

---

## Best Practices

### 1. Composition & Slot Pattern

Use `@radix-ui/react-slot` for flexible component composition:

```typescript
// components/ui/custom-button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const CustomButton = React.forwardRef<
  HTMLButtonElement,
  CustomButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
```

### 2. cn() Utility for Conflict Resolution

The `cn` function merges Tailwind classes intelligently:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage (resolves conflicts):**

```typescript
// ✅ Correct: later class wins
<Button className={cn("bg-red-500", "bg-blue-500")} />
// Results in: bg-blue-500 (not both!)

// ✅ Safe: allows overrides without duplication
<Button className={cn("px-4 py-2", className)} />
// User's className overrides base styles
```

### 3. Server/Client Component Boundaries

Place "use client" strategically:

```typescript
// ✅ Server component (no "use client")
export async function Layout({ children }) {
  const data = await fetchData(); // Server-only code
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ✅ Client component (has "use client")
"use client";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme(); // Client-only
  return <Button onClick={() => setTheme("dark")}>Toggle</Button>;
}
```

### 4. TypeScript Strict Mode

Enable in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 5. Dark Mode Color Consistency

Always test both light and dark modes:

```typescript
// Ensure sufficient contrast (4.5:1 WCAG AA)
const ColorPalette = {
  light: {
    text: "text-slate-900", // #0f172a (19.7 luminance)
    bg: "bg-white", // #ffffff (100 luminance)
  },
  dark: {
    text: "text-slate-50", // #f8fafc (98 luminance)
    bg: "bg-slate-950", // #020817 (1.1 luminance)
  },
};
// Contrast ratio: 98 / 1.1 = 89:1 ✅
```

---

## Common Errors & Solutions

### Hydration Error: "Text content does not match server-rendered HTML"

**Cause:** Component renders different content server-side vs client-side

**Solution 1: Use useEffect for client-only rendering**

```typescript
"use client";

import { useEffect, useState } from "react";

export function ClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Don't render on server

  return <div>{new Date().toLocaleDateString()}</div>;
}
```

**Solution 2: Use suppressHydrationWarning (last resort)**

```typescript
// Only for unavoidable mismatches like timestamps
<time dateTime={date} suppressHydrationWarning>
  {new Date().toLocaleDateString()}
</time>
```

**Solution 3: Fix root cause (Table tbody missing)**

```typescript
// ❌ Wrong
<table>
  <tr><td>Data</td></tr>
</table>

// ✅ Correct
<table>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
```

### Form Input Type Coercion Issue

**Problem:** Input value as string, but schema expects number

**Solution: Zod transform at schema level**

```typescript
const schema = z.object({
  amount: z.string().transform((v) => Number(v) || 0),
  // Or use coerce:
  price: z.coerce.number().min(0),
});
```

### React 19 Peer Dependency Warning

**Problem:** "react-select@5.x has unmet peer dependency react@18"

**Solution: Force install or update package**

```bash
# Option 1: Allow legacy peer deps
npm install --legacy-peer-deps

# Option 2: Update .npmrc
echo "legacy-peer-deps=true" >> .npmrc

# Option 3: Force upgrade package
npm install react-select@latest
```

### Tailwind Classes Not Applying

**Problem:** `className="bg-red-500"` not working in component

**Solution: Verify Tailwind content config**

```typescript
// tailwind.config.ts
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
```

### Dark Mode Not Persisting

**Problem:** Theme resets on page reload

**Solution: Ensure next-themes provider in root layout**

```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## References

- **shadcn/ui Docs:** https://ui.shadcn.com
- **Next.js 15 Docs:** https://nextjs.org/docs
- **React 19 Docs:** https://react.dev
- **TanStack Table v8:** https://tanstack.com/table/v8/docs/guide/introduction
- **Tailwind CSS:** https://tailwindcss.com/docs
- **react-hook-form:** https://react-hook-form.com/
- **Zod Validation:** https://zod.dev
- **next-themes:** https://github.com/pacocoursey/next-themes
- **Radix UI Primitives:** https://www.radix-ui.com/docs/primitives/overview/introduction
- **Class Variance Authority:** https://cva.style/docs

---

## Production Checklist

- [ ] Components configured with `"tsx": true` in components.json
- [ ] CSS variables defined for light and dark modes in globals.css
- [ ] next-themes provider wraps root layout with `suppressHydrationWarning`
- [ ] All forms use react-hook-form + Zod for validation
- [ ] Data tables use TanStack Table for sorting/filtering/pagination
- [ ] Responsive components use `useIsMobile` hook for breakpoint detection
- [ ] cn() utility used for all class merging
- [ ] TypeScript strict mode enabled
- [ ] Hydration errors fixed with useEffect or suppressHydrationWarning
- [ ] Dark mode tested on all components (WCAG AA contrast ratio 4.5:1)
- [ ] Components tested on mobile (< 768px) and desktop
- [ ] Server/client boundaries clearly marked with "use client"
