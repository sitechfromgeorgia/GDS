#!/usr/bin/env python3
"""
Mobile-First Design Validator
Checks HTML/CSS for mobile-first compliance issues
"""

import re
import sys
from pathlib import Path

class MobileFirstValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []
        
    def validate_css_file(self, filepath):
        """Validate CSS for mobile-first patterns"""
        content = Path(filepath).read_text(encoding='utf-8')
        
        # Check for viewport meta tag (if HTML)
        if filepath.endswith('.html'):
            if 'name="viewport"' not in content:
                self.errors.append("Missing viewport meta tag in <head>")
            elif 'width=device-width' not in content:
                self.errors.append("Viewport meta tag missing 'width=device-width'")
        
        # Check for mobile-first media queries
        max_width_queries = len(re.findall(r'@media[^{]*max-width', content))
        min_width_queries = len(re.findall(r'@media[^{]*min-width', content))
        
        if max_width_queries > min_width_queries:
            self.warnings.append(
                f"Found {max_width_queries} max-width queries vs {min_width_queries} min-width queries. "
                "Mobile-first approach should use min-width queries."
            )
        
        # Check for fixed widths
        fixed_widths = re.findall(r'width:\s*(\d+)px(?![^}]*@media)', content)
        if fixed_widths:
            self.warnings.append(
                f"Found {len(fixed_widths)} fixed pixel widths outside media queries. "
                "Consider using flexible units (%, rem, em) or max-width."
            )
        
        # Check for small font sizes
        font_sizes = re.findall(r'font-size:\s*(\d+)px', content)
        small_fonts = [int(size) for size in font_sizes if int(size) < 16]
        if small_fonts:
            self.errors.append(
                f"Found {len(small_fonts)} font sizes below 16px. "
                "Minimum 16px required to prevent zoom on mobile."
            )
        
        # Check for touch target sizes
        small_buttons = re.findall(
            r'(button|\.btn|\.link|a)[^}]*(?:height|width):\s*(\d+)px',
            content
        )
        for match in small_buttons:
            size = int(match[1])
            if size < 44:
                self.errors.append(
                    f"Touch target '{match[0]}' has size {size}px. "
                    "Minimum 44px required for touch interactions."
                )
        
        # Check for hover-only interactions
        hover_only = re.findall(r':hover(?![^}]*(?::active|:focus))', content)
        if hover_only:
            self.warnings.append(
                f"Found {len(hover_only)} hover-only states. "
                "Touch devices need :active or :focus alternatives."
            )
        
        # Check for responsive images
        if filepath.endswith('.html'):
            img_tags = re.findall(r'<img[^>]*>', content)
            images_without_srcset = [
                img for img in img_tags 
                if 'srcset=' not in img and 'sizes=' not in img
            ]
            if images_without_srcset:
                self.info.append(
                    f"Found {len(images_without_srcset)} images without srcset. "
                    "Consider using responsive images for better mobile performance."
                )
        
        return self.get_report()
    
    def get_report(self):
        """Generate validation report"""
        report = {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'info': self.info,
            'score': self._calculate_score()
        }
        return report
    
    def _calculate_score(self):
        """Calculate mobile-first compliance score"""
        total_issues = len(self.errors) + len(self.warnings) + len(self.info)
        if total_issues == 0:
            return 100
        
        # Deduct points for issues
        score = 100
        score -= len(self.errors) * 10  # -10 per error
        score -= len(self.warnings) * 5  # -5 per warning
        score -= len(self.info) * 2      # -2 per info
        
        return max(0, score)

def print_report(report):
    """Print formatted validation report"""
    print("\n" + "="*60)
    print("MOBILE-FIRST DESIGN VALIDATION REPORT")
    print("="*60)
    
    print(f"\n📊 Compliance Score: {report['score']}/100")
    
    if report['errors']:
        print(f"\n❌ ERRORS ({len(report['errors'])}):")
        for error in report['errors']:
            print(f"   • {error}")
    
    if report['warnings']:
        print(f"\n⚠️  WARNINGS ({len(report['warnings'])}):")
        for warning in report['warnings']:
            print(f"   • {warning}")
    
    if report['info']:
        print(f"\n💡 SUGGESTIONS ({len(report['info'])}):")
        for info in report['info']:
            print(f"   • {info}")
    
    print("\n" + "="*60)
    
    if report['valid'] and report['score'] >= 90:
        print("✅ Excellent mobile-first compliance!")
    elif report['valid']:
        print("✅ Valid, but has room for improvement")
    else:
        print("❌ Critical issues found - please fix errors")
    
    print("="*60 + "\n")
    
    return report['valid']

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_mobile_first.py <file.html|file.css>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not Path(filepath).exists():
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    
    validator = MobileFirstValidator()
    report = validator.validate_css_file(filepath)
    is_valid = print_report(report)
    
    sys.exit(0 if is_valid else 1)
