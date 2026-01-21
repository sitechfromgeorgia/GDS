# Accessible Color Systems - Quick Reference Guide

## 🎯 WCAG Contrast Requirements (At a Glance)

```
LEVEL AA (MINIMUM STANDARD)
├─ Normal Text (<18pt):      4.5:1
├─ Large Text (≥18pt):       3:1
└─ UI Components:            3:1

LEVEL AAA (ENHANCED)
├─ Normal Text:              7:1
├─ Large Text:               4.5:1
└─ Focus Indicators:         3:1
```

**Key Rule:** Always check BOTH text size AND text weight

---

## 📊 Color Psychology Quick Map

| Color | Emotion | Best For | Conversion | Avoid If |
|-------|---------|----------|-----------|----------|
| 🔴 **Red** | Urgency | Error, CTA, alerts | +21-34% | Fear-inducing |
| 🔵 **Blue** | Trust | Primary, payment | Stable baseline | Overuse |
| 🟢 **Green** | Success | Confirmation, health | Context-dependent | Don't pair with red |
| 🟡 **Yellow** | Warning | Caution, attention | Must add context | Accessibility risk |
| 🟠 **Orange** | Warmth | Secondary, friendly | Engagement | Too warm for tech |
| 🟣 **Purple** | Premium | Innovation, VIP | Brand differentiation | Color blind risk |

---

## 🔍 Color Vision Deficiency (CVD) - The Facts

### Prevalence
```
Total Population: ~8% males, 0.4% females

Breakdown:
├─ Deuteranomaly (green, most common): 4.63%
├─ Deuteranopia (green missing): 1.27%
├─ Protanomaly (red, reduced): 1.08%
├─ Protanopia (red missing): 1.01%
└─ Other types (rare): <0.1%

Critical: 95% of CVD is RED-GREEN confusion
```

### What They See

```
DEUTERANOPIA (Red-Green Blind)
Input:    [Red]     [Green]    [Yellow]   [Blue]
Sees:     Brown     Brown      Brown      Blue

PROTANOPIA (Red-Green Blind)
Input:    [Red]     [Green]    [Yellow]   [Blue]
Sees:     Dark      Yellow     Yellow     Blue

SAFE PALETTE (All CVD Types)
Input:    [Blue]    [Orange]   [Red-Purp] [Gray]
Sees:     Blue ✓    Orange ✓   Purple ✓   Gray ✓
```

---

## ✅ Safe Color Combinations (All CVD Types)

### Ready-to-Use Hex Pairs
```
TIER 1 (Guaranteed Safe)
├─ #0173B2 (Blue) + #DE8F05 (Orange)
├─ #029E73 (Green) + #D45113 (Brown)
├─ #56B4E9 (Teal) + #F0E442 (Yellow)
└─ #0173B2 (Blue) + #CC78BC (Red-Purple)

TIER 2 (Generally Safe)
├─ #1F77B4 (Steel Blue) + #FF7F0E (Orange)
├─ #2CA02C (Forest Green) + #D62728 (Red)
└─ #17BECF (Cyan) + #BCBD22 (Yellow-Green)
```

### What NOT to Use
```
❌ NEVER PAIR (Red-Green Confusion)
├─ Red (#FF0000) + Green (#00FF00)
├─ Dark Red + Green variations
├─ Any red-green combination
└─ Brown + Gray in high-data-density charts
```

---

## 📐 Contrast Ratio Formula (Quick Reference)

```
FORMULA: Ratio = (L1 + 0.05) / (L2 + 0.05)

L1 = Relative luminance of LIGHTER color
L2 = Relative luminance of DARKER color

LUMINANCE: RL = 0.2126×R + 0.7152×G + 0.0722×B
(with gamma correction applied)

RESULT:    1:1 (no contrast) → 21:1 (maximum)
```

### Quick Luminance Values (Common Colors)
```
Color      | Hex     | Luminance
-----------|---------|----------
White      | #FFFFFF | 1.00
Black      | #000000 | 0.00
Red        | #FF0000 | 0.21
Green      | #00FF00 | 0.72
Blue       | #0000FF | 0.07
Yellow     | #FFFF00 | 0.93
Gray (50%) | #808080 | 0.22
```

---

## 🎨 Semantic Color Token Structure

### Layer Hierarchy
```
Layer 1: PRIMITIVE TOKENS (Raw values)
  └─ --blue-600: #2563eb

Layer 2: GLOBAL TOKENS (Role-based)
  └─ --color-primary: var(--blue-600)

Layer 3: SEMANTIC TOKENS (Context-specific)
  └─ --button-primary-bg: var(--color-primary)

Layer 4: COMPONENT TOKENS (Optional)
  └─ .btn-primary { background: var(--button-primary-bg); }
```

### Minimum Semantic Palette
```css
:root {
  /* Interactive */
  --color-primary: [brand blue];
  --color-primary-hover: [darker blue];
  
  /* Status */
  --color-error: #dc2626;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-info: #0284c7;
  
  /* Neutral */
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  
  /* Interaction */
  --color-focus-ring: rgba(37, 99, 235, 0.4);
  --color-border: #e5e7eb;
}
```

---

## 🌙 Dark Mode Token Adaptation

### Pattern: Tone Flipping

```css
/* Light Mode (Default) */
:root {
  --bg-primary: #ffffff;      /* Light */
  --text-primary: #000000;    /* Dark */
  --color-primary: #2563eb;   /* Medium Blue */
}

/* Dark Mode (Flip tones) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;    /* Dark - opposite of light */
    --text-primary: #f3f4f6;  /* Light - opposite of dark */
    --color-primary: #60a5fa; /* Lighter blue - maintains tone diff */
  }
}
```

### Guarantee Contrast in Dark Mode
```
Dark Mode Formula:
1. Calculate tone difference in light mode
2. Flip background tone (dark ←→ light)
3. Adjust text/color tones to maintain difference
4. Verify 4.5:1 minimum maintained

Example:
Light: Blue (#2563eb / ~40% luminance) on White (100%)
Dark:  Light Blue (#60a5fa / ~60% luminance) on Dark (#111827 / ~5%)
Both maintain >4.5:1 ✓
```

---

## 🛠 Material Design 3 HCT System

### Tone-to-Contrast Mapping

```
Tone Difference | Guaranteed Contrast Ratio
─────────────────────────────────────────────
30 units        | ~1.5:1  (not accessible)
40 units        | ≥3:1    (UI compliant)
50 units        | ≥4.5:1  (AA text)
60 units        | ≥7:1    (AAA text)
```

### Recommended Tone Values

```
Component          | Light Theme | Dark Theme
-------------------|-------------|------------
Background         | 95-100      | 5-10
Surface/Card       | 95          | 12
Primary Color      | 40          | 60
Primary Container  | 90          | 30
On-Primary (text)  | 100         | 10
Error              | 40          | 80
Success            | 40          | 80
```

---

## 🔧 Code Snippets (Copy-Paste Ready)

### Check Contrast (JavaScript)
```javascript
// Using color.js
const contrast = new Color('srgb', [0, 0, 0])
  .contrastWCAG21(new Color('srgb', [1, 1, 1]));
console.log(contrast >= 4.5 ? '✓ AA' : '✗ Fail');

// Using chroma.js
const ratio = chroma.contrast('black', 'white');
console.log(ratio >= 4.5 ? '✓ AA' : '✗ Fail');
```

### CSS Focus Indicator
```css
button:focus-visible {
  outline: 3px solid var(--color-primary);      /* High contrast */
  outline-offset: 2px;                           /* Clear space */
  box-shadow: 0 0 0 4px var(--color-focus-ring); /* Visual feedback */
}
```

### Semantic Button (Tailwind)
```html
<button class="
  bg-primary hover:bg-primary-hover
  text-white
  focus:ring-4 focus:ring-focus-ring
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Click me
</button>
```

---

## ⚠️ Common Mistakes & Fixes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Gray text on white | ~1:1 contrast ❌ | Use #333 or darker |
| Red + Green | CVD confusion ❌ | Use blue + orange |
| Focus outline missing | Keyboard users trapped ❌ | Add focus-visible |
| Color-only error message | Screen readers miss it ❌ | Add text + icon |
| Same colors in dark mode | No contrast ❌ | Adjust tone/luminance |
| Hardcoded colors | Can't theme ❌ | Use CSS variables |
| Small colored text | Unreadable for low-vision ❌ | Increase size + contrast |
| No disabled state distinction | Confusing UI ❌ | Reduce opacity + gray out |

---

## 🧪 Testing Checklist

```
AUTOMATED (CI/CD)
□ Run axe-core in pipeline
□ Set Pa11y threshold to AA minimum
□ Lighthouse accessibility score ≥90
□ Build fails on contrast violations

MANUAL (Developer)
□ Test with WebAIM Contrast Checker
□ Verify 4.5:1+ on all text combinations
□ Check focus indicators with keyboard Tab
□ Test with Color Oracle (CVD simulation)

DESIGN REVIEW
□ Verify semantic token usage
□ Confirm dark mode contrast
□ Test focus states (default, hover, active, focus)
□ Validate disabled state visibility

ACCESSIBILITY AUDIT
□ Test with screen reader (NVDA/JAWS)
□ Test colorblind modes (Coblis, Color Oracle)
□ Test low-vision magnification (200%)
□ Get feedback from users with CVD
```

---

## 🔗 Essential Tools (One-Click Access)

| Tool | Purpose | Link |
|------|---------|------|
| WebAIM Contrast | Quick checking | https://webaim.org/resources/contrastchecker/ |
| Leonardo | Design systems | https://leonardocolor.io/ |
| Color.js | Calculations | https://colorjs.io/ |
| Chroma.js | Manipulation | https://gka.github.io/chroma.js/ |
| Material Builder | HCT themes | https://material-foundation.github.io/material-theme-builder/ |
| Coblis | CVD simulation | https://www.color-blindness.com/coblis-color-blindness-simulator/ |
| axe DevTools | Browser testing | https://www.deque.com/axe/devtools/ |
| WAVE | Visual scan | https://wave.webaim.org/extension/ |
| Lighthouse | Built-in Chrome | DevTools → Lighthouse → Accessibility |
| Pa11y CLI | Automation | https://pa11y.org/ |

---

## 📋 Compliance Summary

| Standard | Status | Requirement |
|----------|--------|-------------|
| WCAG 2.1 Level AA | Minimum Legal | 4.5:1 (text), 3:1 (UI) |
| WCAG 2.1 Level AAA | Best Practice | 7:1 (text), 4.5:1 (large) |
| WCAG 2.2 | Current (2024) | Same + focus + status messages |
| ADA (US) | Legal | Typically WCAG 2.1 AA |
| EU EN 301 549 | Legal | Typically WCAG 2.1 AA |
| AODA (Canada) | Legal | Typically WCAG 2.1 AA |

---

## 🚀 Implementation Path

```
Week 1: FOUNDATION
├─ Define semantic tokens
├─ Set up CSS variables or Tailwind config
└─ Test with WebAIM Contrast Checker

Week 2: TESTING
├─ Integrate Pa11y in CI/CD
├─ Set up axe-core automation
└─ Test dark mode contrast

Week 3: REFINEMENT
├─ CVD simulation testing (Coblis)
├─ Focus indicator validation
└─ Design review with accessibility expert

Week 4: DEPLOYMENT
├─ Team training on token usage
├─ Documentation + guidelines
└─ Ongoing monitoring in production
```

---

**Last Updated:** January 20, 2026
**WCAG Version:** 2.1 & 2.2 Current
**Material Design:** 3.0+ (HCT ready)
