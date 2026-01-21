---
name: implementing-typography-systems
description: Implements professional typography systems with modular scales, responsive sizing, font pairing strategies, and web font performance optimization for modern web applications. Use when building design systems, setting up typography tokens, creating fluid type scales, configuring fonts in Next.js/Tailwind, or optimizing web font loading.
---

# Implementing Typography Systems & Responsive Type (2024-2025)

## Quick Start

Set up a complete typography system with CSS custom properties, modular scales, and responsive sizing:

```css
:root {
  /* Modular scale (1.25 major third ratio) */
  --font-size-base: 1rem;
  --font-size-ratio: 1.25;
  
  /* Typography scale steps */
  --font-size-xs: calc(var(--font-size-base) / var(--font-size-ratio) / var(--font-size-ratio));
  --font-size-sm: calc(var(--font-size-base) / var(--font-size-ratio));
  --font-size-md: var(--font-size-base);
  --font-size-lg: calc(var(--font-size-base) * var(--font-size-ratio));
  --font-size-xl: calc(var(--font-size-base) * var(--font-size-ratio) * var(--font-size-ratio));
  --font-size-2xl: calc(var(--font-size-xl) * var(--font-size-ratio));
  --font-size-3xl: calc(var(--font-size-2xl) * var(--font-size-ratio));
  
  /* Fluid responsive sizing */
  --font-size-h1: clamp(1.75rem, calc(1.25rem + 2.5vw), 3.5rem);
  --font-size-h2: clamp(1.5rem, calc(1rem + 2vw), 3rem);
  --font-size-h3: clamp(1.25rem, calc(0.875rem + 1.5vw), 2.5rem);
  
  /* Line height */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;
  
  /* Vertical rhythm baseline */
  --baseline-grid: 1.5rem;
  
  /* Font families */
  --font-serif: 'Georgia', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Courier New', monospace;
}

/* Base typography */
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Headings */
h1 {
  font-size: var(--font-size-h1);
  line-height: var(--line-height-tight);
  margin-bottom: var(--baseline-grid);
}

h2 {
  font-size: var(--font-size-h2);
  line-height: calc(var(--line-height-tight) * 1.2);
  margin-bottom: calc(var(--baseline-grid) * 0.75);
}

p {
  line-height: var(--line-height-normal);
  margin-bottom: var(--baseline-grid);
  max-width: 65ch;
}
```

## When to Use This Skill

- Building design systems from scratch
- Setting up typography tokens for Tailwind/CSS-in-JS
- Creating fluid, responsive type scales
- Optimizing web font loading and performance
- Implementing accessible typography with proper contrast and sizing
- Configuring fonts in Next.js or modern frameworks
- Designing responsive layouts that scale gracefully across devices
- Fixing typography inconsistencies or layout shift issues

## Modular Type Scales

### Common Scale Ratios

A modular scale uses mathematical ratios to create harmonious relationships between font sizes. Each step is calculated by multiplying the previous size by the ratio.

| Ratio | Name | Use Case | Calculation Example |
|-------|------|----------|---------------------|
| 1.067 | Minor Second | Subtle, minimal change | 16px × 1.067 = 17.07px |
| 1.125 | Major Second | Safe, professional | 16px × 1.125 = 18px |
| 1.2 | Minor Third | Common, balanced | 16px × 1.2 = 19.2px |
| 1.25 | Major Third | Gentle hierarchy | 16px × 1.25 = 20px |
| 1.333 | Perfect Fourth | Musical harmony | 16px × 1.333 = 21.33px |
| 1.414 | Augmented Fourth | Strong differentiation | 16px × 1.414 = 22.63px |
| 1.5 | Perfect Fifth | Bold, dramatic | 16px × 1.5 = 24px |
| 1.618 | Golden Ratio | Natural, aesthetic | 16px × 1.618 = 25.89px |

### Mathematical Formula

For a type scale with base size **B** and ratio **R**, step **N**:

```
font-size(N) = B × R^N
```

For negative steps (smaller than base): use negative exponents
```
font-size(-1) = B × R^(-1) = B / R
font-size(-2) = B × R^(-2) = B / (R × R)
```

### CSS Implementation

```css
/* Pure CSS calculation */
:root {
  --base-size: 1rem;
  --ratio: 1.25; /* Major Third */
  
  /* Step down */
  --h6: calc(var(--base-size) / var(--ratio));
  --h5: calc(var(--h6) / var(--ratio));
  
  /* Step up */
  --h4: calc(var(--base-size) * var(--ratio));
  --h3: calc(var(--h4) * var(--ratio));
  --h2: calc(var(--h3) * var(--ratio));
  --h1: calc(var(--h2) * var(--ratio));
}

h1 { font-size: var(--h1); }
h2 { font-size: var(--h2); }
h3 { font-size: var(--h3); }
```

### Responsive Scale Ratios

Adjust scale ratio at different breakpoints:

```css
:root {
  --ratio: 1.2; /* Mobile: subtle */
  --font-size-h1: calc(var(--base-size) * var(--ratio) * var(--ratio) * var(--ratio));
}

@media (min-width: 768px) {
  :root {
    --ratio: 1.333; /* Tablet: more contrast */
  }
}

@media (min-width: 1024px) {
  :root {
    --ratio: 1.5; /* Desktop: bold hierarchy */
  }
}
```

## Fluid Responsive Typography

### CSS clamp() Formula

The `clamp()` function allows smooth scaling between minimum and maximum sizes:

```css
font-size: clamp(min-value, preferred-value, max-value);
```

### Calculating Preferred Value

The mathematical formula for the "preferred value" that creates linear scaling:

```
slope = (max-font-size - min-font-size) / (max-viewport-width - min-viewport-width)
fluid-value = slope × 100 (to convert to vw)
intercept = min-font-size - (slope × min-viewport-width)
preferred = fluid-value(vw) + intercept
```

**Example calculation:**
- Min font size: 16px (1rem) at 320px viewport
- Max font size: 32px (2rem) at 1920px viewport

```
slope = (32 - 16) / (1920 - 320) = 16 / 1600 = 0.01
fluid-value = 0.01 × 100 = 1vw
intercept = 16 - (0.01 × 320) = 16 - 3.2 = 12.8px
```

Result:
```css
font-size: clamp(1rem, 1vw + 0.8rem, 2rem);
```

### Practical Clamp Examples

```css
/* Body text: scales from 16px to 20px */
body {
  font-size: clamp(1rem, 1vw + 0.5rem, 1.25rem);
  line-height: clamp(1.5, calc(1em + 0.5vw), 1.75);
}

/* Large heading: scales from 24px to 48px */
h1 {
  font-size: clamp(1.5rem, 3vw + 0.75rem, 3rem);
  line-height: 1.2;
}

/* Medium heading: scales from 20px to 36px */
h2 {
  font-size: clamp(1.25rem, 2vw + 0.5rem, 2.25rem);
  line-height: 1.3;
}

/* Display text with tighter constraints */
.display {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

### Using Container Queries for Typography

For component-specific responsive sizing:

```css
/* Parent must be a container */
.card {
  container-type: inline-size;
}

/* Typography scales based on container width, not viewport */
@container (min-width: 300px) {
  .card h2 {
    font-size: 1.25rem;
  }
}

@container (min-width: 500px) {
  .card h2 {
    font-size: 1.75rem;
  }
}

/* Or use container query units with clamp */
.card p {
  font-size: clamp(0.875rem, 2.5cqw, 1.125rem);
}
```

## Line Height & Vertical Rhythm

### Optimal Line Heights

| Context | Ratio | Pixels (16px base) | Rationale |
|---------|-------|-------------------|-----------|
| Tight headings | 1.1–1.2 | 17.6–19.2px | Compact, powerful |
| Body text (print) | 1.5 | 24px | Optimal for long reads |
| Body text (web) | 1.6–1.7 | 25.6–27.2px | Readable on screen |
| Large text | 1.4–1.5 | 22.4–24px | Avoid excessive gaps |
| Small text (UI) | 1.4 | 19.6px | Compact but readable |

### Best Practice: Unitless Line Height

Use unitless values for inheritance and proportional sizing:

```css
/* ✓ Good: proportional to font-size */
h1 {
  font-size: 2rem;
  line-height: 1.2; /* Computes to 2.4rem */
}

/* ✗ Avoid: fixed pixels don't scale */
h1 {
  font-size: 2rem;
  line-height: 24px; /* Doesn't scale with font-size */
}
```

### Vertical Rhythm with Baseline Grid

Base vertical spacing on body line-height:

```css
/* Body sets baseline grid */
body {
  font-size: 1rem;
  line-height: 1.5; /* 24px baseline unit */
}

/* All spacing should be multiples of baseline */
h1 {
  font-size: 2rem;
  line-height: 1.2; /* 2.4rem, but needs adjustment */
  margin-bottom: 1.5rem; /* 1 baseline unit */
}

h2 {
  font-size: 1.5rem;
  line-height: 1.6; /* 2.4rem, aligns with grid */
  margin-bottom: 1.5rem;
}

p {
  margin-bottom: 1.5rem; /* 1 baseline unit */
}

/* Tight spacing when needed */
.meta {
  font-size: 0.875rem;
  line-height: 1.5; /* 1.3125rem */
  margin-bottom: 0.75rem; /* Half unit */
}
```

### Responsive Line Height

Adjust line-height for different contexts:

```css
/* Mobile: tighter for small screens */
body {
  font-size: 1rem;
  line-height: 1.5;
}

/* Desktop: looser for larger text */
@media (min-width: 768px) {
  body {
    font-size: 1.0625rem;
    line-height: 1.6;
  }
}

/* Fluid line height with clamp */
p {
  font-size: 1rem;
  line-height: clamp(1.4, 1em + 0.2vw, 1.8);
}
```

## Font Pairing Guide

### Pairing Principles

**1. Contrast but harmony:**
- Pair serif with sans-serif for strong contrast
- Ensure shared characteristics (x-height, weight distribution)
- Avoid pairing fonts that fight each other (e.g., ultra-geometric with traditional serif)

**2. Mood consistency:**
- Both fonts should align with brand personality
- Classic serif + classic sans-serif = traditional
- Modern sans + modern sans = contemporary
- Display font + minimal body = editorial

**3. Visual weight:**
- Display font should be notably bolder/lighter than body
- If using similar weights, vary width or style (italic)

### Proven Google Fonts Pairings (2024-2025)

| Heading | Body | Style | Best For |
|---------|------|-------|----------|
| Playfair Display | Source Sans Pro | Classic | Luxury, editorial, premium |
| Montserrat | Open Sans | Modern | Tech, SaaS, contemporary |
| Inter | DM Serif Display | Clean-editorial | News, blogs, magazines |
| Merriweather | Lato | Traditional-modern | Corporations, nonprofits |
| Raleway | Open Sans | Minimal | Portfolios, minimalist design |
| Libre Baskerville | Source Sans Pro | Elegant | Fashion, lifestyle |
| Figtree | Space Mono | Geometric-technical | Design-focused, creative |
| Cormorant Garamond | Raleway | Sophisticated | Luxury, events, high-end |

### Font Pairing Implementation

```css
/* Import fonts (Next.js example) */
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap'
});

const bodyFont = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap'
});

/* CSS implementation */
:root {
  --font-serif: 'Playfair Display', serif;
  --font-sans: 'Source Sans Pro', sans-serif;
}

h1, h2, h3 {
  font-family: var(--font-serif);
  font-weight: 600;
}

body, p, .text {
  font-family: var(--font-sans);
  font-weight: 400;
}
```

### Font Pairing Checklist

- ✅ Compare x-height between fonts (should be similar)
- ✅ Test at multiple sizes (heading, body, small text)
- ✅ Check both light and dark backgrounds
- ✅ Verify on different devices
- ✅ Limit to 2–3 font families maximum
- ✅ Use varying weights/styles, not multiple families
- ✅ Test different font weights for hierarchy

## Web Font Performance Optimization

### Font Loading Strategies

| Strategy | Font-Display | Block Period | Swap Period | Best For | Risk |
|----------|--------------|--------------|-------------|----------|------|
| **Optimal (Recommended)** | `swap` | 0ms | ∞ | Most sites | Brief FOUT on repeat visits |
| **Performance-Critical** | `optional` | 100ms | 0ms | Non-essential fonts | Font might not appear |
| **Fallback Balance** | `fallback` | 100ms | 3s | Secondary fonts | Layout shift after swap |
| **Brand-Critical** | `block` | 2–3s | ∞ | Logos, key branding | Invisible text (FOIT) |
| **Fastest** | `auto` | Browser-dependent | Browser-dependent | Legacy systems | Inconsistent behavior |

```css
/* Recommended: font-display: swap */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* ← Use this */
}

/* Alternative: font-display: optional for non-critical */
@font-face {
  font-family: 'DecorativeFont';
  src: url('/fonts/decorative.woff2') format('woff2');
  font-display: optional;
}
```

### Preloading Critical Fonts

```html
<!-- Preload 1-2 critical fonts only -->
<link rel="preload" 
      href="/fonts/display-font.woff2" 
      as="font" 
      type="font/woff2" 
      crossorigin>

<link rel="preload" 
      href="/fonts/body-font.woff2" 
      as="font" 
      type="font/woff2" 
      crossorigin>
```

### Font Subsetting for Performance

```css
/* Only load Latin characters */
@font-face {
  font-family: 'Roboto';
  src: url('/fonts/roboto-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

### Fallback Font Matching to Reduce CLS

Use `size-adjust` and `ascent-override` for minimal layout shift:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  size-adjust: 100%; /* Match to fallback proportions */
  ascent-override: 90%; /* Reduce ascender height */
  descent-override: 22%;
}

/* Or use automatic fallback with next/font */
/* Next.js does this automatically */
```

### Variable Fonts Performance

Variable fonts can be significantly smaller (60–88% reduction) when using 3+ styles:

```css
/* Single variable font instead of 3 static files */
@font-face {
  font-family: 'RobotoVariable';
  src: url('/fonts/roboto-variable.woff2') format('woff2');
  font-weight: 100 900; /* Supports entire range */
  font-style: normal;
  font-display: swap;
}

h1 {
  font-family: 'RobotoVariable';
  font-weight: 700;
}

h2 {
  font-family: 'RobotoVariable';
  font-weight: 600;
}

body {
  font-family: 'RobotoVariable';
  font-weight: 400;
}
```

## Next.js Font Optimization

### Next.js 13+ with next/font

```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-playfair' // CSS variable
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}

// Use CSS variables in CSS
/* styles.css */
h1 {
  font-family: var(--font-playfair);
  font-size: 2rem;
}

body {
  font-family: inherit; /* Falls back to inter.className */
}
```

### Local Fonts in Next.js

```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const customFont = localFont({
  src: [
    { path: '/fonts/custom-400.woff2', weight: '400', style: 'normal' },
    { path: '/fonts/custom-700.woff2', weight: '700', style: 'normal' },
    { path: '/fonts/custom-700i.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-custom',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={customFont.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Benefits of next/font

- ✅ Self-hosted fonts (no external requests)
- ✅ Automatic subsetting (Latin subset by default)
- ✅ Preloading at build time
- ✅ Automatic fallback matching (minimal layout shift)
- ✅ Caching and optimization built-in
- ✅ Zero layout shift (FOIT/FOUT mitigation)

## Tailwind CSS Typography

### Tailwind 4 Typography Scale

```css
/* tailwind.config.js with @theme */
@theme {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  /* With line-height */
  --text-lg--line-height: 1.75rem;
}
```

### Custom Fluid Typography in Tailwind

```javascript
// tailwind.config.js
export default {
  theme: {
    fontSize: {
      'display': 'clamp(2rem, 5vw, 4rem)',
      'h1': 'clamp(1.75rem, calc(1.25rem + 2.5vw), 3.5rem)',
      'h2': 'clamp(1.5rem, calc(1rem + 2vw), 3rem)',
      'h3': 'clamp(1.25rem, calc(0.875rem + 1.5vw), 2.5rem)',
      'body': 'clamp(1rem, 1vw + 0.5rem, 1.25rem)',
      'sm': 'clamp(0.875rem, 0.8vw + 0.75rem, 1rem)',
    },
    lineHeight: {
      'tight': '1.2',
      'normal': '1.5',
      'relaxed': '1.75',
      'loose': '2',
    },
  },
};
```

### Tailwind Typography Plugin

```javascript
// tailwind.config.js
import typography from '@tailwindcss/typography';

export default {
  plugins: [typography],
};
```

```html
<!-- Uses default prose typography -->
<article class="prose prose-lg dark:prose-invert max-w-4xl">
  <h1>Article Title</h1>
  <p>Article content with automatic typography styling</p>
</article>
```

### Responsive Tailwind Typography

```html
<!-- Scale typography responsively -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
  Responsive Heading
</h1>

<!-- Line height with font size -->
<p class="text-base/relaxed md:text-lg/loose lg:text-xl/relaxed">
  Body text with responsive line-height
</p>
```

## Accessibility Standards

### Minimum Font Sizes

| Context | Minimum Size | Rationale |
|---------|--------------|-----------|
| Body text | 14px | WCAG AA compliance |
| Small text (labels, captions) | 12px | Readable with 1.5× magnification |
| Large text (headings) | 18px+ | For hierarchy clarity |
| Mobile body | 16px minimum | Prevents zoom on focus |
| Touch targets (buttons) | 44px height minimum | Mobile accessibility |

### Color Contrast Requirements

| Text Type | Minimum Ratio | WCAG Level |
|-----------|---------------|-----------|
| Normal text | 4.5:1 | AA |
| Large text (18px+) | 3:1 | AA |
| Normal text | 7:1 | AAA |
| Large text | 4.5:1 | AAA |

```css
/* Ensure adequate contrast */
body {
  color: #1a1a1a; /* Dark text on light background */
  background: #ffffff;
  /* Contrast ratio: 19:1 ✓ Excellent */
}

.secondary {
  color: #666666; /* Reduces to 7:1, still AA */
}
```

## Common Errors & Solutions

### Error 1: Invisible Text (FOIT)

**Problem:** Text disappears while custom font loads

**Solution:** Use `font-display: swap`

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* ← Fixes FOIT */
}
```

### Error 2: Layout Shift During Font Swap (CLS)

**Problem:** Page layout jumps when fallback font swaps to custom

**Solution:** Match fallback font size-adjust

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  size-adjust: 97%; /* Adjust to match System UI proportions */
  font-display: swap;
}
```

Or use Next.js (handles automatically):

```typescript
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: '400',
  display: 'swap', // Next.js adds fallback matching
});
```

### Error 3: Unreadable Mobile Text

**Problem:** Body text too small on mobile devices

**Solution:** Use minimum 16px or responsive sizing

```css
/* ✗ Too small on mobile */
body {
  font-size: 14px;
}

/* ✓ Responsive sizing */
body {
  font-size: 14px;
}

@media (min-width: 768px) {
  body {
    font-size: 16px;
  }
}

/* ✓ Or use clamp */
body {
  font-size: clamp(14px, 2vw, 18px);
}
```

### Error 4: Line Height Too Tight

**Problem:** Text bunches together, reducing readability

**Solution:** Use unitless line-height of 1.5–1.7 for body

```css
/* ✗ Too tight */
p {
  line-height: 1.2;
}

/* ✓ Readable */
p {
  line-height: 1.6;
}
```

### Error 5: Too Many Font Families

**Problem:** Page load slowed by multiple fonts

**Solution:** Limit to 2–3 font families

```css
/* ✗ Performance issue */
h1 { font-family: 'Font1'; }
h2 { font-family: 'Font2'; }
p { font-family: 'Font3'; }
.meta { font-family: 'Font4'; }

/* ✓ Better */
h1, h2, h3 { font-family: 'DisplayFont'; }
p, .meta, body { font-family: 'BodyFont'; }
```

## Code Examples

### Complete Design System Setup

```typescript
// lib/typography.ts
export const typographyStyles = {
  // Modular scale with CSS custom properties
  scale: {
    xs: 'clamp(0.75rem, 1vw, 0.875rem)',
    sm: 'clamp(0.875rem, 1.2vw, 1rem)',
    base: 'clamp(1rem, 1.5vw, 1.125rem)',
    lg: 'clamp(1.125rem, 2vw, 1.25rem)',
    xl: 'clamp(1.25rem, 2.5vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 3vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 4vw, 2.25rem)',
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font families
  fonts: {
    serif: 'ui-serif, Georgia, serif',
    sans: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    mono: 'ui-monospace, Courier New, monospace',
  },
};

// CSS usage
/* styles.css */
:root {
  --font-xs: clamp(0.75rem, 1vw, 0.875rem);
  --font-base: clamp(1rem, 1.5vw, 1.125rem);
  --font-lg: clamp(1.25rem, 2.5vw, 1.5rem);
  --line-height-normal: 1.5;
  --baseline: 1.5rem;
}

body {
  font-family: var(--font-sans);
  font-size: var(--font-base);
  line-height: var(--line-height-normal);
}
```

### Responsive Typography with Container Queries

```typescript
// components/Card.tsx
'use client';

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-card">
      {children}
    </div>
  );
}

// styles/card.css
.container-card {
  container-type: inline-size;
  padding: 1.5rem;
  border: 1px solid #ccc;
}

/* Scale typography based on card width */
@container (min-width: 200px) {
  .container-card h2 {
    font-size: clamp(1rem, 4cqw, 1.5rem);
  }
  
  .container-card p {
    font-size: clamp(0.875rem, 2cqw, 1rem);
  }
}

@container (min-width: 400px) {
  .container-card h2 {
    font-size: 1.75rem;
  }
}
```

### Font Feature Settings

```css
/* Enable advanced typography features */
body {
  font-feature-settings: 
    'kern' 1,      /* Kerning pairs */
    'liga' 1,      /* Standard ligatures (fi, fl) */
    'dlig' 0,      /* Discretionary ligatures (ct, st) */
    'ss01' 1,      /* Stylistic set 1 */
    'calt' 1;      /* Contextual alternates */
  font-kerning: auto;
  font-variant-numeric: proportional-nums;
  text-rendering: optimizeLegibility;
}

/* Disable for monospace */
code, pre {
  font-feature-settings: 'kern' 0, 'liga' 0;
  font-variant-numeric: tabular-nums;
}
```

## Best Practices

1. **Use CSS custom properties** - Makes scaling, maintenance, and dark mode handling easier
2. **Prefer unitless line-height** - Scales proportionally with font-size changes
3. **Start with modular scale** - Creates visual harmony automatically
4. **Test font pairings widely** - Check at multiple sizes and on real devices
5. **Optimize fonts aggressively** - Subset, use WOFF2, limit families to 2–3
6. **Use Next.js next/font** - Eliminates most performance issues automatically
7. **Implement proper fallbacks** - Prevent layout shift with size-adjust or size-adjust descriptors
8. **Set minimum mobile font size** - Always 16px+ for mobile body text
9. **Use clamp() for fluid typography** - Smoother scaling than media queries
10. **Monitor Core Web Vitals** - Font loading affects CLS (Cumulative Layout Shift)

## Performance Checklist

- [ ] Use modern WOFF2 format (97%+ browser support)
- [ ] Preload max 1–2 critical fonts
- [ ] Set `font-display: swap` on @font-face rules
- [ ] Implement font subsetting (Latin, specific language)
- [ ] Use variable fonts when using 3+ weights/styles
- [ ] Configure fallback font size-adjust to prevent CLS
- [ ] Limit font families to 2–3 maximum
- [ ] Remove unused font weights
- [ ] Cache fonts with long expiration headers
- [ ] Test with Google PageSpeed Insights
- [ ] Monitor Cumulative Layout Shift (CLS) metric
- [ ] Use Next.js next/font for automatic optimization

## References

**Official Documentation:**
- [MDN: CSS Font Loading](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts)
- [W3C CSS Fonts Module Level 3](https://www.w3.org/TR/css-fonts-3/)
- [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts)
- [Tailwind CSS Typography](https://tailwindcss.com/docs/font-size)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Container_queries)

**Tools & Calculators:**
- [Utopia Fluid Type Scale Generator](https://utopia.fyi/)
- [Type Scale Calculator](https://www.typescale.com/)
- [Clamp Calculator](https://www.clamp-calculator.com/)
- [Modular Scale](https://www.modularscale.com/)
- [Variable Fonts Directory](https://v-fonts.com/)
- [Google Fonts](https://fonts.google.com/)
- [Fontsource (Self-hosting)](https://fontsource.org/)

**Performance & Best Practices:**
- [Web Font Loading Performance - DebugBear](https://www.debugbear.com/blog/website-font-performance)
- [Font Loading Strategies - web.dev](https://web.dev/fonts/)
- [Variable Fonts Performance - RyanCCN](https://ryanccn.dev/posts/performance-tales-fonts/)
- [CSS Baseline & Vertical Rhythm - Smashing Magazine](https://www.smashingmagazine.com/2012/12/css-baseline-the-good-the-bad-and-the-ugly/)
