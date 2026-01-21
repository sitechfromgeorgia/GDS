---
name: building-accessible-ui-components
description: Designs professional UI components with complete state matrices, accessibility patterns, and implementation best practices for modern web applications. Use when building buttons, cards, modals, navigation, and interactive components; implementing WCAG 2.2 AA compliance; managing focus states and keyboard navigation; or creating component design systems.
---

# Building Accessible UI Components with Modern Design Patterns

## Quick Start

Reference these core patterns when building interactive components:

**Button Template (All States):**
```jsx
// Primary button with complete state coverage
<button 
  className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none active:scale-95 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-standard px-4 py-2 rounded-md font-medium"
  aria-label="Action label"
>
  Click me
</button>
```

**Card Component (Hover + Focus):**
```jsx
<div 
  className="p-4 rounded-lg bg-white border border-gray-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300"
  role="article"
>
  <h3 className="font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600">Content here</p>
</div>
```

**Modal with Focus Trap (WCAG Compliant):**
```jsx
<dialog 
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  className="rounded-lg p-6 backdrop:bg-black/50"
>
  <h2 id="dialog-title" className="text-lg font-bold mb-4">Dialog Title</h2>
  <p className="mb-6">Dialog content with focus trap.</p>
  <button 
    autofocus
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    onClick={(e) => e.currentTarget.closest('dialog')?.close()}
  >
    Close
  </button>
</dialog>
```

## When to Use This Skill

- **Building design systems**: Creating reusable component libraries with consistent state handling
- **Implementing accessibility**: Meeting WCAG 2.2 AA compliance with proper focus management and keyboard navigation
- **State design tokens**: Designing semantic color tokens for disabled, hover, focus, active, and error states
- **Component libraries**: Building with Radix UI, shadcn/ui, Material Design 3, or custom component frameworks
- **Focus management**: Implementing focus traps in modals, managing keyboard Tab order, and ensuring focus indicators
- **Dark mode support**: Managing state colors across light and dark themes with CSS custom properties
- **Responsive interactions**: Creating touch-friendly targets and mobile-specific state patterns

## Core State Design System

Every interactive component needs a complete state matrix:

### Universal Component States

| State | Definition | Visual Change | Keyboard Trigger | When Used |
|-------|-----------|---------------|------------------|-----------|
| **Default/Enabled** | Component ready for interaction | Standard styling | N/A | Component loads |
| **Hover** | User cursor over element | Subtle background/shadow shift | N/A | Mouse only |
| **Focus** | Element receives keyboard focus | Ring indicator (2-3px), high contrast | Tab key or programmatic focus() | Keyboard navigation |
| **Focus-Visible** | Keyboard focus (not mouse click) | Visible focus ring | Tab/Shift+Tab | Keyboard users |
| **Active/Pressed** | User currently pressing element | Scale-down (95%), darker shade, shorter duration | Enter/Space | During interaction |
| **Disabled** | Component cannot be interacted with | 50% opacity, gray text, cursor:not-allowed | No interaction possible | Condition not met |
| **Loading** | Async operation in progress | Spinner overlay, text changes, disabled state | Tab still accessible, announced | Request pending |
| **Error** | Validation or operation failed | Red border/text, error message, aria-invalid | Tab accessible, announced | Error condition |
| **Success** | Operation completed successfully | Green indicator, checkmark, optional toast | Tab accessible, announced | Post-action |

### Material Design 3 State Layers (Reference)

Material Design 3 uses opacity-based state layers:

```css
/* State layer approach with opacity */
:root {
  --state-layer-hover: 0.08;      /* 8% opacity overlay */
  --state-layer-focus: 0.12;      /* 12% opacity overlay */
  --state-layer-active: 0.12;     /* 12% opacity overlay */
  --state-layer-disabled: 0.38;   /* 38% opacity for disabled */
}

button:hover {
  background-color: rgba(var(--color-primary-rgb), var(--state-layer-hover));
}

button:focus-visible {
  background-color: rgba(var(--color-primary-rgb), var(--state-layer-focus));
  outline: 2px solid currentColor;
}

button:disabled {
  opacity: var(--state-layer-disabled);
  cursor: not-allowed;
}
```

## Button Design Patterns (Complete Matrix)

### Button Types & Variants

**Primary Button (Action-focused)**
```jsx
<button className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-95 disabled:opacity-50 transition-all">
  Primary Action
</button>
```

**Secondary Button (Alternative action)**
```jsx
<button className="bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 active:scale-95 disabled:opacity-50 transition-all">
  Secondary
</button>
```

**Tertiary/Ghost Button (De-emphasized)**
```jsx
<button className="text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-100 disabled:opacity-50 transition-all">
  Tertiary
</button>
```

**Destructive Button (Danger action)**
```jsx
<button className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-300 active:scale-95 disabled:opacity-50 transition-all">
  Delete
</button>
```

**Icon Button**
```jsx
<button 
  className="p-2 rounded-full hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95"
  aria-label="Close dialog"
>
  <CloseIcon />
</button>
```

**Icon + Text Button**
```jsx
<button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300">
  <SendIcon size={18} />
  Send Message
</button>
```

**Loading State Button**
```jsx
<button 
  disabled={isLoading}
  className="relative px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-75 transition-all"
>
  {isLoading ? (
    <>
      <Spinner size={16} className="inline mr-2" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

### Button Sizing & Touch Targets

```css
/* Size Variants with proper touch targets */
.btn-sm {
  padding: 0.375rem 0.75rem;    /* 6px 12px */
  font-size: 0.875rem;           /* 14px */
  min-height: 32px;              /* Touch minimum */
}

.btn-md {
  padding: 0.5rem 1rem;          /* 8px 16px */
  font-size: 1rem;               /* 16px */
  min-height: 44px;              /* Mobile touch target (WCAG) */
}

.btn-lg {
  padding: 0.625rem 1.25rem;    /* 10px 20px */
  font-size: 1.125rem;           /* 18px */
  min-height: 48px;              /* Accessible touch minimum */
}

.btn-xl {
  padding: 0.75rem 1.5rem;      /* 12px 24px */
  font-size: 1.25rem;            /* 20px */
  min-height: 56px;              /* Large touch target */
}

/* Icon sizing relative to text */
.btn button svg {
  width: 1.25em;                 /* 20px at 16px font */
  height: 1.25em;
}

.btn-sm svg {
  width: 1em;                    /* 14px at 14px font */
  height: 1em;
}
```

## Card Component Patterns

### Card Types & State Matrix

**Basic Content Card:**
```jsx
<div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-300">
  <h3 className="font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600 mb-4">Card description or content</p>
  <button>Learn More</button>
</div>
```

**Interactive/Clickable Card:**
```jsx
<button 
  className="w-full p-4 bg-white border border-gray-200 rounded-lg text-left hover:shadow-md hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset active:shadow-none active:scale-98 transition-all duration-200"
  onClick={handleClick}
>
  <h3 className="font-semibold">Clickable Card</h3>
  <p className="text-gray-600">Click to navigate</p>
</button>
```

**Media Card (Image):**
```jsx
<div className="overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-300">
  <img src="image.jpg" alt="Card image" className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="font-semibold mb-2">Card Title</h3>
    <p className="text-gray-600 text-sm mb-4">Description</p>
    <a href="#" className="text-blue-600 hover:underline focus-visible:outline outline-2 outline-blue-500">
      Read More →
    </a>
  </div>
</div>
```

**Hover + Elevation Transition:**
```css
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);  /* base shadow */
  transition: all var(--duration-normal) var(--ease-standard);
}

.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);  /* elevated shadow */
  transform: translateY(-2px);                    /* subtle lift */
  border-color: var(--color-primary);
}

.card:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Card Responsive Grid

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4">
  {/* Cards auto-flow with responsive columns */}
</div>
```

## Modal/Dialog Accessibility Patterns

### Modal Structure (WCAG 2.2 Compliant)

```jsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      dialogRef.current?.showModal?.();
      document.body.classList.add('modal-open');
    }
  }, [isOpen]);

  const handleClose = () => {
    dialogRef.current?.close?.();
    document.body.classList.remove('modal-open');
    previousFocusRef.current?.focus();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onCancel={handleClose}
      className="rounded-lg shadow-xl max-w-md w-full p-6 backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="modal-title" className="text-lg font-bold">
          {title}
        </h2>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>
      
      <div id="modal-description" className="text-gray-600 mb-6">
        {children}
      </div>
      
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            // Handle action
            handleClose();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Confirm
        </button>
      </div>
    </dialog>
  );
}
```

### Focus Trap Implementation (For Custom Modals)

```javascript
function createFocusTrap(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  modalElement.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab: go backward
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: go forward
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });

  // Close on Escape
  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalElement.close?.();
    }
  });

  // Set initial focus
  firstElement?.focus();
}
```

### Required ARIA Attributes

```jsx
{/* Dialog with proper ARIA setup */}
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"              // Title element ID
  aria-describedby="dialog-description"       // Description ID
  aria-label="Alternative if no title"        // Or use aria-labelledby
>
  <h2 id="dialog-title">Modal Title</h2>
  <p id="dialog-description">Modal description text.</p>
  {/* Make background inert when modal open */}
  <div aria-hidden="true" inert>Background content</div>
</div>
```

## Navigation & Focus Management Patterns

### Navigation States (Keyboard + Screen Reader)

```jsx
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a
        href="/home"
        aria-current="page"  // For current page link
        className="px-4 py-2 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Home
      </a>
    </li>
    <li role="none">
      <a
        href="/about"
        className="px-4 py-2 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        About
      </a>
    </li>
  </ul>
</nav>
```

### Breadcrumb Navigation

```jsx
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2">
    <li>
      <a href="/" className="text-blue-600 hover:underline">
        Home
      </a>
    </li>
    <li aria-current="page" className="text-gray-600">
      Current Page
    </li>
  </ol>
</nav>
```

### Roving Tabindex (Arrow Key Navigation)

```jsx
function RovingTabindex() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    const items = containerRef.current.querySelectorAll('[role="menuitem"]');
    let newIndex = activeIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = (activeIndex + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = (activeIndex - 1 + items.length) % items.length;
    }

    setActiveIndex(newIndex);
    items[newIndex].focus();
  };

  return (
    <ul
      ref={containerRef}
      role="menubar"
      onKeyDown={handleKeyDown}
    >
      {items.map((item, idx) => (
        <li key={idx}>
          <button
            role="menuitem"
            tabIndex={activeIndex === idx ? 0 : -1}
            onClick={() => setActiveIndex(idx)}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## Focus Indicator Best Practices

### WCAG 2.2 Focus Requirements

```css
/* Minimum 2px visible focus indicator - WCAG 2.4.11 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;  /* Space between element and ring */
}

/* Dark mode adaptation */
@media (prefers-color-scheme: dark) {
  :focus-visible {
    outline-color: var(--color-primary-light);  /* Higher contrast */
  }
}

/* Ensure focus indicator not obscured by other elements */
button:focus-visible {
  z-index: 10;  /* Bring to front if needed */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);  /* Additional ring */
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  :focus-visible {
    outline-width: 3px;  /* Thicker for visibility */
  }
}
```

### Reduced Motion Support

```css
/* Respect user's motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Apply cautiously in components */
button {
  transition: all var(--duration-normal) var(--ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;  /* Remove transitions */
  }
}
```

## State Design Tokens (CSS Variables)

### Comprehensive Token System

```css
:root {
  /* Color Primitives */
  --color-primary: #3B82F6;
  --color-primary-rgb: 59, 130, 246;  /* For rgba() */
  --color-error: #DC2626;
  --color-success: #16A34A;
  --color-warning: #D97706;
  
  /* State Colors */
  --color-hover-overlay: rgba(0, 0, 0, 0.08);
  --color-focus-ring: rgba(59, 130, 246, 0.5);
  --color-active-overlay: rgba(0, 0, 0, 0.12);
  --color-disabled: rgba(0, 0, 0, 0.38);
  
  /* Interaction Timing */
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
  
  /* Focus Indicator */
  --focus-ring: 2px solid var(--color-primary);
  --focus-ring-offset: 2px;
}

/* Dark Mode Adaptation */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60A5FA;  /* Lighter for contrast */
    --color-focus-ring: rgba(96, 165, 250, 0.5);
  }
}
```

## Tailwind CSS State Patterns (2024-2025)

### Complete State Variant Usage

```jsx
{/* Button with all state variants */}
<button 
  className={`
    px-4 py-2 rounded-md font-medium
    bg-blue-500 text-white
    
    /* Hover State */
    hover:bg-blue-600 hover:shadow-md
    
    /* Focus State (both focus and focus-visible) */
    focus:outline-none
    focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2
    
    /* Active State (button press) */
    active:bg-blue-700 active:scale-95 active:shadow-sm
    
    /* Disabled State */
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500
    
    /* Transitions */
    transition-all duration-200 ease-out
    
    /* Dark Mode */
    dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus-visible:ring-blue-400
  `}
>
  Click me
</button>
```

### Form Input State Variants

```jsx
<input
  type="text"
  className={`
    w-full px-3 py-2 border rounded-md font-medium
    bg-white text-gray-900 border-gray-300
    
    /* Hover state (shows it's interactive) */
    hover:border-gray-400
    
    /* Focus state (keyboard navigation) */
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    
    /* Focus (both mouse and keyboard) */
    focus:border-blue-500
    
    /* Invalid state */
    aria-invalid:border-red-500 aria-invalid:text-red-600
    
    /* Disabled state */
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    
    /* Placeholder visibility */
    placeholder-gray-400
    
    /* Transitions */
    transition-colors duration-200
  `}
  placeholder="Enter text..."
  aria-label="Text input"
/>
```

### Group Hover & Focus-Within Patterns

```jsx
<div className="group p-4 border rounded-lg hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
  <h3 className="group-hover:text-blue-600">Title</h3>
  <a href="#" className="text-gray-500 group-hover:text-blue-600 group-focus-within:text-blue-600">
    Link appears on hover
  </a>
</div>
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **Focus indicator not visible** | Low contrast or missing outline | Use `outline: 2px solid` with high-contrast color; test with `prefers-contrast: more` |
| **Modal focus escapes** | Missing focus trap | Implement roving tabindex or use native `<dialog>` with `showModal()` |
| **Color-only state indication** | Fails for color-blind users | Add text, icons, or patterns in addition to color changes |
| **Buttons not 44x44px minimum** | Small touch target | Ensure `min-height: 44px` and `min-width: 44px` on mobile |
| **Disabled state too low contrast** | 38% opacity not enough | Combine opacity with color shift or add pattern |
| **Hover states only** | No focus state for keyboard | Always duplicate hover styles to focus/focus-visible |
| **State transitions too fast** | Jarring experience | Use 150-250ms transitions; respect prefers-reduced-motion |
| **Modal backdrop clickable** | Background remains interactive | Add `inert` attribute or `pointer-events: none` to background |
| **Focus trap creates keyboard trap** | Escape key not working | Always implement Escape key handler to close modals |
| **Incompatible ARIA roles** | Multiple role attributes | Use only one role; use aria-* attributes instead |

## Best Practices

### Do's ✓

- **Define state tokens first**: Establish consistent colors, timing, and spacing before building components
- **Test with keyboard**: Always test Tab, Shift+Tab, Enter, Space, and Escape keys
- **Use focus-visible, not focus**: `focus-visible` only shows ring for keyboard; `focus` applies to all
- **Provide 2-3px focus indicators**: Minimum WCAG requirement; test outline-offset for spacing
- **Respect prefers-reduced-motion**: Disable animations for users with vestibular disorders
- **Make disabled states obviously unavailable**: Combine opacity, color, and cursor changes
- **Test color contrast**: Ensure 4.5:1 ratio for text; 3:1 for UI components (WCAG AA)
- **Return focus after closing modals**: Always restore focus to trigger element
- **Use semantic HTML**: Buttons for actions, links for navigation, forms for data input
- **Test with screen readers**: NVDA (Windows), JAWS (paid), VoiceOver (Mac/iOS)

### Don'ts ✗

- **Don't rely only on color** to indicate state (fails for colorblind users)
- **Don't remove focus indicators** (accessibility violation for keyboard users)
- **Don't create keyboard traps** (focus that users can't escape from)
- **Don't disable state without clear reason** (test all state combinations)
- **Don't use positive tabindex values** (breaks Tab order; use only 0 or -1)
- **Don't hide labels** for form inputs even with placeholders
- **Don't forget dark mode** state color adjustments
- **Don't animate disabled states** (users can't interrupt animations)
- **Don't use pointer-events: none** alone (removes keyboard interaction too)
- **Don't skip testing with real users** with disabilities

## Accessibility Checklist

- [ ] All buttons have visible, 2-3px focus indicators
- [ ] Disabled buttons have 50%+ opacity change + cursor: not-allowed
- [ ] Modals trap focus (Tab stays inside) and close with Escape
- [ ] Focus returns to trigger element after modal closes
- [ ] Links vs buttons semantic use correct (href for nav, onClick for actions)
- [ ] Color contrast ≥4.5:1 for text, ≥3:1 for UI components (WCAG AA)
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have associated labels (htmlFor / id matching)
- [ ] Disabled inputs not in tab order (use disabled attribute, not aria-disabled)
- [ ] Error messages linked to inputs via aria-describedby
- [ ] Animations respect prefers-reduced-motion
- [ ] Keyboard navigation order matches visual layout
- [ ] Touch targets ≥44x44px on mobile devices
- [ ] Dark mode colors maintain accessibility contrast
- [ ] Tested with keyboard only (no mouse)
- [ ] Tested with screen reader (NVDA, VoiceOver, or JAWS)

## Code Examples

### React Hook + Accessible Form Input

```jsx
function AccessibleInput({ label, error, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-3 py-2 border rounded-md
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          transition-colors duration-200
        `}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Card Grid with Accessible Interaction

```jsx
function CardGrid({ items }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedId(item.id)}
          aria-pressed={selectedId === item.id}
          className={`
            p-6 rounded-lg text-left transition-all duration-300
            border-2 focus-visible:outline-none
            ${
              selectedId === item.id
                ? 'border-blue-500 shadow-lg bg-blue-50'
                : 'border-gray-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500'
            }
          `}
        >
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          <p className="text-gray-600">{item.description}</p>
        </button>
      ))}
    </div>
  );
}
```

### Custom Modal Component

```jsx
function Modal({ isOpen, title, children, onClose }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      dialogRef.current?.showModal();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    previousFocusRef.current?.focus();
    onClose();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleClose}
      className="rounded-lg p-6 max-w-md shadow-xl backdrop:bg-black/50 open:flex open:flex-col"
    >
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div className="flex-1 mb-6">{children}</div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={handleClose}
          autoFocus
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Confirm
        </button>
      </div>
    </dialog>
  );
}
```

## References

### Official Documentation
- **WCAG 2.2 AA Compliance**: https://www.w3.org/WAI/WCAG22/quickref/
- **Material Design 3 States**: https://m3.material.io/foundations/interaction/states
- **Radix UI Components**: https://www.radix-ui.com/themes/docs
- **shadcn/ui Patterns**: https://www.shadcn.io/patterns
- **Web Accessibility Initiative (WAI)**: https://www.w3.org/WAI/
- **Keyboard Interface Design**: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/

### Accessibility Resources
- **WCAG 2.2 New Criteria**: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- **Focus Management**: https://www.w3.org/WAI/test-evaluate/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Headless UI Documentation**: https://headlessui.com/
- **a11y Project**: https://www.a11y-collective.com/

### Tools & Testing
- **NVDA Screen Reader**: https://www.nvaccess.org/ (free, Windows)
- **Lighthouse Accessibility**: Built into Chrome DevTools
- **axe DevTools Browser Extension**: https://www.deque.com/axe/devtools/
- **Hoverify State Testing**: https://tryhoverify.com/
- **Tailwind CSS Focus States**: https://tailwindcss.com/docs/hover-focus-and-other-states
