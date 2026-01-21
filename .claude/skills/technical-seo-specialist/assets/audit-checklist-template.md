# Technical SEO Audit Checklist Template

**Website:** _____________________  
**Date:** _____________________  
**Auditor:** _____________________  
**Platform/CMS:** _____________________

---

## 1. Crawlability & Indexation

### Robots.txt
- [ ] Robots.txt file exists and is accessible
- [ ] No critical pages blocked
- [ ] Sitemap(s) referenced
- [ ] No conflicting directives
- [ ] Proper User-agent targeting

**Notes:** _____________________

### XML Sitemaps
- [ ] Sitemap exists and accessible
- [ ] Submitted to Google Search Console
- [ ] Only canonical URLs included
- [ ] No 404 or redirected URLs
- [ ] Under 50,000 URLs per sitemap
- [ ] Proper lastmod dates
- [ ] Compressed if over 10MB

**Sitemap URLs:** _____________________

### Google Search Console
- [ ] Property verified and accessible
- [ ] No manual actions
- [ ] No security issues
- [ ] Coverage report reviewed
- [ ] Index status healthy
- [ ] Mobile usability checked

**Current indexed pages:** _____________________  
**Issues found:** _____________________

---

## 2. Site Architecture

### URL Structure
- [ ] URLs are clean and readable
- [ ] Keywords included in URLs
- [ ] Consistent use of lowercase
- [ ] Hyphens used (not underscores)
- [ ] No excessive parameters
- [ ] Logical hierarchy

**Example good URL:** _____________________  
**URLs needing fixes:** _____________________

### Internal Linking
- [ ] Logical link structure
- [ ] Important pages within 3 clicks
- [ ] Anchor text is descriptive
- [ ] No orphan pages
- [ ] Proper use of nofollow
- [ ] Navigation is crawlable (not JS-only)

**Orphan pages found:** _____________________

### Site Structure
- [ ] Clear hierarchy (home → category → product)
- [ ] Flat architecture where possible
- [ ] Breadcrumb navigation
- [ ] Footer sitemap links
- [ ] Related content links

---

## 3. On-Page Technical Elements

### Title Tags
- [ ] Unique on every page
- [ ] 50-60 characters
- [ ] Include primary keyword
- [ ] Front-load important terms
- [ ] Brand name included

**Pages with issues:** _____________________

### Meta Descriptions
- [ ] Unique on every page
- [ ] 150-160 characters
- [ ] Include call-to-action
- [ ] Target keyword included
- [ ] Compelling and accurate

**Pages missing descriptions:** _____________________

### Heading Structure
- [ ] One H1 per page
- [ ] H1 contains primary keyword
- [ ] Logical H2-H6 hierarchy
- [ ] No skipped heading levels
- [ ] Descriptive headings

**Pages with heading issues:** _____________________

### Canonical Tags
- [ ] Implemented on all pages
- [ ] Self-referencing or pointing to preferred version
- [ ] No chains (A→B→C)
- [ ] Matches specified page in sitemap
- [ ] HTTPS version specified

**Canonical issues:** _____________________

### Meta Robots Tags
- [ ] No unintended noindex tags
- [ ] Proper use on admin/duplicate pages
- [ ] No conflicting directives with robots.txt

**Pages incorrectly set to noindex:** _____________________

---

## 4. Mobile Optimization

### Mobile-First Indexing
- [ ] Responsive design implemented
- [ ] Viewport meta tag present
- [ ] Content parity (mobile = desktop)
- [ ] No mobile-only content blocking
- [ ] Touch targets adequate (48x48px)
- [ ] Font size readable (≥16px)

**Mobile issues:** _____________________

### Mobile Usability
- [ ] Passes Google Mobile-Friendly Test
- [ ] No horizontal scrolling
- [ ] Buttons/links easily tappable
- [ ] No Flash or incompatible plugins
- [ ] Form fields easy to fill

**Mobile Usability Score:** _____/100

---

## 5. Page Speed & Performance

### Core Web Vitals

**LCP (Largest Contentful Paint):**
- Target: < 2.5 seconds
- Current: _____ seconds
- [ ] Pass  [ ] Needs Improvement  [ ] Fail

**INP (Interaction to Next Paint):**
- Target: < 200ms
- Current: _____ ms
- [ ] Pass  [ ] Needs Improvement  [ ] Fail

**CLS (Cumulative Layout Shift):**
- Target: < 0.1
- Current: _____
- [ ] Pass  [ ] Needs Improvement  [ ] Fail

### Performance Optimizations
- [ ] Images optimized (WebP, compression)
- [ ] Lazy loading implemented
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] Gzip/Brotli compression enabled
- [ ] Browser caching configured
- [ ] CDN implemented
- [ ] Render-blocking resources minimized

**PageSpeed Insights Score:**
- Mobile: _____/100
- Desktop: _____/100

**Priority fixes:** _____________________

---

## 6. HTTPS & Security

### SSL/TLS
- [ ] Valid SSL certificate
- [ ] All pages serve via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] No mixed content warnings
- [ ] Certificate not expiring soon
- [ ] Secure cipher suites

**Certificate expiry date:** _____________________

### Security Headers
- [ ] HSTS header implemented
- [ ] X-Content-Type-Options set
- [ ] X-Frame-Options configured
- [ ] Content Security Policy defined

**Security scan results:** _____________________

---

## 7. Structured Data

### Schema Markup
- [ ] Appropriate schema types implemented
- [ ] JSON-LD format used
- [ ] No errors in Rich Results Test
- [ ] Required properties included
- [ ] Matches visible page content

**Schema types found:** _____________________

**Common Schemas Checked:**
- [ ] Organization
- [ ] LocalBusiness (if applicable)
- [ ] Article/BlogPosting
- [ ] Product (if e-commerce)
- [ ] FAQ
- [ ] BreadcrumbList
- [ ] Review/AggregateRating

**Schema errors:** _____________________

---

## 8. Content Quality

### Content Analysis
- [ ] Unique, original content
- [ ] Adequate length (300+ words for important pages)
- [ ] Proper keyword targeting
- [ ] No duplicate content issues
- [ ] Content freshness strategy
- [ ] E-E-A-T signals present

**Thin content pages:** _____________________  
**Duplicate content issues:** _____________________

### Images
- [ ] Alt text on all images
- [ ] Descriptive file names
- [ ] Optimized file sizes
- [ ] Proper image dimensions set
- [ ] Responsive images where appropriate

**Images missing alt text:** _____________________

---

## 9. Links

### Internal Links
- [ ] No broken internal links
- [ ] Proper anchor text distribution
- [ ] Link to important pages frequently
- [ ] Reasonable internal linking depth

**Broken internal links:** _____________________

### External Links
- [ ] No broken outbound links
- [ ] Appropriate use of nofollow
- [ ] Links to authoritative sources
- [ ] No link spam

**Broken external links:** _____________________

### Backlinks
- [ ] Natural link profile
- [ ] Quality over quantity
- [ ] Diverse anchor text
- [ ] Disavow file current (if needed)

**Toxic links to disavow:** _____________________

---

## 10. International & Multi-Language

(Skip if not applicable)

### Hreflang Implementation
- [ ] Hreflang tags implemented correctly
- [ ] Self-referencing tags present
- [ ] x-default specified
- [ ] Return tags present
- [ ] No conflicting signals

**Languages/regions:** _____________________  
**Hreflang errors:** _____________________

---

## 11. JavaScript & Rendering

### JavaScript SEO
- [ ] Critical content in HTML source
- [ ] Server-side rendering (if applicable)
- [ ] Google can render pages properly
- [ ] No infinite scroll issues
- [ ] Progressive enhancement used

**Rendering test results:** _____________________

---

## 12. Analytics & Tracking

### Implementation
- [ ] Google Analytics installed
- [ ] Google Search Console connected
- [ ] Goal tracking configured
- [ ] E-commerce tracking (if applicable)
- [ ] Event tracking set up
- [ ] Cookie consent compliant

---

## 13. Accessibility

### WCAG Compliance
- [ ] Alt text on images
- [ ] Proper heading hierarchy
- [ ] Color contrast ratios met (4.5:1)
- [ ] Keyboard navigation works
- [ ] ARIA labels where needed
- [ ] Forms properly labeled

**Accessibility score:** _____/100  
**Critical accessibility issues:** _____________________

---

## 14. E-Commerce Specific

(Skip if not applicable)

### Product Pages
- [ ] Product schema markup
- [ ] Unique product descriptions
- [ ] High-quality product images
- [ ] Clear pricing information
- [ ] Review/rating schema

### Out of Stock Handling
- [ ] Proper 404/410 for discontinued
- [ ] Soft 404 avoided
- [ ] "Out of stock" marked in schema

---

## Summary & Prioritization

### Critical Issues (Fix Immediately)
1. _____________________
2. _____________________
3. _____________________

### High Priority (Fix This Week)
1. _____________________
2. _____________________
3. _____________________

### Medium Priority (Fix This Month)
1. _____________________
2. _____________________
3. _____________________

### Low Priority (Schedule for Later)
1. _____________________
2. _____________________

---

## Overall Health Score

**Score:** _____/100

**Calculation:**
- Critical issues: _____ × -15 = _____
- High priority: _____ × -8 = _____
- Medium priority: _____ × -4 = _____
- Low priority: _____ × -1 = _____

**Health Score = 100 + (total negative points)**

---

## Recommendations

### Immediate Actions (Week 1)
_____________________

### Short Term (Weeks 2-4)
_____________________

### Long Term (Months 2-3)
_____________________

### Ongoing Maintenance
_____________________

---

## Next Audit Scheduled

**Full Audit Date:** _____________________  
**Mini-Audit Dates:** _____________________

---

## Notes & Additional Findings

_____________________
_____________________
_____________________

---

**Audit Completed By:** _____________________  
**Date:** _____________________  
**Signature:** _____________________
