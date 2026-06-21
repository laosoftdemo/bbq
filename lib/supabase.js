// lib/supabase.js
// Browser client — use in Client Components.
// Uses cookie-based session storage (via @supabase/ssr) so that
// Server Components and middleware can also read the logged-in session.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Singleton for client-side use
let _client = null
export function getSupabase() {
  if (!_client) {
    _client = createClient()
  }
  return _client
}
