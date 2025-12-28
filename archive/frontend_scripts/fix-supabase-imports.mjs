/**
 * Fix Supabase Import Statements
 *
 * This script updates all Supabase import statements to use the new standardized paths:
 * - Browser: import { createBrowserClient } from '@/lib/supabase'
 * - Server: import { createServerClient } from '@/lib/supabase'
 * - Admin: import { createAdminClient } from '@/lib/supabase'
 * - Types: import type { Database } from '@/lib/supabase'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const DRY_RUN = process.argv.includes('--dry-run');

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsFixed: 0,
  errors: 0
};

/**
 * Get all TypeScript/TSX files recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Fix imports in a single file
 */
function fixFileImports(filePath) {
  stats.filesProcessed++;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;

  // Pattern 1: Fix old supabase-client imports
  if (content.includes('@/lib/supabase-client')) {
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/supabase-client['"]/g,
      (match, imports) => {
        stats.importsFixed++;
        modified = true;
        // Check if it's importing 'supabase' singleton (old pattern)
        if (imports.trim() === 'supabase') {
          return `import { createBrowserClient } from '@/lib/supabase'\n\nconst supabase = createBrowserClient()`;
        }
        return `import {${imports}} from '@/lib/supabase'`;
      }
    );
  }

  // Pattern 2: Fix client-fixed imports
  if (content.includes('supabase/client-fixed')) {
    content = content.replace(
      /import\s+{([^}]+)}\s+from\s+['"]@?\/lib\/supabase\/client-fixed['"]/g,
      (match, imports) => {
        stats.importsFixed++;
        modified = true;
        // Check if it's importing 'supabase' singleton (old pattern)
        if (imports.includes('supabase')) {
          return `import { createBrowserClient } from '@/lib/supabase'\n\nconst supabase = createBrowserClient()`;
        }
        return `import {${imports}} from '@/lib/supabase'`;
      }
    );
  }

  // Pattern 3: Fix relative imports to supabase/client or supabase/server
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"](\.\.\/)+(lib\/)?supabase\/(client|server)['"]/g,
    (match, imports, dots, lib, type) => {
      stats.importsFixed++;
      modified = true;
      return `import {${imports}} from '@/lib/supabase'`;
    }
  );

  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]\.\/supabase\/(client|server)['"]/g,
    (match, imports, type) => {
      stats.importsFixed++;
      modified = true;
      return `import {${imports}} from '@/lib/supabase'`;
    }
  );

  // Pattern 4: Fix old './supabase' relative imports (the deleted re-export file)
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]\.\/supabase['"]/g,
    (match, imports) => {
      stats.importsFixed++;
      modified = true;
      // Check if it's importing 'supabase' singleton
      if (imports.trim() === 'supabase') {
        return `import { createBrowserClient } from '@/lib/supabase'\n\nconst supabase = createBrowserClient()`;
      }
      return `import {${imports}} from '@/lib/supabase'`;
    }
  );

  // Pattern 5: Fix direct supabase/client or supabase/server imports to use barrel export
  content = content.replace(
    /import\s+(type\s+)?{([^}]+)}\s+from\s+['"]@\/lib\/supabase\/(client|server)['"]/g,
    (match, typeKeyword, imports, source) => {
      stats.importsFixed++;
      modified = true;
      const typePrefix = typeKeyword || '';
      return `import ${typePrefix}{${imports}} from '@/lib/supabase'`;
    }
  );

  // Pattern 6: Fix singleton supabase instances from client.ts
  // Find: import { supabase } from '@/lib/supabase/client'
  // Replace with: const supabase = createBrowserClient()
  if (content.match(/import\s+{\s*supabase\s*}\s+from\s+['"]@\/lib\/supabase\/client['"]/)) {
    content = content.replace(
      /import\s+{\s*supabase\s*}\s+from\s+['"]@\/lib\/supabase\/client['"]/g,
      () => {
        stats.importsFixed++;
        modified = true;
        // Check if createBrowserClient is already imported
        if (!content.includes('createBrowserClient')) {
          return `import { createBrowserClient } from '@/lib/supabase'\n\nconst supabase = createBrowserClient()`;
        } else {
          return `const supabase = createBrowserClient()`;
        }
      }
    );
  }

  // Save if modified
  if (modified && content !== originalContent) {
    stats.filesModified++;

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${path.relative(SRC_DIR, filePath)}`);
    } else {
      console.log(`[DRY RUN] Would fix: ${path.relative(SRC_DIR, filePath)}`);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Finding all TypeScript files...\n');

  const files = getAllFiles(SRC_DIR);
  console.log(`Found ${files.length} TypeScript files\n`);

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No files will be modified\n');
  }

  console.log('📝 Processing files...\n');

  files.forEach(file => {
    try {
      fixFileImports(file);
    } catch (error) {
      stats.errors++;
      console.error(`❌ Error processing ${path.relative(SRC_DIR, file)}:`, error.message);
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Imports fixed: ${stats.importsFixed}`);
  console.log(`Errors: ${stats.errors}`);

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Done! All imports have been updated.');
  }
}

// Run the script
main();
