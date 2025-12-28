#!/usr/bin/env node

/**
 * Frontend Performance Analysis Script
 * Purpose: Measure baseline performance before Phase 3 optimizations
 * Tasks: T051 preparation - Analyze current performance
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Frontend Performance Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const results = {
  timestamp: new Date().toISOString(),
  analysis: {
    bundleSize: {},
    componentCount: {},
    routeCount: {},
    codePatterns: {},
    opportunities: []
  }
};

// ============================================================================
// SECTION 1: Bundle Size Analysis
// ============================================================================

console.log('1. Bundle Size Analysis');
console.log('────────────────────────────────────────────────────────────────────────────');

try {
  // Check if build exists
  const buildManifest = join(__dirname, '.next', 'build-manifest.json');

  try {
    const manifest = JSON.parse(readFileSync(buildManifest, 'utf-8'));
    results.analysis.bundleSize.status = 'Build exists';
    results.analysis.bundleSize.pages = Object.keys(manifest.pages || {}).length;
    console.log(`✓ Build manifest found`);
    console.log(`  Pages: ${results.analysis.bundleSize.pages}`);
  } catch {
    results.analysis.bundleSize.status = 'No build found';
    console.log('⚠ No production build found');
    console.log('  Run: npm run build');
    results.analysis.opportunities.push({
      category: 'Build',
      priority: 'HIGH',
      task: 'Run production build to analyze bundle size',
      command: 'npm run build'
    });
  }
} catch (error) {
  results.analysis.bundleSize.error = error.message;
}

console.log();

// ============================================================================
// SECTION 2: Component Analysis
// ============================================================================

console.log('2. Component Analysis');
console.log('────────────────────────────────────────────────────────────────────────────');

const componentFiles = globSync('src/components/**/*.{tsx,ts,jsx,js}', { cwd: __dirname });
const pageFiles = globSync('src/app/**/page.{tsx,ts,jsx,js}', { cwd: __dirname });
const layoutFiles = globSync('src/app/**/layout.{tsx,ts,jsx,js}', { cwd: __dirname });

results.analysis.componentCount = {
  total: componentFiles.length,
  pages: pageFiles.length,
  layouts: layoutFiles.length,
  reusable: componentFiles.length - pageFiles.length - layoutFiles.length
};

console.log(`✓ Total components: ${results.analysis.componentCount.total}`);
console.log(`  Pages: ${results.analysis.componentCount.pages}`);
console.log(`  Layouts: ${results.analysis.componentCount.layouts}`);
console.log(`  Reusable: ${results.analysis.componentCount.reusable}`);

console.log();

// ============================================================================
// SECTION 3: Route Analysis
// ============================================================================

console.log('3. Route Analysis (Next.js App Router)');
console.log('────────────────────────────────────────────────────────────────────────────');

const routes = {
  static: [],
  dynamic: [],
  api: []
};

// Analyze page files for static vs dynamic
pageFiles.forEach(file => {
  const fullPath = join(__dirname, file);
  const content = readFileSync(fullPath, 'utf-8');

  const route = file
    .replace('src/app/', '')
    .replace('/page.tsx', '')
    .replace('/page.ts', '')
    .replace('/page.jsx', '')
    .replace('/page.js', '');

  // Check for dynamic segments
  if (route.includes('[') || content.includes('params')) {
    routes.dynamic.push(route || '/');
  } else {
    routes.static.push(route || '/');
  }
});

// Analyze API routes
const apiFiles = globSync('src/app/api/**/route.{ts,js}', { cwd: __dirname });
routes.api = apiFiles.map(file =>
  file
    .replace('src/app/api/', '')
    .replace('/route.ts', '')
    .replace('/route.js', '')
);

results.analysis.routeCount = {
  total: pageFiles.length,
  static: routes.static.length,
  dynamic: routes.dynamic.length,
  api: routes.api.length
};

console.log(`✓ Total routes: ${results.analysis.routeCount.total}`);
console.log(`  Static routes: ${results.analysis.routeCount.static}`);
console.log(`  Dynamic routes: ${results.analysis.routeCount.dynamic}`);
console.log(`  API routes: ${results.analysis.routeCount.api}`);

console.log();

// ============================================================================
// SECTION 4: Code Pattern Analysis
// ============================================================================

console.log('4. Code Pattern Analysis');
console.log('────────────────────────────────────────────────────────────────────────────');

const patterns = {
  'use client': 0,
  'use server': 0,
  'dynamic imports': 0,
  'Image optimization': 0,
  'Font optimization': 0,
  'Suspense boundaries': 0,
  'Error boundaries': 0,
  'Metadata exports': 0,
  'generateStaticParams': 0,
  'revalidate': 0
};

[...componentFiles, ...pageFiles].forEach(file => {
  const fullPath = join(__dirname, file);
  const content = readFileSync(fullPath, 'utf-8');

  if (content.includes("'use client'") || content.includes('"use client"')) patterns['use client']++;
  if (content.includes("'use server'") || content.includes('"use server"')) patterns['use server']++;
  if (content.includes('import(') || content.includes('dynamic(')) patterns['dynamic imports']++;
  if (content.includes('next/image') || content.includes('<Image')) patterns['Image optimization']++;
  if (content.includes('next/font')) patterns['Font optimization']++;
  if (content.includes('<Suspense')) patterns['Suspense boundaries']++;
  if (content.includes('ErrorBoundary') || content.includes('error.tsx')) patterns['Error boundaries']++;
  if (content.includes('export const metadata') || content.includes('export async function generateMetadata')) patterns['Metadata exports']++;
  if (content.includes('generateStaticParams')) patterns['generateStaticParams']++;
  if (content.includes('revalidate')) patterns['revalidate']++;
});

results.analysis.codePatterns = patterns;

Object.entries(patterns).forEach(([pattern, count]) => {
  const status = count > 0 ? '✓' : '○';
  console.log(`${status} ${pattern}: ${count}`);
});

console.log();

// ============================================================================
// SECTION 5: Optimization Opportunities
// ============================================================================

console.log('5. Optimization Opportunities (Phase 3 Tasks)');
console.log('────────────────────────────────────────────────────────────────────────────');

// ISR opportunities (T051-T056)
if (routes.static.length > 0 && patterns['revalidate'] === 0) {
  results.analysis.opportunities.push({
    category: 'ISR',
    priority: 'HIGH',
    task: 'T051-T056: Implement ISR for static routes',
    impact: `${routes.static.length} static routes can use ISR`,
    routes: routes.static.slice(0, 5) // Show first 5
  });
}

// Code splitting opportunities (T057-T066)
if (patterns['dynamic imports'] < componentFiles.length * 0.1) {
  results.analysis.opportunities.push({
    category: 'Code Splitting',
    priority: 'HIGH',
    task: 'T057-T066: Implement code splitting with dynamic imports',
    impact: `Only ${patterns['dynamic imports']} dynamic imports found, ${componentFiles.length} total components`,
    suggestion: 'Split large components and route-based code splitting'
  });
}

// Suspense opportunities
if (patterns['Suspense boundaries'] < routes.dynamic.length) {
  results.analysis.opportunities.push({
    category: 'Suspense',
    priority: 'MEDIUM',
    task: 'Add Suspense boundaries for dynamic routes',
    impact: `${routes.dynamic.length} dynamic routes, ${patterns['Suspense boundaries']} Suspense boundaries`,
    suggestion: 'Wrap async components with Suspense for better UX'
  });
}

// Image optimization
const componentNeedingImageOptimization = componentFiles.length - patterns['Image optimization'];
if (componentNeedingImageOptimization > 0) {
  results.analysis.opportunities.push({
    category: 'Images',
    priority: 'MEDIUM',
    task: 'Ensure all images use next/image',
    impact: `${patterns['Image optimization']} components use Image, ${componentNeedingImageOptimization} may need optimization`,
    suggestion: 'Replace <img> with next/image for automatic optimization'
  });
}

// Metadata optimization
if (patterns['Metadata exports'] < pageFiles.length) {
  results.analysis.opportunities.push({
    category: 'SEO',
    priority: 'MEDIUM',
    task: 'Add metadata exports to all pages',
    impact: `${pageFiles.length - patterns['Metadata exports']} pages missing metadata`,
    suggestion: 'Export metadata for SEO and social sharing'
  });
}

// Font optimization
if (patterns['Font optimization'] === 0) {
  results.analysis.opportunities.push({
    category: 'Fonts',
    priority: 'LOW',
    task: 'Implement next/font for font optimization',
    impact: 'No font optimization detected',
    suggestion: 'Use next/font/google or next/font/local for automatic font optimization'
  });
}

// Client components optimization
const clientComponentRatio = patterns['use client'] / componentFiles.length;
if (clientComponentRatio > 0.5) {
  results.analysis.opportunities.push({
    category: 'Server Components',
    priority: 'HIGH',
    task: 'Convert client components to server components where possible',
    impact: `${patterns['use client']} client components (${Math.round(clientComponentRatio * 100)}% of total)`,
    suggestion: 'Use server components by default, client components only when needed'
  });
}

// generateStaticParams for dynamic routes
if (routes.dynamic.length > 0 && patterns['generateStaticParams'] === 0) {
  results.analysis.opportunities.push({
    category: 'Static Generation',
    priority: 'HIGH',
    task: 'Implement generateStaticParams for dynamic routes',
    impact: `${routes.dynamic.length} dynamic routes without static generation`,
    suggestion: 'Pre-render dynamic routes at build time for better performance'
  });
}

console.log(`Found ${results.analysis.opportunities.length} optimization opportunities:\n`);

results.analysis.opportunities.forEach((opp, index) => {
  console.log(`${index + 1}. [${opp.priority}] ${opp.category}`);
  console.log(`   Task: ${opp.task}`);
  console.log(`   Impact: ${opp.impact}`);
  if (opp.suggestion) {
    console.log(`   → ${opp.suggestion}`);
  }
  console.log();
});

// ============================================================================
// SECTION 6: Phase 3 Task Mapping
// ============================================================================

console.log('6. Phase 3 Task Mapping');
console.log('────────────────────────────────────────────────────────────────────────────');

const phase3Tasks = {
  'T051-T056': {
    name: 'ISR Implementation',
    status: routes.static.length > 0 && patterns['revalidate'] === 0 ? 'Ready to implement' : 'Partially implemented',
    priority: 'HIGH',
    estimatedImpact: '30-50% faster page loads for static content'
  },
  'T057-T066': {
    name: 'Code Splitting',
    status: patterns['dynamic imports'] < 10 ? 'Ready to implement' : 'Partially implemented',
    priority: 'HIGH',
    estimatedImpact: '20-40% smaller initial bundle size'
  },
  'T067-T070': {
    name: 'Analytics Frontend Optimization',
    status: 'Ready to implement',
    priority: 'MEDIUM',
    estimatedImpact: 'Faster analytics dashboard with RPC integration'
  },
  'T071-T077': {
    name: 'Structured Logging',
    status: 'Ready to implement',
    priority: 'MEDIUM',
    estimatedImpact: 'Better debugging and monitoring'
  },
  'T078-T082': {
    name: 'Sentry APM',
    status: patterns['Error boundaries'] > 0 ? 'Partially implemented' : 'Ready to implement',
    priority: 'HIGH',
    estimatedImpact: 'Real-time performance monitoring and error tracking'
  }
};

Object.entries(phase3Tasks).forEach(([taskId, task]) => {
  console.log(`${taskId}: ${task.name}`);
  console.log(`  Status: ${task.status}`);
  console.log(`  Priority: ${task.priority}`);
  console.log(`  Impact: ${task.estimatedImpact}`);
  console.log();
});

results.phase3Tasks = phase3Tasks;

// ============================================================================
// SECTION 7: Save Results
// ============================================================================

console.log('7. Saving Results');
console.log('────────────────────────────────────────────────────────────────────────────');

const outputPath = join(__dirname, 'frontend-performance-baseline.json');
writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`✓ Results saved to: frontend-performance-baseline.json`);
console.log();

// ============================================================================
// SUMMARY
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 ANALYSIS SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();
console.log(`Total Components: ${results.analysis.componentCount.total}`);
console.log(`Total Routes: ${results.analysis.routeCount.total}`);
console.log(`  - Static: ${results.analysis.routeCount.static}`);
console.log(`  - Dynamic: ${results.analysis.routeCount.dynamic}`);
console.log(`  - API: ${results.analysis.routeCount.api}`);
console.log();
console.log(`Client Components: ${patterns['use client']} (${Math.round(clientComponentRatio * 100)}%)`);
console.log(`Dynamic Imports: ${patterns['dynamic imports']}`);
console.log(`Suspense Boundaries: ${patterns['Suspense boundaries']}`);
console.log();
console.log(`🎯 Optimization Opportunities: ${results.analysis.opportunities.length}`);
console.log();
console.log('Next Steps:');
console.log('1. Review frontend-performance-baseline.json');
console.log('2. Implement T051-T056 (ISR)');
console.log('3. Implement T057-T066 (Code Splitting)');
console.log('4. Implement T067-T070 (Analytics Optimization)');
console.log('5. Implement T071-T077 (Structured Logging)');
console.log('6. Implement T078-T082 (Sentry APM)');
console.log();
console.log('✅ Analysis complete!');
console.log();
