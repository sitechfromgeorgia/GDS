#!/usr/bin/env node

/**
 * Fix createServerClient calls to add await
 *
 * Changes:
 * - const supabase = createServerClient()
 * → const supabase = await createServerClient()
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
  callsFixed: 0,
}

async function processFile(filePath) {
  stats.filesProcessed++

  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Pattern: = createServerClient() without await
    const pattern = /(\s+)(const\s+\w+\s*=\s*)createServerClient\(\)/g

    if (pattern.test(content)) {
      const newContent = content.replace(
        /(\s+)(const\s+\w+\s*=\s*)createServerClient\(\)/g,
        '$1$2await createServerClient()'
      )

      stats.filesModified++
      const matches = content.match(pattern)
      stats.callsFixed += matches ? matches.length : 0

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
  console.log('🔍 Finding files with non-awaited createServerClient calls...\\n')

  const files = await findTypeScriptFiles(SRC_DIR)

  console.log('🔄 Processing files...\\n')

  for (const file of files) {
    await processFile(file)
  }

  console.log('\\n📊 Summary:')
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files modified: ${stats.filesModified}`)
  console.log(`   Calls fixed: ${stats.callsFixed}`)

  if (stats.filesModified > 0) {
    console.log('\\n✅ All createServerClient calls have been fixed!')
  } else {
    console.log('\\n✅ No files needed fixing!')
  }
}

main().catch(console.error)
