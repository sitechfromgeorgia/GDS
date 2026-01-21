# Comprehensive UI Component Design System Guide (2024-2025)

## Table of Contents
1. [Button Design Patterns](#button-design-patterns)
2. [Card Component Patterns](#card-component-patterns)
3. [Modal/Dialog Patterns](#modaldialog-patterns)
4. [Navigation Patterns](#navigation-patterns)
5. [State Design System](#state-design-system)
6. [Accessibility Deep Dive](#accessibility-deep-dive)
7. [Implementation Framework](#implementation-framework)
8. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Button Design Patterns

### Complete Button State Matrix

Every button must implement a full state matrix for consistency and accessibility.

#### States Overview

```
Default State
├── Default (idle)
└── Hover (mouse over)
    
Focus States
├── Focus (programmatic/programmatically focused)
└── Focus-Visible (keyboard Tab)
    
Interaction States
├── Active (button press/hold)
└── Disabled (unavailable)
    
Async States
├── Loading (pending operation)
├── Success (operation completed)
└── Error (operation failed)
```

#### Button Type Specifications

**Primary Button**
- Purpose: Main action on page
- Default: bg-blue-500, white text
- Hover: bg-blue-600, shadow elevation
- Focus: 2px focus-visible ring, outline-offset 2px
- Active: scale-95, bg-blue-700
- Disabled: opacity-50, cursor-not-allowed

**Secondary Button**
- Purpose: Alternative action
- Default: bg-gray-200, gray-900 text
- Hover: bg-gray-300
- Focus: 2px focus-visible ring with gray-400 color
- Active: scale-95, bg-gray-400
- Disabled: opacity-50

**Tertiary/Ghost Button**
- Purpose: De-emphasized action
- Default: text-color only, no background
- Hover: subtle background (5-10% opacity)
- Focus: ring outline, high contrast
- Active: darker background
- Disabled: opacity-50, no hover effect

**Destructive Button**
- Purpose: Dangerous actions (delete, remove, etc.)
- Default: bg-red-600, white text
- Hover: bg-red-700, elevated shadow
- Focus: red-300 ring indicator
- Active: scale-95, darker red
- Disabled: opacity-50

**Icon Button**
- Default: p-2, rounded-full
- Icon size: 1.25em (relative to font-size)
- Hover: subtle background change
- Focus: ring with clear visibility
- Min size: 44x44px (WCAG touch target)

**Icon + Text Button**
- Icon size: 1.25em or smaller
- Gap between icon and text: 0.5rem (8px)
- Maintains 44x44px touch target
- Focus ring around entire button

**Loading State Button**
- Show spinner (16-20px size)
- Disable interaction: pointer-events-none
- Update text: "Loading...", "Saving...", etc.
- Disable related forms during loading

### Button Sizing Guide

| Size | Padding | Font Size | Min Height | Use Case |
|------|---------|-----------|-----------|----------|
| Small (sm) | 6px 12px | 14px | 32px | Compact layouts, secondary actions |
| Medium (md) | 8px 16px | 16px | 44px | Default button, mobile friendly |
| Large (lg) | 10px 20px | 18px | 48px | Primary CTA, hero sections |
| Extra Large (xl) | 12px 24px | 20px | 56px | Large touch targets, accessibility |

### Touch Target Minimums

- **WCAG AA**: 44x44 CSS pixels minimum
- **WCAG AAA**: 44x44 CSS pixels
- **iOS/Android HIG**: 44x48 points minimum
- **Apple Guidelines**: 44x44 points preferred
- **Mobile optimized**: 48x48 minimum for primary actions

---

## Card Component Patterns

### Card Anatomy

```
┌─────────────────────────────────┐
│ Header (optional metadata)      │ ← Tag, date, status badge
├─────────────────────────────────┤
│                                 │
│ Media (optional)                │ ← Image, video, icon
│                                 │
├─────────────────────────────────┤
│ Title                           │ ← Main heading
│ Description/Body                │ ← Content area
│                                 │
├─────────────────────────────────┤
│ Footer/Actions                  │ ← Buttons, links, metadata
└─────────────────────────────────┘
```

### Card Type Specifications

**Basic Content Card**
- Default: white bg, light gray border, subtle shadow
- Hover: shadow elevation (md → lg), border accent color
- Focus-within: 2px ring around entire card
- Use: Information display, blog posts, content blocks

**Interactive/Clickable Card**
- Role: button element
- Default: pointer cursor, border-2
- Hover: shadow md, border color shift, subtle lift (transform: translateY(-2px))
- Active: shadow sm, scale-98, no transform
- Focus-visible: ring-2 with inset style
- Use: Selectable items, navigation, list items

**Media Card**
- Structure: image-first, then content
- Image height: 180-240px recommended
- Image overflow: hidden to match border radius
- Hover: image slight zoom (scale-105)
- Focus-within: ring on entire card
- Use: Blog posts, product cards, gallery items

**Product/E-commerce Card**
- Includes: image, title, price, rating, add-to-cart
- Price highlight: primary color, bold weight
- Rating: star system, numeric display
- CTA: obvious button placement
- Use: Shopping, product listings

**Dashboard/Stat Card**
- Compact layout: icon + number + label
- Number size: 28-32px, bold
- Icon size: 32-48px
- Trend indicator: arrow, color coding (green/red)
- Use: KPIs, analytics, metrics

### Card State Transitions

```css
/* Base card styles */
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Hover elevation */
.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

/* Keyboard focus */
.card:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Interactive card pressed */
.card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Loading state */
.card.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Error state */
.card.error {
  border-color: var(--color-error);
  background: rgba(220, 38, 38, 0.05);
}
```

### Card Grid Responsive Patterns

```jsx
{/* Single Column → 2 Column → 3 Column */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>

{/* Masonry layout for varying heights */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>

{/* Horizontal scroll (mobile) */}
<div className="overflow-x-auto scroll-smooth">
  <div className="flex gap-4 pb-4">
    {cards.map(card => <Card key={card.id} className="flex-shrink-0 w-80" {...card} />)}
  </div>
</div>
```

---

## Modal/Dialog Patterns

### Modal Types & Use Cases

| Type | Use Case | Overlay | Width | Behavior |
|------|----------|---------|-------|----------|
| Alert Dialog | Confirmation, warnings | Yes (dark) | 400px | Auto-focus button |
| Form Modal | Data entry, settings | Yes | 500px | Focus first input |
| Full-Screen | Mobile, complex content | No | 100vw | Bottom sheet behavior |
| Side Sheet | Navigation, filters | Semi | 360px | Slide from right/left |
| Confirmation | Yes/No decisions | Yes | 360px | Destructive warning |
| Lightbox | Images, media | Dark overlay | 90vw | Full-screen media |

### Modal Component Structure

```jsx
<dialog
  ref={dialogRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  className="rounded-lg shadow-xl max-w-md p-6 backdrop:bg-black/50"
>
  {/* Header with title and close button */}
  <div className="flex items-start justify-between mb-4">
    <h2 id="dialog-title" className="text-lg font-bold">
      Dialog Title
    </h2>
    <button
      aria-label="Close dialog"
      className="p-1 hover:bg-gray-200 focus-visible:ring-2"
      onClick={handleClose}
    >
      ✕
    </button>
  </div>

  {/* Main content area with scrolling support */}
  <div
    id="dialog-description"
    className="mb-6 max-h-[60vh] overflow-y-auto"
  >
    Modal content here...
  </div>

  {/* Footer with action buttons */}
  <div className="flex gap-3 justify-end">
    <button className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
      Cancel
    </button>
    <button 
      autoFocus
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Confirm
    </button>
  </div>
</dialog>
```

### Focus Trap Implementation

```javascript
// Essential for custom modals without native <dialog>
function implementFocusTrap(modalElement) {
  // Get all focusable elements
  const focusableSelector = `
    button:not([disabled]),
    [href]:not([tabindex="-1"]),
    input:not([disabled]),
    select:not([disabled]),
    textarea:not([disabled]),
    [tabindex]:not([tabindex="-1"])
  `;
  
  const focusableElements = modalElement.querySelectorAll(focusableSelector);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Tab key wrapping
  modalElement.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift+Tab: backward navigation
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: forward navigation
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });

  // Escape key to close
  modalElement.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && event.target === modalElement) {
      closeModal(modalElement);
    }
  });

  // Move focus to first element
  firstElement?.focus();

  return {
    destroy: () => {
      // Cleanup event listeners if needed
    }
  };
}
```

### Modal Animations

```css
/* Fade + Scale entrance */
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

dialog[open] {
  animation: modalEnter 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Fade out backdrop */
dialog[open]::backdrop {
  animation: fadeIn 300ms;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  dialog[open] {
    animation: none;
  }
  dialog[open]::backdrop {
    animation: none;
  }
}
```

### Mobile Bottom Sheet Pattern

```jsx
<dialog
  className="
    fixed bottom-0 left-0 right-0 rounded-t-2xl p-6
    sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg
    max-h-[80vh] sm:max-h-[90vh] overflow-y-auto
    m-0 backdrop:bg-black/50
  "
>
  {/* Drag handle for mobile */}
  <div className="flex justify-center mb-4 sm:hidden">
    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
  </div>
  {/* Content */}
</dialog>
```

---

## Navigation Patterns

### Navigation Types & Keyboard Support

| Type | Desktop | Mobile | Keyboard | Use Case |
|------|---------|--------|----------|----------|
| Top Navigation | Horizontal bar | Hamburger menu | Tab + arrows | Primary site nav |
| Side Navigation | Vertical sidebar | Drawer | Tab + arrows | App navigation |
| Bottom Navigation | Rare | Tab bar | Tab + arrows | Mobile apps |
| Breadcrumbs | Left-aligned | Collapsed | Tab + Enter | Page hierarchy |
| Tabs | Horizontal | Scrollable | Tab + arrows | Content sections |
| Pagination | Bottom aligned | Stacked | Tab + Enter | Page browsing |

### Keyboard Navigation Implementation

```jsx
// Roving tabindex pattern
function RovingTabindexNav({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const handleKeyDown = (event) => {
    const { key } = event;
    let newIndex = activeIndex;
    let handled = false;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (activeIndex + 1) % items.length;
        handled = true;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (activeIndex - 1 + items.length) % items.length;
        handled = true;
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = items.length - 1;
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
      setActiveIndex(newIndex);
      // Move focus to new element
      containerRef.current?.children[newIndex]?.focus();
    }
  };

  return (
    <nav ref={containerRef} role="menubar" onKeyDown={handleKeyDown}>
      {items.map((item, idx) => (
        <button
          key={idx}
          role="menuitem"
          tabIndex={activeIndex === idx ? 0 : -1}
          onClick={() => setActiveIndex(idx)}
          aria-current={activeIndex === idx ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```

### aria-current Patterns

```jsx
{/* Current page in navigation */}
<a href="/about" aria-current="page">
  About
</a>

{/* Breadcrumb current */}
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Product Name</li>
  </ol>
</nav>

{/* Step indicator */}
<div role="progressbar" aria-valuenow="2" aria-valuemin="1" aria-valuemax="4">
  <span aria-current="step">Step 2: Shipping</span>
</div>
```

---

## State Design System

### Design Token Structure

```javascript
// Core color tokens
{
  colors: {
    // Primitive colors (brand colors)
    primary: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      900: '#0C2D78',
    },
    
    // Semantic colors
    success: '#16A34A',
    error: '#DC2626',
    warning: '#D97706',
    info: '#0284C7',
    
    // Neutral/grayscale
    gray: {
      50: '#F9FAFB',
      200: '#E5E7EB',
      500: '#6B7280',
      900: '#111827',
    },
  },
  
  // Interaction tokens
  transitions: {
    fast: {
      duration: '150ms',
      timing: 'cubic-bezier(0.4, 0, 1, 1)',
    },
    normal: {
      duration: '250ms',
      timing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    slow: {
      duration: '350ms',
      timing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  // Shadow elevations
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
}
```

### CSS Variables Implementation

```css
:root {
  /* Semantic color tokens */
  --color-primary: #3B82F6;
  --color-primary-light: #60A5FA;
  --color-primary-dark: #1D4ED8;
  --color-error: #DC2626;
  --color-success: #16A34A;
  --color-warning: #D97706;
  
  /* State-specific colors */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-disabled: rgba(107, 114, 128, 0.5);
  
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F3F4F6;
  
  --color-border: #E5E7EB;
  --color-border-focus: var(--color-primary);
  
  /* State layer opacities (Material Design 3) */
  --state-hover: 0.08;
  --state-focus: 0.12;
  --state-active: 0.12;
  --state-disabled: 0.38;
  
  /* Motion/timing */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Focus indicator */
  --focus-ring-width: 2px;
  --focus-ring-color: var(--color-primary);
  --focus-ring-offset: 2px;
}

/* Dark mode adaptation */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60A5FA;
    --color-primary-light: #93C5FD;
    --color-primary-dark: #1D4ED8;
    
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #D1D5DB;
    --color-text-disabled: rgba(209, 213, 219, 0.5);
    
    --color-bg-primary: #111827;
    --color-bg-secondary: #1F2937;
    --color-bg-tertiary: #374151;
    
    --color-border: #4B5563;
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  :root {
    --focus-ring-width: 3px;
  }
}
```

---

## Accessibility Deep Dive

### WCAG 2.2 AA Compliance Checklist

#### 2.4 Navigable

- **2.4.1 Bypass Blocks**: Provide skip links to main content
- **2.4.2 Page Titled**: Every page has descriptive title
- **2.4.3 Focus Order**: Tab order matches logical visual flow
- **2.4.7 Focus Visible**: 2px+ visible focus indicator for keyboard
- **2.4.11 Focus Not Obscured**: Focus indicator not hidden by content

#### 2.5 Input Modalities

- **2.5.1 Pointer Gestures**: Alternatives to complex gestures
- **2.5.2 Pointer Cancellation**: No traps on pointer down; can undo
- **2.5.5 Target Size**: ≥44x44 CSS pixels for UI components
- **2.5.8 Target Size (Min)**: At least 24x24 CSS pixels for AAA

#### 3.2 Predictable

- **3.2.1 On Focus**: No unexpected context changes on focus
- **3.2.2 On Input**: Only changes from explicit user input
- **3.2.4 Consistent Identification**: Components identified consistently
- **3.3.4 Error Prevention**: Confirmation for legal/financial actions

### Focus Management Best Practices

```jsx
// Save and restore focus on modal
function useModalFocus(isOpen) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement;
      
      // Move focus to modal
      dialogRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous focus
      previousFocusRef.current?.focus();
      
      // Restore scroll
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return { dialogRef, previousFocusRef };
}
```

### Color Contrast Requirements (WCAG AA)

| Component Type | Minimum Ratio | Example |
|---|---|---|
| Body text (normal) | 4.5:1 | Black on white ✓ |
| Large text (18px+) | 3:1 | Dark gray on white ✓ |
| UI components | 3:1 | Blue button text |
| Disabled buttons | N/A | Special handling |
| Focus indicator | 3:1 | Ring against background |

### Testing Color Contrast

```jsx
// Use contrast checking tools
// WebAIM: https://webaim.org/resources/contrastchecker/
// Lighthouse: Built into Chrome DevTools
// axe DevTools: Free browser extension

// Verify in code
const contrastRatio = calculateContrast(foreground, background);
console.assert(contrastRatio >= 4.5, 'Insufficient contrast');
```

---

## Implementation Framework

### Tailwind CSS State Variants (2024-2025)

```jsx
<button className="
  /* Base styles */
  px-4 py-2 rounded-md font-medium bg-blue-500 text-white
  
  /* Hover state (mouse only) */
  hover:bg-blue-600 hover:shadow-md
  
  /* Focus state (all interaction methods) */
  focus:outline-none
  
  /* Focus-visible (keyboard only) */
  focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2
  
  /* Active state (during press) */
  active:bg-blue-700 active:scale-95
  
  /* Disabled state */
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500
  
  /* Dark mode */
  dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus-visible:ring-blue-400
  
  /* High contrast mode */
  contrast-more:ring-4 contrast-more:ring-offset-4
  
  /* Reduced motion */
  motion-reduce:transition-none
  
  /* Transitions */
  transition-all duration-200 ease-out
" />
```

### React Patterns for Component State Management

```jsx
// Controlled button state
function Button({ disabled = false, loading = false, onClick, ...props }) {
  const [isActive, setIsActive] = useState(false);

  const handleMouseDown = () => setIsActive(true);
  const handleMouseUp = () => setIsActive(false);
  const handleClick = (e) => {
    if (!disabled && !loading) {
      onClick?.(e);
    }
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      aria-busy={loading}
      {...props}
    />
  );
}

// Form field with error state
function FormField({ label, error, value, onChange, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## Testing & Quality Assurance

### Automated Testing Checklist

- [ ] **Axe DevTools**: Zero accessibility violations
- [ ] **Lighthouse**: 90+ accessibility score
- [ ] **WAVE**: No errors or contrast issues
- [ ] **Contrast Checker**: All text 4.5:1 or 3:1 ratio
- [ ] **Focus Order**: Tab order matches visual hierarchy
- [ ] **Keyboard Navigation**: All functionality accessible via keyboard
- [ ] **Screen Reader**: Tested with NVDA, JAWS, or VoiceOver

### Manual Testing Procedures

```
1. Keyboard-Only Navigation
   - Tab through all interactive elements
   - Shift+Tab for backward navigation
   - Enter/Space for button activation
   - Escape for modal closure
   - Arrow keys for menu navigation

2. Focus Indicator Visibility
   - Zoom to 200% and verify focus rings visible
   - Test in high contrast mode
   - Check dark mode focus colors
   - Verify outline-offset spacing

3. Screen Reader Testing (30 minutes)
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify ARIA labels announce correctly
   - Check button/link semantics
   - Verify error messages announced
   - Test form field associations

4. Mobile Testing
   - Test touch target sizes (≥44x44px)
   - Verify pinch-zoom functionality
   - Test on actual devices (not just browser emulation)
   - Check landscape/portrait modes

5. Responsive Testing
   - Test all breakpoints: 320px, 768px, 1024px, 1440px
   - Verify focus styles consistent across sizes
   - Check touch targets on mobile
```

### Performance Considerations

```css
/* Reduce repaints with will-change */
button:hover {
  will-change: background-color, box-shadow;
}

/* After transition, remove will-change */
button {
  will-change: auto;
  transition: background-color var(--duration-normal), 
              box-shadow var(--duration-normal);
}

/* Use transform for animations (GPU accelerated) */
.card:hover {
  transform: translateY(-2px);  /* Fast */
  /* NOT: margin-top: -2px; */  /* Slow - causes reflow */
}

/* Debounce resize listeners */
window.addEventListener('resize', debounce(() => {
  // Update component sizes
}, 300));
```

---

## Quick Reference Tables

### State Color Tokens

| State | Light Mode | Dark Mode | Opacity |
|-------|-----------|-----------|---------|
| Hover | #E5E7EB | #4B5563 | 0.08 |
| Focus | #DBEAFE | #1E40AF | 0.12 |
| Active | #BFDBFE | #1E3A8A | 0.12 |
| Disabled | #D1D5DB | #6B7280 | 0.38 |

### Timing Values (ms)

| Duration | Use Case |
|----------|----------|
| 150ms | Fast feedback (hover) |
| 250ms | Standard interaction (focus) |
| 350ms | Slow motion (complex animation) |
| 0ms | prefers-reduced-motion mode |

### Common Measurements (px)

| Element | Size | Rationale |
|---------|------|-----------|
| Touch target | 44x44 | WCAG AA minimum |
| Focus ring | 2px | WCAG AA minimum |
| Button padding | 8-16px | Visual hierarchy |
| Icon size | 18-24px | Readable at distance |
| Card spacing | 16-24px | Whitespace balance |

---

## References & Resources

### W3C & Standards
- WCAG 2.2 AA Specification: https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- HTML Semantics: https://html.spec.whatwg.org/

### Design Systems
- Material Design 3: https://m3.material.io/
- Fluent Design System: https://fluent2.microsoft.design/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

### Component Libraries
- Radix UI: https://www.radix-ui.com/
- shadcn/ui: https://ui.shadcn.com/
- Headless UI: https://headlessui.com/
- Chakra UI: https://chakra-ui.com/

### Testing Tools
- NVDA Screen Reader: https://www.nvaccess.org/
- axe DevTools: https://www.deque.com/axe/devtools/
- WebAIM Contrast: https://webaim.org/resources/contrastchecker/
- Lighthouse: Built into Chrome DevTools
