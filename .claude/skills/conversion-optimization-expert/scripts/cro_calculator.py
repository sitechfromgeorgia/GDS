#!/usr/bin/env python3
"""
CRO Calculator - Conversion Rate Optimization Metrics Tool
Calculates key CRO metrics including conversion rates, funnel analysis, and impact projections.
"""

import sys
import json
from typing import Dict, List, Tuple


def calculate_conversion_rate(conversions: int, visitors: int) -> float:
    """Calculate conversion rate as percentage."""
    if visitors == 0:
        return 0.0
    return round((conversions / visitors) * 100, 2)


def calculate_revenue_impact(
    current_rate: float,
    improved_rate: float,
    monthly_visitors: int,
    avg_order_value: float
) -> Dict[str, float]:
    """Calculate revenue impact of conversion rate improvement."""
    
    current_conversions = (current_rate / 100) * monthly_visitors
    improved_conversions = (improved_rate / 100) * monthly_visitors
    additional_conversions = improved_conversions - current_conversions
    
    current_revenue = current_conversions * avg_order_value
    improved_revenue = improved_conversions * avg_order_value
    additional_revenue = additional_revenue = improved_revenue - current_revenue
    
    return {
        "current_monthly_revenue": round(current_revenue, 2),
        "improved_monthly_revenue": round(improved_revenue, 2),
        "additional_monthly_revenue": round(additional_revenue, 2),
        "annual_revenue_increase": round(additional_revenue * 12, 2),
        "additional_conversions_per_month": round(additional_conversions, 0),
        "percentage_increase": round(((improved_rate - current_rate) / current_rate) * 100, 1)
    }


def calculate_statistical_significance(
    visitors_a: int,
    conversions_a: int,
    visitors_b: int,
    conversions_b: int
) -> Dict[str, any]:
    """
    Calculate if A/B test results are statistically significant.
    Uses chi-square test approximation.
    """
    
    rate_a = calculate_conversion_rate(conversions_a, visitors_a) / 100
    rate_b = calculate_conversion_rate(conversions_b, visitors_b) / 100
    
    # Pooled probability
    pooled_prob = (conversions_a + conversions_b) / (visitors_a + visitors_b)
    
    # Standard error
    se = ((pooled_prob * (1 - pooled_prob)) * ((1 / visitors_a) + (1 / visitors_b))) ** 0.5
    
    # Z-score
    if se == 0:
        z_score = 0
    else:
        z_score = (rate_b - rate_a) / se
    
    # Statistical significance (z-score > 1.96 = 95% confidence)
    is_significant = abs(z_score) > 1.96
    confidence_level = "95%" if is_significant else "< 95%"
    
    return {
        "control_rate": round(rate_a * 100, 2),
        "variant_rate": round(rate_b * 100, 2),
        "absolute_difference": round((rate_b - rate_a) * 100, 2),
        "relative_difference": round(((rate_b - rate_a) / rate_a) * 100, 1) if rate_a > 0 else 0,
        "z_score": round(z_score, 3),
        "is_significant": is_significant,
        "confidence_level": confidence_level,
        "recommendation": "Deploy variant" if is_significant and rate_b > rate_a 
                         else "Continue testing" if not is_significant 
                         else "Stick with control"
    }


def calculate_sample_size(
    baseline_rate: float,
    minimum_detectable_effect: float,
    confidence_level: float = 95,
    statistical_power: float = 80
) -> int:
    """
    Calculate required sample size per variation for A/B test.
    
    Args:
        baseline_rate: Current conversion rate (%)
        minimum_detectable_effect: Minimum % improvement to detect (e.g., 10 for 10%)
        confidence_level: Confidence level (default 95%)
        statistical_power: Statistical power (default 80%)
    """
    
    # Z-scores for confidence level and power
    z_alpha = 1.96 if confidence_level == 95 else 2.576  # 95% or 99%
    z_beta = 0.84 if statistical_power == 80 else 1.036  # 80% or 90%
    
    p1 = baseline_rate / 100
    p2 = p1 * (1 + minimum_detectable_effect / 100)
    
    # Sample size formula
    numerator = (z_alpha + z_beta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))
    denominator = (p2 - p1) ** 2
    
    sample_size = int(numerator / denominator)
    
    return {
        "visitors_per_variation": sample_size,
        "total_visitors_needed": sample_size * 2,
        "conversions_needed_per_variation": int(sample_size * (p1 + p2) / 2),
        "baseline_rate": baseline_rate,
        "expected_improved_rate": round(p2 * 100, 2),
        "minimum_detectable_effect": minimum_detectable_effect,
        "confidence_level": confidence_level,
        "statistical_power": statistical_power
    }


def analyze_funnel(stages: List[Dict[str, int]]) -> Dict:
    """
    Analyze conversion funnel with multiple stages.
    
    Args:
        stages: List of dicts with 'name' and 'visitors' keys
        Example: [
            {"name": "Landing Page", "visitors": 10000},
            {"name": "Product Page", "visitors": 5000},
            {"name": "Add to Cart", "visitors": 500},
            {"name": "Checkout", "visitors": 350},
            {"name": "Purchase", "visitors": 300}
        ]
    """
    
    if not stages or len(stages) < 2:
        return {"error": "Need at least 2 funnel stages"}
    
    analysis = []
    total_visitors = stages[0]["visitors"]
    
    for i in range(len(stages)):
        stage = stages[i]
        stage_visitors = stage["visitors"]
        
        # Calculate conversion from previous stage
        if i == 0:
            from_previous = 100.0
            drop_off_from_previous = 0.0
        else:
            previous_visitors = stages[i-1]["visitors"]
            from_previous = calculate_conversion_rate(stage_visitors, previous_visitors)
            drop_off_from_previous = previous_visitors - stage_visitors
        
        # Calculate conversion from start
        from_start = calculate_conversion_rate(stage_visitors, total_visitors)
        
        analysis.append({
            "stage": stage["name"],
            "visitors": stage_visitors,
            "conversion_from_previous": from_previous,
            "drop_off_from_previous": drop_off_from_previous if i > 0 else 0,
            "conversion_from_start": from_start,
            "visitors_remaining": stage_visitors
        })
    
    # Overall funnel efficiency
    final_conversions = stages[-1]["visitors"]
    overall_conversion = calculate_conversion_rate(final_conversions, total_visitors)
    
    # Find biggest drop-off
    biggest_drop_stage = None
    biggest_drop_rate = 0
    
    for i in range(1, len(analysis)):
        drop_rate = 100 - analysis[i]["conversion_from_previous"]
        if drop_rate > biggest_drop_rate:
            biggest_drop_rate = drop_rate
            biggest_drop_stage = analysis[i-1]["stage"] + " → " + analysis[i]["stage"]
    
    return {
        "stages": analysis,
        "overall_conversion_rate": overall_conversion,
        "total_drop_off": total_visitors - final_conversions,
        "biggest_drop_off_point": biggest_drop_stage,
        "biggest_drop_off_rate": round(biggest_drop_rate, 2),
        "funnel_efficiency": "Good" if overall_conversion > 5 else "Needs improvement"
    }


def calculate_ice_score(impact: int, confidence: int, ease: int) -> float:
    """
    Calculate ICE prioritization score.
    
    Args:
        impact: Expected impact (1-10)
        confidence: Confidence in success (1-10)
        ease: Ease of implementation (1-10)
    """
    return round((impact + confidence + ease) / 3, 2)


def main():
    """Main CLI interface."""
    
    if len(sys.argv) < 2:
        print("""
CRO Calculator - Usage:

Basic Conversion Rate:
  python cro_calculator.py rate <conversions> <visitors>
  
Revenue Impact:
  python cro_calculator.py impact <current_rate> <improved_rate> <monthly_visitors> <avg_order_value>
  
A/B Test Significance:
  python cro_calculator.py significance <visitors_a> <conversions_a> <visitors_b> <conversions_b>
  
Sample Size Calculator:
  python cro_calculator.py sample <baseline_rate> <mde_percent>
  
Funnel Analysis:
  python cro_calculator.py funnel '<json_array>'
  Example: python cro_calculator.py funnel '[{"name":"Landing","visitors":10000},{"name":"Cart","visitors":500}]'
  
ICE Score:
  python cro_calculator.py ice <impact> <confidence> <ease>

Examples:
  python cro_calculator.py rate 150 5000
  python cro_calculator.py impact 2.5 3.5 10000 50
  python cro_calculator.py significance 5000 125 5000 175
  python cro_calculator.py sample 2.5 20
  python cro_calculator.py ice 8 7 9
        """)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    try:
        if command == "rate":
            conversions = int(sys.argv[2])
            visitors = int(sys.argv[3])
            rate = calculate_conversion_rate(conversions, visitors)
            print(json.dumps({
                "conversion_rate": rate,
                "conversions": conversions,
                "visitors": visitors,
                "benchmark": "Good" if rate > 2.5 else "Needs improvement"
            }, indent=2))
        
        elif command == "impact":
            current_rate = float(sys.argv[2])
            improved_rate = float(sys.argv[3])
            monthly_visitors = int(sys.argv[4])
            avg_order_value = float(sys.argv[5])
            
            result = calculate_revenue_impact(
                current_rate, improved_rate, monthly_visitors, avg_order_value
            )
            print(json.dumps(result, indent=2))
        
        elif command == "significance":
            visitors_a = int(sys.argv[2])
            conversions_a = int(sys.argv[3])
            visitors_b = int(sys.argv[4])
            conversions_b = int(sys.argv[5])
            
            result = calculate_statistical_significance(
                visitors_a, conversions_a, visitors_b, conversions_b
            )
            print(json.dumps(result, indent=2))
        
        elif command == "sample":
            baseline = float(sys.argv[2])
            mde = float(sys.argv[3])
            
            result = calculate_sample_size(baseline, mde)
            print(json.dumps(result, indent=2))
        
        elif command == "funnel":
            funnel_data = json.loads(sys.argv[2])
            result = analyze_funnel(funnel_data)
            print(json.dumps(result, indent=2))
        
        elif command == "ice":
            impact = int(sys.argv[2])
            confidence = int(sys.argv[3])
            ease = int(sys.argv[4])
            
            score = calculate_ice_score(impact, confidence, ease)
            print(json.dumps({
                "ice_score": score,
                "impact": impact,
                "confidence": confidence,
                "ease": ease,
                "priority": "High" if score > 7 else "Medium" if score > 5 else "Low"
            }, indent=2))
        
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
            
    except (ValueError, IndexError, KeyError) as e:
        print(f"Error: Invalid arguments - {e}")
        print("Run without arguments to see usage examples")
        sys.exit(1)


if __name__ == "__main__":
    main()
