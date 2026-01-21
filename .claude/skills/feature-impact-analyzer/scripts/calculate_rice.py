#!/usr/bin/env python3
"""
RICE Score Calculator
Calculates RICE (Reach, Impact, Confidence, Effort) scores.
"""
import argparse
import sys
import csv
import json

def calculate_rice(reach, impact, confidence, effort):
    """Calculate RICE score"""
    if effort <= 0:
        raise ValueError("Effort must be > 0")
    confidence_decimal = confidence / 100.0
    rice_score = (reach * impact * confidence_decimal) / effort
    return round(rice_score, 2)

def interpret_score(score):
    """Interpret RICE score priority"""
    if score >= 1000:
        return {"priority": "CRITICAL", "emoji": "🔥"}
    elif score >= 500:
        return {"priority": "HIGH", "emoji": "⭐"}
    elif score >= 100:
        return {"priority": "MEDIUM", "emoji": "📋"}
    else:
        return {"priority": "LOW", "emoji": "⏸️"}

def main():
    parser = argparse.ArgumentParser(description='Calculate RICE scores')
    parser.add_argument('--reach', type=float)
    parser.add_argument('--impact', type=float)
    parser.add_argument('--confidence', type=float)
    parser.add_argument('--effort', type=float)
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
                reach = float(feature['reach'])
                impact = float(feature['impact'])
                confidence = float(feature['confidence'])
                effort = float(feature['effort'])
                score = calculate_rice(reach, impact, confidence, effort)
                interp = interpret_score(score)
                results.append({
                    'rank': 0,
                    'feature_name': feature['feature_name'],
                    'rice_score': score,
                    'priority': interp['priority']
                })
                print(f"{interp['emoji']} {feature['feature_name']}: {score:,.2f}")
            except Exception as e:
                print(f"⚠️  Error: {e}")
        
        results.sort(key=lambda x: x['rice_score'], reverse=True)
        for idx, result in enumerate(results, 1):
            result['rank'] = idx
        
        if args.output:
            with open(args.output, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['rank', 'feature_name', 'rice_score', 'priority'])
                writer.writeheader()
                writer.writerows(results)
            print(f"\n✅ Saved to: {args.output}")
    
    elif all([args.reach, args.impact, args.confidence, args.effort]):
        # Single feature mode
        score = calculate_rice(args.reach, args.impact, args.confidence, args.effort)
        interp = interpret_score(score)
        print(f"\nRICE Score: {score:,.2f}")
        print(f"{interp['emoji']} Priority: {interp['priority']}")
        
        if args.json:
            result = {
                "rice_score": score,
                "priority": interp["priority"]
            }
            print(json.dumps(result, indent=2))
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
