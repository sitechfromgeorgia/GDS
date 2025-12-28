import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"test"',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/types/',
        'src/**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/components/**': {
          branches: 60,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      reportsDirectory: './coverage',
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '**/*.d.ts',
      'tests/e2e/**',
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ['default', 'junit'],
    onConsoleLog: (log: string, type: string) => {
      if (
        log.includes('Warning: ReactDOM.render') ||
        log.includes('ReactDOM.render is no longer supported')
      ) {
        return false
      }
      return true
    },
    environmentOptions: {
      'happy-dom': {
        url: 'http://localhost:3000',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/validators': path.resolve(__dirname, './src/lib/validators'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/testing': path.resolve(__dirname, './src/lib/testing'),
    },
  },
  esbuild: {
    target: 'es2020',
    sourcemap: false,
  },
  server: {
    port: 51204,
    host: true,
  },
})
