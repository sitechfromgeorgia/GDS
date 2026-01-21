---
name: tailwind-css-v4-migration
description: Migrates projects from Tailwind CSS v3 to v4 with CSS-first configuration, Oxide architecture setup, and Shadcn/UI compatibility. Use when upgrading to Tailwind v4, setting up React 19 projects with zero-config, configuring custom themes with CSS variables, or integrating design systems like Shadcn/UI.
---

# Tailwind CSS v4 Migration & Implementation Guide

## Quick Start

### For Vite + React 19 (Recommended)

```bash
npm install tailwindcss @tailwindcss/vite
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
})
```

**src/index.css (import in main.tsx):**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(71% 0.2 14);
  --color-accent: oklch(74% 0.22 205);
}
```

### For Next.js 15 + PostCSS

```bash
npm install tailwindcss @tailwindcss/postcss
```

**postcss.config.mjs:**
```javascript
/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**app/globals.css:**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(71% 0.2 14);
  --color-secondary: oklch(65% 0.15 285);
}
```

## When to Use This Skill

- **Migrating v3 → v4**: Converting JavaScript configs to CSS-first approach
- **Setting up new Tailwind v4 projects**: With Vite or Next.js 15
- **Integrating Shadcn/UI components**: Maintaining custom theme variables with v4
- **Configuring custom design systems**: Using `@theme` blocks with CSS variables
- **Fixing IntelliSense issues**: Properly configuring VS Code detection

## Core Architecture Changes

### The Oxide Engine

- **Built in Rust** for maximum performance
- **100x faster** JIT compilation (378ms v3 → 100ms v4)
- **5ms incremental rebuilds** for style changes (vs 44ms in v3)
- **Automatic content detection** without `content` arrays
- **Lightning CSS integration**: Unified vendor prefixing, no separate PostCSS plugins

**Why it matters**: No more manual `content` paths in config. Tailwind scans your templates automatically.

### CSS-First Configuration

**Old way (v3):**
```javascript
// tailwind.config.js - NO LONGER NEEDED
export default {
  content: ['./src/**/*.{jsx,tsx}'],
  theme: {
    extend: {
      colors: { primary: '#3B82F6' },
      fontFamily: { mono: 'Fira Code' }
    }
  }
}
```

**New way (v4):**
```css
/* globals.css - SINGLE SOURCE OF TRUTH */
@import "tailwindcss";

@theme {
  --color-primary: oklch(71% 0.2 14);
  --font-mono: "Fira Code";
  --border-radius-lg: 12px;
}
```

## Installation Strategies

### Strategy 1: Vite (Zero-Config, Recommended)

**Best for**: React 19, Svelte, Vue 3 projects; fastest setup.

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install tailwindcss @tailwindcss/vite
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
})
```

**src/index.css:**
```css
@import "tailwindcss";
```

**src/main.tsx:**
```typescript
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

**Why Vite?** No PostCSS config needed. Oxide engine handles everything.

### Strategy 2: Next.js 15 (PostCSS Required)

**Best for**: Full-stack apps, SSR requirements.

```bash
npx create-next-app@latest --typescript --tailwind
cd my-app
npm install @tailwindcss/postcss
```

**postcss.config.mjs:**
```javascript
/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**app/globals.css:**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(71% 0.2 14);
  --color-secondary: oklch(65% 0.15 285);
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

**app/layout.tsx:**
```typescript
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Strategy 3: Legacy JavaScript Config (Compatibility Mode)

**Best for**: Monorepos, complex setups requiring gradual migration.

```bash
npm install tailwindcss @tailwindcss/postcss
```

**app/globals.css:**
```css
@config "./tailwind.config.js";
@import "tailwindcss";
```

**tailwind.config.js (minimal v3 config):**
```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: 'oklch(71% 0.2 14)',
      },
    },
  },
}
```

**Note**: `@config` directive allows gradual migration. New v4-only features use `@theme` blocks in CSS.

## Theming with Shadcn/UI

### Define HSL Theme Variables

Shadcn/UI uses HSL format. Define in `@theme`:

**app/globals.css:**
```css
@import "tailwindcss";

@theme {
  /* Primary brand colors */
  --color-primary: oklch(71% 0.2 14);
  --color-primary-foreground: oklch(98% 0.01 0);

  /* Semantic colors for Shadcn */
  --color-background: oklch(98% 0.01 0);
  --color-foreground: oklch(12% 0.02 280);
  --color-card: oklch(98% 0.01 0);
  --color-card-foreground: oklch(12% 0.02 280);
  
  /* Neutral palette */
  --color-muted: oklch(90% 0.01 0);
  --color-muted-foreground: oklch(45% 0.01 280);
  
  /* Destructive (error) */
  --color-destructive: oklch(60% 0.2 30);
  --color-destructive-foreground: oklch(98% 0.01 0);
}

@layer base {
  :root {
    /* Fallback for components using HSL CSS variables */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 45.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

### Use Custom Colors in Components

```typescript
// components/Button.tsx
export function CustomButton() {
  return (
    <button className="bg-primary text-primary-foreground hover:bg-primary/90">
      Click Me
    </button>
  )
}
```

### Dynamic Theme Switching (React)

```typescript
// lib/theme-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'custom-blue'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    // Update data attribute for Tailwind theme selector
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

**app/globals.css (updated):**
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(71% 0.2 14);
  --color-primary-foreground: oklch(98% 0.01 0);
}

/* Light theme (default) */
:root {
  --color-background: oklch(98% 0.01 0);
  --color-foreground: oklch(12% 0.02 280);
}

/* Dark theme */
[data-theme="dark"] {
  --color-background: oklch(12% 0.02 280);
  --color-foreground: oklch(98% 0.01 0);
}

/* Blue accent theme */
[data-theme="custom-blue"] {
  --color-primary: oklch(55% 0.2 250);
  --color-primary-foreground: oklch(98% 0.01 0);
}
```

## Migration Checklist

### Phase 1: Setup
- [ ] Install `@tailwindcss/vite` (Vite) or `@tailwindcss/postcss` (Next.js)
- [ ] Update build config: `vite.config.ts` or `postcss.config.mjs`
- [ ] Create main CSS file with `@import "tailwindcss"`
- [ ] Test: Run dev server, verify styles apply

### Phase 2: Configuration Migration
- [ ] Move `colors` from `tailwind.config.js` → `@theme` block in CSS
- [ ] Move `fontFamily` → `@theme` (as `--font-*` variables)
- [ ] Move `spacing` → `@theme` (as `--spacing-*` variables)
- [ ] Move custom `borderRadius` → `@theme`
- [ ] Delete `content` array (Oxide auto-detects)
- [ ] Delete `tailwind.config.js` (unless using `@config` bridge)

### Phase 3: Component Updates
- [ ] Replace `@apply` directives with `@reference "./globals.css"` if in components
- [ ] Update Shadcn/UI HSL variables if theming
- [ ] Test all component states (hover, focus, dark mode)
- [ ] Verify no "Unknown at rule" warnings

### Phase 4: Verification
- [ ] Build succeeds without warnings
- [ ] Hot reload works (styles update instantly)
- [ ] IntelliSense shows class suggestions
- [ ] Dark mode toggles correctly
- [ ] Production build includes only used utilities

## Common Errors & Solutions

### Error: "Unknown at rule @theme"

**Cause**: VS Code doesn't recognize Tailwind v4 syntax.

**Solution 1**: Update Tailwind CSS IntelliSense extension to latest.

**Solution 2**: Add to `.vscode/settings.json`:
```json
{
  "css.lint.unknownAtRules": "ignore",
  "tailwindCSS.experimental.configFile": "./src/index.css"
}
```

**Solution 3**: Create `.postcssrc.json`:
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

### Error: "IntelliSense not showing class suggestions"

**Cause**: Extension can't find CSS configuration file.

**Fix**: Explicitly specify CSS file in VS Code settings:
```json
{
  "tailwindCSS.experimental.configFile": "./app/globals.css"
}
```

Or remove conflicting setting:
```json
{
  "tailwindCSS.experimental.configFile": null
}
```

### Error: "Cannot apply unknown utility class"

**Cause**: Using `@apply` without `@reference`.

**v4 Syntax**:
```css
@import "tailwindcss";

@layer components {
  @reference "./globals.css";
  
  .btn-primary {
    @apply px-4 py-2 bg-primary text-primary-foreground;
  }
}
```

### Error: "Styles not applying after upgrade"

**Cause**: Missing `@import "tailwindcss"` in main CSS.

**Check**:
1. Main CSS file has `@import "tailwindcss";` at top
2. CSS file imported in entry point (main.tsx or layout.tsx)
3. No remaining `@tailwind` directives (v4 uses `@import` instead)

### Error: "Build takes 30+ seconds"

**Cause**: PostCSS still running separately (for Next.js).

**Fix**: Ensure `postcss.config.mjs` has ONLY:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

Remove `autoprefixer`, `postcss-import`, etc. Oxide handles these.

## Breaking Changes from v3

| Feature | v3 | v4 | Migration |
|---------|----|----|-----------|
| **Config** | `tailwind.config.js` | CSS `@theme` blocks | Move theme values to CSS |
| **Content paths** | Explicit `content: [...]` | Auto-detected | Delete `content` array |
| **Directives** | `@tailwind base` | `@import "tailwindcss"` | Replace with import |
| **Utilities** | `@apply` (always works) | Requires `@reference` | Add `@reference` directive |
| **Plugins** | JavaScript plugins | CSS `@plugin` (new) | Update plugin syntax |
| **Preprocessors** | Sass, Less, Stylus | CSS only | Migrate to plain CSS |
| **Build tool** | Flexible | Unified Oxide + Lightning CSS | No manual tool chaining |

## Best Practices

### 1. **Organize Theme Variables Semantically**

```css
@theme {
  /* Semantic colors */
  --color-primary: oklch(71% 0.2 14);
  --color-success: oklch(70% 0.15 140);
  --color-error: oklch(60% 0.2 30);
  --color-warning: oklch(65% 0.2 80);

  /* Scale tokens (extend, don't replace) */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas;
}
```

**Why**: Semantic names scale. Use `--color-primary` everywhere; change once, everywhere updates.

### 2. **Separate Themes into CSS Custom Variants**

```css
@custom-variant dark {
  @media (prefers-color-scheme: dark) {
    @slot;
  }
}

@custom-variant print {
  @media print {
    @slot;
  }
}
```

Use: `<div class="dark:bg-slate-900 print:hidden">`

### 3. **Use OKLCH for Colors (Perceptually Uniform)**

```css
@theme {
  /* OKLCH: Lightness (0-1), Chroma (0-0.4), Hue (0-360) */
  --color-primary: oklch(71% 0.2 14);      /* Bright blue */
  --color-primary-dark: oklch(50% 0.15 14); /* Darker blue, same hue */
  --color-primary-light: oklch(85% 0.1 14); /* Lighter blue */
}
```

**Why**: OKLCH hues stay consistent across lightness levels. HSL becomes muddy.

### 4. **Leverage Cascade Layers for Specificity**

```css
@layer base, theme, components, utilities, overrides;

@layer utilities {
  .custom-class { /* ... */ }
}

@layer overrides {
  .exception { /* This beats utilities */ }
}
```

**Why**: Replaces `!important` hacks. Cleaner precedence.

### 5. **Avoid Nested JavaScript Configs**

**❌ Don't:**
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          900: '#0c2340',
        }
      }
    }
  }
}
```

**✅ Do:**
```css
@theme {
  --color-primary-50: oklch(97% 0.01 220);
  --color-primary-900: oklch(20% 0.05 220);
}
```

Use consistent naming: `--color-primary-50` maps to `primary-50` class.

## References

- [Official Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Oxide Engine Architecture](https://tailwindcss.com/blog/tailwindcss-v4)
- [CSS-First Configuration Docs](https://tailwindcss.com/docs/configuration)
- [Theme Directive Reference](https://tailwindcss.com/docs/theme)
- [Shadcn/UI Theming Guide](https://ui.shadcn.com/docs/theming)
- [Tailwind CSS IntelliSense Extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Next.js 15 + Tailwind Integration](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [Vite + Tailwind v4 Setup](https://vite.dev/guide/)
