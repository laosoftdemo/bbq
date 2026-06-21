'use client'
// hooks/useStaffSession.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export function useStaffSession() {
  const router = useRouter()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()

    async function loadStaff() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStaff(null)
        setLoading(false)
        return
      }

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id, name, role, phone, is_active')
        .eq('auth_user_id', user.id)
        .single()

      setStaff(staffRecord || null)
      setLoading(false)
    }

    loadStaff()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      loadStaff()
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  const logout = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/staff/login')
    router.refresh()
  }

  return { staff, loading, logout }
}
