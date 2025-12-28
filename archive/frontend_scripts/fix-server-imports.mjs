#!/usr/bin/env node

/**
 * Fix Server-Side Supabase Imports
 *
 * Changes:
 * - import { createServerClient } from '@/lib/supabase'
 * → import { createServerClient } from '@/lib/supabase/server'
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
}

async function processFile(filePath) {
  stats.filesProcessed++

  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Pattern: import { createServerClient } from '@/lib/supabase'
    const pattern = /import\s*{\s*createServerClient\s*}\s*from\s*['"]@\/lib\/supabase['"]/g

    if (pattern.test(content)) {
      const newContent = content.replace(
        /import\s*{\s*createServerClient\s*}\s*from\s*['"]@\/lib\/supabase['"]/g,
        "import { createServerClient } from '@/lib/supabase/server'"
      )

      stats.filesModified++
      stats.importsFixed++

      const relativePath = path.relative(SRC_DIR, filePath)
      console.log(`✓ Fixed: ${relativePath}`)

      await fs.writeFile(filePath, newContent, 'utf-8')
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message)
  }
}

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

async function main() {
  console.log('🔍 Finding files with createServerClient imports...\n')

  const files = await findTypeScriptFiles(SRC_DIR)

  console.log('🔄 Processing files...\n')

  for (const file of files) {
    await processFile(file)
  }

  console.log('\n📊 Summary:')
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files modified: ${stats.filesModified}`)
  console.log(`   Imports fixed: ${stats.importsFixed}`)

  if (stats.filesModified > 0) {
    console.log('\n✅ All server imports have been fixed!')
  } else {
    console.log('\n✅ No files needed fixing!')
  }
}

main().catch(console.error)
