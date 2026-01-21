---
description: Comprehensive guide for setting up TypeScript Strict Mode in 2025, covering tsconfig.json, strict flags, path aliases, and module resolution for modern frameworks.
---

# TypeScript Strict Mode Configuration

## 🌟 Purpose
To establish a watertight type-safety baseline for any TypeScript project. Enabling "Strict Mode" is the single most effective way to catch bugs at compile-time. This skill guides you through configuring a "Golden Standard" `tsconfig.json` for modern stacks (Next.js 15, React 19, Vite) and Node.js backends.

## 🛠️ Tools & Capabilities
-   **TypeScript CLI**: `tsc --init`
-   **VS Code**: Intelligent auto-import resolution.
-   **Bundlers**: Integration with Vite and Next.js for path aliases.

## 📋 Instructions

### 1. The "Golden" TSConfig (Modern Web App)
Use this configuration for **Next.js 15**, **React 19 (Vite)**, or any bundler-based project.

```json
{
  "compilerOptions": {
    /* Base Options */
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true, // Windows indispensable
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,

    /* 🛡️ STRICT MODE */
    "strict": true,
    "noUncheckedIndexedAccess": true, // Recommended beyond strict
    "exactOptionalPropertyTypes": true, // Recommended beyond strict
    
    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. The "Golden" TSConfig (Node.js Backend)
Use this for **Supabase Edge Functions** or pure Node.js services.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext", // Critical for modern Node
    "strict": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3. Understanding Key Flags
| Flag | Impact | Why it's non-negotiable in 2025 |
|:--- |:--- |:--- |
| `strict: true` | Enables all strict checks | The baseline for professional development. |
| `noImplicitAny` | Errors if type is inferred as `any` | Prevents "silent" type loss. |
| `strictNullChecks` | `null` != `undefined` != `string` | Prevents "Cannot read property of undefined". |
| `noUncheckedIndexedAccess` | Arrays/Objects access returns `T \| undefined` | Forces you to check if an array item exists before using it. |

## 📝 Rules & Guidelines
-   **Rule 1:** NEVER set `strict: false` to silence errors. Fix the types or use `unknown` with casting.
-   **Rule 2:** Avoid `any`. Use `unknown` if the type is truly dynamic, then use Type Guards.
-   **Rule 3:** For new projects, ALWAYS enable `noUncheckedIndexedAccess`. It allows you to trust that `myArray[0]` might actually be undefined.
-   **Rule 4:** When using `moduleResolution: "bundler"`, do NOT add file extensions in imports (e.g., `import X from './file'`).
-   **Rule 5:** When using `moduleResolution: "NodeNext"`, DO add file extensions (e.g., `import X from './file.js'`).

## 💡 Examples

### Scenario: Fixing "Object is possibly undefined"
**Problem:**
Without `strictNullChecks`, this crashes at runtime. With it, it's a compile error.
```typescript
function getLength(str: string | null) {
  return str.length; // Error: Object is possibly 'null'.
}
```

**Solution:**
```typescript
function getLength(str: string | null) {
  if (!str) return 0; // Type Guard
  return str.length; // OK
}
```

### Scenario: Configuring Vite for Aliases
If `tsconfig.json` has paths, `vite.config.ts` needs `vite-tsconfig-paths`.
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
});
```

## 📂 File Structure
This skill typically results in:
- Modified `tsconfig.json`
- Modified `vite.config.ts` (if applicable)
