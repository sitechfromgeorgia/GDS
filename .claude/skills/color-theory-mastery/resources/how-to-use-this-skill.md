# How to Use Your Accessible Color Systems Skill

## 📌 Overview

You now have a production-ready **Agent Skill** for implementing accessible color systems. This guide explains how to use it with AI coding agents and teams.

---

## 🎯 What You Have

### Primary File: `implementing-accessible-color-systems.md`
This is your main Agent Skill - it's formatted specifically for AI coding agents (Claude Code, Cursor, etc.)

**Structure:**
- YAML frontmatter (machine-readable metadata)
- Quick Start section (immediate implementation)
- 11 comprehensive sections (theory → practice)
- 6 production-ready code examples
- 25+ tool references
- Best practices + troubleshooting

### Supporting Files
- **quick-reference-guide.md** — One-page lookup for developers
- **HOW_TO_USE_THIS_SKILL.md** — This file

---

## 🚀 How to Use With AI Agents

### Option 1: Direct Copy-Paste to AI Agent (Recommended)

```
1. Open implementing-accessible-color-systems.md
2. Copy entire content
3. Paste into Claude Code, Cursor, or AI tool
4. Ask: "Implement accessible colors for [my project]"
5. AI agent follows skill instructions
```

### Option 2: Reference in Prompt

```
"I'm building a design system with Tailwind CSS. 
Please follow the implementing-accessible-color-systems 
skill to ensure WCAG compliance..."
```

### Option 3: Load Into AI Context

Many AI tools support loading files directly:
- Claude Code: Upload SKILL.md file
- Cursor: Add to context window
- Custom LLM systems: Include in system prompt

---

## 💼 How to Use With Teams

### For Designers

**Use these sections:**
1. Color Psychology section
2. Semantic Color Token Architecture
3. Material Design 3 HCT System
4. Colorblind-Safe Palettes
5. Best Practices

**Workflow:**
```
1. Define brand colors using HCT principles
2. Generate semantic tokens (primary, error, success, etc.)
3. Test with Leonardo or Material Theme Builder
4. Validate with Color Oracle (CVD simulator)
5. Document in design system
```

### For Developers

**Use these sections:**
1. Quick Start (immediate implementation)
2. Semantic Color Token Architecture
3. Code Examples (copy-paste ready)
4. Tailwind CSS Setup
5. Testing & Automation

**Workflow:**
```
1. Copy semantic token structure
2. Set up CSS variables or Tailwind config
3. Implement in components
4. Integrate Pa11y or axe-core testing
5. Configure CI/CD pipeline
```

### For QA/Testers

**Use these sections:**
1. WCAG Contrast Requirements
2. Testing & Automation
3. Common Errors & Solutions
4. Tools & Resources

**Workflow:**
```
1. Run contrast checker on all color combinations
2. Test with CVD simulators (Coblis, Color Oracle)
3. Verify focus states with keyboard navigation
4. Test dark mode separately
5. Generate accessibility report
```

---

## 📋 Common Use Cases

### Use Case 1: Audit Existing Design System

**Goal:** Check if current colors are WCAG compliant

**Steps:**
1. Read: WCAG Contrast Requirements section
2. Use: WebAIM Contrast Checker tool (link provided)
3. Check: Every text + background combination
4. Verify: 4.5:1 minimum for normal text
5. Verify: 3:1 minimum for large text + UI components
6. Test: With Color Oracle for CVD safety
7. Document: Create accessibility report

**Expected Output:** List of violations + recommended fixes

---

### Use Case 2: Build New Design System

**Goal:** Create accessible, themed color system from scratch

**Steps:**

1. **Define Brand Colors**
   - Start with 2-3 primary colors
   - Use Material Theme Builder or Leonardo
   - Generate 10-shade ramp using HCT

2. **Create Semantic Tokens**
   - Copy 4-layer token structure from skill
   - Map to your brand colors
   - Add status colors (error, success, warning)
   - Add neutrals (text, background, surface)

3. **Implement in Code**
   - Use Tailwind config example (provided)
   - Or use CSS variables example (provided)
   - Both include dark mode

4. **Validate Contrast**
   - Run every text + background combo through checker
   - Target 4.5:1 minimum, 7:1 ideal
   - Verify dark mode separately

5. **Test Colorblind Safety**
   - Export colors to Color Oracle
   - View as protanopia, deuteranopia, tritanopia
   - Ensure no information is color-only
   - Add icons/patterns as reinforcement

6. **Automate Testing**
   - Copy GitHub Actions workflow
   - Set up Pa11y or axe-core
   - Make build fail on violations
   - Catch regressions early

---

### Use Case 3: Fix Accessibility Violations

**Goal:** Resolve specific color accessibility issues

**Steps:**

1. **Identify the Problem**
   - Check contrast ratio with WebAIM
   - Determine: text too light? background too light?
   - Note: Is it normal text or large text?

2. **Find Solution in Skill**
   - Go to "Common Errors & Solutions"
   - Match your problem to error type
   - Copy the provided solution code

3. **Implement Fix**
   - Darken text or lighten background
   - Verify new contrast ratio
   - Test in both light and dark modes
   - Test with CVD simulator

4. **Verify Resolution**
   - Re-run WebAIM Contrast Checker
   - Confirm 4.5:1 minimum (or 7:1 if AAA)
   - Commit to version control
   - Update design tokens

---

### Use Case 4: Implement Dark Mode

**Goal:** Add dark mode with guaranteed contrast

**Steps:**

1. **Understand the Pattern**
   - Read: Dark Mode Token Adaptation section
   - Learn: Tone-flipping mechanism
   - Study: HCT Tone Mapping

2. **Adapt Semantic Tokens**
   - Copy CSS dark mode example (provided)
   - Or use Tailwind dark: variants
   - Flip background (light ↔ dark)
   - Adjust text/colors to maintain tone difference

3. **Verify Contrast in Both Modes**
   - Test light mode: 4.5:1 minimum
   - Test dark mode: 4.5:1 minimum
   - Use WebAIM Contrast Checker for both
   - Verify focus indicators in both

4. **Test with Users**
   - Test with users who have CVD
   - Test with low-vision magnification (200%)
   - Test with screen readers
   - Get feedback on color legibility

---

### Use Case 5: Ensure Colorblind Safety

**Goal:** Guarantee design works for all CVD types

**Steps:**

1. **Review Palettes**
   - Avoid red-green combinations (never!)
   - Use blue as base color
   - Pair with orange, yellow, or brown
   - Reference: Safe Color Combinations section

2. **Copy Validated Palettes**
   - Use provided hex values (tested for all CVD)
   - Or generate in Leonardo tool
   - Or use Material Theme Builder

3. **Add Non-Color Cues**
   - Include icons alongside colors
   - Add text labels
   - Use patterns or borders
   - Example: Error with ⚠️ icon + "Error:" text

4. **Test with Simulators**
   - Load design in Color Oracle
   - View as protanopia (red-green 1)
   - View as deuteranopia (red-green 2)
   - View as tritanopia (blue-yellow, rare)
   - Verify all information is still clear

5. **Validate with Users**
   - Test with people who have CVD
   - Get specific feedback
   - Make adjustments
   - Document feedback

---

## 🔧 Recipes (Copy-Paste Templates)

### Recipe 1: Basic Semantic Tokens (CSS)

```css
:root {
  /* Primitive tokens - raw colors */
  --blue-600: #2563eb;
  --red-500: #ef4444;
  --green-600: #059669;
  
  /* Semantic tokens - mapped to meaning */
  --color-primary: var(--blue-600);
  --color-primary-hover: #1d4ed8;
  --color-error: var(--red-500);
  --color-error-bg: #fee2e2;
  --color-success: var(--green-600);
  --color-success-bg: #d1fae5;
  
  /* State tokens */
  --color-focus-ring: rgba(37, 99, 235, 0.4);
  --color-border: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;
    --color-primary-hover: #3b82f6;
    --color-error: #f87171;
    --color-success: #6ee7b7;
  }
}
```

### Recipe 2: Tailwind Semantic Colors

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        error: 'var(--color-error)',
        'error-bg': 'var(--color-error-bg)',
        success: 'var(--color-success)',
        'focus-ring': 'var(--color-focus-ring)',
      }
    }
  }
};
```

### Recipe 3: Accessible Button

```html
<button class="
  bg-primary hover:bg-primary-hover
  text-white
  focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring
  focus:outline-none
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-150
">
  Click me
</button>
```

### Recipe 4: Contrast Check (JavaScript)

```javascript
import chroma from 'chroma-js';

function checkContrast(textColor, bgColor) {
  const ratio = chroma.contrast(textColor, bgColor);
  
  if (ratio >= 7) return { level: 'AAA', ratio };
  if (ratio >= 4.5) return { level: 'AA', ratio };
  if (ratio >= 3) return { level: 'UI', ratio };
  return { level: 'FAIL', ratio };
}

// Usage
console.log(checkContrast('#000000', '#ffffff')); 
// { level: 'AAA', ratio: 21 }
```

### Recipe 5: Dark Mode Variables

```css
/* Automatic dark mode detection + flipping */
:root {
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    
    /* Flip all tone values */
    --bg-light: #111827;        /* was #ffffff */
    --text-dark: #f3f4f6;       /* was #1f2937 */
    --primary-bright: #60a5fa;  /* was #2563eb */
  }
}
```

---

## ✅ Quick Implementation Checklist

### For Existing Project (1-2 hours)

- [ ] Read Quick Start section (5 min)
- [ ] Copy semantic token structure (10 min)
- [ ] Set up in code (CSS or Tailwind) (15 min)
- [ ] Test contrast with WebAIM checker (15 min)
- [ ] Verify with Color Oracle (CVD simulator) (10 min)
- [ ] Add focus indicators (5 min)
- [ ] Document changes (5 min)

**Result:** Basic WCAG AA compliance

### For New Design System (1-2 days)

- [ ] Define brand colors (2 hours)
- [ ] Create 10-shade ramps (HCT or Leonardo) (2 hours)
- [ ] Design semantic tokens (2 hours)
- [ ] Implement in code (Tailwind/CSS) (2 hours)
- [ ] Set up dark mode (1 hour)
- [ ] Configure testing (Pa11y/axe-core) (1 hour)
- [ ] Validate all combinations (2 hours)
- [ ] Team training (1 hour)

**Result:** Production-ready accessible design system

### For Ongoing Maintenance (Weekly)

- [ ] Run automated tests in CI/CD
- [ ] Review new color combinations for compliance
- [ ] Update tokens if design changes
- [ ] Monitor accessibility score in Lighthouse
- [ ] Test new features with CVD simulator

---

## 🎓 Learning Resources

### For Beginners
1. Start: Quick Start section
2. Learn: Color Psychology section
3. Understand: WCAG Contrast Requirements
4. Practice: Copy Recipe 1 (Basic Semantic Tokens)

### For Intermediate
1. Understand: Semantic Token Architecture
2. Implement: Copy Recipe 2 (Tailwind Setup)
3. Test: Use WebAIM Contrast Checker
4. Advance: Add dark mode (Recipe 5)

### For Advanced
1. Study: Material Design 3 HCT System
2. Build: Implement Leonardo or Material Theme Builder
3. Automate: Copy GitHub Actions workflow
4. Optimize: Create fully adaptive theme system

---

## 🔗 Key Links Quick Access

### Immediate Use (First 5 minutes)
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Oracle (CVD simulator): https://colororacle.org/

### For Implementation (First hour)
- Leonardo (color system): https://leonardocolor.io/
- Tailwind CSS Docs: https://tailwindcss.com/
- Color.js Library: https://colorjs.io/

### For Testing (Setup phase)
- axe DevTools: https://www.deque.com/axe/devtools/
- Lighthouse: Chrome DevTools → Lighthouse
- Pa11y: https://pa11y.org/

### For Learning (Ongoing)
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Material Design 3: https://m3.material.io/

---

## 🆘 Troubleshooting

### Problem: "Contrast checker says 4.2:1 - does it pass?"
**Answer:** No. AA requires 4.5:1 minimum. Even 4.49:1 fails. Darken text or lighten background.

### Problem: "Red and green work great in my design, why can't I use them?"
**Answer:** 8% of users (especially males) can't distinguish red from green. Use blue + orange instead. Always test with Color Oracle simulator.

### Problem: "My dark mode has no contrast with my light mode token values"
**Answer:** Don't use same color values in dark mode. Flip the tone: light backgrounds become dark, dark text becomes light. See Recipe 5.

### Problem: "Should I use WCAG 2.1 or 2.2?"
**Answer:** Use WCAG 2.2 (current, 2024). It includes all 2.1 requirements plus new criteria for status messages and focus.

### Problem: "How do I know if I meet AAA?"
**Answer:** Target 7:1 for normal text, 4.5:1 for large text. Verify with WebAIM Contrast Checker set to "WCAG AAA" level.

---

## 📞 Getting Help

### If you need to:

**Understand WCAG basics**
→ Read: WCAG Contrast Requirements section
→ Reference: W3C Specification link

**Fix contrast violations**
→ Go to: Common Errors & Solutions
→ Use: WebAIM Contrast Checker

**Design for colorblindness**
→ Read: Color Vision Deficiency section
→ Use: Color Oracle simulator
→ Reference: Safe Color Combinations

**Set up tokens in code**
→ Copy: Recipe 1 or 2
→ Reference: Tailwind or CSS section

**Automate testing**
→ Copy: GitHub Actions workflow
→ Reference: Testing & Automation section

---

## ✨ Pro Tips

1. **Start with tokens** → Don't hardcode colors
2. **Test early** → Use WebAIM before committing
3. **Test often** → Check both light AND dark modes
4. **Verify with users** → Include people with CVD
5. **Automate everything** → Catch regressions in CI/CD
6. **Document your choices** → Why you picked each color
7. **Use HCT for new systems** → Guarantees contrast mathematically
8. **Dark mode from day one** → Don't add it later

---

## 🚀 Next Steps

1. **Choose your path:**
   - Use immediately: Copy Recipe 1 (CSS tokens)
   - Learn first: Read Color Psychology section
   - Build system: Follow "New Design System" checklist

2. **Set up tools:**
   - Install: axe DevTools browser extension
   - Bookmark: WebAIM Contrast Checker
   - Download: Color Oracle simulator

3. **Implement:**
   - Copy template from skill file
   - Adapt to your brand colors
   - Test with contrast checker
   - Validate with CVD simulator
   - Integrate testing in CI/CD

4. **Share with team:**
   - Send them quick-reference-guide.md
   - Point to specific recipes they need
   - Set team standards using this skill
   - Train on semantic tokens concept

---

**You're ready! Your comprehensive color accessibility skill is ready for use. Start with Recipe 1, validate with WebAIM, and deploy with confidence.**

**Questions?** Every answer is in implementing-accessible-color-systems.md - the skill contains comprehensive guidance covering every scenario.
