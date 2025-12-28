/**
 * Edge Runtime Compatible Logger
 *
 * Simple console-based logger that works in Edge Runtime environments.
 * Edge Runtime has strict Content Security Policy that disallows dynamic
 * code generation, so this logger uses only static console methods.
 *
 * Use this logger in:
 * - middleware.ts (Edge Runtime)
 * - Edge API routes
 * - Any code that runs in Edge Runtime
 *
 * For Node.js runtime code, continue using the full-featured logger
 * from @/lib/logger
 */

export const edgeLogger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
}
