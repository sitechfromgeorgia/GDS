#!/usr/bin/env python3
"""
ICE Score Calculator
Calculates ICE (Impact, Confidence, Ease) scores.
"""
import argparse
import sys
import csv
import json

def calculate_ice(impact, confidence, ease):
    """Calculate ICE score"""
    ice_score = (impact + confidence + ease) / 3.0
    return round(ice_score, 2)

def interpret_score(score):
    """Interpret ICE score priority"""
    if score >= 8.0:
        return {"priority": "HIGH", "emoji": "🚀"}
    elif score >= 6.0:
        return {"priority": "MEDIUM", "emoji": "✅"}
    elif score >= 4.0:
        return {"priority": "LOW", "emoji": "⚠️"}
    else:
        return {"priority": "VERY LOW", "emoji": "❌"}

def get_category(impact, ease):
    """Categorize feature on Impact/Ease matrix"""
    high_i = impact >= 6
    high_e = ease >= 6
    if high_i and high_e:
        return "QUICK WIN"
    elif high_i and not high_e:
        return "STRATEGIC BET"
    elif not high_i and high_e:
        return "FILL-IN"
    else:
        return "TIME SINK"

def main():
    parser = argparse.ArgumentParser(description='Calculate ICE scores')
    parser.add_argument('--impact', type=float)
    parser.add_argument('--confidence', type=float)
    parser.add_argument('--ease', type=float)
    parser.add_argument('--csv', type=str)
    parser.add_argument('--output', type=str)
    parser.add_argument('--json', action='store_true')
    
    args = parser.parse_args()
    
    if args.csv:
        # Batch mode
        with open(args.csv, 'r') as f:
            reader = csv.DictReader(f)
            features = list(reader)
        
        results = []
        for feature in features:
            try:
                impact = float(feature['impact'])
                confidence = float(feature['confidence'])
                ease = float(feature['ease'])
                score = calculate_ice(impact, confidence, ease)
                interp = interpret_score(score)
                category = get_category(impact, ease)
                results.append({
                    'rank': 0,
                    'feature_name': feature['feature_name'],
                    'ice_score': score,
                    'priority': interp['priority'],
                    'category': category
                })
                print(f"{interp['emoji']} {feature['feature_name']}: {score:.2f} ({category})")
            except Exception as e:
                print(f"⚠️  Error: {e}")
        
        results.sort(key=lambda x: x['ice_score'], reverse=True)
        for idx, result in enumerate(results, 1):
            result['rank'] = idx
        
        if args.output:
            with open(args.output, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['rank', 'feature_name', 'ice_score', 'priority', 'category'])
                writer.writeheader()
                writer.writerows(results)
            print(f"\n✅ Saved to: {args.output}")
    
    elif all([args.impact, args.confidence, args.ease]):
        # Single feature mode
        score = calculate_ice(args.impact, args.confidence, args.ease)
        interp = interpret_score(score)
        category = get_category(args.impact, args.ease)
        print(f"\nICE Score: {score:.2f}")
        print(f"{interp['emoji']} Priority: {interp['priority']}")
        print(f"Category: {category}")
        
        if args.json:
            result = {
                "ice_score": score,
                "priority": interp["priority"],
                "category": category
            }
            print(json.dumps(result, indent=2))
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
