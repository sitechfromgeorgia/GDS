---
name: framer-motion-react-animations
description: Builds production-grade animations using Framer Motion 11 for React and Next.js applications with motion values, variants, scroll triggers, and gesture controls. Use when creating interactive UI animations, page transitions, scroll effects, drag interactions, or choreographed multi-element animations.
---

# Framer Motion React Animations

## Quick Start

Install Framer Motion (now called Motion):

```bash
npm install motion
# or import from legacy package
npm install framer-motion
```

Basic fade-in animation:

```typescript
import { motion } from 'motion/react'

export function FadeIn() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Content fades in
    </motion.div>
  )
}
```

## When to Use This Skill

- **UI Animations**: Micro-interactions (hover, tap, focus feedback)
- **Page Transitions**: Enter/exit animations with AnimatePresence
- **Scroll-Triggered Animations**: Fade, slide, or parallax on scroll
- **Drag & Drop**: Draggable elements with constraints and momentum
- **Layout Changes**: Smooth animations when DOM structure updates
- **Complex Orchestration**: Staggered children, variant propagation
- **Gesture Responses**: whileHover, whileTap, whileDrag states
- **Next.js Integration**: SSR-compatible animations with App Router

## Core Concepts

### Motion Components

Every HTML/SVG element becomes animatable by prefixing with `motion`:

```typescript
// Standard motion components
<motion.div />
<motion.button />
<motion.section />
<motion.svg />

// Custom components
const MotionCard = motion.create(Card)
<MotionCard />
```

### Three Animation States

Every animation requires three answers:

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}    // Starting state
  animate={{ opacity: 1, y: 0 }}     // Target state
  transition={{ duration: 0.5 }}     // How it gets there
>
  Animated content
</motion.div>
```

### Transitions

Control how animations progress:

```typescript
// Tween (default) - linear or eased
<motion.div
  animate={{ x: 100 }}
  transition={{ duration: 0.5, ease: 'easeInOut' }}
/>

// Spring - physics-based, feels natural
<motion.div
  animate={{ x: 100 }}
  transition={{ type: 'spring', stiffness: 100, damping: 10 }}
/>

// Keyframes - multi-step animation
<motion.div
  animate={{ x: [0, 100, 0] }}
  transition={{ duration: 2, times: [0, 0.5, 1] }}
/>

// Repeat and delay
<motion.div
  animate={{ scale: 1.1 }}
  transition={{ delay: 0.2, repeat: Infinity, repeatType: 'reverse' }}
/>
```

## Essential Patterns

### 1. Variants (Reusable Animation States)

Define animations once, reuse everywhere:

```typescript
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function Card() {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
    />
  )
}
```

### 2. Gesture Animations

Respond to user interaction:

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ outline: '2px solid blue' }}
>
  Interactive Button
</motion.button>
```

### 3. Drag with Constraints

Constrain dragging to pixel bounds or container:

```typescript
const containerRef = useRef(null)

export function DraggableBox() {
  return (
    <motion.div
      ref={containerRef}
      style={{ width: 300, height: 200, border: '1px solid' }}
    >
      <motion.div
        drag
        dragConstraints={containerRef}
        dragElastic={0.2}
        dragTransition={{ power: 0.3 }}
        style={{ width: 50, height: 50, background: 'blue' }}
      />
    </motion.div>
  )
}
```

### 4. Staggered Children

Orchestrate animations across multiple items:

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,       // 100ms delay between children
      delayChildren: 0.2,         // Delay before first child starts
      when: 'beforeChildren',     // Parent animates first
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

function List({ items }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 5. Exit Animations with AnimatePresence

Animate elements when they unmount:

```typescript
import { AnimatePresence } from 'motion/react'

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            Modal Content
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**AnimatePresence modes:**
- `sync` (default) - Unmount immediately
- `wait` - New children wait for old to exit (sequential)
- `popLayout` - Faster, less smooth for rapid changes

### 6. Scroll-Triggered Animations

Animate when elements enter viewport:

```typescript
// Simplest: whileInView
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
  viewport={{ once: true, amount: 0.5 }}
>
  Fades in when scrolled into view
</motion.div>

// Advanced: useInView with variants
import { useInView } from 'motion/react'
import { useRef } from 'react'

function ScrollCard() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    />
  )
}
```

### 7. Layout Animations

Smoothly animate DOM reflow (resize, reorder):

```typescript
// Individual element layout animation
function Accordion({ isOpen }) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{ height: isOpen ? 'auto' : 0 }}
    >
      Content
    </motion.div>
  )
}

// Shared element transitions
function ImageGrid() {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      {images.map((img) => (
        <motion.img
          key={img.id}
          layoutId={`image-${img.id}`}
          onClick={() => setSelected(img.id)}
        />
      ))}
      <AnimatePresence>
        {selected && (
          <motion.div
            layoutId={`image-${selected}`}
            onClick={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Coordinate layout across independent components
import { LayoutGroup } from 'motion/react'

<LayoutGroup>
  <Accordion />
  <Accordion />
</LayoutGroup>
```

### 8. Scroll-Linked Animations (Parallax)

Tie animations to scroll progress:

```typescript
import { useScroll, useTransform } from 'motion/react'

function ParallaxSection() {
  const { scrollY } = useScroll()
  
  // Map scrollY (0 to 2000) to translateY (0 to -100)
  const y = useTransform(scrollY, [0, 2000], [0, -100])

  return (
    <motion.div style={{ y }}>
      Background moves slower than scroll
    </motion.div>
  )
}
```

### 9. Motion Values (Advanced State)

Manually control animations without re-renders:

```typescript
import { useMotionValue, useTransform } from 'motion/react'

function RotatingBox() {
  const rotate = useMotionValue(0)
  
  // Transform rotation to color
  const color = useTransform(
    rotate,
    [0, 360],
    ['#ff0000', '#00ff00']
  )

  return (
    <motion.div
      style={{ rotate, color }}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  )
}
```

### 10. SVG Path Animations

Animate complex paths:

```typescript
<motion.svg viewBox="0 0 100 100">
  <motion.path
    d="M 10 80 Q 50 20, 90 80"
    stroke="blue"
    strokeWidth={2}
    fill="none"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 2 }}
  />
</motion.svg>
```

## Next.js App Router Integration

Wrap animated components as client components:

```typescript
'use client'

import { motion, AnimatePresence } from 'motion/react'

export function AnimatedSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      suppressHydrationWarning // For data-projection-id mismatches
    >
      Content
    </motion.div>
  )
}
```

Page transitions with AnimatePresence:

```typescript
'use client'

import { AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

## Bundle Size Optimization

Reduce bundle from 34kb to 4.6kb:

```typescript
// 1. Use LazyMotion + m components
import { LazyMotion, domAnimation, m } from 'motion/react'

export function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
    </LazyMotion>
  )
}

// 2. Async load features for code-splitting
const loadFeatures = async () => {
  const { domAnimation, inView } = await import('motion/react')
  return domAnimation | inView
}

<LazyMotion features={loadFeatures}>
  {children}
</LazyMotion>
```

## Tailwind CSS Integration

Combine Tailwind with Framer Motion:

```typescript
function Button() {
  return (
    <motion.button
      className="px-4 py-2 bg-blue-500 text-white rounded"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Animated Button
    </motion.button>
  )
}
```

Works with styled-components:

```typescript
import styled from 'styled-components'

const StyledBox = styled(motion.div)`
  width: 100px;
  height: 100px;
  background: blue;
`

<StyledBox
  animate={{ rotate: 360 }}
  transition={{ duration: 2 }}
/>
```

## TypeScript Best Practices

```typescript
import { 
  motion, 
  HTMLMotionProps,
  Variants,
  TargetAndTransition 
} from 'motion/react'

// Type-safe variants
const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// Type-safe component props
interface AnimatedBoxProps extends HTMLMotionProps<'div'> {
  variant: 'hidden' | 'visible'
}

export function AnimatedBox({ variant, ...props }: AnimatedBoxProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate={variant}
      {...props}
    />
  )
}
```

## Performance Optimization

```typescript
// ✅ DO: Animate transform and opacity
<motion.div animate={{ x: 100, opacity: 0.5 }} />

// ✅ DO: Use willChange for non-transform properties
<motion.div style={{ willChange: 'filter' }} animate={{ filter: 'blur(5px)' }} />

// ✅ DO: Use layout="position" for text to avoid distortion
<motion.h1 layout="position" layoutId="title" />

// ❌ DON'T: Animate width/height (causes layout recalc)
<motion.div animate={{ width: 200 }} /> // Avoid this

// ❌ DON'T: Chain dragConstraints on every re-render
const ref = useRef(null) // Cache the ref
<motion.div drag dragConstraints={ref} />
```

## Common Errors & Solutions

**Problem: AnimatePresence exit animations not firing**
```typescript
// Solution: Ensure key is unique and present
<AnimatePresence>
  {items.map(item => (
    <motion.div key={item.id} exit={{ opacity: 0 }} /> // key is critical
  ))}
</AnimatePresence>
```

**Problem: Layout animations cause text distortion**
```typescript
// Solution: Use layout="position" instead of layout={true}
<motion.h1 layout="position" layoutId="title" />
```

**Problem: Hydration mismatch in Next.js with data-projection-id**
```typescript
// Solution: Add suppressHydrationWarning
<motion.div suppressHydrationWarning animate={{ x: 100 }} />
```

**Problem: Animations stutter with many elements**
```typescript
// Solution: Reduce animation complexity or use LazyMotion
// Also: Use dragElastic={0.1} to reduce elasticity overhead
<motion.div drag dragElastic={0.1} />
```

**Problem: Memory leaks with scroll animations**
```typescript
// Solution: useScroll hooks auto-cleanup; avoid manual window.addEventListener
// Stick to useScroll, useInView hooks provided by Motion
```

**Problem: Page transitions feel slow**
```typescript
// Solution: Use mode="popLayout" instead of mode="wait"
<AnimatePresence mode="popLayout">
  {children}
</AnimatePresence>
```

## Accessibility Considerations

Respect user motion preferences:

```typescript
import { useReducedMotion } from 'motion/react'

function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ x: shouldReduceMotion ? 0 : 100 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      Content respects prefers-reduced-motion
    </motion.div>
  )
}
```

Keyboard-accessible drag:

```typescript
<motion.div
  drag
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      // Handle keyboard activation
    }
  }}
/>
```

## Best Practices Checklist

- [ ] Use variants for complex multi-state animations
- [ ] Prefer `transform` and `opacity` properties (GPU accelerated)
- [ ] Use `suppressHydrationWarning` in Next.js for `data-projection-id` warnings
- [ ] Cache refs for `dragConstraints` (don't recreate on render)
- [ ] Use `LazyMotion + m` to optimize bundle size
- [ ] Test scroll animations on mobile for performance
- [ ] Use `layout="position"` for text-containing elements with layout props
- [ ] Always provide `key` props for `AnimatePresence` children
- [ ] Use `whileInView` for simple scroll-triggered animations
- [ ] Clean up scroll listeners by sticking to Motion's scroll hooks
- [ ] Respect `prefers-reduced-motion` with `useReducedMotion` hook
- [ ] Type variants as `const` for TypeScript inference
- [ ] Use `transition={{ when: 'beforeChildren' }}` for orchestration
- [ ] Limit staggerChildren delay to <200ms for snappy feel
- [ ] Profile with DevTools Performance tab to catch layout thrashing

## References

- **Official Documentation**: [motion.dev](https://motion.dev)
- **GitHub Issues**: [github.com/framer/motion](https://github.com/framer/motion)
- **React Integration**: [motion.dev/docs/react](https://motion.dev/docs/react)
- **Migration Guide**: v10 to v11 improvements in layout and scroll animations
- **Bundle Optimization**: [motion.dev/docs/react-reduce-bundle-size](https://motion.dev/docs/react-reduce-bundle-size)
- **Layout Animations**: [motion.dev/docs/react-layout-animations](https://motion.dev/docs/react-layout-animations)
- **Drag Documentation**: [motion.dev/docs/react-drag](https://motion.dev/docs/react-drag)
- **Gesture Guide**: [motion.dev/docs/react-gestures](https://motion.dev/docs/react-gestures)
- **Scroll Animations**: [motion.dev/docs/react-scroll-animations](https://motion.dev/docs/react-scroll-animations)
