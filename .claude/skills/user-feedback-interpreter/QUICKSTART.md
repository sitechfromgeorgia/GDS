# User Feedback Interpreter - Quick Start Guide

## Installation

1. **Compress this folder** to create `user-feedback-interpreter.zip`
   - Windows: Right-click folder → "Send to" → "Compressed (zipped) folder"
   - Mac: Right-click folder → "Compress user-feedback-interpreter"
   - Linux: `zip -r user-feedback-interpreter.zip user-feedback-interpreter/`

2. **Upload to Claude:**
   - Open Claude Desktop
   - Go to Settings > Capabilities
   - Click "Upload skill" or similar option
   - Select the .zip file
   - Enable the skill

3. **Restart Claude Desktop** (if prompted)

---

## First Use

### Example Prompt 1: Analyze Survey Data

```
I have 200 NPS survey responses from last month. Can you help me analyze them?
The data includes ratings and open-ended comments. I need to:
1. Identify main themes
2. Calculate sentiment scores
3. Create actionable recommendations for the product team
```

**Claude will:**
- Ask for the survey data (CSV, spreadsheet, or text)
- Normalize and categorize feedback
- Calculate metrics and sentiment
- Generate a comprehensive report with recommendations

---

### Example Prompt 2: App Store Review Analysis

```
Here are 50 app store reviews from the past week. Please:
- Cluster them into themes
- Identify critical bugs mentioned
- Show sentiment breakdown
- Recommend immediate fixes
```

**Claude will:**
- Categorize reviews using the taxonomy
- Highlight critical issues (bugs, crashes)
- Calculate sentiment trends
- Provide prioritized action plan

---

### Example Prompt 3: Create Executive Summary

```
I've uploaded 500 feedback items. Create a 1-page executive summary for leadership showing:
- Overall sentiment and trends
- Top 3 critical issues
- Key opportunities
- Recommended actions
```

**Claude will:**
- Use the Executive Summary template
- Highlight most important findings
- Keep it concise (1 page)
- Focus on strategic insights

---

## What You Get

### Automatic Analysis

Claude will automatically:
- ✅ Categorize feedback into themes
- ✅ Score sentiment (1-5 scale)
- ✅ Identify friction points in user journey
- ✅ Spot trending issues
- ✅ Compare user segments
- ✅ Generate prioritized recommendations

### Report Formats

Choose from:
- **Executive Summary** (1 page for leadership)
- **Detailed Analysis** (8-15 pages for product team)
- **Sprint Planning** (actionable bugs and features)
- **Stakeholder Update** (monthly email format)
- **Design Briefing** (UX-focused insights)
- **Custom format** (specify your needs)

---

## Tips for Best Results

### 1. Provide Context

Tell Claude:
- Time period covered
- Data source (NPS, reviews, interviews, etc.)
- User segments involved
- What decisions you need to make

**Example:**
> "Analyzing Q4 2024 NPS feedback (500 responses) from paid users. Need to prioritize features for Q1 2025 roadmap."

### 2. Specify Your Audience

Different reports for different stakeholders:
- **Leadership:** Focus on strategic insights, metrics, business impact
- **Product team:** Detailed themes, feature requests, user stories
- **Engineering:** Bug severity, technical issues, performance
- **Design:** Usability problems, UI feedback, journey friction
- **Sales/CS:** Talking points, churn risks, positive highlights

### 3. Ask Follow-up Questions

After initial analysis, dig deeper:
- "Show me all feedback about [specific theme]"
- "Compare new users vs power users"
- "What's the root cause of [issue]?"
- "Which quick wins should we tackle first?"

### 4. Combine Multiple Sources

For comprehensive insights:
- Survey responses + app store reviews
- Support tickets + user interviews
- NPS scores + usage analytics
- Social media + in-app feedback

---

## Common Use Cases

### Use Case 1: Monthly Product Review
```
Goal: Understand what users said this month
Prompt: "Analyze October feedback. Focus on trends vs September."
Output: Monthly report with trend analysis
```

### Use Case 2: Feature Prioritization
```
Goal: Decide what features to build next
Prompt: "Categorize all feature requests by demand and impact."
Output: Prioritized feature roadmap with ROI estimates
```

### Use Case 3: Bug Triage
```
Goal: Identify critical bugs to fix
Prompt: "List all bugs by severity. Which are blocking users?"
Output: Bug report with severity scoring
```

### Use Case 4: Churn Prevention
```
Goal: Find why users are canceling
Prompt: "Analyze feedback from churned users. What made them leave?"
Output: Churn analysis with retention recommendations
```

### Use Case 5: Competitive Analysis
```
Goal: Understand competitive landscape
Prompt: "What competitors are mentioned? What features do they have that we don't?"
Output: Competitive gap analysis
```

---

## Advanced Features

### Sentiment Analysis Script

For large datasets, use the automated sentiment analyzer:

```bash
python scripts/sentiment_analyzer.py feedback_data.json
```

**Output:**
- Individual sentiment scores
- Summary statistics
- Distribution breakdown

### Custom Taxonomies

Edit `references/THEME_TAXONOMY.md` to add:
- Industry-specific categories
- Product-specific themes
- Company-specific terminology

### Integration with Tools

Skill works with:
- **Google Drive MCP:** Read feedback from Sheets/Docs
- **Slack MCP:** Analyze support channel discussions
- **GitHub/Jira MCP:** Link feedback to issues

---

## Troubleshooting

### "Skill not loading"
- Check YAML frontmatter syntax in SKILL.md
- Ensure folder name matches skill name
- Restart Claude Desktop

### "Not getting detailed analysis"
- Provide more feedback items (50+ for best results)
- Specify what type of analysis you want
- Ask for specific report format

### "Categories don't match my product"
- Customize THEME_TAXONOMY.md for your domain
- Add your own categories
- Update descriptions to match your terminology

### "Results are too general"
- Provide more context about your product
- Specify user segments clearly
- Ask for deeper analysis of specific themes

---

## Reference Files

- **SKILL.md** - Main instructions (read this for complete workflow)
- **references/ANALYSIS_METHODS.md** - Advanced statistical techniques
- **references/THEME_TAXONOMY.md** - Complete categorization system
- **references/REPORT_TEMPLATES.md** - All report formats
- **scripts/sentiment_analyzer.py** - Automated sentiment scoring
- **assets/feedback_template.csv** - Example data structure

---

## Support

**Questions?**
- Check SKILL.md for detailed instructions
- Review references/ for specific methodologies
- Examine assets/feedback_template.csv for data format

**Issues?**
- Verify skill is enabled in Settings
- Check that feedback data is properly formatted
- Try with smaller dataset first

---

## Next Steps

1. **Test with sample data:** Use the template in assets/
2. **Run real analysis:** Import your actual feedback
3. **Customize:** Adjust taxonomy and templates for your needs
4. **Share insights:** Use reports to drive product decisions

---

**Happy analyzing! Transform your user feedback into actionable product insights.**
