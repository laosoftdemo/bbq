// lib/supabase-admin.js
// SERVER-SIDE ONLY. Never import this in a Client Component or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — it bypasses all RLS policies.
import { createClient } from '@supabase/supabase-js'

let _adminClient = null

export function getSupabaseAdmin() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server-side only, ' +
        'get it from Supabase Dashboard > Settings > API > service_role key).'
      )
    }

    _adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _adminClient
}
