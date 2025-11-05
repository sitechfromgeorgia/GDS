// Re-export the browser client factory function
// Note: This follows the factory pattern - no singleton export
export { createBrowserClient } from './supabase/client'

// Re-export types for use in components
export type { Database } from './supabase/client'
