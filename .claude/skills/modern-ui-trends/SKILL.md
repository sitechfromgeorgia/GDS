---
name: modern-ui-design-2025
description: Guides AI coding agents in creating visually current 2025 UI design. Covers post-flat aesthetics (new skeuomorphism, bento grids, grotesque typography), micro-interactions, dark mode best practices, and anti-patterns (Material Design 2, generic Bootstrap). Use when building interfaces, styling components, or reviewing code for modern design language.
---

# Modern UI Design 2025: The Post-Flat Aesthetic

## Quick Start

Use this checklist to audit if your UI looks modern (2025) vs dated (2020):

```
✅ Modern 2025 Checklist
- [ ] Bento grids OR card-based grid layouts (not full-width sections)
- [ ] Grotesque/Satoshi/Heading sans-serifs (not Inter for display)
- [ ] Subtle depth: inner shadows + noise textures (not flat)
- [ ] Dark mode uses Slate/Zinc/Neutral 900/950 (not pure #000)
- [ ] Micro-interactions: hover lift, border-glow, scale
- [ ] Mesh gradients OR hero glows in backgrounds
- [ ] Color contrast in dark mode deliberate (visible borders/separators)
- [ ] Scroll-driven animations (CSS animation-timeline)
- [ ] No rounded-lg everywhere (mix of radius scales)

❌ Anti-Patterns (Looks 2020/2021)
- [ ] Large Material Design drop shadows
- [ ] Bootstrap default palette (overused blues)
- [ ] Excessive blur (glassmorphism without substance)
- [ ] Pure black backgrounds with white text only
- [ ] No motion, purely static UI
- [ ] Flat design with zero texture/depth
```

## When to Use This Skill

- **Building new interfaces** that need to feel current and professionally designed
- **Component styling** (buttons, cards, inputs) following 2025 patterns
- **Color system setup** avoiding dated flat design
- **Dark/light mode implementation** with proper contrast and intent
- **Adding micro-interactions** and animation timelines
- **Reviewing code** to identify 2020-era patterns that need updating
- **Tailwind v4 configuration** for modern color systems using OKLCH

## The Five Dominant Visual Styles of 2025

### 1. Bento Grid (Card-Based Modularity)

**What it is:** Irregular grid layouts dividing content into distinct, sometimes varying-sized cards. Inspired by Apple's product presentations.

**Why it's modern:**
- Forces intentional information hierarchy
- Works perfectly on mobile (responsive grid cells)
- Creates visual breathing room (whitespace)
- Companies using it: Apple, Linear, Supabase, Notion, Framer

**How to implement:**
```html
<div class="grid grid-cols-12 gap-4">
  <!-- Featured card: 2x2 -->
  <div class="col-span-6 row-span-2 rounded-lg bg-slate-800 p-6">
    <h3>Featured Feature</h3>
  </div>
  
  <!-- Regular card: 1x1 -->
  <div class="col-span-3 rounded-lg bg-slate-800 p-4">
    <p>Item 1</p>
  </div>
  
  <!-- Tall card: 1x2 -->
  <div class="col-span-3 row-span-2 rounded-lg bg-slate-800 p-4">
    <p>Item 2</p>
  </div>
</div>
```

**Tailwind v4 approach:** Use CSS Grid with `grid-cols-12` for flexibility. Vary `col-span` and `row-span` to create irregular layouts.

---

### 2. New Skeuomorphism (Subtle Depth)

**What it is:** Minimal, refined texture + inner shadows creating gentle dimensional effects. NOT the heavy beveled skeu of 2010.

**Key techniques:**
- **Inner shadows** (inset box-shadow) on top and bottom for depth
- **Noise textures** (SVG or background-image) at 2-5% opacity
- **Subtle gradients** (5-10 degree angle, not bold)
- **Barely visible borders** matching surface color at 15-20% opacity

**CSS pattern:**
```css
.skeu-card {
  /* Base gradient (subtle) */
  background: linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(15, 23, 42) 100%);
  
  /* Inner shadows create dimension */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),  /* Top light */
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);        /* Bottom dark */
  
  /* Barely visible border */
  border: 1px solid rgba(148, 163, 184, 0.1);
  
  /* Noise texture at low opacity */
  background-image: 
    url("data:image/svg+xml,...noise-svg..."),
    linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(15, 23, 42) 100%);
  background-blend-mode: multiply;
}

.skeu-card:hover {
  /* Subtle lift effect */
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4),
    0 10px 25px rgba(0, 0, 0, 0.3);
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Tailwind v4 equivalent:**
```html
<div class="relative rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 
            border border-slate-700/10 
            shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]
            hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.4),0_10px_25px_rgba(0,0,0,0.3)]
            hover:translate-y-[-2px] transition-all duration-150">
  <!-- content -->
</div>
```

---

### 3. Grotesque Sans-Serif Typography (Bold Display)

**What it is:** Wide, geometric typefaces for headlines. Linear/Supabase style: Satoshi, Clash Grotesk, or Poppins Heavy.

**Where it differs from 2020:**
- 2020 used Inter for everything (boring)
- 2025 uses Inter for body (still good), but **Grotesque for H1/H2**
- Display type is oversized and commands attention

**Implementation:**
```css
/* Import font */
@import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@700;900&display=swap');

h1, h2 {
  font-family: 'Satoshi', -apple-system, sans-serif;
  font-weight: 900;
  letter-spacing: -0.02em;  /* Tight for display */
  line-height: 1.1;
}

h1 {
  font-size: clamp(2rem, 5vw, 4rem);
}

body, p {
  font-family: 'Inter', -apple-system, sans-serif;
  font-weight: 400;
  letter-spacing: 0;
}
```

**Tailwind approach:**
```html
<!-- Use font-sans for default, add font-display for headers -->
<h1 class="font-display text-5xl font-black tracking-tight">
  Bold Statement Headline
</h1>

<!-- In tailwind.config.ts (v4) -->
@theme {
  --font-family-display: 'Satoshi', system-ui;
  --font-family-sans: 'Inter', system-ui;
}
```

---

### 4. Mesh Gradients & Hero Glows

**What it is:** Organic, multi-color gradients created with `radial-gradient` or specialized tools. Used as backgrounds or accent glows.

**Modern 2025 approach:**
- Subtle mesh in hero sections (not overwhelming)
- "Lamp glow" effect: reduced-opacity solid color with blur
- Animations: slow drift or pulse on scroll

**CSS implementation (basic mesh):**
```css
.mesh-gradient-bg {
  background: 
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 0%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
    #0f172a;
  position: relative;
}
```

**Lamp glow (reduced opacity):**
```css
.lamp-glow::before {
  content: '';
  position: absolute;
  inset: -100px;
  background: radial-gradient(circle, rgba(45, 166, 178, 0.08), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}
```

**Using tools:** Generate mesh gradients at [mshr.app](https://www.mshr.app/) or [CSSGradient.io](https://cssgradient.io/), then export as CSS variables.

---

### 5. Dark Mode First (Proper Palettes)

**What's wrong with pure #000:**
- Creates eye strain in low-light contexts
- Doesn't allow for subtle borders/separators
- No hierarchy for secondary elements

**Correct dark mode palette (Tailwind v4 using OKLCH):**

```css
/* Define in CSS root */
:root {
  --color-bg-primary: oklch(0.11 0.02 250);    /* Deep slate: #0f172a equivalent */
  --color-bg-secondary: oklch(0.15 0.01 250);  /* Lighter slate: #1e293b equivalent */
  --color-border: oklch(0.25 0.02 250);        /* Visible border: #334155 equivalent */
  --color-text-primary: oklch(0.95 0.01 0);    /* Off-white: #f8fafc */
  --color-text-secondary: oklch(0.70 0.02 250);/* Muted: #94a3b8 */
  --color-accent: oklch(0.65 0.15 180);        /* Teal: vibrant but not neon */
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

input, textarea {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

input::placeholder {
  color: var(--color-text-secondary);
}
```

**Tailwind v4 configuration:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@theme {
  /* Override neutrals for dark mode */
  --color-slate-50: oklch(0.99 0 0);
  --color-slate-900: oklch(0.11 0.02 250);
  --color-slate-950: oklch(0.08 0.01 250);
  
  /* Define semantic tokens */
  --color-surface-primary: oklch(0.11 0.02 250);
  --color-surface-secondary: oklch(0.15 0.01 250);
  --color-border-subtle: oklch(0.25 0.02 250);
  --color-text-muted: oklch(0.70 0.02 250);
}
```

**Why OKLCH?** Modern browsers support it, perceptually uniform colors, higher saturation gamut than sRGB.

---

## Micro-Interactions & Motion (Essential for 2025)

### Hover Effects

**Modern pattern:** Lift + glow + subtle scale

```css
button {
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15),
              0 0 20px rgba(45, 166, 178, 0.2);  /* accent glow */
}

button:active {
  transform: translateY(0) scale(0.98);
}
```

### Scroll-Driven Animations (CSS animation-timeline)

```css
.fade-in-on-scroll {
  animation: fadeInUp linear forwards;
  animation-timeline: view();  /* Triggers when element enters viewport */
  animation-range: entry 0% cover 30%;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Tactile Button Feedback

```css
.btn-primary {
  position: relative;
  border: 1px solid var(--color-accent);
  background: transparent;
  color: var(--color-accent);
  transition: all 150ms;
}

.btn-primary:hover {
  background: var(--color-accent);
  color: white;
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.btn-primary:active {
  /* Pressed state */
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 12px rgba(45, 166, 178, 0.3);
}
```

---

## Best Practices & Rationale

### 1. Use CSS Variables for Theming
**Why:** Runtime color switching without recompiling CSS. Enable dark/light toggle.

```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

:root[data-theme="dark"] {
  --bg-primary: #0f172a;
  --text-primary: #f8fafc;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### 2. Avoid Pure Black (#000000) and Pure White (#FFFFFF)
**Why:** Causes contrast issues and feels harsh. Use off-white (#f8fafc) and deep slate (#0f172a).

**Instead of:**
```css
background: #000000;
color: #ffffff;
```

**Use:**
```css
background: #0f172a;  /* Slate 950 */
color: #f8fafc;       /* Slate 50 */
```

### 3. Borders Must Be Visible in Dark Mode
**Why:** Prevents elements from blending into background.

```css
/* ❌ Wrong: 1px solid #1e293b (blends in) */
border: 1px solid #1e293b;

/* ✅ Correct: Use opacity + lighter base */
border: 1px solid rgba(148, 163, 184, 0.15);  /* Slate 400 at 15% */
```

### 4. Gradients Should Be Subtle (5-10°)
**Why:** Bold gradients feel dated; subtle adds dimension without distraction.

```css
/* ❌ Too bold */
background: linear-gradient(90deg, #ff0000, #0000ff);

/* ✅ Subtle depth */
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
```

### 5. Font Sizes Must Scale Responsively
**Why:** 2025 designs use `clamp()` for fluid typography.

```css
h1 {
  /* Scales from 1.5rem on small screens to 3.5rem on large */
  font-size: clamp(1.5rem, 5vw, 3.5rem);
}
```

---

## Common Errors & Troubleshooting

### Error: Dark Mode Borders Invisible

**Symptom:** Cards/inputs blend into background in dark mode.

**Solution:** Always use opacity-based borders:
```css
/* ❌ Wrong */
border: 1px solid #1e293b;

/* ✅ Correct */
border: 1px solid rgba(100, 116, 139, 0.2);  /* Slate-500 at 20% opacity */
```

---

### Error: Glassmorphism Too Blurry

**Symptom:** Text is unreadable behind blur; accessibility fails.

**Solution:** Use `backdrop-blur` strategically; add semi-opaque backdrop:
```css
/* ✅ Readable glass effect */
.glass {
  background: rgba(15, 23, 42, 0.4);  /* 40% opaque base */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
```

---

### Error: Hover Effects Too Jerky

**Symptom:** Button jumps or feels laggy.

**Solution:** Use smooth easing and hardware acceleration:
```css
button {
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);  /* Modern easing */
  will-change: transform, box-shadow;                   /* GPU acceleration */
}
```

---

### Error: Mesh Gradient Looks Flat

**Symptom:** Background feels 2D despite gradient.

**Solution:** Layer multiple radial gradients at different positions:
```css
background:
  radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
  radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
  radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.1) 0%, transparent 60%),
  #0f172a;
```

---

### Error: Typography Doesn't Scale on Mobile

**Symptom:** Large headlines on mobile are illegible.

**Solution:** Use `clamp()` instead of media queries:
```css
h1 {
  /* Min: 1.5rem, preferred: 8vw, max: 3.5rem */
  font-size: clamp(1.5rem, 8vw, 3.5rem);
  line-height: 1.1;
}
```

---

### Error: Color Palette Doesn't Match Design

**Symptom:** Tailwind colors don't match Figma; manual overrides needed.

**Solution:** Define custom colors in `@theme` (Tailwind v4):
```css
@theme {
  --color-brand-primary: oklch(0.65 0.15 180);  /* From Figma */
  --color-brand-secondary: oklch(0.40 0.08 200);
}

/* Now use anywhere */
<div class="bg-brand-primary text-brand-secondary">...</div>
```

---

## Anti-Patterns (What Looks Old)

### 1. Material Design 2 Shadows

**Why it's dated:**
- Large drop shadows (blur: 16px+) were trendy in 2019-2021
- Now feels heavy and unrefined
- Conflicts with modern subtlety

**❌ Don't:**
```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
```

**✅ Do:**
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```

---

### 2. Bootstrap Default Palette

**Why it's dated:**
- Generic blues (#007bff)
- Overused across thousands of sites
- Signals "I used Bootstrap defaults"

**❌ Don't:**
```html
<button class="btn btn-primary">Click me</button>
<!-- Uses #007bff -->
```

**✅ Do:**
```html
<button class="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 
        text-white rounded-lg hover:shadow-lg transition-all">
  Click me
</button>
```

---

### 3. Pure Black Backgrounds

**Why it's dated:**
- No hierarchy (no room for secondary borders/elements)
- Harsh on eyes; WCAG concerns
- Feels 2010s "dark mode"

**❌ Don't:**
```css
background: #000000;
```

**✅ Do:**
```css
background: #0f172a;  /* Slate 950 from Tailwind v4 */
```

---

### 4. Rounded Corners on Everything

**Why it's dated:**
- 2021 trend: `rounded-full` on everything
- 2025: Mix of radius scales (sm, md, lg, xl)
- Precision > uniformity

**❌ Don't:**
```html
<div class="rounded-full">
  <div class="rounded-full">
    <button class="rounded-full">Click</button>
  </div>
</div>
```

**✅ Do:**
```html
<div class="rounded-xl">           <!-- 12px -->
  <div class="rounded-lg">         <!-- 8px -->
    <button class="rounded-md">    <!-- 6px -->
      Click
    </button>
  </div>
</div>
```

---

### 5. No Motion at All

**Why it's dated:**
- Static UIs feel dead; 2025 expects feedback
- Even small micro-interactions feel premium

**❌ Don't:**
```css
/* No transitions, no animations */
button { }
button:hover { background: blue; }  /* Instant change */
```

**✅ Do:**
```css
button {
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

---

## Figma to Code Translation Tips

### Tip 1: Export Gradients as CSS Variables
**In Figma:** Copy gradient values as `linear-gradient(...)`  
**In code:** Wrap in CSS variables for reuse:
```css
--gradient-hero: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
background: var(--gradient-hero);
```

### Tip 2: Check Drop Shadows for Blur Radius
**If blur > 12px in Figma:** Reduce to 8-12px in code (feels less dated).

### Tip 3: Measure Font Tracking (Letter Spacing)
**Figma:** Track value (e.g., -30)  
**Convert to CSS:** `letter-spacing: -0.02em`  
Multiply: -30 / 1500 (standard font size) = -0.02em

### Tip 4: Frame Sizes → Tailwind Breakpoints
**Figma frames:**
- 375px → `sm:` (mobile)
- 768px → `md:` (tablet)
- 1024px → `lg:` (desktop)

### Tip 5: Component Variants → Tailwind Modifiers
**Figma state:** "Button/Hover"  
**Tailwind:** `hover:bg-teal-600 hover:shadow-lg`

---

## Inspiration References

### Modern Design Systems (Study These)

1. **Linear** – [linear.app](https://linear.app)
   - Minimal dark theme, bold typography, bento grids
   - Developer-first design language

2. **Supabase** – [supabase.com](https://supabase.com)
   - Open-source design system
   - Modular card layouts, high contrast

3. **Vercel** – [vercel.com](https://vercel.com)
   - Edge case: light mode done right
   - Mesh gradients, scroll animations

4. **Raycast** – [raycast.com](https://raycast.com)
   - Subtle skeuomorphism on macOS
   - Inner shadows, precision spacing

5. **Notion** – [notion.so](https://notion.so)
   - Master of bento grids
   - Flexible, modular content blocks

### Tools for 2025

- **Mesh Gradients:** [mshr.app](https://www.mshr.app/)
- **Color Space:** [oklch.space](https://oklch.space/) (OKLCH converter)
- **Tailwind v4 Colors:** [tailwindcss.com/docs/customizing-colors](https://tailwindcss.com/docs/customizing-colors)
- **Easing Functions:** [easings.net](https://easings.net/)
- **Typography Scale:** [type-scale.com](https://type-scale.com/)

---

## References

- Tailwind CSS v4 Documentation: https://tailwindcss.com/
- Modern CSS Color Spaces (OKLCH): https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- Animation Timeline (scroll-driven): https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- CSS Box Shadows: https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow
- Web Design Trends 2025: https://www.lummi.ai/blog/ui-design-trends-2025
- Linear Design Evolution: https://blog.logrocket.com/ux-design/linear-design/
- Bento Grid Collection: https://collections.designzig.com/bentogrids/
