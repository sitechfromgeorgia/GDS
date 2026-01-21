---
name: modern-responsive-layouts-tailwind-grid
description: Implements professional-grade responsive layouts using Tailwind CSS v4, CSS Grid, Container Queries, and Subgrid with mobile-first design principles. Use when building dashboard layouts, hero sections, card grids, or component-driven UIs that adapt to container and viewport changes.
---

# Modern Responsive Layouts: Tailwind v4 & CSS Grid

## Quick Start

### Tailwind v4 with CSS Variables Configuration

```css
/* app.css */
@import "tailwindcss";

@theme {
  --breakpoint-xs: 30rem;   /* 480px */
  --breakpoint-sm: 40rem;   /* 640px */
  --breakpoint-md: 48rem;   /* 768px */
  --breakpoint-lg: 64rem;   /* 1024px */
  --breakpoint-xl: 80rem;   /* 1280px */
  --breakpoint-2xl: 96rem;  /* 1536px */
}
```

### Container Query Enablement (v4 Built-in)

```html
<!-- Mark parent as container; children use @sm:, @md:, @lg: variants -->
<section class="@container p-6">
  <div class="grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-4">
    <!-- Cards respond to section width, not viewport -->
  </div>
</section>
```

### Holy Grail Layout (Grid + Responsive)

```html
<div class="grid min-h-screen grid-cols-1 md:grid-cols-[200px_1fr_200px] grid-rows-[auto_1fr_auto]">
  <header class="md:col-span-3 bg-slate-900 text-white p-4">Header</header>
  
  <aside class="hidden md:block bg-slate-100 p-4">Left Nav</aside>
  
  <main class="bg-white p-6 overflow-y-auto">Main Content</main>
  
  <aside class="hidden md:block bg-slate-100 p-4">Sidebar</aside>
  
  <footer class="md:col-span-3 bg-slate-900 text-white p-4 text-center">Footer</footer>
</div>

<!-- Mobile stacks vertically -->
<style>
  @media (max-width: 768px) {
    /* Automatically stacks; grid-cols-1 applies */
  }
</style>
```

---

## When to Use This Skill

- **Responsive dashboards** with headers, sidebars, main content
- **Component-driven UIs** that need container-based responsiveness (cards, widgets)
- **Hero sections** with split-screen (desktop) → stacked (mobile) layouts
- **Product grids** using intrinsic design (`minmax()`, `auto-fit`)
- **Multi-language layouts** requiring logical properties (`margin-inline`, `padding-block`)
- **Mobile-first design** with thumb-zone navigation

---

## Grid vs Flexbox Decision Tree

Choose the **correct layout system** for your use case:

| Scenario | Use | Reason |
|----------|-----|--------|
| **Two-dimensional layout** (rows AND columns) | Grid | Explicit control over both axes |
| **Complex page structure** (header, sidebar, main, footer) | Grid | Grid Template Areas or explicit positioning |
| **One-dimensional flow** (stacking or horizontal list) | Flexbox | Simpler mental model; auto-wrapping |
| **Centering content** (vertical + horizontal) | Flexbox | `justify-center`, `items-center` shortcuts |
| **Equal-height columns** | Grid or Flexbox | Grid: use `fr` units; Flexbox: use `flex-col` with `flex-1` |
| **Intrinsic responsiveness** (no media queries needed) | Grid + `minmax()`, `auto-fit` | Container responds to its own width |
| **Component-level responsive** (width of parent, not viewport) | Container Queries | `@container`, `@sm:`, `@md:` |

---

## Tailwind v4 Responsive Modifiers & Container Units Cheat Sheet

### Viewport Breakpoints (Mobile-First)

```html
<!-- Base styles apply to all sizes -->
<div class="grid-cols-1 gap-4">
  <!-- At sm (40rem+): 2 columns -->
  sm:grid-cols-2
  <!-- At md (48rem+): 3 columns -->
  md:grid-cols-3
  <!-- At lg (64rem+): 4 columns -->
  lg:grid-cols-4
</div>
```

### Breakpoint Ranges (v4 Feature)

```html
<!-- Styles apply ONLY within range -->
<div class="md:max-lg:flex md:max-lg:flex-col">
  <!-- Flexbox + column direction only at md breakpoint, reverts at lg+ -->
</div>
```

### Container Query Variants

```html
<section class="@container">
  <div class="flex-col @sm:flex-row @md:grid @md:grid-cols-2 @lg:grid-cols-4">
    <!-- Sizes based on @container width, not viewport -->
    <!-- @min-sm: 40rem, @sm: 40rem, @md: 48rem, @lg: 64rem -->
  </div>
</section>
```

### Viewport Units (Mobile-Safe)

```html
<!-- dvh = dynamic viewport height (better on mobile with dynamic toolbars) -->
<div class="h-dvh">100% viewport height (accounts for mobile address bar)</div>

<!-- svh = small viewport height (ignores dynamic toolbars) -->
<div class="h-svh">Smaller viewport (strict height)</div>

<!-- lvh = large viewport height (ignores dynamic toolbars fully) -->
<div class="h-lvh">Larger viewport (browser UI not shown)</div>
```

---

## Grid & Flexbox Patterns

### Pattern 1: Intrinsic Responsive Grid (No Media Queries)

```jsx
// React + Tailwind v4
export function ResponsiveCardGrid() {
  return (
    <div className="grid gap-4" style={{
      gridTemplateColumns: "repeat(auto-fit, minmax(min(15rem, 100%), 1fr))"
    }}>
      {/* Each card is at least 15rem, grows to fill, responsive to container width */}
      <Card />
      <Card />
      <Card />
    </div>
  );
}

// Tailwind utility (if using Tailwind's arbitrary values):
// <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))]">
```

**Why this works:**
- `minmax(min(15rem, 100%), 1fr)` ensures columns never exceed container width
- `auto-fit` creates columns only when space exists
- No breakpoints needed; responds to container size in real-time

### Pattern 2: Subgrid for Aligned Card Content (v4 + Modern Browsers)

```jsx
// Card container with subgrid (Chrome 118+, Safari 16.6+, Firefox 71+)
export function CardWithSubgrid() {
  return (
    <article className="grid gap-4 p-4 bg-white rounded-lg border" style={{
      gridTemplateRows: "auto 1fr auto"
    }}>
      <header className="font-bold">Card Title</header>
      <p>Card content grows to fill space</p>
      <footer className="text-sm text-gray-600">Footer aligned</footer>
    </article>
  );
}

// Parent grid with subgrid children (all footers align):
function CardGrid() {
  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
      <Card />
      <Card />
      <Card />
    </div>
  );
}
```

**CSS for subgrid (full alignment across cards):**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-auto-rows: 1fr; /* Equal heights */
}

.card {
  display: grid;
  grid-template-rows: subgrid; /* Inherit parent's row tracks */
  grid-row: span 3; /* Match parent's row count */
}
```

### Pattern 3: Fluid Typography with Clamp

```jsx
export function FluidTypography() {
  return (
    <div>
      {/* Scales from 1rem (mobile) → 2rem (desktop) */}
      <h1 style={{ fontSize: "clamp(1rem, 2.5vw, 2rem)" }}>
        Responsive Heading
      </h1>
      
      {/* Scales from 0.875rem → 1.125rem */}
      <p style={{ fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)" }}>
        Body text scales smoothly
      </p>
    </div>
  );
}

// Tailwind v4 with @theme variables:
@theme {
  --font-size-h1: clamp(1rem, 2.5vw, 2rem);
  --font-size-body: clamp(0.875rem, 1.5vw, 1.125rem);
}

// Usage:
<h1 class="text-[var(--font-size-h1)]">Heading</h1>
```

**Clamp Calculator Formula:**
```
clamp(min, preferred, max)
min: absolute minimum (e.g., 1rem for mobile)
preferred: scales with viewport (e.g., 2.5vw)
max: absolute maximum (e.g., 2rem for desktop)
```

### Pattern 4: Holy Grail with Sidebar Collapse

```jsx
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_1fr] grid-rows-[60px_1fr_60px]">
      {/* Header spans full width */}
      <header className="md:col-span-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 flex items-center justify-between">
        <h1>Dashboard</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
          ☰
        </button>
      </header>

      {/* Sidebar (hidden on mobile unless open) */}
      {sidebarOpen && (
        <aside className="bg-slate-100 border-r border-slate-300 p-6 overflow-y-auto md:block">
          <nav className="space-y-4">
            <a href="#" className="block text-slate-700 hover:text-blue-600">Dashboard</a>
            <a href="#" className="block text-slate-700 hover:text-blue-600">Analytics</a>
            <a href="#" className="block text-slate-700 hover:text-blue-600">Settings</a>
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className="bg-white p-6 overflow-y-auto">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Responsive grid: 1 col (mobile), 3 cols (lg) */}
          <div className="lg:col-span-2 bg-slate-50 p-4 rounded-lg">Main content</div>
          <aside className="bg-slate-50 p-4 rounded-lg">Sidebar widget</aside>
        </div>
      </main>

      {/* Footer spans full width */}
      <footer className="md:col-span-2 bg-slate-900 text-white px-6 flex items-center justify-center">
        © 2025 Your App
      </footer>
    </div>
  );
}
```

### Pattern 5: Container Queries for Reusable Card Components

```jsx
// Card responds to its parent container, not the viewport
export function ProductCard({ title, price, image }) {
  return (
    <article className="@container bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={image} 
        alt={title}
        className="w-full aspect-video object-cover"
      />
      <div className="p-4 @sm:p-6 @lg:flex @lg:justify-between @lg:items-end">
        <div>
          <h3 className="font-bold text-base @sm:text-lg @lg:text-xl">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">${price}</p>
        </div>
        <button className="mt-4 @lg:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add to Cart
        </button>
      </div>
    </article>
  );
}

// Grid that uses the card component multiple ways:
function CardGrid() {
  return (
    <>
      {/* Wide layout: cards are wide, use @lg variants */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <ProductCard title="Product 1" price={29.99} image="/img1.jpg" />
        <ProductCard title="Product 2" price={39.99} image="/img2.jpg" />
      </div>

      {/* Narrow sidebar: same cards, but small, use @sm variants only */}
      <aside className="w-64 bg-white rounded-lg shadow-md p-4">
        <ProductCard title="Featured" price={49.99} image="/img3.jpg" />
      </aside>
    </>
  );
}
```

**Key advantage:** The card component doesn't know its context—it responds to its own container size, making it truly reusable across the app.

### Pattern 6: Aspect Ratio for Media

```jsx
export function HeroSection() {
  return (
    <section className="bg-gray-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-2 items-center">
        {/* Text column */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome</h1>
          <p className="text-lg text-gray-300">Your value proposition here</p>
        </div>

        {/* Image column with fixed aspect ratio */}
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
          <img 
            src="/hero.jpg" 
            alt="Hero"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Mobile: stack vertically, image is full-width */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
```

---

## Logical Properties for i18n

Use logical properties instead of directional props for RTL/LTR support:

```jsx
// ❌ Directional (breaks in RTL)
<div className="ml-8 pr-4">
  Left margin, right padding
</div>

// ✅ Logical (works in RTL automatically)
<div className="ml-8 ps-4">
  {/* ms = margin-inline-start (respects document direction) */}
  {/* pe = padding-inline-end */}
</div>

// Tailwind v4 logical property mapping:
// ms-* = margin-inline-start
// me-* = margin-inline-end
// ps-* = padding-inline-start
// pe-* = padding-inline-end
// bs-* = padding-block-start
// be-* = padding-block-end
```

---

## Mobile-First Checklist

### Touch Targets & Thumb Zones

| Metric | Standard | Implementation |
|--------|----------|-----------------|
| **Minimum tap target** | 44×44 px | `p-3` (12px) + min `h-11` or `w-11` |
| **Spacing between targets** | 16px minimum | `gap-4` or more between buttons |
| **Thumb zone (easy reach)** | Lower 40% of screen | Place primary CTAs at bottom-center |
| **Stretch zone** | Middle 40% | Secondary actions here |
| **Hard-to-reach zone** | Top 20% | Rare/advanced actions only |

```jsx
// Mobile-first button layout
export function MobileNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 sm:relative sm:border-t-0 sm:px-0 sm:py-0">
      <div className="flex gap-4 justify-around sm:justify-start sm:space-x-6">
        {/* Each button is 44×44+ with 16px spacing */}
        <button className="p-3 rounded-lg hover:bg-blue-100 text-center">
          <Icon className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">Home</span>
        </button>
        <button className="p-3 rounded-lg hover:bg-blue-100 text-center">
          <Icon className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">Search</span>
        </button>
      </div>
    </nav>
  );
}
```

### Viewport Units for Dynamic Toolbars

```css
/* Use dvh for mobile (accounts for browser UI changes) */
body {
  min-height: 100dvh;
}

/* Hero section fills viewport minus fixed header */
.hero {
  height: calc(100dvh - 60px); /* 60px = header height */
}

/* Fallback for browsers without dvh */
@supports not (height: 100dvh) {
  body { min-height: 100vh; }
  .hero { height: calc(100vh - 60px); }
}
```

---

## Common Patterns & Anti-Patterns

### ✅ Do's

- **Start mobile-first:** Base styles are mobile, add `sm:`, `md:` for larger screens
- **Use `gap` over margin:** `gap-4` on grid/flex is cleaner than margin utilities
- **Prefer `@container` for components:** Reusable components respond to their container
- **Use `aspect-ratio` for media:** Prevents layout shift and maintains proportions
- **Leverage `minmax()` and `auto-fit`:** Reduces breakpoint count
- **Test on real devices:** Simulators miss dynamic viewport behavior

### ❌ Don'ts

- **Don't mix viewport + container queries carelessly:** Pick one per component
- **Don't use fixed widths for content columns:** Use `max-w-*` + `mx-auto` instead
- **Don't rely on `px` for touch targets:** Use `p-*` (padding utilities) for proper sizing
- **Don't place primary actions at top:** Thumb can't reach; use bottom navigation
- **Don't forget fallbacks for subgrid:** 78% browser support (Jan 2025); provide grid fallback
- **Don't hardcode breakpoints:** Define them in `@theme` for consistency

---

## Browser Support (Baseline 2025)

| Feature | Chrome | Safari | Firefox | Status |
|---------|--------|--------|---------|--------|
| **CSS Grid** | ✅ 57+ | ✅ 10.1+ | ✅ 52+ | Baseline ✅ |
| **Flexbox** | ✅ 29+ | ✅ 9+ | ✅ 28+ | Baseline ✅ |
| **Container Queries** | ✅ 105+ | ✅ 16+ | ✅ 110+ | Baseline ✅ |
| **Subgrid** | ✅ 118+ | ✅ 16.6+ | ✅ 71+ | 78% support ⚠️ |
| **`gap` on Flexbox** | ✅ 84+ | ✅ 14.1+ | ✅ 63+ | Baseline ✅ |
| **`aspect-ratio`** | ✅ 88+ | ✅ 15+ | ✅ 89+ | Baseline ✅ |
| **`clamp()`** | ✅ 79+ | ✅ 13.1+ | ✅ 75+ | Baseline ✅ |
| **`min()`/`max()`** | ✅ 79+ | ✅ 11.1+ | ✅ 75+ | Baseline ✅ |
| **Logical properties** | ✅ 69+ | ✅ 15.1+ | ✅ 63+ | Baseline ✅ |

**Fallback strategy:** Provide `calc()` fallback for `minmax()` + `min()` combinations (Chrome < 110 support issue).

---

## Common Errors & Solutions

### Error 1: Grid Items Overflow on Mobile

**Problem:**
```jsx
<div className="grid grid-cols-[200px_1fr]">
  {/* Overflows on small screens */}
</div>
```

**Solution:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
  {/* Stacks on mobile, two-column on md+ */}
</div>
```

### Error 2: Container Query Not Responding

**Problem:**
```jsx
<div className="@md:flex">
  {/* Won't work unless parent has @container */}
</div>
```

**Solution:**
```jsx
<section className="@container">
  <div className="@md:flex">
    {/* Now responds to section width */}
  </div>
</section>
```

### Error 3: Subgrid Content Misaligned Across Cards

**Problem:**
```jsx
<div className="grid gap-6 grid-cols-3">
  <Card /> {/* Footers at different heights */}
</div>
```

**Solution:**
```css
.grid { grid-auto-rows: 1fr; } /* Equal height rows */
.card { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
```

### Error 4: Intrinsic Grid Causing Overflow

**Problem:**
```css
grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
/* Overflows on very small screens */
```

**Solution:**
```css
grid-template-columns: repeat(auto-fit, minmax(min(10rem, 100%), 1fr));
/* min(10rem, 100%) ensures column width ≤ container width */
```

### Error 5: Breakpoint Range Not Applying

**Problem:**
```html
<div class="md:max-lg:hidden">
  {/* Not hidden in md breakpoint range */}
</div>
```

**Solution:**
```html
<div class="md:max-lg:flex md:max-lg:flex-col">
  {/* Explicit: apply this only from md to <lg */}
</div>
```

Check Tailwind v4 docs for correct range syntax (colon-separated).

---

## References

- [Tailwind CSS v4 Container Queries](https://tailwindcss.com/docs/container-queries)
- [Tailwind CSS v4 Configuration (@theme)](https://tailwindcss.com/docs/theme)
- [MDN: CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [MDN: CSS Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Subgrid)
- [MDN: CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [CSS-Tricks: Grid vs Flexbox](https://css-tricks.com/css-tricks-almanac-guide-to-css-grid-layout/)
- [Intrinsic Web Design (Responsive without Media Queries)](https://www.yon.fun/css-grid-vs-flexbox/)
- [Accessible CSS Clamp Calculator](https://clampgenerator.com/)
- [Mobile-First Design: Thumb Zones](https://dev.to/prateekshaweb/mobile-first-ux-designing-for-thumbs-not-just-screens-339m)
- [Web.dev: Fluid Typography with Clamp](https://web.dev/articles/baseline-in-action-fluid-type)
