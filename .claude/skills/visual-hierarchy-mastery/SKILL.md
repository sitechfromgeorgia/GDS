---
name: implementing-visual-hierarchy
description: Implements visual hierarchy in web interfaces through size, contrast, spacing, and typography scales, guiding user attention to key elements. Use when building UIs, creating design systems, establishing button/typography hierarchies, or optimizing page layouts for user focus and navigation.
---

# Implementing Visual Hierarchy in UI/UX Design

## Quick Start

Visual hierarchy is built on **4 core principles**:

1. **Size**: Larger elements = higher importance (use 1.25 to 1.618 scale ratio)
2. **Contrast**: WCAG 4.5:1 ratio minimum for text emphasis
3. **Spacing**: 8px grid system with internal ≤ external rule
4. **Typography Weight**: Regular → Medium → Semibold → Bold progression

**Immediate action**: Apply one principle at a time. Size differences should be noticeable (20% minimum step between hierarchy levels). Contrast should be measurable (test with color checkers). Spacing should follow 8px multiples.

## When to Use This Skill

- Designing new interfaces or redesigning existing ones
- Building design systems with consistent hierarchies
- Creating button and component systems
- Optimizing landing pages or marketing sites
- Ensuring accessibility while maintaining visual emphasis
- Establishing typography scales for multi-product systems
- Testing whether design hierarchy is working
- Mobile-first responsive design where hierarchy adapts

## Core Principles & Implementation

### 1. Size & Scale

**How it works**: Larger elements capture attention first. This is the most powerful hierarchy tool.

**Typography Scale Ratios** (choose one):
- **1.125 (Major Second)** - Subtle steps, dense layouts
- **1.25 (Major Third)** - Balanced, recommended for most projects
- **1.414 (Augmented Fourth)** - Pronounced, clear differences
- **1.618 (Golden Ratio)** - Aesthetic, creative projects

**Example with 1.25 ratio (base 16px)**:
```
Body text:        16px (base)
Small heading:    20px (16 × 1.25)
Medium heading:   25px (20 × 1.25)
Large heading:    32px (25 × 1.25)
Hero title:       40px (32 × 1.25)
```

**Best Practice**: Use no more than 3 distinct sizes in primary hierarchy:
- Small (14-16px): body, captions
- Medium (18-22px): subheadings
- Large (28-40px): main headings

**Responsive scaling**: Multiply base by 0.875 on mobile, 1.125 on tablet, 1 on desktop.

### 2. Contrast & Color

**WCAG Compliance Ratios**:
- **AA (minimum)**: 4.5:1 normal text, 3:1 large text (18px+)
- **AAA (enhanced)**: 7:1 normal text, 4.5:1 large text

**Color Token Strategy** (design system approach):
```
Primary text:        #1F2937 (15.8:1 on white) ← Main hierarchy
Secondary text:      #4B5563 (7.0:1 on white)
Muted text:          #6B7280 (4.5:1 on white, minimum)
Primary action:      #2563EB (4.6:1 on white)
Error state:         #EF4444 (4.6:1 on white)
```

**Hierarchy application**:
- Primary elements: Brand color on white (4.5:1+)
- Secondary elements: Lighter color or tint
- De-emphasized: Gray text (4.5:1 minimum for accessibility)
- Icons/UI: 3:1 contrast ratio acceptable

**Tools**: WCAG Contrast Checker, Stark plugin, WebAIM contrast tool

### 3. Spacing & Proximity (8px Grid)

**Grid multiples**: 8, 16, 24, 32, 40, 48, 56px (use 4px half-steps only when necessary)

**Internal ≤ External Rule**: 
- Space *inside* an element (padding) ≤ space *around* it (margin)
- Creates clear grouping and visual relationships

**Example**:
```css
/* Card with good hierarchy */
.card {
  padding: 16px;        /* internal space */
  margin: 24px;         /* external space - larger */
  gap: 16px;            /* space between child elements */
}
```

**Line height ratios** (improves typography hierarchy):
- Headings/display: 1.14 ratio (tighter)
- Body copy: 1.5 ratio (readable)
- Captions: 1.4 ratio

### 4. Typography Weight Progression

Establish weight hierarchy: **Regular (400) → Medium (500) → Semibold (600) → Bold (700)**

**Hierarchy application**:
- Body text: Regular (400)
- Labels, secondary UI: Medium (500)
- Subheadings: Semibold (600)
- Main headings, CTAs: Bold (700)
- Extra emphasis: Bold (700) + increased size

## Eye-Tracking Patterns

### F-Pattern (Text-Heavy Content)
**Use for**: Blog posts, documentation, articles, search results, email layouts

**Eye path**: Horizontal top → horizontal middle → vertical left scan

**Placement strategy**:
- Top-left: Brand/logo
- Top area (horizontally): Main navigation, headline
- Left column: Subheadings, key bullet points
- Right area: Secondary content
- Bottom-left: CTA

```html
<!-- F-Pattern Layout -->
<header><!-- horizontal scan zone --></header>
<main>
  <section>
    <h2>Main heading</h2>  <!-- left side emphasis -->
    <p>Content</p>
  </section>
  <aside><!-- right side ignored initially --></aside>
</main>
```

### Z-Pattern (Minimal Content)
**Use for**: Landing pages, hero sections, single-CTA pages, product showcases

**Eye path**: Top-left → top-right → diagonal → bottom-right

**Placement strategy**:
```
┌─────────────────┐
│ Logo  (info)    │ ← Start: top-left
│ [Product image] │ ← End: top-right
│     / 
│    /  ← Diagonal eye movement
│   / 
│  CTA    [Benefit points] ← End: bottom-right
└─────────────────┘
```

### Transition Pattern
Combine both on scrolling pages:
- **Above fold (viewport)**: Z-pattern (simple hero)
- **Below fold**: F-pattern (detailed content)

## Design System Implementation

### Token Structure (3-Tier Hierarchy)

```
REFERENCE TOKENS (raw values)
↓
color.blue.500 = #2563EB

SEMANTIC TOKENS (named meaning)
↓
color.primary = color.blue.500
color.text.primary = #1F2937

COMPONENT TOKENS (specific usage)
↓
button.primary.background = color.primary
button.primary.text = color.white
```

### Naming Convention
Pattern: `category.subcategory.state`

Examples:
```
color.text.primary
color.text.secondary
color.background.surface
color.border.input
spacing.component.small = 8px
spacing.component.medium = 16px
spacing.component.large = 24px
typography.heading.large
button.primary.padding = 12px 16px
card.elevation.default
```

## Code Examples

### Tailwind CSS Button Hierarchy

```jsx
// Reusable button component with variants
function Button({ variant = 'primary', size = 'md', ...props }) {
  const baseStyles = 'font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus-visible:outline-gray-600',
    tertiary: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-blue-600',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600'
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]}`} {...props} />
  );
}

// Usage with visual hierarchy
export default function Page() {
  return (
    <div className="flex gap-2">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Learn More</Button>
    </div>
  );
}
```

### Typography Scale with CSS Variables

```css
/* Design tokens for typography hierarchy */
:root {
  --type-scale: 1.25;
  --type-base: 16px;
  
  /* Calculated values */
  --type-sm: calc(var(--type-base) / var(--type-scale)); /* 12.8px */
  --type-base: 16px;
  --type-md: calc(var(--type-base) * var(--type-scale)); /* 20px */
  --type-lg: calc(var(--type-md) * var(--type-scale)); /* 25px */
  --type-xl: calc(var(--type-lg) * var(--type-scale)); /* 32px */
  --type-2xl: calc(var(--type-xl) * var(--type-scale)); /* 40px */
  
  /* Line heights for readability */
  --lh-display: 1.14;
  --lh-body: 1.5;
  
  /* Spacing grid (8px base) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}

h1 {
  font-size: var(--type-2xl);
  font-weight: 700;
  line-height: var(--lh-display);
  margin: 0 0 var(--space-lg) 0;
}

h2 {
  font-size: var(--type-xl);
  font-weight: 600;
  line-height: var(--lh-display);
  margin: 0 0 var(--space-md) 0;
}

h3 {
  font-size: var(--type-lg);
  font-weight: 600;
  margin: 0 0 var(--space-md) 0;
}

p {
  font-size: var(--type-base);
  line-height: var(--lh-body);
  margin: 0 0 var(--space-md) 0;
}

small {
  font-size: var(--type-sm);
  color: #6B7280; /* secondary text color */
  line-height: var(--lh-body);
}
```

### Grid + Hierarchy Layout

```jsx
// Responsive layout with visual hierarchy
export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-2 gap-12 items-center">
        {/* Left: Text hierarchy with Z-pattern */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Main Value Proposition
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Clear secondary message that explains the primary benefit.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Primary CTA
          </button>
        </div>
        
        {/* Right: Visual element (same visual weight level as text) */}
        <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center text-gray-500">
          Hero Image
        </div>
      </div>
    </section>
  );
}

// Responsive adjustments (mobile: single column with adjusted sizes)
@media (max-width: 768px) {
  h1 { font-size: 2rem; } /* scaled down */
  p { font-size: 1rem; }
  grid-cols-2 → grid-cols-1;
}
```

### Accessible Color Tokens with Contrast Validation

```jsx
// Design system with pre-validated tokens
const colorTokens = {
  // Primitives (low-level)
  blue: {
    500: '#2563EB', // 4.6:1 on white
    600: '#1D4ED8', // 5.8:1 on white
    700: '#1E40AF'  // 8.2:1 on white
  },
  gray: {
    900: '#111827', // 21:1 on white (maximum)
    700: '#374151', // 10.5:1 on white
    600: '#4B5563'  // 7.0:1 on white
  },
  
  // Semantic (meaningful)
  text: {
    primary: '#1F2937',   // 15.8:1 on white (AA + AAA)
    secondary: '#6B7280', // 4.5:1 on white (AA minimum)
    muted: '#9CA3AF'      // 3.3:1 on white (not compliant - use carefully)
  },
  
  // Components (specific usage)
  button: {
    primary: {
      bg: '#2563EB',      // verified 4.6:1 with white text
      text: '#FFFFFF',
      hover: '#1D4ED8',   // verified 5.8:1
      active: '#1E40AF'   // verified 8.2:1
    },
    secondary: {
      bg: '#F3F4F6',      // light gray
      text: '#374151',    // dark gray, verified 10.5:1
      hover: '#E5E7EB'    // slightly darker
    }
  },
  
  states: {
    error: '#EF4444',     // 4.6:1 on white
    success: '#10B981',   // 4.5:1 on white
    warning: '#F59E0B'    // 2.9:1 on white (caution - pair with icon)
  }
};

// Apply to component
export function AppButton({ variant = 'primary' }) {
  const token = colorTokens.button[variant];
  return (
    <button
      style={{
        backgroundColor: token.bg,
        color: token.text
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = token.hover}
      onMouseLeave={(e) => e.target.style.backgroundColor = token.bg}
    >
      Accessible Button
    </button>
  );
}
```

## Best Practices

### ✅ DO:

1. **Test your hierarchy** - Use squint/blur test before launch
2. **Use consistent scale** - Pick one ratio (1.25 or 1.414) and stick with it
3. **Follow 8px grid** - Makes responsive scaling predictable
4. **Respect WCAG AA minimum** - 4.5:1 contrast for all text
5. **Group related elements** - Use spacing to show relationships
6. **One primary action per section** - Primary button, not 3
7. **Responsive hierarchy** - Adjust sizes/spacing for mobile
8. **Document your tokens** - Team needs to understand naming
9. **Use semantic naming** - `color.primary` not `color.blue`
10. **Test with assistive tech** - Screen readers need clear hierarchy

### ❌ DON'T:

1. **Don't make everything bold** - Removes all emphasis
2. **Don't mix multiple scale ratios** - Confuses relationships
3. **Don't use color alone** - Add icons, text, or patterns for status
4. **Don't stack too many hierarchy levels** - Limit to 3 sizes max
5. **Don't ignore contrast at any size** - 4.5:1 applies universally
6. **Don't use inconsistent spacing** - Every gap should align to grid
7. **Don't create competing focal points** - Guide eye to one primary element
8. **Don't skip mobile testing** - Hierarchy breaks on small screens
9. **Don't hardcode colors** - Use design tokens for consistency
10. **Don't sacrifice accessibility for aesthetics** - Contrast ≥ 4.5:1 always

## Common Errors & Solutions

**Error: "Everything is equally important (all bold, all large)"**
- Solution: Pick one element per section as primary. Make only that bold/large. Reduce others by 1-2 steps.
- Test: Squint test should show clear focal point.

**Error: "I can't tell which button to click first"**
- Solution: Apply button hierarchy:
  - Primary (CTA): Solid blue, 4.6:1 contrast, largest
  - Secondary: Outline or gray, smaller
  - Tertiary: Text-only, smallest
- Visual difference should be immediate without reading text.

**Error: "Hierarchy is fine on desktop but broken on mobile"**
- Solution: Use responsive scaling:
  ```css
  @media (max-width: 768px) {
    h1 { font-size: clamp(1.5rem, 5vw, 2.5rem); }
    gap: 1rem; /* reduce spacing */
  }
  ```

**Error: "Gray text on light background doesn't meet contrast requirements"**
- Solution: Darken gray:
  ```
  NOT: #999999 (2.8:1 - fails WCAG)
  YES: #767676 (4.5:1 - passes AA)
  BETTER: #374151 (10.5:1 - passes AAA)
  ```

**Error: "Spacing looks random (8px, 12px, 20px mixed)"**
- Solution: Audit spacing to multiples of 8:
  ```
  NOT: 8px, 12px, 18px, 20px, 28px
  YES: 8px, 16px, 24px, 32px, 40px
  ```

## Testing & Validation

### Squint Test (5 minutes)
1. Take screenshot of design
2. Blur your vision (squint) or use Photoshop Gaussian Blur (3-4px)
3. Which elements are still visible? Those are your hierarchy.
4. Is primary element most visible? If not, increase size/contrast.

### Contrast Checker
- WCAG Contrast Checker browser extension
- WebAIM contrast tool (webaim.org)
- Check every text color against background
- Requirement: 4.5:1 minimum (AA level)

### 5-Second Test
1. Show design to someone for 5 seconds only
2. Ask: "What's the main purpose? Where would you click first?"
3. If they can't answer, hierarchy is unclear.

### Mobile Testing
1. Resize to 375px (mobile viewport)
2. Is hierarchy still clear? Or does text/button blur together?
3. Spacing should increase (not decrease) for clarity.

## References

- **WCAG Contrast Requirements**: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- **Nielsen Norman F & Z Patterns**: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- **Material Design 3 System**: https://m3.material.io/
- **shadcn/ui Components**: https://ui.shadcn.com/
- **Modular Scale Tool**: https://www.modularscale.com/
- **Type Scale Generator**: https://typescale.com/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Stark Contrast Plugin**: https://www.getstark.co/
- **Design Tokens Best Practices**: https://www.designsystemscollective.com/
