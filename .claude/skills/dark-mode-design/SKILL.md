---
name: implementing-dark-mode-design
description: Implements accessible, beautiful dark mode designs in web applications using CSS variables, semantic color tokens, and modern frameworks. Use when building dark mode interfaces, creating color systems, ensuring dark mode accessibility (WCAG compliance), handling theme detection/switching, implementing component-specific dark styles, or designing Material Design 3/Apple HIG dark modes.
---

# Implementing Dark Mode Design (2024-2025)

## Quick Start

### CSS Variables + prefers-color-scheme (Minimal Setup)

```css
/* root CSS with light mode defaults */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border: #e0e0e0;
  --accent: #0066cc;
}

/* Dark mode via system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #121212;
    --bg-secondary: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border: #333333;
    --accent: #66b3ff;
  }
}

/* Apply to elements */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### Tailwind CSS Dark Mode (Class-Based)

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
      },
    },
  },
};
```

```html
<div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  Theme-aware content
</div>
```

### JavaScript Theme Detection + Toggle

```javascript
// Detect system preference
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Toggle class-based dark mode
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
};

// Persist preference
const applyTheme = () => {
  const theme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Apply on page load
applyTheme();
```

---

## When to Use This Skill

- **Building dark mode UIs** - Implementing full dark theme support
- **Color system design** - Creating semantic token systems that work across themes
- **Accessibility audits** - Ensuring WCAG contrast compliance in dark mode
- **Theme switching** - Manual toggles or system preference detection
- **Component styling** - Form inputs, cards, navigation in dark mode
- **Data visualization** - Charts and graphs adapted for dark backgrounds
- **Design system integration** - shadcn/ui, Radix UI, Material UI theming
- **Migration projects** - Adding dark mode to existing light-only interfaces

---

## Color System Setup

### Semantic Color Tokens (Recommended Approach)

Define purpose-driven tokens, not literal color values:

```css
:root {
  /* Primitives */
  --color-neutral-950: #0a0a0a;
  --color-neutral-900: #1a1a1a;
  --color-neutral-800: #262626;
  --color-neutral-600: #4b5563;
  --color-accent-500: #0066cc;
  --color-accent-400: #3385ff;

  /* Semantic tokens (light mode) */
  --color-background: var(--color-neutral-50);
  --color-surface: var(--color-neutral-100);
  --color-surface-variant: var(--color-neutral-200);
  --color-text: var(--color-neutral-950);
  --color-text-secondary: var(--color-neutral-600);
  --color-border: var(--color-neutral-200);
  --color-primary: var(--color-accent-500);
  --color-error: #dc2626;
  --color-success: #16a34a;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--color-neutral-950);
    --color-surface: var(--color-neutral-900);
    --color-surface-variant: var(--color-neutral-800);
    --color-text: #f5f5f5;
    --color-text-secondary: var(--color-neutral-600);
    --color-border: var(--color-neutral-800);
    --color-primary: var(--color-accent-400);
    --color-error: #ef4444;
    --color-success: #22c55e;
  }
}
```

**Why semantic tokens:**
- Reusable across components (no need for `dark:` prefix everywhere)
- Easier theme customization in one place
- Clear intent of what color is used for

### Color Transformation Principles

**Light → Dark Mode Adjustments:**

1. **Lightness**: Increase background lightness ~10-20%, decrease text lightness
2. **Saturation**: Reduce saturation by 10-15% (avoid harsh colors on dark)
3. **Hue**: Shift warm colors slightly cooler (e.g., #ff6b35 → #ff8a50)
4. **Contrast**: Increase contrast ratios for readability

**Example transformation:**

```
Light: #f0f0f0 (bg) + #1a1a1a (text) = 21:1 contrast
Dark:  #1a1a1a (bg) + #f0f0f0 (text) = 21:1 contrast ✓
```

---

## Contrast & Accessibility (WCAG 2.2)

### Required Ratios (Dark Mode Contexts)

| Element | Normal | Large | AAA |
|---------|--------|-------|-----|
| **Text** | 4.5:1 | 3:1 | 7:1 |
| **UI Components** | 3:1 | — | 3:1 |
| **Graphics** | 3:1 | — | 3:1 |

**Dark mode best practices:**
- Avoid pure black (#000000) as background—use #0a0a0a to #1a1a1a
- Avoid pure white (#ffffff) as text—use #f0f0f0 to #ffffff with alpha
- Test with low-saturation colors (they fail contrast more easily)
- Focus indicators must be 4:1+ contrast on both light and dark

### Testing Tools

```javascript
// Programmatic contrast checker
function getContrast(rgb1, rgb2) {
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(x => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

// Example: dark bg (18, 18, 18) + light text (240, 240, 240)
console.log(getContrast([18, 18, 18], [240, 240, 240])); // ~12.6:1 ✓
```

### Accessibility Checklist

- [ ] All text has 4.5:1 contrast (normal) or 3:1 (large)
- [ ] UI components have 3:1 contrast against adjacent colors
- [ ] Focus indicators visible with 3:1+ contrast
- [ ] Form inputs have clear visible state changes (focus, error, disabled)
- [ ] Icons and graphics meet 3:1 contrast where meaningful
- [ ] No color alone conveys information (use text + color)
- [ ] Tested with browser DevTools color vision simulation

---

## Depth & Elevation (Without Shadows)

### Why Not Shadows in Dark Mode?

Shadows are nearly invisible on dark backgrounds and create harsh visual artifacts. Instead, use:
- **Lightness variations** (brighten surfaces)
- **Glow effects** (subtle light around elements)
- **Borders** (thin lines for separation)
- **Gradient overlays** (elevated surfaces feel lighter)

### Elevation System (Material Design 3 Approach)

```css
:root {
  /* Dark mode: elevation = lightness increase */
  --elevation-0: #1a1a1a;    /* Base surface */
  --elevation-1: #262626;    /* +5% lightness */
  --elevation-2: #2d2d2d;    /* +10% lightness */
  --elevation-3: #353535;    /* +15% lightness */
  --elevation-4: #3d3d3d;    /* +20% lightness */
  --elevation-5: #454545;    /* +25% lightness */
}

/* Apply to components */
.card {
  background-color: var(--elevation-1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal {
  background-color: var(--elevation-3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dropdown-menu {
  background-color: var(--elevation-4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Glow Effects (Alternative to Shadows)

```css
/* Subtle glow for elevation */
.elevated {
  background-color: #202020;
  box-shadow: 
    0 0 1px rgba(255, 255, 255, 0.1),
    0 0 2px rgba(255, 255, 255, 0.05);
}

/* Higher elevation with stronger glow */
.elevated-high {
  background-color: #252525;
  box-shadow: 
    0 0 4px rgba(100, 150, 200, 0.15),
    0 0 8px rgba(100, 150, 200, 0.08);
}
```

### Border Techniques (Cleaner Separation)

```css
/* Thin border for surface separation */
.surface {
  background-color: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Inset border for recessed elements */
.input {
  background-color: #262626;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Glow border for focus states */
.input:focus {
  border-color: rgba(100, 150, 200, 0.5);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3),
              0 0 0 3px rgba(100, 150, 200, 0.1);
}
```

---

## Theme Detection & Switching

### Method 1: System Preference Only (No Toggle)

**Pros:** Simple, respects user OS setting  
**Cons:** No manual override

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* dark theme */
  }
}
```

### Method 2: Class-Based Manual Toggle

**Pros:** Full control, manual override  
**Cons:** Requires JS, can lose preference on refresh

```javascript
// Toggle dark mode
function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// Apply saved preference on load
function initTheme() {
  const theme = localStorage.getItem('theme');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
}

document.addEventListener('DOMContentLoaded', initTheme);
```

### Method 3: System Preference + Manual Override (Hybrid)

**Pros:** Respects system setting, allows override  
**Cons:** More complex logic

```javascript
const preferenceQuery = window.matchMedia('(prefers-color-scheme: dark)');

function initTheme() {
  const stored = localStorage.getItem('theme');
  
  if (stored) {
    // User has explicit preference
    applyTheme(stored);
  } else if (preferenceQuery.matches) {
    // Follow system preference
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
}

function toggleTheme() {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Listen for system theme changes (only if no manual override)
preferenceQuery.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

initTheme();
```

### Preventing Flash of Unstyled Content (FOUC)

**Problem:** Theme applies after page renders, causing visible flash

**Solution 1: Inline Script in Head (Vanilla)**

```html
<!DOCTYPE html>
<html lang="en" suppressHydrationWarning>
<head>
  <meta charset="UTF-8">
  <title>App</title>
  <!-- Apply theme BEFORE styles load -->
  <script>
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark' || 
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  </script>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- content -->
</body>
</html>
```

**Solution 2: Next.js Script (Recommended for Next.js)**

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const isDark = theme === 'dark' || 
                  (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Solution 3: React Hydration-Safe Pattern**

```tsx
// Prevents hydration mismatch in Next.js/SSR
export function useThemeEffect() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark' || 
      (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setMounted(true);
  }, []);

  return mounted;
}

// Use in root component
export function Layout({ children }) {
  const isMounted = useThemeEffect();
  
  // Don't render until theme is applied
  if (!isMounted) return null;
  
  return <>{children}</>;
}
```

---

## Component Patterns

### Form Inputs (Dark Mode States)

```tsx
// React example with Tailwind dark mode
export function Input({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      className="
        px-3 py-2 rounded-md
        bg-white dark:bg-slate-800
        text-slate-900 dark:text-white
        border border-slate-300 dark:border-slate-600
        placeholder-slate-400 dark:placeholder-slate-500
        
        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
        focus:border-transparent
        
        disabled:bg-slate-100 dark:disabled:bg-slate-700
        disabled:text-slate-500 dark:disabled:text-slate-400
        disabled:cursor-not-allowed
      "
      {...props}
    />
  );
}
```

### Cards/Containers

```css
/* Elevation-based card styling */
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

/* Dark mode elevation variation */
@media (prefers-color-scheme: dark) {
  .card {
    background-color: var(--elevation-1);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .card:hover {
    background-color: var(--elevation-2);
  }
}
```

### Focus Indicators (Accessible)

```css
/* Works on both light and dark backgrounds */
.interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast focus for dark mode */
@media (prefers-color-scheme: dark) {
  .interactive:focus-visible {
    outline-color: var(--color-primary-light);
  }
}

/* Dual-ring focus indicator (WCAG AAA on any background) */
button:focus-visible {
  outline: 3px solid white;
  box-shadow: 0 0 0 6px #000000;
}
```

### Navigation/Header

```tsx
export function Header() {
  return (
    <header className="
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-slate-800
      sticky top-0 z-40
    ">
      <nav className="
        flex items-center justify-between
        px-4 py-3
        text-slate-900 dark:text-white
      ">
        <a href="/" className="
          text-xl font-bold
          hover:text-blue-600 dark:hover:text-blue-400
        ">
          Logo
        </a>
        
        <menu className="flex gap-6">
          {['Home', 'About', 'Contact'].map(item => (
            <a
              key={item}
              href="#"
              className="
                text-slate-700 dark:text-slate-300
                hover:text-slate-900 dark:hover:text-white
                transition-colors
              "
            >
              {item}
            </a>
          ))}
        </menu>
      </nav>
    </header>
  );
}
```

### Charts/Data Visualization

```javascript
// Dynamic chart coloring based on theme
function getChartColors(isDarkMode) {
  return isDarkMode
    ? {
        background: '#1a1a1a',
        text: '#f0f0f0',
        gridLines: 'rgba(255, 255, 255, 0.1)',
        series: ['#66b3ff', '#66ff99', '#ffb366'],
      }
    : {
        background: '#ffffff',
        text: '#1a1a1a',
        gridLines: 'rgba(0, 0, 0, 0.1)',
        series: ['#0066cc', '#00cc66', '#ff6633'],
      };
}

// Chart.js example
const ctx = document.getElementById('chart').getContext('2d');
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const colors = getChartColors(isDark);

new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Revenue',
      data: [30, 59, 112],
      borderColor: colors.series[0],
      backgroundColor: `${colors.series[0]}20`,
    }],
  },
  options: {
    plugins: {
      legend: {
        labels: { color: colors.text },
      },
    },
    scales: {
      x: {
        grid: { color: colors.gridLines },
        ticks: { color: colors.text },
      },
      y: {
        grid: { color: colors.gridLines },
        ticks: { color: colors.text },
      },
    },
  },
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  // Re-render chart with new colors
});
```

---

## Best Practices

### ✅ DO

- **Use semantic color tokens** instead of utility classes everywhere
- **Test with real users** - What looks good in design may not feel right in use
- **Avoid pure black/white** - #1a1a1a and #f0f0f0 are more comfortable
- **Increase contrast slightly above WCAG minimum** - Aim for 5:1-6:1 for normal text
- **Use hue shifts** - Don't just invert colors, shift cooler in dark mode
- **Respect system preference** - Use `prefers-color-scheme` as baseline
- **Include focus indicators** - Never remove outlines without replacing them
- **Test charts early** - Data visualization needs special color consideration

### ❌ DON'T

- **Invert colors directly** - Creates unusable harsh contrast
- **Use saturated colors on dark** - Causes eye strain; desaturate by 10-15%
- **Rely on shadows only** - They're invisible on dark backgrounds
- **Skip accessibility testing** - Use WAVE, Axe, or browser contrast checker
- **Assume all backgrounds are solid** - Test focus indicators on gradients
- **Apply pure black** - #000000 creates halation effect; use very dark gray
- **Forget disabled states** - They need distinct styling in dark mode too
- **Ignore images/videos** - Add overlays or filters to ensure text contrast

---

## Common Errors & Solutions

### Error: "Dark mode looks washed out / colors too dull"

**Cause:** Over-desaturating colors or using insufficient contrast  
**Fix:**
```css
/* ❌ Wrong: too desaturated */
--color-accent-dark: #555555;

/* ✅ Correct: maintain saturation, adjust lightness */
--color-accent-light: hsl(210, 100%, 50%);
--color-accent-dark: hsl(210, 100%, 65%); /* +15% lightness */
```

### Error: "Text hard to read / contrast ratio failing"

**Cause:** Pure white text on dark gray, or colors with low saturation  
**Fix:**
```javascript
// Use this to find readable pairs
function findReadableColor(bgColor, targetContrast = 5.5) {
  // Test progressively lighter text colors
  for (let lightness = 100; lightness > 50; lightness--) {
    const textColor = adjustLightness(bgColor, lightness);
    if (getContrast(bgColor, textColor) >= targetContrast) {
      return textColor;
    }
  }
}
```

### Error: "Focus indicator invisible in dark mode"

**Cause:** Single-color outline doesn't contrast against dark background  
**Fix:**
```css
/* ✅ Dual-ring approach: works on any background */
button:focus-visible {
  outline: 3px solid white;        /* outer ring */
  box-shadow: 0 0 0 6px #000000;   /* inner ring */
  outline-offset: 2px;
}

/* Or use system color that adapts */
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Error: "Flash of light theme on load (FOUC)"

**Cause:** Theme script runs after DOM renders  
**Fix:** Inline script in `<head>` BEFORE stylesheet loads
```html
<head>
  <script>
    if (localStorage.theme === 'dark' || 
        (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  </script>
  <link rel="stylesheet" href="styles.css">
</head>
```

### Error: "Hydration mismatch in Next.js/SSR"

**Cause:** Server renders light theme, client applies dark based on localStorage  
**Fix:** Skip rendering until mounted
```tsx
export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Apply theme client-side only
    setMounted(true);
  }, []);
  
  if (!mounted) return null; // Don't render until hydration done
  return <>{children}</>;
}
```

### Error: "Shadows completely disappear in dark mode"

**Cause:** Gray shadows on dark backgrounds are invisible  
**Fix:** Use glows or borders instead
```css
/* ❌ Wrong: invisible shadow */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

/* ✅ Right: use glow effect */
box-shadow: 0 0 4px rgba(100, 150, 200, 0.2);

/* ✅ Or use border for subtle separation */
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Design System Integration

### shadcn/ui Dark Mode

```tsx
// Uses next-themes library
// pages/_app.tsx
import { ThemeProvider } from 'next-themes';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

// components/mode-toggle.tsx
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
```

### Material Design 3 Dark Mode

**Elevation via Tonal Overlays (No Shadows)**

```css
/* Material Design 3 approach: elevation = overlay opacity */
.surface {
  background-color: #121212;
}

.surface-dim {
  background-color: #121212;
  opacity: 0.8;
}

.surface-bright {
  background-color: #1a1a1a;
  /* Primary color overlay for elevation */
  box-shadow: inset 0 0 0 1px rgba(100, 150, 200, 0.08);
}

.surface-container-lowest {
  background-color: #0a0a0a;
}

.surface-container-low {
  background-color: #161616;
}

.surface-container {
  background-color: #1d1d1d;
}

.surface-container-high {
  background-color: #282828;
}

.surface-container-highest {
  background-color: #2d2d2d;
}
```

### Radix UI Theming

```tsx
import * as RadixThemes from '@radix-ui/themes';

export default function App({ children }) {
  return (
    <RadixThemes.Theme appearance="light" accentColor="blue">
      {/* Radix handles dark mode automatically via appearance prop */}
      <RadixThemes.Button>Click me</RadixThemes.Button>
    </RadixThemes.Theme>
  );
}
```

---

## References

- **MDN: prefers-color-scheme** - https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- **WCAG 2.2 Contrast Requirements** - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- **Tailwind CSS Dark Mode** - https://tailwindcss.com/docs/dark-mode
- **Material Design 3: Elevation** - https://m3.material.io/styles/elevation
- **shadcn/ui Dark Mode** - https://ui.shadcn.com/docs/dark-mode
- **Apple HIG: Dark Mode** - https://developer.apple.com/design/human-interface-guidelines/dark-mode
- **next-themes Library** - https://github.com/pacocoursey/next-themes
- **Color Contrast Checker** - https://www.webAIM.org/resources/contrastchecker/
- **APCA Contrast Method (Advanced)** - https://git.apcaonline.org/what-are-luminance-levels
