#!/usr/bin/env node

/**
 * Fix ALL Supabase Singleton Imports
 *
 * This script comprehensively fixes all remaining supabase singleton imports
 * by replacing them with the proper createBrowserClient() pattern.
 *
 * Handles:
 * - import { supabase } from '@/lib/supabase'
 * - import { supabase } from './client'
 * - import { supabase } from '../lib/supabase'
 * - All usages of the singleton instance
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.join(__dirname, '..', 'src')

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsFixed: 0,
  errors: []
}

// Files to skip
const SKIP_PATTERNS = [
  'logger.test.ts',
  'test-utils.tsx',
  'vitest.config',
  'next.config',
  '.test.ts',
  '.test.tsx',
  'supabase/client.ts',
  'supabase/server.ts',
  'supabase/index.ts',
]

function shouldSkipFile(filePath) {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern))
}

/**
 * Check if file has singleton supabase import
 */
function hasSingletonImport(content) {
  const patterns = [
    /import\s*{\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase['"]/,
    /import\s*{\s*supabase\s*}\s*from\s*['"]\.\/client['"]/,
    /import\s*{\s*supabase\s*}\s*from\s*['"]\.\.\/lib\/supabase['"]/,
    /import\s*{\s*supabase[^}]*}\s*from\s*['"]@\/lib\/supabase['"]/,
  ]

  return patterns.some(pattern => pattern.test(content))
}

/**
 * Fix import statement
 */
function fixImportStatement(content) {
  // Pattern 1: import { supabase } from '@/lib/supabase'
  content = content.replace(
    /import\s*{\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase['"]/g,
    "import { createBrowserClient } from '@/lib/supabase'"
  )

  // Pattern 2: import { supabase } from './client'
  content = content.replace(
    /import\s*{\s*supabase\s*}\s*from\s*['"]\.\/client['"]/g,
    "import { createBrowserClient } from './client'"
  )

  // Pattern 3: import { supabase, other } from '@/lib/supabase'
  content = content.replace(
    /import\s*{\s*supabase\s*,\s*([^}]+)}\s*from\s*['"]@\/lib\/supabase['"]/g,
    "import { createBrowserClient, $1 } from '@/lib/supabase'"
  )

  content = content.replace(
    /import\s*{\s*([^}]+),\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase['"]/g,
    "import { $1, createBrowserClient } from '@/lib/supabase'"
  )

  return content
}

/**
 * Add supabase instance creation after imports
 */
function addSupabaseCreation(content) {
  // Check if already has createBrowserClient() call
  if (content.includes('const supabase = createBrowserClient()')) {
    return content
  }

  // Find the last import statement
  const lines = content.split('\n')
  let lastImportIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at the top after 'use client'
    const useClientIndex = lines.findIndex(line =>
      line.includes("'use client'") || line.includes('"use client"')
    )

    if (useClientIndex >= 0) {
      lines.splice(useClientIndex + 1, 0, '', 'const supabase = createBrowserClient()')
    } else {
      lines.unshift('const supabase = createBrowserClient()', '')
    }
  } else {
    // Add after last import
    lines.splice(lastImportIndex + 1, 0, '', '// Create Supabase client instance', 'const supabase = createBrowserClient()')
  }

  return lines.join('\n')
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return
  }

  stats.filesProcessed++

  try {
    const content = await fs.readFile(filePath, 'utf-8')

    if (!hasSingletonImport(content)) {
      return
    }

    let newContent = content

    // Fix import statements
    const beforeImport = newContent
    newContent = fixImportStatement(newContent)

    if (newContent !== beforeImport) {
      // Add supabase instance creation
      newContent = addSupabaseCreation(newContent)

      stats.filesModified++
      stats.importsFixed++

      const relativePath = path.relative(SRC_DIR, filePath)
      logger.info(`✓ Fixed: ${relativePath}`)

      await fs.writeFile(filePath, newContent, 'utf-8')
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message })
    logger.error(`✗ Error processing ${filePath}:`, error)
  }
}

/**
 * Find all TypeScript files
 */
async function findTypeScriptFiles(dir) {
  const files = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next') {
          files.push(...await findTypeScriptFiles(fullPath))
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message)
  }

  return files
}

/**
 * Simple console logger (since we can't import the real logger)
 */
const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Finding TypeScript files with singleton supabase imports...\n')

  const files = await findTypeScriptFiles(SRC_DIR)
  console.log(`Found ${files.length} TypeScript files\n`)

  console.log('🔄 Processing files...\n')

  for (const file of files) {
    await processFile(file)
  }

  console.log('\n📊 Summary:')
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files modified: ${stats.filesModified}`)
  console.log(`   Imports fixed: ${stats.importsFixed}`)

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`)
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${path.relative(SRC_DIR, file)}: ${error}`)
    })
  }

  if (stats.filesModified > 0) {
    console.log('\n✅ All singleton imports have been fixed!')
    console.log('💡 Run "npm run build" to verify')
  } else {
    console.log('\n✅ No files needed fixing!')
  }
}

main().catch(console.error)
