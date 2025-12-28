import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React 19 + Next.js 15 configuration
  reactStrictMode: true,

  // CRITICAL: Disable source maps in development to prevent Edge Runtime EvalError
  // Edge Runtime (middleware) does not allow eval() which source map generation uses
  productionBrowserSourceMaps: false,

  // Allow images from self-hosted Supabase storage
  images: {
    remotePatterns: [
      // Self-hosted Supabase (data.greenland77.ge)
      {
        protocol: 'https',
        hostname: 'data.greenland77.ge',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Mock images for Demo
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Security Headers & API CORS
  async headers() {
    const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'
    const isProduction = environment === 'production'

    // Define allowed origins based on environment
    let allowedOrigins: string[]
    if (isProduction) {
      allowedOrigins = [
        'https://greenland77.ge',
        'https://www.greenland77.ge',
        'http://localhost:3000', // Allow localhost for testing
      ]
    } else {
      allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'https://greenland77.ge',
      ]
    }

    // Additional CORS origins from environment variable
    const envCorsOrigins = process.env.NEXT_PUBLIC_CORS_ORIGINS
    if (envCorsOrigins) {
      const additionalOrigins = envCorsOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
      allowedOrigins = [...allowedOrigins, ...additionalOrigins]
    }

    const primaryOrigin = allowedOrigins[0] || 'http://localhost:3000'

    // CSP Directives
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      `connect-src 'self' https://data.greenland77.ge wss://data.greenland77.ge ${process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL} ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https', 'wss')}` : 'https://*.supabase.co wss://*.supabase.co'}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')

    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: cspDirectives },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), payment=()',
      },
    ]

    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Vary', value: 'Origin' },
          { key: 'Access-Control-Allow-Origin', value: primaryOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },

  // External packages for React Server Components
  serverExternalPackages: ['@supabase/supabase-js'],

  // Bundle pages router dependencies
  bundlePagesRouterDependencies: true,

  experimental: {
    // React Compiler
    reactCompiler: true,

    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        '127.0.0.1:3000',
        'data.greenland77.ge',
        'greenland77.ge',
        'www.greenland77.ge',
      ],
    },

    // Package optimization
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],

    // Memory and performance optimizations
    webpackMemoryOptimizations: true,

    // Disable Edge Runtime source maps to prevent EvalError
    // This is needed when using WASM-based SWC fallback
    serverSourceMaps: false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    config.output = config.output || {}
    config.output.uniqueName = 'georgian-distribution-frontend'

    if (isServer) {
      config.externals.push('node:crypto', 'node:fs', 'node:path', 'node:buffer')
    }

    // CRITICAL: Disable devtool for Edge Runtime compatibility
    // Edge Runtime (middleware) does not allow eval() which source-map generation uses
    // Using 'source-map' instead of eval-based devtools to fix middleware EvalError
    if (dev) {
      // For Edge Runtime compatibility, use source-map (slower but no eval)
      config.devtool = 'source-map'
    } else {
      config.devtool = false
    }

    if (isServer) {
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = false
      config.optimization.runtimeChunk = false
    } else {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|recharts|date-fns)[\\/]/,
            name: 'ui-libs',
            chunks: 'all',
            priority: 15,
          },
        },
      }
    }

    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  compress: true,
  poweredByHeader: false,

  env: {
    CUSTOM_KEY: 'my-value',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },

  async redirects() {
    const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'

    if (environment === 'production') {
      return [
        {
          source: '/',
          destination: '/dashboard/admin',
          permanent: false,
        },
      ]
    }

    return []
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  assetPrefix:
    process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_ASSET_PREFIX || '' : '',
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
}

export default nextConfig
