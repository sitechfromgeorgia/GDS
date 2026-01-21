# Schema Markup Templates

## Overview

Structured data (schema.org markup) helps search engines understand your content and enables rich results in search. JSON-LD is the recommended format.

---

## Organization Schema

**Use for:** Homepage, About page
**Benefits:** Brand knowledge panel, sitelinks searchbox

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company",
  "url": "https://www.example.com",
  "logo": "https://www.example.com/logo.png",
  "description": "Brief description of your organization",
  "foundingDate": "2020-01-01",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "Customer Service",
    "availableLanguage": ["English", "Spanish"],
    "areaServed": "US"
  },
  "sameAs": [
    "https://www.facebook.com/example",
    "https://twitter.com/example",
    "https://www.linkedin.com/company/example"
  ]
}
</script>
```

---

## LocalBusiness Schema

**Use for:** Local business websites
**Benefits:** Local pack, map listings, business details

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Example Coffee Shop",
  "image": "https://www.example.com/photo.jpg",
  "url": "https://www.example.com",
  "telephone": "+1-555-123-4567",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "16:00"
    }
  ]
}
</script>
```

---

## Article Schema

**Use for:** Blog posts, news articles
**Benefits:** Article rich results, Top Stories carousel

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to Technical SEO",
  "description": "Learn everything about technical SEO optimization",
  "image": [
    "https://www.example.com/article-image.jpg"
  ],
  "datePublished": "2025-01-15T08:00:00+00:00",
  "dateModified": "2025-01-20T12:30:00+00:00",
  "author": {
    "@type": "Person",
    "name": "John Doe",
    "url": "https://www.example.com/authors/john-doe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Publisher",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.example.com/logo.png",
      "width": 600,
      "height": 60
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.example.com/technical-seo-guide"
  }
}
</script>
```

---

## Product Schema

**Use for:** E-commerce product pages
**Benefits:** Product rich results, price information, reviews

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Example Product Name",
  "image": [
    "https://www.example.com/product1.jpg",
    "https://www.example.com/product2.jpg"
  ],
  "description": "Detailed product description",
  "sku": "PROD-12345",
  "mpn": "925872",
  "brand": {
    "@type": "Brand",
    "name": "Example Brand"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://www.example.com/product",
    "priceCurrency": "USD",
    "price": "99.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Example Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "127"
  },
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Customer Name"
    },
    "reviewBody": "This product exceeded my expectations..."
  }
}
</script>
```

---

## FAQ Schema

**Use for:** FAQ pages, Q&A sections
**Benefits:** FAQ rich results, expanded visibility

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is technical SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Technical SEO refers to optimizing your website's technical elements to help search engines crawl, index, and understand your content effectively."
      }
    },
    {
      "@type": "Question",
      "name": "How often should I conduct an SEO audit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It's recommended to perform a full technical SEO audit quarterly, with monthly mini-audits to catch new issues early."
      }
    }
  ]
}
</script>
```

---

## BreadcrumbList Schema

**Use for:** Breadcrumb navigation
**Benefits:** Breadcrumb rich results in search

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://www.example.com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Category",
      "item": "https://www.example.com/products/category"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Product Name"
    }
  ]
}
</script>
```

---

## HowTo Schema

**Use for:** Tutorial and how-to content
**Benefits:** How-to rich results with steps

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Optimize Your Website for SEO",
  "description": "Step-by-step guide to technical SEO optimization",
  "image": "https://www.example.com/guide-image.jpg",
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Website access"
    },
    {
      "@type": "HowToSupply",
      "name": "SEO tools"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Google Search Console"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Check robots.txt",
      "text": "Verify your robots.txt file is not blocking important pages",
      "url": "https://www.example.com/guide#step1",
      "image": "https://www.example.com/step1.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Optimize meta tags",
      "text": "Ensure all pages have unique, optimized title tags and meta descriptions",
      "url": "https://www.example.com/guide#step2"
    }
  ]
}
</script>
```

---

## VideoObject Schema

**Use for:** Video content
**Benefits:** Video rich results, video carousels

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "SEO Tutorial Video",
  "description": "Learn technical SEO in 10 minutes",
  "thumbnailUrl": "https://www.example.com/thumbnail.jpg",
  "uploadDate": "2025-01-15T08:00:00+00:00",
  "duration": "PT10M30S",
  "contentUrl": "https://www.example.com/video.mp4",
  "embedUrl": "https://www.example.com/embed/video-id",
  "publisher": {
    "@type": "Organization",
    "name": "Example Channel",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.example.com/logo.png"
    }
  }
}
</script>
```

---

## Implementation Best Practices

### General Guidelines
1. **Use JSON-LD format** (preferred by Google)
2. **Place in `<head>` or `<body>`** of HTML
3. **Validate with testing tools**
4. **Keep data accurate and updated**
5. **Don't mark up hidden content**

### Testing Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Markup Validator**: https://validator.schema.org/
- **Google Search Console**: Rich results report

### Common Mistakes to Avoid
❌ Marking up content not visible to users
❌ Using incorrect schema types
❌ Including promotional content in schema
❌ Mismatching schema data with page content
❌ Not updating schema after content changes
❌ Using outdated schema properties

### Multiple Schema Types
You can combine multiple schema types on one page:

```json
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Example Company"
  },
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Article Title"
  }
]
</script>
```

---

## Schema Priority by Page Type

### Homepage
1. Organization
2. WebSite (with SiteNavigationElement)
3. LocalBusiness (if applicable)

### Product Pages
1. Product
2. BreadcrumbList
3. AggregateRating (if applicable)

### Article/Blog Pages
1. Article (or BlogPosting)
2. BreadcrumbList
3. Person (author)

### Service Pages
1. Service
2. LocalBusiness
3. AggregateRating

### Contact Page
1. Organization (with ContactPoint)
2. LocalBusiness (with address)

---

## Advanced Schema Patterns

### ItemList for Product Collections
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Product 1"
      }
    }
  ]
}
```

### Event Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "SEO Conference 2025",
  "startDate": "2025-06-15T09:00",
  "endDate": "2025-06-17T17:00",
  "location": {
    "@type": "Place",
    "name": "Convention Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main St",
      "addressLocality": "San Francisco",
      "postalCode": "94102"
    }
  }
}
```

---

## Validation Checklist

Before deploying schema markup:
- [ ] All required properties included
- [ ] Data matches visible page content
- [ ] Correct schema type for content
- [ ] Valid URL format for links
- [ ] Dates in ISO 8601 format
- [ ] Images meet requirements (1200px width minimum)
- [ ] No syntax errors in JSON
- [ ] Tested with Rich Results Test
- [ ] Verified in Search Console after deployment
