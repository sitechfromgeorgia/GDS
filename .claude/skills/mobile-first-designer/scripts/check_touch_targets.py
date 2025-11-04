#!/usr/bin/env python3
"""
Touch Target Validator
Analyzes HTML/CSS for touch target size compliance (44x44px minimum)
"""

import re
import sys
import json
from pathlib import Path

class TouchTargetValidator:
    def __init__(self):
        self.MIN_SIZE = 44  # pixels
        self.MIN_SPACING = 8  # pixels
        self.issues = []
        self.passed = []
        
    def analyze_css(self, css_content):
        """Analyze CSS for touch target compliance"""
        
        # Find all interactive element styles
        interactive_patterns = [
            r'button\s*{([^}]+)}',
            r'\.btn[^{]*{([^}]+)}',
            r'a\s*{([^}]+)}',
            r'\.link[^{]*{([^}]+)}',
            r'input[^{]*{([^}]+)}',
            r'\.touch[^{]*{([^}]+)}'
        ]
        
        for pattern in interactive_patterns:
            matches = re.finditer(pattern, css_content, re.IGNORECASE)
            
            for match in matches:
                selector = match.group(0).split('{')[0].strip()
                styles = match.group(1)
                
                self._check_element_size(selector, styles)
        
        return self.get_results()
    
    def _check_element_size(self, selector, styles):
        """Check if element meets minimum size requirements"""
        
        # Extract dimensions
        width_match = re.search(r'(?:min-)?width:\s*(\d+)px', styles)
        height_match = re.search(r'(?:min-)?height:\s*(\d+)px', styles)
        padding_match = re.search(r'padding:\s*(\d+)px', styles)
        
        width = int(width_match.group(1)) if width_match else None
        height = int(height_match.group(1)) if height_match else None
        padding = int(padding_match.group(1)) if padding_match else 0
        
        # Calculate effective size (including padding)
        effective_width = (width or 0) + (padding * 2)
        effective_height = (height or 0) + (padding * 2)
        
        # Check compliance
        if width and height:
            if effective_width < self.MIN_SIZE or effective_height < self.MIN_SIZE:
                self.issues.append({
                    'selector': selector,
                    'type': 'size',
                    'severity': 'error',
                    'message': f"Touch target too small: {effective_width}x{effective_height}px (minimum: {self.MIN_SIZE}x{self.MIN_SIZE}px)",
                    'width': effective_width,
                    'height': effective_height
                })
            else:
                self.passed.append({
                    'selector': selector,
                    'message': f"✓ Adequate size: {effective_width}x{effective_height}px",
                    'width': effective_width,
                    'height': effective_height
                })
        elif width or height:
            size = effective_width if width else effective_height
            dimension = 'width' if width else 'height'
            
            if size < self.MIN_SIZE:
                self.issues.append({
                    'selector': selector,
                    'type': 'partial_size',
                    'severity': 'warning',
                    'message': f"{dimension} is {size}px (minimum: {self.MIN_SIZE}px). Ensure other dimension also meets minimum.",
                    dimension: size
                })
        else:
            self.issues.append({
                'selector': selector,
                'type': 'no_size',
                'severity': 'warning',
                'message': "No explicit dimensions found. Ensure element meets 44x44px minimum at runtime."
            })
    
    def analyze_html(self, html_content):
        """Analyze HTML for interactive elements"""
        
        # Find interactive elements
        interactive_tags = r'<(button|a|input)[^>]*>(.*?)</\1>|<(input)[^>]*/?>'
        matches = re.finditer(interactive_tags, html_content, re.IGNORECASE | re.DOTALL)
        
        elements_found = 0
        for match in matches:
            elements_found += 1
        
        if elements_found > 0:
            self.issues.append({
                'type': 'html_check',
                'severity': 'info',
                'message': f"Found {elements_found} interactive elements. Verify each meets 44x44px minimum using browser DevTools."
            })
        
        return self.get_results()
    
    def check_spacing(self, css_content):
        """Check spacing between interactive elements"""
        
        gap_pattern = r'gap:\s*(\d+)px'
        margin_pattern = r'margin[^:]*:\s*(\d+)px'
        
        gaps = re.findall(gap_pattern, css_content)
        margins = re.findall(margin_pattern, css_content)
        
        for gap in gaps:
            gap_size = int(gap)
            if gap_size < self.MIN_SPACING:
                self.issues.append({
                    'type': 'spacing',
                    'severity': 'warning',
                    'message': f"Gap of {gap_size}px found (minimum recommended: {self.MIN_SPACING}px for touch targets)",
                    'value': gap_size
                })
        
        return self.get_results()
    
    def get_results(self):
        """Get validation results"""
        errors = [i for i in self.issues if i.get('severity') == 'error']
        warnings = [i for i in self.issues if i.get('severity') == 'warning']
        info = [i for i in self.issues if i.get('severity') == 'info']
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'info': info,
            'passed': self.passed,
            'total_issues': len(self.issues),
            'total_passed': len(self.passed)
        }

def print_results(results):
    """Print formatted validation results"""
    print("\n" + "="*70)
    print("TOUCH TARGET VALIDATION REPORT")
    print("="*70)
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Passed: {results['total_passed']}")
    print(f"   ❌ Issues: {results['total_issues']}")
    print(f"   Status: {'VALID' if results['valid'] else 'ISSUES FOUND'}")
    
    if results['errors']:
        print(f"\n❌ ERRORS ({len(results['errors'])}):")
        for error in results['errors']:
            print(f"\n   Selector: {error.get('selector', 'N/A')}")
            print(f"   {error['message']}")
    
    if results['warnings']:
        print(f"\n⚠️  WARNINGS ({len(results['warnings'])}):")
        for warning in results['warnings']:
            print(f"\n   Selector: {warning.get('selector', 'N/A')}")
            print(f"   {warning['message']}")
    
    if results['info']:
        print(f"\n💡 INFO ({len(results['info'])}):")
        for info in results['info']:
            print(f"   • {info['message']}")
    
    if results['passed']:
        print(f"\n✅ PASSED CHECKS ({len(results['passed'])}):")
        for passed in results['passed'][:5]:  # Show first 5
            print(f"   • {passed['selector']}: {passed['message']}")
        if len(results['passed']) > 5:
            print(f"   ... and {len(results['passed']) - 5} more")
    
    print("\n" + "="*70)
    print("RECOMMENDATIONS:")
    print("="*70)
    print("\n✓ All touch targets should be minimum 44x44 pixels")
    print("✓ Use min-height and min-width to enforce sizes")
    print("✓ Add padding to increase effective touch area")
    print("✓ Maintain 8px minimum spacing between targets")
    print("✓ Test on actual devices with various finger sizes")
    print("\n" + "="*70 + "\n")
    
    return results['valid']

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_touch_targets.py <file.css|file.html>")
        print("\nExample:")
        print("  python check_touch_targets.py styles.css")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not Path(filepath).exists():
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    
    content = Path(filepath).read_text(encoding='utf-8')
    validator = TouchTargetValidator()
    
    # Analyze based on file type
    if filepath.endswith('.css'):
        validator.analyze_css(content)
        validator.check_spacing(content)
    elif filepath.endswith('.html'):
        # Extract CSS from style tags
        css_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
        for css in css_blocks:
            validator.analyze_css(css)
        
        # Check HTML elements
        validator.analyze_html(content)
    
    results = validator.get_results()
    is_valid = print_results(results)
    
    sys.exit(0 if is_valid else 1)
