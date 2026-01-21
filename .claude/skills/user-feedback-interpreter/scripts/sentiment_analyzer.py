#!/usr/bin/env python3
"""
Sentiment Analyzer for User Feedback
Analyzes sentiment of feedback text using keyword-based scoring.
For production use, consider integrating with NLP services like:
- Azure Text Analytics
- Google Cloud Natural Language API
- AWS Comprehend
- OpenAI API
"""

import sys
import json
import re
from typing import Dict, List, Tuple
from collections import defaultdict


# Sentiment keyword dictionaries
VERY_POSITIVE_KEYWORDS = {
    'love', 'amazing', 'awesome', 'excellent', 'fantastic', 'outstanding',
    'exceptional', 'perfect', 'wonderful', 'brilliant', 'superb', 'incredible',
    'best', 'game-changer', 'revolutionary', 'delighted', 'thrilled'
}

POSITIVE_KEYWORDS = {
    'good', 'great', 'nice', 'helpful', 'useful', 'easy', 'simple',
    'fast', 'smooth', 'clear', 'intuitive', 'efficient', 'reliable',
    'satisfied', 'happy', 'appreciate', 'impressed', 'recommend',
    'like', 'works well', 'pleased', 'solid', 'convenient'
}

NEGATIVE_KEYWORDS = {
    'bad', 'poor', 'slow', 'hard', 'difficult', 'confusing', 'complicated',
    'frustrating', 'annoying', 'disappointing', 'problem', 'issue', 'bug',
    'broken', 'error', 'fail', 'missing', 'lacks', 'wish', 'needs',
    'disappointed', 'unhappy', 'mediocre', 'awkward', 'clunky'
}

VERY_NEGATIVE_KEYWORDS = {
    'terrible', 'awful', 'horrible', 'worst', 'hate', 'garbage', 'trash',
    'useless', 'unusable', 'disaster', 'nightmare', 'pathetic', 'ridiculous',
    'unacceptable', 'infuriating', 'rage', 'furious', 'scam', 'waste',
    'canceling', 'cancelled', 'refund', 'never again', 'switching'
}

# Negation words that flip sentiment
NEGATIONS = {'not', 'no', "don't", "doesn't", "didn't", "won't", "can't", 
             "isn't", "aren't", "wasn't", "weren't", 'never', 'neither', 'nor'}

# Intensifiers that amplify sentiment
INTENSIFIERS = {'very', 'really', 'extremely', 'incredibly', 'absolutely',
                'completely', 'totally', 'utterly', 'highly', 'super'}


def clean_text(text: str) -> str:
    """Normalize text for analysis."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of feedback text.
    
    Returns:
        dict: {
            'score': float (1.0 to 5.0),
            'label': str (Very Negative, Negative, Neutral, Positive, Very Positive),
            'confidence': float (0.0 to 1.0),
            'signals': dict of detected patterns
        }
    """
    cleaned = clean_text(text)
    words = cleaned.split()
    
    # Count sentiment indicators
    signals = {
        'very_positive': 0,
        'positive': 0,
        'negative': 0,
        'very_negative': 0,
        'negations': 0,
        'intensifiers': 0
    }
    
    # Analyze words with context
    for i, word in enumerate(words):
        # Check for negation before word
        has_negation = i > 0 and words[i-1] in NEGATIONS
        has_intensifier = i > 0 and words[i-1] in INTENSIFIERS
        
        multiplier = 1.5 if has_intensifier else 1.0
        
        if word in VERY_POSITIVE_KEYWORDS:
            if has_negation:
                signals['very_negative'] += multiplier
            else:
                signals['very_positive'] += multiplier
                
        elif word in POSITIVE_KEYWORDS:
            if has_negation:
                signals['negative'] += multiplier
            else:
                signals['positive'] += multiplier
                
        elif word in NEGATIVE_KEYWORDS:
            if has_negation:
                signals['positive'] += multiplier
            else:
                signals['negative'] += multiplier
                
        elif word in VERY_NEGATIVE_KEYWORDS:
            if has_negation:
                signals['positive'] += multiplier
            else:
                signals['very_negative'] += multiplier
        
        if word in NEGATIONS:
            signals['negations'] += 1
        if word in INTENSIFIERS:
            signals['intensifiers'] += 1
    
    # Calculate weighted score
    total_signals = sum([
        signals['very_positive'],
        signals['positive'],
        signals['negative'],
        signals['very_negative']
    ])
    
    if total_signals == 0:
        # Neutral if no sentiment indicators
        score = 3.0
        label = 'Neutral'
        confidence = 0.3
    else:
        # Weighted scoring: 5 for very positive, 4 for positive, etc.
        weighted_sum = (
            signals['very_positive'] * 5.0 +
            signals['positive'] * 4.0 +
            signals['negative'] * 2.0 +
            signals['very_negative'] * 1.0
        )
        score = weighted_sum / total_signals
        
        # Determine label based on score
        if score >= 4.5:
            label = 'Very Positive'
        elif score >= 3.5:
            label = 'Positive'
        elif score >= 2.5:
            label = 'Neutral'
        elif score >= 1.5:
            label = 'Negative'
        else:
            label = 'Very Negative'
        
        # Confidence based on signal strength
        confidence = min(total_signals / 5.0, 1.0)
    
    return {
        'score': round(score, 2),
        'label': label,
        'confidence': round(confidence, 2),
        'signals': signals
    }


def analyze_batch(feedback_items: List[Dict]) -> List[Dict]:
    """
    Analyze sentiment for multiple feedback items.
    
    Args:
        feedback_items: List of dicts with 'text' field
    
    Returns:
        List of dicts with added sentiment analysis
    """
    results = []
    
    for item in feedback_items:
        text = item.get('text', item.get('feedback', ''))
        if not text:
            continue
            
        sentiment = analyze_sentiment(text)
        
        result = {
            **item,
            'sentiment_score': sentiment['score'],
            'sentiment_label': sentiment['label'],
            'sentiment_confidence': sentiment['confidence']
        }
        results.append(result)
    
    return results


def generate_summary(results: List[Dict]) -> Dict:
    """Generate summary statistics from analyzed feedback."""
    if not results:
        return {}
    
    scores = [r['sentiment_score'] for r in results]
    labels = [r['sentiment_label'] for r in results]
    
    label_counts = defaultdict(int)
    for label in labels:
        label_counts[label] += 1
    
    total = len(results)
    
    return {
        'total_items': total,
        'average_score': round(sum(scores) / total, 2),
        'distribution': {
            'Very Positive': {
                'count': label_counts['Very Positive'],
                'percentage': round(label_counts['Very Positive'] / total * 100, 1)
            },
            'Positive': {
                'count': label_counts['Positive'],
                'percentage': round(label_counts['Positive'] / total * 100, 1)
            },
            'Neutral': {
                'count': label_counts['Neutral'],
                'percentage': round(label_counts['Neutral'] / total * 100, 1)
            },
            'Negative': {
                'count': label_counts['Negative'],
                'percentage': round(label_counts['Negative'] / total * 100, 1)
            },
            'Very Negative': {
                'count': label_counts['Very Negative'],
                'percentage': round(label_counts['Very Negative'] / total * 100, 1)
            }
        }
    }


def main():
    """Command-line interface for sentiment analysis."""
    if len(sys.argv) < 2:
        print("Usage: sentiment_analyzer.py <text_or_json_file>")
        print("\nExamples:")
        print("  sentiment_analyzer.py 'This product is amazing!'")
        print("  sentiment_analyzer.py feedback_data.json")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    # Check if argument is a file
    try:
        with open(arg, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Handle different JSON structures
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict) and 'feedback' in data:
            items = data['feedback']
        else:
            items = [data]
        
        # Analyze batch
        results = analyze_batch(items)
        summary = generate_summary(results)
        
        output = {
            'summary': summary,
            'results': results
        }
        
        print(json.dumps(output, indent=2))
        
    except FileNotFoundError:
        # Treat as direct text input
        text = arg
        result = analyze_sentiment(text)
        
        print(json.dumps({
            'text': text,
            **result
        }, indent=2))
    
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
