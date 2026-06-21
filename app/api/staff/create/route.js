// app/api/staff/create/route.js
// Admin-only endpoint to create a new staff account.
// Uses the service role key server-side — this is the ONLY place
// that's allowed to happen in the whole app.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { normalizePhone, isValidLaoPhone, phoneToFakeEmail } from '@/lib/phoneAuth'

// Generates a random temporary password for new staff accounts
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 8; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

export async function POST(request) {
  try {
    // ── 1. Verify the caller is an authenticated admin ──
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* no-op in route handler reading-only context */ },
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
      return NextResponse.json({ error: 'Only admins can create staff accounts' }, { status: 403 })
    }

    // ── 2. Validate input ──
    const body = await request.json()
    const { phone: rawPhone, name, role } = body

    if (!rawPhone || !name || !role) {
      return NextResponse.json({ error: 'phone, name, and role are required' }, { status: 400 })
    }
    if (!['kitchen', 'cashier', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const phone = normalizePhone(rawPhone)
    if (!isValidLaoPhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // ── 3. Create the Supabase Auth user (service role required) ──
    const admin = getSupabaseAdmin()
    const fakeEmail = phoneToFakeEmail(phone)
    const tempPassword = generateTempPassword()

    const { data: newAuthUser, error: createAuthError } = await admin.auth.admin.createUser({
      email: fakeEmail,
      password: tempPassword,
      email_confirm: true, // skip email verification — these aren't real inboxes
    })

    if (createAuthError) {
      // Most common case: phone already registered
      return NextResponse.json({ error: createAuthError.message }, { status: 400 })
    }

    // ── 4. Insert the staff row, linked to the new auth user ──
    const { data: newStaff, error: staffInsertError } = await admin
      .from('staff')
      .insert({
        phone,
        auth_user_id: newAuthUser.user.id,
        name,
        role,
        is_active: true,
        created_by: callerStaff.id,
      })
      .select()
      .single()

    if (staffInsertError) {
      // Roll back the auth user so we don't leave an orphaned account
      await admin.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json({ error: staffInsertError.message }, { status: 400 })
    }

    return NextResponse.json({
      staff: newStaff,
      tempPassword, // shown ONCE to the admin so they can hand it to the staff member
    })
  } catch (err) {
    console.error('Staff creation failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
