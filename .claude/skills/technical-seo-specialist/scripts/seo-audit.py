#!/usr/bin/env python3
"""
Technical SEO Audit Automation Script
Performs automated technical SEO checks and generates reports
"""

import sys
import json
import argparse
import urllib.request
import urllib.parse
import re
from urllib.parse import urlparse, urljoin
from html.parser import HTMLParser
from typing import Dict, List, Set, Optional

class SEOAuditor:
    def __init__(self, url: str):
        self.base_url = url
        self.parsed_url = urlparse(url)
        self.domain = f"{self.parsed_url.scheme}://{self.parsed_url.netloc}"
        self.issues = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        self.metrics = {}
        
    def fetch_page(self, url: str) -> Optional[str]:
        """Fetch webpage content"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (SEO Audit Bot)'
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.read().decode('utf-8')
        except Exception as e:
            self.add_issue("high", f"Failed to fetch URL: {url} - {str(e)}")
            return None
    
    def check_robots_txt(self):
        """Check robots.txt file"""
        robots_url = urljoin(self.domain, '/robots.txt')
        content = self.fetch_page(robots_url)
        
        if not content:
            self.add_issue("medium", "No robots.txt file found")
            return
        
        # Check for sitemap
        if 'sitemap:' not in content.lower():
            self.add_issue("high", "Robots.txt missing Sitemap reference")
        
        # Check for common mistakes
        if 'disallow: /' in content.lower() and 'allow:' not in content.lower():
            self.add_issue("critical", "Robots.txt may be blocking entire site")
        
        self.metrics['robots_txt'] = {
            "exists": True,
            "has_sitemap": 'sitemap:' in content.lower(),
            "size_bytes": len(content)
        }
    
    def check_meta_tags(self, html: str):
        """Analyze meta tags"""
        # Title tag
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        if title_match:
            title = title_match.group(1).strip()
            title_length = len(title)
            
            if title_length == 0:
                self.add_issue("critical", "Empty title tag")
            elif title_length < 30:
                self.add_issue("high", f"Title tag too short ({title_length} chars, recommend 50-60)")
            elif title_length > 60:
                self.add_issue("medium", f"Title tag may be truncated ({title_length} chars)")
            
            self.metrics['title'] = {
                "text": title,
                "length": title_length
            }
        else:
            self.add_issue("critical", "Missing title tag")
        
        # Meta description
        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>',
                              html, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip()
            desc_length = len(description)
            
            if desc_length < 120:
                self.add_issue("medium", f"Meta description short ({desc_length} chars, recommend 150-160)")
            elif desc_length > 160:
                self.add_issue("low", f"Meta description may be truncated ({desc_length} chars)")
            
            self.metrics['description'] = {
                "text": description,
                "length": desc_length
            }
        else:
            self.add_issue("high", "Missing meta description")
        
        # Viewport meta tag
        if 'name="viewport"' not in html.lower():
            self.add_issue("critical", "Missing viewport meta tag - mobile rendering may fail")
        
        # Robots meta tag
        if 'name="robots"' in html.lower():
            if 'noindex' in html.lower():
                self.add_issue("critical", "Page has noindex meta tag - will not be indexed")
        
        # Canonical tag
        canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']\s*/?>',
                                   html, re.IGNORECASE)
        if canonical_match:
            canonical_url = canonical_match.group(1)
            self.metrics['canonical'] = canonical_url
        else:
            self.add_issue("medium", "Missing canonical tag")
    
    def check_heading_structure(self, html: str):
        """Analyze heading hierarchy"""
        h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        
        if len(h1_matches) == 0:
            self.add_issue("high", "Missing H1 heading")
        elif len(h1_matches) > 1:
            self.add_issue("medium", f"Multiple H1 tags found ({len(h1_matches)}), should have only one")
        
        # Check for heading order
        headings = re.findall(r'<h([1-6])[^>]*>', html, re.IGNORECASE)
        if headings:
            prev_level = 0
            for h_level in headings:
                level = int(h_level)
                if level > prev_level + 1:
                    self.add_issue("low", f"Heading hierarchy skip detected (H{prev_level} to H{level})")
                prev_level = level
        
        self.metrics['headings'] = {
            "h1_count": len(h1_matches),
            "h1_text": h1_matches[0] if h1_matches else None
        }
    
    def check_https(self):
        """Verify HTTPS implementation"""
        if self.parsed_url.scheme != 'https':
            self.add_issue("critical", "Site not using HTTPS - major security and SEO issue")
        else:
            # Check if HTTP redirects to HTTPS
            http_url = self.base_url.replace('https://', 'http://')
            try:
                req = urllib.request.Request(http_url)
                response = urllib.request.urlopen(req, timeout=5)
                if response.geturl().startswith('http://'):
                    self.add_issue("high", "HTTP version does not redirect to HTTPS")
            except:
                pass
    
    def check_images(self, html: str):
        """Check image optimization"""
        img_matches = re.findall(r'<img\s+[^>]*>', html, re.IGNORECASE)
        images_without_alt = 0
        
        for img in img_matches:
            if 'alt=' not in img.lower():
                images_without_alt += 1
        
        if images_without_alt > 0:
            self.add_issue("medium", 
                          f"{images_without_alt} images missing alt attributes (accessibility and SEO issue)")
        
        self.metrics['images'] = {
            "total_count": len(img_matches),
            "missing_alt": images_without_alt
        }
    
    def add_issue(self, severity: str, description: str):
        """Add an issue to the report"""
        self.issues[severity].append(description)
    
    def generate_report(self) -> Dict:
        """Generate final audit report"""
        total_issues = sum(len(issues) for issues in self.issues.values())
        
        # Calculate health score (100 - weighted issues)
        health_score = max(0, 100 - (
            len(self.issues['critical']) * 15 +
            len(self.issues['high']) * 8 +
            len(self.issues['medium']) * 4 +
            len(self.issues['low']) * 1
        ))
        
        return {
            "url": self.base_url,
            "health_score": health_score,
            "total_issues": total_issues,
            "issues_by_severity": {
                "critical": len(self.issues['critical']),
                "high": len(self.issues['high']),
                "medium": len(self.issues['medium']),
                "low": len(self.issues['low'])
            },
            "issues": self.issues,
            "metrics": self.metrics,
            "recommendations": self.generate_recommendations()
        }
    
    def generate_recommendations(self) -> List[str]:
        """Generate prioritized recommendations"""
        recommendations = []
        
        if self.issues['critical']:
            recommendations.append("URGENT: Fix critical issues immediately - they prevent proper indexing")
        if self.issues['high']:
            recommendations.append("HIGH PRIORITY: Address high-priority issues within 1 week")
        if self.issues['medium']:
            recommendations.append("MEDIUM PRIORITY: Schedule medium-priority fixes within 1 month")
        if self.issues['low']:
            recommendations.append("LOW PRIORITY: Address low-priority items as time permits")
        
        return recommendations
    
    def run_audit(self):
        """Execute complete audit"""
        print(f"Starting SEO audit for: {self.base_url}")
        
        # Fetch main page
        html = self.fetch_page(self.base_url)
        if not html:
            return self.generate_report()
        
        # Run checks
        self.check_https()
        self.check_robots_txt()
        self.check_meta_tags(html)
        self.check_heading_structure(html)
        self.check_images(html)
        
        return self.generate_report()

def main():
    parser = argparse.ArgumentParser(description='Technical SEO Audit Tool')
    parser.add_argument('--url', required=True, help='Website URL to audit')
    parser.add_argument('--output', help='Output file for JSON report (optional)')
    
    args = parser.parse_args()
    
    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        print("Error: URL must start with http:// or https://")
        sys.exit(1)
    
    # Run audit
    auditor = SEOAuditor(args.url)
    report = auditor.run_audit()
    
    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nReport saved to: {args.output}")
    else:
        print("\n" + "="*60)
        print("SEO AUDIT REPORT")
        print("="*60)
        print(f"\nURL: {report['url']}")
        print(f"Health Score: {report['health_score']}/100")
        print(f"\nTotal Issues: {report['total_issues']}")
        print(f"  Critical: {report['issues_by_severity']['critical']}")
        print(f"  High: {report['issues_by_severity']['high']}")
        print(f"  Medium: {report['issues_by_severity']['medium']}")
        print(f"  Low: {report['issues_by_severity']['low']}")
        
        # Print issues
        for severity in ['critical', 'high', 'medium', 'low']:
            if report['issues'][severity]:
                print(f"\n{severity.upper()} ISSUES:")
                for i, issue in enumerate(report['issues'][severity], 1):
                    print(f"  {i}. {issue}")
        
        # Print recommendations
        if report['recommendations']:
            print("\nRECOMMENDATIONS:")
            for i, rec in enumerate(report['recommendations'], 1):
                print(f"  {i}. {rec}")
        
        print("\n" + "="*60)

if __name__ == "__main__":
    main()
