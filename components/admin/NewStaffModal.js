'use client'
// components/admin/NewStaffModal.js
import { useState } from 'react'

const ROLES = [
  { value: 'kitchen', lo: 'ຄົວ', en: 'Kitchen' },
  { value: 'cashier', lo: 'ການເງິນ', en: 'Cashier' },
  { value: 'admin', lo: 'ແອັດມິນ', en: 'Admin' },
]

export default function NewStaffModal({ lang, onClose, onCreated }) {
  const t = (lo, en) => lang === 'lo' ? lo : en

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('kitchen')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('ເກີດຂໍ້ຜິດພາດ', 'Something went wrong'))
        setLoading(false)
        return
      }

      onCreated({ phone: data.staff.phone, tempPassword: data.tempPassword })
    } catch (err) {
      console.error(err)
      setError(t('ເກີດຂໍ້ຜິດພາດ. ລອງໃໝ່.', 'Something went wrong. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-plate rounded-t-3xl sm:rounded-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-base">{t('ເພີ່ມພະນັກງານໃໝ່', 'Add New Staff')}</h3>
          <button onClick={onClose} className="text-ash hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-ash text-xs block mb-1.5">{t('ຊື່', 'Name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-neutral-800 border border-rim rounded-xl px-4 py-3 text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
            />
          </div>

          <div>
            <label className="text-ash text-xs block mb-1.5">{t('ເບີໂທລະສັບ', 'Phone Number')}</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="020 5512 345"
              required
              className="w-full bg-neutral-800 border border-rim rounded-xl px-4 py-3 text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
            />
          </div>

          <div>
            <label className="text-ash text-xs block mb-1.5">{t('ບົດບາດ', 'Role')}</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    role === r.value
                      ? 'bg-ember text-white'
                      : 'surface text-ash hover:text-white'
                  }`}
                >
                  {t(r.lo, r.en)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ember hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? '...' : t('ສ້າງບັນຊີ', 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  )
}
