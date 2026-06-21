/**
 * One-time bootstrap script — creates the FIRST admin account.
 * After this, all future staff accounts should be created through
 * the Admin panel UI (/admin/staff), which uses /api/staff/create.
 *
 * Why this script exists: the API route requires an existing admin
 * to create new staff, so the very first admin has to be seeded directly.
 *
 * Usage:
 *   1. Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local
 *      (get it from Supabase Dashboard > Settings > API > service_role key)
 *   2. node scripts/create_first_admin.js "0205512345" "Your Name" "yourPassword123"
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const [, , phoneArg, nameArg, passwordArg] = process.argv

if (!phoneArg || !nameArg || !passwordArg) {
  console.error('Usage: node scripts/create_first_admin.js "<phone>" "<name>" "<password>"')
  console.error('Example: node scripts/create_first_admin.js "0205512345" "Somchai" "MySecurePass123"')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

function normalizePhone(raw) {
  return raw.replace(/[\s\-\(\)]/g, '').trim()
}

async function main() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const phone = normalizePhone(phoneArg)
  const fakeEmail = `${phone}@test.com`

  console.log(`Creating admin account for ${phone} (${nameArg})...`)

  // 1. Create the Supabase Auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: fakeEmail,
    password: passwordArg,
    email_confirm: true,
  })

  if (authError) {
    console.error('Failed to create auth user:', authError.message)
    process.exit(1)
  }

  console.log('Auth user created:', authUser.user.id)

  // 2. Insert the staff row
  const { data: staffRow, error: staffError } = await admin
    .from('staff')
    .insert({
      phone,
      auth_user_id: authUser.user.id,
      name: nameArg,
      role: 'admin',
      is_active: true,
      created_by: null, // bootstrap — no creator
    })
    .select()
    .single()

  if (staffError) {
    console.error('Failed to create staff row:', staffError.message)
    console.error('Rolling back auth user...')
    await admin.auth.admin.deleteUser(authUser.user.id)
    process.exit(1)
  }

  console.log('\n✅ First admin account created successfully!')
  console.log('─────────────────────────────────────')
  console.log(`Phone:    ${phone}`)
  console.log(`Password: ${passwordArg}`)
  console.log(`Role:     admin`)
  console.log('─────────────────────────────────────')
  console.log('You can now log in at /staff/login and access /admin/staff to create more accounts.')
}

main()
