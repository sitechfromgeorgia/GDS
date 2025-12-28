#!/usr/bin/env node

/**
 * Fix Server Actions Supabase Usage
 *
 * Adds `const supabase = await createServerClient()` at the beginning of each function
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FILE_PATH = path.join(__dirname, '..', 'src', 'app', 'orders', 'actions.ts')

async function fixFile() {
  try {
    let content = await fs.readFile(FILE_PATH, 'utf-8')

    // Pattern: Find each function and add supabase client creation after try {
    // Functions: createOrder, updateOrderStatus, assignOrderToDriver, setOrderPricing, cancelOrder

    const functions = [
      'createOrder',
      'updateOrderStatus',
      'assignOrderToDriver',
      'setOrderPricing',
      'cancelOrder'
    ]

    for (const funcName of functions) {
      // Find the function and add supabase creation after try {
      const pattern = new RegExp(
        `(export async function ${funcName}\\([^)]*\\)\\s*{\\s*try\\s*{)`,
        'g'
      )

      content = content.replace(pattern, `$1\n    const supabase = await createServerClient()`)
    }

    await fs.writeFile(FILE_PATH, content, 'utf-8')
    console.log('✅ Fixed actions.ts - added supabase client creation to all functions')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixFile()
