/**
 * Polyfills for Server-Side Rendering (SSR)
 *
 * This file provides polyfills for browser globals that may be accessed
 * by third-party libraries during server-side rendering.
 */

// Polyfill 'self' global for Node.js environment
// Some bundled libraries (like webpack chunks) expect 'self' to exist
if (typeof globalThis !== 'undefined' && typeof self === 'undefined') {
  ;(globalThis as any).self = globalThis
}

// Export empty object to make this a valid module
export {}
