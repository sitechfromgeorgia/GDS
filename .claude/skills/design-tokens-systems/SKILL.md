---
name: implementing-design-tokens-systems
description: Implements scalable design token systems with primitive and semantic layers, integrates with Tailwind CSS for single source of truth architecture, and applies systems thinking to maintain consistency across platforms. Use when building design systems, implementing tokenized color/spacing/typography, creating component libraries, managing multi-platform theming, or refactoring codebases to use design tokens.
---

# Design Tokens & Systems Thinking for Scalable UI

## Quick Start

Create a three-tier token architecture: **Primitives** (raw values) → **Semantics** (meaning-based aliases) → **Components** (usage-specific).

```typescript
// 1. PRIMITIVE TOKENS (raw design values)
const primitiveTokens = {
  colors: {
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    gray: {
      100: '#f3f4f6',
      900: '#111827',
    },
  },
  spacing: {
    4: '0.25rem',   // 4px base
    8: '0.5rem',    // 8px
    12: '0.75rem',
    16: '1rem',
  },
  typography: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: { sm: '0.875rem', base: '1rem', lg: '1.125rem' },
    fontWeight: { normal: 400, medium: 500, bold: 600 },
  },
};

// 2. SEMANTIC TOKENS (meaning-based, theme-aware)
const semanticTokens = {
  color: {
    text: {
      primary: primitiveTokens.colors.gray[900],      // --color-text-primary
      secondary: primitiveTokens.colors.gray[600],
    },
    background: {
      primary: primitiveTokens.colors.gray[50],       // --color-bg-primary
      surface: '#ffffff',
    },
    interactive: {
      default: primitiveTokens.colors.blue[500],      // --color-interactive-default
      hover: primitiveTokens.colors.blue[700],
      disabled: primitiveTokens.colors.gray[300],
    },
  },
  spacing: {
    component: {
      padding: primitiveTokens.spacing[16],           // --spacing-component-padding
    },
    section: {
      margin: primitiveTokens.spacing[32],            // --spacing-section-margin
    },
  },
};

// 3. COMPONENT TOKENS (composition for reusable UI)
const componentTokens = {
  button: {
    primary: {
      background: semanticTokens.color.interactive.default,
      text: '#ffffff',
      padding: semanticTokens.spacing.component.padding,
      hover: {
        background: semanticTokens.color.interactive.hover,
      },
    },
  },
};
```

## When to Use This Skill

- **Building new design systems** - Structure tokens before writing any component CSS
- **Implementing Tailwind CSS integration** - Map tokens to `tailwind.config.ts` for consistency
- **Multi-platform consistency** - Use Style Dictionary to transform tokens for web/mobile/documentation
- **Dark mode / theming** - Use semantic tokens to swap values without changing component code
- **Auditing existing codebases** - Extract scattered color values and spacing into reusable tokens
- **Team collaboration** - Establish single source of truth between design and development

## Three-Tier Token Architecture

### Level 1: Primitive (Global) Tokens

**Raw design values with no context.** These are your building blocks.

```json
{
  "colors": {
    "neutral": {
      "50": "#f9fafb",
      "100": "#f3f4f6",
      "900": "#111827"
    },
    "brand": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6"
    }
  },
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem"
  },
  "typography": {
    "fontFamily": {
      "sans": "system-ui, -apple-system, sans-serif",
      "mono": "ui-monospace, monospace"
    },
    "fontSize": {
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "bold": "600"
    }
  },
  "borderRadius": {
    "sm": "0.375rem",
    "md": "0.5rem",
    "lg": "0.75rem"
  }
}
```

**Key principle:** Primitives don't change based on theme or context. They're the palette.

### Level 2: Semantic (Alias) Tokens

**Meaningful, context-aware tokens that reference primitives.** These have intent.

```json
{
  "color": {
    "text": {
      "primary": "{colors.neutral.900}",
      "secondary": "{colors.neutral.600}",
      "disabled": "{colors.neutral.400}",
      "onBrand": "#ffffff"
    },
    "background": {
      "primary": "#ffffff",
      "secondary": "{colors.neutral.50}",
      "overlay": "rgba(0, 0, 0, 0.5)"
    },
    "action": {
      "default": "{colors.brand.primary}",
      "hover": "{colors.brand.secondary}",
      "active": "{colors.brand.secondary}",
      "disabled": "{colors.neutral.300}"
    },
    "feedback": {
      "success": "#10b981",
      "error": "#ef4444",
      "warning": "#f59e0b",
      "info": "#3b82f6"
    }
  },
  "spacing": {
    "xs": "{spacing.xs}",
    "sm": "{spacing.sm}",
    "md": "{spacing.md}",
    "lg": "{spacing.lg}",
    "xl": "{spacing.xl}"
  }
}
```

**Usage pattern:** Use semantics in components. Update one semantic token = updates everywhere.

### Level 3: Component Tokens

**Component-specific combinations of semantic tokens.** Document design decisions at component level.

```json
{
  "button": {
    "primary": {
      "padding": "{spacing.md}",
      "background": "{color.action.default}",
      "text": "{color.text.onBrand}",
      "borderRadius": "{borderRadius.md}",
      "states": {
        "hover": "{color.action.hover}",
        "active": "{color.action.active}",
        "disabled": "{color.action.disabled}"
      }
    }
  },
  "card": {
    "padding": "{spacing.lg}",
    "background": "{color.background.primary}",
    "borderRadius": "{borderRadius.lg}",
    "shadow": "0 1px 3px rgba(0, 0, 0, 0.1)"
  }
}
```

## Tailwind CSS Integration

Map design tokens to `tailwind.config.ts` as single source of truth:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const tokens = {
  colors: {
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      600: '#4b5563',
      900: '#111827',
    },
    brand: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  fontSize: {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
};

export default {
  theme: {
    extend: {
      colors: {
        // Primitives for utilities
        ...tokens.colors,
        // Semantic tokens
        text: {
          primary: tokens.colors.neutral[900],
          secondary: tokens.colors.neutral[600],
          disabled: tokens.colors.neutral[400],
        },
        bg: {
          primary: '#ffffff',
          secondary: tokens.colors.neutral[50],
          action: tokens.colors.brand.primary,
        },
      },
      spacing: tokens.spacing,
      fontSize: tokens.fontSize,
    },
  },
} satisfies Config;
```

**Component tokens with @apply:**

```css
/* components.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-brand-primary text-white rounded-md font-medium;
  }

  .btn-primary:hover {
    @apply bg-brand-secondary;
  }

  .btn-primary:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .card {
    @apply bg-white p-6 rounded-lg shadow-sm;
  }
}
```

## Naming Conventions (2024-2025 Best Practices)

Follow **`{category}-{concept}-{role}-{modifier}`** pattern:

```
✅ GOOD:
--color-text-primary
--spacing-component-padding
--font-size-heading-large
--border-radius-interaction

❌ BAD:
--blue                    # Too literal, breaks on rebrand
--bigSpacing              # Vague
--txt                     # Abbreviated, unclear
--special-box-color       # Too specific, not reusable
```

### Naming by Category

| Category | Format | Examples |
|----------|--------|----------|
| **Color** | `color-[role]-[state]` | `color-text-primary`, `color-action-hover`, `color-feedback-error` |
| **Spacing** | `spacing-[context]-[property]` | `spacing-component-padding`, `spacing-section-margin` |
| **Typography** | `font-[property]-[variant]` | `font-size-heading-large`, `font-weight-bold` |
| **Radius** | `radius-[context]` | `radius-sm`, `radius-button` |
| **Shadow** | `shadow-[intensity]` | `shadow-sm`, `shadow-elevation-high` |

## CSS Custom Properties (CSS Variables)

Output tokens as scoped CSS variables for runtime theming:

```css
/* tokens.css - Light mode (default) */
:root {
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-action-default: #3b82f6;
  --color-action-hover: #2563eb;
  --spacing-xs: 0.25rem;
  --spacing-md: 1rem;
  --font-family-base: system-ui, sans-serif;
  --font-size-base: 1rem;
  --border-radius-md: 0.5rem;
}

/* Dark mode - Override only changed values */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f3f4f6;
    --color-text-secondary: #d1d5db;
    --color-bg-primary: #1f2937;
    --color-bg-secondary: #111827;
    --color-action-default: #60a5fa;
  }
}

/* Manual dark mode toggle */
html[data-theme='dark'] {
  --color-text-primary: #f3f4f6;
  --color-bg-primary: #1f2937;
}

/* Component usage */
.button {
  background-color: var(--color-action-default);
  color: #ffffff;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: background-color 250ms;
}

.button:hover {
  background-color: var(--color-action-hover);
}
```

## Token File Structure

Organize tokens by category, not by page or component:

```
src/
├── tokens/
│   ├── primitives/
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   ├── typography.json
│   │   └── elevation.json
│   ├── semantic/
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   └── typography.json
│   ├── components/
│   │   ├── button.json
│   │   ├── card.json
│   │   └── input.json
│   ├── tokens.css          # Generated
│   └── index.ts            # Generated types
├── styles/
│   ├── components.css      # @apply rules
│   └── global.css
└── components/
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

## Implementation Patterns

### React + TypeScript with Type-Safe Tokens

```typescript
// tokens/index.ts - Type-safe token access
export const tokens = {
  colors: {
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
    },
    background: {
      primary: 'var(--color-bg-primary)',
      action: 'var(--color-action-default)',
    },
  },
  spacing: {
    xs: 'var(--spacing-xs)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
  },
} as const;

type TokenPath = typeof tokens;

// Helper for accessing nested tokens
export function getToken(path: string): string {
  return path.split('.').reduce((acc: any, key) => acc?.[key], tokens) || '';
}

// ============================================

// components/Button.tsx
import { tokens } from '@/tokens';
import { CSSProperties } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant, children }: ButtonProps) {
  const styles: CSSProperties = {
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background.action,
    color: tokens.colors.text.primary,
    borderRadius: '0.5rem',
    fontWeight: 500,
    cursor: 'pointer',
  };

  return <button style={styles}>{children}</button>;
}
```

### Dark Mode with Semantic Tokens

```typescript
// hooks/useTheme.ts
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial = stored || (prefersDark ? 'dark' : 'light');
    
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return { theme, toggleTheme };
}
```

## Style Dictionary for Token Transformation

Automate token export to multiple formats (CSS, JS, Tailwind, iOS, Android):

```typescript
// config.ts - Style Dictionary configuration
import StyleDictionary from 'style-dictionary';

const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        {
          destination: 'tailwind-tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
  },
};

const sd = new StyleDictionary(config);
sd.buildAllPlatforms();
```

## Systems Thinking: Token Governance

### Decision Tree for New Tokens

```
Need a new value?
├─ Is it already used elsewhere?
│  └─ YES → Reuse existing token ✓
├─ Does it fit existing semantic tokens?
│  └─ YES → Map to semantic layer ✓
├─ Is it a new design decision?
│  └─ YES → Create semantic token (not primitive) ✓
└─ Would adding this token maintain consistency?
   └─ NO → Reconsider, extend existing instead
```

### Token Naming Checklist

Before creating new tokens:
- [ ] Name doesn't describe color (avoid "blue", "green")
- [ ] Name describes purpose/context
- [ ] Name is reusable across multiple contexts
- [ ] Name fits existing hierarchy
- [ ] At least 3 uses before creating token

### Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **Over-tokenization** | 1000+ tokens hurt maintainability | Start with ~50-100 tokens, add only when needed |
| **Circular references** | `token-a` → `token-b` → `token-a` | Validate dependencies in CI/CD |
| **One-off values** | `--input-box-shadow: 0 1px 3px ...` | Use semantic token instead |
| **Mixing primitives in components** | Components reference `color-blue-500` instead of `color-action-default` | Components must use semantic tokens only |
| **Naming inconsistency** | Mix of `--btn-bg`, `--button_padding`, `buttonText` | Enforce naming convention with linting |
| **Skipping documentation** | Team doesn't know which token to use | Document in Storybook or design system site |

## Migration Strategy: Extracting Tokens from Existing Code

### Step 1: Audit Existing Styles

```bash
# Find all unique color values
grep -r "#[0-9a-f]\{6\}\|rgb" src/ | sort | uniq

# Find all font sizes
grep -r "font-size:\|fontSize:" src/ | sort | uniq

# Find all spacing values
grep -r "padding\|margin\|gap:" src/ | sort | uniq
```

### Step 2: Create Primitive Token Map

```json
{
  "audit": {
    "colors": [
      "#3b82f6",
      "#ffffff",
      "#111827",
      "#6b7280"
    ],
    "spacingPx": [
      "4px", "8px", "12px", "16px", "20px", "24px", "32px"
    ]
  }
}
```

### Step 3: Build Semantic Layer

Map primitives to meaning:

```
#3b82f6 → color.action.default (primary brand color)
#ffffff → color.background.primary (main background)
#111827 → color.text.primary (main text)
#6b7280 → color.text.secondary (secondary text)
```

### Step 4: Incrementally Replace

```typescript
// Before
const styles = {
  button: {
    background: '#3b82f6',
    padding: '16px',
    color: '#ffffff',
  }
};

// After (with tokens)
const styles = {
  button: {
    background: 'var(--color-action-default)',
    padding: 'var(--spacing-md)',
    color: '#ffffff', // will migrate next
  }
};
```

## Common Errors & Solutions

**Error: "Token reference not found"**
```
❌ color.action → undefined
✅ color.action.default → 'var(--color-action-default)'
```
Check token path is complete; use dot notation carefully.

**Error: Circular token dependencies**
```json
{
  "token-a": "{token-b}",
  "token-b": "{token-a}"
}
```
Validate: token-b must reference primitives or earlier-defined tokens only.

**Error: Dark mode colors don't switch**
```css
/* ❌ Uses hardcoded color */
.button { background: #3b82f6; }

/* ✅ Uses CSS variable */
.button { background: var(--color-action-default); }
```

**Error: TypeScript doesn't recognize tokens**
```typescript
// ❌ String tokens are untyped
const bg = tokens['colors']['background']['primary'];

// ✅ Nested structure with autocomplete
const bg = tokens.colors.background.primary;
```

## Best Practices

1. **Semantic tokens first** - Never reference primitives directly in components
2. **CSS variables over hardcoding** - Enables runtime theming and dark mode
3. **Three-tier hierarchy** - Primitives → Semantic → Component
4. **Consistent naming** - Enforce with linting tools (stylelint, ESLint)
5. **Version control tokens** - Treat token changes like breaking changes; document migration
6. **Document decisions** - Link tokens to design system rationale
7. **Regular audits** - Find unused tokens, fix over-tokenization quarterly
8. **Automate generation** - Use Style Dictionary or similar to prevent drift between design/code

## References

- [W3C Design Tokens Specification](https://designtokens.org/)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Tailwind CSS Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS @apply Directive](https://tailwindcss.com/docs/reusing-styles)
- [Design Tokens by Contentful](https://www.contentful.com/blog/design-token-system/)
- [Shopify Polaris Design Tokens](https://github.com/Shopify/polaris-tokens)
- [Radix UI Design System Patterns](https://radix-ui.com/)
- [CSS Custom Properties Deep Dive](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Design System Article: Naming Tokens](https://smart-interface-design-patterns.com/articles/naming-design-tokens/)
- [Tokens Studio for Figma](https://tokens.studio/)
