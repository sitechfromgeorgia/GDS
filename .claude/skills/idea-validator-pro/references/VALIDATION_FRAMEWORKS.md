# Validation Frameworks Reference

## Overview

This document provides detailed validation methodologies that complement the core validation process. Use these frameworks when you need deeper analysis or structured approaches.

## 1. Lean Startup Framework

**Created by:** Eric Ries

**Core Principle:** Build-Measure-Learn feedback loop

### Process:
1. **Build** - Create minimum viable product (MVP)
2. **Measure** - Collect data on how customers actually use it
3. **Learn** - Determine whether to persevere or pivot
4. **Repeat** - Iterate based on learnings

**Best For:**
- Early-stage startups
- Products with unclear market fit
- Rapid iteration environments

**Key Metrics:**
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Activation rate
- Retention rate

**Application:**
Use Lean Startup when you need to validate product-market fit through real user interaction rather than just research.

---

## 2. Customer Development Framework

**Created by:** Steve Blank

**Core Principle:** Get out of the building and talk to customers

### Four Stages:
1. **Customer Discovery** - Identify the problem and customer segment
2. **Customer Validation** - Develop sales model that can be replicated
3. **Customer Creation** - Create end-user demand
4. **Company Building** - Transition from learning mode to execution

### Validation Questions:
- **Problem Questions:**
  - What's the biggest pain point in your workflow?
  - How are you solving this today?
  - What would it be worth to solve this?

- **Solution Questions:**
  - Would this solution address your problem?
  - What features are must-haves vs. nice-to-haves?
  - What would prevent you from using this?

- **Business Model Questions:**
  - How much would you pay for this?
  - How would you prefer to pay (subscription, one-time, etc.)?
  - Who makes buying decisions in your organization?

**Best For:**
- B2B products
- Enterprise software
- Products requiring deep customer understanding

**Application:**
Use Customer Development when you need to validate not just the product, but the entire business model including sales and distribution.

---

## 3. Design Thinking Framework

**Created by:** IDEO/Stanford d.school

**Core Principle:** Human-centered problem solving

### Five Stages:
1. **Empathize** - Understand users deeply
2. **Define** - Clearly articulate the problem
3. **Ideate** - Generate multiple solution concepts
4. **Prototype** - Build to think and learn
5. **Test** - Gather feedback and iterate

### Validation Techniques:
- **Empathy Mapping:**
  - What do users Say, Think, Do, Feel?
  - Identify gaps between stated needs and observed behavior

- **Journey Mapping:**
  - Map current experience (as-is)
  - Map desired experience (to-be)
  - Identify pain points and opportunities

- **Rapid Prototyping:**
  - Paper prototypes
  - Clickable mockups
  - Wizard of Oz testing
  - Concierge MVP

**Best For:**
- Consumer products
- UX-heavy applications
- Products requiring innovative solutions

**Application:**
Use Design Thinking when user experience is critical and you need to deeply understand user needs before building.

---

## 4. Jobs-to-be-Done (JTBD) Framework

**Created by:** Clayton Christensen

**Core Principle:** People don't buy products, they hire them to do a job

### Validation Approach:
1. **Identify the Job** - What are users trying to accomplish?
2. **Understand Context** - When and why does this job arise?
3. **Map Alternatives** - What are they currently "hiring" to do this job?
4. **Evaluate Switching Costs** - What would make them switch?

### Job Story Format:
```
When [situation],
I want to [motivation],
So I can [expected outcome].
```

**Example:**
```
When I'm launching on Product Hunt,
I want to quickly create a professional landing page,
So I can maximize the chances of getting upvoted.
```

### Validation Questions:
- What job is your product being hired to do?
- What are users hiring today to do this job?
- Why would they fire their current solution?
- What outcomes matter most to them?

**Best For:**
- Understanding true user motivation
- Identifying non-obvious competition
- Finding differentiation opportunities

**Application:**
Use JTBD when you need to understand the deeper motivation behind user behavior and identify unexpected competitors.

---

## 5. Pretotyping Framework

**Created by:** Alberto Savoia (Google)

**Core Principle:** Make sure you're building the RIGHT it before you build it RIGHT

### Types of Pretotypes:

#### The Mechanical Turk
Fake automation with humans behind the scenes
**Example:** Zapier's founders manually executed workflows before building automation

#### The Fake Door
Test interest without building
**Example:** Landing page with "Coming Soon" button

#### The Pinocchio
Use existing tools to simulate your product
**Example:** Use Airtable + Zapier to fake a complex SaaS

#### The YouTube Pretotype
Video demonstration instead of working product
**Example:** Dropbox's original demo video

### Validation Metrics:
- **Market Engagement Index:** Clicks / Views
- **Your Idea Index:** Actual engagement / Expected engagement
- **Skin in the Game:** Pre-orders / Total interested

**Best For:**
- Testing demand before building
- Low-budget validation
- Quick hypothesis testing

**Application:**
Use Pretotyping when you want to validate demand with minimal investment before writing any code.

---

## 6. ICE Scoring Framework

**ICE = Impact × Confidence × Ease**

### Scoring Method:
Rate each factor from 1-10:

**Impact:** How much will this move the needle?
- 1-3: Minor improvement
- 4-7: Significant impact
- 8-10: Game-changing

**Confidence:** How sure are you about your estimates?
- 1-3: Pure speculation
- 4-7: Some data/research
- 8-10: Strong evidence

**Ease:** How easy is it to implement?
- 1-3: Very complex
- 4-7: Moderate effort
- 8-10: Quick win

**Total Score = (Impact + Confidence + Ease) / 3**

**Best For:**
- Prioritizing multiple ideas
- Feature prioritization
- Quick decision-making

**Application:**
Use ICE when you have multiple ideas and need a simple framework to prioritize them.

---

## 7. Sean Ellis Test

**The One Question:** "How would you feel if you could no longer use [product]?"

### Responses:
- Very disappointed
- Somewhat disappointed
- Not disappointed
- N/A - no longer use

**Product-Market Fit Threshold:** 40%+ saying "very disappointed"

### Why It Works:
- Simple to implement
- Cuts through bias
- Predicts retention
- Standardized across products

**When to Use:**
- After getting first users
- Before scaling marketing
- Quarterly health check

**Best For:**
- Measuring product-market fit
- B2C products
- Products with active users

**Application:**
Use the Sean Ellis Test when you have users and need to measure if you've achieved product-market fit.

---

## 8. Opportunity Scoring

**Method:** Survey target users on importance vs. satisfaction

### Opportunity Formula:
```
Opportunity = Importance + (Importance - Satisfaction)
```

### Example:
Feature: Automated invoice generation
- Importance: 9/10
- Satisfaction (current solutions): 4/10
- Opportunity = 9 + (9 - 4) = 14

High opportunity = high importance, low satisfaction

**Best For:**
- Feature prioritization
- Finding gaps in market
- Product roadmap planning

**Application:**
Use Opportunity Scoring when you need to identify which problems are worth solving based on user priorities.

---

## Choosing the Right Framework

| Framework | Best For | Time Required | Data Needed |
|-----------|----------|---------------|-------------|
| Lean Startup | Rapid iteration | Ongoing | Usage metrics |
| Customer Development | B2B validation | 4-8 weeks | Interview data |
| Design Thinking | UX innovation | 2-4 weeks | User research |
| JTBD | Deep motivation | 2-3 weeks | Interview data |
| Pretotyping | Quick validation | 1-2 days | Engagement data |
| ICE Scoring | Prioritization | 30 minutes | Estimates |
| Sean Ellis Test | PMF measurement | 1 day | User survey |
| Opportunity Scoring | Feature priority | 1 week | Survey data |

---

## Combined Approach

**For Solo Founders Building SaaS:**

1. **Week 1:** Use JTBD to understand user motivation
2. **Week 2:** Create pretotype to test demand
3. **Week 3:** Conduct customer development interviews
4. **Week 4:** Use ICE to prioritize MVP features
5. **Weeks 5-8:** Build MVP using Lean Startup approach
6. **Week 9:** Deploy Sean Ellis test to measure PMF

This combined approach balances speed with thoroughness while keeping investment minimal.

---

## Additional Resources

**Books:**
- "The Lean Startup" by Eric Ries
- "The Four Steps to the Epiphany" by Steve Blank
- "Sprint" by Jake Knapp
- "The Mom Test" by Rob Fitzpatrick
- "Competing Against Luck" by Clayton Christensen

**Online Communities:**
- Indie Hackers (indiehackers.com)
- Product Hunt discussions
- r/startups and r/SaaS on Reddit
- Y Combinator's Hacker News

**Tools:**
- Google Forms (surveys)
- Typeform (better surveys)
- Hotjar (user behavior)
- Maze (prototype testing)
- UserTesting (video feedback)