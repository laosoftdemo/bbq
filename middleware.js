// middleware.js
// Guards /staff/* routes — requires login AND the correct role for each section.
// Runs on the Edge before any page component renders.
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROUTE_ROLES = {
  '/staff/kitchen': ['kitchen', 'admin'],
  '/staff/cashier': ['cashier', 'admin'],
  '/admin': ['admin'],
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Only guard staff/admin routes — customer menu and login page stay open
  const matchedPrefix = Object.keys(ROUTE_ROLES).find(prefix => pathname.startsWith(prefix))
  if (!matchedPrefix) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/staff/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Look up the staff record to check role + active status
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('role, is_active')
    .eq('auth_user_id', user.id)
    .single()

  if (!staffRecord || !staffRecord.is_active) {
    const loginUrl = new URL('/staff/login', request.url)
    loginUrl.searchParams.set('error', 'inactive')
    return NextResponse.redirect(loginUrl)
  }

  const allowedRoles = ROUTE_ROLES[matchedPrefix]
  if (!allowedRoles.includes(staffRecord.role)) {
    const deniedUrl = new URL('/staff/login', request.url)
    deniedUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(deniedUrl)
  }

  return response
}

export const config = {
  matcher: ['/staff/:path*', '/admin/:path*'],
}
