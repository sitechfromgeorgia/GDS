---
name: skill-md-structure
description: Defines the exact structure, YAML frontmatter requirements, content guidelines, and quality checklist for creating SKILL.md files for AI coding agents. Use when creating Agent Skills, understanding the SKILL.md format, or building documentation for Claude Code, Cursor, and other AI agents.
---

# SKILL.md Structure Guide for AI Agent Skills

This document defines the exact structure and format for creating Agent Skills (SKILL.md files) for AI coding agents like Claude Code, Cursor, and others.

---

## Required File Structure

Every skill must be a **single SKILL.md file** with this structure:

```markdown
---
name: skill-name-here
description: Clear description of what this skill does and when to use it.
---

# Skill Title

[Markdown content with instructions]
```

---

## YAML Frontmatter (Required)

The file MUST start with YAML frontmatter between `---` markers:

### `name` field (required)
- **Max 64 characters**
- **Lowercase letters, numbers, and hyphens only**
- Use gerund form (verb + -ing): `processing-pdfs`, `analyzing-code`
- ❌ No spaces, underscores, or special characters
- ❌ Cannot contain: "anthropic", "claude"

### `description` field (required)
- **Max 1024 characters**
- **Must include WHAT it does AND WHEN to use it**
- Write in third person
- Include specific trigger keywords users would mention
- ❌ No XML tags

**Good description example:**
```yaml
description: Analyzes TypeScript code for type safety issues, suggests improvements, and enforces strict mode patterns. Use when reviewing TypeScript code, checking type definitions, or when the user mentions TypeScript, types, or type safety.
```

**Bad description example:**
```yaml
description: Helps with code
```

---

## Markdown Body Structure

After the frontmatter, write clear instructions in Markdown:

### Recommended Sections

```markdown
---
name: example-skill
description: [What it does] + [When to use it]
---

# Skill Title

## Quick Start
[Essential commands or code to get started immediately]

## When to Use This Skill
[Clear triggers and use cases]

## Instructions
[Step-by-step guidance, numbered if sequential]

## Code Examples
[Working, copy-paste ready examples]

## Best Practices
[Do's and don'ts with rationale]

## Common Errors & Solutions
[Troubleshooting guide]

## References
[Official documentation links]
```

---

## Content Guidelines

### Be Concise
- Claude is smart - don't explain what it already knows
- Challenge each paragraph: "Does this justify its token cost?"
- Keep SKILL.md body **under 500 lines**

### Be Specific
- Provide concrete examples, not abstract descriptions
- Include working code snippets
- Show input/output pairs when relevant

### Use Consistent Terminology
- Pick one term and use it throughout
- ✅ Always "API endpoint" (not mix of "URL", "route", "path")

### Avoid Time-Sensitive Information
- ❌ "If you're doing this before August 2025..."
- ✅ Use "Current method" and "Legacy method" sections

---

## Code Examples Format

Always provide working, copy-paste ready code:

```markdown
## Setup

Install dependencies:
```bash
npm install package-name
```

## Basic Usage

```typescript
import { Something } from 'package-name';

const result = Something.doThing({
  option: 'value'
});
```
```

---

## Complete SKILL.md Example

```markdown
---
name: typescript-strict-config
description: Configures TypeScript projects with strict type checking, optimal compiler settings, and modern best practices. Use when setting up new TypeScript projects, migrating to strict mode, or when the user mentions tsconfig, TypeScript configuration, or strict mode.
---

# TypeScript Strict Configuration

## Quick Start

Create `tsconfig.json` with strict settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  }
}
```

## When to Use

- Setting up new TypeScript projects
- Migrating JavaScript to TypeScript
- Enabling stricter type checking
- Configuring monorepo TypeScript settings

## Key Strict Mode Flags

| Flag | Purpose |
|------|---------|
| `strict` | Enables all strict type-checking options |
| `noUncheckedIndexedAccess` | Adds `undefined` to index signatures |
| `exactOptionalPropertyTypes` | Differentiates `undefined` from optional |
| `noImplicitReturns` | Ensures all code paths return |

## Common Patterns

### Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Next.js 15 Configuration

```json
{
  "extends": "next/core-web-vitals",
  "compilerOptions": {
    "strict": true,
    "plugins": [{ "name": "next" }]
  }
}
```

## Common Errors & Solutions

**Error: `Type 'X' is not assignable to type 'Y'`**
- Check for `null`/`undefined` handling
- Use type guards or optional chaining

**Error: `Object is possibly 'undefined'`**
- Add null checks before accessing properties
- Use `??` for default values

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
```

---

## Quality Checklist

Before finalizing a SKILL.md, verify:

- [ ] YAML frontmatter has `name` and `description`
- [ ] `name` is lowercase with hyphens only
- [ ] `description` includes WHAT + WHEN
- [ ] Body is under 500 lines
- [ ] Code examples are working and complete
- [ ] No time-sensitive information
- [ ] Consistent terminology throughout
- [ ] Quick Start section for immediate use
- [ ] Troubleshooting section included

---

## Output Requirements for Research

When creating a SKILL.md from research:

1. **Single file output** - Do not split into multiple files
2. **Complete and self-contained** - Include all necessary information
3. **Production-ready** - Code examples must work
4. **2024-2025 patterns** - Use current best practices
5. **Official sources cited** - Include documentation links

---

## Anti-Patterns to Avoid

❌ **Too verbose** - Explaining what Claude already knows
❌ **Vague descriptions** - "Helps with data"
❌ **Multiple options without recommendation** - "You can use A, B, C, or D..."
❌ **Windows paths** - Use `/` not `\`
❌ **Outdated patterns** - Always verify current best practices
❌ **Missing code examples** - Always include working code
❌ **No troubleshooting** - Always include common errors
