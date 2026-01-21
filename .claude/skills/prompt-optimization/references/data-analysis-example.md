# Example: Data Analysis Request Optimization

## Before Optimization

```
User: "Analyze this CSV and find insights"
```

**Problems:**
- No data understanding first
- Missing context
- No analysis goals
- Vague "insights"

## After Optimization

```xml
<role>
Data analyst with statistical expertise and business acumen
</role>

<investigation>
Before analysis, understand the data:

1. **Data Structure Examination**
   - Column names and meanings
   - Data types (numeric, categorical, datetime)
   - Number of rows and columns
   - File encoding and delimiters
   
2. **Data Quality Assessment**
   - Missing values (how many, which columns)
   - Outliers (statistical anomalies)
   - Data inconsistencies (formatting issues)
   - Duplicates
   - Invalid entries
   
3. **Business Context**
   - What does this data represent?
   - What metrics matter for this business?
   - What decisions will this inform?
   - What's the time period covered?
   
4. **Analysis Goals**
   - Descriptive (what happened)?
   - Diagnostic (why did it happen)?
   - Predictive (what will happen)?
   - Prescriptive (what should we do)?
   
5. **Limitations & Biases**
   - Sample size adequate?
   - Selection bias present?
   - Temporal issues (seasonality)?
   - Missing data patterns
</investigation>

<analysis_protocol>
Systematic Analysis Approach:

1. **Data Profiling** (5-10 minutes)
   ```python
   # Summary statistics
   df.describe()
   
   # Data types and nulls
   df.info()
   
   # Distribution visualization
   df.hist(bins=50, figsize=(15,10))
   ```
   
2. **Quality Check** (5-10 minutes)
   - Null analysis: `df.isnull().sum()`
   - Outliers: `df[(df.value > Q3 + 1.5*IQR)]`
   - Duplicates: `df[df.duplicated()]`
   - Inconsistencies: Check value ranges, formats
   
3. **Pattern Detection** (15-20 minutes)
   - Trends: Time series plots
   - Correlations: `df.corr()` heatmap
   - Distributions: Histograms, box plots
   - Anomalies: Statistical tests
   - Segments: Groupby analysis
   
4. **Hypothesis Testing** (10-15 minutes)
   Answer specific business questions:
   - "Is metric X improving over time?" → Trend analysis
   - "Do factors Y and Z relate?" → Correlation test
   - "Are groups A and B different?" → T-test/ANOVA
   
5. **Insight Extraction** (10-15 minutes)
   Distinguish:
   - **Actionable**: Changes we can make
   - **Interesting**: Worth noting
   - **Noise**: Ignore
</analysis_protocol>

<output_format>
Deliver insights in business terms:

1. **Executive Summary** (3-5 key findings)
   - Most important insight first
   - Quantify impact when possible
   - Use plain language
   
   Example:
   "Sales increased 23% YoY, driven primarily by mobile traffic (60% growth).
   However, conversion rate dropped 5%, suggesting checkout friction."
   
2. **Data Quality Notes**
   - Issues found: "15% missing values in revenue column"
   - Limitations: "Data only covers Q3, can't assess seasonal trends"
   - Confidence: "High confidence in conclusions (n=10,000, p<0.01)"
   
3. **Key Metrics** (with context)
   Not just: "Revenue: $1M"
   But: "Revenue: $1M (↑15% vs last quarter, ↓5% vs forecast)"
   
4. **Insights** (what the data reveals)
   Structure per insight:
   - **Finding**: What we discovered
   - **Evidence**: Data supporting it
   - **Implication**: What it means
   - **Confidence**: How certain we are
   
   Example:
   "**Finding**: Mobile users convert 40% less than desktop
   **Evidence**: 2.3% mobile vs 3.8% desktop (p<0.001, n=50k)
   **Implication**: Losing ~$120k/month potential revenue
   **Confidence**: High (large sample, clear statistical significance)"
   
5. **Recommendations** (actionable next steps)
   Prioritized by:
   - Impact (high/medium/low)
   - Effort (easy/medium/hard)
   - Timeline (immediate/short-term/long-term)
   
   Example:
   "1. **Optimize mobile checkout** [High Impact, Medium Effort, 2 weeks]
   2. **A/B test new form design** [Medium Impact, Low Effort, 1 week]
   3. **Investigate page load times** [High Impact, Medium Effort, 3 weeks]"
   
6. **Methodology Notes**
   - Analysis approach used
   - Statistical tests performed
   - Tools/libraries employed
   - Assumptions made
</output_format>

<anti_hallucination>
Base ALL insights on actual data in the CSV.

Distinguish clearly between:

1. **Facts** (what data shows)
   ✅ "Mobile traffic is 60% of total"
   ❌ "Mobile is growing" (without historical data)
   
2. **Correlations** (what's related)
   ✅ "High price correlates with low conversion (r=-0.65)"
   ❌ "High prices cause low conversion" (correlation ≠ causation)
   
3. **Causation** (what causes what)
   ⚠️ NEVER claim without:
   - Controlled experiment
   - A/B test results
   - Causal inference methods
   
   Instead: "Data suggests X may influence Y, but controlled test needed"
   
4. **Speculation** (what might be true)
   ✅ Clearly label: "**Hypothesis**: Mobile users may experience checkout friction"
   ❌ State as fact: "Mobile users are frustrated"

When Uncertain:
- "Based on this data, I can't determine X"
- "We would need Y data to answer that"
- "This suggests Z, but requires validation"

Statistical Rigor:
- Report sample sizes: "Based on 10,000 transactions"
- Include confidence: "95% confidence interval: [0.12, 0.18]"
- Note significance: "Statistically significant (p<0.01)"
- Admit limitations: "Small sample, results may not generalize"
</anti_hallucination>

<examples>
<example type="typical">
CSV: Sales data with columns (date, product, revenue, channel)
Analysis:
1. Profiling: 50k rows, 3 months data, no nulls
2. Quality: Clean, well-formatted
3. Patterns: Revenue peaks on weekends, mobile growing 5%/month
4. Insights: Weekend promotions work, mobile channel opportunity
5. Recommendations: Increase weekend marketing, optimize mobile UX
</example>

<example type="edge">
CSV: Customer survey responses with free text
Analysis:
1. Profiling: 500 responses, 40% incomplete
2. Quality: Many missing values, text needs cleaning
3. Patterns: Sentiment analysis shows 70% positive
4. Insights: "fast shipping" mentioned 200x, "confusing checkout" 50x
5. Recommendations: Highlight shipping speed, simplify checkout
Caveats: Small sample, self-selection bias, qualitative
</example>

<example type="complex">
CSV: Time series with anomalies
Analysis:
1. Profiling: 2 years daily data, outliers detected
2. Quality: 3% outliers, likely data errors (values = 0 or >1000x mean)
3. Cleaning: Remove statistical outliers, interpolate missing
4. Patterns: Strong seasonality, upward trend, weekly cycles
5. Insights: 20% YoY growth, Q4 spikes 50%, Wednesday dips 15%
6. Recommendations: Staff up for Q4, investigate Wednesday issue
Method: Time series decomposition, seasonal ARIMA modeling
</example>
</examples>
</role>
```

## Key Improvements

1. **Data Understanding First**: Complete profiling before analysis
2. **Quality Assessment**: Explicit checks for data issues
3. **Systematic Protocol**: 5-step analysis framework
4. **Evidence-Based**: Every insight backed by data
5. **Statistical Rigor**: Confidence intervals, p-values, sample sizes
6. **Clear Distinctions**: Facts vs correlations vs causation vs speculation
7. **Business Impact**: Quantified recommendations with priorities

## Expected Results

- **Before**: Surface-level observations, potential hallucinations
- **After**: Deep, evidence-based insights with statistical rigor

**Hallucination Reduction**: ~90% (from assumptions to data-driven conclusions)
**Insight Quality**: Significantly higher (actionable, quantified, validated)
**Business Value**: Measurable (clear ROI on recommendations)
