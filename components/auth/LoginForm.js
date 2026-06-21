'use client'
// components/auth/LoginForm.js
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { normalizePhone, phoneToFakeEmail } from '@/lib/phoneAuth'

const ERROR_MESSAGES = {
  inactive: { lo: 'ບັນຊີຂອງທ່ານຖືກປິດໃຊ້ງານ', en: 'Your account has been deactivated' },
  forbidden: { lo: 'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້', en: 'You don\'t have access to this page' },
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/staff/kitchen'
  const urlError = searchParams.get('error')

  const [lang, setLang] = useState('lo')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = (lo, en) => lang === 'lo' ? lo : en

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalized = normalizePhone(phone)
      const fakeEmail = phoneToFakeEmail(normalized)
      const supabase = getSupabase()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (signInError) {
        setError(t('ເບີໂທ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ', 'Incorrect phone number or password'))
        setLoading(false)
        return
      }

      // Verify staff record exists and is active before redirecting
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('role, is_active')
        .eq('auth_user_id', data.user.id)
        .single()

      if (!staffRecord || !staffRecord.is_active) {
        await supabase.auth.signOut()
        setError(t('ບັນຊີຂອງທ່ານຖືກປິດໃຊ້ງານ', 'Your account has been deactivated'))
        setLoading(false)
        return
      }

      // If the user landed here via a specific protected-route redirect, honor that.
      // Otherwise, send them to the page that matches their role.
      const hasExplicitRedirect = searchParams.get('redirect')
      let destination = redirectTo
      if (!hasExplicitRedirect) {
        if (staffRecord.role === 'admin') destination = '/admin/staff'
        else if (staffRecord.role === 'cashier') destination = '/staff/cashier'
        else destination = '/staff/kitchen'
      }

      router.push(destination)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(t('ເກີດຂໍ້ຜິດພາດ. ລອງໃໝ່.', 'Something went wrong. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-coal flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-2xl font-bold text-white">ຊິ້ນດາດ</h1>
          <p className="text-ash text-sm mt-1">{t('ເຂົ້າສູ່ລະບົບພະນັກງານ', 'Staff Login')}</p>
        </div>

        {/* Error from redirect (e.g. inactive account, forbidden route) */}
        {urlError && ERROR_MESSAGES[urlError] && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            {t(ERROR_MESSAGES[urlError].lo, ERROR_MESSAGES[urlError].en)}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="surface rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-ash text-xs block mb-1.5">
              {t('ເບີໂທລະສັບ', 'Phone Number')}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="020 5512 345"
              required
              autoFocus
              className="w-full bg-neutral-800 border border-rim rounded-xl px-4 py-3 text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
            />
          </div>

          <div>
            <label className="text-ash text-xs block mb-1.5">
              {t('ລະຫັດຜ່ານ', 'Password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-rim rounded-xl px-4 py-3 text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ember hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? '...' : t('ເຂົ້າສູ່ລະບົບ', 'Log In')}
          </button>
        </form>

        {/* Lang toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLang(l => l === 'lo' ? 'en' : 'lo')}
            className="text-ash text-xs hover:text-white transition-colors"
          >
            <span className={lang === 'lo' ? 'text-ember' : ''}>ລາວ</span>
            {' / '}
            <span className={lang === 'en' ? 'text-ember' : ''}>English</span>
          </button>
        </div>
      </div>
    </div>
  )
}
