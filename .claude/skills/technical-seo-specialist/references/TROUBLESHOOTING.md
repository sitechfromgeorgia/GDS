# Technical SEO Troubleshooting Guide

## Table of Contents
1. Indexation Issues
2. Crawling Problems
3. Performance Issues
4. Mobile Problems
5. Structured Data Errors
6. Core Web Vitals Failures
7. Security Issues
8. Common Error Codes

---

## 1. Indexation Issues

### Problem: Pages Not Being Indexed

**Symptoms:**
- Pages missing from `site:domain.com` search
- "Discovered - currently not indexed" in Search Console
- Low index coverage

**Diagnostic Steps:**
1. Check robots.txt: `domain.com/robots.txt`
2. Verify no `noindex` meta tag: `<meta name="robots" content="noindex">`
3. Check X-Robots-Tag HTTP header
4. Inspect URL in Google Search Console
5. Verify canonical tag points to itself
6. Check for duplicate content

**Solutions:**

**If blocked by robots.txt:**
```
# Fix: Remove blocking directive
# Before
User-agent: *
Disallow: /products/  # Remove this

# After
User-agent: *
Allow: /products/
```

**If noindex tag present:**
```html
<!-- Remove noindex -->
<!-- Before -->
<meta name="robots" content="noindex, nofollow">

<!-- After -->
<meta name="robots" content="index, follow">
<!-- Or remove tag entirely -->
```

**If thin content:**
- Add substantive content (minimum 300 words)
- Ensure unique value proposition
- Include relevant keywords naturally
- Add multimedia (images, videos)

**If duplicate content:**
- Implement canonical tags
- Use 301 redirects for true duplicates
- Add unique content to each page
- Configure URL parameters in Search Console

---

### Problem: Wrong Pages Getting Indexed

**Symptoms:**
- Admin pages appearing in search
- Staging site indexed
- Parameter URLs indexed

**Solutions:**

**Block unwanted sections:**
```
# robots.txt
User-agent: *
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /*?session_id=
```

**Add noindex to specific pages:**
```html
<meta name="robots" content="noindex, follow">
```

**Use canonical tags:**
```html
<link rel="canonical" href="https://example.com/preferred-url/">
```

---

## 2. Crawling Problems

### Problem: Crawl Budget Waste

**Symptoms:**
- Important pages not crawled
- Excessive crawling of low-value pages
- High crawl rate with low coverage

**Diagnostic Steps:**
1. Check Search Console Crawl Stats
2. Review server logs
3. Identify crawl traps
4. Check for infinite pagination

**Solutions:**

**Optimize robots.txt:**
```
# Block low-value pages
Disallow: /search?
Disallow: /filter?
Disallow: /*?sort=
Disallow: /*?page=*&page=  # Duplicate pagination

# Allow important paths first
Allow: /products/
Allow: /blog/
```

**Fix pagination:**
```html
<!-- Use rel="next" and rel="prev" -->
<link rel="prev" href="https://example.com/page/1">
<link rel="next" href="https://example.com/page/3">

<!-- Or use canonical to view-all page -->
<link rel="canonical" href="https://example.com/category?view=all">
```

**Control faceted navigation:**
- Use JavaScript for filter changes
- Implement AJAX for sorting
- Use `nofollow` on filter links
- Configure URL parameters in Search Console

---

### Problem: Crawl Errors (4XX/5XX)

**Symptoms:**
- Spike in 404 errors
- 500/503 server errors
- Timeout errors

**Solutions:**

**For 404 errors:**
```
# Find broken links
1. Export 404 report from Search Console
2. Identify linking pages
3. Fix or remove links

# Setup 301 redirects for important URLs
RewriteEngine On
RewriteRule ^old-page$ /new-page [R=301,L]
```

**For 500/503 errors:**
- Increase server resources
- Optimize database queries
- Implement caching
- Use CDN for static assets
- Monitor server health

---

## 3. Performance Issues

### Problem: Slow Page Speed (Poor LCP)

**Symptoms:**
- LCP > 2.5 seconds
- Slow server response time
- Large images

**Quick Fixes:**

**1. Optimize Images:**
```bash
# Convert to WebP
cwebp input.jpg -q 80 -o output.webp

# Or use responsive images
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

**2. Preload Critical Resources:**
```html
<link rel="preload" href="hero.jpg" as="image">
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

**3. Defer JavaScript:**
```html
<script src="script.js" defer></script>
<!-- Or async for independent scripts -->
<script src="analytics.js" async></script>
```

---

### Problem: Poor INP (Slow Interactions)

**Symptoms:**
- INP > 200ms
- Delayed button clicks
- Laggy scrolling

**Solutions:**

**1. Break up long tasks:**
```javascript
// Bad: Blocks main thread
function processData(items) {
  items.forEach(item => heavyOperation(item));
}

// Good: Yields to main thread
async function processData(items) {
  for (const item of items) {
    await new Promise(resolve => setTimeout(resolve, 0));
    heavyOperation(item);
  }
}
```

**2. Optimize event handlers:**
```javascript
// Debounce rapid events
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const handleSearch = debounce(() => {
  // Search logic
}, 300);
```

---

### Problem: Layout Shifts (Poor CLS)

**Symptoms:**
- CLS > 0.1
- Content jumping during load
- Ads causing shifts

**Solutions:**

**1. Set dimensions on media:**
```html
<!-- Always specify width/height -->
<img src="image.jpg" width="800" height="600" alt="Description">

<!-- Use CSS aspect ratio -->
<img src="image.jpg" style="aspect-ratio: 16/9; width: 100%;" alt="Description">
```

**2. Reserve space for ads:**
```css
.ad-container {
  min-height: 250px;
  width: 300px;
  background: #f0f0f0; /* Placeholder */
}
```

**3. Avoid inserting content above fold:**
```javascript
// Bad
document.querySelector('.content').prepend(banner);

// Good
document.querySelector('.content').append(banner);
// Or use fixed/absolute positioning
```

---

## 4. Mobile Problems

### Problem: Not Mobile-Friendly

**Symptoms:**
- "Mobile usability" errors in Search Console
- Text too small
- Clickable elements too close

**Solutions:**

**1. Add viewport meta tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**2. Use responsive design:**
```css
/* Mobile-first approach */
.container {
  width: 100%;
  padding: 0 15px;
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
}
```

**3. Ensure readable text:**
```css
body {
  font-size: 16px; /* Minimum for mobile */
  line-height: 1.5;
}
```

**4. Make touch targets adequate:**
```css
button, a {
  min-width: 48px;
  min-height: 48px;
  padding: 12px;
}
```

---

## 5. Structured Data Errors

### Problem: Schema Validation Errors

**Common Errors:**

**Missing required field:**
```json
// Error: Missing "image" in Article
{
  "@type": "Article",
  "headline": "Title"
  // Missing: "image"
}

// Fix: Add required fields
{
  "@type": "Article",
  "headline": "Title",
  "image": "https://example.com/image.jpg",
  "datePublished": "2025-01-15",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  }
}
```

**Incorrect data type:**
```json
// Error: Price must be string
"price": 29.99  // Wrong

// Fix
"price": "29.99"  // Correct
```

**Invalid URL:**
```json
// Error: Relative URL
"url": "/products/item"  // Wrong

// Fix: Absolute URL
"url": "https://example.com/products/item"  // Correct
```

---

## 6. Core Web Vitals Failures

### Quick Diagnostic Checklist

**If LCP is failing:**
- [ ] Check server response time (< 200ms)
- [ ] Optimize hero image
- [ ] Remove render-blocking CSS/JS
- [ ] Enable compression
- [ ] Use CDN
- [ ] Preload critical resources

**If INP is failing:**
- [ ] Profile long tasks in DevTools
- [ ] Reduce JavaScript bundle size
- [ ] Optimize event handlers
- [ ] Remove unnecessary third-party scripts
- [ ] Use code splitting
- [ ] Defer non-critical scripts

**If CLS is failing:**
- [ ] Add width/height to images
- [ ] Reserve space for ads/embeds
- [ ] Avoid inserting content above viewport
- [ ] Use font-display: swap
- [ ] Eliminate late-loading content
- [ ] Test without browser extensions

---

## 7. Security Issues

### Problem: Mixed Content Warnings

**Symptoms:**
- "Not secure" in browser
- Console errors about mixed content
- Features blocked (geolocation, camera)

**Solution:**
```bash
# Find mixed content
grep -r "http://" *.html *.css *.js

# Fix: Change all to HTTPS
sed -i 's/http:\/\//https:\/\//g' file.html
```

**Or use relative URLs:**
```html
<!-- Bad -->
<img src="http://example.com/image.jpg">

<!-- Good -->
<img src="//example.com/image.jpg">
<!-- Or -->
<img src="/images/image.jpg">
```

---

### Problem: Expired/Invalid SSL Certificate

**Quick Fixes:**
1. Renew certificate through hosting provider
2. Use Let's Encrypt for free SSL
3. Check certificate chain completeness
4. Verify domain name matches certificate
5. Update CAA DNS records if needed

---

## 8. Common Error Codes

### HTTP Status Code Reference

**2XX (Success)**
- `200 OK` - Normal, indexable page
- `204 No Content` - Successful but no content

**3XX (Redirects)**
- `301 Moved Permanently` - **Use for SEO** (passes link equity)
- `302 Found` - Temporary redirect (doesn't pass full link equity)
- `307 Temporary Redirect` - Same as 302 (use 301 for SEO)
- `308 Permanent Redirect` - Same as 301

**4XX (Client Errors)**
- `404 Not Found` - Page doesn't exist (normal for deleted pages)
- `410 Gone` - Permanently deleted (stronger signal than 404)
- `403 Forbidden` - Access denied
- `429 Too Many Requests` - Rate limit exceeded

**5XX (Server Errors)**
- `500 Internal Server Error` - Server malfunction
- `502 Bad Gateway` - Upstream server error
- `503 Service Unavailable` - Temporary server issue
- `504 Gateway Timeout` - Upstream timeout

**SEO Impact:**
- 404/410: Won't be indexed (expected for deleted content)
- 5XX: Temporarily excluded, may lose rankings if persistent
- 3XX: Follow redirect, may consolidate signals

---

## Emergency Troubleshooting Workflow

**Site disappeared from Google:**
1. Check Search Console for manual actions
2. Verify robots.txt not blocking site
3. Check for site-wide noindex
4. Look for server errors (5XX)
5. Verify DNS is resolving
6. Check if site is actually down
7. Review recent changes/deployments

**Rankings suddenly dropped:**
1. Check Google algorithm updates
2. Review Search Console for issues
3. Check Core Web Vitals scores
4. Verify no manual penalties
5. Check competitor changes
6. Review recent content changes
7. Check for broken links/redirects

**Pages not crawling:**
1. Check crawl stats in Search Console
2. Verify server response time
3. Check robots.txt
4. Look for crawl traps
5. Review server logs for bot access
6. Check for excessive 5XX errors
7. Verify sitemap is accessible

---

## Tools for Troubleshooting

**Must-Have Tools:**
- Google Search Console (free)
- Google PageSpeed Insights (free)
- Screaming Frog SEO Spider (free/paid)
- Chrome DevTools (free)
- GTmetrix (free/paid)

**Useful Commands:**
```bash
# Check site status
curl -I https://example.com

# Check robots.txt
curl https://example.com/robots.txt

# Check response time
curl -o /dev/null -s -w '%{time_total}\n' https://example.com

# Check SSL certificate
openssl s_client -connect example.com:443 -servername example.com
```

---

## Prevention Checklist

**Weekly:**
- [ ] Monitor Search Console errors
- [ ] Check uptime monitoring
- [ ] Review Core Web Vitals

**Monthly:**
- [ ] Full crawl with Screaming Frog
- [ ] Review broken links
- [ ] Check sitemap accuracy
- [ ] Update outdated content

**Quarterly:**
- [ ] Complete technical SEO audit
- [ ] Review all redirects
- [ ] Audit site speed
- [ ] Check schema markup validity
- [ ] Review security certificates
