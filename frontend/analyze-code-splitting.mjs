#!/usr/bin/env node

/**
 * Code Splitting Analysis Script (T057)
 *
 * Analyzes the codebase to identify code splitting opportunities:
 * - Large components (>100 lines, >10KB)
 * - Heavy dependencies (chart libraries, date pickers, etc.)
 * - Route-based splitting opportunities
 * - Components suitable for dynamic imports
 *
 * Generates baseline metrics before optimization.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs'
import { join, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC_DIR = join(__dirname, 'src')
const OUTPUT_FILE = join(__dirname, 'code-splitting-baseline.json')

// Heavy dependencies to look for
const HEAVY_DEPENDENCIES = [
  'recharts',
  'chart.js',
  'react-chartjs-2',
  '@tanstack/react-table',
  'react-hook-form',
  'zod',
  'date-fns',
  'react-day-picker',
  'sonner',
  '@radix-ui',
  'framer-motion',
]

const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalComponents: 0,
    largeComponents: 0,
    heavyDependencyImports: 0,
    dynamicImportsFound: 0,
    suspenseBoundariesFound: 0,
    lazyComponentsFound: 0,
  },
  largeComponents: [], // >100 lines or >10KB
  heavyDependencies: [], // Components importing heavy libs
  dynamicImports: [], // Existing dynamic imports
  suspenseBoundaries: [], // Existing Suspense usage
  opportunities: [],
}

/**
 * Recursively find all TypeScript/TSX files
 */
function findFiles(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const filePath = join(dir, file.name)

    if (file.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'build'].includes(file.name)) {
        findFiles(filePath, fileList)
      }
    } else if (file.isFile()) {
      const ext = extname(file.name)
      if (['.ts', '.tsx'].includes(ext)) {
        fileList.push(filePath)
      }
    }
  }

  return fileList
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const stats = statSync(filePath)
  const lines = content.split('\n').length
  const sizeKB = stats.size / 1024
  const relativePath = relative(SRC_DIR, filePath)

  results.summary.totalComponents++

  // Check for large components
  if (lines > 100 || sizeKB > 10) {
    results.summary.largeComponents++
    results.largeComponents.push({
      file: relativePath,
      lines,
      sizeKB: sizeKB.toFixed(2),
      reason: lines > 100 ? `${lines} lines` : `${sizeKB.toFixed(2)} KB`,
    })
  }

  // Check for heavy dependency imports
  const heavyImports = HEAVY_DEPENDENCIES.filter(dep =>
    content.includes(`from '${dep}'`) ||
    content.includes(`from "${dep}"`) ||
    content.includes(`from '${dep}/`) ||
    content.includes(`from "${dep}/`)
  )

  if (heavyImports.length > 0) {
    results.summary.heavyDependencyImports++
    results.heavyDependencies.push({
      file: relativePath,
      dependencies: heavyImports,
      lines,
      sizeKB: sizeKB.toFixed(2),
    })
  }

  // Check for existing dynamic imports
  if (content.includes('import(') || content.includes('next/dynamic')) {
    results.summary.dynamicImportsFound++
    results.dynamicImports.push({
      file: relativePath,
      type: content.includes('next/dynamic') ? 'next/dynamic' : 'import()',
    })
  }

  // Check for Suspense boundaries
  if (content.includes('<Suspense') || content.includes('Suspense>')) {
    results.summary.suspenseBoundariesFound++
    results.suspenseBoundaries.push({
      file: relativePath,
    })
  }

  // Check for lazy imports
  if (content.includes('lazy(')) {
    results.summary.lazyComponentsFound++
  }
}

/**
 * Generate optimization opportunities
 */
function generateOpportunities() {
  // Opportunity 1: Large components without dynamic imports
  const largeWithoutDynamic = results.largeComponents.filter(comp =>
    !results.dynamicImports.some(imp => imp.file === comp.file)
  )

  if (largeWithoutDynamic.length > 0) {
    results.opportunities.push({
      category: 'Code Splitting',
      priority: 'HIGH',
      impact: `${largeWithoutDynamic.length} large components can use dynamic imports`,
      count: largeWithoutDynamic.length,
      files: largeWithoutDynamic.slice(0, 10).map(c => c.file),
      estimatedSavings: `${(largeWithoutDynamic.reduce((sum, c) => sum + parseFloat(c.sizeKB), 0)).toFixed(2)} KB`,
    })
  }

  // Opportunity 2: Heavy dependencies without code splitting
  const heavyWithoutDynamic = results.heavyDependencies.filter(comp =>
    !results.dynamicImports.some(imp => imp.file === comp.file)
  )

  if (heavyWithoutDynamic.length > 0) {
    results.opportunities.push({
      category: 'Heavy Dependencies',
      priority: 'HIGH',
      impact: `${heavyWithoutDynamic.length} components with heavy libs need lazy loading`,
      count: heavyWithoutDynamic.length,
      files: heavyWithoutDynamic.slice(0, 10).map(c => c.file),
      topDependencies: [...new Set(heavyWithoutDynamic.flatMap(c => c.dependencies))],
    })
  }

  // Opportunity 3: Missing Suspense boundaries
  const dynamicWithoutSuspense = results.dynamicImports.filter(imp =>
    !results.suspenseBoundaries.some(susp => susp.file === imp.file)
  )

  if (dynamicWithoutSuspense.length > 0) {
    results.opportunities.push({
      category: 'Suspense Boundaries',
      priority: 'MEDIUM',
      impact: `${dynamicWithoutSuspense.length} dynamic imports missing Suspense`,
      count: dynamicWithoutSuspense.length,
      files: dynamicWithoutSuspense.map(c => c.file),
    })
  }

  // Opportunity 4: Route-based splitting
  const routeFiles = results.largeComponents.filter(comp =>
    comp.file.includes('/app/') && (comp.file.endsWith('/page.tsx') || comp.file.endsWith('/layout.tsx'))
  )

  if (routeFiles.length > 0) {
    results.opportunities.push({
      category: 'Route-Based Splitting',
      priority: 'MEDIUM',
      impact: `${routeFiles.length} large route components can be optimized`,
      count: routeFiles.length,
      files: routeFiles.map(c => c.file),
    })
  }

  // Opportunity 5: Component-level splitting
  const componentFiles = results.largeComponents.filter(comp =>
    comp.file.includes('/components/') && !comp.file.includes('/ui/')
  )

  if (componentFiles.length > 0) {
    results.opportunities.push({
      category: 'Component Splitting',
      priority: 'LOW',
      impact: `${componentFiles.length} large components can be split`,
      count: componentFiles.length,
      files: componentFiles.slice(0, 15).map(c => c.file),
    })
  }
}

/**
 * Phase 3 Task Mapping
 */
function mapToPhase3Tasks() {
  results.phase3Mapping = {
    'T057': {
      task: 'Create code splitting baseline analysis',
      status: 'COMPLETE',
      file: 'analyze-code-splitting.mjs',
    },
    'T058': {
      task: 'Identify and implement route-based code splitting',
      status: 'READY',
      targetFiles: results.opportunities.find(o => o.category === 'Route-Based Splitting')?.files || [],
      estimatedImpact: '10-15% bundle reduction',
    },
    'T059': {
      task: 'Implement dynamic imports for heavy dependencies',
      status: 'READY',
      targetFiles: results.opportunities.find(o => o.category === 'Heavy Dependencies')?.files || [],
      dependencies: results.opportunities.find(o => o.category === 'Heavy Dependencies')?.topDependencies || [],
      estimatedImpact: '15-25% bundle reduction',
    },
    'T060': {
      task: 'Add Suspense boundaries for all dynamic imports',
      status: 'READY',
      targetFiles: results.opportunities.find(o => o.category === 'Suspense Boundaries')?.files || [],
      estimatedImpact: 'Better loading UX',
    },
    'T061': {
      task: 'Implement component-level code splitting',
      status: 'READY',
      targetFiles: results.opportunities.find(o => o.category === 'Component Splitting')?.files?.slice(0, 10) || [],
      estimatedImpact: '5-10% bundle reduction',
    },
    'T062': {
      task: 'Optimize admin dashboard with lazy loading',
      status: 'READY',
      focus: 'Admin components with heavy charts',
    },
    'T063': {
      task: 'Optimize restaurant catalog with lazy loading',
      status: 'READY',
      focus: 'Product grid and filters',
    },
    'T064': {
      task: 'Optimize analytics dashboard with lazy loading',
      status: 'READY',
      focus: 'Chart components and date pickers',
    },
    'T065': {
      task: 'Add loading skeletons for all lazy components',
      status: 'READY',
      estimatedImpact: 'Improved perceived performance',
    },
    'T066': {
      task: 'Measure and document bundle size improvements',
      status: 'PENDING',
      metrics: 'Before/after bundle analysis',
    },
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Analyzing codebase for code splitting opportunities...\n')

  // Find all files
  const files = findFiles(SRC_DIR)
  console.log(`📁 Found ${files.length} TypeScript/TSX files\n`)

  // Analyze each file
  for (const file of files) {
    analyzeFile(file)
  }

  // Generate opportunities
  generateOpportunities()

  // Map to Phase 3 tasks
  mapToPhase3Tasks()

  // Write results
  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))

  // Print summary
  console.log('📊 Analysis Complete!\n')
  console.log('Summary:')
  console.log(`  Total components analyzed: ${results.summary.totalComponents}`)
  console.log(`  Large components (>100 lines or >10KB): ${results.summary.largeComponents}`)
  console.log(`  Components with heavy dependencies: ${results.summary.heavyDependencyImports}`)
  console.log(`  Existing dynamic imports: ${results.summary.dynamicImportsFound}`)
  console.log(`  Existing Suspense boundaries: ${results.summary.suspenseBoundariesFound}`)
  console.log(`  Lazy components: ${results.summary.lazyComponentsFound}`)
  console.log()
  console.log(`Opportunities identified: ${results.opportunities.length}`)
  results.opportunities.forEach((opp, idx) => {
    console.log(`  ${idx + 1}. [${opp.priority}] ${opp.category}: ${opp.impact}`)
  })
  console.log()
  console.log(`✅ Results saved to: ${OUTPUT_FILE}`)
  console.log()

  // Estimate total impact
  const totalLargeKB = results.largeComponents.reduce((sum, c) => sum + parseFloat(c.sizeKB), 0)
  console.log(`📦 Estimated Bundle Size Savings: ${(totalLargeKB * 0.3).toFixed(2)} KB - ${(totalLargeKB * 0.5).toFixed(2)} KB (30-50% of large components)`)
  console.log(`⚡ Expected Performance Improvement: 20-40% faster Time to Interactive`)
}

main().catch(console.error)
