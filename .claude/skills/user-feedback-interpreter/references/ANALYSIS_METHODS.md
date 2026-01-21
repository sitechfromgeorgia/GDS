# Advanced Analysis Methods Reference

## Table of Contents
1. Statistical Analysis Techniques
2. Natural Language Processing Methods
3. Cohort Analysis Framework
4. Competitive Intelligence Analysis
5. Time-Series Trend Detection
6. User Journey Friction Mapping

---

## 1. Statistical Analysis Techniques

### Frequency Distribution Analysis

**Purpose:** Identify which themes appear most often in feedback

**Method:**
1. Count mentions of each theme
2. Calculate percentage of total feedback
3. Create frequency distribution chart
4. Identify top 10 themes (80/20 rule applies)

**Example Output:**
```
Theme                   | Mentions | % Total | Cumulative %
------------------------|----------|---------|-------------
Export Functionality    |      127 |    18%  |    18%
Mobile App Crashes      |       89 |    13%  |    31%
Pricing Too High        |       76 |    11%  |    42%
Slow Performance        |       54 |     8%  |    50%
```

### Sentiment Distribution

**Calculation Formula:**
```
Sentiment Score = (Very_Positive × 5 + Positive × 4 + Neutral × 3 + 
                   Negative × 2 + Very_Negative × 1) / Total_Items

Overall Score Range: 1.0 (all negative) to 5.0 (all positive)
```

**Interpretation:**
- 4.0-5.0: Excellent overall sentiment
- 3.5-3.9: Positive with room for improvement
- 3.0-3.4: Mixed sentiment, significant issues present
- 2.5-2.9: More negative than positive, urgent action needed
- 1.0-2.4: Critical sentiment issues, high churn risk

### Correlation Analysis

**Purpose:** Find relationships between variables

**Examples:**
- Does pricing feedback correlate with user tenure?
- Do feature requests correlate with user segment?
- Does negative sentiment predict churn likelihood?

**Method:**
```python
# Pseudo-code for correlation
correlation_matrix = calculate_correlations([
    'sentiment_score',
    'user_tenure_days',
    'feature_requests_count',
    'support_ticket_count',
    'churn_risk_score'
])
```

**Interpretation:**
- +0.7 to +1.0: Strong positive correlation
- +0.4 to +0.6: Moderate positive correlation
- -0.4 to +0.4: Weak/no correlation
- -0.7 to -1.0: Strong negative correlation

---

## 2. Natural Language Processing Methods

### Keyword Extraction

**N-gram Analysis:**
- Unigrams (single words): "expensive", "slow", "confusing"
- Bigrams (two words): "too expensive", "very slow", "user interface"
- Trigrams (three words): "unable to export", "keeps crashing unexpectedly"

**TF-IDF (Term Frequency-Inverse Document Frequency):**
Identifies terms that are frequent in specific feedback but rare overall:
```
TF-IDF = (Term Frequency in Document) × log(Total Documents / Documents with Term)
```

High TF-IDF scores indicate distinctive themes.

### Semantic Clustering

**Method:**
1. Convert feedback text to vector embeddings
2. Calculate similarity scores between all pairs
3. Group similar items using clustering algorithms
4. Label each cluster with representative terms

**Algorithms:**
- K-means clustering (when number of themes is known)
- Hierarchical clustering (for exploratory analysis)
- DBSCAN (for variable-size clusters)

### Entity Recognition

**Extract key entities:**
- Features mentioned: "dark mode", "API", "mobile app"
- Competitors: "Product X", "Company Y"
- Platforms: "iOS", "Android", "web browser"
- Workflows: "exporting data", "collaboration", "reporting"

---

## 3. Cohort Analysis Framework

### Cohort Definition

Group users by shared characteristics:

**Time-based Cohorts:**
- Signup month (Jan 2025 cohort vs Feb 2025 cohort)
- Product version at signup (v2.1 users vs v2.2 users)
- Days since signup (0-7 days, 8-30 days, 31-90 days, 90+ days)

**Behavior-based Cohorts:**
- Usage frequency (daily, weekly, monthly, inactive)
- Feature adoption (power users, moderate users, light users)
- Payment tier (free, starter, pro, enterprise)

**Demographic Cohorts:**
- Company size (1-10, 11-50, 51-200, 201+ employees)
- Industry vertical
- Geographic region

### Cohort Comparison

**Analysis Template:**
```
Cohort A (New Users 0-30 days):
  - Top feedback theme: Onboarding confusion (31%)
  - Sentiment: 3.2/5.0 (mixed)
  - Most requested: Better tutorials

Cohort B (Power Users 90+ days):
  - Top feedback theme: Advanced features missing (28%)
  - Sentiment: 4.1/5.0 (positive)
  - Most requested: API access

Insight: New users struggle with basics while power users want advanced capabilities. 
Recommendation: Improve onboarding while building advanced features.
```

---

## 4. Competitive Intelligence Analysis

### Competitor Mention Tracking

**When users mention competitors:**

1. **Frequency Analysis**
   - Which competitors are mentioned most?
   - In what context (positive/negative/neutral)?

2. **Feature Gaps**
   - "Product X has [feature], why don't you?"
   - List features users wish you had from competitors

3. **Switching Triggers**
   - "Considering switching to Product Y because..."
   - Document reasons users consider leaving

4. **Unique Value Props**
   - "I chose you over Competitor Z because..."
   - Identify your competitive advantages

### Competitive Matrix

Create comparison table:
```
Feature           | Our Product | Competitor A | Competitor B | User Demand
------------------|-------------|--------------|--------------|-------------
Export to PDF     |     Yes     |     Yes      |      No      |   High (127)
Dark Mode         |     No      |     Yes      |     Yes      |   High (89)
Mobile App        |     Yes     |     No       |     Yes      |  Medium (54)
API Access        |     No      |     Yes      |     Yes      |   High (76)
```

**Priority:** Focus on high-demand features where competitors have advantage.

---

## 5. Time-Series Trend Detection

### Trend Analysis Over Time

**Weekly/Monthly Tracking:**

```
Week    | Total Feedback | Avg Sentiment | Top Theme              | Change
--------|----------------|---------------|------------------------|--------
Week 1  |      127       |     3.8       | Export issues          |    —
Week 2  |      143       |     3.6       | Export issues          |  ▼ -0.2
Week 3  |      156       |     3.4       | Export + Mobile bugs   |  ▼ -0.2
Week 4  |      134       |     3.7       | Mobile bugs            |  ▲ +0.3
```

**Interpretation:**
- Week 1-3: Export issues worsening
- Week 3: New mobile bug introduced (spike)
- Week 4: Export improved, mobile still problematic

### Change Detection

**Significant changes to flag:**
- >20% increase in mentions of a theme (emerging issue)
- >0.5 point sentiment drop (deteriorating experience)
- New themes appearing (product changes, competitor actions)
- Themes disappearing (successful fixes, feature launches)

### Seasonal Patterns

**Identify cycles:**
- End-of-quarter spikes (budget/procurement feedback)
- Holiday season drops (lower engagement)
- Back-to-school surges (education products)
- Industry event correlation (conferences, launches)

---

## 6. User Journey Friction Mapping

### Journey Stage Analysis

**Map feedback to user journey stages:**

```
DISCOVERY (finding product)
  ├─ Unclear value proposition (12 mentions)
  ├─ Confusing pricing page (8 mentions)
  └─ Hard to compare plans (6 mentions)

SIGNUP (creating account)
  ├─ Too many required fields (23 mentions)
  ├─ Email verification issues (15 mentions)
  └─ Password requirements unclear (9 mentions)

ONBOARDING (first use)
  ├─ No tutorial/walkthrough (45 mentions) ← HIGH FRICTION
  ├─ Unclear where to start (31 mentions)
  └─ Too much to learn at once (22 mentions)

ACTIVATION (first success)
  ├─ Can't import existing data (34 mentions)
  ├─ Template library too limited (19 mentions)
  └─ First task took too long (11 mentions)

RETENTION (ongoing use)
  ├─ Missing key features (67 mentions) ← HIGH FRICTION
  ├─ Performance issues (42 mentions)
  └─ Mobile experience poor (38 mentions)

EXPANSION (advanced features)
  ├─ No API access (28 mentions)
  ├─ Limited integrations (21 mentions)
  └─ No team collaboration (15 mentions)

ADVOCACY (referrals/reviews)
  ├─ Pricing too high to recommend (17 mentions)
  ├─ Would recommend if [feature] added (24 mentions)
  └─ Love it but [concern] (33 mentions)
```

**Friction Scoring:**

```
Friction_Score = (Mention_Frequency × Severity × Impact_on_Conversion)

Where:
- Mention_Frequency: % of users who mention this issue
- Severity: 1-5 scale (1=minor annoyance, 5=showstopper)
- Impact_on_Conversion: Estimated % drop in conversion/retention
```

**Prioritization:**
1. Fix highest-scoring friction points first
2. Focus on early journey stages (higher leverage)
3. Quick wins: High friction, easy to fix

---

## Advanced Techniques

### Root Cause Analysis (5 Whys)

When users report issues, dig deeper:

**Example:**
- Surface feedback: "Export is broken"
- Why? "Can't export large datasets"
- Why? "Times out after 30 seconds"
- Why? "Processing happens on single server"
- Why? "No distributed processing implemented"
- Why? "Team prioritized features over infrastructure"

**Root cause:** Architecture limitation requiring infrastructure investment.

### Jobs-to-be-Done Analysis

**Reframe feedback as user goals:**

Instead of: "Need dark mode"
Reframe as: "Users want to work comfortably in low-light environments"

**Alternative solutions:**
- Dark mode (specific request)
- Adjustable contrast (more flexible)
- Blue light filter (alternative approach)
- Recommended work schedule (behavioral nudge)

### Sentiment Trajectory Prediction

**Use historical data to forecast:**

```
Current trajectory: Sentiment declining 0.1 points per week
Projection: If trend continues, will drop below 3.0 in 4 weeks
Action required: Address top negative themes before critical threshold
```

---

## Quality Metrics

**Assess analysis quality:**

- **Coverage:** % of feedback categorized (target: >95%)
- **Agreement:** Inter-rater reliability if multiple analysts (target: >80%)
- **Actionability:** % of recommendations with clear next steps (target: 100%)
- **Impact:** % of recommendations implemented (track over time)
- **Outcome:** Did implementing recommendations improve metrics?

---

## Tools & Automation

**Recommended tools for scale:**

- **Survey platforms:** Typeform, Qualtrics, SurveyMonkey
- **Sentiment analysis:** IBM Watson, Google Cloud NLP, Azure Text Analytics
- **Visualization:** Tableau, Looker, Power BI
- **Collaboration:** Miro, FigJam for journey mapping
- **Text analysis:** NVivo, Dedoose, Dovetail

**When to automate:**
- >100 feedback items per week
- Multiple feedback sources
- Need for real-time monitoring
- Stakeholders want dashboards

---

## Common Pitfalls

**Avoid these mistakes:**

1. **Analysis paralysis:** Don't let perfect be the enemy of good
2. **Confirmation bias:** Actively seek disconfirming evidence
3. **Recency bias:** Weight recent feedback too heavily
4. **Sample size fallacy:** Overgeneralize from small samples
5. **Context blindness:** Ignore external events affecting feedback
6. **Action inertia:** Analyze without implementing changes

**Best practice:** Set deadline for analysis, focus on actionable insights, implement quickly, measure impact, iterate.
