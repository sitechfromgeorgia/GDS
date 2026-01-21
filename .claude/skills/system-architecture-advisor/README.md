# System Architecture Advisor - Installation & Usage Guide

## What This Skill Does

The System Architecture Advisor is your expert technical architect assistant. It helps you:

✅ Design robust, scalable system architectures  
✅ Choose the right architecture patterns (microservices, monolith, serverless, etc.)  
✅ Create visual system diagrams with Mermaid  
✅ Design secure, performant APIs (REST, GraphQL, gRPC)  
✅ Select optimal tech stacks (Next.js, FastAPI, etc.)  
✅ Plan for scalability and security  
✅ Follow best practices and avoid common pitfalls  

## Installation Steps

### 1. Package the Skill

Create a ZIP file of the `system-architecture-advisor` folder:

```
system-architecture-advisor.zip
└── system-architecture-advisor/
    ├── SKILL.md
    └── references/
        ├── MICROSERVICES_PATTERNS.md
        ├── DATABASE_PATTERNS.md
        └── SECURITY_PATTERNS.md
```

**Important:** The folder structure inside the ZIP must have the skill folder as the root.

### 2. Upload to Claude

1. Open Claude Desktop
2. Go to **Settings** → **Capabilities** → **Skills**
3. Click **"Upload Skill"**
4. Select your `system-architecture-advisor.zip` file
5. Wait for upload to complete
6. Enable the skill in the Skills list

### 3. Verify Installation

Restart Claude Desktop if needed, then try a test query:

> "Help me design a scalable architecture for a SaaS product with 100K users"

Claude should recognize the skill and provide comprehensive architecture guidance.

---

## How to Use This Skill

### Example Queries

**Architecture Design:**
- "Design architecture for a real-time chat application"
- "Should I use microservices or a monolith for my startup?"
- "Create a system diagram for an e-commerce platform"

**API Design:**
- "Should I use REST or GraphQL for my API?"
- "Show me best practices for REST API design"
- "Design a GraphQL schema for a blog platform"

**Tech Stack Selection:**
- "What's the best stack for a modern SaaS product?"
- "Compare Next.js + Supabase vs Django + React"
- "Recommend a database for high-write workloads"

**Security:**
- "How do I implement secure authentication?"
- "Show me security best practices for an API"
- "Design a multi-tenant architecture with proper isolation"

**Scalability:**
- "How do I scale my database?"
- "Design a caching strategy for my app"
- "Plan for horizontal scaling"

---

## What to Expect

### Claude Will:

1. **Ask Clarifying Questions** (if needed)
   - Team size
   - Scale requirements
   - Budget constraints
   - Current pain points

2. **Provide Comprehensive Recommendations**
   - Architecture pattern selection with reasoning
   - Visual diagrams (Mermaid format)
   - Tech stack recommendations
   - Security considerations
   - Scalability plan

3. **Include Practical Examples**
   - Code snippets
   - Configuration examples
   - Real-world comparisons
   - Best practices

4. **Reference Detailed Patterns**
   - When needed, Claude will load additional reference documents
   - Microservices patterns
   - Database design patterns
   - Security best practices

---

## Progressive Disclosure

This skill uses **progressive disclosure** to stay efficient:

- **Initial Load:** Only skill metadata (~50 tokens)
- **When Relevant:** Full SKILL.md content (~5000 tokens)
- **Deep Dive:** Reference documents loaded on-demand (~5000-10000 tokens each)

You won't see all the details unless they're needed for your specific question.

---

## Skill Capabilities

### Architecture Patterns Covered

- ✅ Monolithic Architecture (Layered, Modular)
- ✅ Microservices Architecture
- ✅ Event-Driven Architecture
- ✅ Serverless Architecture
- ✅ Hybrid patterns

### API Design Support

- ✅ REST API best practices
- ✅ GraphQL schema design
- ✅ gRPC for microservices
- ✅ Decision frameworks

### Visual Diagrams

- ✅ System context diagrams
- ✅ Microservices architecture diagrams
- ✅ Event-driven flow diagrams
- ✅ Layered architecture diagrams
- ✅ Database schema diagrams
- ✅ Sequence diagrams

All diagrams use **Mermaid** syntax (renders in markdown).

### Tech Stacks

- ✅ Next.js + Supabase (Modern SaaS)
- ✅ FastAPI + PostgreSQL (Python backend)
- ✅ ASP.NET Core (Enterprise)
- ✅ Node.js + Express + MongoDB
- ✅ And more...

### Security

- ✅ Authentication patterns (OAuth 2.0, JWT)
- ✅ Authorization (RBAC, ABAC)
- ✅ API security
- ✅ Data encryption
- ✅ OWASP Top 10 mitigations

---

## Reference Documents

When you need deeper knowledge, Claude will load these references:

### MICROSERVICES_PATTERNS.md
- Communication patterns (sync/async)
- Resilience patterns (circuit breaker, retry)
- Service discovery
- Data management (saga pattern, CQRS)
- API gateway patterns
- Monitoring and observability
- Deployment patterns

### DATABASE_PATTERNS.md
- SQL vs NoSQL decision guide
- Database design patterns
- Normalization and denormalization
- Indexing strategies
- Caching patterns
- Scaling strategies
- Query optimization
- Real-world schemas

### SECURITY_PATTERNS.md
- Authentication patterns (OAuth, JWT, MFA)
- Authorization patterns (RBAC, ABAC, RLS)
- API security (rate limiting, CORS, headers)
- Data encryption (at rest, in transit)
- Password security
- SQL injection prevention
- XSS and CSRF protection
- Secrets management
- Security monitoring

---

## Best Practices for Using This Skill

### 1. Provide Context

The more context you provide, the better the recommendation:

**❌ Vague:**
> "Design an architecture"

**✅ Good:**
> "Design architecture for a SaaS product with 50K users, 5-person team, needs real-time features, using Next.js"

### 2. Ask Specific Questions

**Examples:**
- "Compare microservices vs monolith for my use case"
- "Show me a REST API design for a blog platform"
- "How do I scale my PostgreSQL database?"

### 3. Request Diagrams

**Examples:**
- "Create a system diagram for this architecture"
- "Show me an event-driven flow diagram"
- "Generate a database schema diagram"

### 4. Iterate

Don't hesitate to:
- Ask follow-up questions
- Request alternatives
- Drill into specific areas
- Request code examples

---

## Troubleshooting

### Skill Not Activating

**Possible causes:**
1. Query too generic → Be more specific about architecture needs
2. Skill not enabled → Check Settings → Capabilities → Skills
3. Need to restart → Restart Claude Desktop

**Solution:**
Use trigger words like:
- "architecture"
- "design system"
- "microservices"
- "API design"
- "tech stack"
- "scalability"

### Want More Detail

If Claude's response seems brief:
- Ask for specific patterns: "Show me the circuit breaker pattern"
- Request examples: "Give me a code example"
- Ask for diagrams: "Create a diagram for this"

---

## Example Interaction

**You:**
> "I'm building a SaaS product for project management with 10K users expected in the first year. We're a team of 3 developers. Should we start with microservices or a monolith?"

**Claude (with this skill):**
> Based on your context (team of 3, 10K users, early stage), I strongly recommend starting with a **Modular Monolith** rather than microservices.
>
> **Reasoning:**
> - Small team: Microservices overhead would slow you down
> - Predictable scale: 10K users is well within monolith capacity
> - Faster iteration: Deploy as single unit, simpler debugging
> - Future-proof: Can extract to microservices later
>
> **Recommended Stack: Next.js + Supabase**
> - Next.js App Router for frontend + API routes
> - Supabase for PostgreSQL + Auth + Storage
> - Deploy on Vercel
>
> [System diagram provided]
>
> **Migration Path:**
> When you hit 100K+ users or have 10+ developers, consider extracting:
> 1. Real-time features → Separate service
> 2. Background jobs → Queue-based workers
> 3. High-traffic APIs → Independent services
>
> Would you like me to show the detailed folder structure or security setup?

---

## Updates and Maintenance

To update this skill:
1. Modify SKILL.md or reference files
2. Re-zip the folder
3. Upload again in Claude Settings
4. Old version is replaced

---

## Questions or Issues?

If you encounter any issues or have suggestions:
- Check that ZIP structure is correct
- Verify skill is enabled in Settings
- Restart Claude Desktop
- Try more specific queries

---

**Enjoy architecting with confidence!** 🏗️✨
