---
name: designing-microinteractions-motion
description: Implements polished microinteractions, feedback animations, transitions, and loading states in web/app development using CSS, Framer Motion, View Transitions API, and React patterns. Use when building form validations, button feedback, loading indicators, page transitions, or any UI element requiring smooth animations with proper timing, easing, and accessibility compliance.
---

# Designing Microinteractions & Motion

## Quick Start

### Timing Reference Chart

| Interaction Type | Duration | Easing | Use Case |
|------------------|----------|--------|----------|
| Button feedback (hover) | 100-150ms | ease-out | Hover state changes |
| Form validation | 150-200ms | ease-out | Error/success indicators |
| Micro state change | 150-300ms | ease-in-out | Toggle, checkbox, switch |
| Page/route transition | 300-500ms | ease-in-out | Navigation, modal open/close |
| Loading animation | 1000-2000ms | linear | Spinner, shimmer effect |
| Complex sequence | 500ms+ | cubic-bezier | Orchestrated multi-element |

### Essential CSS Pattern

```css
/* Always respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Microinteraction base */
.btn-micro {
  transition: all 150ms ease-out;
}

.btn-micro:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-micro:active {
  transform: translateY(0);
}
```

### React Hook: useReducedMotion

```typescript
function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}

// Usage:
const prefersReduced = useReducedMotion();
const duration = prefersReduced ? 0 : 300;
```

---

## When to Use This Skill

**Implement microinteractions when:**
- Providing visual feedback for user actions (clicks, hovers, form submission)
- Indicating system status (loading, success, error states)
- Transitioning between UI states (modals, dropdowns, tabs, page navigation)
- Improving perceived performance (skeleton screens, optimistic UI)
- Guiding user attention to important elements (pulse, bounce, entrance animations)

**Avoid microinteractions for:**
- Decorative motion with no functional purpose
- Animations lasting >500ms without user control (violates WCAG 2.2.2)
- Motion triggered automatically on page load for >5 seconds
- Rapid or flickering animations without user control

---

## Microinteraction Anatomy

Every microinteraction has four components:

1. **Trigger**: User action or system event (click, hover, form submit)
2. **Rules**: Conditions that determine how animation proceeds
3. **Feedback**: Visual/audio response (animation, color change, sound)
4. **Loop/Mode**: Repetition and end state behavior

**Example - Button Loading State:**
- **Trigger**: User clicks "Save" button
- **Rules**: Disable button, show spinner if request >100ms
- **Feedback**: Inline spinner, button text → "Saving..."
- **Loop**: Spinner animates until response arrives or 30s timeout

---

## Timing & Easing Specifications

### Duration Guidelines

**0-100ms (Instant)**: Not perceived as animation; feels immediate
- Checkbox state toggle
- Dropdown menu appearance (if no entrance animation)

**100-150ms (Button/Hover States)**: User perceives immediate feedback
- Button hover color change
- Focus state indicator
- Tab switching

**150-300ms (Form Feedback)**: Smooth but noticeable
- Form field validation message
- Error state entrance
- Checkbox/radio animations

**300-500ms (State Transitions)**: Feels intentional and planned
- Modal enter/exit
- Page route transitions
- Accordion collapse/expand
- Dropdown reveal

**500ms-1s (Loading/Complex)**: Only for extended operations
- Loading spinner
- Progress bar updates
- Skeleton shimmer effect
- Multi-element orchestrated sequences

**>1s (Rare)**: Only when explicitly required
- Long-running animations with pause controls
- Animated tutorials or product tours

### Easing Selection Guide

| Easing | Cubic-Bezier | When to Use | Example |
|--------|--------------|------------|---------|
| `ease-out` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Elements entering screen or becoming visible | Button scale on hover, dropdown appear |
| `ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` | Bidirectional transitions, general purpose | Modal transitions, accordion, tab switch |
| `ease-in` | `cubic-bezier(0.42, 0, 1, 1)` | Elements leaving screen or hiding | Modal dismiss, element fade out |
| `linear` | `cubic-bezier(0, 0, 1, 1)` | Rotations, progress bars, continuous motion | Spinner, loading indicator, timer sweep |
| `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Custom "spring" | Friendly, playful feel | Bounce effect on alert |

---

## Feedback Animation Patterns

### Button States

```typescript
// React + Framer Motion pattern
import { motion } from 'framer-motion';

export function AnimatedButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await submitForm();
      // Success animation handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={!isLoading ? { y: -2 } : {}}
      whileTap={!isLoading ? { y: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : {}}
      disabled={isLoading}
      className="relative px-4 py-2 bg-blue-600 text-white rounded-lg
                 transition-all duration-150 ease-out
                 disabled:opacity-50"
    >
      {isLoading ? (
        <motion.div
          className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        'Save Changes'
      )}
    </motion.button>
  );
}
```

### Form Validation Feedback

```typescript
// Real-time validation with staggered errors
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function FormField({ label, value, error, onChange }: FormFieldProps) {
  const isValid = error === undefined;

  return (
    <motion.div layout className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <motion.input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg transition-all duration-150 ${
          isValid
            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            : 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
        }`}
        whileFocus={{ boxShadow: isValid ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)' }}
        transition={{ duration: 0.15 }}
      />
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-red-600 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Toggle/Switch Animation

```css
/* CSS-only toggle with smooth transition */
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  background-color: #ccc;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color 200ms ease-out;
}

.toggle::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: left 200ms ease-out, box-shadow 200ms ease-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle.active {
  background-color: #4f46e5;
}

.toggle.active::before {
  left: 24px;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .toggle,
  .toggle::before {
    transition: none;
  }
}
```

---

## Transition Patterns

### Page/Route Transitions with View Transitions API

```typescript
// Next.js App Router with View Transitions (Chrome 126+, Edge 126+, Safari 18.2+)
'use client';

import { useRouter } from 'next/navigation';
import { startViewTransition } from 'react-dom';

export function NavigationLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Only use View Transitions API if supported
    if (!document.startViewTransition) {
      router.push(href);
      return;
    }

    startViewTransition(() => {
      router.push(href);
    });
  };

  return (
    <a href={href} onClick={handleClick} className="cursor-pointer">
      {children}
    </a>
  );
}

// Enable View Transitions for all navigations in layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <style>{`
          @view-transition {
            navigation: auto;
          }

          ::view-transition-old(root) {
            animation: 300ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
          }

          ::view-transition-new(root) {
            animation: 300ms cubic-bezier(0, 0, 0.2, 1) both fade-in;
          }

          @keyframes fade-out {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Modal Enter/Exit with Framer Motion

```typescript
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 pointer-events-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### List Stagger Animation

```typescript
// Staggered list entrance with Framer Motion
import { motion } from 'framer-motion';

interface ListProps {
  items: Array<{ id: string; text: string }>;
}

export function StaggeredList({ items }: ListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // 80ms between each child
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="p-3 bg-gray-100 rounded-lg"
        >
          {item.text}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

## Loading Indicators

### Spinner Component

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colorMap = {
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      className={`${sizeMap[size]} ${colorMap[color]} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

// CSS for animation (add to tailwind.config.js if using custom):
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
```

### Skeleton Screen with Shimmer

```typescript
interface SkeletonProps {
  rows?: number;
  showAvatar?: boolean;
}

export function SkeletonLoader({ rows = 3, showAvatar = true }: SkeletonProps) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 rounded" />
      ))}
    </div>
  );
}

// For advanced shimmer effect, add to tailwind.config.js:
// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         shimmer: {
//           '0%': { backgroundPosition: '-200% 0' },
//           '100%': { backgroundPosition: '200% 0' },
//         },
//       },
//       animation: {
//         shimmer: 'shimmer 2s linear infinite',
//       },
//     },
//   },
// };

// Then use:
// <div className="animate-shimmer bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-[length:200%_100%]" />
```

### Progress Bar

```typescript
interface ProgressBarProps {
  value: number; // 0-100
  animated?: boolean;
  color?: 'primary' | 'success' | 'error';
}

export function ProgressBar({ value, animated = true, color = 'primary' }: ProgressBarProps) {
  const colorMap = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${colorMap[color]} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          duration: animated ? 0.6 : 0.1,
          ease: 'easeOut',
        }}
      />
    </div>
  );
}
```

---

## Best Practices

### ✅ DO:

- **Respect prefers-reduced-motion**: Always wrap animations in `@media (prefers-reduced-motion: reduce)`
- **Keep durations short**: 150-300ms for most interactions, max 500ms for transitions
- **Use ease-out for entrance, ease-in for exit**: Feels more natural
- **Animate GPU-friendly properties**: Use `transform` and `opacity`, avoid `width`, `height`, `position`
- **Provide visual feedback immediately**: <100ms response time for user actions
- **Test on lower-end devices**: Ensure 60fps performance on mobile
- **Disclose loading time**: Show progress for operations >1 second
- **Maintain consistency**: Use same timing/easing across similar interactions
- **Provide pause controls**: Long animations (>5s) require user control per WCAG 2.2.2

### ❌ DON'T:

- **Animate on page load automatically**: Causes cognitive load and accessibility issues
- **Create bounce/vibration animations**: Trigger vestibular disorders in users
- **Use multiple easing functions on one element**: Feels unpredictable
- **Animate non-GPU properties excessively**: Causes jank and battery drain
- **Exceed 500ms without user control**: Feels sluggish and unresponsive
- **Ignore color contrast in animated elements**: Accessibility requirement
- **Use animations for decoration only**: Every motion should serve a purpose
- **Layer competing animations**: Confuses user about what changed

---

## Common Errors & Solutions

### Error: "Animation feels janky or dropped frames"

**Causes:**
- Animating `width`, `height`, `left`, `right` (layout properties)
- Too many simultaneous animations
- Not using `will-change` appropriately

**Solution:**
```typescript
// ❌ BAD: Animates layout property (triggers reflow)
const badVariant = {
  animate: { width: 300 }
};

// ✅ GOOD: Uses transform (GPU-accelerated)
const goodVariant = {
  animate: { scaleX: 1.5 } // or use transform: scaleX
};

// Add will-change for complex animations (use sparingly)
// Don't add will-change to too many elements at once
const expensiveAnimation = (
  <motion.div style={{ willChange: 'transform' }} animate={...} />
);
```

### Error: "Animation doesn't respect prefers-reduced-motion"

**Cause:** Missing media query or incorrect implementation

**Solution:**
```typescript
// CSS approach
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// React approach
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReduced ? 0 : 300;
```

### Error: "Animations block user interaction"

**Cause:** `pointer-events: none` not handled properly during animation

**Solution:**
```typescript
// Use AnimatePresence with proper pointer-events
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      className="pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="pointer-events-auto">
        {/* Interactive content */}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Error: "Layout shift during skeleton → content transition"

**Cause:** Skeleton dimensions don't match final content

**Solution:**
```typescript
// Always set fixed dimensions on skeleton
<div className="h-12 w-48">
  {loading ? (
    <Skeleton height={48} width={192} /> // Match parent
  ) : (
    <Content />
  )}
</div>

// Or use aspect-ratio
<div className="aspect-video">
  {loading ? <Skeleton /> : <Video />}
</div>
```

### Error: "Framer Motion animations conflict with Next.js transitions"

**Cause:** Multiple animation systems fighting

**Solution:**
```typescript
// Use React.startViewTransition for page-level, Framer for component-level
'use client';

import { startViewTransition } from 'react-dom';

// Page navigation → View Transitions API
const handleNavigate = () => {
  startViewTransition(() => {
    router.push('/page');
  });
};

// Component animation → Framer Motion
<motion.div animate={{ x: 100 }} />
```

---

## Code Examples

### Complete Form with Validation Animation

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function SignupForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation
    const newErrors = { ...errors };
    if (field === 'email') {
      if (!validateEmail(value)) {
        newErrors.email = 'Invalid email format';
      } else {
        delete newErrors.email;
      }
    }
    if (field === 'password') {
      if (!validatePassword(value)) {
        newErrors.password = 'Password must be at least 8 characters';
      } else {
        delete newErrors.password;
      }
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSubmitSuccess(true);
      setFormData({ email: '', password: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <motion.div
        layout
        className="relative"
      >
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <motion.input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg transition-all duration-150 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          whileFocus={{
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        />
        <AnimatePresence mode="wait">
          {errors.email && (
            <motion.p
              key="email-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-red-600 mt-1"
            >
              {errors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div layout className="relative">
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <motion.input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg transition-all duration-150 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          whileFocus={{
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        />
        <AnimatePresence mode="wait">
          {errors.password && (
            <motion.p
              key="password-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-red-600 mt-1"
            >
              {errors.password}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        type="submit"
        disabled={isSubmitting || Object.keys(errors).length > 0}
        onClick={handleSubmit}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        className="w-full bg-blue-600 text-white py-2 rounded-lg
                   transition-all duration-150 disabled:opacity-50"
      >
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.span
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Sign Up
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-green-100 text-green-800 rounded-lg text-sm"
          >
            ✓ Account created successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
```

---

## Accessibility Checklist

- [ ] All animations respect `prefers-reduced-motion` media query
- [ ] Animations ≤500ms or have user pause controls (WCAG 2.2.2)
- [ ] No flashing >3 times per second (prevents seizures)
- [ ] Color contrast maintained in animated elements (4.5:1 minimum)
- [ ] Interactive elements have visible focus states
- [ ] Loading spinners have `role="status"` or `aria-label`
- [ ] Modals trap focus and restore on close
- [ ] No auto-playing animations on page load
- [ ] Motion doesn't impair navigation or readability

---

## Technology Recommendations

### CSS-Only Animations
- **Use when:** Simple state changes, hover effects, loading spinners
- **Pros:** No runtime overhead, hardware accelerated
- **Cons:** Limited to linear sequences, harder to coordinate
- **Browser support:** All modern browsers

### Framer Motion (React)
- **Use when:** Complex component animations, gesture interactions, orchestrated sequences
- **Pros:** Declarative API, layout animations, easy to learn
- **Cons:** Adds ~45kb to bundle, React-specific
- **Browser support:** All modern browsers

### React Spring (React)
- **Use when:** Physics-based motion, high-performance requirements, complex orchestration
- **Pros:** Physics engine, minimal bundle, high performance
- **Cons:** Steeper learning curve, imperative API
- **Browser support:** All modern browsers

### View Transitions API (Vanilla JS/Framework-agnostic)
- **Use when:** Page/route transitions, SPA navigation, view morphing
- **Pros:** Native browser API, zero library overhead, works everywhere
- **Cons:** Newer (Chrome 126+, Edge 126+, Safari 18.2+), limited customization
- **Browser support:** Chrome 126+, Edge 126+, Safari 18.2+ (graceful degradation elsewhere)

### Tailwind CSS Animations
- **Use when:** Utility-first workflow, simple predefined animations
- **Pros:** Consistent, easy to customize, works with Tailwind ecosystem
- **Cons:** Limited control over complex timing, requires config for custom properties
- **Recommended pattern:** Extend with custom animation-duration, animation-delay, animation-ease plugins

---

## Performance Guidelines

**Measuring Performance:**
- Use DevTools Performance tab to record animations
- Check frames per second (FPS) - target 60fps
- Monitor main thread blocking with Performance API

```typescript
// Measure animation performance
const measureAnimation = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
};
```

**Optimization Techniques:**
- Use `transform` and `opacity` only (GPU properties)
- Avoid animating `width`, `height`, `position`, `box-shadow`
- Use `will-change` sparingly (max 2-3 elements at once)
- Debounce scroll animations with Intersection Observer
- Lazy-load animation libraries with dynamic imports
- Batch animations using `requestAnimationFrame`

---

## References

- [MDN: CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)
- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Spring Documentation](https://www.react-spring.dev/)
- [Material Design Motion Guidelines](https://m3.material.io/styles/motion/overview/)
- [Web Accessibility: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.2 Success Criterion 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide)
- [CSS Easing Functions Level 2](https://www.w3.org/TR/css-easing-2/)
- [Tailwind CSS Animation Utilities](https://tailwindcss.com/docs/animation)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
