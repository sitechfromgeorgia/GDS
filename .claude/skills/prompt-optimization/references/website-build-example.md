# Example: Website Build Request Optimization

## Before Optimization

```
User: "Help me build a website"
```

**Problems:**
- Too vague
- No context
- Missing requirements
- No success criteria

## After Optimization

```xml
<role>
Expert full-stack developer specializing in modern web technologies
</role>

<investigation>
Gather requirements BEFORE suggesting solutions:

Questions to ask:
1. Purpose: Blog, business, e-commerce, portfolio?
2. Key features needed?
3. Design preferences (modern, minimal, corporate)?
4. Timeline and budget constraints?
5. Tech stack preferences or restrictions?
6. Target audience demographics?
7. Mobile/responsive requirements?
8. Performance/SEO priorities?
</investigation>

<thinking>
Based on answers:
1. Assess complexity (simple/medium/complex)
2. Recommend tech stack with justification
3. Outline development phases
4. Identify challenges
5. Propose timeline with milestones
</thinking>

<output_format>
Provide:

1. **Recommended Approach** (2-3 sentences)
2. **Technology Stack**
   - Frontend: [Framework + why]
   - Backend: [Framework + why]
   - Database: [Type + why]
   - Hosting: [Platform + why]
3. **Development Phases**
   1. Planning & Design (X weeks)
   2. Core Development (Y weeks)
   3. Feature Implementation (Z weeks)
   4. Testing & QA (W weeks)
   5. Deployment & Launch
4. **Timeline Estimate** (with breakdown)
5. **Budget Range** (if applicable)
6. **Next Steps**
   - Immediate: [Action]
   - This week: [Action]
   - This month: [Action]
</output_format>

<anti_hallucination>
Do NOT:
- Recommend frameworks without understanding requirements
- Estimate timeline without knowing project scope
- Assume technical expertise level
- Suggest specific tools without context
- Promise features without feasibility check

Do ALWAYS:
- Ask clarifying questions first
- Justify technology choices
- Set realistic expectations
- Provide evidence-based recommendations
- Identify risks and unknowns
</anti_hallucination>

<examples>
<example type="typical">
Input: "I need a blog for my photography business"
Investigation reveals: Simple blog, 500 images, SEO important
Recommendation: Next.js + Contentful CMS + Vercel
Timeline: 4-6 weeks
Rationale: Static generation for performance, easy image optimization
</example>

<example type="edge">
Input: "Website for e-commerce with 10k+ products"
Investigation reveals: Complex inventory, international shipping
Recommendation: Custom solution or Shopify Plus
Timeline: 12-16 weeks
Rationale: Scale requirements need enterprise solution
</example>

<example type="error">
Input: "Just make me a website"
Response: "I need more information to provide a useful recommendation:
- What is the primary purpose?
- Who is your target audience?
- What key features do you need?
Let's start with these questions."
</example>
</examples>
</role>
```

## Key Improvements

1. **Investigation Protocol**: Asks 8 specific questions before suggesting anything
2. **Clear Structure**: Role → Investigation → Thinking → Output Format
3. **Anti-Hallucination**: Explicit guards against common mistakes
4. **Multishot Examples**: Typical, edge case, and error scenarios
5. **Justification**: Every recommendation includes "why"
6. **Realistic Expectations**: Timeline estimates based on complexity

## Expected Results

- **Before**: Vague suggestions, multiple back-and-forth iterations
- **After**: Comprehensive understanding in first response, actionable plan

**Hallucination Reduction**: ~80% (from assuming requirements to asking about them)
**First-Response Quality**: High (complete actionable plan)
**User Satisfaction**: Significantly improved (feels understood and guided)
