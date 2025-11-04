# Report Templates for User Feedback Analysis

## Template Selection Guide

Choose report format based on:
- **Audience:** Leadership, Product, Engineering, Design, Sales
- **Purpose:** Strategic planning, sprint planning, stakeholder update
- **Time available:** 5-minute read vs deep dive
- **Action required:** Immediate fixes vs long-term roadmap

---

## Template 1: Executive Summary (1-Page)

**Use for:** Leadership, board presentations, quarterly reviews

```markdown
# User Feedback Analysis - Executive Summary
**Period:** [Date Range]
**Analyst:** [Name]
**Date:** [Analysis Date]

## Key Findings

**Overall Sentiment:** [Score]/5.0 ([Trend] vs previous period)

**Critical Issues Requiring Immediate Attention:**
1. [Issue 1] - Affects [X]% of users, sentiment [score], severity [high/critical]
2. [Issue 2] - Mentioned [X] times, blocking [outcome]
3. [Issue 3] - Risk: [churn/revenue/reputation impact]

**Top Opportunities:**
1. [Opportunity 1] - [Expected impact if implemented]
2. [Opportunity 2] - Quick win, high satisfaction boost
3. [Opportunity 3] - Competitive differentiator

## Metrics

| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Total Feedback Items | XXX | XXX | +/- XX% |
| Average Sentiment | X.X/5.0 | X.X/5.0 | +/- 0.X |
| NPS Score | XX | XX | +/- X |
| Critical Issues | X | X | +/- X |

## Top 5 Themes

1. **[Theme 1]** (XX% of feedback) - [Brief description]
2. **[Theme 2]** (XX% of feedback) - [Brief description]
3. **[Theme 3]** (XX% of feedback) - [Brief description]
4. **[Theme 4]** (XX% of feedback) - [Brief description]
5. **[Theme 5]** (XX% of feedback) - [Brief description]

## Recommended Actions

**This Week:**
- [ ] [Action 1]
- [ ] [Action 2]

**This Month:**
- [ ] [Action 3]
- [ ] [Action 4]

**This Quarter:**
- [ ] [Strategic initiative 1]
- [ ] [Strategic initiative 2]

## Business Impact

**If we address top 3 issues:**
- Estimated impact: [X% reduction in churn, X% increase in satisfaction, etc.]
- Investment required: [time/resources]
- Timeline: [when improvements can ship]

---
*Full detailed report available upon request.*
```

---

## Template 2: Detailed Analysis Report (8-15 Pages)

**Use for:** Product team deep dives, strategic planning sessions

```markdown
# Comprehensive User Feedback Analysis Report

## Table of Contents
1. Executive Summary
2. Methodology & Data Sources
3. Overall Findings
4. Theme-by-Theme Analysis
5. User Journey Analysis
6. Competitive Insights
7. Recommendations & Roadmap
8. Appendix

---

## 1. Executive Summary
[Use Executive Summary template above]

---

## 2. Methodology & Data Sources

### Data Collection Period
**Start Date:** [Date]
**End Date:** [Date]
**Total Duration:** [X weeks/months]

### Feedback Sources

| Source | Volume | % of Total | Response Rate |
|--------|--------|------------|---------------|
| NPS Survey | XXX | XX% | XX% |
| App Store Reviews | XXX | XX% | N/A |
| Support Tickets | XXX | XX% | N/A |
| User Interviews | XX | X% | N/A |
| In-app Feedback | XXX | XX% | N/A |
| Social Media | XX | X% | N/A |
| **Total** | **XXX** | **100%** | **—** |

### User Demographics

- **New Users (0-30 days):** XX%
- **Regular Users (31-90 days):** XX%
- **Power Users (90+ days):** XX%
- **Free Tier:** XX%
- **Paid Tier:** XX%

### Analysis Methodology

1. Data normalization and deduplication
2. Manual review and categorization (using standardized taxonomy)
3. Sentiment scoring (manual + automated via sentiment_analyzer.py)
4. Statistical analysis (frequency, correlation, trends)
5. Qualitative analysis (themes, quotes, insights)
6. Validation with product and sales teams

### Limitations

- Sample size: [Note if statistically significant or limitations]
- Response bias: [Note any known biases in who responded]
- Time period: [Note if seasonal or event-specific factors]
- Geographic: [Note if certain regions over/under-represented]

---

## 3. Overall Findings

### Sentiment Overview

**Overall Sentiment Score:** X.X/5.0

**Distribution:**
- Very Positive (9-10): XX% [X items]
- Positive (7-8): XX% [X items]
- Neutral (5-6): XX% [X items]
- Negative (3-4): XX% [X items]
- Very Negative (1-2): XX% [X items]

**Trend:** [Up/Down/Stable] ([+/- 0.X] vs previous period)

**Key Insight:** [One-sentence takeaway about overall sentiment]

### Top 10 Themes by Volume

| Rank | Theme | Mentions | % Total | Avg Sentiment |
|------|-------|----------|---------|---------------|
| 1 | [Theme] | XXX | XX% | X.X/5.0 |
| 2 | [Theme] | XXX | XX% | X.X/5.0 |
| 3 | [Theme] | XXX | XX% | X.X/5.0 |
| 4 | [Theme] | XXX | XX% | X.X/5.0 |
| 5 | [Theme] | XXX | XX% | X.X/5.0 |
| 6 | [Theme] | XXX | XX% | X.X/5.0 |
| 7 | [Theme] | XXX | XX% | X.X/5.0 |
| 8 | [Theme] | XXX | XX% | X.X/5.0 |
| 9 | [Theme] | XXX | XX% | X.X/5.0 |
| 10 | [Theme] | XXX | XX% | X.X/5.0 |

### Category Breakdown

**By Primary Category:**
- Features (Requests): XX% [XXX items]
- Performance (Bugs/Speed): XX% [XXX items]
- Usability: XX% [XXX items]
- Pricing: XX% [XXX items]
- Support: XX% [XXX items]
- Other: XX% [XXX items]

---

## 4. Theme-by-Theme Analysis

### Theme 1: [Most Critical Theme]

**Overview:**
- Volume: XXX mentions (XX% of total feedback)
- Sentiment: X.X/5.0 (Mostly [Positive/Neutral/Negative])
- Urgency: [Critical/High/Medium/Low]
- User Segments Affected: [List segments]

**Description:**
[2-3 sentences describing what users are saying about this theme]

**Representative Quotes:**
> "Quote 1 that illustrates the issue clearly" - [User Type, Source]

> "Quote 2 showing different perspective" - [User Type, Source]

> "Quote 3 highlighting severity/emotion" - [User Type, Source]

**Root Cause Analysis:**
[What's actually causing this issue? Go beyond surface feedback]

**User Impact:**
- [Impact 1: e.g., Can't complete key workflow]
- [Impact 2: e.g., Wasting 10 minutes per day]
- [Impact 3: e.g., Considering alternatives]

**Business Impact:**
- Estimated users affected: [X% or X count]
- Churn risk: [High/Medium/Low]
- Revenue impact: [Quantify if possible]
- Support load: [X tickets per week]

**Recommendations:**
1. **Immediate action:** [What to do this week]
2. **Short-term fix:** [What to do this month]
3. **Long-term solution:** [Strategic approach]

**Success Metrics:**
- Target: [Specific, measurable goal]
- Measurement: [How to track improvement]
- Timeline: [When to reassess]

---

[Repeat for Theme 2, 3, 4, 5... covering top 8-12 themes]

---

## 5. User Journey Analysis

### Journey Stage Friction Points

```
DISCOVERY
├─ Finding Product
│  └─ Issue: [Description] (X mentions)
└─ Understanding Value
   └─ Issue: [Description] (X mentions)

SIGNUP
├─ Account Creation
│  └─ Issue: [Description] (X mentions)
└─ Email Verification
   └─ Issue: [Description] (X mentions)

ONBOARDING
├─ First Login ★ HIGH FRICTION
│  └─ Issue: [Description] (XX mentions)
├─ Tutorial/Walkthrough
│  └─ Issue: [Description] (XX mentions)
└─ First Task Completion
   └─ Issue: [Description] (X mentions)

ACTIVATION
├─ Data Import
│  └─ Issue: [Description] (X mentions)
├─ Configuration
│  └─ Issue: [Description] (X mentions)
└─ First Success
   └─ Issue: [Description] (X mentions)

RETENTION ★ HIGH FRICTION
├─ Daily Use
│  └─ Issue: [Description] (XX mentions)
├─ Feature Discovery
│  └─ Issue: [Description] (X mentions)
└─ Performance Issues
   └─ Issue: [Description] (XX mentions)

EXPANSION
├─ Advanced Features
│  └─ Issue: [Description] (X mentions)
└─ Team Collaboration
   └─ Issue: [Description] (X mentions)

RENEWAL/ADVOCACY
├─ Pricing Concerns
│  └─ Issue: [Description] (X mentions)
└─ Would Recommend If...
   └─ Issue: [Description] (X mentions)
```

### Top 3 Journey Friction Points

**1. [Highest Friction Point]**
- Stage: [Journey stage]
- Impact: [How it affects users]
- Evidence: [X mentions, sentiment Y]
- Recommendation: [How to fix]

**2. [Second Friction Point]**
- [Same structure]

**3. [Third Friction Point]**
- [Same structure]

---

## 6. Competitive Insights

### Competitors Mentioned

| Competitor | Mentions | Context |
|------------|----------|---------|
| Competitor A | XX | [Positive/Negative/Neutral] |
| Competitor B | XX | [Positive/Negative/Neutral] |
| Competitor C | XX | [Positive/Negative/Neutral] |

### Feature Gaps

**Features users want that competitors have:**

1. **[Feature 1]**
   - Mentioned: X times
   - Competitors with this: [List]
   - User quote: "[Quote]"
   - Priority: [High/Medium/Low]

2. **[Feature 2]**
   - [Same structure]

### Switching Triggers

**Why users consider leaving for competitors:**

1. [Reason 1] (X mentions)
2. [Reason 2] (X mentions)
3. [Reason 3] (X mentions)

### Our Unique Advantages

**What users love that competitors don't have:**

1. [Advantage 1] (X mentions)
2. [Advantage 2] (X mentions)
3. [Advantage 3] (X mentions)

**Strategic Implication:** [How to leverage advantages, close gaps]

---

## 7. Recommendations & Roadmap

### Critical Issues (Immediate Attention Required)

| Issue | Impact | Effort | Priority | Owner | Timeline |
|-------|--------|--------|----------|-------|----------|
| [Issue 1] | Critical | Medium | P0 | [Team] | This week |
| [Issue 2] | High | Low | P0 | [Team] | This week |

### Feature Roadmap

#### Quick Wins (High Impact, Low Effort)
- [ ] **[Feature 1]**: [Description] - [X mentions, Y impact]
- [ ] **[Feature 2]**: [Description] - [X mentions, Y impact]
- [ ] **[Feature 3]**: [Description] - [X mentions, Y impact]

**Recommendation:** Prioritize for next sprint

#### Strategic Bets (High Impact, High Effort)
- [ ] **[Feature A]**: [Description] - [X mentions, Y impact]
  - Estimated effort: [X weeks/sprints]
  - Dependencies: [List]
  - ROI: [Expected return]

- [ ] **[Feature B]**: [Description]
  - [Same structure]

**Recommendation:** Plan for Q[X] 2025

#### Consider Later (Lower Priority)
- [Feature X]: [Description] - [Why lower priority]
- [Feature Y]: [Description] - [Why lower priority]

### Action Plan

**Week 1:**
1. [ ] Fix [Critical Bug 1]
2. [ ] Follow up with users who reported [Issue]
3. [ ] Create tickets for [Quick Win features]

**Month 1:**
1. [ ] Implement [Quick Win 1, 2, 3]
2. [ ] Conduct user interviews about [Theme]
3. [ ] Design prototype for [Strategic Bet A]

**Quarter 1 2025:**
1. [ ] Launch [Strategic Bet A]
2. [ ] Measure impact on [Metrics]
3. [ ] Conduct follow-up feedback analysis

---

## 8. Appendix

### A. Complete Feedback Dataset
[Link to spreadsheet or database]

### B. Categorization Methodology
[Details on how items were categorized]

### C. Statistical Analysis Details
[Charts, graphs, correlation matrices]

### D. User Interview Transcripts
[Full transcripts or summaries]

### E. Additional Quotes by Theme
[Extended quote collection]

---

**Report prepared by:** [Name]
**Date:** [Date]
**Questions?** [Contact info]
```

---

## Template 3: Sprint Planning Report

**Use for:** Engineering/product sprint planning meetings

```markdown
# User Feedback Insights for Sprint [X]

## Overview
**Analysis Period:** [Dates]
**Focus:** Actionable items for upcoming sprint

## High-Priority Bugs from Feedback

### P0 - Critical (Blockers)
- [ ] **[Bug 1]**: [Description]
  - Reported by: [X users]
  - Repro steps: [Link to ticket]
  - Impact: [Blocks key workflow]
  - Estimated fix: [X hours/days]

### P1 - High (Important)
- [ ] **[Bug 2]**: [Description]
  - [Same structure]

## Feature Requests for Consideration

### Quick Wins (Can ship this sprint)
1. **[Feature 1]** - [X user requests]
   - User need: [Why they want this]
   - Proposed solution: [Brief spec]
   - Effort estimate: [Hours]
   - Acceptance criteria: [List]

### Requires Design (Not ready yet)
1. **[Feature A]** - [X user requests]
   - Needs: UX design, technical spec
   - Blocker: [What's missing]

## User Experience Improvements

### Usability fixes identified:
- [ ] [Issue 1]: Change [X] to improve [Y]
- [ ] [Issue 2]: Add [X] to clarify [Y]
- [ ] [Issue 3]: Fix [X] that confuses users

## Questions for Product Team

Based on feedback analysis:
1. [Question 1 about ambiguous feedback]
2. [Question 2 about priority trade-offs]
3. [Question 3 about technical feasibility]

## Success Metrics

**Sprint goal:** Reduce [specific] complaints by X%
**How to measure:**
- Track [Metric 1]
- Monitor [Metric 2]
- Survey [User segment] post-sprint

---
**Sprint planning meeting:** [Date/Time]
```

---

## Template 4: Stakeholder Update (Email Format)

**Use for:** Monthly updates to leadership, investors, board

```markdown
Subject: User Feedback Insights - [Month Year]

Hi [Name],

Quick monthly update on what we're learning from user feedback:

📊 **By the Numbers**
• [XXX] feedback items analyzed ([+/- X%] vs last month)
• Sentiment score: [X.X]/5.0 ([up/down/stable])
• NPS: [XX] ([+/- X] points)

🔴 **Critical Issues We're Addressing**
1. [Issue 1] - Fixing this week
2. [Issue 2] - Shipping solution next week
3. [Issue 3] - Investigating, update by [date]

🎯 **Top User Requests**
1. [Request 1] - [X] users asking, planning for [timeline]
2. [Request 2] - [X] users asking, evaluating feasibility
3. [Request 3] - [X] users asking, added to roadmap

✅ **Good News**
• [Positive trend or praise worth highlighting]
• [Win we should celebrate]
• [Improvement users are noticing]

📅 **Next Steps**
We're focusing on [theme] this month based on feedback volume and impact.

Full report available here: [Link]

Let me know if you have questions!

[Name]
```

---

## Template 5: Design Team Briefing

**Use for:** UX/UI design team, informing design decisions

```markdown
# UX Feedback Insights for Design Team

## Usability Issues to Address

### Navigation & Information Architecture
**Problem:** [Summary of user confusion]
- Mentioned by: [X]% of users
- Severity: [High/Medium]
- User quotes:
  > "[Quote 1]"
  > "[Quote 2]"
- Recommendation: [Design suggestion]

### Visual Design Feedback
**Problem:** [Summary of aesthetic concerns]
- [Same structure as above]

### Interaction Patterns
**Problem:** [Summary of interaction issues]
- [Same structure]

## Feature Requests with UX Implications

### [Feature 1]
**What users want:** [Description]
**Why:** [Underlying user need]
**Design considerations:**
- [Consideration 1]
- [Consideration 2]
**Inspiration:** [Similar patterns in other products]

## Mobile Experience Feedback

### Issues reported:
1. [Mobile issue 1]
2. [Mobile issue 2]
3. [Mobile issue 3]

### Opportunities:
- [Mobile opportunity 1]
- [Mobile opportunity 2]

## Accessibility Concerns

- [A11y issue 1] - Reported by [X] users
- [A11y issue 2] - [Details]

## Design Research Recommendations

Based on feedback gaps, we should conduct:
1. **Usability testing** on [specific flow/feature]
2. **User interviews** with [segment] about [topic]
3. **Competitive analysis** of [feature] implementations

---
**Design review:** [Date]
```

---

## Template 6: Customer Success Briefing

**Use for:** CS team, preparing for user conversations

```markdown
# Customer Success - User Feedback Brief

## Common User Pain Points

Be aware of these frequent issues when talking to users:

### Issue 1: [Problem]
- **Who it affects:** [User segment]
- **Workaround:** [Temporary solution to share]
- **Status:** [Being fixed/planned/investigating]
- **ETA:** [Timeline if known]

### Issue 2: [Problem]
- [Same structure]

## Frequently Requested Features

When users ask about these, here's what to say:

### [Feature 1]
- **User need:** [Why they want it]
- **Status:** [Planned for Q[X] / Under consideration / Not planned]
- **Response template:**
  > "Thanks for the feedback! We've heard this from [X] users. We're [status]. I'll add your vote to the request."

## Positive Talking Points

Things users love (use in sales calls, renewals):
1. [Positive theme 1]
2. [Positive theme 2]
3. [Positive theme 3]

## Churn Risk Signals

Watch for users mentioning:
- [Signal 1] - Indicates [risk]
- [Signal 2] - Indicates [risk]
- [Signal 3] - Indicates [risk]

**Escalation:** If you hear these, escalate to [person/team]

## New Feedback Collection

Please ask users about:
- [Topic 1] - We need more data on this
- [Topic 2] - Validating a hypothesis
- [Topic 3] - Considering for roadmap

---
**CS team meeting:** [Date/Time]
```

---

## Custom Template Guidelines

**Creating Your Own Template:**

1. **Define audience and purpose**
2. **Determine length and depth**
3. **Choose key sections** from templates above
4. **Add visualizations** if helpful
5. **Include action items** always
6. **Test with stakeholders** and iterate

**Best Practices:**
- Start with executive summary
- Use visuals (charts, quotes, journey maps)
- Make recommendations specific and actionable
- Include evidence (quotes, metrics)
- Tailor language to audience
- Provide next steps
- Link to detailed data if needed
