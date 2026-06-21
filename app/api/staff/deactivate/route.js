// app/api/staff/deactivate/route.js
// Admin-only endpoint to deactivate (or reactivate) a staff account.
// Soft-delete by design — keeps order history attribution intact.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* no-op */ },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: callerStaff } = await supabase
      .from('staff')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (!callerStaff || callerStaff.role !== 'admin' || !callerStaff.is_active) {
      return NextResponse.json({ error: 'Only admins can manage staff accounts' }, { status: 403 })
    }

    const { staffId, isActive } = await request.json()
    if (!staffId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'staffId and isActive are required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: updated, error: updateError } = await admin
      .from('staff')
      .update({ is_active: isActive })
      .eq('id', staffId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ staff: updated })
  } catch (err) {
    console.error('Staff deactivation failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
