---
type: SKILL
title: Git Workflows for Teams
subtitle: Professional Branching, Commits, Reviews & Automation
version: "2025.01"
category: Development Operations
tags:
  - git
  - workflows
  - collaboration
  - ci-cd
  - conventions
difficulty: Intermediate
prerequisites:
  - Git basics (clone, commit, push, pull)
  - Terminal/command line proficiency
  - Basic understanding of branches
---

# Git Workflows for Teams: Complete Guide for AI Coding Agents

## Quick Reference

### Branching Strategy Decision Tree
```
Are you on a shared/public branch?
├─ YES → Use MERGE (safer, preserves history)
└─ NO → Use REBASE (local cleanup) then MERGE

How often do you release?
├─ Continuously (multiple per day) → GitHub Flow or Trunk-Based Development
├─ Regularly scheduled → Git Flow
└─ Multiple versions in production → Git Flow with hotfixes

Team size?
├─ < 5 people → GitHub Flow
├─ 5-20 people → Trunk-Based or simplified Git Flow
└─ 20+ people → Full Git Flow with clear hierarchies
```

### Commit Type Reference
```
feat:     New feature (MINOR version bump)
fix:      Bug fix (PATCH version bump)
feat!:    Breaking change (MAJOR version bump)
docs:     Documentation changes only
chore:    Build, CI, deps, no production code
refactor: Code restructure, no behavior change
style:    Formatting, missing semicolons, whitespace
test:     Add or fix tests
perf:     Performance improvements
```

### Branch Naming Quick Guide
```
feature/PROJ-123-user-authentication
bugfix/PROJ-456-null-pointer-exception
hotfix/PROJ-789-payment-timeout
release/v1.2.0
refactor/api-client-cleanup
docs/api-documentation-update
```

---

## 1. Core Concepts

### Understanding Branching Strategies

#### Git Flow (Enterprise, Scheduled Releases)
**Use when:** Multiple versions in production, scheduled releases, large distributed teams

**Branch structure:**
- `main` - Production-ready releases only
- `develop` - Integration branch for features
- `feature/*` - Individual feature work
- `release/*` - Release preparation
- `hotfix/*` - Urgent production fixes

**Workflow:**
```
Create feature from develop → develop is updated → feature merges to develop
                                    ↓
                            Feature testing & integration
                                    ↓
                            Create release branch
                                    ↓
                            Bug fixes, version bump, docs
                                    ↓
                            Release merged to main (with tag) AND back to develop
```

**Pros:** Clear structure, parallel release management, supports multiple versions  
**Cons:** More complex, longer-lived branches, more merge conflicts  
**Delivery speed:** 28% faster than ad-hoc (structured approach)

#### GitHub Flow (Startups, Continuous Deployment)
**Use when:** Continuous deployment, small teams, single production version

**Branch structure:**
- `main` - Production, always deployable
- `feature/*` - Feature branches (short-lived, max 1-2 days)

**Workflow:**
```
Create feature from main → Code & test → Pull request → Code review
                                            ↓
                                    Status checks pass
                                            ↓
                                    Merge to main
                                            ↓
                                    Auto-deploy to production
```

**Pros:** Simple, rapid deployment, fewer merge conflicts  
**Cons:** No staging period, requires strong tests, can't manage multiple versions  
**Best for:** Web apps with continuous updates, internal tools

#### Trunk-Based Development (High-Velocity, CI/CD)
**Use when:** CI/CD pipeline, microservices, teams practicing extreme ownership

**Branch structure:**
- `main` (the "trunk") - Always deployable
- `feature/*` - Branches exist < 1 day, usually feature flags hide incomplete work

**Workflow:**
```
Small commits to main daily → Feature flags hide in-progress work → Deploy frequently
                    ↓                           ↓
        Build always passes        Users see only complete features
```

**Pros:** Eliminates merge conflicts, fast feedback, simple history, forces discipline  
**Cons:** Requires mature CI/CD, strong testing culture, feature flag discipline  
**Delivery speed:** Supports multiple deployments per day

#### Hybrid Approach (Recommended for Most Teams)
**Rebase locally for cleanup + Merge publicly for safety**

This gives you the best of both worlds:
- Clean, linear feature history locally
- Preserved, safe integration history on main
- Easy to audit and debug

---

### Merge vs. Rebase: The Golden Rule

| Aspect | Merge | Rebase |
|--------|-------|--------|
| **History** | Preserves branching, shows integration points | Linear, clean sequence |
| **Safety** | Safe for shared branches, non-destructive | Rewrites history, breaks shared branches |
| **Conflict** | Resolve all at once | Resolve one commit at a time |
| **Readability** | More commits, harder to follow | Cleaner, easier `git log` |
| **When to use** | Always on `main` or shared branches | Only on local, private branches |

**The Golden Rule:** Never rebase a public/shared branch that others have pulled. This creates divergent histories that break teammate workflows.

**Best Practice:**
```bash
# On your local feature branch (before pushing)
git rebase origin/main          # Clean up your commits locally

# Then merge to main safely
git checkout main
git merge --no-ff feature/xyz   # Creates merge commit, preserves integration point
```

---

### Atomic Commits Explained

An atomic commit is a single logical unit of work that:
- **Stands alone** - Makes sense independently
- **Is complete** - Doesn't break the build
- **Is focused** - One reason to revert it
- **Is testable** - Tests pass both before and after

**Examples of atomic commits:**
```
✓ "feat(auth): Add OAuth2 provider support"       (one feature, one reason)
✓ "fix(api): Handle empty request payload"       (one bug, one fix)
✓ "refactor(db): Extract query builder to module" (one refactoring)
✓ "test(payment): Add edge case for zero amount" (one test improvement)

✗ "feat: Add OAuth, fix login bug, update docs"  (multiple reasons to revert)
✗ "WIP: Lots of stuff"                           (no clear purpose)
```

**Size guidance:**
- 10-100 lines is typical (not a hard rule)
- Should be reviewable in < 5 minutes
- Should serve one clear purpose

**Benefits:**
- `git bisect` pinpoints bugs instantly
- Easier code reviews and discussions
- Safer cherry-picks for hotfixes
- Cleaner history for understanding decisions

---

## 2. Commit Conventions & Messaging

### Conventional Commits Specification (Official Standard)

A standardized commit format that enables automated tooling, changelog generation, and semantic versioning.

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Complete Type Reference

| Type | When to Use | SemVer Impact | Example |
|------|------------|---------------|---------|
| `feat` | New feature | MINOR | `feat(auth): add two-factor authentication` |
| `fix` | Bug fix | PATCH | `fix(payment): correct currency rounding` |
| `feat!` or `BREAKING CHANGE` | Breaking change | MAJOR | `feat!: remove legacy API endpoint` |
| `docs` | Documentation only | None | `docs: update installation guide` |
| `style` | Formatting, semicolons, whitespace | None | `style: fix linter warnings` |
| `refactor` | Code restructure (no behavior change) | None | `refactor(core): extract service layer` |
| `perf` | Performance improvement | None | `perf(query): add database index` |
| `test` | Add/fix tests | None | `test(user): add edge case for empty name` |
| `chore` | Build, deps, CI config | None | `chore: upgrade Node.js to 20 LTS` |

### Commit Message Structure

**Good commit messages:**
```
feat(payment): add Stripe webhook handler

Add webhook endpoint to handle Stripe payment events.
Validates webhook signatures and processes refunds.

Closes #1234
```

**Breaking down:**
- `feat(payment)` - Type and scope
- `add Stripe webhook handler` - Short description (50 chars max, imperative mood)
- Empty line
- Body: Explains the "why" and "what" (not the "how")
- Empty line
- Footer: References issue, breaking changes, etc.

**Better message examples:**
```
fix(db): handle connection timeout gracefully

Previously, long-running queries would hang the connection pool.
Now we implement connection timeout with exponential backoff retry.
Connection pool automatically recovers after network flaky periods.

Fixes #567
Tested-by: @qa-team

---

docs: update API authentication examples

Add examples for JWT token refresh flow in API docs.
Include example for CORS headers for browser-based clients.

---

refactor(auth): simplify token validation logic

Extract validation logic to separate module for reusability.
Improves testability and reduces cyclomatic complexity from 8 to 4.

---

feat!: remove deprecated v1 REST API endpoints

BREAKING CHANGE: Removed /api/v1/* endpoints.
Clients must migrate to /api/v2/* endpoints.
Migration guide available at docs/migration-v1-to-v2.md

Refs: #2345
```

**Commit message anti-patterns:**
```
✗ "fix stuff"                  - Vague, no value
✗ "WIP: working on it"        - Incomplete, unclear purpose
✗ "asdfgh"                    - Not helpful
✗ "feat: fixed bug"           - Inconsistent with type
✗ "ADDED FEATURE X Y Z"       - All caps, run-on, no clarity
```

---

## 3. Branch Naming Conventions

### Standard Format

```
<type>/<ticket-id>-<description>

or

<type>/<description>
```

### Branch Type Prefixes

| Prefix | Purpose | Example | Lifetime |
|--------|---------|---------|----------|
| `feature/` | New functionality | `feature/PROJ-123-user-dashboard` | 1-3 days |
| `bugfix/` | Bug fix | `bugfix/PROJ-456-login-redirect` | 1-2 days |
| `hotfix/` | Urgent production fix | `hotfix/PROJ-789-payment-timeout` | < 1 day |
| `release/` | Release preparation | `release/v1.2.0` | Days to weeks |
| `refactor/` | Code cleanup | `refactor/api-client-extraction` | 1-2 days |
| `docs/` | Documentation | `docs/api-authentication-guide` | 1 day |
| `chore/` | Maintenance (deps, CI) | `chore/upgrade-eslint-v9` | 1 day |
| `test/` | Test improvements | `test/add-e2e-login-flow` | 1-2 days |

### Naming Rules

✓ **DO:**
- Use lowercase letters and hyphens
- Include ticket ID when available (e.g., `feature/JIRA-123-auth-modal`)
- Keep descriptions under 50 characters
- Use descriptive action verbs: `add`, `implement`, `fix`, `remove`, `update`, `refactor`

✗ **DON'T:**
- Use spaces, underscores, or uppercase
- Use bare numbers as the branch type prefix
- Create branches like `develop2`, `new_feature`, `feature1` (vague)
- Use special characters (except hyphens and slashes)

### Real-World Examples

```
feature/AUTH-101-implement-oauth2-google
feature/DASH-456-add-revenue-analytics-chart
bugfix/PERF-789-slow-customer-list-query
hotfix/CRITICAL-payment-gateway-timeout
release/v2.3.1
refactor/DATA-extract-cache-layer
docs/ONBOARD-developer-setup-guide
chore/INFRA-update-docker-node-version
test/COVERAGE-add-payment-validation-tests
```

---

## 4. Pre-Commit Hooks & Local Automation

### Why Pre-Commit Hooks?

Catch issues **before** they reach the repository:
- Prevent bad commits (linting, formatting errors)
- Enforce consistent code quality
- Detect accidentally committed secrets
- Run tests before pushing
- Reduce CI burden and PR review friction

### Husky + Lint-Staged Setup

**Step 1: Install Husky**
```bash
npm install husky --save-dev
npx husky-init && npm install
```

This creates `.husky/` directory and sets up Git hooks path.

**Step 2: Install Lint-Staged (to lint only changed files)**
```bash
npm install lint-staged --save-dev
```

**Step 3: Configure `.lintstagedrc.json`**
```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css,yml,yaml}": [
    "prettier --write"
  ]
}
```

**Step 4: Create Pre-Commit Hook**

Edit `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

lint-staged
```

**Step 5: Add NPM Script**

In `package.json`:
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### What Gets Checked

**By default in the above setup:**

| Tool | Checks | Prevents |
|------|--------|----------|
| ESLint | Code quality, unused vars, undefined refs | Logic errors, style violations |
| Prettier | Code formatting | Style inconsistencies |
| Run before commit | Changes only on staged files | Checking unrelated files |

### Example Configuration for Teams

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --max-warnings=0 --fix",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ],
  "*.{json,md,mdx,css,scss,html}": [
    "prettier --write"
  ],
  "*.{env,env.*}": [
    "eslint-plugin-dotenv"
  ]
}
```

### Advanced: Pre-Push Hook

Prevent pushing with failing tests:

`.husky/pre-push`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:ci
npm run lint
npm run build
```

### Debugging Hook Issues

**Hook not running?**
```bash
# Check hook permissions
ls -la .husky/

# Should be executable (-rwxr-xr-x)
chmod +x .husky/pre-commit
```

**Skip hook temporarily (dangerous):**
```bash
git commit --no-verify
```

**Clear hook cache:**
```bash
rm -f .git/index.lock
git gc --prune=now
```

---

## 5. Pull Request Best Practices

### PR Template (Create `.github/pull_request_template.md`)

```markdown
## Description
Brief summary of changes. What problem does this solve?

## Type of Change
- [ ] Feature (new functionality)
- [ ] Bug fix (non-breaking)
- [ ] Breaking change (new major version)
- [ ] Documentation update

## How to Test
Step-by-step instructions for manual testing:
1. ...
2. ...

## Testing Checklist
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors or warnings

## Code Quality Checklist
- [ ] Branch follows naming convention
- [ ] Commit messages follow Conventional Commits
- [ ] Code follows project style guide
- [ ] No debug code or console.log left
- [ ] No sensitive data committed (passwords, API keys)

## Documentation
- [ ] Updated README if needed
- [ ] Added/updated code comments
- [ ] Updated API docs (if applicable)

## Related Issues
Closes #123
Related to #456

## Additional Notes
Any context needed for reviewers?
```

### PR Size Guidelines

| PR Size | Review Time | Risk Level | Recommendation |
|---------|------------|-----------|-----------------|
| < 100 lines | < 10 min | Low | Ideal, merge ASAP |
| 100-400 lines | 10-30 min | Medium | Good, review same day |
| 400-800 lines | 30-60 min | Medium-High | Consider splitting |
| > 800 lines | 60+ min | High | **Split into multiple PRs** |

### Code Review Checklist for Reviewers

**Functionality & Correctness**
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled (empty, null, errors)
- [ ] No obvious bugs or logic errors
- [ ] Matches acceptance criteria

**Code Quality**
- [ ] Code is readable and maintainable
- [ ] Variable/function names are clear
- [ ] No duplicate code (DRY principle)
- [ ] Follows project conventions
- [ ] Comments are helpful (not obvious)

**Architecture & Design**
- [ ] Follows project architecture
- [ ] No tight coupling introduced
- [ ] Reusable components when appropriate
- [ ] Backwards compatible (unless breaking change marked)

**Testing**
- [ ] Tests are comprehensive (unit, integration)
- [ ] Tests cover happy path AND edge cases
- [ ] Test names are descriptive
- [ ] Coverage meets project minimum (usually 80%+)

**Security**
- [ ] No secrets committed (API keys, tokens)
- [ ] Input validation on user data
- [ ] No SQL injection or XSS vulnerabilities
- [ ] Authentication/authorization correct

**Performance**
- [ ] No obvious N+1 queries
- [ ] No large objects in loops
- [ ] Appropriate use of caching
- [ ] Loading indicators for async operations

### Review Feedback Tone

**Constructive approach (builds team):**
```
✓ "This function is getting long. Consider extracting 
   the validation logic to a separate function. 
   See how we did this in userValidator.js for reference."
```

**Unconstructive approach (creates tension):**
```
✗ "This function is bad. Split it up."
```

---

## 6. Implementation Guide: Setting Up Your Team Workflow

### For a New Project

**Step 1: Choose Your Strategy** (30 minutes)
```
Answer these questions:
1. How often will we release? (continuous vs. scheduled)
2. How many parallel versions do we support? (1 or multiple)
3. Team size? (small < 5 vs. large > 20)

→ Use decision tree in Quick Reference section
```

**Step 2: Create Repository Files** (30 minutes)

```bash
# Create branch protection rules file
echo "# GitHub Branch Protection Settings

Main Branch Rules:
- Require pull request reviews (minimum 1)
- Require status checks to pass
- Require branches to be up to date
- Require code review from code owners
- Dismiss stale pull request approvals
- Restrict who can push to main
" > docs/branch-protection.md

# Create .gitignore
# Use: https://github.com/github/gitignore
# Select templates for your tech stack
```

**Step 3: Set Up Pre-Commit Hooks** (15 minutes)
```bash
npm install husky lint-staged --save-dev
npx husky-init
# Then follow Husky setup section above
```

**Step 4: Document Conventions** (30 minutes)

Create `CONTRIBUTING.md`:
```markdown
# Contributing Guide

## Branching
- Use format: `<type>/<ticket-id>-<description>`
- See branch-naming-conventions.md

## Commits
- Follow Conventional Commits: https://www.conventionalcommits.org
- Use imperative mood ("add feature" not "added feature")
- Reference tickets: `Fixes #123`

## Pull Requests
- Use PR template (auto-generated)
- Keep < 400 lines when possible
- Request review from team members
- Wait for all checks to pass before merging

## Code Review
- Review within 24 hours
- Aim for constructive feedback
- Approve when changes are solid
- See code-review-checklist.md

## Releases
- Use semantic versioning: MAJOR.MINOR.PATCH
- Tag commits: `git tag v1.2.3`
- Generate changelog from conventional commits
```

**Step 5: Configure CI/CD** (1-2 hours)

Create `.github/workflows/pr-checks.yml`:
```yaml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm ci
      - run: npm run test:ci

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm ci
      - run: npm run build
```

### For an Existing Project

**Phase 1: Assessment** (1-2 weeks)
- Document current workflow (what people actually do)
- Identify pain points (merge conflicts, slow reviews, etc.)
- Audit branch naming consistency
- Check commit message quality

**Phase 2: Planning** (1 week)
- Choose new strategy (with team input)
- Draft CONTRIBUTING.md
- Design branch protection rules
- Plan migration strategy

**Phase 3: Implementation** (2-4 weeks)
- Set up pre-commit hooks
- Configure CI/CD
- Create documentation
- Train team (2-3 hours)
- Enforce gradually (enable checks one by one)

**Phase 4: Enforcement & Iteration** (ongoing)
- Monitor PR metrics (time-to-merge, review time)
- Adjust based on team feedback
- Regular retrospectives (monthly)

---

## 7. Semantic Versioning & Automated Releases

### Semantic Versioning Explained

```
MAJOR.MINOR.PATCH

1.0.0       Initial release
1.1.0       Added feature (backward-compatible)
1.1.1       Bug fix (backward-compatible)
2.0.0       Breaking change
2.0.1       Bug fix in v2
```

**Decision:**
- **MAJOR (X in X.0.0)**: Breaking changes (remove feature, change API)
- **MINOR (Y in 1.Y.0)**: New feature (backward-compatible)
- **PATCH (Z in 1.0.Z)**: Bug fix only

### Conventional Commits → Semantic Versioning

| Last Commit Type | Version Bump | Example |
|------------------|--------------|---------|
| `feat` | MINOR | 1.0.0 → 1.1.0 |
| `fix` | PATCH | 1.0.0 → 1.0.1 |
| `feat!` or `BREAKING CHANGE` | MAJOR | 1.0.0 → 2.0.0 |
| `docs`, `chore`, `style` | PATCH | 1.0.0 → 1.0.1 |

### Automating Releases with Semantic-Release

**Installation:**
```bash
npm install --save-dev semantic-release @semantic-release/github @semantic-release/changelog @semantic-release/git
```

**Configuration (`.releaserc.json`):**
```json
{
  "branches": ["main", "develop"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

**GitHub Actions workflow (`.github/workflows/release.yml`):**
```yaml
name: Semantic Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Result:** Automatically generates version tags and changelogs from conventional commits!

---

## 8. Troubleshooting & Common Issues

### Git Lock File Issues

**Error:** `fatal: Unable to write to .git/index.lock: File exists`

**Solution:**
```bash
# Check if Git process is still running
ps aux | grep git

# Remove lock file
rm -f .git/index.lock

# Verify repo health
git status
```

### Merge Conflicts

**Prevent:** Keep branches short-lived (< 1 day), rebase frequently from main

**Resolve manually:**
```bash
# After git pull or git merge fails
# Edit files with conflict markers:
# <<<<<<< HEAD
# your code
# =======
# their code
# >>>>>>> branch-name

# Fix conflicts, then:
git add .
git commit -m "resolve: merge conflicts from main"
git push
```

**Use merge tool:**
```bash
git mergetool  # Opens configured tool (VSCode, kdiff3, etc)
```

### Accidentally Committed Files

**Not pushed yet:**
```bash
git reset --soft HEAD~1    # Undo commit, keep changes
git reset README.md        # Unstage file
git commit -m "feat: new feature (without README)"
```

**Already pushed:**
```bash
# Option 1: Create new commit removing file
git rm --cached sensitive-file.env
echo "sensitive-file.env" >> .gitignore
git commit -m "fix: remove sensitive file from repo"
git push

# Option 2: Rewrite history (ONLY if not public)
git filter-branch --tree-filter 'rm -f sensitive-file.env' HEAD
git push --force-with-lease
```

### Deleted Branch Recovery

**Find deleted branch:**
```bash
git reflog  # Shows all commits you've visited
# Find the commit hash of deleted branch

# Restore branch
git checkout -b recovered-branch <commit-hash>
```

### Undoing Commits

| Scenario | Command | Effect |
|----------|---------|--------|
| Undo last commit, keep changes | `git reset --soft HEAD~1` | Unstage, working dir clean |
| Undo last commit, discard changes | `git reset --hard HEAD~1` | DANGEROUS, loses work |
| Undo published commit | `git revert <commit>` | Creates new commit undoing changes |
| Go back to specific commit | `git reset --hard <commit>` | DANGEROUS, loses work |

### Detached HEAD State

**Happens when:** You checkout a commit instead of a branch

**Fix:**
```bash
# Create new branch from current position
git branch my-feature-branch
git checkout my-feature-branch

# Or return to main
git checkout main
```

### Large File Issues

```bash
# Find large files
git rev-list --all --objects | \
  sed -n $(git rev-list --objects --all | \
  cut -f1 -d' ' | \
  git cat-file --batch-check | \
  grep blob | \
  sort -k 3 -n | \
  tail -10 | \
  while read hash type size; do \
    echo -n "-e s/$hash/$size/p "; \
  done) | \
  sort -k1 -n -r | head -20

# Remove from history (use with caution)
git filter-branch --tree-filter 'find . -size +100M -delete' HEAD
```

---

## 9. Configuration Files Examples

### `.gitignore` Template (Node.js + Web Project)

```bash
# Dependencies
node_modules/
vendor/
.venv/

# Build artifacts
dist/
build/
.next/
.nuxt/
out/

# Environment variables (IMPORTANT: NEVER commit these)
.env
.env.local
.env.*.local
.env.production.local

# IDE-specific files (use global config, not repo)
.vscode/settings.json
.idea/workspace.xml
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Testing coverage
coverage/
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*

# Temporary files
tmp/
temp/
*.tmp
```

### `.husky/pre-commit` Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
lint-staged

if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed"
  exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

### `.lintstagedrc.json` Configuration

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ],
  "*.{json,md,yml,yaml,css}": [
    "prettier --write"
  ],
  "*.ts(x)?": [
    "eslint",
    "prettier --write"
  ]
}
```

### `package.json` Scripts

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:ci": "jest --coverage --ci",
    "build": "tsc && webpack",
    "release": "semantic-release"
  },
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

---

## 10. Gold Standard Patterns (2025)

### Architecture for High-Velocity Teams

```
Repository Structure:
├── main              (production releases, always stable)
├── develop           (integration branch for features)
├── feature/*         (individual feature branches)
├── release/*         (release staging)
└── hotfix/*          (emergency production fixes)

CI/CD Pipeline:
PR created → Run linting, tests, build
            → Code review (auto-requests relevant reviewers)
            → Approved & all checks pass
            → Auto-merge with squash
            → Deploy to staging
            → Manual promotion to production

Workflow per commit:
"feat(auth): add SAML provider"
            ↓
         Lint passes
            ↓
      Tests pass (coverage > 80%)
            ↓
      Code review (< 24 hours)
            ↓
      Merge to develop
            ↓
      Release cut every Friday
            ↓
      Tag v1.2.3
            ↓
      Changelog auto-generated
            ↓
      Deploy to production
```

### Monorepo Pattern (Turborepo)

For teams with multiple applications/packages:

```json
{
  "turbo": {
    "tasks": {
      "build": {
        "outputs": ["dist/**"],
        "cache": false
      },
      "test": {
        "outputs": ["coverage/**"],
        "cache": false
      },
      "lint": {
        "outputs": [],
        "cache": true
      }
    }
  }
}
```

**Commands:**
```bash
# Build only affected packages
turbo run build --filter=...affected

# Run tests in parallel with caching
turbo run test

# CI optimization
turbo run build test lint --filter=...changed
```

### Feature Flags Pattern

Decouple releases from deployments:

```typescript
// feature-flags.ts
export const featureFlags = {
  newPaymentGateway: process.env.FEATURE_NEW_PAYMENT === 'true',
  betaUI: process.env.FEATURE_BETA_UI === 'true',
};

// In your code
if (featureFlags.newPaymentGateway) {
  // Use new payment system
} else {
  // Use legacy system
}

// Can toggle WITHOUT deploying (set env var)
```

**Benefit:** Merge incomplete features to main early, control release timing

---

## 11. Team Onboarding Checklist

Use this when adding new team members:

- [ ] Install Git locally and set name/email
- [ ] Clone repository
- [ ] Install Node.js and project dependencies
- [ ] Run `npm run prepare` to set up Husky hooks
- [ ] Read CONTRIBUTING.md thoroughly
- [ ] Review branch naming conventions
- [ ] Review Conventional Commits spec
- [ ] Create a small practice branch using correct naming
- [ ] Create practice PR with proper template
- [ ] Request review from senior team member
- [ ] Learn code review process (see checklist above)
- [ ] Learn how to resolve merge conflicts
- [ ] Practice undoing commits (`git reset`, `git revert`)
- [ ] Learn troubleshooting steps (common issues)
- [ ] Shadow one full release cycle
- [ ] Assigned to review other PRs with guidance
- [ ] Independently merge PR to main

---

## 12. Resources & References

### Official Documentation
- **Conventional Commits:** https://www.conventionalcommits.org/en/v1.0.0/
- **Git Official Docs:** https://git-scm.com/doc
- **GitHub Flow Guide:** https://guides.github.com/introduction/flow/
- **Semantic Versioning:** https://semver.org/

### Tools & Integrations
- **Semantic-release:** https://semantic-release.gitbook.io/semantic-release/
- **Husky (Git Hooks):** https://typicode.github.io/husky/
- **Lint-staged:** https://github.com/okonet/lint-staged
- **Commitlint:** https://commitlint.js.org/
- **Turborepo:** https://turborepo.com/ (monorepos)

### GitHub Resources
- **GitHub Gitignore Templates:** https://github.com/github/gitignore
- **GitHub Actions:** https://docs.github.com/en/actions
- **Branch Protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches

### Further Learning
- Interactive Git visualization: https://git-school.github.io/visualizing-git/
- Git Cheat Sheet: https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf
- Advanced Git: https://git-scm.com/book/en/v2

---

## Summary: Decision Matrix

| Question | Answer | Recommendation |
|----------|--------|-----------------|
| Multiple versions in production? | Yes | **Git Flow** |
| " | No | GitHub Flow or TBD |
| Team size > 10? | Yes | **Git Flow** (clearer structure) |
| " | No | GitHub Flow (simpler) |
| Deploy multiple times daily? | Yes | **Trunk-Based Dev** (feature flags) |
| " | No | GitHub Flow or Git Flow |
| Need clean linear history? | Yes | **Rebase locally, merge publicly** |
| " | No | Merge everywhere |
| First-time committers? | Yes | **Atomic commits, Conventional Commits** |
| CI/CD pipeline ready? | Yes | **Semantic-release**, **Husky hooks** |
| " | No | Manual process, plan automation |

---

**Document Version:** 2025.01  
**Last Updated:** January 20, 2026  
**Maintained By:** Development Team  
**Status:** Gold Standard (Production Ready)
