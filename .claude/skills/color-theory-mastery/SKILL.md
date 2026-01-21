---
name: implementing-accessible-color-systems
description: Designs and implements WCAG-compliant color systems with semantic tokens, colorblind-safe palettes, and contrast ratio automation. Use when building accessible UI/UX design systems, creating semantic color tokens, testing color contrast compliance, ensuring colorblind accessibility, or implementing Material Design 3 color architecture.
---

# Implementing Accessible Color Systems

## Quick Start

### Contrast Ratio Calculation
```javascript
// Using color.js (modern approach)
import Color from 'https://colorjs.io/latest/color.js';

const bgColor = new Color('srgb', [1, 1, 1]);        // white
const textColor = new Color('srgb', [0, 0, 0]);      // black
const contrast = textColor.contrastWCAG21(bgColor);
console.log(contrast); // 21:1 (maximum contrast)

// Using chroma.js (alternative)
import chroma from 'chroma-js';
const ratio = chroma.contrast('white', '#000080');
console.log(ratio >= 4.5); // true = AA compliant
```

### WCAG Contrast Requirements at a Glance
| Level | Normal Text | Large Text | UI Components |
|-------|----------|-----------|----------------|
| **AA (minimum)** | 4.5:1 | 3:1 | 3:1 |
| **AAA (enhanced)** | 7:1 | 4.5:1 | — |

**Large text definition:** 18pt+ (24px+) OR 14pt+ bold (18.5px+)

### Semantic Color Token Structure (CSS)
```css
:root {
  /* Primitive tokens - raw colors */
  --color-blue-600: #2563eb;
  --color-red-500: #ef4444;
  
  /* Semantic tokens - meaning */
  --color-primary: var(--color-blue-600);
  --color-primary-hover: #1d4ed8;
  --color-error: var(--color-red-500);
  --color-error-background: #fee2e2;
  
  /* State tokens */
  --color-focus-ring: rgba(37, 99, 235, 0.4);
}
```

---

## When to Use This Skill

- Building new design systems with WCAG 2.1/2.2 compliance
- Creating semantic color tokens for Tailwind CSS or CSS variables
- Auditing existing color palettes for accessibility violations
- Implementing dark mode with guaranteed contrast
- Designing for colorblind users (8% of men, 0.5% of women)
- Automating color contrast testing in CI/CD pipelines
- Using Material Design 3 HCT color space

---

## Color Psychology & Emotional Impact

### Core Color Associations (Research-Backed)

| Color | Emotion | Conversion Impact | Use Cases |
|-------|---------|-------------------|-----------|
| **Red** | Urgency, energy, danger | +21-34% on CTAs | Error states, critical actions, alerts |
| **Blue** | Trust, calm, security | Stability baseline | Primary actions, fintech, healthcare |
| **Green** | Growth, success, health | Context-dependent | Success states, confirmations, wellness |
| **Yellow** | Optimism, warning, caution | Low contrast risk | Warnings, highlights (with dark text only) |
| **Orange** | Creativity, warmth, friendliness | Engagement | Secondary CTAs, creativity tools |
| **Purple** | Innovation, imagination, premium | Brand differentiation | Premium/aspirational products |
| **Gray** | Neutrality, disabled states | Calming effect | Neutral backgrounds, disabled UI elements |

### Industry Color Conventions
- **Fintech/Banking:** Blue + gray (trust + stability)
- **Healthcare:** Blue + green (trust + wellness)
- **E-commerce:** Red/orange CTAs (urgency + action)
- **SaaS/Tech:** Blue + purple (trust + innovation)
- **Travel/Leisure:** Varied warm tones (emotion + escape)

---

## WCAG 2.1 & 2.2 Contrast Requirements (Detailed)

### Success Criterion 1.4.3: Contrast (Minimum) - Level AA

**Normal Text (< 18pt or < 14pt bold):** 4.5:1 minimum
**Large Text (≥ 18pt or ≥ 14pt bold):** 3:1 minimum

### Success Criterion 1.4.11: Non-text Contrast - Level AA

**UI Components & Graphical Objects:** 3:1 minimum contrast ratio
- Applies to form input borders, buttons, focus indicators
- Required against adjacent colors

### Level AAA (Enhanced) - Higher Standards

**Normal Text:** 7:1 minimum
**Large Text:** 4.5:1 minimum
- Recommended for accessibility-first products
- Ideal for users with moderate visual impairments

### Contrast Ratio Formula (W3C)

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)

Where:
- L1 = Relative luminance of lighter color
- L2 = Relative luminance of darker color
- Result must be ≥ 3:1, 4.5:1, or 7:1
```

### Relative Luminance Calculation

```javascript
// Convert RGB to relative luminance
function getLuminance(r, g, b) {
  // Normalize to 0-1
  const [R, G, B] = [r, g, b].map(val => val / 255);
  
  // Apply gamma correction
  const [rsRGB, gsRGB, bsRGB] = [R, G, B].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  // Calculate luminance
  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

// Example: black on white
const whiteL = getLuminance(255, 255, 255); // 1.0
const blackL = getLuminance(0, 0, 0);       // 0.0
const ratio = (whiteL + 0.05) / (blackL + 0.05); // 21:1
```

### WCAG 2.2 Updates (2024)
- Focus indicator visibility requirements strengthened
- Color accessibility requirements now apply to status messages
- Mobile accessibility requirements expanded
- All previous AA/AAA criteria remain in effect

---

## Color Vision Deficiency (Colorblindness)

### Prevalence by Type

| Type | Prevalence | Description |
|------|-----------|-------------|
| **Deuteranomaly (Green)** | 4.63% | Most common; reduced green sensitivity |
| **Deuteranopia (Green)** | 1.27% | Missing green cone; complete green blindness |
| **Protanomaly (Red)** | 1.08% | Reduced red sensitivity |
| **Protanopia (Red)** | 1.01% | Missing red cone; complete red blindness |
| **Tritanomaly (Blue)** | 0.02% | Reduced blue sensitivity (rare) |
| **Tritanopia (Blue)** | 0.03% | Missing blue cone (very rare) |
| **Achromatopsia** | 0.003% | Complete color blindness (grayscale only) |

**Gender distribution:** ~8% of males, 0.4-0.5% of females have CVD

### Red-Green Colorblindness (95% of all CVD)
- Users cannot reliably distinguish red from green
- Critical impact: Traffic lights, error/success states, charts
- Solution: Use blue/orange or blue/red combinations instead

### Colorblind-Safe Palette Rules
1. **Avoid red-green combinations** (primary culprit for confusion)
2. **Use blue as base color** (accessible for all CVD types)
3. **Pair with orange, yellow, or brown** for contrast
4. **Add non-color cues:** patterns, icons, text labels, borders
5. **Test with simulators** (test against protanopia, deuteranopia, tritanopia)

### Colorblind-Safe Color Pairs (Hex Values)
```
✅ SAFE (All CVD types):
- Blue #0173B2 + Orange #DE8F05
- Blue #0173B2 + Red #CC78BC
- Blue #029E73 + Orange #D45113
- Teal #56B4E9 + Orange #F0E442

❌ UNSAFE (Avoid):
- Red #E41A1C + Green #4DAF4A
- Red #FF0000 + Green #00FF00
- Purple #440154 + Green #31688E
```

---

## Semantic Color Token Architecture

### Token Hierarchy (4 Layers)

```
Layer 1: Primitive Tokens (Raw Colors)
         └─ --blue-600: #2563eb

Layer 2: Global Tokens (Role-Based)
         └─ --color-primary: var(--blue-600)

Layer 3: Semantic/Alias Tokens (Context-Specific)
         └─ --button-primary-bg: var(--color-primary)

Layer 4: Component Tokens (Optional - Direct Usage)
         └─ .btn-primary { background: var(--button-primary-bg); }
```

### JSON Token Format (Style Dictionary)

```json
{
  "color": {
    "primitive": {
      "blue": {
        "600": { "value": "#2563eb", "type": "color" }
      },
      "red": {
        "500": { "value": "#ef4444", "type": "color" }
      }
    },
    "semantic": {
      "primary": {
        "value": "{color.primitive.blue.600}",
        "type": "color",
        "description": "Primary interactive color for buttons, links"
      },
      "primary-hover": {
        "value": "#1d4ed8",
        "type": "color"
      },
      "error": {
        "value": "{color.primitive.red.500}",
        "type": "color"
      },
      "error-background": {
        "value": "#fee2e2",
        "type": "color",
        "description": "Light background for error messages"
      },
      "focus-ring": {
        "value": "rgba(37, 99, 235, 0.4)",
        "type": "color"
      }
    }
  }
}
```

### Tailwind CSS Semantic Color Setup

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primitive colors
        brand: {
          50: '#eff6ff',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        // Semantic colors
        primary: 'var(--color-primary, #2563eb)',
        'primary-hover': 'var(--color-primary-hover, #1d4ed8)',
        error: 'var(--color-error, #ef4444)',
        'error-bg': 'var(--color-error-bg, #fee2e2)',
        success: 'var(--color-success, #10b981)',
        warning: 'var(--color-warning, #f59e0b)',
        'focus-ring': 'var(--color-focus-ring, rgba(37, 99, 235, 0.4))'
      }
    }
  }
};
```

### CSS Variable Implementation

```css
/* Light mode (default) */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-focus: rgba(37, 99, 235, 0.4);
  
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  
  --color-error: #dc2626;
  --color-error-bg: #fee2e2;
  --color-success: #059669;
  --color-success-bg: #d1fae5;
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;
    --color-primary-hover: #3b82f6;
    --color-primary-focus: rgba(96, 165, 250, 0.3);
    
    --color-text: #f3f4f6;
    --color-text-secondary: #d1d5db;
    --color-background: #111827;
    --color-surface: #1f2937;
    
    --color-error: #f87171;
    --color-error-bg: #7f1d1d;
    --color-success: #6ee7b7;
    --color-success-bg: #064e3b;
    --color-warning: #fbbf24;
    --color-warning-bg: #78350f;
  }
}

/* Usage */
.button-primary {
  background-color: var(--color-primary);
  color: white;
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.button-primary:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-primary-focus);
}
```

---

## Material Design 3 HCT Color System

### What is HCT?

HCT (Hue, Chroma, Tone) is Google's modern color space that guarantees WCAG contrast automatically:

- **Hue (0-360°):** The color (red, blue, green, etc.)
- **Chroma (0-150):** Saturation/colorfulness
- **Tone (0-100):** Lightness (0=black, 100=white)

### Guaranteed Contrast with Tone Differences

```
Tone Difference  →  Contrast Ratio
─────────────────────────────────
30 units        →  ~1.5:1 (not accessible)
40 units        →  ≥3.0:1 (UI/large text)
50 units        →  ≥4.5:1 (normal text)
60 units        →  ≥7.0:1 (AAA normal)
```

**Key benefit:** No complex contrast calculations needed—just pick tone values far apart!

### Using Material Theme Builder

```javascript
// Generate HCT-based theme from seed color
import { argbFromHex, themeFromSourceColor } from '@material/material-color-utilities';

const seedColor = '#6750a4'; // Your brand color
const theme = themeFromSourceColor(argbFromHex(seedColor));

// theme.palettes contains light and dark schemes
console.log(theme.palettes.light.primary);   // Light theme primary
console.log(theme.palettes.dark.primary);    // Dark theme primary
```

### HCT Tone Recommendations for Semantic Colors

```
Background (Light):  ~90-100 tone (light/white)
Surface:             ~95 tone
Primary:             ~40 tone
Primary Container:   ~90 tone
On Primary (text):   ~100 tone
Error:               ~40 tone
Success:             ~40 tone
```

---

## Contrast Checking Libraries

### color.js (Modern, Complete)
```javascript
import Color from 'https://colorjs.io/latest/color.js';

// WCAG 2.1 contrast
const text = new Color('srgb', [0, 0, 0]);
const bg = new Color('srgb', [1, 1, 1]);
const wcagContrast = text.contrastWCAG21(bg); // 21:1

// APCA contrast (WCAG 3.0 preview)
const apca = text.contrast(bg, 'APCA');

// Check if meets AA standard
const meetsAA = text.contrastWCAG21(bg) >= 4.5; // true
```

### chroma.js (Simple & Lightweight)
```javascript
import chroma from 'chroma-js';

// Basic contrast
const ratio = chroma.contrast('#000', '#fff'); // 21

// With luminance adjustment (auto-lighten/darken for contrast)
const adjusted = chroma('red').luminance(0.4);

// Check against standard
if (chroma.contrast('red', 'white') < 4.5) {
  console.log('Fails AA - needs adjustment');
}
```

### polished (React/JS Utilities)
```javascript
import { readableColor, getLuminance } from 'polished';

const bgColor = '#f0f0f0';
const textColor = readableColor(bgColor); // Returns black or white

const lum = getLuminance(bgColor); // 0-1 scale
```

---

## Automated Testing & CI/CD Integration

### GitHub Actions Workflow (Pa11y)

```yaml
name: Color Accessibility Check

on: [pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Pa11y
        run: npm install -g pa11y-ci
      
      - name: Run accessibility audit
        run: pa11y-ci
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: a11y-report
          path: pa11y-ci-results.json
```

### axe-core with Puppeteer

```javascript
const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const results = await page.evaluate(async () => {
    return await axe.run();
  });
  
  // Filter for color contrast violations
  const contrastIssues = results.violations.filter(
    v => v.id === 'color-contrast'
  );
  
  console.log(`Found ${contrastIssues.length} contrast violations`);
  
  if (contrastIssues.length > 0) {
    process.exit(1); // Fail build
  }
  
  await browser.close();
})();
```

### Lighthouse CI (Cloud-Based)

```bash
# Configure lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["https://example.com"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "lhci"
    }
  }
}

# Run in CI
lhci autorun
```

---

## Code Examples

### React Hook for Accessible Button Colors

```typescript
import { useState, useMemo } from 'react';
import chroma from 'chroma-js';

interface UseAccessibleColorsProps {
  backgroundColor: string;
  targetContrast?: number; // 4.5 for AA, 7 for AAA
}

export function useAccessibleColors({
  backgroundColor,
  targetContrast = 4.5
}: UseAccessibleColorsProps) {
  const colors = useMemo(() => {
    // Try black text first
    let textColor = '#000000';
    let contrast = chroma.contrast(textColor, backgroundColor);
    
    // If insufficient, try white
    if (contrast < targetContrast) {
      textColor = '#ffffff';
      contrast = chroma.contrast(textColor, backgroundColor);
    }
    
    // If still insufficient, lighten/darken background
    if (contrast < targetContrast) {
      if (chroma(backgroundColor).luminance() > 0.5) {
        // Light background → use dark text
        textColor = chroma(backgroundColor).darken(3).hex();
      } else {
        // Dark background → use light text
        textColor = chroma(backgroundColor).lighten(3).hex();
      }
      contrast = chroma.contrast(textColor, backgroundColor);
    }
    
    return { textColor, backgroundColor, contrast };
  }, [backgroundColor, targetContrast]);
  
  return colors;
}

// Usage
function Button({ bgColor, label }) {
  const { textColor, contrast } = useAccessibleColors({
    backgroundColor: bgColor,
    targetContrast: 4.5
  });
  
  return (
    <button
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
      aria-label={`${label} (contrast ratio: ${contrast.toFixed(2)}:1)`}
    >
      {label}
    </button>
  );
}
```

### Accessible Focus States

```html
<!-- HTML -->
<button class="btn btn-primary">Click me</button>

<!-- CSS with WCAG focus indicator -->
<style>
  .btn {
    background-color: var(--color-primary);
    color: white;
    border: 2px solid transparent;
    padding: 12px 24px;
    border-radius: 4px;
    transition: all 150ms ease;
  }
  
  /* Focus visible for keyboard users */
  .btn:focus-visible {
    outline: 3px solid var(--color-primary-focus);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--color-focus-ring);
  }
  
  /* Hover state */
  .btn:hover {
    background-color: var(--color-primary-hover);
  }
  
  /* Active state */
  .btn:active {
    transform: scale(0.98);
  }
  
  /* Disabled state */
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

### Colorblind-Safe Chart Colors

```javascript
// Paul Tol's colorblind-safe palette
const colorblindSafePalette = {
  blue: '#0173B2',
  orange: '#DE8F05',
  red: '#CC78BC',
  yellow: '#CA9161',
  purple: '#949494',
  cyan: '#ECE133'
};

// Generate accessible chart colors (all CVD types)
function getColorblindSafeChartPalette(numColors) {
  const palette = [
    '#0173B2', // Blue
    '#DE8F05', // Orange
    '#029E73', // Green
    '#CC78BC', // Red-purple
    '#CA9161', // Brown
    '#949494'  // Gray
  ];
  
  return palette.slice(0, numColors);
}

// Verify all combinations are CVD-safe
function validateColorblindPalette(colors) {
  colors.forEach((color1, i) => {
    colors.forEach((color2, j) => {
      if (i !== j) {
        const contrast = chroma.contrast(color1, color2);
        if (contrast < 3) {
          console.warn(`Low contrast: ${color1} vs ${color2} (${contrast.toFixed(2)}:1)`);
        }
      }
    });
  });
  return true;
}
```

---

## Best Practices

### ✅ DO

1. **Start with contrast requirements first** → Design systems should enforce AA minimum at code level
2. **Use semantic tokens** → Map colors to meaning (error, success, primary) not usage (red-600)
3. **Test with simulators** → Use tools like Color Oracle to visualize CVD
4. **Provide non-color cues** → Add icons, patterns, text, borders alongside color meaning
5. **Use HCT or tone-based systems** → Guarantees contrast mathematically
6. **Dark mode from day one** → Create semantic tokens that flip automatically
7. **Measure focus indicators** → Verify 3:1 contrast on focus rings
8. **Automate testing** → Integrate contrast checks in CI/CD pipelines
9. **Test with real users** → Include people with CVD and low vision in QA
10. **Document color ratios** → Track contrast ratio for every color pair used in components

### ❌ DON'T

1. **Don't use red-green combinations** → 8% of users cannot distinguish
2. **Don't rely on color alone** → Use color + text + icons for meaning
3. **Don't use pastel colors for small text** → Insufficient contrast (except with very light backgrounds)
4. **Don't forget disabled states** → Reduced opacity alone is insufficient
5. **Don't hardcode colors in components** → Use CSS variables/semantic tokens
6. **Don't mix contrast formulas** → Use WCAG21 for AA/AAA compliance (not APCA yet for legal)
7. **Don't skip focus states** → Keyboard users need clear focus indicators
8. **Don't assume "looks good"** → Always verify with a contrast checker
9. **Don't change colors without testing** → Minor hex changes can drop contrast below threshold
10. **Don't ignore WCAG 2.2 updates** → Status messages now require color + text distinction

---

## Common Errors & Solutions

### Error: "Text fails AA contrast (3.2:1)"

**Cause:** Text color too similar to background luminance

**Solution:**
```javascript
import chroma from 'chroma-js';

// Current: fails
const bg = '#cccccc';
const text = '#999999';
console.log(chroma.contrast(text, bg)); // 1.5:1 ❌

// Fix 1: Use pure black/white
const fixedText = chroma(bg).luminance() > 0.5 ? '#000000' : '#ffffff';
console.log(chroma.contrast(fixedText, bg)); // > 4.5:1 ✅

// Fix 2: Increase saturation difference
const darkText = chroma(text).darken(4).hex(); // Darken text
console.log(chroma.contrast(darkText, bg)); // > 4.5:1 ✅
```

### Error: "Red-green buttons confuse colorblind users"

**Cause:** Using red for error and green for success without additional cues

**Solution:**
```html
<!-- ❌ Bad: Color only -->
<button style="background: #dc2626">Delete</button>
<button style="background: #10b981">Confirm</button>

<!-- ✅ Good: Color + icon + text -->
<button style="background: #dc2626">
  <span class="icon">⚠️</span> Delete
</button>
<button style="background: #10b981">
  <span class="icon">✓</span> Confirm
</button>
```

### Error: "Focus indicator not visible"

**Cause:** Low contrast between focus ring and background, or outline offset too small

**Solution:**
```css
/* ❌ Bad: Gray outline on gray background */
button:focus {
  outline: 1px solid #999999; /* Too subtle */
}

/* ✅ Good: High contrast with offset */
button:focus-visible {
  outline: 3px solid #0066ff;    /* High contrast */
  outline-offset: 2px;            /* Space from element */
  box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.3); /* Extra visual feedback */
}
```

### Error: "Dark mode colors have no contrast"

**Cause:** Semantic tokens not adapted for dark mode

**Solution:**
```css
/* ❌ Bad: Same colors in both modes */
:root {
  --color-primary: #2563eb;        /* Too dark on dark background */
}

/* ✅ Good: Tone-adjusted tokens */
:root {
  --color-primary: #2563eb;        /* Light mode: dark blue */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;      /* Dark mode: light blue */
  }
}

/* Or use HCT with tone adjustment */
```

### Error: "Leonardo theme doesn't apply to all components"

**Cause:** Components not using semantic color tokens

**Solution:**
```javascript
// ❌ Bad: Hardcoded colors
const Button = () => (
  <button style={{ background: '#2563eb', color: '#ffffff' }}>
    Click me
  </button>
);

// ✅ Good: Semantic tokens
const Button = () => (
  <button
    style={{
      background: 'var(--color-primary)',
      color: 'var(--color-on-primary)'
    }}
  >
    Click me
  </button>
);
```

---

## Tools & Resources

### Free Contrast Checkers
- **WebAIM Contrast Checker** — https://webaim.org/resources/contrastchecker/
- **Color Contrast Analyzer** — https://www.tpgi.com/color-contrast-checker/
- **Accessible Colors** — https://accessible-colors.com/
- **Contrast Ratio** — https://contrast-ratio.com/

### Color Accessibility Tools
- **Leonardo (Adobe)** — https://leonardocolor.io/ (HCT-based, Material 3)
- **Material Theme Builder** — https://material-foundation.github.io/material-theme-builder/
- **Color.js** — https://colorjs.io/ (WCAG + APCA contrast)
- **Coolors** — https://coolors.co/contrast-checker
- **Accessible Color Palette Generator** — https://venngage.com/tools/accessible-color-palette-generator

### CVD Testing Simulators
- **Coblis** — https://www.color-blindness.com/coblis-color-blindness-simulator/
- **Color Oracle** — https://colororacle.org/
- **Pilestone** — https://www.pilestone.com/pages/color-blindness-simulator-1

### Accessibility Testing (Automated)
- **axe DevTools** (Browser ext) — https://www.deque.com/axe/devtools/
- **WAVE** (Browser ext) — https://wave.webaim.org/extension/
- **Lighthouse** (Built-in Chrome) — DevTools → Lighthouse → Accessibility
- **Pa11y** (CLI) — https://pa11y.org/
- **axe-core** (NPM) — https://github.com/dequelabs/axe-core
- **Lighthouse CI** — https://github.com/GoogleChrome/lighthouse-ci

### Color Libraries (JavaScript)
- **chroma.js** — https://gka.github.io/chroma.js/ (Lightweight, WCAG contrast)
- **color.js** — https://colorjs.io/ (Modern, all contrast methods)
- **polished** — https://polished.js.org/ (React utilities)
- **TinyColor2** — https://bgrins.github.io/TinyColor/ (Small, color manipulation)
- **color** — https://github.com/Qix-/color (Complete color library)

### Design Token Tools
- **Style Dictionary** — https://amzn.github.io/style-dictionary/
- **Tokens Studio** (Figma plugin) — https://tokens.studio/
- **Design Tokens CLI** — https://github.com/amazon-style-dictionary/style-dictionary
- **Cobalt** — https://cobalt-ui.pages.dev/

### Documentation & Specs
- **WCAG 2.1 Specification** — https://www.w3.org/WAI/WCAG21/quickref/
- **WCAG 2.2 Specification** — https://www.w3.org/WAI/WCAG22/quickref/
- **Material Design 3 Color** — https://m3.material.io/styles/color/overview
- **IBM Carbon Design System** — https://carbondesignsystem.com/

---

## References

1. W3C. (2024). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
2. W3C. (2018). Web Content Accessibility Guidelines (WCAG) 2.1. https://www.w3.org/WAI/WCAG21/quickref/
3. WebAIM. (2024). Contrast and Color Accessibility. https://webaim.org/articles/contrast/
4. Google Material Design. (2022). Material 3 Color System. https://m3.material.io/styles/color
5. Adobe Spectrum. (2022). Leonardo Color System. https://leonardocolor.io/
6. Lea Verou. (2024). Color.js Documentation. https://colorjs.io/
7. Greenberg, A., & Stoakley, N. (2015). Prevalence of red-green color blindness. In *Color Vision Deficiency* (p. 245). Elsevier.
8. Pokorny, J., & Smith, V. C. (2005). Variability in color matching and in discrimination among observers with unilateral color deficiency. *Vision Research*, 45(15), 2995-3007.
9. Machado, G. M., Oliveira, M. M., & Fernandes, L. A. (2009). A physiologically-based model for simulation of color vision deficiency. *IEEE Transactions on Visualization and Computer Graphics*, 15(6), 1291-1298.
10. Deque Systems. (2024). Axe DevTools Documentation. https://www.deque.com/axe/devtools/
