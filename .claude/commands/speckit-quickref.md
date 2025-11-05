---
description: Quick reference card for Speckit commands - print this or keep it handy
---

# Speckit Quick Reference Card

## 🚀 The 6-Step Workflow

```
1. /speckit.specify [description]  → Create specification
2. /speckit.clarify [topic]        → Resolve unclear requirements (optional)
3. /speckit.plan [notes]           → Generate technical plan
4. /speckit.checklist [type]       → Create quality checklists (optional)
5. /speckit.tasks                  → Generate task breakdown
6. /speckit.implement              → Execute implementation
```

---

## 📝 Command Cheat Sheet

### `/speckit.specify [feature description]`
**Purpose:** Create feature specification from natural language

**Example:**
```
/speckit.specify Build a podcast landing page with featured episodes
```

**Output:**
- New Git branch: `001-feature-name`
- `specs/001-feature-name/spec.md`
- `specs/001-feature-name/checklists/requirements.md`

**What it contains:**
- User stories with priorities (P1, P2, P3)
- Functional requirements
- Success criteria
- Edge cases
- Acceptance scenarios

---

### `/speckit.clarify [clarification topic]`
**Purpose:** Resolve [NEEDS CLARIFICATION] markers in spec

**When to use:**
- After `/speckit.specify` finds unclear requirements
- To add more detail or examples
- To explore edge cases

**Example:**
```
/speckit.clarify Focus on responsive design requirements
```

**What it does:**
- Presents clarifying questions with options
- Updates spec.md with resolved clarifications
- Re-validates specification quality

---

### `/speckit.plan [planning notes]`
**Purpose:** Generate technical implementation plan

**Example:**
```
/speckit.plan Use React with TypeScript, Tailwind CSS
```

**Output:**
- `specs/[feature]/plan.md` - Tech stack, architecture
- `specs/[feature]/data-model.md` - Database schema
- `specs/[feature]/contracts/` - API specifications
- `specs/[feature]/quickstart.md` - Integration examples
- Updated `.claude/context.md`

**What it decides:**
- Technology choices
- File structure
- Dependencies
- Integration patterns

---

### `/speckit.checklist [checklist type]`
**Purpose:** Create "unit tests for requirements" - validate requirement quality

**Common types:**
- `ux` - UX/UI requirement quality
- `api` - API requirement validation
- `security` - Security completeness
- `performance` - Performance clarity

**Example:**
```
/speckit.checklist Create a security checklist for authentication
```

**Output:**
- `specs/[feature]/checklists/[type].md`

**What it checks:**
- ✅ Are requirements complete?
- ✅ Are requirements clear and unambiguous?
- ✅ Are requirements consistent?
- ✅ Can requirements be measured/tested?
- ✅ Are edge cases addressed?

**Key principle:** Tests requirements, NOT implementation
- ❌ "Verify login works" (implementation test)
- ✅ "Are authentication requirements specified for all protected resources?" (requirement test)

---

### `/speckit.tasks [task notes]`
**Purpose:** Generate actionable, dependency-ordered task breakdown

**Example:**
```
/speckit.tasks Focus on implementing P1 user stories first
```

**Output:**
- `specs/[feature]/tasks.md`

**Task structure:**
```
Phase 1: Setup
  - [ ] T001 Initialize project structure

Phase 2: Foundational
  - [ ] T002 [P] Create database schema

Phase 3: User Story 1 (P1)
  - [ ] T003 [US1] Create User model in src/models/user.py
  - [ ] T004 [P] [US1] Implement UserService in src/services/user_service.py

Phase 4: User Story 2 (P2)
  ...

Phase N: Polish
  - [ ] T099 Update documentation
```

**Task format:**
- `T001` - Task ID (sequential)
- `[P]` - Parallelizable (optional)
- `[US1]` - User Story label (for story tasks)
- File path included

---

### `/speckit.implement [implementation notes]`
**Purpose:** Execute the implementation plan

**Example:**
```
/speckit.implement Start with setup phase and user story 1
```

**Prerequisites:**
- `tasks.md` must exist (run `/speckit.tasks` first)
- Checklists should be complete (warns if not)

**What it does:**
1. Checks all checklists (warns if incomplete)
2. Loads all design documents
3. Verifies/creates ignore files
4. Executes tasks phase-by-phase
5. Marks tasks as completed in tasks.md
6. Reports progress

**Execution order:**
- Setup → Tests → Core → Integration → Polish
- Respects dependencies and [P] markers
- Stops on errors for sequential tasks

---

### `/speckit.analyze [analysis focus]`
**Purpose:** Analyze existing specifications or implementations

**When to use:**
- Review quality of existing specs
- Identify gaps or inconsistencies
- Validate spec-implementation alignment

---

### `/speckit.constitution [updates]`
**Purpose:** Manage project constitution (core principles)

**What it defines:**
- Development principles
- Non-negotiable standards
- Architectural constraints
- Governance rules

**Location:** `.specify/memory/constitution.md`

---

## 📂 File Structure Reference

```
specs/
  001-feature-name/
    spec.md              # Feature specification (WHAT)
    plan.md              # Technical plan (HOW)
    tasks.md             # Task breakdown (WHEN)
    data-model.md        # Database entities
    research.md          # Technical decisions
    quickstart.md        # Integration examples
    contracts/           # API specifications
      api-spec.yaml
    checklists/          # Quality validation
      requirements.md    # Auto-generated
      ux.md             # Custom checklists
      security.md
```

---

## 🎯 Key Principles

### 1. Specifications Are Technology-Agnostic
- **spec.md** = WHAT and WHY (no tech details)
- **plan.md** = HOW and WITH WHAT (tech details)

### 2. Checklists Are "Unit Tests for Requirements"
- Test requirement quality, NOT implementation
- Check completeness, clarity, consistency

### 3. User Stories Drive Organization
- Tasks organized by priority (P1, P2, P3)
- Each story independently testable
- Enables incremental delivery

### 4. Tests Are Optional
- Only generated if explicitly requested
- Focus on contract tests for APIs

---

## 💡 Pro Tips

### Start Simple
```bash
/speckit.specify Add user authentication with email/password
/speckit.plan Use existing auth library
/speckit.tasks
/speckit.implement
```

### Full Workflow
```bash
/speckit.specify Build complex dashboard with analytics
/speckit.clarify Focus on data visualization requirements
/speckit.plan Use React, D3.js, PostgreSQL
/speckit.checklist Create UX and performance checklists
/speckit.tasks Break down by user story priority
/speckit.implement Start with P1 user story
```

### Parallel Development
```bash
# Tasks marked [P] can run simultaneously
# Speeds up implementation significantly
# Automatically identified by Speckit
```

### Incremental Delivery
```bash
# Implement P1 stories first (MVP)
# Then P2, P3, etc. (incremental features)
# Each story is independently testable
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "No feature description provided" | Provide clear description after command |
| "tasks.md not found" | Run `/speckit.tasks` before `/speckit.implement` |
| "Checklists incomplete" | Complete or acknowledge to proceed |
| Too many [NEEDS CLARIFICATION] | Use `/speckit.clarify` to resolve |

---

## 📚 Learn More

- **Full Guide:** [.claude/commands/speckit.md](.claude/commands/speckit.md)
- **Templates:** `.specify/templates/`
- **Scripts:** `.specify/scripts/powershell/`
- **Context:** [.claude/context.md](.claude/context.md)

---

## 🎓 Example Session

```bash
# User types:
/speckit.specify Build a podcast landing page with hero section, featured episodes grid, and responsive navigation

# Speckit creates:
# - Branch: 001-podcast-landing
# - specs/001-podcast-landing/spec.md (with user stories P1, P2, P3)
# - specs/001-podcast-landing/checklists/requirements.md

# User reviews spec, then:
/speckit.plan Use Next.js 15, React 19, Tailwind CSS, shadcn/ui

# Speckit creates:
# - specs/001-podcast-landing/plan.md (tech stack, architecture)
# - Updates .claude/context.md

# Optional quality check:
/speckit.checklist Create a UX checklist for responsive design

# User reviews, then:
/speckit.tasks

# Speckit creates:
# - specs/001-podcast-landing/tasks.md (17 tasks across 5 phases)

# Ready to code:
/speckit.implement

# Speckit executes all tasks, marking them complete
# Feature complete! 🎉
```

---

**Print this page and keep it handy for quick reference!**
