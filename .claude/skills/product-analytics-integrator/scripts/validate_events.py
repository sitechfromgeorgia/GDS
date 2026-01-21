#!/usr/bin/env python3
"""
Event Naming Convention Validator

Validates that analytics events follow proper naming conventions:
- Events use Title Case
- Properties use snake_case
- No forbidden characters or patterns
- Consistent verb tense (past tense recommended)

Usage:
    python validate_events.py events.json
    python validate_events.py --check-string "Product Added"
"""

import sys
import json
import re
from typing import List, Dict, Tuple

class EventValidator:
    """Validates analytics event naming conventions"""
    
    # Patterns
    TITLE_CASE_PATTERN = r'^([A-Z][a-z]*\s*)+$'
    SNAKE_CASE_PATTERN = r'^[a-z][a-z0-9]*(_[a-z0-9]+)*$'
    CATEGORY_PREFIX_PATTERN = r'^[a-z]+:\s+([A-Z][a-z]*\s*)+$'
    
    # Common past tense verbs (recommended)
    PAST_TENSE_VERBS = [
        'added', 'clicked', 'viewed', 'completed', 'started', 'submitted',
        'created', 'updated', 'deleted', 'shared', 'exported', 'imported',
        'searched', 'filtered', 'logged', 'signed', 'purchased', 'upgraded',
        'downgraded', 'canceled', 'renewed', 'failed', 'succeeded'
    ]
    
    # Common present tense verbs (less preferred)
    PRESENT_TENSE_VERBS = [
        'add', 'click', 'view', 'complete', 'start', 'submit',
        'create', 'update', 'delete', 'share', 'export', 'import'
    ]
    
    def __init__(self):
        self.warnings = []
        self.errors = []
    
    def validate_event_name(self, event_name: str) -> Tuple[bool, List[str], List[str]]:
        """Validate a single event name"""
        errors = []
        warnings = []
        
        # Check for empty name
        if not event_name or not event_name.strip():
            errors.append("Event name is empty")
            return False, errors, warnings
        
        # Check if has category prefix
        has_category = ':' in event_name
        
        if has_category:
            # Validate category format (lowercase: Title Case)
            if not re.match(self.CATEGORY_PREFIX_PATTERN, event_name):
                errors.append(f"Category format invalid. Use format: 'category: Object Action'")
        else:
            # Validate Title Case
            if not re.match(self.TITLE_CASE_PATTERN, event_name):
                errors.append(f"Event name must be Title Case (e.g., 'Product Added')")
        
        # Check for forbidden characters
        forbidden_chars = ['_', '-', '.', ',', '!', '?', '@', '#', '$', '%']
        if any(char in event_name for char in forbidden_chars):
            errors.append(f"Event name contains forbidden characters: {', '.join(c for c in forbidden_chars if c in event_name)}")
        
        # Check verb tense
        words = event_name.lower().replace(':', '').split()
        has_present_tense = any(word in self.PRESENT_TENSE_VERBS for word in words)
        has_past_tense = any(word in self.PAST_TENSE_VERBS for word in words)
        
        if has_present_tense:
            warnings.append(f"Event uses present tense verb. Past tense is recommended for consistency")
        
        # Check for overly verbose names
        if len(event_name) > 50:
            warnings.append(f"Event name is long ({len(event_name)} chars). Consider shortening")
        
        # Check word count
        word_count = len(event_name.split())
        if word_count > 5:
            warnings.append(f"Event name has {word_count} words. Consider simplifying")
        elif word_count < 2 and not has_category:
            warnings.append("Event name should include both Object and Action")
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings
    
    def validate_property_name(self, property_name: str) -> Tuple[bool, List[str], List[str]]:
        """Validate a single property name"""
        errors = []
        warnings = []
        
        # Check for empty name
        if not property_name or not property_name.strip():
            errors.append("Property name is empty")
            return False, errors, warnings
        
        # Check snake_case
        if not re.match(self.SNAKE_CASE_PATTERN, property_name):
            errors.append(f"Property name must be snake_case (e.g., 'product_id', 'user_email')")
        
        # Check for forbidden patterns
        if property_name.startswith('_') or property_name.endswith('_'):
            errors.append("Property name should not start or end with underscore")
        
        if '__' in property_name:
            errors.append("Property name should not contain double underscores")
        
        # Check for camelCase (common mistake)
        if re.search(r'[a-z][A-Z]', property_name):
            errors.append("Property uses camelCase. Use snake_case instead")
        
        # Check length
        if len(property_name) > 50:
            warnings.append(f"Property name is long ({len(property_name)} chars)")
        
        # Check for common suffixes
        recommended_suffixes = ['_id', '_name', '_at', '_count', '_usd', '_seconds', '_ms']
        has_suffix = any(property_name.endswith(suffix) for suffix in recommended_suffixes)
        
        if not has_suffix and '_' in property_name:
            # Check if it's a boolean
            if property_name.startswith(('is_', 'has_', 'can_', 'should_')):
                pass  # Boolean naming is OK
            else:
                warnings.append(f"Consider adding descriptive suffix like _id, _name, _at, _count, etc.")
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings
    
    def validate_events_file(self, file_path: str) -> Dict:
        """Validate events from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            return {'error': f'File not found: {file_path}'}
        except json.JSONDecodeError as e:
            return {'error': f'Invalid JSON: {str(e)}'}
        
        results = {
            'total_events': 0,
            'valid_events': 0,
            'events_with_warnings': 0,
            'events_with_errors': 0,
            'event_results': []
        }
        
        # Expect format: {"events": [{"name": "...", "properties": {...}}]}
        events = data.get('events', [])
        results['total_events'] = len(events)
        
        for event in events:
            event_name = event.get('name', '')
            properties = event.get('properties', {})
            
            # Validate event name
            name_valid, name_errors, name_warnings = self.validate_event_name(event_name)
            
            # Validate properties
            property_results = []
            for prop_name, prop_value in properties.items():
                prop_valid, prop_errors, prop_warnings = self.validate_property_name(prop_name)
                
                if not prop_valid or prop_warnings:
                    property_results.append({
                        'property': prop_name,
                        'valid': prop_valid,
                        'errors': prop_errors,
                        'warnings': prop_warnings
                    })
            
            # Aggregate results
            has_errors = not name_valid or any(not pr['valid'] for pr in property_results)
            has_warnings = name_warnings or any(pr['warnings'] for pr in property_results)
            
            if not has_errors:
                results['valid_events'] += 1
            else:
                results['events_with_errors'] += 1
            
            if has_warnings:
                results['events_with_warnings'] += 1
            
            results['event_results'].append({
                'event_name': event_name,
                'valid': not has_errors,
                'name_errors': name_errors,
                'name_warnings': name_warnings,
                'property_results': property_results
            })
        
        return results

def print_validation_results(results: Dict):
    """Pretty print validation results"""
    if 'error' in results:
        print(f"\n❌ Error: {results['error']}")
        return
    
    print(f"\n📊 Validation Summary")
    print(f"{'='*50}")
    print(f"Total Events: {results['total_events']}")
    print(f"✅ Valid Events: {results['valid_events']}")
    print(f"⚠️  Events with Warnings: {results['events_with_warnings']}")
    print(f"❌ Events with Errors: {results['events_with_errors']}")
    print(f"{'='*50}\n")
    
    for event_result in results['event_results']:
        event_name = event_result['event_name']
        is_valid = event_result['valid']
        
        status = "✅" if is_valid else "❌"
        print(f"{status} {event_name}")
        
        # Show errors
        if event_result['name_errors']:
            for error in event_result['name_errors']:
                print(f"   ❌ {error}")
        
        # Show warnings
        if event_result['name_warnings']:
            for warning in event_result['name_warnings']:
                print(f"   ⚠️  {warning}")
        
        # Show property issues
        for prop_result in event_result['property_results']:
            prop_name = prop_result['property']
            print(f"   Property: {prop_name}")
            
            for error in prop_result['errors']:
                print(f"      ❌ {error}")
            
            for warning in prop_result['warnings']:
                print(f"      ⚠️  {warning}")
        
        print()

def main():
    """Main execution"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python validate_events.py events.json")
        print("  python validate_events.py --check-string 'Product Added'")
        sys.exit(1)
    
    validator = EventValidator()
    
    if sys.argv[1] == '--check-string':
        # Quick string validation
        if len(sys.argv) < 3:
            print("Error: Provide event name to check")
            sys.exit(1)
        
        event_name = ' '.join(sys.argv[2:])
        is_valid, errors, warnings = validator.validate_event_name(event_name)
        
        print(f"\nValidating: '{event_name}'")
        print(f"{'='*50}")
        
        if is_valid:
            print("✅ Event name is valid!")
        else:
            print("❌ Event name has errors:")
            for error in errors:
                print(f"   - {error}")
        
        if warnings:
            print("\n⚠️  Warnings:")
            for warning in warnings:
                print(f"   - {warning}")
        
        print()
        
    else:
        # File validation
        file_path = sys.argv[1]
        results = validator.validate_events_file(file_path)
        print_validation_results(results)
        
        # Exit code
        if results.get('events_with_errors', 0) > 0:
            sys.exit(1)
        else:
            sys.exit(0)

if __name__ == '__main__':
    main()
