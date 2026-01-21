#!/usr/bin/env python3
"""
Demand Signal Analyzer
Analyzes demand signals for a product idea from multiple sources
"""
import sys
import json
from datetime import datetime

def analyze_demand_signals(idea_name, keywords):
    """
    Analyze demand signals for a product idea
    
    Args:
        idea_name: Name of the product idea
        keywords: List of keywords related to the idea
    
    Returns:
        dict: Analysis results with demand signals
    """
    
    results = {
        "idea": idea_name,
        "analysis_date": datetime.now().isoformat(),
        "keywords_analyzed": keywords,
        "demand_score": 0,
        "signals": [],
        "recommendations": []
    }
    
    # This is a template structure
    # In a real implementation, this would:
    # 1. Check Google Trends API for search volume trends
    # 2. Analyze Reddit discussions via API
    # 3. Check Twitter sentiment
    # 4. Scan Product Hunt for similar products
    # 5. Analyze competitor review patterns
    
    print("\n" + "="*60)
    print(f"DEMAND SIGNAL ANALYSIS: {idea_name}")
    print("="*60 + "\n")
    
    # Example structure for demand signals
    signal_template = {
        "search_trends": {
            "status": "NEEDS_MANUAL_CHECK",
            "instruction": f"Check Google Trends for: {', '.join(keywords)}",
            "what_to_look_for": [
                "Is the trend rising, stable, or declining?",
                "What's the search volume relative to related terms?",
                "Are there seasonal patterns?",
                "What related queries show up?"
            ]
        },
        "community_discussions": {
            "status": "NEEDS_MANUAL_CHECK",
            "sources": [
                f"Reddit: site:reddit.com {keywords[0]} problem",
                f"Twitter: '{keywords[0]}' -filter:retweets",
                f"Indie Hackers: Search for '{keywords[0]}'"
            ],
            "what_to_look_for": [
                "Number of discussions in last 30 days",
                "Sentiment (positive/negative/neutral)",
                "Specific pain points mentioned",
                "Workarounds people are using",
                "Willingness to pay signals"
            ]
        },
        "competitor_analysis": {
            "status": "NEEDS_MANUAL_CHECK",
            "actions": [
                f"Search Product Hunt for: {keywords[0]}",
                f"Search G2.com for: {keywords[0]} software",
                "List top 5 competitors",
                "Check their review ratings",
                "Identify gaps in their offerings"
            ]
        },
        "market_validation": {
            "status": "NEEDS_MANUAL_CHECK",
            "questions": [
                "Are there existing products people pay for?",
                "What's the typical pricing range?",
                "How mature is the market?",
                "Are new products launching in this space?",
                "What's the competitive intensity?"
            ]
        }
    }
    
    print("📊 SIGNAL CHECKLIST\n")
    print("Follow these steps to validate demand:\n")
    
    step = 1
    for signal_type, details in signal_template.items():
        print(f"{step}. {signal_type.replace('_', ' ').title()}")
        print(f"   Status: {details['status']}\n")
        
        if 'instruction' in details:
            print(f"   📍 {details['instruction']}")
        
        if 'sources' in details:
            print("   🔍 Check these sources:")
            for source in details['sources']:
                print(f"      • {source}")
        
        if 'actions' in details:
            print("   ✓ Actions:")
            for action in details['actions']:
                print(f"      • {action}")
        
        if 'questions' in details:
            print("   ❓ Questions to answer:")
            for question in details['questions']:
                print(f"      • {question}")
        
        if 'what_to_look_for' in details:
            print("   👀 What to look for:")
            for item in details['what_to_look_for']:
                print(f"      • {item}")
        
        print()
        step += 1
    
    print("\n" + "="*60)
    print("DEMAND SCORING FRAMEWORK")
    print("="*60 + "\n")
    
    scoring_criteria = {
        "Strong Demand (7-10 points)": [
            "Rising Google Trends over 12+ months",
            "50+ Reddit discussions in last month",
            "Active Twitter conversations daily",
            "Multiple competitors successfully monetizing",
            "Clear willingness to pay signals",
            "Specific, recurring pain points mentioned"
        ],
        "Moderate Demand (4-6 points)": [
            "Stable Google Trends",
            "10-50 Reddit discussions monthly",
            "Occasional Twitter mentions",
            "A few competitors exist",
            "Some evidence of payment willingness",
            "Pain point exists but not severe"
        ],
        "Weak Demand (1-3 points)": [
            "Declining or flat Google Trends",
            "<10 Reddit discussions monthly",
            "Rare Twitter mentions",
            "No or many failed competitors",
            "No clear willingness to pay",
            "Problem not frequently mentioned"
        ]
    }
    
    for category, indicators in scoring_criteria.items():
        print(f"{category}:")
        for indicator in indicators:
            print(f"  ✓ {indicator}")
        print()
    
    print("\n" + "="*60)
    print("RESEARCH TEMPLATE")
    print("="*60 + "\n")
    
    template = f"""
# Demand Research Log: {idea_name}
Date: {datetime.now().strftime('%Y-%m-%d')}

## Keywords Analyzed
{', '.join(keywords)}

## Google Trends
URL: https://trends.google.com/trends/explore?q={keywords[0].replace(' ', '+')}
- Trend Direction: [Rising / Stable / Declining]
- Absolute Volume: [High / Medium / Low]
- Time Period: Last 5 years
- Key Observation: [Your notes]

## Reddit Research
Search: site:reddit.com {keywords[0]}
- Total Discussions Found: [Number]
- Recent Activity (30 days): [Number]
- Key Subreddits: [List]
- Top Pain Points:
  1. [Pain point 1]
  2. [Pain point 2]
  3. [Pain point 3]

## Twitter Research
Search: '{keywords[0]}' -filter:retweets
- Daily Mentions: [Estimate]
- Sentiment: [Positive / Neutral / Negative]
- Key Themes: [List themes]

## Competitor Analysis
Found Competitors:
1. [Name] - $X/mo - [Brief note]
2. [Name] - $Y/mo - [Brief note]
3. [Name] - $Z/mo - [Brief note]

Market Gaps:
- [Gap 1]
- [Gap 2]

## Demand Score
Based on research: [X/10]

Justification:
[Explain your scoring]

## Next Steps
1. [Action 1]
2. [Action 2]
"""
    
    print(template)
    
    print("\n" + "="*60)
    print("💡 PRO TIPS")
    print("="*60 + "\n")
    
    tips = [
        "Spend 30-60 minutes on research, not hours",
        "Look for patterns, not single data points",
        "Check dates - old discussions may not reflect current market",
        "Follow the money - evidence people pay is most important",
        "Be skeptical - filter out hype and self-promotion",
        "Document sources - you'll want to reference them later",
        "Compare to similar successful products",
        "Ask 'why' - dig deeper than surface complaints"
    ]
    
    for i, tip in enumerate(tips, 1):
        print(f"{i}. {tip}")
    
    return results

def main():
    """Main execution function"""
    
    if len(sys.argv) < 2:
        print("Usage: python demand_analyzer.py 'Your Idea Name' [keyword1] [keyword2] ...")
        print("\nExample:")
        print("  python demand_analyzer.py 'Invoice Generator' invoice invoicing billing")
        sys.exit(1)
    
    idea_name = sys.argv[1]
    keywords = sys.argv[2:] if len(sys.argv) > 2 else [idea_name.lower()]
    
    results = analyze_demand_signals(idea_name, keywords)
    
    print("\n" + "="*60)
    print("✅ CHECKLIST COMPLETE")
    print("="*60 + "\n")
    print("Use the template above to document your findings.")
    print("Copy it to a text file and fill in your research results.\n")
    
    # Save template to file
    template_filename = f"demand_research_{idea_name.replace(' ', '_').lower()}.txt"
    print(f"💾 Save your research to: {template_filename}\n")

if __name__ == "__main__":
    main()
