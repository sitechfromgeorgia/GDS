# Typography Systems - Visual Reference Guide

## Type Scale Visualization

### Modular Scale Examples (16px Base)

```
Ratio 1.125 (Major Second) - Subtle
├─ h6: 14.2px
├─ h5: 16px ✓ Base
├─ h4: 18px
├─ h3: 20.3px
├─ h2: 22.8px
└─ h1: 25.7px

Ratio 1.25 (Major Third) - Balanced ⭐ RECOMMENDED
├─ h6: 12.8px
├─ h5: 16px ✓ Base
├─ h4: 20px
├─ h3: 25px
├─ h2: 31.25px
└─ h1: 39px

Ratio 1.5 (Perfect Fifth) - Bold
├─ h6: 10.7px
├─ h5: 16px ✓ Base
├─ h4: 24px
├─ h3: 36px
├─ h2: 54px
└─ h1: 81px

Ratio 1.618 (Golden Ratio) - Elegant
├─ h6: 9.9px
├─ h5: 16px ✓ Base
├─ h4: 25.9px
├─ h3: 41.8px
├─ h2: 67.7px
└─ h1: 109.5px
```

---

## Line Height Reference

### Visual Comparison at 16px Base

```
Line Height 1.2 (TIGHT) - Headings
│ The quick brown fox │
│ jumps over the lazy │
│ dog                 │
└─ Gap: 3.2px between lines
   Readability: Compact, powerful
   Use: Headings, titles

Line Height 1.5 (NORMAL) - Body ⭐ RECOMMENDED
│ The quick brown fox      │
│ jumps over the lazy dog. │
│ This is readable text.   │
└─ Gap: 8px between lines
   Readability: Optimal
   Use: Paragraphs, body copy

Line Height 1.75 (RELAXED) - Large Text
│ The quick brown fox               │
│ jumps over the lazy dog.          │
│ This text has more breathing room.│
└─ Gap: 12px between lines
   Readability: Airy, elegant
   Use: Large text, hero sections

Line Height 2.0 (LOOSE) - Display
│ The quick brown fox                    │
│ jumps over the lazy dog.               │
│                                        │
│ This has significant spacing.          │
└─ Gap: 16px between lines
   Readability: Very open
   Use: Decorative, display text
```

---

## Font Pairing Matrix

### Decision Grid

```
                    SERIF BODY
                    ├─ Elegant
                    ├─ Traditional
                    └─ Sophisticated
                           ↓
        DISPLAY SERIF + BODY SERIF
        └─ Two serif pairing (rare, needs careful selection)
        
        ↙CLASSIC                    MODERN↘
        
CLASSIC SERIF          ←→          MODERN SANS
(Georgia, Times)                    (Inter, Segoe UI)
   │                                    │
   └─ CLASSIC SANS ──────┬───── MODERN SERIF
      (Trebuchet, Arial) │       (Playfair, Merriweather)
                         ↓
                    Balance Point
                    (Most common)

Best Pairings:
SERIF (Display) + SANS (Body)     ✓✓✓ Classic
SANS (Display) + SANS (Body)      ✓✓ Modern
SERIF (Display) + SERIF (Body)    ✓ Rare (expert-level)
```

---

## Responsive Typography Diagram

### Clamp() Scaling Visualization

```
Font Size (px)
│
│     64 ├─────────────── max boundary
│        │              ╱
│        │            ╱
│     48 ├──────────╱──────────────
│        │        ╱
│        │      ╱   ← preferred value (slope)
│     32 ├────╱───────────────────
│        │  ╱
│        │╱
│     16 ├─────────────── min boundary
│        │
└────────┼─────────────────────────
     320px    768px    1024px    1920px
          Viewport Width

clamp(16px, 1vw + 0.8rem, 64px)
     │        └── Linear interpolation
     └── Min/Max constraints
```

---

## Vertical Rhythm Grid

### Baseline Alignment Visualization

```
Baseline: 24px (16px × 1.5 line-height)

H1 (48px)
├─ Lines: 48 ÷ 24 = 2 grid units
├─ Display:
│  ┌────────────────────────┐ ← Grid line
│  │ H1 Text 48px           │
│  │ (fits 2 units)         │
│  └────────────────────────┘ ← Grid line
│  └────────────────────────┘ ← Grid line (margin)
│
H2 (32px)
├─ Lines: 32 ÷ 24 = 1.33 → round up to 2
├─ Display:
│  ┌────────────────────────┐ ← Grid line
│  │ H2 Text 32px           │
│  │ (fits 2 units)         │
│  └────────────────────────┘ ← Grid line
│
Body (16px)
├─ Lines: 16 ÷ 24 = 0.67 → round up to 1
├─ Display:
│  ┌────────────────────────┐ ← Grid line
│  │ Body text at 16px with │
│  │ 24px line-height       │
│  └────────────────────────┘ ← Grid line

All elements align to 24px baseline grid ✓
```

---

## Font-Display Strategy Decision Tree

```
Does font need to appear immediately?
│
├─ YES (Critical branding)
│  └─ font-display: block
│     • Shows fallback font for 2-3 seconds
│     • Then swaps (FOIT)
│     • Best for: Logos, brand colors
│     • Risk: Invisible text delay
│
├─ NO, content first
│  ├─ Is font mission-critical?
│  │  │
│  │  ├─ YES (main heading)
│  │  │  └─ font-display: swap ⭐ RECOMMENDED
│  │  │     • Shows fallback immediately
│  │  │     • Swaps when ready (FOUT)
│  │  │     • Best for: Most sites
│  │  │     • Risk: Brief visual change
│  │  │
│  │  └─ NO (decorative)
│  │     └─ font-display: optional
│  │        • Shows fallback if timeout
│  │        • May not load at all
│  │        • Best for: Nice-to-have fonts
│  │        • Risk: Fallback font visible
│  │
│  └─ Need balance?
│     └─ font-display: fallback
│        • 100ms wait for custom font
│        • 3s swap period (like swap but limited)
│        • Best for: Secondary fonts
│        • Risk: Limited time to swap

RECOMMENDED STRATEGY:
┌─────────────────────────────────┐
│ Primary font: font-display: swap │
│ Secondary fonts: font-display: optional or fallback │
│ All fonts: Use WOFF2 format     │
│ Preload: 1-2 critical fonts     │
└─────────────────────────────────┘
```

---

## Container Query Typography

### Component-Level Scaling

```
Desktop (1200px wide)
┌──────────────────────────────────────────┐
│ Card Container (600px)                   │
│ ├──────────────────────────────┐     │
│ │ Title (28px)                 │     │
│ │ Body text (16px)             │     │
│ │ using viewport-based scaling │     │
│ └──────────────────────────────┘     │
│ Other content                            │
└──────────────────────────────────────────┘

Tablet (768px wide)
┌──────────────────────────────────────────┐
│ Grid: 2 columns × 384px each             │
│ ┌──────────────┐  ┌──────────────┐       │
│ │ Card A       │  │ Card B       │       │
│ │ Title 18px   │  │ Title 18px   │       │
│ │ (uses cqw,   │  │ (uses cqw,   │       │
│ │ NOT vw!)     │  │ NOT vw!)     │       │
│ └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────┘

Mobile (375px wide)
┌──────────────────────────────────────────┐
│ Card Container (100%)                    │
│ ├──────────────────────────────┐     │
│ │ Title (16px)                 │     │
│ │ Scales with card, not viewport  │     │
│ │ (container queries work!)        │     │
│ └──────────────────────────────┘     │
└──────────────────────────────────────────┘

✓ Container queries = truly responsive components
✓ Works in reusable card patterns
✓ No media query overrides needed
```

---

## Accessibility Compliance Matrix

### Contrast Ratio Requirements

```
WCAG Levels by Text Type and Contrast Ratio

Text Type         │ AA Min  │ AAA Min │ Examples
─────────────────────────────────────────────────
Normal (14px)     │ 4.5:1   │ 7:1     │ Body copy
Large (18px+)     │ 3:1     │ 4.5:1   │ Headings
UI Elements       │ 3:1     │ 4.5:1   │ Buttons
Decorative        │ None    │ None    │ Watermark

Visual Examples:
#000000 on #FFFFFF
│ Ratio: 21:1
└─ ✓✓✓ Perfect (all levels)

#333333 on #FFFFFF
│ Ratio: 12.63:1
└─ ✓✓✓ Excellent (AA + AAA)

#666666 on #FFFFFF
│ Ratio: 7:1
└─ ✓✓ Good (AA + AAA for large text)

#888888 on #FFFFFF
│ Ratio: 4.48:1
└─ ✓ Marginal (AA only, large text)

#999999 on #FFFFFF
│ Ratio: 3.74:1
└─ ✗ Fails (AA normal text)
   ✓ Passes (AA large text)

Minimum Font Sizes for WCAG AA:
├─ Body text: 14px (web), 18px (print)
├─ Small text: 12px (minimum)
├─ Touch targets: 44px (height/width)
└─ Zoom capability: Support 200% zoom minimum
```

---

## Variable Fonts Architecture

### File Structure Comparison

```
STATIC FONTS (Traditional)
├─ roboto-400.woff2 (15KB)
├─ roboto-500.woff2 (15KB)
├─ roboto-600.woff2 (15KB)
├─ roboto-700.woff2 (15KB)
└─ roboto-italic-400.woff2 (16KB)
   Total: 76KB | Requests: 5

VARIABLE FONTS (Modern)
├─ roboto-variable.woff2 (28KB)
│  ├─ Weights: 100-900 (all)
│  ├─ Widths: Normal-Condensed
│  ├─ Slant: Upright + Italic
│  └─ All styles in one file
   Total: 28KB | Requests: 1
   Savings: 63% (76KB → 28KB)

With 3+ weights: Variable fonts win
With 1-2 weights: Static fonts can be lighter
```

---

## Clamp() Calculator Flowchart

```
START
│
├─ Minimum font size (px)? → 16px
├─ Maximum font size (px)? → 32px
├─ Minimum viewport (px)? → 320px
└─ Maximum viewport (px)? → 1920px
   │
   ├─ Calculate slope:
   │  slope = (32 - 16) / (1920 - 320)
   │  slope = 16 / 1600 = 0.01
   │  │
   │  ├─ Convert to vw:
   │  │  fluid-vw = 0.01 × 100 = 1vw
   │  │
   │  └─ Calculate intercept:
   │     intercept = 16 - (0.01 × 320)
   │     intercept = 16 - 3.2 = 12.8px
   │
   ├─ Build clamp():
   │  clamp(1rem, 1vw + 0.8rem, 2rem)
   │
   ├─ Verify:
   │  At 320px: 1vw + 0.8rem = 3.2px + 12.8px = 16px ✓
   │  At 1920px: 1vw + 0.8rem = 19.2px + 12.8px = 32px ✓
   │
   └─ USE IT!

Result: clamp(1rem, 1vw + 0.8rem, 2rem)
```

---

## Performance Impact Summary

```
OPTIMIZATION              │ Impact      │ Effort
─────────────────────────────────────────────────
WOFF2 Format             │ +26% faster │ Easy
(vs WOFF1)               │             │

Subsetting (Latin)       │ +40% faster │ Easy
(vs full charset)        │             │

Preload 1-2 fonts        │ +15% LCP    │ Easy
(vs no preload)          │             │

Variable font            │ +30% faster │ Medium
(vs 4 static)            │             │

Self-hosting             │ +20% CLS    │ Medium
(vs CDN delay)           │             │

Font-display: swap       │ +0% FOIT    │ Easy
(vs block)               │             │

Size-adjust fallback     │ ~0% CLS     │ Medium
(vs mismatch)            │             │

Combined (all above):    │ +65% faster │ Moderate
                         │ ~0% CLS     │

⭐ Recommended baseline:
   WOFF2 + Subsetting + Preload + font-display:swap
   Improvement: +40% faster, ~50ms LCP improvement
```

---

**Generated:** January 20, 2026  
**Reference Version:** 1.0 (2024-2025 patterns)  
**Status:** Ready for implementation
