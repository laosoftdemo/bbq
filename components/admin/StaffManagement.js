'use client'
// components/admin/StaffManagement.js
import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import StaffNav from '@/components/shared/StaffNav'
import NewStaffModal from './NewStaffModal'

const ROLE_LABELS = {
  kitchen: { lo: 'ຄົວ', en: 'Kitchen', color: 'badge-preparing' },
  cashier: { lo: 'ການເງິນ', en: 'Cashier', color: 'badge-pending' },
  admin:   { lo: 'ແອັດມິນ', en: 'Admin', color: 'badge-served' },
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [lang, setLang] = useState('lo')
  const [createdCreds, setCreatedCreds] = useState(null) // { phone, tempPassword } shown once

  const t = (lo, en) => lang === 'lo' ? lo : en

  const fetchStaff = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })
    setStaffList(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const toggleActive = async (member) => {
    const action = member.is_active
      ? t('ປິດໃຊ້ງານບັນຊີນີ້?', 'Deactivate this account?')
      : t('ເປີດໃຊ້ງານບັນຊີນີ້ຄືນ?', 'Reactivate this account?')
    if (!confirm(action)) return

    const res = await fetch('/api/staff/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: member.id, isActive: !member.is_active }),
    })

    if (res.ok) {
      fetchStaff()
    } else {
      const { error } = await res.json()
      alert(error || t('ເກີດຂໍ້ຜິດພາດ', 'Something went wrong'))
    }
  }

  return (
    <div className="min-h-screen bg-coal flex flex-col">
      <StaffNav title={t('ຈັດການພະນັກງານ', 'Staff Management')} lang={lang} onToggleLang={() => setLang(l => l === 'lo' ? 'en' : 'lo')} />

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {/* Header + add button */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white font-bold text-lg">{t('ບັນຊີພະນັກງານ', 'Staff Accounts')}</h1>
            <p className="text-ash text-sm">{staffList.length} {t('ບັນຊີ', 'accounts')}</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-ember hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>{t('ເພີ່ມພະນັກງານ', 'Add Staff')}</span>
          </button>
        </div>

        {/* Staff list */}
        {loading ? (
          <div className="text-ash text-center py-12">{t('ກຳລັງໂຫລດ...', 'Loading...')}</div>
        ) : (
          <div className="space-y-2">
            {staffList.map(member => (
              <div key={member.id} className="surface rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    member.is_active ? 'bg-ember/20 text-ember' : 'bg-neutral-700 text-ash'
                  }`}>
                    {member.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{member.name}</div>
                    <div className="text-ash text-xs">{member.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_LABELS[member.role]?.color}`}>
                    {t(ROLE_LABELS[member.role]?.lo, ROLE_LABELS[member.role]?.en)}
                  </span>
                  <button
                    onClick={() => toggleActive(member)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      member.is_active
                        ? 'surface text-ash hover:text-red-400 hover:border-red-500'
                        : 'bg-jade/15 text-jade hover:bg-jade/25'
                    }`}
                  >
                    {member.is_active ? t('ປິດໃຊ້ງານ', 'Deactivate') : t('ເປີດໃຊ້ງານ', 'Activate')}
                  </button>
                </div>
              </div>
            ))}

            {staffList.length === 0 && (
              <div className="text-center py-12 text-ash">
                {t('ຍັງບໍ່ມີພະນັກງານ', 'No staff accounts yet')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New staff modal */}
      {showNewModal && (
        <NewStaffModal
          lang={lang}
          onClose={() => setShowNewModal(false)}
          onCreated={(creds) => {
            setShowNewModal(false)
            setCreatedCreds(creds)
            fetchStaff()
          }}
        />
      )}

      {/* Show temp password ONCE after creation */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setCreatedCreds(null)}>
          <div className="surface rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-white font-bold">{t('ສ້າງບັນຊີສຳເລັດ', 'Account Created')}</h3>
              <p className="text-ash text-xs mt-1">
                {t('ບອກຂໍ້ມູນນີ້ໃຫ້ພະນັກງານ — ຈະບໍ່ສະແດງອີກ', 'Share these credentials with the staff member — shown only once')}
              </p>
            </div>
            <div className="bg-neutral-800 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-ash">{t('ເບີໂທ', 'Phone')}</span>
                <span className="text-white font-mono">{createdCreds.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ash">{t('ລະຫັດຜ່ານ', 'Password')}</span>
                <span className="text-ember font-mono font-bold">{createdCreds.tempPassword}</span>
              </div>
            </div>
            <button
              onClick={() => setCreatedCreds(null)}
              className="w-full bg-ember hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {t('ປິດ', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
