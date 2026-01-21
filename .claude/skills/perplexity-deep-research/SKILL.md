---
description: Guide to using Perplexity Pro Deep Research to generate high-quality information for Agent Skills.
---

# Perplexity Pro Deep Research

## 🌟 Purpose
To leverage Perplexity's "Deep Research" capabilities to gather comprehensive, up-to-date information, code examples, and best practices for creating new AI Skills.

## 🛠️ Tools & Capabilities
-   **Deep Research Mode**: 20-50 targeted queries per session.
-   **Chain of Thought**: Analyzes and synthesizes information.
-   **Pro Output**: Structured reports with citations.

## 📋 Instructions

### 1. The Prompt Formula
```text
[CONTEXT] + [SPECIFIC QUESTION] + [CONSTRAINTS/FORMAT] + [SOURCE REQUIREMENTS]
```

### 2. Prompting Strategy
-   **Be Specific**: "LLM breakthroughs in code generation 2024-2025" vs "AI news".
-   **Set Time Bounds**: "Published in the last 12 months".
-   **Request Structure**: "Organize by: setup, usages, pitfalls".
-   **Demand Quality**: "Include official docs and GitHub repos".

### 3. Execution
1.  **Select Deep Research Model** (e.g., Sonar Deep Research).
2.  **Paste the Prompt** into Perplexity.
3.  **Refine**: If the initial plan isn't deep enough, edit the query or ask follow-up questions.
4.  **Export**: Copy the final report to `PERPLEXITY_RESULT.md`.

## 📝 Rules & Guidelines
-   **Rule 1:** One research session = One skill topic. Don't mix topics.
-   **Rule 2:** Verify code examples. Ensure they match the requested version.
-   **Rule 3:** Look for "Red Flags" (deprecated APIs, no citations).

## 💡 Examples
### Scenario: Researching Next.js 15
**Prompt:**
```text
Deep Research: Comprehensive guide to Next.js 15 Server Actions.
Focus on: form handling, optimistic updates, and Zod validation.
Provide 3 distinct patterns with complete code examples.
Include official documentation links.
```

## 📂 File Structure
- `PERPLEXITY_RESULT.md`: Where the raw research goes.
- `skills/[skill-name]/SKILL.md`: The final output.
