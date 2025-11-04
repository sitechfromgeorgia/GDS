/**
 * CDN Configuration for Static Assets
 * Configures CloudFront, Cloudflare, or other CDN providers
 */

const CDN_CONFIG = {
  // CDN Provider (cloudfront, cloudflare, custom)
  provider: process.env.CDN_PROVIDER || 'cloudflare',

  // CDN Domain (e.g., cdn.greenland77.ge)
  domain: process.env.CDN_URL || 'https://cdn.greenland77.ge',

  // Asset prefix for Next.js
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.CDN_URL
    ? process.env.CDN_URL
    : '',

  // Static file paths to be served from CDN
  staticPaths: [
    '/_next/static',
    '/static',
    '/images',
    '/fonts',
    '/icons',
  ],

  // Cache control headers for different asset types
  cacheControl: {
    // Immutable assets (with content hash in filename)
    immutable: {
      pattern: /\/_next\/static\/.+\.(js|css|woff2?)$/,
      header: 'public, max-age=31536000, immutable',
    },
    // Images
    images: {
      pattern: /\.(jpg|jpeg|png|gif|svg|webp|ico)$/,
      header: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
    // Fonts
    fonts: {
      pattern: /\.(woff2?|ttf|otf|eot)$/,
      header: 'public, max-age=31536000, immutable',
    },
    // HTML pages
    html: {
      pattern: /\.html$/,
      header: 'public, max-age=0, must-revalidate',
    },
    // API responses
    api: {
      pattern: /\/api\//,
      header: 'private, no-cache, no-store, must-revalidate',
    },
  },

  // CloudFront specific configuration
  cloudfront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    // Invalidation paths on deployment
    invalidationPaths: [
      '/_next/static/*',
      '/index.html',
    ],
  },

  // Cloudflare specific configuration
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    // Purge cache on deployment
    purgeOnDeploy: true,
    // Cache rules
    cacheRules: {
      // Cache static assets for 1 year
      static: {
        edgeTTL: 31536000,
        browserTTL: 31536000,
      },
      // Cache HTML for 1 hour
      html: {
        edgeTTL: 3600,
        browserTTL: 0,
      },
    },
  },

  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  securityHeaders: [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
  ],
}

// Export configuration
module.exports = CDN_CONFIG

// Helper function to get asset URL
export function getAssetURL(path) {
  const prefix = CDN_CONFIG.assetPrefix
  if (!prefix) return path
  return `${prefix}${path}`
}

// Helper function to get cache control header
export function getCacheControl(path) {
  for (const [type, config] of Object.entries(CDN_CONFIG.cacheControl)) {
    if (config.pattern.test(path)) {
      return config.header
    }
  }
  return 'public, max-age=0, must-revalidate' // Default
}
