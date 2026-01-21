# UI Components Quick Reference Card (2024-2025)

## Essential State Matrix at a Glance

### Universal Component States
```
┌─────────────────────────────────────────────────┐
│  STATE          │ VISUAL               │ TRIGGER  │
├─────────────────────────────────────────────────┤
│  Default        │ Normal styling       │ Load     │
│  Hover          │ Shadow/color shift   │ Mouse    │
│  Focus          │ 2px ring outline     │ Tab      │
│  Focus-Visible  │ Ring (keyboard only) │ Tab      │
│  Active         │ Scale-95, darker     │ Press    │
│  Disabled       │ 50% opacity          │ N/A      │
│  Loading        │ Spinner + disabled   │ Async    │
│  Error          │ Red border/text      │ Fail     │
│  Success        │ Green indicator      │ Complete │
└─────────────────────────────────────────────────┘
```

## Component State Specifications

### Buttons
```
SIZE VARIANTS:
├─ sm   → 32px height | 14px font | 6px 12px padding
├─ md   → 44px height | 16px font | 8px 16px padding ⭐ mobile default
├─ lg   → 48px height | 18px font | 10px 20px padding
└─ xl   → 56px height | 20px font | 12px 24px padding

TYPE VARIANTS:
├─ Primary      → blue-500 → hover: blue-600 → active: blue-700
├─ Secondary    → gray-200 → hover: gray-300 → active: gray-400
├─ Tertiary     → text-only → hover: bg-50 opacity
├─ Destructive  → red-600 → hover: red-700
└─ Icon         → p-2 rounded-full | Icon: 1.25em

STATES:
├─ Default      → standard colors
├─ Hover        → darker bg + shadow-md
├─ Focus        → focus-visible:ring-2 + ring-offset-2
├─ Active       → active:scale-95 + darker color
├─ Disabled     → opacity-50 + cursor-not-allowed
└─ Loading      → disabled + spinner icon

TOUCH TARGET: 44x44px minimum (WCAG AA)
```

### Cards
```
TYPES:
├─ Content Card      → flex, shadow-sm, hover:shadow-md
├─ Interactive Card  → button element, hover:scale, focus:ring
├─ Media Card        → image-first, hover:image-scale
├─ Product Card      → price highlight, rating, CTA
└─ Stat/Dashboard    → icon + number + trend

STATES:
├─ Default    → shadow-sm, border-gray-200
├─ Hover      → shadow-md + translateY(-2px) + border-primary
├─ Focus      → focus-within:ring-2
├─ Active     → scale-98 + shadow-sm
├─ Loading    → opacity-60 + pointer-events-none
└─ Error      → border-red-500 + bg-red-50

SIZING:
├─ Image    → 180-240px height
├─ Padding  → 16-24px (1rem to 1.5rem)
└─ Spacing  → 16-24px gap between cards

RESPONSIVE GRID:
├─ Mobile        → grid-cols-1
├─ Tablet        → sm:grid-cols-2
└─ Desktop       → lg:grid-cols-3
```

### Modals
```
TYPES:
├─ Alert        → confirmation, warnings
├─ Form Modal   → data entry
├─ Full-Screen  → mobile, complex content
├─ Side Sheet   → navigation, filters
├─ Confirmation → yes/no decisions
└─ Lightbox     → images, media

REQUIRED:
├─ role="dialog"
├─ aria-modal="true"
├─ aria-labelledby="id"
├─ aria-describedby="id"
└─ Focus trap (roving tabindex or native <dialog>)

SIZES:
├─ Small    → 360px (alerts)
├─ Medium   → 500px (forms) ⭐ default
├─ Large    → 720px (complex)
└─ Mobile   → 100vw (full-screen)

TRANSITIONS:
├─ Duration   → 250-300ms
├─ Timing     → ease-out
└─ Reduced    → @media (prefers-reduced-motion: reduce)

KEYBOARD:
├─ Escape → close modal
├─ Tab    → forward focus
├─ Shift+Tab → backward focus
└─ Return/Space → activate button
```

### Navigation
```
TYPES:
├─ Top Horizontal    → header nav, Tab + arrows
├─ Side Vertical     → sidebar, Tab + arrows
├─ Bottom Mobile     → tab bar, Tab + arrows
├─ Breadcrumbs       → path hierarchy, Tab + Enter
├─ Tabs              → content sections
└─ Pagination        → page browsing

STATES:
├─ Default       → standard color
├─ Hover         → bg shift + shadow
├─ Focus         → focus-visible:ring-2
├─ Active/Current → aria-current="page"
└─ Disabled      → opacity-50 + no interaction

KEYBOARD:
├─ Tab        → move between items
├─ Shift+Tab  → move backward
├─ Arrow Keys → navigate within group (roving tabindex)
├─ Home       → first item
├─ End        → last item
└─ Escape     → close submenu

ARIA:
├─ aria-label        → "Main navigation"
├─ aria-current      → "page" on current link
├─ role="menubar"    → on container
└─ role="menuitem"   → on items
```

## Tailwind CSS State Classes

```
/* FOCUS STATES */
focus:              outline:auto or outline from @apply
focus-visible:      keyboard focus ring visible
focus-within:       focus on any child element
focus-ring:         preset ring styling

/* HOVER & ACTIVE */
hover:              mouse over
hover:shadow-md     elevated on hover
active:scale-95     pressed effect
active:shadow-sm    reduced shadow when pressed

/* DISABLED */
disabled:opacity-50                cursor-not-allowed
disabled:hover:bg-default-color    no hover change

/* DARK MODE */
dark:bg-gray-900    dark theme colors
dark:text-white     text in dark mode
@media (prefers-color-scheme: dark)

/* REDUCED MOTION */
motion-reduce:transition-none
@media (prefers-reduced-motion: reduce)

/* HIGH CONTRAST */
contrast-more:ring-4    thicker focus ring
@media (prefers-contrast: more)

/* GROUP UTILITIES */
group-hover:text-blue-600    change on parent hover
group-focus-within:ring-2    change when child focused
```

## Accessibility Checklist

### Before Launch
- [ ] All buttons have 2-3px visible focus indicators
- [ ] Color contrast ≥4.5:1 (text), ≥3:1 (UI components)
- [ ] Touch targets ≥44x44px on mobile
- [ ] Modal focus trap working (Escape key, Tab wrapping)
- [ ] Keyboard navigation: Tab, Shift+Tab, Enter, Space, Escape
- [ ] aria-labels on icon-only buttons
- [ ] Form inputs have associated labels (htmlFor/id match)
- [ ] Error messages linked via aria-describedby
- [ ] Animations respect prefers-reduced-motion
- [ ] Dark mode colors maintain contrast
- [ ] Tested with NVDA (Windows) or VoiceOver (Mac)

### Quick Testing
```bash
# Keyboard-only: Unplug mouse, Tab through entire site
# Dark mode: DevTools → Rendering → prefers-color-scheme: dark
# High contrast: DevTools → Rendering → prefers-contrast: more
# Reduced motion: DevTools → Rendering → prefers-reduced-motion: reduce
# Color blindness: Chrome → Rendering → Emulate vision deficiency
```

## CSS Variables Template

```css
:root {
  /* Colors - Primitives */
  --color-primary: #3B82F6;
  --color-error: #DC2626;
  --color-success: #16A34A;
  --color-warning: #D97706;
  
  /* Colors - Semantic */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-border: #E5E7EB;
  
  /* States (Material Design 3) */
  --state-hover: 0.08;       /* 8% opacity */
  --state-focus: 0.12;       /* 12% opacity */
  --state-active: 0.12;      /* 12% opacity */
  --state-disabled: 0.38;    /* 38% opacity */
  
  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Focus */
  --focus-ring: 2px solid var(--color-primary);
  --focus-offset: 2px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60A5FA;
    --color-text-primary: #F9FAFB;
    --color-bg-primary: #111827;
    --color-border: #4B5563;
  }
}

@media (prefers-contrast: more) {
  :root {
    --focus-ring: 3px solid var(--color-primary);
  }
}
```

## Copy-Paste Templates

### Button with All States
```jsx
<button
  className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  onClick={handleClick}
>
  Click me
</button>
```

### Card with Hover Effect
```jsx
<div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300">
  <h3 className="font-semibold mb-2">Title</h3>
  <p className="text-gray-600">Content</p>
</div>
```

### Modal with Focus Trap
```jsx
<dialog
  ref={dialogRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  className="rounded-lg p-6 max-w-md shadow-xl backdrop:bg-black/50"
  onCancel={handleClose}
>
  <h2 id="dialog-title">Title</h2>
  <p>Content</p>
  <button onClick={handleClose}>Close</button>
</dialog>
```

### Navigation with aria-current
```jsx
<nav aria-label="Main">
  <a href="/home" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>
```

### Form Field with Error
```jsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && <p id="email-error" role="alert">{error}</p>}
</div>
```

## Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Remove focus outline | Keyboard users can't see where they are | Use `outline: 2px solid` instead of `outline: none` |
| Hover-only states | Mobile users can't access them | Duplicate hover styles to focus |
| Color-only indicators | Colorblind users miss state changes | Add icons, text, or patterns |
| Buttons < 44x44px | Touch targets too small | Set min-height: 44px, min-width: 44px |
| Animations without reduce-motion | Causes motion sickness | Wrap in @media (prefers-reduced-motion: reduce) |
| Modal without focus trap | Focus escapes or wraps incorrectly | Use native <dialog> or implement roving tabindex |
| Positive tabindex values | Breaks Tab order | Use only 0 or -1 |
| aria-disabled without disabled | Still focusable despite disabled appearance | Use disabled attribute on buttons |
| Multiple aria-labels | Conflicting announcements | Use only aria-labelledby if title exists |
| Opacity-only disabled state | Can't see button is disabled | Combine opacity + color shift + cursor change |

## Resource Links

### Official Documentation
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- Material Design 3: https://m3.material.io/
- Radix UI: https://www.radix-ui.com/themes/docs
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/docs

### Accessibility
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Contrast: https://webaim.org/resources/contrastchecker/
- a11y Project: https://www.a11y-collective.com/

### Tools
- NVDA: https://www.nvaccess.org/
- axe DevTools: https://www.deque.com/axe/devtools/
- Lighthouse: Built in Chrome DevTools
- WAVE: https://wave.webaim.org/

## Measurements Reference

```
TOUCH TARGETS
Mobile:     44x44px minimum (WCAG AA)
AAA:        44x44px recommended
Hover area: 48x48px ideal

TIMING (ms)
Instant:      0ms
Fast:       150ms (hover feedback)
Normal:     250ms (standard interaction)
Slow:       350ms (complex animation)
Deliberate: 500ms+ (page transitions)

SPACING
XS:  4px
SM:  8px (padding, gap)
MD: 16px (padding, card gap) ⭐ default
LG: 24px (section spacing)
XL: 32px (major sections)

FONTS
Small:  14px (captions, hints)
Body:   16px (default text) ⭐
Large:  18px (titles)
XL:     24px (headings)

SHADOWS
SM:  0 1px 2px rgba(0, 0, 0, 0.05)
MD:  0 4px 6px rgba(0, 0, 0, 0.1)
LG: 0 10px 15px rgba(0, 0, 0, 0.1)

BORDER RADIUS
SM:   4px
MD:   8px (buttons, cards) ⭐
LG:  12px (large cards)
XL:  16px (hero sections)

CONTRAST RATIOS
Text body:           4.5:1 (WCAG AA)
Large text (18px+):  3:1 (WCAG AA)
UI components:       3:1 (WCAG AA)
Focus indicator:     3:1 minimum
```

---

**Last Updated**: January 2026 | **Version**: 2024-2025 Standards
