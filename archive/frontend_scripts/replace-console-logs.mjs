#!/usr/bin/env node

/**
 * Replace console.log with logger utility
 *
 * This script automatically replaces console.log statements with
 * the appropriate logger method based on context.
 *
 * Usage:
 *   node scripts/replace-console-logs.mjs [--dry-run]
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = process.argv.includes('--dry-run')
const SRC_DIR = path.join(__dirname, '..', 'src')

// Patterns to replace
const PATTERNS = [
  // console.log → logger.info
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    type: 'info'
  },
  // console.error → logger.error
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    type: 'error'
  },
  // console.warn → logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    type: 'warn'
  },
  // console.debug → logger.debug
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    type: 'debug'
  }
]

// Files to skip
const SKIP_FILES = [
  'logger.ts',
  'logger.test.ts',
  '.test.ts',
  '.test.tsx',
  'test-utils.tsx',
  'vitest.config.ts',
  'next.config.ts',
  'polyfills',
]

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: 0,
  errors: []
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip))
}

/**
 * Add logger import if not present
 */
function addLoggerImport(content) {
  // Check if logger is already imported
  if (content.includes("from '@/lib/logger'")) {
    return content
  }

  // Check if there are other imports
  const importMatch = content.match(/^import\s/m)

  if (importMatch) {
    // Add after first import
    const lines = content.split('\n')
    const firstImportIndex = lines.findIndex(line => line.startsWith('import'))

    // Check if 'use client' or 'use server' is present
    const useDirectiveIndex = lines.findIndex(line =>
      line.startsWith("'use client'") || line.startsWith("'use server'") ||
      line.startsWith('"use client"') || line.startsWith('"use server"')
    )

    const insertIndex = useDirectiveIndex >= 0 ? useDirectiveIndex + 1 : firstImportIndex
    lines.splice(insertIndex, 0, "import { logger } from '@/lib/logger'")

    return lines.join('\n')
  } else {
    // No imports, add at top (after 'use client' if present)
    const lines = content.split('\n')
    const useDirectiveIndex = lines.findIndex(line =>
      line.startsWith("'use client'") || line.startsWith("'use server'") ||
      line.startsWith('"use client"') || line.startsWith('"use server"')
    )

    if (useDirectiveIndex >= 0) {
      lines.splice(useDirectiveIndex + 1, 0, '', "import { logger } from '@/lib/logger'")
    } else {
      lines.unshift("import { logger } from '@/lib/logger'", '')
    }

    return lines.join('\n')
  }
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

    // Check if file has console statements
    const hasConsole = PATTERNS.some(({ pattern }) => pattern.test(content))

    if (!hasConsole) {
      return
    }

    let newContent = content
    let fileReplacements = 0

    // Replace console statements
    for (const { pattern, replacement } of PATTERNS) {
      const matches = newContent.match(pattern)
      if (matches) {
        fileReplacements += matches.length
        newContent = newContent.replace(pattern, replacement)
      }
    }

    if (fileReplacements > 0) {
      // Add logger import
      newContent = addLoggerImport(newContent)

      stats.filesModified++
      stats.replacements += fileReplacements

      const relativePath = path.relative(SRC_DIR, filePath)
      console.log(`✓ ${relativePath}: ${fileReplacements} replacements`)

      if (!DRY_RUN) {
        await fs.writeFile(filePath, newContent, 'utf-8')
      }
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message })
    console.error(`✗ Error processing ${filePath}:`, error.message)
  }
}

/**
 * Recursively find all TypeScript files
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
 * Main function
 */
async function main() {
  console.log('🔍 Finding TypeScript files...\n')

  const files = await findTypeScriptFiles(SRC_DIR)
  console.log(`Found ${files.length} TypeScript files\n`)

  if (DRY_RUN) {
    console.log('🏃 Running in DRY RUN mode (no files will be modified)\n')
  }

  console.log('🔄 Processing files...\n')

  for (const file of files) {
    await processFile(file)
  }

  console.log('\n📊 Summary:')
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files modified: ${stats.filesModified}`)
  console.log(`   Total replacements: ${stats.replacements}`)

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`)
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`)
    })
  }

  if (DRY_RUN && stats.replacements > 0) {
    console.log('\n💡 Run without --dry-run to apply changes')
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)
