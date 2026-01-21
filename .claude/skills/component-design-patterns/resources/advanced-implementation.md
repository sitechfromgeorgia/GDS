# Advanced UI Component Implementation Reference (2024-2025)

## Table of Contents
1. [Complete State Matrix Examples](#complete-state-matrix-examples)
2. [ARIA Implementation Guide](#aria-implementation-guide)
3. [Advanced CSS Patterns](#advanced-css-patterns)
4. [React Hooks for UI State](#react-hooks-for-ui-state)
5. [Performance Optimization](#performance-optimization)
6. [Dark Mode & Theme Management](#dark-mode--theme-management)
7. [Animation Best Practices](#animation-best-practices)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Complete State Matrix Examples

### Button Component Full State Matrix

```jsx
<button
  type="button"
  disabled={isDisabled}
  aria-label={ariaLabel}
  aria-busy={isLoading}
  aria-pressed={isActive}
  className={`
    /* Base */
    relative inline-flex items-center justify-center
    px-4 py-2 rounded-md font-medium
    
    /* Color scheme */
    bg-blue-500 text-white
    
    /* Cursor state */
    cursor-pointer
    
    /* Hover */
    hover:bg-blue-600
    hover:shadow-md
    hover:no-underline
    
    /* Focus */
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-300
    focus-visible:ring-offset-2
    focus-visible:z-10
    
    /* Active/Pressed */
    active:bg-blue-700
    active:scale-95
    active:shadow-sm
    active:ring-0
    
    /* Disabled */
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:bg-blue-500
    disabled:hover:shadow-none
    
    /* Loading state (aria-busy) */
    aria-busy:pointer-events-none
    
    /* Transitions */
    transition-all
    duration-200
    ease-[cubic-bezier(0.16,1,0.3,1)]
    
    /* Dark mode */
    dark:bg-blue-600
    dark:hover:bg-blue-700
    dark:active:bg-blue-800
    dark:focus-visible:ring-blue-400
    
    /* High contrast */
    contrast-more:ring-4
    contrast-more:ring-offset-4
    
    /* Reduced motion */
    motion-reduce:transition-none
  `}
  onClick={handleClick}
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseLeave}
>
  {isLoading && <Spinner className="mr-2" />}
  {children}
</button>
```

### Modal Component Full State Matrix

```jsx
<dialog
  ref={dialogRef}
  open={isOpen}
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
  aria-hidden={!isOpen}
  className={`
    /* Base */
    fixed rounded-lg shadow-xl
    max-w-md w-full p-6 m-auto
    
    /* Dimensions */
    max-h-[80vh]
    overflow-y-auto
    
    /* Background */
    bg-white
    dark:bg-gray-900
    
    /* Backdrop */
    backdrop:bg-black/50
    backdrop:backdrop-blur-sm
    
    /* Focus state for dialog container */
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    
    /* Closed state */
    hidden
    opacity-0
    scale-95
    
    /* Open state */
    open:flex
    open:flex-col
    open:opacity-100
    open:scale-100
    
    /* Animations */
    transition-all
    duration-300
    ease-out
    
    /* Reduced motion */
    motion-reduce:transition-none
  `}
  onCancel={handleClose}
  onKeyDown={handleKeyDown}
>
  {/* Header */}
  <div className="flex items-start justify-between mb-4">
    <h2
      id="dialog-title"
      className="text-xl font-bold text-gray-900 dark:text-white"
    >
      {title}
    </h2>
    <button
      className="
        p-1 text-gray-500 rounded-md
        hover:bg-gray-200 hover:text-gray-700
        focus-visible:ring-2 focus-visible:ring-blue-500
        dark:hover:bg-gray-700 dark:hover:text-gray-200
        transition-colors duration-200
      "
      aria-label="Close dialog"
      onClick={handleClose}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  {/* Content */}
  <div
    id="dialog-desc"
    className="flex-1 mb-6 text-gray-600 dark:text-gray-400"
  >
    {children}
  </div>

  {/* Footer */}
  <div className="flex gap-3 justify-end">
    <button
      onClick={handleClose}
      className="
        px-4 py-2 rounded-md font-medium
        bg-gray-200 text-gray-900
        hover:bg-gray-300
        focus-visible:ring-2 focus-visible:ring-blue-500
        active:scale-95
        transition-all duration-200
        dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600
      "
    >
      Cancel
    </button>
    <button
      autoFocus
      onClick={handleConfirm}
      className="
        px-4 py-2 rounded-md font-medium
        bg-blue-600 text-white
        hover:bg-blue-700
        focus-visible:ring-2 focus-visible:ring-blue-400
        active:scale-95
        transition-all duration-200
        dark:bg-blue-700 dark:hover:bg-blue-800
      "
    >
      Confirm
    </button>
  </div>
</dialog>
```

### Card Component Full State Matrix

```jsx
<article
  role="article"
  className={`
    /* Base */
    rounded-lg overflow-hidden
    border border-gray-200
    dark:border-gray-700
    
    /* Sizing */
    h-full
    
    /* Shadows - base state */
    shadow-sm
    
    /* Hover state */
    hover:shadow-md
    hover:border-blue-300
    hover:dark:border-blue-600
    
    /* Focus state (for links/buttons within) */
    focus-within:ring-2
    focus-within:ring-blue-500
    focus-within:ring-inset
    
    /* Interactive states */
    hover:cursor-pointer
    active:shadow-sm
    active:scale-98
    
    /* Disabled state (if applicable) */
    aria-disabled:opacity-50
    aria-disabled:cursor-not-allowed
    aria-disabled:hover:shadow-sm
    aria-disabled:hover:border-gray-200
    
    /* Loading state */
    aria-busy:opacity-60
    aria-busy:pointer-events-none
    
    /* Transitions */
    transition-all
    duration-300
    ease-[cubic-bezier(0.16,1,0.3,1)]
    
    /* Dark mode */
    bg-white
    dark:bg-gray-900
    
    /* Reduced motion */
    motion-reduce:transition-none
  `}
  tabIndex="0"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  }}
  onClick={handleClick}
>
  {/* Image */}
  <img
    src={imageUrl}
    alt={imageAlt}
    className="
      w-full h-48 object-cover
      transition-transform duration-300
      group-hover:scale-105
    "
  />

  {/* Content */}
  <div className="p-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
      {description}
    </p>

    {/* Actions */}
    <div className="flex gap-2">
      <button
        className="
          flex-1 px-3 py-2 rounded-md text-sm font-medium
          bg-blue-600 text-white
          hover:bg-blue-700
          focus-visible:ring-2 focus-visible:ring-blue-400
          active:scale-95
          transition-all duration-200
        "
      >
        Action
      </button>
    </div>
  </div>
</article>
```

---

## ARIA Implementation Guide

### Essential ARIA Attributes for Components

#### Button Component

```jsx
<button
  // Role: implicit from <button>
  type="button"
  
  // Labeling: use aria-label for icon buttons
  aria-label="Close menu"
  
  // For toggle buttons: indicate pressed state
  aria-pressed={isActive}
  
  // For async operations: indicate loading
  aria-busy={isLoading}
  
  // For disabled state: browser-native disabled is preferred
  disabled={isDisabled}
  // aria-disabled: only if not using disabled attribute
  aria-disabled={isDisabled}
  
  // Describe controls
  aria-controls="menu-panel"
  
  // Expand/collapse controls
  aria-expanded={isExpanded}
>
  {children}
</button>
```

#### Modal/Dialog Component

```jsx
<dialog
  // Essential for all dialogs
  role="dialog"
  
  // Indicates browser trap won't happen (for custom dialogs)
  aria-modal="true"
  
  // Link to title element by ID
  aria-labelledby="dialog-title"
  
  // Link to description by ID
  aria-describedby="dialog-description"
  
  // Optional: override with label
  aria-label="Confirm action"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Dialog description text.</p>
</dialog>
```

#### Navigation Component

```jsx
<nav
  // Semantic landmark
  aria-label="Main navigation"
  // or
  aria-labelledby="nav-title"
>
  <ul role="menubar">
    <li role="none">
      <a
        href="/home"
        // Indicates current page
        aria-current="page"
      >
        Home
      </a>
    </li>
    <li role="none">
      <a href="/about">About</a>
    </li>
  </ul>
</nav>
```

#### Form Component with Error

```jsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    
    // Indicate invalid state
    aria-invalid={!!error}
    
    // Link error message to input
    aria-describedby={error ? "email-error" : undefined}
    
    // Required field indication
    required
    aria-required="true"
  />
  {error && (
    <p id="email-error" role="alert">
      {error}
    </p>
  )}
</div>
```

#### Card Component (Clickable)

```jsx
<div
  // Semantic: article for content cards
  role="article"
  
  // If clickable like a button
  role="button"
  tabIndex="0"
  
  // Indicate selected state for select cards
  aria-selected={isSelected}
  
  // For disabled cards
  aria-disabled={isDisabled}
  
  // Label if not obvious from content
  aria-label="Product card"
>
  {/* Content */}
</div>
```

### ARIA Roles to Avoid or Use Carefully

```jsx
{/* ❌ DON'T: Conflicting roles */}
<div role="button" role="link">  {/* Choose one */}

{/* ✅ DO: Use semantic HTML */}
<button>Click me</button>
<a href="/">Link</a>

{/* ❌ DON'T: Misuse tabindex */}
<div tabIndex="5">Not accessible</div>

{/* ✅ DO: Use 0 or -1 only */}
<div tabIndex="0" role="button">Keyboard accessible</div>

{/* ❌ DON'T: Use aria-disabled instead of disabled */}
<button aria-disabled="true">Still focusable</button>

{/* ✅ DO: Use disabled attribute */}
<button disabled>Not focusable</button>

{/* ❌ DON'T: Hide content with aria-hidden */}
<button aria-hidden="true">Click me</button>

{/* ✅ DO: Only hide decorative content */}
<div aria-hidden="true">🎨 Decorative icon</div>
```

---

## Advanced CSS Patterns

### State-Based Styling with CSS Attributes

```css
/* Use custom properties for state management */
:root {
  --state: default;  /* default | hover | focus | active | disabled | loading */
}

button {
  /* Conditionally apply styles based on state */
  background-color: var(--button-bg-default);
  color: var(--button-text-default);
  border: var(--button-border-default);
  opacity: var(--button-opacity-default);
  cursor: var(--button-cursor-default);
  
  transition: all var(--duration-normal) var(--ease-standard);
}

/* Apply state-specific variables */
button:hover {
  --button-bg-default: var(--button-bg-hover);
  --button-text-default: var(--button-text-hover);
  --button-border-default: var(--button-border-hover);
  --button-shadow: var(--shadow-md);
}

button:focus-visible {
  --button-outline: var(--focus-ring);
}

button:active {
  --button-bg-default: var(--button-bg-active);
  --button-shadow: var(--shadow-sm);
}

button:disabled {
  --button-opacity-default: 0.5;
  --button-cursor-default: not-allowed;
}
```

### CSS Containment for Performance

```css
/* Isolate component styles to prevent layout shifts */
.card {
  contain: layout style paint;
}

.button {
  contain: paint;  /* Lighter containment for interactive elements */
}

.modal-backdrop {
  contain: layout style;  /* Don't contain paint if backdrop needs effects */
}
```

### Focus Visible with Fallback

```css
/* Modern approach: focus-visible */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Fallback for older browsers */
button:focus {
  outline: 2px solid var(--color-primary);
}

/* Remove outline for mouse click (still have ring) */
button:focus:not(:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### Media Query Combinations

```css
/* Intersection of high contrast + dark mode */
@media (prefers-color-scheme: dark) and (prefers-contrast: more) {
  button:focus-visible {
    outline-width: 3px;
    outline-color: var(--color-primary-light);
  }
}

/* Reduced motion + reduced transparency */
@media (prefers-reduced-motion: reduce) and (prefers-reduced-data: reduce) {
  button {
    animation: none;
    transition: none;
    background-image: none;  /* Avoid animated gradients */
  }
}

/* Touch device optimization */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 48px;  /* Larger for touch */
    min-width: 48px;
  }
}
```

---

## React Hooks for UI State

### useButtonState Hook

```jsx
function useButtonState(initialState = 'idle') {
  const [state, setState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsync = useCallback(async (asyncFn) => {
    setIsLoading(true);
    setError(null);
    try {
      await asyncFn();
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setError(err.message);
      setState('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    state,
    isLoading,
    error,
    handleAsync,
    reset: () => {
      setState('idle');
      setError(null);
    },
  };
}

// Usage
function MyButton() {
  const { state, isLoading, error, handleAsync } = useButtonState();

  return (
    <>
      <button
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={() => handleAsync(async () => {
          await fetch('/api/action');
        })}
      >
        {isLoading ? 'Loading...' : 'Click me'}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
```

### useFocusManager Hook

```jsx
function useFocusManager() {
  const elementRef = useRef(null);
  const previousFocusRef = useRef(null);

  const savePreviousFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  const moveFocusTo = useCallback((element) => {
    element?.focus();
  }, []);

  const restorePreviousFocus = useCallback(() => {
    previousFocusRef.current?.focus?.();
  }, []);

  const moveFocusToStart = useCallback(() => {
    const focusable = elementRef.current?.querySelector(
      'button:not([disabled]), [href], input:not([disabled])'
    );
    focusable?.focus();
  }, []);

  return {
    elementRef,
    savePreviousFocus,
    moveFocusTo,
    restorePreviousFocus,
    moveFocusToStart,
  };
}

// Usage
function Modal({ isOpen, onClose }) {
  const focus = useFocusManager();

  useEffect(() => {
    if (isOpen) {
      focus.savePreviousFocus();
      focus.moveFocusToStart();
    } else {
      focus.restorePreviousFocus();
    }
  }, [isOpen, focus]);

  return (
    <dialog ref={focus.elementRef} open={isOpen}>
      {/* Modal content */}
    </dialog>
  );
}
```

### useCardState Hook

```jsx
function useCardState(initialSelected = false) {
  const [isSelected, setIsSelected] = useState(initialSelected);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsSelected(!isSelected);
    }
  }, [isSelected]);

  return {
    isSelected,
    isFocused,
    toggle: () => setIsSelected(!isSelected),
    handleClick: () => setIsSelected(!isSelected),
    handleKeyDown,
    handleFocus: () => setIsFocused(true),
    handleBlur: () => setIsFocused(false),
  };
}
```

---

## Performance Optimization

### Memoization Patterns

```jsx
// Memoize expensive components
const Card = React.memo(({ title, description, onClick }) => (
  <article onClick={onClick}>
    <h3>{title}</h3>
    <p>{description}</p>
  </article>
), (prevProps, nextProps) => {
  // Custom comparison: only re-render if these change
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description
  );
});

// Memoize callback to prevent child re-renders
function CardList({ cards, onCardClick }) {
  const handleCardClick = useCallback((id) => {
    onCardClick(id);
  }, [onCardClick]);

  return cards.map(card => (
    <Card
      key={card.id}
      {...card}
      onClick={() => handleCardClick(card.id)}
    />
  ));
}
```

### Lazy Loading & Code Splitting

```jsx
// Lazy load modal only when needed
const Modal = React.lazy(() => import('./Modal'));

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open Modal</button>
      <Suspense fallback={<div>Loading...</div>}>
        {showModal && <Modal onClose={() => setShowModal(false)} />}
      </Suspense>
    </>
  );
}
```

### Virtual Scrolling for Large Lists

```jsx
import { FixedSizeList } from 'react-window';

function LargeCardList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <Card {...items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={350}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## Dark Mode & Theme Management

### CSS Custom Properties for Theming

```css
:root {
  color-scheme: light dark;
  
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --text-primary: #111827;
  --border-primary: #e5e7eb;
  --button-bg: #3b82f6;
  --button-hover: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme */
    --bg-primary: #111827;
    --text-primary: #f9fafb;
    --border-primary: #4b5563;
    --button-bg: #1d4ed8;
    --button-hover: #1e40af;
  }
}

/* Component uses variables */
button {
  background-color: var(--button-bg);
  color: white;
}

button:hover {
  background-color: var(--button-hover);
}
```

### React Theme Context

```jsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## Animation Best Practices

### Motion-Safe Animations

```css
/* Base animation - applies to all users */
button {
  transition: background-color 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}

/* More complex animation - only for users who prefer motion */
@media (prefers-reduced-motion: no-preference) {
  .card {
    animation: slideIn 300ms ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

### Duration Guidelines

```css
:root {
  --duration-instant: 0ms;        /* Immediate visual feedback */
  --duration-fast: 150ms;         /* Hover effects */
  --duration-normal: 250ms;       /* Focus, standard interaction */
  --duration-slow: 350ms;         /* Complex animations */
  --duration-deliberate: 500ms+;  /* Page transitions */
}

/* Apply appropriately */
button:hover {
  transition: all var(--duration-fast);
}

.modal {
  transition: all var(--duration-normal);
}

@media (prefers-reduced-motion: reduce) {
  button, .modal {
    transition: none;
  }
}
```

---

## Troubleshooting Guide

### Focus-Related Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Focus ring not visible | Low contrast or missing outline | Use `outline: 2px solid` with primary color |
| Focus jumps erratically | Missing focus management | Save/restore focus on modal open/close |
| Focus trap escapes modal | Missing roving tabindex | Implement Tab wrapping on first/last element |
| Outline hidden by content | No z-index or outline-offset | Add `z-index: 10` or `outline-offset: 2px` |
| Focus style conflicts | Multiple outline definitions | Use single rule with important if needed |

### State Management Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Hover persists on mobile | Touch acts as hover | Use `@media (hover: none)` to override |
| Active state too fast | Transition too short | Increase to 150ms+ for visibility |
| Disabled button still clickable | Missing pointer-events | Add `disabled:pointer-events-none` |
| Loading state jank | Reflow from content change | Pre-allocate space or use fixed widths |
| State colors don't change | CSS specificity issue | Check selector specificity or use !important |

### Accessibility Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Color-blind users can't see state | Relying only on color | Add icons, patterns, or text indicators |
| Screen readers miss focus | Not announced properly | Use aria-live, role="alert", or aria-busy |
| Keyboard navigation broken | Positive tabindex or missing handlers | Use tabindex="0" only, implement arrow keys |
| Motion causes nausea | Ignoring prefers-reduced-motion | Wrap animations in @media query |
| Touch targets too small | Less than 44x44px | Increase min-height and min-width |

---

## Quick Command Reference

### Tailwind CSS Utilities Quick Lookup

```
/* Focus Variants */
focus:              Any focus (mouse/keyboard)
focus-visible:      Keyboard focus only
focus-within:       Focus on child element
focus-ring:         Default ring styling

/* Disabled Variants */
disabled:           Applied when disabled attribute set
aria-disabled:      For custom disabled state

/* Hover Variants */
hover:              Mouse over element
group-hover:        Parent hover affects children

/* Active Variants */
active:             Button press/hold
group-focus:        Parent focus affects children

/* Dark Mode */
dark:               Prefer color scheme: dark
light:              Prefer color scheme: light

/* Reduced Motion */
motion-reduce:      Prefers reduced motion
motion-safe:        Prefers motion

/* Contrast */
contrast-more:      Prefers contrast: more
contrast-less:      Prefers contrast: less
```

### Browser DevTools Shortcuts

```
# Test focus styles
1. Right-click element → Inspect
2. Open DevTools → Toggle device toolbar
3. Tab to element to see keyboard focus
4. Click :hov toggle to test hover state

# Accessibility testing
1. Lighthouse (Chrome) → Accessibility
2. Axe DevTools → Full page scan
3. WAVE → Browser extension
4. Color Contrast Analyzer → Specific elements

# Dark mode testing
Chrome DevTools → Rendering → Emulate CSS media feature prefers-color-scheme
```

---

## References & Further Reading

- [W3C ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: Focus Management](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Keyboard)
- [Tailwind CSS: Interactive States](https://tailwindcss.com/docs/hover-focus-and-other-states)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)
- [Animation Performance](https://web.dev/animations-guide/)
