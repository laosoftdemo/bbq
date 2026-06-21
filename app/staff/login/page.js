// app/staff/login/page.js
import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = { title: 'Staff Login – Sindat BBQ' }

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
