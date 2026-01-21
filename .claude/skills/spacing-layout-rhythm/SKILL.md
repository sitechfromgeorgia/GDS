---
name: building-spacing-systems-with-tailwind-v4
description: Implements professional spacing systems and layout rhythm using Tailwind CSS v4, CSS custom properties, and design tokens. Use when creating consistent interfaces with 8px grid systems, responsive spacing scales, vertical rhythm, or when building scalable design systems with Tailwind v4 and CSS variables.
---

# Building Spacing Systems with Tailwind v4

## Quick Start

Create a spacing system with Tailwind v4's CSS-first configuration:

```css
/* styles/globals.css */
@theme {
  --spacing: 0.25rem;
  --color-primary: #3B82F6;
  --color-secondary: #8B5CF6;
}

@layer theme {
  :root {
    /* Define your custom spacing scale */
    --space-xs: 0.25rem;    /* 4px */
    --space-sm: 0.5rem;     /* 8px */
    --space-md: 1rem;       /* 16px */
    --space-lg: 1.5rem;     /* 24px */
    --space-xl: 2rem;       /* 32px */
    --space-2xl: 3rem;      /* 48px */
    --space-3xl: 4rem;      /* 64px */
  }
}
```

```html
<!-- Use Tailwind spacing utilities -->
<div class="p-md mb-lg">
  <h1 class="text-2xl mb-sm">Heading</h1>
  <p class="mb-md">Content with consistent spacing.</p>
</div>
```

## When to Use This Skill

- Setting up new projects with consistent spacing scales
- Migrating arbitrary spacing values to systematic scales
- Building design systems with Tailwind v4
- Creating responsive spacing that adapts to screen sizes
- Implementing vertical rhythm and layout harmony
- Establishing reusable spacing tokens across teams

## The 8px Grid System Foundation

### Why 8px?

- **Mathematical basis**: 8 divides evenly into common screen sizes (1920, 1440, 1080)
- **Subpixel precision**: Avoids blurring on @1.5× and @2× device pixel ratios (odd numbers cause issues)
- **Industry standard**: Material Design (8dp), IBM Carbon (8px), Apple HIG, Atlassian, Ant Design all use 8px bases
- **Team communication**: "This box is 24px = 3×8px" creates shared language between designers and developers

### Spacing Scale Structure

Start with an 8px base and build multiples:

```
Base unit: 8px
0px   - None
4px   - Half unit (fine details, tight icon padding)
8px   - 1× (elements)
12px  - 1.5× (breathing room between elements)
16px  - 2× (sections, components)
24px  - 3× (spacing between major sections)
32px  - 4× (large sections, containers)
48px  - 6× (page margins)
64px  - 8× (hero spacing)
```

## Tailwind CSS v4 Implementation

### Setting Up with @theme Directive

Tailwind v4 introduces CSS-first configuration using `@theme`:

```css
/* input.css */
@theme {
  --spacing: 0.25rem;
}

@layer theme {
  :root {
    /* T-shirt sizing (semantic tokens) */
    --space-xs: 0.5rem;
    --space-sm: 0.75rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;

    /* Component-specific tokens */
    --button-padding-inline: var(--space-sm);
    --button-padding-block: 0.5rem;
    --card-padding: var(--space-md);
  }

  @media (max-width: 640px) {
    :root {
      --space-lg: 1rem;      /* Reduce desktop spacing on mobile */
      --space-xl: 1.5rem;
    }
  }
}
```

### Extending the Default Scale

```css
/* Override Tailwind's default spacing multiplier */
@theme {
  --spacing: 0.1rem;  /* Change from 0.25rem (4px) to 0.1rem (1.6px) */
}

/* Now p-10 = 1rem, p-20 = 2rem, p-100 = 10rem */
```

### Using Arbitrary Values vs System Values

**Prefer system values:**
```html
<!-- ✅ Good: Uses spacing scale -->
<div class="p-md mb-lg">Content</div>
<div class="p-6 mb-8">Content</div>

<!-- ❌ Avoid: Arbitrary values break scale consistency -->
<div class="p-[13px] mb-[21px]">Content</div>
```

**When to use arbitrary values:**
- One-off exceptions (less than 5% of components)
- Values that genuinely don't fit the scale
- Always prefer extending the scale instead

### Responsive Spacing with Breakpoints

```html
<div class="p-md md:p-lg lg:p-xl">
  Padding: 16px mobile, 24px tablet, 32px desktop
</div>

<div class="gap-sm md:gap-md lg:gap-lg">
  Grid gap adapts across breakpoints
</div>
```

## CSS Custom Properties Patterns

### Naming Convention

```css
:root {
  /* Primitive tokens (base values) */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;

  /* Semantic tokens (usage-based) */
  --spacing-element: var(--space-2);      /* 8px - between inline elements */
  --spacing-component: var(--space-3);    /* 12px - within components */
  --spacing-section: var(--space-4);      /* 16px - between sections */
  --spacing-page: var(--space-6);         /* 24px - page margins */

  /* Component tokens (specific use cases) */
  --button-padding: var(--space-2) var(--space-3);
  --card-padding: var(--space-4);
  --form-gap: var(--space-2);
}
```

### Fluid Spacing with clamp()

Create responsive spacing without media queries:

```css
/* Mobile: 1rem, Desktop: 2rem, adapts fluidly in between */
.section {
  padding: clamp(1rem, 2vw + 1rem, 2rem);
  margin-bottom: clamp(1.5rem, 3vw + 1rem, 3rem);
}

/* Grid gaps that scale with viewport */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: clamp(0.5rem, 2vw, 1rem);
}

/* Responsive button padding */
.button {
  padding: clamp(0.5rem, 1vw, 1rem) clamp(1rem, 2vw, 2rem);
}
```

### Calc() with Spacing Variables

```css
/* Compose complex spacing from base variables */
:root {
  --base-space: 1rem;
  --inset-padding: calc(var(--base-space) * 1.5);
  --section-spacing: calc(var(--base-space) * 3);
  --content-width: calc(100% - (var(--inset-padding) * 2));
}

/* Use in components */
.card {
  padding: var(--inset-padding);
  max-width: calc(100% - var(--inset-padding));
}
```

## Visual Hierarchy Through Whitespace

### Spacing Ratios

```css
/* Consistent ratios create harmony */
:root {
  --space-tight: 0.5rem;     /* 8px - tight internal spacing */
  --space-default: 1rem;     /* 16px - default between elements */
  --space-loose: 1.5rem;     /* 24px - breathing room */
  --space-section: 3rem;     /* 48px - major divisions */
}

/* Apply ratios systematically */
.component {
  padding: var(--space-default);      /* Internal breathing room */
  margin-bottom: var(--space-section); /* Distance to next section */
}
```

### Content Density Patterns

```css
/* Compact (information-heavy) */
.density-compact {
  --spacing-multiplier: 0.75;
  padding: calc(var(--space-md) * var(--spacing-multiplier));
  gap: calc(var(--space-sm) * var(--spacing-multiplier));
}

/* Comfortable (balanced, default) */
.density-comfortable {
  padding: var(--space-md);
  gap: var(--space-sm);
}

/* Spacious (luxury feel) */
.density-spacious {
  padding: calc(var(--space-md) * 1.5);
  gap: calc(var(--space-sm) * 1.5);
}
```

### Vertical Rhythm

```css
/* Base line-height unit drives all spacing */
:root {
  --font-size-base: 1rem;
  --line-height-base: 1.5;
  --rhythm-unit: calc(var(--font-size-base) * var(--line-height-base)); /* 1.5rem */
}

/* Headings and paragraphs align to rhythm */
h1, h2, h3, p, li {
  margin-bottom: var(--rhythm-unit);
  line-height: var(--line-height-base);
}

/* Component spacing maintains rhythm */
.card {
  padding: var(--rhythm-unit);
  gap: var(--rhythm-unit);
}
```

## Responsive Spacing Patterns

### Mobile-First Strategy

```html
<!-- Base: mobile spacing -->
<div class="p-4 gap-3">
  <!-- 16px padding, 12px gap on mobile -->

  <!-- Tablet: add breathing room -->
  <div class="md:p-6 md:gap-4">
    <!-- 24px padding, 16px gap on tablet -->
  </div>

  <!-- Desktop: generous spacing -->
  <div class="lg:p-8 lg:gap-6">
    <!-- 32px padding, 24px gap on desktop -->
  </div>
</div>
```

### Touch Target Spacing

Ensure interactive elements are accessible:

```css
/* Minimum 48px touch target (iOS: 44px, Android: 48px, Material: 48dp) */
.button {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 16px;
}

/* Maintain 8px minimum spacing between targets */
.button-group {
  gap: 8px;
}

/* Icon buttons with invisible touch area */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 12px;  /* Expand touch target to 48px */
}
```

### Container Queries for Component-Level Spacing

```css
/* Apply spacing based on container size, not viewport */
.card {
  contain: layout inline-size;
  padding: var(--space-md);
}

@container (min-width: 400px) {
  .card {
    padding: var(--space-lg);
    gap: var(--space-md);
  }
}

@container (min-width: 600px) {
  .card {
    padding: var(--space-xl);
    gap: var(--space-lg);
  }
}
```

## Common Errors & Solutions

### Error: Margin Collapsing Issues

**Problem:** Sibling margins collapse, not adding as expected.

```css
/* ❌ Wrong: Margins collapse */
.box {
  margin-bottom: 1rem;
}
.next-box {
  margin-top: 1rem;
  /* Only 1rem total gap, not 2rem */
}

/* ✅ Solution 1: Use gap instead (preferred) */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;  /* Consistent 1rem spacing */
}

/* ✅ Solution 2: Use parent padding */
.container {
  padding: 1rem 0;
}
.child {
  margin-bottom: 0;
}

/* ✅ Solution 3: Prevent collapsing */
.container {
  overflow: hidden;  /* Creates block formatting context */
}
```

### Error: Inconsistent Arbitrary Spacing Values

**Problem:** Using `p-[13px]`, `p-[21px]`, `p-[18px]` instead of system scale.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        // Add missing values to scale instead of using arbitrary
        '4.5': '1.125rem',   // 18px
        '5.25': '1.3125rem', // 21px
      }
    }
  }
}

/* Now use p-4.5, p-5.25 instead of arbitrary values */
```

### Error: Breaking Spacing System on Responsive

**Problem:** Spacing looks good on one breakpoint but broken on another.

```html
<!-- ❌ Wrong: No mobile consideration -->
<div class="gap-8 p-12">Breaks on mobile: cramped.</div>

<!-- ✅ Good: Responsive spacing -->
<div class="gap-2 md:gap-4 lg:gap-8 p-4 md:p-8 lg:p-12">
  Adapts across all screen sizes.
</div>
```

### Error: Using margin instead of gap

**Problem:** Complex margin rules when `gap` is simpler.

```css
/* ❌ Complex: Margin workarounds */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.grid-item {
  margin-right: 16px;
  margin-bottom: 16px;
}
.grid-item:last-child {
  margin-right: 0;
}

/* ✅ Simple: Use gap */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;  /* Handles all spacing */
}
```

### Error: Ignoring Content Density

**Problem:** Using same spacing for dense forms and spacious cards.

```html
<!-- ❌ Same spacing everywhere -->
<form class="space-y-4">
  <input class="p-4" />
  <input class="p-4" />
</form>

<!-- ✅ Appropriate density -->
<form class="space-y-2"><!-- Form fields close together -->
  <input class="p-2" />
</form>

<div class="space-y-6 p-6"><!-- Cards spacious -->
  <div>Content</div>
</div>
```

## Code Examples

### Complete Spacing System Setup

```css
/* styles/spacing.css */
@layer theme {
  :root {
    /* Primitive spacing tokens */
    --space-0: 0;
    --space-px: 1px;
    --space-0.5: 0.125rem;
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    --space-16: 4rem;
    --space-20: 5rem;
    --space-24: 6rem;

    /* Semantic spacing names */
    --spacing-xs: var(--space-2);
    --spacing-sm: var(--space-4);
    --spacing-md: var(--space-6);
    --spacing-lg: var(--space-8);
    --spacing-xl: var(--space-12);
    --spacing-2xl: var(--space-16);

    /* Component-specific tokens */
    --button-padding-x: var(--space-4);
    --button-padding-y: var(--space-2);
    --card-padding: var(--space-6);
    --form-gap: var(--space-4);
    --grid-gap: var(--space-6);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    :root {
      --spacing-lg: var(--space-6);
      --spacing-xl: var(--space-8);
      --card-padding: var(--space-4);
    }
  }
}

/* Utility for manual rhythm adjustment */
@layer utilities {
  .space-rhythm {
    margin-bottom: var(--rhythm-unit, 1.5rem);
  }

  .gap-rhythm {
    gap: var(--rhythm-unit, 1.5rem);
  }
}
```

### Component with Proper Spacing

```jsx
export function Card({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-md gap-sm flex flex-col">
      {children}
    </div>
  );
}

export function Form({ onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-form">
      {children}
    </form>
  );
}

export function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {children}
    </div>
  );
}
```

### Fluid Spacing for Responsive Pages

```css
/* styles/fluid.css */
@layer utilities {
  .container-fluid-padding {
    padding-left: clamp(1rem, 4vw, 3rem);
    padding-right: clamp(1rem, 4vw, 3rem);
  }

  .section-spacing {
    margin-bottom: clamp(2rem, 5vw, 4rem);
  }

  .component-gap {
    gap: clamp(0.75rem, 2vw, 1.5rem);
  }
}

/* Usage */
html {
  <div class="container-fluid-padding">
    <section class="section-spacing">
      Spacing adapts fluidly from mobile to desktop
    </section>
  </div>
}
```

## Best Practices

### 1. Document Your Spacing Scale

Create a living reference:

```markdown
# Spacing Scale

| Token | CSS | Pixels | Usage |
|-------|-----|--------|-------|
| xs | 0.5rem | 8px | Tight spacing, icon padding |
| sm | 1rem | 16px | Default element spacing |
| md | 1.5rem | 24px | Section spacing |
| lg | 2rem | 32px | Major sections |
| xl | 3rem | 48px | Page margins |
```

### 2. Enforce Consistency Through Code

```javascript
// Don't rely on memory—use linting
module.exports = {
  rules: {
    'color-named': 'never', // Enforce token usage
    'function-disallowed-list': ['px'], // Disallow direct pixel values
  }
}
```

### 3. Build Component Libraries with Fixed Tokens

```jsx
// Button always uses predefined spacing
function Button({ children, size = 'md' }) {
  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  };
  return <button className={`bg-primary ${sizes[size]}`}>{children}</button>;
}
```

### 4. Test Across Devices and Densities

- Mobile (375px, 414px, 768px)
- Tablet (768px, 1024px)
- Desktop (1440px, 1920px)
- Both portrait and landscape

### 5. Use Gap Over Margin for Layout Containers

```css
/* ✅ Gap: Cleaner, consistent */
.flex-container {
  display: flex;
  gap: var(--spacing-md);
}

/* ❌ Margin: More complex */
.flex-container > * {
  margin-right: var(--spacing-md);
}
.flex-container > *:last-child {
  margin-right: 0;
}
```

### 6. Consider Touch Targets in Spacing

```css
/* Ensure 48px minimum touch targets */
.button {
  min-width: 48px;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
}

/* Maintain 8px gap between interactive elements */
.button-group {
  gap: 8px;
}
```

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS @theme Directive](https://tailwindcss.com/docs/adding-custom-styles#using-theme)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Material Design 3 - Spacing](https://m3.material.io/foundations/layout/understanding-layout/parts-of-the-layout)
- [IBM Carbon Design System - Spacing](https://carbondesignsystem.com/elements/spacing/overview/)
- [CSS clamp() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [CSS Grid gap Property](https://developer.mozilla.org/en-US/docs/Web/CSS/gap)
- [Vertical Rhythm in Web Typography](https://betterwebtype.com/rhythm-in-web-typography/)
- [WCAG 2.5.5 Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Web.dev - Accessible Tap Targets](https://web.dev/articles/accessible-tap-targets)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Container_queries)