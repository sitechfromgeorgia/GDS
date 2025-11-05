---
description: Quick reference guide for using Speckit feature development workflow
---

# Speckit Workflow Guide

**Speckit** is a comprehensive feature specification and implementation management system that helps you build features systematically from idea to implementation.

## 🚀 Quick Start

### Typical Workflow

1. **Specify** → Create feature specification from idea
2. **Clarify** → Resolve any unclear requirements (optional)
3. **Plan** → Generate technical implementation plan
4. **Checklist** → Create quality validation checklists (optional)
5. **Tasks** → Break down into executable tasks
6. **Implement** → Execute the implementation plan

## 📝 Available Commands

### `/speckit.specify [feature description]`
Creates a feature specification from natural language description.

**What it does:**
- Generates a new Git branch for the feature
- Creates spec.md with user stories, requirements, and success criteria
- Validates specification quality with automated checklist
- Identifies any areas needing clarification

**Example:**
```
/speckit.specify Add user authentication with email/password login
```

**Output:**
- New branch: `001-user-auth`
- File: `specs/001-user-auth/spec.md`
- Checklist: `specs/001-user-auth/checklists/requirements.md`

---

### `/speckit.clarify [clarification topic]`
Resolves unclear requirements identified in the specification.

**When to use:**
- After `/speckit.specify` if [NEEDS CLARIFICATION] markers exist
- When requirements need more detail or examples
- To explore edge cases or alternative approaches

**What it does:**
- Analyzes the specification for ambiguities
- Generates clarifying questions with suggested answers
- Updates spec.md with resolved clarifications
- Re-validates specification quality

---

### `/speckit.plan [planning notes]`
Generates technical implementation plan from the specification.

**What it does:**
- Creates plan.md with tech stack, architecture decisions
- Generates data-model.md if entities are involved
- Creates API contracts in contracts/ directory
- Generates quickstart.md for integration examples
- Updates agent context files (e.g., .claude/context.md)

**Output:**
- `specs/[feature]/plan.md` - Technical plan
- `specs/[feature]/data-model.md` - Database schema
- `specs/[feature]/contracts/` - API specifications
- `specs/[feature]/research.md` - Technical decisions

---

### `/speckit.checklist [checklist type]`
Generates custom quality validation checklists.

**What it does:**
- Creates "unit tests for requirements" - validates requirement quality
- Checks completeness, clarity, consistency of specifications
- NOT for testing implementation - for testing requirement quality

**Checklist types:**
- `ux` - UX/UI requirement quality checks
- `api` - API requirement quality validation
- `security` - Security requirement completeness
- `performance` - Performance requirement clarity
- Custom types based on your needs

**Example:**
```
/speckit.checklist Create a security checklist focused on authentication and data protection
```

**Key principle:** Checklists validate requirements, not implementations:
- ✅ "Are authentication requirements specified for all protected resources?"
- ❌ "Verify login page accepts email/password" (this is implementation testing)

---

### `/speckit.tasks [task generation notes]`
Generates actionable, dependency-ordered task breakdown.

**What it does:**
- Organizes tasks by user story priority (P1, P2, P3)
- Creates independent, testable increments
- Identifies parallel execution opportunities
- Maps tasks to specific files and components

**Output:**
- `specs/[feature]/tasks.md` with phases:
  - Phase 1: Setup (project initialization)
  - Phase 2: Foundational (blocking prerequisites)
  - Phase 3+: User Stories (P1, P2, P3 in priority order)
  - Final Phase: Polish & cross-cutting concerns

**Task format:**
```
- [ ] T001 [P] [US1] Create User model in src/models/user.py
```
- `T001` - Task ID
- `[P]` - Parallelizable (optional)
- `[US1]` - User Story 1 (for story tasks)
- File path included

---

### `/speckit.implement [implementation notes]`
Executes the implementation plan by processing tasks.md.

**What it does:**
- Checks all checklists are complete (warns if not)
- Loads all design documents (spec, plan, tasks, contracts, etc.)
- Verifies/creates ignore files (.gitignore, .dockerignore, etc.)
- Executes tasks phase-by-phase in dependency order
- Follows TDD approach if tests are included
- Marks tasks as completed in tasks.md

**Prerequisites:**
- `tasks.md` must exist (run `/speckit.tasks` first)
- All checklists should be complete (optional but recommended)

**Execution flow:**
1. Setup → Tests → Core → Integration → Polish
2. Respects dependencies and parallel markers [P]
3. Stops on errors for sequential tasks
4. Reports progress after each task

---

### `/speckit.analyze [analysis focus]`
Analyzes existing specifications or implementations.

**When to use:**
- To review quality of existing specifications
- To identify gaps or inconsistencies
- To validate alignment between spec and implementation

---

### `/speckit.constitution [constitution updates]`
Manages project constitution (core principles and constraints).

**What it does:**
- Defines core development principles
- Establishes non-negotiable standards
- Documents architectural constraints
- Provides governance rules

**Location:** `.specify/memory/constitution.md`

---

## 📂 File Structure

When you use Speckit, it creates this structure:

```
specs/
  001-feature-name/
    spec.md              # Feature specification
    plan.md              # Technical implementation plan
    tasks.md             # Task breakdown
    data-model.md        # Database entities (if applicable)
    research.md          # Technical decisions (if needed)
    quickstart.md        # Integration examples
    contracts/           # API specifications
      api-spec.yaml
      service-contract.json
    checklists/          # Quality validation checklists
      requirements.md
      ux.md
      security.md
```

---

## 💡 Best Practices

### 1. Start Simple, Iterate
- Begin with a basic specification
- Use `/speckit.clarify` to refine unclear areas
- Don't try to specify everything upfront

### 2. Use Checklists Wisely
- Create checklists to validate requirement quality
- Focus on completeness, clarity, and consistency
- Remember: checklists test requirements, not implementation

### 3. Organize by User Story
- Tasks organized by priority (P1, P2, P3)
- Each story should be independently testable
- Implement stories incrementally (MVP first)

### 4. Leverage Parallel Execution
- Tasks marked with [P] can run simultaneously
- Speeds up implementation significantly
- Automatically identified by Speckit

### 5. Keep Context Updated
- Speckit updates agent context automatically
- Review `.claude/context.md` periodically
- Add manual notes between markers if needed

---

## 🔄 Example End-to-End Workflow

```bash
# 1. Create specification
/speckit.specify Build a podcast landing page with featured episodes and navigation

# 2. Clarify if needed (if [NEEDS CLARIFICATION] markers exist)
/speckit.clarify Focus on responsive design requirements

# 3. Generate implementation plan
/speckit.plan Use React with TypeScript, Tailwind CSS

# 4. Create quality checklists (optional)
/speckit.checklist Create a UX checklist for responsive design and accessibility

# 5. Generate task breakdown
/speckit.tasks Focus on implementing P1 user stories first

# 6. Execute implementation
/speckit.implement Start with setup phase and user story 1
```

---

## 🎯 Key Principles

### Specifications Are Technology-Agnostic
- Focus on WHAT and WHY, not HOW
- No frameworks, languages, or implementation details in spec.md
- Written for business stakeholders, not just developers

### Checklists Are "Unit Tests for Requirements"
- Validate quality of requirements themselves
- NOT for testing if implementation works
- Check completeness, clarity, consistency, measurability

### User Stories Drive Organization
- Tasks organized by user story priority
- Each story is independently testable
- Enables incremental delivery and MVP approach

### Tests Are Optional
- Only generate tests if explicitly requested
- TDD approach available if specified
- Focus on contract tests for APIs

---

## 📚 Additional Resources

- Templates: `.specify/templates/`
- Scripts: `.specify/scripts/powershell/`
- Constitution: `.specify/memory/constitution.md`
- Agent Context: `.claude/context.md`

---

## 🚨 Common Issues

**Issue:** "No feature description provided"
**Solution:** Provide a clear feature description after the command

**Issue:** "tasks.md not found"
**Solution:** Run `/speckit.tasks` before `/speckit.implement`

**Issue:** "Checklists incomplete"
**Solution:** Complete checklists or acknowledge to proceed anyway

**Issue:** Too many [NEEDS CLARIFICATION] markers
**Solution:** Use `/speckit.clarify` to resolve, or Speckit will make informed guesses

---

## 🎓 Learning Resources

**For more details on each command:**
- Read individual command files in `.claude/commands/speckit.*.md`
- Review templates in `.specify/templates/`
- Check example specifications in `specs/` (if any exist)

**Philosophy:**
Speckit follows a systematic approach:
1. Understand what users need (specify)
2. Clarify ambiguities (clarify)
3. Design the technical solution (plan)
4. Validate quality (checklist)
5. Break into actionable tasks (tasks)
6. Execute systematically (implement)

This ensures features are well-thought-out, properly scoped, and systematically implemented.
