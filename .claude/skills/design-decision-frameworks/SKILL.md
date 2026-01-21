---
name: documenting-design-decisions
description: Helps document architectural and technical decisions using ADR, RFC, and trade-off frameworks. Creates structured decision records, evaluates build-vs-buy scenarios, and identifies reversibility (Type 1 vs Type 2). Use when justifying why you chose tRPC over REST, Postgres over MongoDB, or explaining any significant technology/architecture choice with clear trade-offs and rationale.
---

# Documenting Design Decisions

## Quick Start

Generate a decision record in under 5 minutes:

```markdown
# ADR-001: Use tRPC for Type-Safe APIs

**Status:** Accepted  
**Date:** 2025-01-20  
**Deciders:** Backend team  

## Context and Problem Statement

We need type-safe communication between frontend and backend without writing separate API contracts.

## Considered Options

- **tRPC** - TypeScript RPC framework with automatic type inference
- **REST + OpenAPI** - Traditional REST with schema generation
- **GraphQL** - Query language with schema definition

## Decision Outcome

Chosen: **tRPC**

Because:
- Eliminates API contract duplication (types derived from server procedures)
- Faster development: no need to write and maintain separate schemas
- Developer experience: IDE autocomplete works across client/server boundary
- Reduced runtime errors from type mismatches

## Consequences

**Positive:**
- Development velocity increased 30-40%
- Zero API contract bugs in 6 months of production

**Negative:**
- Requires TypeScript expertise on both client and server
- Harder to onboard non-TypeScript developers
- Couples frontend directly to backend code structure

## Validation

Code review checklist:
- [ ] All procedures have input validation with Zod
- [ ] Error handling tested with E2E tests
- [ ] Performance verified with API load tests
```

## When to Use This Skill

**When to write an ADR:**
- Making irreversible (Type 1) architectural decisions
- Choosing between competing technologies (tRPC vs REST vs GraphQL)
- Documenting decisions for future team members
- Creating an audit trail for why you built something a certain way

**When to write an RFC:**
- Changes affect multiple systems or teams
- Adding/replacing tools in the tech stack
- Major architectural refactors
- Need team consensus before implementation

**When to use Decision Matrices:**
- Build vs Buy scenarios
- Evaluating 3+ technology options
- Risk/benefit trade-off analysis
- Vendor selection decisions

## Instructions

### 1. Identify Decision Type

Ask yourself: **Is this reversible?**

**Type 1 (One-Way Door) - Irreversible:**
- Requires slow, careful deliberation
- Examples: Database choice, primary language, vendor contracts
- Timeline: Days to weeks
- Needs: Senior team input, trade-off analysis, risk assessment

**Type 2 (Two-Way Door) - Reversible:**
- Can be changed with modest cost
- Examples: UI framework choice, internal tooling, experiment setup
- Timeline: Hours to days
- Needs: Quick decision, bias toward action, reversibility checkpoints

### 2. Choose Your Framework

| Framework | Best For | Audience | Length |
|-----------|----------|----------|--------|
| **ADR (MADR)** | Single architectural decision | Engineering team | 1-2 pages |
| **RFC** | Cross-team proposal needing consensus | Broader stakeholders | 2-5 pages |
| **Decision Matrix** | Multiple options, scoring needed | Decision makers | 1 page + scoring sheet |

### 3. Structure Your Decision

**For ADR (Type 1 decisions):**

```
# ADR-NNN: [Title as imperative statement]

**Status:** {Proposed | Accepted | Rejected | Deprecated | Superseded}
**Date:** YYYY-MM-DD
**Deciders:** Team members involved
**Consulted:** SMEs and stakeholders
**Informed:** People kept in the loop

## Context and Problem Statement
- What problem are we solving?
- What's the current state?
- Why is this architecturally significant?

## Considered Options
- Option A (technology/approach)
  - Pros
  - Cons
- Option B
  - Pros
  - Cons

## Decision Outcome
Chosen: **[Option Name]**

Because:
- [Reason 1]
- [Reason 2]
- [Reason 3]

## Consequences
**Positive:**
- [Benefit 1]
- [Benefit 2]

**Negative:**
- [Cost 1]
- [Cost 2]

## Known Unknowns
- [Risk or unknown outcome]

## Validation
How will we confirm this decision worked?
- Code review criteria
- Performance metrics
- Team feedback
```

**For RFC (Type 1 decisions needing consensus):**

```
# RFC-NNN: [Title]

## Summary
One-paragraph overview of what's being proposed.

## Problem Statement
Why is this proposal needed? What's broken or missing?

## Proposed Solution
Describe the approach in detail.

## Alternatives Considered
- Option A: Pros and cons
- Option B: Pros and cons

## Trade-offs
- **Cost vs. Benefit:** Implementation effort vs. expected gains
- **Complexity:** How complex is the solution?
- **Reversibility:** Can we undo this?
- **Timeline:** How long to ship?

## Risks and Mitigation
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk] | High/Medium/Low | High/Medium/Low | [Plan] |

## Implementation Plan
- Phase 1: [What, Who, When]
- Phase 2: [What, Who, When]

## Success Criteria
How do we know this worked?
```

**For Decision Matrix (3+ options):**

```
| Criteria | Weight | Option A | Option B | Option C | Winner |
|----------|--------|----------|----------|----------|--------|
| **Cost** | 30% | 3/5 (0.9) | 4/5 (1.2) | 2/5 (0.6) | Option B |
| **Speed** | 25% | 4/5 (1.0) | 3/5 (0.75) | 5/5 (1.25) | Option C |
| **Maintenance** | 25% | 2/5 (0.5) | 4/5 (1.0) | 3/5 (0.75) | Option B |
| **Team Expertise** | 20% | 5/5 (1.0) | 2/5 (0.4) | 1/5 (0.2) | Option A |
| **Total Score** | 100% | **3.4** | **3.35** | **2.8** | **Option A** |
```

## Code Examples

### Example 1: Build vs Buy Decision

**Scenario:** Choose between Auth.js (build) vs Clerk (buy)

```markdown
# ADR-005: Use Clerk for Authentication

**Type:** Type 1 Decision (Irreversible)
**Status:** Accepted
**Date:** 2025-01-15

## Context
We're launching a new B2B SaaS platform. We need authentication with SSO, MFA, and user management.

## Considered Options

### Option A: Build with Auth.js
**Pros:**
- Full control over user experience
- No vendor lock-in
- Custom authentication flows possible
- No monthly cost per user

**Cons:**
- 6-8 weeks to implement correctly
- 2 FTE ongoing maintenance (security updates, compliance)
- Must handle PCI/SOC 2 compliance ourselves
- Need to build admin dashboard from scratch

### Option B: Use Clerk
**Pros:**
- Time-to-market: 2 days to full integration
- Managed security updates and compliance
- Built-in admin dashboard
- Handles PCI/SOC 2 compliance

**Cons:**
- $1-25/user/month (scales with usage)
- Vendor lock-in
- Limited customization of login UI
- Dependent on Clerk's uptime

## Decision
**Choose: Clerk**

Because:
1. **Reversibility:** Medium cost. We can migrate to Auth.js in 3-4 weeks if needed (Type 1 with exit strategy).
2. **Time to market:** $50K/year < 2 FTE ($200K/year) + 6-week delay
3. **Security risk:** Clerk's team focuses exclusively on auth; lower chance of critical bugs
4. **Future flexibility:** Can customize later or add Auth.js for specific flows

## Consequences

**Positive:**
- Ship MVP in 2 weeks instead of 8
- Reduce security surface area
- Compliance handled by third party

**Negative:**
- Monthly vendor dependency
- Less control over user experience
- Potential cost escalation if user base grows rapidly

## Validation
- [ ] Successfully log in with email/password/Google/GitHub
- [ ] SSO SAML flow tested with Okta
- [ ] MFA works correctly (TOTP + SMS)
- [ ] Cost modeling shows ROI even at 10k users
- [ ] Clerk SLA reviewed (99.99% uptime)
```

### Example 2: Technology Selection

**Scenario:** Postgres vs MongoDB for new analytics service

```markdown
# ADR-008: Use PostgreSQL for Analytics Data Store

**Type:** Type 1 Decision
**Status:** Accepted

## Decision Matrix Scoring

| Criteria | Weight | Postgres | MongoDB |
|----------|--------|----------|---------|
| **Complex Queries** | 30% | 5/5 = 1.5 | 2/5 = 0.6 |
| **Operational Cost** | 25% | 4/5 = 1.0 | 2/5 = 0.5 |
| **Query Performance** | 20% | 4/5 = 0.8 | 5/5 = 1.0 |
| **Scaling Complexity** | 15% | 2/5 = 0.3 | 4/5 = 0.6 |
| **Team Expertise** | 10% | 5/5 = 0.5 | 2/5 = 0.2 |
| **TOTAL** | 100% | **4.1** | **3.3** |

**Winner: PostgreSQL**

## Rationale

**Why Postgres (not MongoDB):**
- Heavy aggregation queries (GROUP BY, JOINs) on analytics data
- Team expertise: 5 engineers know Postgres, 0 know MongoDB
- Cost at scale: Postgres RDS cheaper than MongoDB Atlas for 50GB+
- Complex reporting requirements need transactions

**Why not MongoDB:**
- Document model doesn't fit analytics patterns
- Would require ETL pipeline to normalize data
- Aggregation framework less mature than SQL
- Learning curve for team
```

## Best Practices

### Writing Neutral Trade-Offs

**❌ Biased:**
> "Postgres is obviously better because it's ACID-compliant and SQL is industry standard."

**✅ Neutral:**
> "Postgres provides ACID guarantees and mature SQL tooling, essential for our reporting requirements. MongoDB offers horizontal scaling and flexible schemas—less critical for our use case with fixed data structure."

### Decision Fatigue Prevention

**For Type 2 decisions**, use "reversibility checkpoints":

```markdown
# Decision: Use Next.js App Router (Type 2)

This is reversible. Checkpoints to reconsider:
- [ ] Week 1: Initial prototype - assess learning curve
- [ ] Week 4: First deploy - monitor bundle size
- [ ] Month 2: Reassess if complexity exceeds benefit

If blocked: Fall back to Pages Router with 1 day of refactoring.
```

### Documenting Constraints

**Always explicit:** What assumptions does this decision rest on?

```markdown
## Assumptions
- TypeScript expertise required (4/5 team members have it)
- AWS infrastructure available (existing VPC, IAM setup)
- Acceptable cost increase to $5k/month
- Migration timeline: 4 weeks acceptable
```

### When to Update Decisions

- Status changes: `Accepted` → `Deprecated` (if replacing)
- Revisit trigger met: "Reassess if we hit 100k users"
- Consequences proved wrong: Document in new ADR why it failed

```markdown
# ADR-012: Migrate from REST to GraphQL (Supersedes ADR-001)

**Status:** Accepted  
**Supersedes:** ADR-001  
**Reason:** REST API became bottleneck at 50k+ users; GraphQL reduces over-fetching
```

## Common Errors & Solutions

**Error: "Too much context, unclear decision"**
- Split into multiple ADRs (one decision per document)
- If two decisions are entangled, document the relationship

**Error: "Decision matrix scores seem arbitrary"**
- Document scoring rationale for each cell
- Show the math: "Cost 4/5 because $5k/month is 20% of competitor"
- Get consensus: Weight and scores should be reviewed

**Error: "ADR outdated; nobody knows why we chose this"**
- Add review trigger: "Revisit every 12 months or if [trigger]"
- Link from code: `// See ADR-003 for why we use this pattern`
- Store in git alongside code

**Error: "RFC feedback got ignored; decision still rejected"**
- RFC must have resolution: "Accepted", "Deferred", or "Rejected with reasoning"
- Document why feedback didn't change outcome
- If rejected, summarize learnings

**Error: "Too many Type 1 decisions; slow velocity"**
- Reclassify more decisions as Type 2 (reduce gate-keeping)
- Use decision stacking: Break complex Type 1 into reversible Type 2 steps
- Example: Instead of "Choose database for 5-year plan", decide "Use Postgres for Q1 MVP" (revisit Q2)

## Real-World Workflow

### Team Decision Process

```
1. Problem identified → Developer drafts ADR (Proposed)
2. Team reviews → Async feedback in PR for 2 days
3. Refinements made → Status → Accepted
4. Implementation → Validation checklist verified
5. Retrospective → Update ADR with actual consequences
```

### Decision Repository Structure

```
/docs
  /adr
    /0001-use-trpc-for-apis.md
    /0002-postgres-primary-db.md
    /0003-deploy-to-aws.md
  /rfcs
    /2025-01-microservices-migration.md
    /2025-02-auth-system-redesign.md
```

### Integration with Code

```typescript
// src/db/connection.ts
// See docs/adr/0002-postgres-primary-db.md
// ADR status: Accepted
// Chosen over: MongoDB (costs), DynamoDB (complexity)

import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## References

- **MADR (Markdown ADR) Official:** https://adr.github.io/madr/
- **ADR GitHub Collection:** https://github.com/joelparkerhenderson/architecture_decision_record
- **Log4Brains (ADR Tool):** https://github.com/thomvaill/log4brains
- **Type 1 vs Type 2 Decisions (Bezos Framework):** Amazon Shareholder Letter 2016
- **RFC Process Guide:** https://kieranpotts.com/rfcs
- **Decision Matrix Templates:** https://www.smartsheet.com/decision-matrix-templates
- **Build vs Buy Framework:** https://caroli.org/en/mvp-build-or-buy-decision-making/
- **MCDA (Multi-Criteria Decision Analysis):** https://pmc.ncbi.nlm.nih.gov/articles/PMC12547007/

---

## Quick Checklists

### ADR Writing Checklist

- [ ] Title is imperative statement (`Use tRPC for APIs`, not `Should we use tRPC?`)
- [ ] Status is one of: Proposed, Accepted, Rejected, Deprecated, Superseded
- [ ] All considered options at same abstraction level (not "REST" vs "HTTP")
- [ ] Trade-offs are neutral and factual
- [ ] Consequences list both positive and negative
- [ ] Validation method specified (how to confirm decision worked?)
- [ ] Links to code or related ADRs included
- [ ] Accessible to future engineers (explain jargon)

### RFC Review Checklist

- [ ] Problem clearly stated (not just "we need this")
- [ ] All alternatives considered with trade-offs
- [ ] Consequences (costs, risks) fully explored
- [ ] Implementation plan has owners and dates
- [ ] Success criteria measurable and testable
- [ ] At least 48 hours feedback window for team
- [ ] Objections documented (even if not adopted)

### Decision Matrix Checklist

- [ ] Criteria weights sum to 100%
- [ ] Scoring scale consistent (1-5 for all)
- [ ] Scoring rationale documented
- [ ] 3+ options considered
- [ ] Highest score option makes intuitive sense
- [ ] Outlier scores explained
- [ ] Stakeholder sign-off captured