# Technical SEO Specialist Skill

## Overview

A comprehensive Claude skill for conducting professional technical SEO audits and providing actionable optimization recommendations following 2025 best practices.

## What This Skill Does

This skill transforms Claude into an expert technical SEO specialist capable of:

- **Comprehensive Technical Audits**: Systematic evaluation of websites across 15+ critical SEO factors
- **Core Web Vitals Analysis**: In-depth performance optimization (LCP, INP, CLS)
- **Crawlability Diagnostics**: Identifying and fixing indexation issues
- **Mobile-First Optimization**: Ensuring mobile readiness and responsive design
- **Structured Data Validation**: Schema markup implementation and testing
- **Security Auditing**: HTTPS, mixed content, and security headers
- **Performance Optimization**: Page speed and resource loading improvements
- **Troubleshooting**: Solving common SEO technical problems

## When Claude Will Use This Skill

Claude automatically activates this skill when you:
- Request an SEO audit or website analysis
- Ask about search engine optimization
- Mention crawling, indexing, or ranking issues
- Discuss website performance or Core Web Vitals
- Need help with robots.txt, sitemaps, or schema markup
- Ask about Google Search Console errors
- Request mobile optimization guidance

## Contents

### SKILL.md
Main instructions file containing:
- Complete audit workflow (15 steps)
- Best practices and guidelines
- Reporting format standards
- Tool recommendations
- Success metrics

### scripts/
**seo-audit.py** - Automated audit script
- Checks robots.txt, meta tags, headings, HTTPS, images
- Generates health score (0-100)
- Produces JSON reports
- Command-line usage for quick checks

**Usage:**
```bash
python scripts/seo-audit.py --url https://example.com
python scripts/seo-audit.py --url https://example.com --output report.json
```

### references/
Detailed guides for advanced topics:

**CORE_WEB_VITALS_GUIDE.md**
- LCP, INP, CLS deep dive
- Optimization strategies
- Code examples
- Debugging checklist
- 2025 performance standards

**SCHEMA_TEMPLATES.md**
- JSON-LD templates for 10+ schema types
- Implementation best practices
- Validation guidelines
- Common mistakes to avoid

**TROUBLESHOOTING.md**
- Solutions to 50+ common SEO issues
- Emergency troubleshooting workflows
- Error code reference
- Diagnostic procedures

### assets/
**audit-checklist-template.md**
- Comprehensive printable checklist
- 14 major sections
- Priority scoring system
- Professional report format

## Installation

### For Claude Desktop/Web:

1. **Download this folder** as a ZIP file
2. **Compress the folder**: 
   - Windows: Right-click → Send to → Compressed (zipped) folder
   - Mac: Right-click → Compress
3. **Upload to Claude**:
   - Go to Settings → Capabilities
   - Enable "Code execution and file creation"
   - Click "Upload skill"
   - Select the .zip file
4. **Enable the skill**:
   - Toggle the skill ON in Capabilities

### For Claude Code:

```bash
# Copy to skills directory
cp -r technical-seo-specialist ~/.claude/skills/

# Verify installation
ls ~/.claude/skills/technical-seo-specialist
```

### For Claude API:

```python
from anthropic import Anthropic

client = Anthropic(
    api_key="your-api-key",
    default_headers={
        "anthropic-beta": "skills-2025-10-02"
    }
)

# Upload skill
with open("technical-seo-specialist.zip", "rb") as f:
    skill = client.beta.skills.create(
        display_title="Technical SEO Specialist",
        files=[("skill.zip", f)]
    )

# Use in conversation
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    skill_ids=[skill.id],
    messages=[{
        "role": "user",
        "content": "Audit my website for technical SEO issues"
    }]
)
```

## Usage Examples

### Basic Audit Request
```
User: "Can you perform a technical SEO audit of https://example.com?"

Claude: [Activates technical-seo-specialist skill]
         [Performs systematic 15-step audit]
         [Provides prioritized findings and recommendations]
```

### Specific Issue
```
User: "My Core Web Vitals are failing. LCP is 4.2 seconds."

Claude: [Activates skill, focuses on performance section]
         [Provides LCP-specific optimization strategies]
         [References CORE_WEB_VITALS_GUIDE.md]
```

### Schema Help
```
User: "How do I implement product schema markup?"

Claude: [Activates skill]
         [Provides template from SCHEMA_TEMPLATES.md]
         [Explains validation process]
```

### Automated Analysis
```
User: "Run the audit script on my site and show me the results."

Claude: [Executes scripts/seo-audit.py]
         [Analyzes output]
         [Provides interpreted findings]
```

## Key Features

✅ **2025 Standards**: Includes latest Core Web Vitals (INP replaces FID)  
✅ **Mobile-First**: Prioritizes mobile optimization and responsiveness  
✅ **Automation**: Includes Python script for quick technical checks  
✅ **Comprehensive**: Covers 15+ major technical SEO categories  
✅ **Actionable**: Provides specific fixes, not just problem identification  
✅ **Progressive Disclosure**: Main instructions + detailed references  
✅ **Battle-Tested**: Based on 100+ real SEO audits and 2025 best practices

## Requirements

- **Claude Plan**: Pro, Max, Team, or Enterprise
- **Code Execution**: Must be enabled in Capabilities
- **Python** (for automation script): Python 3.6+

## Skill Metadata

- **Name**: technical-seo-specialist
- **Version**: 1.0
- **License**: Apache-2.0
- **Author**: Custom Claude Skill
- **Last Updated**: November 2025
- **Model Compatibility**: Claude Sonnet 4.5+

## Troubleshooting

### Skill Not Activating
- Verify it's enabled in Settings → Capabilities
- Check description matches your query keywords
- Try being more explicit: "Use the technical SEO skill to..."
- Restart Claude Desktop if recently installed

### Script Execution Fails
- Ensure Code Execution is enabled
- Check Python is available in environment
- Verify URL is accessible
- Review script output for specific error messages

### References Not Loading
- Check file paths use forward slashes
- Verify all reference files exist
- Ensure SKILL.md correctly references files
- Try reading files directly if needed

## Support & Updates

**Documentation**: See SKILL.md for complete instructions  
**Issues**: Review TROUBLESHOOTING.md for common problems  
**Customization**: Edit SKILL.md to adapt to your needs  
**Updates**: Check for new versions periodically

## License

Apache License 2.0 - See skill metadata for details

---

**Ready to use!** Just upload the ZIP and start optimizing your websites with expert technical SEO guidance.
