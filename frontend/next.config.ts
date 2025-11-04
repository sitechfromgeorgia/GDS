import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // React 19 + Next.js 15 configuration
  reactStrictMode: true,

  // Fix for workspace root detection warning
  // Points to the correct root directory for file tracing
  outputFileTracingRoot: path.join(__dirname, '../'),

  // Allow images from both development and production Supabase storage
  images: {
    remotePatterns: [
      // Development Supabase
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Production Supabase (data.greenland77.ge)
      {
        protocol: 'https',
        hostname: 'data.greenland77.ge',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Additional common Supabase domains
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // API routes configuration with environment-aware CORS
  async headers() {
    const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

    // Define allowed origins based on environment
    let allowedOrigins: string[];
    if (environment === 'production') {
      allowedOrigins = [
        'https://greenland77.ge',
        'https://www.greenland77.ge',
        'http://localhost:3000', // Allow localhost for testing
      ];
    } else {
      allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'https://greenland77.ge', // Allow production domain for cross-environment testing
      ];
    }

    // Additional CORS origins from environment variable (comma-separated)
    const envCorsOrigins = process.env.NEXT_PUBLIC_CORS_ORIGINS;
    if (envCorsOrigins) {
      const additionalOrigins = envCorsOrigins
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
      allowedOrigins = [...allowedOrigins, ...additionalOrigins];
    }

    const primaryOrigin = allowedOrigins[0] || 'http://localhost:3000';

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // Reflect the request Origin only if it is in the allowed list
          { key: 'Vary', value: 'Origin' },
          { key: 'Access-Control-Allow-Origin', value: primaryOrigin as string },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // 24 hours
        ],
      },
      {
        // Handle preflight requests for OPTIONS method
        // Security: Use specific origins instead of wildcard
        source: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'origin'
          }
        ],
        headers: [
          // Use the first allowed origin instead of wildcard for security
          // In production, middleware should validate the actual origin header
          { key: 'Access-Control-Allow-Origin', value: primaryOrigin },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Vary', value: 'Origin' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },

  // External packages for React Server Components (moved from experimental)
  serverExternalPackages: ["@supabase/supabase-js"],

  // Bundle pages router dependencies (moved from experimental)
  bundlePagesRouterDependencies: true,

  // Experimental features for React 19 + Turbopack + React Compiler
  experimental: {
    // React Compiler (auto-memoization and optimization)
    // Note: Requires babel-plugin-react-compiler to be installed
    reactCompiler: false, // Disabled until babel-plugin-react-compiler is installed

    // Server Actions with enhanced origins
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        '127.0.0.1:3000',
        '*.supabase.co',
        'data.greenland77.ge',
        'greenland77.ge'
      ],
    },

    // Package optimization for Turbopack
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ],

    // Memory and performance optimizations
    webpackMemoryOptimizations: true,
  },

  // Webpack configuration for React Server Components and performance
  webpack: (config, { dev, isServer }) => {
    // Set unique webpack bundle name to avoid module federation issues
    config.output = config.output || {}
    config.output.uniqueName = 'georgian-distribution-frontend'

    // Note: React alias removed - Next.js 15 handles React 19 resolution automatically
    // The require.resolve() was causing "Module not found: Can't resolve 'react/jsx-runtime'" errors

    // Fix for React Server Components module resolution
    if (isServer) {
      // Add external packages that shouldn't be bundled on server
      config.externals.push('node:crypto', 'node:fs', 'node:path', 'node:buffer')
    }

    // CRITICAL FIX: Disable splitChunks in development to avoid webpack runtime errors
    if (dev) {
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = false
      config.optimization.runtimeChunk = false
    }

    // Use default devtool for development to avoid performance issues
    // Only enable detailed source maps in production or when specifically needed
    if (!dev) {
      config.devtool = 'source-map'

      // MODIFIED: Simplified chunk splitting to avoid webpack runtime errors
      if (isServer) {
        // Disable chunk splitting on server-side to prevent 'self' related issues
        config.optimization = config.optimization || {}
        config.optimization.splitChunks = false
        config.optimization.runtimeChunk = false
      } else {
        // Performance optimizations for production (client-side only)
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
    }

    // Fix for development hot module replacement
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

  // Enable compression
  compress: true,

  // Production optimizations
  poweredByHeader: false,

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: 'my-value',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },

  // Redirects for environment switching
  async redirects() {
    const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

    // Optional: Redirect root to appropriate dashboard based on environment
    if (environment === 'production') {
      return [
        {
          source: '/',
          destination: '/dashboard/admin',
          permanent: false,
        },
      ];
    }

    return [];
  },

  // Typescript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Asset configuration
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_ASSET_PREFIX || '' : '',

  // Base path configuration
  basePath: process.env.NODE_ENV === 'production' ? '' : '',

  // PWA Configuration
  // Service worker is registered client-side via lib/pwa.ts
  // Manifest.json is in public directory
};

export default nextConfig;
