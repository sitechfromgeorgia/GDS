---
name: accessibility-first-web-development
description: Builds inclusive web applications using semantic HTML, keyboard navigation, ARIA, and WCAG 2.2 compliance. Use when creating forms, interactive components, navigation systems, or ensuring keyboard/screen reader accessibility for all users.
---

# Accessibility-First Web Development

## Quick Start

**Core accessibility pyramid (in order of priority):**

1. **Semantic HTML** - Use native elements (`<button>`, `<nav>`, `<main>`, `<input>`, `<a>`) instead of `<div>` soup. 80% of accessibility issues vanish here.
2. **Keyboard Navigation** - Tab order, focus indicators, no keyboard traps. Test by unplugging your mouse.
3. **ARIA Only When Needed** - Native HTML first. Only add ARIA when semantic HTML can't express meaning.
4. **Testing** - Automated tools + manual screen reader testing (NVDA, VoiceOver) catch what code alone misses.

**When to use this skill:**
- Building forms, buttons, links, navigation menus
- Managing focus in modals, dropdowns, SPAs
- Implementing dynamic content updates (toasts, alerts, live regions)
- Writing alt text for images
- Ensuring keyboard-only navigation works
- Meeting WCAG 2.2 Level AA requirements
- Reviewing code for accessibility violations

## Semantic HTML Foundation

Semantic elements expose structure to assistive technologies through the **accessibility tree** - a parallel version of the DOM that screen readers read.

### Core Semantic Elements

```html
<!-- Page structure - landmarks screen readers use to skip content -->
<header>                    <!-- Page introduction, site logo -->
<nav>                       <!-- Navigation (multiple allowed) -->
<main>                      <!-- Primary content (only one per page) -->
<article>                   <!-- Self-contained content (blog post, comment) -->
<section>                   <!-- Thematic grouping of content -->
<aside>                     <!-- Tangentially related content (sidebar, related links) -->
<footer>                    <!-- Footer: metadata, copyright, links -->

<!-- Content organization -->
<h1-h6>                    <!-- Hierarchy: h1 is main heading, h2-h6 are subsections -->
<ul><li>                    <!-- Unordered list (bullets) -->
<ol><li>                    <!-- Ordered list (numbered) -->
<dl><dt><dd>                <!-- Definition list (term/definition pairs) -->

<!-- Form elements - all require labels -->
<label for="id">Label</label>
<input id="id" />
<button type="button|submit|reset">
<fieldset><legend>                <!-- Group related form fields -->

<!-- Media -->
<img alt="description" />   <!-- Always include alt, use "" for decorative -->
<figure><figcaption>        <!-- Caption for images, diagrams, charts -->
<table><thead><tbody><th>   <!-- Proper table semantics with headers -->
```

### Anti-Patterns That Break Accessibility

```html
<!-- ❌ WRONG: Div soup -->
<div onclick="handleClick()">
  <span>Click me</span>
</div>

<!-- ✅ RIGHT: Native button with automatic keyboard support -->
<button type="button">Click me</button>

<!-- ❌ WRONG: Fake button without keyboard support -->
<div role="button" tabindex="0">Submit</div>

<!-- ✅ RIGHT: Semantic submit button -->
<button type="submit">Submit</button>

<!-- ❌ WRONG: Anchor for action, button for navigation -->
<a href="#" onclick="deleteItem()">Delete</a>
<button onclick="window.location='/products'">Products</button>

<!-- ✅ RIGHT: Use button for actions, anchor for navigation -->
<button type="button" onclick="deleteItem()">Delete</button>
<a href="/products">Products</a>

<!-- ❌ WRONG: Broken heading hierarchy (jump from h1 to h3) -->
<h1>Page Title</h1>
<h3>Section</h3>

<!-- ✅ RIGHT: Sequential heading hierarchy -->
<h1>Page Title</h1>
<h2>Main Section</h2>
<h3>Subsection</h3>

<!-- ❌ WRONG: Form without label -->
<input type="email" placeholder="Email" />

<!-- ✅ RIGHT: Label associated with input -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- ❌ WRONG: Image with no alt text -->
<img src="chart.png" />

<!-- ✅ RIGHT: Descriptive alt text for informative images -->
<img src="chart.png" alt="Sales growth 45% YoY" />
```

### Heading Hierarchy Best Practice

```html
<!-- ✅ Correct structure -->
<h1>Main Page Heading</h1>
<p>Introductory content...</p>

<h2>First Major Section</h2>
<p>Content...</p>

<h3>Subsection of First Section</h3>
<p>Content...</p>

<h3>Another Subsection</h3>
<p>Content...</p>

<h2>Second Major Section</h2>
<p>Content...</p>

<!-- Screen reader announces: 
    Heading level 1: Main Page Heading
    Heading level 2: First Major Section
    (user can jump by heading level)
-->
```

### Forms: Complete Accessible Pattern

```html
<form novalidate>
  <!-- Required indicator, not just styled asterisk -->
  <div class="form-group">
    <label for="username">
      Username
      <span class="required" aria-label="required">*</span>
    </label>
    
    <!-- Instructions associated via aria-describedby -->
    <p id="username-help" class="form-help">
      3-20 characters, letters and numbers only
    </p>
    
    <input
      id="username"
      type="text"
      name="username"
      required
      aria-required="true"
      aria-describedby="username-help"
      aria-invalid="false"
    />
    
    <!-- Error shown when invalid, hidden initially -->
    <span 
      id="username-error" 
      class="error" 
      role="alert" 
      style="display:none;"
    >
      Username already taken
    </span>
  </div>

  <button type="submit">Create Account</button>
</form>

<script>
// On form submission, validate and show errors
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const input = document.getElementById('username');
  const error = document.getElementById('username-error');
  
  if (usernameIsTaken(input.value)) {
    // aria-invalid + error element + role="alert" announces to screen readers
    input.setAttribute('aria-invalid', 'true');
    error.style.display = 'block';
  }
});
</script>
```

## Keyboard Navigation

### Tab Order and tabindex

```html
<!-- ✅ Natural tab order: follows source code, no need for tabindex -->
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  <form>
    <input type="text" />           <!-- 1st to receive focus via Tab -->
    <button type="submit">Send</button>  <!-- 2nd -->
  </form>
  
  <button>Download</button>         <!-- 3rd -->
</main>

<!-- ❌ AVOID: Positive tabindex creates confusing custom order -->
<button tabindex="2">Second?</button>
<button tabindex="1">First?</button>
<button tabindex="3">Third?</button>
<!-- Screen readers still read top-to-bottom, confusing users -->

<!-- ✅ USE: tabindex="0" only for non-interactive elements you need focusable -->
<div tabindex="0" class="card">Interactive content area</div>

<!-- ✅ USE: tabindex="-1" to remove from tab order but allow programmatic focus -->
<div id="content" tabindex="-1">
  <!-- Dynamic content that gets focus after page transition -->
</div>

<!-- On route change, move focus to content -->
<script>
document.getElementById('content').focus();
</script>
```

### Focus Indicators: WCAG 2.2 Requirement

```css
/* ❌ NEVER remove focus outline without replacement - WCAG violation */
:focus { outline: none; }

/* ✅ CORRECT: Visible focus indicator for ALL focusable elements */
:focus-visible {
  outline: 2px solid #0174FE;
  outline-offset: 2px;
}

/* ✅ BETTER: Double-outline for contrast on any background */
:focus-visible {
  /* Inner light outline */
  outline: 2px solid white;
  outline-offset: 0;
  /* Outer dark outline via box-shadow */
  box-shadow: 0 0 0 4px #193146;
}

/* ✅ For buttons and form inputs with :focus (mouse users) */
:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* ✅ For keyboard-only focus with :focus-visible (keyboard users) */
:focus-visible {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px rgba(74, 144, 226, 0.25);
}

/* Min contrast: 3:1 between outline and background */
/* WCAG 2.2 - Focus Appearance (2.4.7, Enhanced in 2.2) */
```

### Skip Links: Let Users Skip Repetitive Content

```html
<!-- Hidden by default, visible on :focus -->
<style>
  .skip-to-content {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }
  
  .skip-to-content:focus {
    top: 0;
  }
</style>

<a href="#main-content" class="skip-to-content">
  Skip to main content
</a>

<header>
  <nav><!-- Navigation that repeats on every page --></nav>
</header>

<main id="main-content">
  <!-- User skipped header/nav and lands here via Shift+Tab -->
</main>
```

### Keyboard Traps: Prevent Focus Getting Stuck

```html
<!-- ❌ TRAP: Modal that captures Tab but doesn't cycle -->
<div class="modal">
  <button id="first">First Button</button>
  <input type="text" />
  <!-- User Tabs past input, focus leaves modal = trap! -->
</div>

<!-- ✅ FIX: Focus trap - last element wraps back to first -->
<div class="modal" role="dialog" aria-modal="true">
  <button id="first">First Button</button>
  <input type="text" />
  <button id="close">Close</button>
  
  <script>
    const modal = document.querySelector('.modal');
    const first = modal.querySelector('#first');
    const close = modal.querySelector('#close');
    
    // If focus on last element + Tab pressed, focus first
    close.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        first.focus();
      }
    });
    
    // If focus on first element + Shift+Tab pressed, focus last
    first.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        close.focus();
      }
    });
    
    // ESC key closes modal (standard pattern)
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  </script>
</div>
```

## ARIA: First Rule = Don't Use It

**The First Rule of ARIA:** *Do not use ARIA. Use native HTML instead.* This isn't sarcasm - ARIA is complex and error-prone.

### When ARIA is Actually Needed

```html
<!-- ✅ NEED ARIA: Disclosure button (native HTML can't express state) -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<ul id="menu" hidden>
  <li><a href="/products">Products</a></li>
  <li><a href="/about">About</a></li>
</ul>

<script>
  document.querySelector('button').addEventListener('click', () => {
    const isExpanded = document.querySelector('button')
      .getAttribute('aria-expanded') === 'true';
    
    document.querySelector('button')
      .setAttribute('aria-expanded', !isExpanded);
    document.querySelector('#menu')
      .hidden = isExpanded;
  });
</script>

<!-- ❌ DON'T: Use ARIA for things native HTML does -->
<div role="button" tabindex="0">               <!-- Just use <button> -->
<div role="link" onclick="...">                 <!-- Just use <a> -->
<span role="main">Content</span>                <!-- Just use <main> -->
<div role="heading" aria-level="1">Title</div> <!-- Just use <h1> -->
```

### Essential ARIA Attributes (Use These)

```html
<!-- aria-label: Accessible name when no visible text -->
<button aria-label="Close menu">✕</button>

<!-- aria-labelledby: Link element to visible label -->
<h2 id="dialog-title">Confirm Delete</h2>
<div role="alertdialog" aria-labelledby="dialog-title">
  Are you sure?
</div>

<!-- aria-describedby: Additional description -->
<input 
  type="password" 
  aria-describedby="pwd-hint"
/>
<p id="pwd-hint">8+ characters, must include numbers</p>

<!-- aria-expanded: Toggle state (disclosure, popover, menu) -->
<button aria-expanded="false" aria-controls="panel">
  Settings
</button>
<div id="panel" hidden>Settings content</div>

<!-- aria-hidden: Hide from screen readers (decorative elements) -->
<span aria-hidden="true">→</span> Next Page

<!-- aria-live: Announce dynamic content changes -->
<div aria-live="polite" aria-atomic="true">
  <p>Processing your request...</p>
</div>

<!-- aria-required / aria-invalid: Form validation states -->
<input 
  aria-required="true" 
  aria-invalid="false"
  aria-describedby="error"
/>
<span id="error" style="display:none;"></span>

<!-- aria-current: Highlight current page in navigation -->
<nav>
  <a href="/">Home</a>
  <a href="/products" aria-current="page">Products</a>
  <a href="/about">About</a>
</nav>
```

### Dynamic Content: ARIA Live Regions

```html
<!-- aria-live="polite": Announce updates when user is idle -->
<!-- Use for: notifications, status messages, search results loading -->
<div aria-live="polite" aria-atomic="true" id="results">
  <p>Ready to search</p>
</div>

<script>
  document.querySelector('input').addEventListener('input', async (e) => {
    const results = document.getElementById('results');
    results.textContent = 'Searching...'; // Announced after current action
    
    const data = await fetch(`/search?q=${e.target.value}`);
    results.textContent = `Found ${data.length} results`;
  });
</script>

<!-- aria-live="assertive": Interrupt and announce immediately -->
<!-- Use for: critical alerts, errors, time-sensitive info -->
<div aria-live="assertive" role="alert">
  <!-- Error automatically announced to screen readers -->
</div>

<!-- role="status": Shorthand for aria-live="polite" -->
<div role="status" aria-atomic="true">
  Upload complete: 5 files
</div>

<!-- role="alert": Shorthand for aria-live="assertive" -->
<div role="alert">
  Error: Payment failed. Try again.
</div>
```

## Component Patterns

### Accessible Button vs Link Decision

```html
<!-- USE <button> when clicking CHANGES PAGE STATE or PERFORMS ACTION -->
<button onclick="toggleMenu()">Menu</button>
<button onclick="deleteItem()">Delete</button>
<button type="submit">Submit Form</button>

<!-- Keyboard: Enter, Space, Tab to reach -->
<!-- Screen reader: "Button, Menu"                          -->

<!-- USE <a> when clicking NAVIGATES TO NEW URL or ROUTE -->
<a href="/products">Products</a>
<a href="/about">About</a>
<a href="https://example.com">External Site</a>

<!-- Keyboard: Enter, Tab to reach -->
<!-- Screen reader: "Link, Products"                        -->

<!-- Decision flowchart -->
Does it navigate to a URL? → Use <a>
Does it perform an action on current page? → Use <button>
Does it toggle state (expanded/collapsed)? → Use <button>
Does it submit/reset a form? → Use <button type="submit|reset">
```

### Accessible Images & Alt Text Decision Tree

```html
<!-- DECORATIVE: No information value, purely visual -->
<img src="decorative-line.svg" alt="" />
<!-- alt="" tells screen readers "skip this" -->

<!-- FUNCTIONAL: Image is clickable or has purpose -->
<!-- Use alt to describe what the link/button does -->
<a href="/home">
  <img src="home-icon.svg" alt="Home" />
</a>

<!-- INFORMATIVE: Conveys data or information -->
<!-- Brief, descriptive, no "Image of" prefix -->
<img 
  src="sales-chart.png" 
  alt="Sales increased 30% quarter-over-quarter"
/>

<!-- COMPLEX: Graph, diagram, chart with lots of data -->
<!-- Use alt for brief description, <figcaption> for details -->
<figure>
  <img src="complex-chart.png" alt="Revenue by region, 2024" />
  <figcaption>
    North America: $2.5M | Europe: $1.8M | Asia: $1.2M
  </figcaption>
</figure>

<!-- TEXT IN IMAGE: Avoid images of text. Use real HTML text instead -->
<!-- If you must use image, alt should repeat the text -->
<img src="tagline.png" alt="Your journey to digital excellence" />
```

### Accessible Forms

```html
<form>
  <!-- Every input needs a label -->
  <div class="form-group">
    <label for="email">Email Address</label>
    <input 
      id="email"
      type="email"
      name="email"
      required
      aria-required="true"
    />
  </div>

  <!-- Radio buttons: Group with fieldset/legend -->
  <fieldset>
    <legend>Shipping Method</legend>
    <label>
      <input type="radio" name="shipping" value="standard" />
      Standard (5-7 days)
    </label>
    <label>
      <input type="radio" name="shipping" value="express" />
      Express (2 days)
    </label>
  </fieldset>

  <!-- Checkboxes: Provide context -->
  <label>
    <input type="checkbox" name="terms" required />
    I agree to the <a href="/terms">terms and conditions</a>
  </label>

  <!-- Submit button - clear call-to-action -->
  <button type="submit">Create Account</button>
</form>
```

### Accessible Navigation

```html
<!-- Main navigation with proper semantics -->
<nav aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    
    <!-- Multi-level: Use disclosure button for submenu -->
    <li>
      <button 
        aria-expanded="false" 
        aria-controls="products-menu"
      >
        Products
        <span aria-hidden="true">▼</span>
      </button>
      <ul id="products-menu" hidden>
        <li><a href="/products/software">Software</a></li>
        <li><a href="/products/hardware">Hardware</a></li>
      </ul>
    </li>
    
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<script>
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !isExpanded);
      document.getElementById(btn.getAttribute('aria-controls')).hidden = isExpanded;
    });
    
    // Close on Escape (standard pattern)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        btn.setAttribute('aria-expanded', 'false');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
      }
    });
  });
</script>
```

### Accessible Modal Dialogs

```html
<div 
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  id="confirm-modal"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p>This action cannot be undone.</p>
  
  <button onclick="deleteItem()">Delete</button>
  <button onclick="closeModal()">Cancel</button>
</div>

<script>
  function openModal() {
    const modal = document.getElementById('confirm-modal');
    const backdrop = document.createElement('div');
    
    // Show modal and overlay
    modal.style.display = 'block';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    
    // Store previous focus to restore later
    window.previousFocus = document.activeElement;
    
    // Focus first interactive element
    modal.querySelector('button').focus();
    
    // Trap focus within modal (see Keyboard Traps section)
    modal.addEventListener('keydown', trapFocus);
  }
  
  function closeModal() {
    const modal = document.getElementById('confirm-modal');
    
    // Hide modal and restore scroll
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.querySelector('.modal-backdrop').remove();
    
    // Restore focus to triggering button
    window.previousFocus?.focus();
  }
</script>
```

## Focus Management in React

```typescript
import { useRef, useEffect } from 'react';

// Managing focus after route change (SPA)
export function useFocusOnMount() {
  const mainRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Announce page change to screen readers
    mainRef.current?.focus();
    
    // Announce page title if heading exists
    const heading = mainRef.current?.querySelector('h1');
    if (heading) {
      // Screen readers will announce: "Page title, heading level 1"
    }
  }, []); // Run once on mount
  
  return mainRef;
}

// Usage: After route change, focus moves to main content
export function ProductsPage() {
  const mainRef = useFocusOnMount();
  
  return (
    <main ref={mainRef} tabIndex={-1}>
      <h1>Products</h1>
      {/* Content */}
    </main>
  );
}

// Modal with focus trap
export function Modal({ isOpen, onClose, children }: any) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Store focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus modal and trap focus (using focus-trap-react library simplifies this)
    const firstButton = modalRef.current?.querySelector('button');
    firstButton?.focus();
    
    return () => {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      style={{ outline: 'none' }}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

// Announcing dynamic content (live region)
export function SearchResults({ query, results }: any) {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Update live region - screen reader announces changes
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 
        results.length > 0 
          ? `Found ${results.length} results for "${query}"`
          : `No results found for "${query}"`;
    }
  }, [results, query]);
  
  return (
    <div>
      {/* Hidden live region - announces to screen readers only */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ 
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />
      
      {/* Visible results */}
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## WCAG 2.2 Quick Reference

**Level A (Minimum):**
- Text alternatives for images (alt attribute)
- Keyboard accessible (all functionality available via keyboard)
- No seizure-inducing content (no flashing >3x/sec)
- Descriptive page titles and headings
- Focus visible when navigating

**Level AA (Standard target):**
- Color contrast 4.5:1 for normal text, 3:1 for large text (18pt+)
- Resizable text (except images of text)
- No reliance on color alone to convey meaning
- Labels for all form inputs
- Error messages identify the field and suggest correction
- Consistent navigation across pages
- Focus indicators (new in 2.2: minimum 2px, not obscured)

**New in WCAG 2.2:**
- **Focus Appearance (2.4.7 Enhanced):** Focus indicators visible, 3:1 contrast, not obscured
- **Target Size:** Buttons/links min 24×24px (or 24px height)
- **Dragging:** Alternatives to drag-and-drop (button actions)
- **Redundant Entry (3.3.7):** Don't make users re-enter same data
- **Consistent Help (3.2.6):** Help mechanisms in same location across pages

## Testing & Validation

### Automated Testing

```bash
# Using axe-core (catches ~30-50% of issues)
npm install --save-dev @axe-core/cli
axe https://example.com

# Browser DevTools: Lighthouse audit (built-in)
# DevTools → Lighthouse → Accessibility

# ESLint for React accessibility
npm install --save-dev eslint-plugin-jsx-a11y
# Config: "extends": ["plugin:jsx-a11y/recommended"]
```

### Manual Testing Checklist

```
Keyboard Navigation:
☐ Tab reaches all interactive elements
☐ Can reach and close modals without mouse
☐ No keyboard traps (can always move forward/back)
☐ Focus visible at all times (not disappearing)
☐ Tab order logical (matches visual layout)

Screen Reader (NVDA, VoiceOver):
☐ Page title announced on load
☐ Headings structure logical (h1 > h2 > h3)
☐ Form labels announced with inputs
☐ Buttons/links have meaningful text
☐ Images have descriptive alt text (or alt="")
☐ Dynamic content updates announced (live regions)
☐ Form errors described clearly
☐ Skip links work

Focus Management:
☐ Modal: focus trapped, ESC closes, focus restored
☐ SPA navigation: focus moved to main content
☐ Dropdown: focus remains in dropdown until closed
☐ Form submission: error message announced if invalid

Visual:
☐ 4.5:1 contrast for text on background
☐ No color-only information (red = error needs text too)
☐ Text resizes without horizontal scroll (up to 200%)
☐ Focus indicators 2px minimum, visible on all backgrounds
```

### Screen Reader Testing Basics

```
NVDA (Windows - Free):
- Download: https://www.nvaccess.org/
- Start NVDA + browser
- Browse with arrow keys, Tab for links/buttons
- Focus mode (NVDA+Space) when in form fields
- Review mode (NVDA+Numpad) to read everything

VoiceOver (Mac - Built-in):
- Cmd+F5 to toggle
- VO+U for rotor (navigate by heading, link, etc)
- VO = Control+Option by default
- VO+→/← for navigation

Testing with keyboard only:
- Unplug/disable mouse
- Tab to navigate, Enter/Space to activate
- Shift+Tab to go backward
- Arrow keys in dropdowns/menus
- Test on actual screen reader 2x per sprint minimum
```

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| **Missing alt text on images** | Every `<img>` needs `alt=""` (empty for decorative) or descriptive text |
| **Button is `<div onclick>`** | Use semantic `<button>` - handles keyboard automatically |
| **Focus outline removed** | Never do `:focus { outline: none; }` without replacement. Use `:focus-visible` instead. |
| **Form input without label** | Always pair with `<label for="id">` or wrap input in `<label>` |
| **Keyboard trap in modal** | Tab must cycle through elements, ESC must close |
| **Broken heading hierarchy** | h1 → h2 → h3 (no skipping levels like h1 → h3) |
| **Color-only error indication** | Add text to error messages, not just red styling |
| **Inaccessible dropdown** | Use `aria-expanded` + arrow key support (or semantic `<select>`) |
| **Auto-playing media** | Pause auto-play or provide mute button + controls |
| **ARIA on native element** | `role="button"` on `<div>` - just use `<button>` |
| **Multiple `<main>` elements** | Only one `<main>` per page |
| **Missing form error announcement** | Use `role="alert"` + `aria-describedby` on input |

## Best Practices Rationale

**Why semantic HTML first?**
- Screen readers read accessibility tree, not visual rendering
- Built-in keyboard support saves 100s of lines of JavaScript
- 40% smaller bundle than custom widgets with ARIA polyfills

**Why test with real assistive tech?**
- Automated tools catch ~50% of issues (parsing, structure, contrast)
- Manual testing + screen reader testing catches the other 50% (UX, complex interactions)
- ARIA is complex; one typo breaks everything

**Why WCAG 2.2 Level AA?**
- Legally required in many jurisdictions (EU, California, Canada)
- Covers 99% of disability use cases
- ROI: wider audience, better SEO, fewer lawsuits

## References

**Official Standards:**
- [WCAG 2.2 - Web Content Accessibility Guidelines](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices 1.2](https://www.w3.org/WAI/ARIA/apg/)
- [W3C WebAIM - Web Accessibility In Mind](https://webaim.org/)

**Tools & Testing:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated testing
- [NVDA Screen Reader](https://www.nvaccess.org/) - Free Windows screen reader
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into DevTools
- [WAVE Browser Extension](https://wave.webaim.org/extension/) - Visual accessibility audit

**React-Specific:**
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) - Catch React a11y issues
- [React Aria](https://react-spectrum.adobe.com/react-aria/) - Accessible component hooks
- [Headless UI](https://headlessui.com/) - Unstyled accessible components

**Learning:**
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/) - Community resources
- [Adrian Roselli's Blog](https://adrianroselli.com/) - Deep-dive accessibility patterns
- [Scott O'Hara's Accessibility Posts](https://www.scottohara.me/) - Component patterns
