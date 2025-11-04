# Core Web Vitals - Complete Reference Guide

## Overview

Core Web Vitals are Google's key metrics for measuring user experience quality. These metrics directly impact search rankings and user satisfaction.

---

## The Three Core Metrics

### 1. Largest Contentful Paint (LCP)

**What It Measures**: Time until the largest visible content element is rendered

**Target**: < 2.5 seconds (Good), 2.5-4s (Needs Improvement), > 4s (Poor)

**What Counts as LCP**:
- `<img>` elements
- `<image>` elements inside `<svg>`
- `<video>` elements (poster image or first frame)
- Background images loaded via `url()`
- Block-level elements containing text nodes

**Common Causes of Poor LCP**:
1. Slow server response times
2. Render-blocking JavaScript and CSS
3. Slow resource load times (images, videos)
4. Client-side rendering issues

**How to Optimize LCP**:

**Server-Side**:
```nginx
# Enable compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Resource Optimization**:
```html
<!-- Preload critical resources -->
<link rel="preload" as="image" href="hero-image.jpg">
<link rel="preload" as="font" href="font.woff2" type="font/woff2" crossorigin>

<!-- Use responsive images -->
<img 
  srcset="small.jpg 480w, medium.jpg 768w, large.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  src="medium.jpg"
  alt="Description"
>

<!-- Lazy load non-critical images -->
<img src="image.jpg" loading="lazy" alt="Description">
```

**CSS Optimization**:
```html
<!-- Inline critical CSS -->
<style>
  /* Critical above-the-fold styles */
  body { margin: 0; font-family: sans-serif; }
  .hero { height: 100vh; background: blue; }
</style>

<!-- Load non-critical CSS asynchronously -->
<link rel="preload" as="style" href="styles.css" onload="this.rel='stylesheet'">
```

---

### 2. First Input Delay (FID)

**What It Measures**: Time from first user interaction to browser response

**Target**: < 100ms (Good), 100-300ms (Needs Improvement), > 300ms (Poor)

**What It Measures**:
- Clicks
- Taps
- Key presses

**Note**: Does NOT measure scrolling or zooming

**Common Causes of Poor FID**:
1. Heavy JavaScript execution
2. Large JavaScript bundles
3. Long tasks blocking the main thread

**How to Optimize FID**:

**Code Splitting**:
```javascript
// Split code by route
const HomePage = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/About'));

// Split by feature
import(/* webpackChunkName: "chart" */ './Chart.js')
  .then(module => {
    const Chart = module.default;
    // Use Chart
  });
```

**Break Up Long Tasks**:
```javascript
// BAD - Long blocking task
function processLargeArray(array) {
  for (let i = 0; i < array.length; i++) {
    // Heavy processing
    processItem(array[i]);
  }
}

// GOOD - Break into smaller tasks
async function processLargeArray(array) {
  const chunkSize = 100;
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    
    // Process chunk
    chunk.forEach(item => processItem(item));
    
    // Yield to browser between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

**Use Web Workers**:
```javascript
// main.js - Offload heavy computation
const worker = new Worker('worker.js');

worker.postMessage({ data: largeDataset });

worker.onmessage = (e) => {
  console.log('Result:', e.data);
};

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

**Defer Non-Critical JavaScript**:
```html
<!-- Defer non-critical scripts -->
<script defer src="analytics.js"></script>

<!-- Async for independent scripts -->
<script async src="third-party.js"></script>
```

---

### 3. Cumulative Layout Shift (CLS)

**What It Measures**: Visual stability - unexpected layout shifts

**Target**: < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)

**Formula**: Impact Fraction × Distance Fraction

**Common Causes of CLS**:
1. Images without dimensions
2. Ads, embeds, or iframes without dimensions
3. Dynamically injected content
4. Web fonts causing FOIT/FOUT
5. Actions waiting for network response

**How to Optimize CLS**:

**Always Set Image Dimensions**:
```html
<!-- BAD - No dimensions -->
<img src="image.jpg" alt="Description">

<!-- GOOD - Explicit dimensions -->
<img src="image.jpg" width="800" height="600" alt="Description">

<!-- BETTER - Use aspect-ratio -->
<img src="image.jpg" style="aspect-ratio: 16/9; width: 100%;" alt="Description">
```

```css
/* Modern approach with aspect-ratio */
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Reserve Space for Ads and Embeds**:
```css
/* Reserve space for ad slot */
.ad-container {
  min-height: 250px; /* Reserve minimum space */
  background: #f0f0f0; /* Placeholder color */
}

/* Reserve space for embed */
.video-embed {
  aspect-ratio: 16 / 9;
  background: #000;
}
```

**Avoid Inserting Content Above Existing Content**:
```javascript
// BAD - Inserts above existing content
document.body.insertBefore(newElement, document.body.firstChild);

// GOOD - Appends to end or specific container
document.querySelector('.notifications').appendChild(newElement);

// GOOD - Use transform for animations
element.style.transform = 'translateY(-100%)';
```

**Optimize Font Loading**:
```css
/* Use font-display to control rendering */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Shows fallback immediately */
}

/* Preload critical fonts */
<link rel="preload" as="font" href="font.woff2" type="font/woff2" crossorigin>
```

**Use CSS Transform for Animations**:
```css
/* BAD - Triggers layout */
.element {
  animation: slideDown 0.3s;
}

@keyframes slideDown {
  from { top: 0; }
  to { top: 100px; }
}

/* GOOD - Uses transform */
.element {
  animation: slideDown 0.3s;
}

@keyframes slideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100px); }
}
```

---

## Measuring Core Web Vitals

### Chrome DevTools

**Performance Tab**:
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with page
5. Stop recording
6. Review metrics in summary

**Lighthouse**:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Performance" and "Mobile"
4. Click "Generate report"
5. Review Core Web Vitals section

### Field Monitoring

**Chrome User Experience Report (CrUX)**:
- Real user data from Chrome browsers
- Available in PageSpeed Insights
- Shows 75th percentile performance

**Web Vitals JavaScript Library**:
```javascript
import {getCLS, getFID, getLCP} from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  navigator.sendBeacon('/analytics', JSON.stringify(metric));
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

---

## Advanced Optimization Techniques

### Priority Hints

```html
<!-- High priority for LCP image -->
<img src="hero.jpg" fetchpriority="high" alt="Hero">

<!-- Low priority for non-critical resources -->
<script src="analytics.js" fetchpriority="low"></script>
```

### Resource Hints

```html
<!-- DNS prefetch for external domains -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- Preconnect for critical origins -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

<!-- Prefetch for likely next navigation -->
<link rel="prefetch" href="/next-page.html">
```

### Image Optimization

```html
<!-- Modern formats with fallbacks -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" width="800" height="600">
</picture>

<!-- Responsive images -->
<img
  srcset="small.jpg 400w,
          medium.jpg 800w,
          large.jpg 1200w"
  sizes="(max-width: 600px) 400px,
         (max-width: 1000px) 800px,
         1200px"
  src="medium.jpg"
  alt="Description"
>
```

---

## Mobile-Specific Considerations

### Slower Network Connections

**Optimize for 3G/4G**:
- Target < 3s LCP on 3G
- Minimize JavaScript bundle size
- Use efficient image formats (WebP, AVIF)
- Implement critical CSS inlining

### Battery and CPU Constraints

**Reduce Processing**:
- Minimize JavaScript execution
- Use CSS animations over JavaScript
- Defer non-critical operations
- Use Intersection Observer for lazy loading

### Touch Responsiveness

**Optimize Touch Interactions**:
```css
/* Remove 300ms tap delay */
html {
  touch-action: manipulation;
}

/* Optimize touch target size */
button, a {
  min-height: 44px;
  min-width: 44px;
}
```

---

## Monitoring and Debugging

### Performance Budget

Set limits for each metric:

```json
{
  "budgets": [
    {
      "resourceType": "total",
      "budget": 300
    },
    {
      "resourceType": "script",
      "budget": 150
    },
    {
      "resourceType": "image",
      "budget": 100
    }
  ],
  "targets": {
    "lcp": 2500,
    "fid": 100,
    "cls": 0.1
  }
}
```

### Continuous Monitoring

**Tools**:
- Google PageSpeed Insights
- Lighthouse CI
- WebPageTest
- Chrome User Experience Report
- Real User Monitoring (RUM) solutions

---

## Common Issues and Solutions

### Issue: High LCP

**Symptoms**: Large content takes > 2.5s to appear

**Solutions**:
1. Optimize server response (< 200ms)
2. Use CDN for static assets
3. Preload LCP image
4. Optimize image size/format
5. Remove render-blocking resources

### Issue: High FID

**Symptoms**: Delayed response to user interactions

**Solutions**:
1. Break up long tasks
2. Code splitting
3. Use web workers
4. Defer non-critical JavaScript
5. Minimize third-party scripts

### Issue: High CLS

**Symptoms**: Unexpected layout shifts

**Solutions**:
1. Set explicit dimensions on images/videos
2. Reserve space for ads/embeds
3. Avoid inserting content above existing content
4. Use font-display: swap
5. Use CSS transform for animations

---

## Best Practices Summary

✅ **Always** set dimensions on images and videos
✅ **Preload** critical resources (fonts, LCP images)
✅ **Defer** non-critical JavaScript
✅ **Split** code by route/feature
✅ **Optimize** images (format, size, lazy loading)
✅ **Reserve** space for dynamic content
✅ **Use** CSS transforms for animations
✅ **Monitor** real user metrics continuously
✅ **Test** on real devices with throttled networks
✅ **Implement** performance budgets

---

This reference provides comprehensive guidance for optimizing Core Web Vitals. Use these techniques to ensure excellent mobile performance and search rankings.