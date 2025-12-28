# 🤖 Claude-ის სამუშაო გარემო | Claude Code System Documentation

> **ქართული სადისტრიბუციო სისტემა** | Complete guide to working with Claude in this Georgian Distribution Management System

**ბოლო განახლება:** 2025-11-28
**ვერსია:** 3.0.0
**სისტემა:** Georgian Distribution Management System (Next.js 15.5.6 + React 19.2.0 + Supabase)
**Branch:** `001-postgres-opt` (PostgreSQL Production Optimization)
**მთავარი Branch:** `main`
**სტატუსი:** ✅ **Phase 2 Complete** - 10-Phase Comprehensive Testing Passed (222+ Tests)

**🎉 მიღწევები:** 117 Agents + 187 Commands = **304 ხელსაწყო!**

---

## 📖 სწრაფი ნავიგაცია | Quick Navigation

| **მე მინდა...** | **გადადი აქ** | **დრო** |
|-----------------|---------------|---------|
| 🚀 სწრაფი დაწყება (პირველად) | [5 წუთიანი სტარტი](#-5-წუთი-სწრაფი-დაწყება) | 5 წთ |
| 🎯 კონკრეტული ამოცანის გაკეთება | [მე მინდა... სცენარები](#-მე-მინდა-სცენარები) | 2 წთ |
| 🗺️ რომელი ხელსაწყო გამოვიყენო? | [Decision Trees](#-decision-trees) | 3 წთ |
| 📁 ფაილების სტრუქტურა | [Directory Map](#-directory-structure) | 5 წთ |
| 🎓 Skills გაიდი | [Skills Reference](#-skills-18-სპეციალიზებული-აგენტი) | 10 წთ |
| 🤖 Agents სრული სია | [117 Agents](#-agents-117-სპეციალიზებული-subagent) | 15 წთ |
| 🛠️ Commands ინსტრუქციები | [Commands Guide](#-commands-13-ბრძანება) | 10 წთ |
| ⚡ Commands სრული სია | [187 Commands](#-commands-სრული-187-ბრძანება) | 20 წთ |
| 💻 კოდის მაგალითები | [Code Examples](#-კოდის-მაგალითები) | 5 წთ |
| 🐛 პრობლემის მოგვარება | [Troubleshooting](#-troubleshooting-guide) | 10 წთ |
| 📚 სრული დოკუმენტაცია | [ყველაფერი](#-სრული-მოცულობა) | 60 წთ |

---

## 🚀 5 წუთი: სწრაფი დაწყება

### თუ პირველად მუშაობ ამ სისტემაში:

```
1️⃣ წაიკითხე 3 მთავარი ფაილი (10 წთ):
   ├─ .claude/instructions.md    → რა არის ეს პროექტი?
   ├─ .claude/context.md          → რა სტატუსია ახლა?
   └─ .claude/architecture.md     → როგორ აშენებულია სისტემა?

2️⃣ გაიგე სისტემის სპეციფიკა (5 წთ):
   🇬🇪 ქართული B2B კვების დისტრიბუცია
   📱 Next.js 15 + React 19 + Supabase
   🎭 4 როლი: Admin, Restaurant, Driver, Demo
   🔄 Real-time orders + PWA + offline support

3️⃣ დაიწყე მუშაობა (2 წთ):
   → იპოვე შენი ამოცანა: [მე მინდა...](#-მე-მინდა-სცენარები)
   → გამოიყენე სწორი Skill: [Decision Tree](#-decision-trees)
   → დაიწყე კოდინგი!
```

### ⚡ Ultra-Quick Reference (30 წამი):

```bash
# 📊 სტატისტიკა:
117 Agents + 187 Commands = 304 ხელსაწყო

# ყველაზე ხშირი Commands:
/write-tests         # ტესტების დაწერა
/deploy              # production deploy
/optimize            # performance optimization
/refactor-code       # კოდის refactoring

# TOP Agents (Task tool-ით):
nextjs-app-router-developer    # Next.js 15 specialist
typescript-expert              # TypeScript advanced
database-optimization          # DB performance
debugger                       # Bug fixing

# ყველაზე გამოყენებადი Skills (პროექტი):
intelligent-debugger           # bug-ების მოგვარება
nextjs-supabase-saas-planner  # feature planning
code-quality-guardian          # code review
```

---

## 🎯 მე მინდა... სცენარები

### 🔧 Development ამოცანები

#### ✅ **მინდა ახალი feature-ის დამატება**
```bash
1. /speckit.specify "თქვენი feature აღწერა"
2. git checkout -b 00X-feature-name
3. დაიწყე მუშაობა: .claude/workflows/feature-development.md
4. გამოიყენე Skill: nextjs-supabase-saas-planner
```

#### 🐛 **მინდა bug-ის გამოსწორება**
```bash
1. გამოიყენე Skill: intelligent-debugger
2. მიჰყევი: .claude/workflows/bug-fixing.md
3. გაიარე 7-ნაბიჯიანი debugging პროცესი
4. დოკუმენტაცია: შექმენი postmortem
```

#### 🏗️ **მინდა database schema-ს შეცვლა**
```bash
1. გამოიყენე Skill: database-schema-architect
2. წაიკითხე: .claude/knowledge/database-schema.md
3. შექმენი migration: database/migrations/
4. გატესტე RLS policies: .claude/rules/database-guidelines.md
```

#### 🎨 **მინდა UI component-ის შექმნა**
```bash
1. გამოიყენე Skill: modern-ui-designer
2. shadcn/ui components: ui.shadcn.com
3. მიჰყევი: .claude/rules/coding-standards.md
4. Mobile-first design: .claude/knowledge/mobile-optimization.md
```

#### ⚡ **მინდა performance-ის გაუმჯობესება**
```bash
1. გამოიყენე Skill: technical-seo-specialist
2. წაიკითხე: .claude/knowledge/realtime-optimization-summary.md
3. გაუშვი: python .claude/skills/intelligent-debugger/scripts/performance_check.py
4. Core Web Vitals: .claude/skills/technical-seo-specialist/references/CORE_WEB_VITALS_GUIDE.md
```

### 🚀 Deployment ამოცანები

#### 📦 **მინდა production-ზე deploy**
```bash
1. წაიკითხე: .claude/commands/deploy.md
2. გაუშვი pre-deploy checklist:
   npm test && npm run type-check && npm run build
3. Dockploy (auto): git push origin main
4. Monitor: https://dockploy.greenland77.ge + Sentry
```

#### 🧪 **მინდა ტესტების გაშვება**
```bash
# ყველა ტესტი
cd frontend && npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# კონკრეტული ფაილი
npm test -- useFeatures.test.ts
```

### 📚 Research ამოცანები

#### 🔍 **მინდა რაღაცის გაგება codebase-ში**
```bash
# გამოიყენე Task tool with Explore subagent
"Find where client errors are handled"
"What is the codebase structure?"
"How do API endpoints work?"
```

#### 📖 **მინდა documentation-ის მოძებნა**
```bash
# Library docs
MCP Context7: resolve და get library docs

# Supabase docs
MCP Supabase: search_docs("რაც გჭირდება")

# Sentry docs
MCP Sentry: search_docs("რაც გჭირდება")
```

---

## 🗺️ Decision Trees

### 🤔 რომელი Skill გამოვიყენო?

```
📋 რა ტიპის ამოცანაა?
│
├─ 🐛 Bug / Error / შეცდომა?
│  └─→ intelligent-debugger
│
├─ 🏗️ ახალი Feature planning?
│  ├─→ saas-architect (general SaaS)
│  ├─→ nextjs-supabase-saas-planner (Next.js specific)
│  └─→ feature-impact-analyzer (prioritization)
│
├─ 💻 Code Quality / Review?
│  └─→ code-quality-guardian
│
├─ 🗄️ Database / Schema?
│  └─→ database-schema-architect
│
├─ 🎨 UI/UX Design?
│  ├─→ modern-ui-designer (desktop)
│  └─→ mobile-first-designer (mobile/PWA)
│
├─ 🔌 API Integration?
│  └─→ api-integration-specialist
│
├─ 📊 Analytics / Tracking?
│  └─→ product-analytics-integrator
│
├─ 🚀 Deployment / CI/CD?
│  └─→ deployment-automation
│
├─ 📈 SEO / Performance?
│  └─→ technical-seo-specialist
│
├─ 💰 Conversion Optimization?
│  └─→ conversion-optimization-expert
│
└─ 🏛️ System Architecture?
   └─→ system-architecture-advisor
```

### 🛠️ რომელი Command გავუშვა?

```
🎯 რა გინდა გააკეთო?
│
├─ 🚀 პირველად setup?
│  └─→ /dev-setup
│
├─ ✨ ახალი feature specification?
│  ├─→ /speckit.specify [description]
│  ├─→ /speckit.clarify [topic]
│  ├─→ /speckit.plan [notes]
│  ├─→ /speckit.tasks [notes]
│  └─→ /speckit.implement [notes]
│
├─ 🧪 Testing?
│  ├─→ /write-tests (generate tests)
│  ├─→ /test-coverage (check coverage)
│  ├─→ /test-feature (feature testing)
│  └─→ /run-ci (CI checks)
│
├─ 🔧 Code Quality?
│  ├─→ /refactor-code (refactoring)
│  ├─→ /optimize (performance)
│  ├─→ /code-review (review)
│  └─→ /clean (fix linting)
│
├─ 📦 Deployment?
│  ├─→ /deploy (production)
│  ├─→ /prepare-release (release prep)
│  └─→ /rollback-deploy (rollback)
│
├─ 🗄️ Database?
│  ├─→ /create-database-migrations
│  ├─→ /optimize-database-performance
│  └─→ /design-database-schema
│
├─ 🔐 Security?
│  ├─→ /security-audit
│  └─→ /security-hardening
│
├─ 🏗️ Architecture?
│  ├─→ /architecture-review
│  └─→ /performance-audit
│
└─ 📖 სრული სია?
   └─→ იხილე [Commands სრული 187](#-commands-სრული-187-ბრძანება)
```

> **💡 სულ 187 Command!** იხილე სრული დოკუმენტაცია [აქ](#-commands-სრული-187-ბრძანება)

### 📂 სად ვიპოვო ინფორმაცია?

```
🔍 რა გჭირდება?
│
├─ 📋 პროექტის overview?
│  └─→ .claude/instructions.md
│
├─ 📊 მიმდინარე status?
│  └─→ .claude/context.md
│
├─ 🏗️ არქიტექტურა?
│  └─→ .claude/architecture.md
│
├─ 🎓 Skill გაიდი?
│  └─→ .claude/skills/{skill-name}/SKILL.md
│
├─ 🗄️ Database schema?
│  └─→ .claude/knowledge/database-schema.md
│
├─ 👥 User roles?
│  └─→ .claude/knowledge/user-roles.md
│
├─ 📏 Coding standards?
│  └─→ .claude/rules/coding-standards.md
│
├─ 🔐 Security requirements?
│  └─→ .claude/rules/security-requirements.md
│
├─ ❓ Common questions?
│  └─→ .claude/knowledge/answers/
│
└─ 📋 Feature workflow?
   └─→ .claude/workflows/{workflow-name}.md
```

---

## 📁 Directory Structure

### 🌳 Complete .claude Folder Map

```
.claude/
├── 📄 instructions.md              ← პროექტის მთავარი გაიდი (READ FIRST!)
├── 📄 context.md                   ← მიმდინარე სტატუსი (ყოველთვის ახალი)
├── 📄 architecture.md              ← სისტემის არქიტექტურა
├── ⚙️ settings.local.json          ← Permissions + MCP config
│
├── 📂 commands/                    ← 13 Command (slash commands)
│   ├── dev-setup.md               → Development გარემოს setup
│   ├── test-feature.md            → Feature testing
│   ├── deploy.md                  → Production deployment
│   ├── speckit.md                 → Speckit main guide ⭐
│   ├── speckit-quickref.md        → Quick reference
│   ├── speckit.analyze.md         → Spec analysis
│   ├── speckit.checklist.md       → Validation checklists
│   ├── speckit.clarify.md         → Requirements clarification
│   ├── speckit.constitution.md    → Project constitution
│   ├── speckit.implement.md       → Implementation
│   ├── speckit.plan.md            → Technical planning
│   ├── speckit.specify.md         → Feature specification
│   └── speckit.tasks.md           → Task breakdown
│
├── 📂 skills/                      ← 18 Specialized Skills ⭐⭐⭐
│   │
│   ├── 🔧 Development Skills (5)
│   │   ├── intelligent-debugger/              ← ყველაზე მნიშვნელოვანი!
│   │   │   ├── SKILL.md                       → 7-step debugging process
│   │   │   ├── references/
│   │   │   │   ├── DEBUGGING_PATTERNS.md
│   │   │   │   ├── ERROR_CODES.md
│   │   │   │   ├── PERFORMANCE_GUIDE.md
│   │   │   │   ├── DATABASE_DEBUGGING.md
│   │   │   │   └── FRONTEND_DEBUGGING.md
│   │   │   └── scripts/
│   │   │       ├── log_analyzer.py
│   │   │       ├── performance_check.py
│   │   │       ├── stack_trace_parser.py
│   │   │       ├── error_frequency.py
│   │   │       └── dependency_checker.py
│   │   │
│   │   ├── code-quality-guardian/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       ├── REFACTORING_CATALOG.md
│   │   │       ├── SECURITY_PATTERNS.md
│   │   │       └── TYPESCRIPT_ADVANCED.md
│   │   │
│   │   ├── database-schema-architect/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   │   ├── DATA_TYPES_REFERENCE.md
│   │   │   │   ├── GDPR_COMPLIANCE.md
│   │   │   │   ├── NORMALIZATION_GUIDE.md
│   │   │   │   └── SECURITY_BEST_PRACTICES.md
│   │   │   ├── scripts/
│   │   │   │   ├── index_analyzer.py
│   │   │   │   ├── migration_generator.py
│   │   │   │   └── schema_validator.py
│   │   │   └── assets/
│   │   │       ├── migration_template.sql
│   │   │       └── audit_log_setup.sql
│   │   │
│   │   ├── system-architecture-advisor/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       ├── DATABASE_PATTERNS.md
│   │   │       ├── MICROSERVICES_PATTERNS.md
│   │   │       └── SECURITY_PATTERNS.md
│   │   │
│   │   └── api-integration-specialist/
│   │       ├── SKILL.md
│   │       ├── references/
│   │       │   ├── AUTHENTICATION_PATTERNS.md
│   │       │   ├── ERROR_CODES.md
│   │       │   └── RATE_LIMITING.md
│   │       └── scripts/
│   │           ├── test_api_health.py
│   │           └── validate_api_spec.py
│   │
│   ├── 🎨 Design Skills (3)
│   │   ├── mobile-first-designer/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   │   ├── CORE_WEB_VITALS.md
│   │   │   │   └── PWA_GUIDE.md
│   │   │   └── scripts/
│   │   │       ├── check_touch_targets.py
│   │   │       └── validate_mobile_first.py
│   │   │
│   │   ├── modern-ui-designer/
│   │   │   ├── SKILL.md
│   │   │   └── SETUP_GUIDE.md
│   │   │
│   │   └── user-feedback-interpreter/
│   │       ├── SKILL.md
│   │       ├── references/
│   │       │   ├── ANALYSIS_METHODS.md
│   │       │   ├── THEME_TAXONOMY.md
│   │       │   └── REPORT_TEMPLATES.md
│   │       ├── scripts/
│   │       │   └── sentiment_analyzer.py
│   │       └── assets/
│   │           └── feedback_template.csv
│   │
│   ├── 🚀 Product Skills (5)
│   │   ├── saas-architect/                     ← SaaS core!
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   │   ├── RLS_PATTERNS.md
│   │   │   │   └── STRIPE_PATTERNS.md
│   │   │   └── scripts/
│   │   │       └── validate-schema.js
│   │   │
│   │   ├── nextjs-supabase-saas-planner/       ← ამ stack-ისთვის!
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       ├── AUTHENTICATION_PATTERNS.md
│   │   │       └── BILLING_PATTERNS.md
│   │   │
│   │   ├── saas-launch-planner/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       ├── COMMON_MISTAKES.md
│   │   │       ├── PRD_TEMPLATE.md
│   │   │       ├── PRICING_STRATEGIES.md
│   │   │       └── TECHNICAL_ARCHITECTURE.md
│   │   │
│   │   ├── feature-impact-analyzer/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   │   ├── FRAMEWORK_GUIDE.md
│   │   │   │   └── KPI_MAPPING.md
│   │   │   ├── scripts/
│   │   │   │   ├── calculate_rice.py
│   │   │   │   └── calculate_ice.py
│   │   │   └── assets/
│   │   │       ├── example_rice_features.csv
│   │   │       ├── example_ice_features.csv
│   │   │       └── prioritization_template.md
│   │   │
│   │   └── idea-validator-pro/
│   │       ├── SKILL.md
│   │       ├── references/
│   │       │   ├── RED_FLAGS.md
│   │       │   ├── RESEARCH_SOURCES.md
│   │       │   └── VALIDATION_FRAMEWORKS.md
│   │       └── scripts/
│   │           └── demand_analyzer.py
│   │
│   └── 📈 Optimization Skills (5)
│       ├── conversion-optimization-expert/
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── AB_TEST_FRAMEWORK.md
│       │   └── scripts/
│       │       └── cro_calculator.py
│       │
│       ├── technical-seo-specialist/
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   ├── CORE_WEB_VITALS_GUIDE.md
│       │   │   ├── SCHEMA_TEMPLATES.md
│       │   │   └── TROUBLESHOOTING.md
│       │   ├── scripts/
│       │   │   └── seo-audit.py
│       │   └── assets/
│       │       └── audit-checklist-template.md
│       │
│       ├── product-analytics-integrator/
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   ├── PLATFORM_COMPARISON.md
│       │   │   └── TRACKING_PLAN_TEMPLATE.md
│       │   └── scripts/
│       │       ├── example_events.json
│       │       └── validate_events.py
│       │
│       ├── deployment-automation/
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   ├── CANARY_DEPLOYMENTS.md
│       │   │   ├── ROLLBACK_STRATEGIES.md
│       │   │   ├── SECURITY_BEST_PRACTICES.md
│       │   │   ├── VERCEL_ADVANCED.md
│       │   │   └── RAILWAY_ADVANCED.md
│       │   └── scripts/
│       │       ├── health-check.sh
│       │       ├── smoke-test.sh
│       │       └── setup-secrets.sh
│       │
│       └── prompt-optimization/
│           ├── SKILL.md
│           └── references/
│               ├── bug-fix-example.md
│               ├── data-analysis-example.md
│               └── website-build-example.md
│
├── 📂 knowledge/                   ← Knowledge Base (35+ articles)
│   ├── 📄 database-schema.md       → Database tables & RLS
│   ├── 📄 user-roles.md            → Admin, Restaurant, Driver, Demo
│   ├── 📄 technology-stack.md      → Tech stack overview
│   ├── 📄 order-workflow.md        → Order lifecycle
│   ├── 📄 pwa-implementation.md    → PWA setup
│   ├── 📄 realtime-architecture.md → WebSocket system
│   ├── 📄 mobile-optimization.md   → Mobile patterns
│   ├── 📄 analytics-guide.md       → Analytics dashboard
│   ├── 📄 week2-progress.md        → Week 2 achievements
│   ├── 📄 week3-4-progress.md      → Week 3-4 progress
│   │
│   └── 📂 answers/                 ← FAQ (15+ Q&A)
│       ├── 00-INDEX-README.md
│       ├── 01-supabase-invalid-api-key-errors.md
│       ├── 02-verify-api-keys-validity.md
│       ├── 03-retrieve-api-keys-dashboard.md
│       ├── 04-check-project-pause-billing.md
│       ├── 05-supabase-2025-best-practices.md
│       ├── 06-programmatic-health-check.md
│       ├── 07-schema-verification-methods.md
│       ├── 08-nextjs15-supabase-best-practices-2025.md
│       ├── supabase-free-tier-pause-guide-2025.md
│       ├── quick-test.js
│       └── supabase-diagnostic.js
│
├── 📂 rules/                       ← Development Standards (4)
│   ├── 📄 coding-standards.md      → TypeScript, React, Next.js patterns
│   ├── 📄 security-requirements.md → Auth, validation, encryption
│   ├── 📄 database-guidelines.md   → RLS, migrations, indexing
│   └── 📄 testing-guidelines.md    → Vitest, E2E, coverage
│
├── 📂 workflows/                   ← Development Workflows (4)
│   ├── 📄 feature-development.md   → Complete feature workflow
│   ├── 📄 bug-fixing.md            → Systematic bug resolution
│   ├── 📄 deployment.md            → Production deployment
│   └── 📄 testing.md               → Testing strategy
│
└── 📂 integrations/                ← External Services (3)
    ├── 📄 mcp-servers.md           → 9 MCP server configs
    ├── 📄 supabase.md              → Supabase integration
    └── 📄 sentry.md                → Sentry error tracking
```

---

## 🎓 Skills: 18 სპეციალიზებული აგენტი

### Tier 1: Development (ყველაზე ხშირად გამოყენებადი)

#### ⭐⭐⭐ **intelligent-debugger**
**როდის:** Bug, error, crash, performance issue, stack trace
**რა აკეთებს:** 7-ნაბიჯიანი systematic debugging
**ფაილები:**
- `skills/intelligent-debugger/SKILL.md` - Main guide
- `references/DEBUGGING_PATTERNS.md` - Debug patterns
- `references/ERROR_CODES.md` - Error code reference
- `references/PERFORMANCE_GUIDE.md` - Performance debugging
- `scripts/log_analyzer.py` - Log analysis script

**მაგალითი:**
```bash
# გამოიყენე როცა:
- აქვს რაღაც შეცდომა/error
- პროდუქციაში crash
- Performance slow-ია
- Stack trace არ გესმის
```

#### ⭐⭐ **code-quality-guardian**
**როდის:** Code review, refactoring, quality improvement
**რა აკეთებს:** Best practices enforcement, security patterns
**ფაილები:**
- `references/REFACTORING_CATALOG.md` - Refactoring patterns
- `references/SECURITY_PATTERNS.md` - Security checks
- `references/TYPESCRIPT_ADVANCED.md` - TypeScript patterns

#### ⭐⭐ **database-schema-architect**
**როდის:** Database schema, migrations, RLS policies
**რა აკეთებს:** Schema design, index optimization, migration generation
**ფაილები:**
- `references/NORMALIZATION_GUIDE.md`
- `references/SECURITY_BEST_PRACTICES.md`
- `scripts/index_analyzer.py`
- `scripts/migration_generator.py`
- `assets/migration_template.sql`

#### ⭐ **system-architecture-advisor**
**როდის:** System design, scalability, architecture decisions
**რა აკეთებს:** High-level architecture planning

#### ⭐ **api-integration-specialist**
**როდის:** External API integration, error handling
**რა აკეთებს:** API design, authentication, rate limiting

### Tier 2: Design & UX

#### **mobile-first-designer**
**როდის:** Mobile optimization, PWA, responsive design
**რა აკეთებს:** Mobile patterns, touch targets, performance
**ფაილები:**
- `references/PWA_GUIDE.md`
- `references/CORE_WEB_VITALS.md`
- `scripts/check_touch_targets.py`

#### **modern-ui-designer**
**როდის:** UI components, design system, shadcn/ui
**რა აკეთებს:** 2025 UI patterns, Tailwind CSS

#### **user-feedback-interpreter**
**როდის:** UX research, feedback analysis
**რა აკეთებს:** Sentiment analysis, theme identification

### Tier 3: Product & SaaS

#### ⭐⭐⭐ **saas-architect**
**როდის:** SaaS features, multi-tenant, subscription
**რა აკეთებს:** Complete SaaS architecture
**ფაილები:**
- `references/RLS_PATTERNS.md` - Multi-tenant patterns
- `references/STRIPE_PATTERNS.md` - Subscription billing

#### ⭐⭐⭐ **nextjs-supabase-saas-planner**
**როდის:** Next.js + Supabase specific planning
**რა აკეთებს:** Stack-specific architecture
**ფაილები:**
- `references/AUTHENTICATION_PATTERNS.md`
- `references/BILLING_PATTERNS.md`

#### ⭐ **saas-launch-planner**
**როდის:** Product launch, pricing, go-to-market
**რა აკეთებს:** Launch strategy, PRD creation

#### ⭐ **feature-impact-analyzer**
**როდის:** Feature prioritization, RICE/ICE scoring
**რა აკეთებს:** Impact analysis, prioritization
**ფაილები:**
- `scripts/calculate_rice.py`
- `scripts/calculate_ice.py`
- `assets/prioritization_template.md`

#### **idea-validator-pro**
**როდის:** New idea validation, market research
**რა აკეთებს:** Feasibility analysis, market validation

### Tier 4: Optimization

#### **conversion-optimization-expert**
**როდის:** CRO, A/B testing, conversion funnels
**რა აკეთებს:** Conversion analysis, test planning

#### **technical-seo-specialist**
**როდის:** SEO, Core Web Vitals, performance
**რა აკეთებს:** SEO audit, performance optimization

#### **product-analytics-integrator**
**როდის:** Analytics setup, event tracking
**რა აკეთებს:** Tracking plan, event validation

#### **deployment-automation**
**როდის:** CI/CD, deployment, rollback
**რა აკეთებს:** Deployment automation, health checks

#### **prompt-optimization**
**როდის:** AI prompt engineering
**რა აკეთებს:** Prompt quality improvement

---

## 🤖 Agents: 117 სპეციალიზებული Subagent

> **ახალი!** Claude Code-ს ახლა აქვს **117 სპეციალიზებული agent** სხვადასხვა ამოცანებისთვის!

### 📊 კატეგორიები

**სულ 117 Agent დაყოფილია 10 კატეგორიაში:**

```
🔧 Development & Architecture (25)      → Backend, Frontend, Database
💻 Language Specialists (15)            → TypeScript, Python, Go, etc.
🎨 Design & UX (8)                      → UI/UX, Mobile-First
📊 Data & Analytics (10)                → Data Science, BI, Analytics
🚀 DevOps & Infrastructure (12)         → CI/CD, Docker, Kubernetes
🔐 Security & Testing (8)               → Security, QA, Testing
💼 Business & Product (12)              → Product, Marketing, Sales
🔗 Integrations (10)                    → APIs, Payments, Auth
📝 Content & Documentation (7)          → Technical Writing, Docs
🎯 Specialized Tools (10)               → MCP, Blockchain, AI
```

### 🌟 TOP 20 Agents შენი პროექტისთვის

#### 🔥 Must-Use (იდეალური შენი Stack-ისთვის):

| Agent | Category | Use Case |
|-------|----------|----------|
| **nextjs-app-router-developer** ⭐⭐⭐ | Development | Next.js 15 + App Router expert |
| **typescript-expert** ⭐⭐⭐ | Language | Advanced TypeScript patterns |
| **database-optimization** ⭐⭐⭐ | Data | Query & index optimization |
| **react-performance-optimization** ⭐⭐ | Development | React 19 performance |
| **debugger** ⭐⭐⭐ | Development | Specialized debugging |

#### 💼 Business & Analytics:

| Agent | Category | Use Case |
|-------|----------|----------|
| **business-analyst** ⭐⭐ | Business | KPI tracking, dashboards |
| **data-analyst** ⭐⭐ | Data | SQL, BigQuery, insights |
| **conversion-optimization-expert** ⭐ | Product | CRO, A/B testing |
| **product-analytics-integrator** ⭐ | Analytics | Event tracking |
| **market-research-analyst** ⭐ | Business | Market analysis |

#### 🚀 DevOps & Infrastructure:

| Agent | Category | Use Case |
|-------|----------|----------|
| **deployment-engineer** ⭐⭐ | DevOps | CI/CD, Docker, K8s |
| **devops-troubleshooter** ⭐⭐ | DevOps | Production debugging |
| **database-admin** ⭐ | Infrastructure | DB operations |
| **network-engineer** ⭐ | Infrastructure | Network debugging |
| **incident-responder** ⭐⭐ | DevOps | Production incidents |

#### 🔧 Development Tools:

| Agent | Category | Use Case |
|-------|----------|----------|
| **test-automator** ⭐⭐ | Testing | Unit, Integration, E2E |
| **frontend-developer** ⭐⭐ | Development | Next.js + shadcn/ui |
| **api-integration-specialist** ⭐ | Integration | External APIs |
| **mobile-developer** ⭐ | Development | React Native, PWA |
| **security-auditor** ⭐⭐ | Security | Security reviews |

### 📋 სრული სია კატეგორიებით

<details>
<summary><strong>🔧 Development & Architecture (25 agents)</strong></summary>

```
✅ nextjs-app-router-developer    → Next.js 15 App Router specialist
✅ typescript-expert               → Advanced TypeScript
✅ react-performance-optimization → React 19 optimization
✅ frontend-developer              → Next.js + shadcn/ui
✅ backend-architect               → RESTful APIs, microservices
✅ debugger                        → Bug fixing specialist
✅ error-detective                 → Error pattern analysis
✅ javascript-developer            → Modern ES6+, Node.js
✅ database-optimizer              → Query optimization
✅ system-architecture-advisor     → High-level design
✅ graphql-architect               → GraphQL schemas
✅ legacy-modernizer               → Legacy code refactoring
✅ dx-optimizer                    → Developer experience
⭐ [+12 more]
```
</details>

<details>
<summary><strong>💻 Language Specialists (15 agents)</strong></summary>

```
✅ typescript-expert     → TypeScript advanced features
✅ python-expert         → Idiomatic Python, async
✅ golang-expert         → Go patterns, concurrency
✅ java-developer        → Modern Java, Spring Boot
✅ rust-expert           → Rust ownership, lifetimes
✅ ruby-expert           → Ruby on Rails patterns
✅ php-developer         → PHP 8+, Laravel
✅ cpp-engineer          → Modern C++ patterns
✅ c-developer           → Systems programming
⭐ [+6 more]
```
</details>

<details>
<summary><strong>🎨 Design & UX (8 agents)</strong></summary>

```
✅ ui-ux-designer            → User interface design
✅ mobile-first-designer     → PWA, responsive
✅ modern-ui-designer        → 2025 UI patterns
✅ user-feedback-interpreter → UX research
✅ conversion-optimization-expert → CRO specialist
⭐ [+3 more]
```
</details>

<details>
<summary><strong>📊 Data & Analytics (10 agents)</strong></summary>

```
✅ data-scientist          → Data analysis, SQL
✅ data-engineer           → ETL pipelines
✅ data-analyst            → Statistical insights
✅ business-analyst        → KPI tracking
✅ quant-analyst           → Financial models
✅ ml-engineer             → ML pipelines
✅ mlops-engineer          → ML operations
⭐ [+3 more]
```
</details>

<details>
<summary><strong>🚀 DevOps & Infrastructure (12 agents)</strong></summary>

```
✅ deployment-engineer     → CI/CD pipelines
✅ devops-troubleshooter   → Production debugging
✅ cloud-architect         → AWS/Azure/GCP
✅ database-admin          → DB operations
✅ network-engineer        → Network debugging
✅ incident-responder      → Emergency response
✅ performance-engineer    → Performance tuning
✅ terraform-specialist    → IaC specialist
⭐ [+4 more]
```
</details>

<details>
<summary><strong>🔐 Security & Testing (8 agents)</strong></summary>

```
✅ security-auditor        → Security reviews
✅ test-automator          → Comprehensive testing
✅ mcp-security-auditor    → MCP security
⭐ [+5 more]
```
</details>

<details>
<summary><strong>💼 Business & Product (12 agents)</strong></summary>

```
✅ business-analyst               → Metrics, KPIs
✅ product-analytics-integrator   → Event tracking
✅ market-research-analyst        → Market analysis
✅ feature-impact-analyzer        → RICE/ICE scoring
✅ idea-validator-pro             → Idea validation
✅ content-marketer               → Marketing content
✅ sales-automator                → Sales automation
✅ customer-support               → Support tickets
⭐ [+4 more]
```
</details>

<details>
<summary><strong>🔗 Integrations (10 agents)</strong></summary>

```
✅ api-integration-specialist  → External APIs
✅ payment-integration         → Stripe, PayPal
✅ mcp-expert                  → MCP servers
✅ mcp-server-architect        → MCP development
⭐ [+6 more]
```
</details>

<details>
<summary><strong>📝 Content & Documentation (7 agents)</strong></summary>

```
✅ technical-researcher    → Technical documentation
✅ api-documenter          → API docs, OpenAPI
✅ social-media-copywriter → Social media content
⭐ [+4 more]
```
</details>

<details>
<summary><strong>🎯 Specialized Tools (10 agents)</strong></summary>

```
✅ blockchain-developer         → Smart contracts
✅ defi-strategist              → DeFi protocols
✅ crypto-analyst               → Crypto analysis
✅ prompt-engineer              → AI prompt optimization
✅ hackathon-ai-strategist      → Hackathon strategy
⭐ [+5 more]
```
</details>

### 🚀 როგორ გამოვიყენო Agent?

Agents არ არის პირდაპირ გამოძახებადი - ისინი **ავტომატურად გამოიძახებიან** Task tool-ის მეშვეობით:

```bash
# მაგალითი 1: Next.js optimization
Task tool → subagent_type: "nextjs-app-router-developer"
prompt: "Optimize my Next.js 15 app for performance"

# მაგალითი 2: TypeScript fixes
Task tool → subagent_type: "typescript-expert"
prompt: "Fix TypeScript strict mode errors"

# მაგალითი 3: Database optimization
Task tool → subagent_type: "database-optimization"
prompt: "Optimize slow Supabase queries"
```

### 💡 Agent vs Skill განსხვავება

```
🤖 AGENTS (117):
   → Task tool-ის subagents
   → ავტომატურად ირჩევა context-ზე დაყრდნობით
   → ძალიან სპეციალიზებული (e.g., nextjs-app-router)
   → System-level

🎓 SKILLS (18):
   → პროექტის კონტექსტში განსაზღვრული
   → მომხმარებელი პირდაპირ იძახებს
   → ფართო scope (e.g., intelligent-debugger)
   → Project-level
```

**რეკომენდაცია:** იყენე **Skills** პროექტის ამოცანებისთვის, **Agents** ავტომატურად გამოიძახებიან საჭიროებისამებრ.

---

## 🛠️ Commands: 13 ბრძანება

### 🚀 Setup & Development

#### `/dev-setup`
**მიზანი:** Development environment-ის setup
**რას აკეთებს:**
1. npm install
2. Environment variables setup
3. Database initialization
4. Dev server start
5. System verification

**გამოყენება:**
```bash
/dev-setup
```

#### `/test-feature`
**მიზანი:** Feature testing
**რას აკეთებს:**
1. Unit tests
2. Integration tests
3. Coverage report
4. Type checking
5. Linting

**გამოყენება:**
```bash
/test-feature
```

#### `/deploy`
**მიზანი:** Production deployment
**რას აკეთებს:**
1. Pre-deployment checks
2. Database migrations
3. Build & deploy
4. Health checks
5. Verification

**გამოყენება:**
```bash
/deploy
```

### 📋 Speckit Commands (Feature Development Workflow)

#### `/speckit.specify [description]`
**მიზანი:** Feature specification შექმნა
**გამოყენება:**
```bash
/speckit.specify "Restaurant order management with real-time updates"
```

#### `/speckit.clarify [topic]`
**მიზანი:** Requirements clarification
**გამოყენება:**
```bash
/speckit.clarify "Order status transitions"
```

#### `/speckit.plan [notes]`
**მიზანი:** Technical plan generation
**გამოყენება:**
```bash
/speckit.plan "Need database schema changes"
```

#### `/speckit.tasks [notes]`
**მიზანი:** Task breakdown
**გამოყენება:**
```bash
/speckit.tasks "Breaking down order management feature"
```

#### `/speckit.implement [notes]`
**მიზანი:** Implementation execution
**გამოყენება:**
```bash
/speckit.implement "Starting with database migrations"
```

#### `/speckit.analyze [focus]`
**მიზანი:** Specification analysis
**გამოყენება:**
```bash
/speckit.analyze "Security implications"
```

#### `/speckit.checklist [type]`
**მიზანი:** Validation checklist creation
**გამოყენება:**
```bash
/speckit.checklist "pre-deployment"
```

#### `/speckit.constitution [updates]`
**მიზანი:** Project constitution management
**გამოყენება:**
```bash
/speckit.constitution "Update security requirements"
```

#### `/speckit-quickref`
**მიზანი:** Speckit quick reference
**გამოყენება:**
```bash
/speckit-quickref
```

### 📚 Complete Speckit Workflow

```
1. /speckit.specify "feature description"
   → შექმნის spec.md

2. /speckit.clarify (თუ გაურკვეველია რაღაც)
   → გააუმჯობესებს spec-ს

3. /speckit.plan
   → შექმნის plan.md

4. /speckit.tasks
   → შექმნის tasks.md

5. /speckit.implement
   → დაიწყებს implementation-ს

6. /speckit.analyze (შუალედური ან ბოლოს)
   → გააანალიზებს consistency-ს
```

---

## ⚡ Commands: სრული 187 ბრძანება

> **ახალი!** 187 slash command სხვადასხვა ამოცანებისთვის!

### 📊 კატეგორიები

**სულ 187 Command დაყოფილია 12 კატეგორიაში:**

```
🚀 Development & Testing (35)        → Testing, CI/CD, Build
🏗️ Project Setup & Init (18)         → Init, Setup, Config
📦 Deployment & Release (22)          → Deploy, Release, Rollback
🔧 Code Quality & Refactor (25)      → Refactor, Optimize, Review
🗄️ Database & Migration (15)         → Schema, Migration, Optimize
📋 Task & Project Management (20)     → Tasks, Planning, Tracking
🔐 Security & Audit (12)              → Security, Audit, Compliance
📊 Analytics & Monitoring (15)        → Metrics, Monitoring, Reports
🎨 UI/UX & Design (10)                → Design, Accessibility, Mobile
📝 Documentation & Guides (8)         → Docs, API, Guides
🔗 Integration & Sync (7)             → Linear, GitHub, Issues
🎯 Specialized Tools (15)             → Svelte, Unity, PAC, etc.
```

### 🌟 TOP 30 Commands შენი პროექტისთვის

#### 🚀 Development & Testing:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/write-tests` | Test generation | ⭐⭐⭐ |
| `/test-coverage` | Coverage analysis | ⭐⭐⭐ |
| `/test-feature` | Feature testing | ⭐⭐⭐ |
| `/run-ci` | CI checks & fixes | ⭐⭐ |
| `/debug-error` | Error debugging | ⭐⭐⭐ |
| `/repro-issue` | Issue reproduction | ⭐⭐ |

#### 🔧 Code Quality:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/refactor-code` | Code refactoring | ⭐⭐⭐ |
| `/optimize` | Performance optimization | ⭐⭐⭐ |
| `/code-review` | Code quality review | ⭐⭐ |
| `/check` | Run checks | ⭐⭐ |
| `/clean` | Fix linting/formatting | ⭐⭐ |

#### 📦 Deployment:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/deploy` | Production deploy | ⭐⭐⭐ |
| `/prepare-release` | Release preparation | ⭐⭐ |
| `/rollback-deploy` | Rollback deployment | ⭐⭐⭐ |
| `/release` | New release | ⭐⭐ |

#### 🗄️ Database:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/create-database-migrations` | Create migrations | ⭐⭐⭐ |
| `/optimize-database-performance` | DB optimization | ⭐⭐⭐ |
| `/design-database-schema` | Schema design | ⭐⭐ |

#### 🏗️ Architecture & Analysis:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/architecture-review` | Architecture analysis | ⭐⭐⭐ |
| `/security-audit` | Security check | ⭐⭐⭐ |
| `/performance-audit` | Performance analysis | ⭐⭐ |
| `/dependency-audit` | Dependency check | ⭐⭐ |

#### 📋 Task Management:

| Command | Purpose | Priority |
|---------|---------|----------|
| `/start` | Task orchestration | ⭐⭐ |
| `/status` | Check task status | ⭐⭐ |
| `/move` | Move tasks | ⭐ |
| `/remove` | Remove task | ⭐ |

### 📋 სრული სია კატეგორიებით

<details>
<summary><strong>🚀 Development & Testing (35)</strong></summary>

```
Development:
✅ /write-tests                → Generate comprehensive tests
✅ /test-coverage              → Analyze coverage
✅ /test-feature               → Feature testing
✅ /tdd                        → TDD workflow
✅ /debug-error                → Debug errors
✅ /repro-issue                → Reproduce issues

CI/CD:
✅ /run-ci                     → Run CI checks
✅ /ci-setup                   → Setup CI pipeline
✅ /check                      → Run project checks

Build & Optimization:
✅ /optimize-build             → Optimize build
✅ /optimize-bundle-size       → Bundle optimization
✅ /modernize-deps             → Update dependencies
✅ /dependency-audit           → Audit dependencies

⭐ [+22 more]
```
</details>

<details>
<summary><strong>🏗️ Project Setup & Init (18)</strong></summary>

```
Setup:
✅ /dev-setup                       → Development setup
✅ /init-project                    → Initialize project
✅ /setup-development-environment   → Complete dev env
✅ /setup-comprehensive-testing     → Testing infrastructure
✅ /setup-linting                   → Linting setup
✅ /setup-formatting                → Formatting setup

Advanced:
✅ /setup-monitoring-observability  → Monitoring setup
✅ /setup-kubernetes-deployment     → K8s deployment
✅ /setup-monorepo                  → Monorepo structure

⭐ [+9 more]
```
</details>

<details>
<summary><strong>📦 Deployment & Release (22)</strong></summary>

```
Deployment:
✅ /deploy                     → Production deploy
✅ /prepare-release            → Release preparation
✅ /release                    → New release
✅ /rollback-deploy            → Rollback deployment
✅ /hotfix-deploy              → Emergency hotfix

Setup & Automation:
✅ /setup-automated-releases   → Automate releases
✅ /setup-cdn-optimization     → CDN configuration
✅ /containerize-application   → Docker setup

⭐ [+14 more]
```
</details>

<details>
<summary><strong>🔧 Code Quality & Refactor (25)</strong></summary>

```
Quality:
✅ /refactor-code              → Code refactoring
✅ /optimize                   → Performance optimization
✅ /code-review                → Quality review
✅ /check                      → Run checks
✅ /clean                      → Fix issues

Analysis:
✅ /architecture-review        → Architecture analysis
✅ /check-file                 → File analysis
✅ /explain-code               → Code explanation

⭐ [+17 more]
```
</details>

<details>
<summary><strong>🗄️ Database & Migration (15)</strong></summary>

```
✅ /create-database-migrations         → Create migrations
✅ /optimize-database-performance      → DB optimization
✅ /design-database-schema             → Schema design
✅ /mermaid                            → ER diagrams

⭐ [+11 more]
```
</details>

<details>
<summary><strong>📋 Task & Project Management (20)</strong></summary>

```
Orchestration:
✅ /start                      → Task orchestration
✅ /status                     → Task status
✅ /resume                     → Resume orchestration
✅ /move                       → Move tasks
✅ /remove                     → Remove task
✅ /log                        → Log work

Planning:
✅ /sprint-planning            → Sprint planning
✅ /standup-report             → Daily standup
✅ /milestone-tracker          → Milestone tracking

⭐ [+11 more]
```
</details>

<details>
<summary><strong>🔐 Security & Audit (12)</strong></summary>

```
✅ /security-audit             → Security assessment
✅ /security-hardening         → Harden security
✅ /add-authentication-system  → Auth implementation

⭐ [+9 more]
```
</details>

<details>
<summary><strong>📊 Analytics & Monitoring (15)</strong></summary>

```
✅ /performance-audit          → Performance analysis
✅ /project-health-check       → Health check
✅ /retrospective-analyzer     → Retrospective analysis

⭐ [+12 more]
```
</details>

<details>
<summary><strong>🎨 UI/UX & Design (10)</strong></summary>

```
✅ /create-feature             → Feature creation
✅ /design-rest-api            → API design
✅ /generate-api-documentation → API docs

⭐ [+7 more]
```
</details>

<details>
<summary><strong>📝 Documentation & Guides (8)</strong></summary>

```
✅ /create-docs                → Documentation
✅ /update-docs                → Update docs
✅ /create-onboarding-guide    → Onboarding guide
✅ /troubleshooting-guide      → Troubleshooting

⭐ [+4 more]
```
</details>

<details>
<summary><strong>🔗 Integration & Sync (7)</strong></summary>

```
✅ /sync                       → Sync tasks
✅ /sync-issues-to-linear      → GitHub to Linear
✅ /sync-linear-to-issues      → Linear to GitHub
✅ /issue-to-linear-task       → Convert to Linear
✅ /linear-task-to-issue       → Convert to GitHub

⭐ [+2 more]
```
</details>

<details>
<summary><strong>🎯 Specialized Tools (15)</strong></summary>

```
Svelte:
✅ /svelte-test                → Svelte testing
✅ /svelte-storybook           → Storybook setup
✅ /svelte-a11y                → Accessibility

PAC (Product as Code):
✅ /pac-configure              → PAC setup
✅ /pac-create-epic            → Create epic
✅ /pac-create-ticket          → Create ticket

Unity:
✅ /unity-project-setup        → Unity setup

⭐ [+8 more]
```
</details>

### 🚀 როგორ გამოვიყენო Command?

Commands არის slash commands რომლებიც პირდაპირ გამოიძახება:

```bash
# Development
/write-tests                    # Generate tests
/test-coverage                  # Check coverage
/run-ci                         # Run CI

# Deployment
/deploy                         # Deploy to production
/prepare-release                # Prepare release
/rollback-deploy                # Rollback if needed

# Code Quality
/refactor-code                  # Refactor code
/optimize                       # Optimize performance
/architecture-review            # Review architecture

# Database
/create-database-migrations     # Create migration
/optimize-database-performance  # Optimize DB

# Speckit Workflow
/speckit.specify "feature"      # Create spec
/speckit.plan                   # Technical plan
/speckit.tasks                  # Break down tasks
/speckit.implement              # Implement
```

### 💡 Command Categories Quick Reference

```
🚀 გჭირდება Testing?
   → /write-tests, /test-coverage, /test-feature

🏗️ გჭირდება Setup?
   → /dev-setup, /init-project, /setup-*

📦 გჭირდება Deploy?
   → /deploy, /prepare-release, /rollback-deploy

🔧 გჭირდება Quality?
   → /refactor-code, /optimize, /code-review

🗄️ გჭირდება Database?
   → /create-database-migrations, /optimize-database-performance

🔐 გჭირდება Security?
   → /security-audit, /security-hardening

📋 გჭირდება Tasks?
   → /start, /status, /move, /remove
```

### 📚 სრული დოკუმენტაცია

ყველა command-ის დეტალური დოკუმენტაცია: `.claude/commands/`

```bash
# ნახე ყველა command
ls .claude/commands/

# წაიკითხე კონკრეტული command
cat .claude/commands/write-tests.md
```

---

## 💻 კოდის მაგალითები

### 🔧 Development Setup

```bash
# პროექტის setup
cd frontend
npm install
npm run dev

# Environment variables
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key]
NEXT_PUBLIC_SENTRY_DSN=[sentry-dsn]
```

### 🗄️ Database Migration

```bash
# Migration შექმნა
cd database/migrations

# Create new migration file
touch $(date +%Y%m%d%H%M%S)_feature_name.sql

# Migration template:
```

```sql
-- Migration: feature_name
-- Created: 2025-11-19

BEGIN;

-- Add your schema changes here
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access"
  ON new_table
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMIT;
```

### 🎨 React Component Template

```typescript
// components/ui/feature-component.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FeatureComponentProps {
  title: string
  onAction?: () => void
}

export function FeatureComponent({ title, onAction }: FeatureComponentProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('table_name')
        .select('*')

      if (error) throw error
      setData(data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {/* Your component content */}
      <Button onClick={onAction}>
        Take Action
      </Button>
    </Card>
  )
}
```

### 🔄 Real-time Subscription

```typescript
// hooks/useRealtimeOrders.ts
import { useEffect, useState } from 'react'
import { useSupabase } from './useSupabase'
import type { Order } from '@/types'

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = useSupabase()

  useEffect(() => {
    // Initial load
    loadOrders()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [...prev, payload.new as Order])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? payload.new as Order : o)
            )
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    setOrders(data || [])
  }

  return { orders }
}
```

### 🧪 Test Example

```typescript
// __tests__/components/FeatureComponent.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FeatureComponent } from '@/components/ui/feature-component'

// Mock Supabase
vi.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({
    from: () => ({
      select: () => ({
        data: [{ id: 1, name: 'Test' }],
        error: null,
      }),
    }),
  }),
}))

describe('FeatureComponent', () => {
  it('renders with title', async () => {
    render(<FeatureComponent title="Test Title" />)

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
  })

  it('loads data on mount', async () => {
    render(<FeatureComponent title="Test" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })
})
```

---

## 🐛 Troubleshooting Guide

### 🔍 Common Issues & Quick Fixes

#### ❌ Supabase Connection Error

```bash
# Problem:
Error: Invalid API key

# Quick Fix:
1. წაიკითხე: .claude/knowledge/answers/01-supabase-invalid-api-key-errors.md
2. გადაამოწმე .env.local ფაილი
3. გაუშვი diagnostic:
   node .claude/knowledge/answers/supabase-diagnostic.js
```

#### ❌ TypeScript Build Errors

```bash
# Problem:
Type errors during build

# Quick Fix:
1. გაუშვი: npm run type-check
2. წაიკითხე: .claude/knowledge/week2-day1-typescript-fixes.md
3. შეამოწმე tsconfig.json strict mode
4. გამოიყენე Skill: code-quality-guardian
```

#### ❌ Real-time Not Working

```bash
# Problem:
WebSocket connection issues

# Quick Fix:
1. წაიკითხე: .claude/knowledge/realtime-architecture.md
2. შეამოწმე Connection Manager: frontend/src/lib/supabase/connection-manager.ts
3. გადაამოწმე RLS policies
4. გაუშვი: .claude/knowledge/realtime-optimization-summary.md
```

#### ❌ Performance Issues

```bash
# Problem:
Slow page load / queries

# Quick Fix:
1. გამოიყენე Skill: intelligent-debugger
2. გაუშვი: python .claude/skills/intelligent-debugger/scripts/performance_check.py
3. შეამოწმე indexes: .claude/knowledge/database-schema.md
4. წაიკითხე: .claude/skills/intelligent-debugger/references/PERFORMANCE_GUIDE.md
```

#### ❌ PWA Not Installing

```bash
# Problem:
Add to Home Screen არ მუშაობს

# Quick Fix:
1. წაიკითხე: .claude/knowledge/pwa-implementation.md
2. შეამოწმე manifest.json
3. Service Worker status: DevTools → Application → Service Workers
4. HTTPS requirement: PWA მოითხოვს HTTPS-ს
```

### 🔧 Debug Checklist

```
□ Reproduce issue consistently
□ Gather error messages and stack traces
□ Check recent changes (git log)
□ Review relevant documentation
□ Use appropriate Skill (intelligent-debugger)
□ Follow 7-step debugging process:
  1. Reproduce
  2. Gather Info
  3. Understand
  4. Hypothesize
  5. Implement
  6. Verify
  7. Document
□ Test fix thoroughly
□ Add regression test
□ Document findings
```

### 📊 System Health Check

```bash
# Quick system verification
cd frontend

# 1. Dependencies
npm install

# 2. Type check
npm run type-check

# 3. Linting
npm run lint

# 4. Tests
npm test

# 5. Build
npm run build

# 6. Database connection
node .claude/knowledge/answers/quick-test.js
```

---

## 🔌 Integrations: MCP Servers & External Services

### 9 MCP Servers (Enabled)

#### 1. **perplexity** - Research & Web Search
```bash
# გამოყენება:
perplexity_search("Next.js 15 best practices 2025")
perplexity_ask("How to optimize React performance?")
perplexity_research("Deep dive into Supabase RLS")
```

#### 2. **filesystem** - File Operations
```bash
# გამოყენება:
read_file("path/to/file.ts")
write_file("path/to/file.ts", content)
list_directory("src/components")
```

#### 3. **github** - Repository Management
```bash
# გამოყენება:
create_pull_request(title, body, branch)
create_issue(title, body)
search_code("useSupabase")
```

#### 4. **sentry** - Error Tracking
```bash
# გამოყენება:
find_issues(query)
get_issue_details(issue_id)
search_events("errors last 24h")
```

#### 5. **supabase** - Database Operations
```bash
# გამოყენება:
list_tables()
execute_sql("SELECT * FROM orders")
apply_migration(name, query)
generate_typescript_types()
```

#### 6. **context7** - Library Documentation
```bash
# გამოყენება:
resolve_library_id("nextjs")
get_library_docs(library_id, topic)
```

#### 7. **sequentialthinking** - Advanced Reasoning
```bash
# გამოყენება:
# Complex problem decomposition
# Multi-step solution analysis
```

#### 8. **chrome-devtools** - Browser Debugging
```bash
# გამოყენება:
take_screenshot()
list_console_messages()
list_network_requests()
```

#### 9. **shadcn** - UI Components
```bash
# გამოყენება:
# Component installation
# Version updates
```

### 🔐 Security & Permissions

**Allowed:**
- ✅ Read, Edit, Write files
- ✅ npm, git, node commands
- ✅ Testing tools (vitest, playwright)
- ✅ Build commands
- ✅ All MCP servers

**Denied:**
- ❌ rm, del, rmdir (destructive)
- ❌ sudo, chmod (system)
- ❌ .env files (secrets)
- ❌ Repository deletion

**Location:** `.claude/settings.local.json`

---

## 📚 სრული მოცულობა

### 📖 Core Files (Must Read)

#### 1. **instructions.md** (2,500+ lines)
- პროექტის overview
- Technology stack
- User roles
- Development environment
- MCP integrations
- Available skills & commands

#### 2. **context.md** (2,000+ lines)
- მიმდინარე branch status
- ბოლო achievements
- Next steps
- Project metrics
- Known issues

#### 3. **architecture.md** (3,500+ lines)
- System architecture diagram
- Dual environment (dev/prod)
- Frontend structure
- Backend structure
- Database schema
- Real-time system
- Deployment infrastructure

### 📏 Rules & Standards

#### 1. **coding-standards.md**
- TypeScript strict mode
- React best practices
- Next.js 15 patterns
- Component architecture
- Tailwind guidelines
- Performance optimization

#### 2. **security-requirements.md**
- Authentication flows
- Authorization checks
- Input validation (Zod)
- RLS patterns
- CSRF/XSS prevention

#### 3. **database-guidelines.md**
- RLS security model
- Migration strategies
- Indexing best practices
- Query optimization
- Backup procedures

#### 4. **testing-guidelines.md**
- Vitest configuration
- Unit test patterns
- Integration tests
- Coverage goals (70%+)
- Mocking strategies

### 📋 Workflows

#### 1. **feature-development.md**
Complete 7-step workflow:
1. Pre-development (spec creation)
2. Git branch
3. Development (DB → API → UI)
4. Testing
5. Documentation
6. Code review
7. Deployment

#### 2. **bug-fixing.md**
Systematic approach:
1. Reproduce
2. Diagnostic report
3. Investigation (7-step)
4. Fix implementation
5. Testing
6. Documentation

#### 3. **deployment.md**
Production deployment:
1. Pre-deployment checks
2. Database migration
3. Application deployment
4. Verification
5. Post-deployment checks
6. Rollback procedure

#### 4. **testing.md**
Testing strategy:
- Unit testing
- Integration testing
- E2E with Playwright
- Manual testing checklist

### 📚 Knowledge Base (35+ Articles)

**Core Documentation:**
- database-schema.md
- technology-stack.md
- user-roles.md
- order-workflow.md

**Feature Documentation:**
- pwa-implementation.md
- realtime-architecture.md
- mobile-optimization.md
- analytics-guide.md

**Progress Tracking:**
- week2-progress.md
- week3-4-progress.md
- week2-final-summary.md

**Q&A (answers/ folder):**
- 15+ common questions & solutions
- Supabase troubleshooting
- Next.js 15 best practices
- Schema verification methods

---

## 🔗 System Integration

### კავშირი სხვა ფოლდერებთან

```
პროექტის სტრუქტურა:
│
├── .claude/                    ← ეს დოკუმენტი და resources
│   ├── instructions.md
│   ├── context.md
│   ├── architecture.md
│   ├── skills/
│   ├── commands/
│   ├── knowledge/
│   ├── rules/
│   └── workflows/
│
├── .kilocode/                  ← Memory bank & broader context
│   └── workflows/
│
├── .specify/                   ← Speckit templates
│   ├── templates/
│   └── scripts/
│
├── specs/                      ← Feature specifications
│   ├── 001-analytics-dashboard/     ✅ Complete
│   ├── 002-restaurant-orders/       🔄 Next
│   └── 003-driver-mobile/           ⏳ Planned
│
├── database/                   ← Database migrations & SQL
│   ├── migrations/
│   └── schema/
│
├── frontend/                   ← Next.js application
│   ├── src/
│   │   ├── app/               → App Router pages
│   │   ├── components/        → React components
│   │   ├── lib/               → Utilities
│   │   ├── hooks/             → Custom hooks
│   │   └── types/             → TypeScript types
│   └── public/
│
└── CLAUDE.md                   ← ეს ფაილი!
```

### როგორ ვიმუშაო Speckit-თან

```bash
# 1. Feature specification
/speckit.specify "New feature description"
   → შექმნის specs/00X-feature-name/spec.md

# 2. Technical planning
/speckit.plan
   → შექმნის specs/00X-feature-name/plan.md

# 3. Task breakdown
/speckit.tasks
   → შექმნის specs/00X-feature-name/tasks.md

# 4. Implementation
/speckit.implement
   → იწყებს tasks.md-დან

# 5. Analysis (any time)
/speckit.analyze
   → ამოწმებს consistency-ს
```

### MCP Servers Integration

```
.claude/settings.local.json
    ↓ configured servers
    ↓
MCP Servers (9 active):
├── perplexity      → Research
├── filesystem      → File ops
├── github          → Git/PRs
├── sentry          → Errors
├── supabase        → DB
├── context7        → Docs
├── sequential      → Reasoning
├── chrome-devtools → Browser
└── shadcn          → UI components
```

---

## 🎯 Current System Status

### 📊 Project Metrics (2025-11-28)

```
🏆 Phase 2: Database & Backend Optimization - COMPLETE ✅

10-Phase Comprehensive Testing (222+ Tests):
├─ ✅ Phase 1: Core Health (6/6)
├─ ✅ Phase 2: API Functionality (20/20)
├─ ✅ Phase 3: Database Operations (18/18)
├─ ✅ Phase 4: Error Handling (15/15)
├─ ✅ Phase 5: Performance (12/12 - All sub-second)
├─ ✅ Phase 6: Real-time Features (9/9)
├─ ✅ Phase 7: Visual/UI (14/14)
├─ ✅ Phase 8: Integration (12/12)
├─ ✅ Phase 9: Load Testing (10/10)
└─ ✅ Phase 10: Security (40/40)

Security Testing Results (Phase 10):
├─ Security Headers: 9/9 ✅
├─ CSRF Protection: 4/4 ✅
├─ Authentication Security: 7/7 ✅
├─ Input Validation: 5/5 ✅
├─ RLS Enforcement: 6/6 ✅
├─ API Security: 5/5 ✅
└─ Session Security: 4/4 ✅

Code Quality:
├─ TypeScript: Strict mode ✅
├─ Components: 50+ reusable
├─ shadcn/ui: 99.3% compatible
├─ Tests: 222+ passing
└─ Database: 12 indexes, 25+ RLS policies

Infrastructure:
├─ Frontend: Next.js 15.5.6 + React 19.2.0
├─ Backend: Supabase (dev) + Self-hosted (prod)
├─ Connection Pooling: PgBouncer configured
├─ Caching: Redis configured
├─ Deployment: Dockploy on Contabo VPS
├─ Monitoring: Sentry error tracking
└─ PWA: Fully implemented ✅

Git Status:
├─ Current Branch: 001-postgres-opt
├─ Main Branch: main
└─ Status: Ready for Phase 3 (Code Splitting & ISR)
```

### 🎯 Next Priorities

```
1. Phase 3: Code Splitting & ISR
   → Dynamic imports for heavy components
   → Route-based code splitting
   → ISR for static content
   → Bundle size optimization

2. Production Deployment
   → Deploy to VPS with PgBouncer
   → Enable Redis caching
   → Configure nginx SSL

3. Driver Mobile Optimization
   → GPS tracking integration
   → One-tap status updates
   → Offline-first delivery workflow
```

---

## ❓ FAQ & Learning Path

### ❓ ხშირი კითხვები

**Q: სად დავიწყო პირველად?**
A:
1. წაიკითხე [5 წუთიანი სტარტი](#-5-წუთი-სწრაფი-დაწყება)
2. შემდეგ [მე მინდა... სცენარები](#-მე-მინდა-სცენარები)
3. იპოვე შენი ამოცანა და დაიწყე!

**Q: რომელი Skill გამოვიყენო?**
A: იხილე [Decision Tree](#-decision-trees) ან [Skills Reference](#-skills-18-სპეციალიზებული-აგენტი)

**Q: როგორ დავამატო ახალი feature?**
A: `/speckit.specify` → `workflow: feature-development.md`

**Q: როგორ გამოვასწორო bug?**
A: `Skill: intelligent-debugger` → `workflow: bug-fixing.md`

**Q: სად არის database schema?**
A: `.claude/knowledge/database-schema.md`

**Q: როგორ deploy-ი გავაკეთო?**
A: `/deploy` ან `.claude/commands/deploy.md`

**Q: რა არის Speckit?**
A: Feature development workflow system. იხილე `.claude/commands/speckit.md`

**Q: რა განსხვავებაა Skills და Commands-ს შორის?**
A:
- **Commands** = Quick-start guides (e.g., `/deploy`)
- **Skills** = Specialized AI agents (e.g., `intelligent-debugger`)

### 🎓 Learning Path (4 დღე)

#### Day 1: გაცნობა (2-3 საათი)
```
□ წაიკითხე: instructions.md
□ წაიკითხე: context.md
□ წაიკითხე: architecture.md
□ გაეცანი: Directory Structure
□ გაიგე: Project metrics & status
```

#### Day 2: Standards (2-3 საათი)
```
□ წაიკითხე: rules/coding-standards.md
□ წაიკითხე: rules/security-requirements.md
□ წაიკითხე: rules/database-guidelines.md
□ წაიკითხე: rules/testing-guidelines.md
□ გაეცანი: knowledge/ folder
```

#### Day 3: Practice (3-4 საათი)
```
□ გაუშვი: /dev-setup
□ შექმენი test branch
□ შექმენი მარტივი component
□ დაწერე test
□ გაუშვი: npm test
□ გამოცადე: Speckit workflow
```

#### Day 4: Real Task (4-5 საათი)
```
□ აირჩიე მცირე feature/bug
□ გამოიყენე შესაბამისი Skill
□ მიჰყევი workflow-ს
□ შექმენი PR
□ განაახლე context.md
```

---

## 📞 დახმარება & Support

### თუ დახმარება გჭირდება:

```
1️⃣ შეამოწმე Knowledge Base
   → .claude/knowledge/answers/

2️⃣ გამოიყენე intelligent-debugger
   → Bug-ებისთვის და errors-ისთვის

3️⃣ იხილე Decision Trees
   → სწორი Skill-ის არჩევა

4️⃣ წაიკითხე Workflows
   → Feature development / Bug fixing

5️⃣ გადახედე Examples
   → specs/ folder
```

### 🚨 Emergency Quick Reference

```bash
# System totally broken?
1. git status
2. git log -5
3. node .claude/knowledge/answers/supabase-diagnostic.js
4. npm run type-check
5. Use Skill: intelligent-debugger

# Can't find something?
1. Check Decision Trees
2. Search in .claude/ folder
3. Read instructions.md
4. Check this CLAUDE.md

# Need to deploy urgently?
1. /deploy
2. Follow .claude/commands/deploy.md
3. Monitor Sentry
4. Use Skill: deployment-automation
```

---

## ✅ Pre-Work Checklist

```
🔹 დაწყებამდე (ყოველი სესია):
□ წაიკითხე context.md (current status)
□ git pull origin main
□ შეამოწმე current branch
□ განახლე dependencies (თუ საჭიროა)

🔹 ამოცანის დაწყებამდე:
□ იპოვე შესაფერისი Skill
□ წაიკითხე relevant workflow
□ შეამოწმე rules & standards
□ შექმენი feature branch (თუ საჭიროა)

🔹 დასრულების შემდეგ:
□ Run tests
□ Type check
□ Update documentation
□ Update context.md
□ Create PR (თუ საჭიროა)
```

---

## 📌 Important Files Quick Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `instructions.md` | Project overview | Starting work |
| `context.md` | Current status | Every session |
| `architecture.md` | System design | Building features |
| `CLAUDE.md` | This guide! | Finding anything |
| `coding-standards.md` | Code quality | Writing code |
| `security-requirements.md` | Security | Security work |
| `database-schema.md` | DB structure | Database work |
| `intelligent-debugger/` | Debug guide | Fixing bugs |
| `feature-development.md` | Feature process | New features |
| `deploy.md` | Deployment | Production deploy |

---

## 🏁 Final Notes

### 💡 Best Practices

```
✅ DO:
- Read relevant docs before coding
- Use existing components/patterns
- Write tests for new features
- Follow coding standards
- Keep code simple and readable
- Update context.md after major work
- Use appropriate Skills
- Follow workflows

❌ DON'T:
- Skip reading documentation
- Reinvent existing patterns
- Commit without testing
- Ignore security requirements
- Write code without types
- Forget to update docs
- Guess - use Skills instead
```

### 🎯 Success Metrics

```
You're doing great if:
✅ ყოველთვის იცი სად ვართ (context.md)
✅ იყენებ სწორ Skill-ს ამოცანისთვის
✅ მიჰყვები workflows-ს
✅ წერ tests-ს
✅ ინახავ კოდის ხარისხს
✅ განაახლებ documentation-ს
✅ იყენებ Decision Trees-ს
✅ ეფექტურად მუშაობ
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-11-28 | **Phase 2 Complete:** 10-Phase Comprehensive Testing (222+ tests), Security Testing (40/40), PostgreSQL Production Optimization branch, PgBouncer + Redis configured |
| 2.1.0 | 2025-11-19 | **Major Update:** Added 117 Agents + 187 Commands documentation with categories, priorities, and quick reference guides |
| 2.0.0 | 2025-11-19 | Complete overhaul: Georgian context, Decision Trees, Quick scenarios, Code examples, Troubleshooting |
| 1.0.0 | 2025-11-19 | Initial comprehensive documentation |

---

**Last Updated:** 2025-11-28
**Maintained By:** Development Team
**Status:** ✅ Phase 2 Complete - Ready for Phase 3 (Code Splitting & ISR)
**Location:** `C:\Users\SITECH\Desktop\DEV\Distribution-Managment\CLAUDE.md`

---

## 🙏 Conclusion

ეს დოკუმენტი არის **შენი მთავარი გზამკვლევი** ამ სისტემაში მუშაობისთვის.

**დაიმახსოვრე 5 რამ:**

1. 📖 **წაიკითხე პირველ** - თავიდან აირიდე პრობლემები
2. 🗺️ **გამოიყენე Decision Trees** - სწრაფად იპოვო რაც გჭირდება
3. 🎓 **გამოიყენე Skills** - პროექტის ამოცანებისთვის
4. 🤖 **Agents ავტომატურად მუშაობს** - Task tool-ის მეშვეობით
5. ⚡ **187 Command შენს ხელთაა** - `/write-tests`, `/deploy`, `/optimize`...

### 📊 რა გაქვს?

```
✅ 18 Skills          → პროექტის კონტექსტი
✅ 117 Agents         → System-level specialists
✅ 187 Commands       → პირდაპირ გამოძახებადი
─────────────────────────────────────
   304 ხელსაწყო       → შენი წარმატებისთვის!
```

**შენ ხარ კარგ ხელებში!** 🚀

---

*ეს დოკუმენტი შექმნილია Claude-ის მიერ, Claude-სთვის, რათა უკეთ იმუშაოს ქართულ სადისტრიბუციო სისტემაში. 🇬🇪*
