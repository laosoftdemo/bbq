'use client'
// components/admin/ExchangeRatesManagement.js
import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import StaffNav from '@/components/shared/StaffNav'
import { formatKipCompact } from '@/lib/format'

const COMMON_CURRENCIES = [
  { code: 'THB', lo: 'ບາດໄທ', en: 'Thai Baht' },
  { code: 'USD', lo: 'ໂດລາສະຫະລັດ', en: 'US Dollar' },
  { code: 'CNY', lo: 'ຢວນຈີນ', en: 'Chinese Yuan' },
  { code: 'VND', lo: 'ດົງຫວຽດນາມ', en: 'Vietnamese Dong' },
]

export default function ExchangeRatesManagement() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('lo')
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(null)

  const t = (lo, en) => lang === 'lo' ? lo : en

  const fetchRates = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('currency_code')
    setRates(data || [])
    const initial = {}
    ;(data || []).forEach(r => { initial[r.currency_code] = r.rate_to_kip })
    setEditValues(initial)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const saveRate = async (currencyCode) => {
    const newRate = parseFloat(editValues[currencyCode])
    if (!newRate || newRate <= 0) {
      alert(t('ກະລຸນາປ້ອນອັດຕາແລກປ່ຽນທີ່ຖືກຕ້ອງ', 'Please enter a valid rate'))
      return
    }

    setSaving(currencyCode)
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const existing = rates.find(r => r.currency_code === currencyCode)

    if (existing) {
      await supabase
        .from('exchange_rates')
        .update({ rate_to_kip: newRate, updated_at: new Date().toISOString(), updated_by: staffRecord?.id })
        .eq('currency_code', currencyCode)
    } else {
      await supabase
        .from('exchange_rates')
        .insert({ currency_code: currencyCode, rate_to_kip: newRate, updated_by: staffRecord?.id })
    }

    setSaving(null)
    fetchRates()
  }

  return (
    <div className="min-h-screen bg-coal flex flex-col">
      <StaffNav title={t('ອັດຕາແລກປ່ຽນ', 'Exchange Rates')} lang={lang} onToggleLang={() => setLang(l => l === 'lo' ? 'en' : 'lo')} />

      <div className="flex-1 p-4 max-w-xl mx-auto w-full">
        <div className="mb-5">
          <h1 className="text-white font-bold text-lg">{t('ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ', 'Set Exchange Rates')}</h1>
          <p className="text-ash text-sm mt-1">
            {t('ກີບ (LAK) ຕໍ່ 1 ໜ່ວຍສະກຸນເງິນຕ່າງປະເທດ', 'Kip (LAK) per 1 unit of foreign currency')}
          </p>
        </div>

        {loading ? (
          <div className="text-ash text-center py-12">{t('ກຳລັງໂຫລດ...', 'Loading...')}</div>
        ) : (
          <div className="space-y-3">
            {COMMON_CURRENCIES.map(currency => {
              const existing = rates.find(r => r.currency_code === currency.code)
              const value = editValues[currency.code] ?? ''
              const isDirty = existing && parseFloat(value) !== existing.rate_to_kip

              return (
                <div key={currency.code} className="surface rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {currency.code} — {t(currency.lo, currency.en)}
                      </div>
                      {existing && (
                        <div className="text-ash text-xs mt-0.5">
                          {t('ປະຈຸບັນ', 'Current')}: 1 {currency.code} = {formatKipCompact(existing.rate_to_kip)} {t('ກີບ', 'Kip')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={value}
                        onChange={e => setEditValues(prev => ({ ...prev, [currency.code]: e.target.value }))}
                        placeholder={t('ອັດຕາແລກປ່ຽນ', 'Exchange rate')}
                        className="w-full bg-neutral-800 border border-rim rounded-xl px-4 py-2.5 text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => saveRate(currency.code)}
                      disabled={saving === currency.code || !isDirty && existing}
                      className="bg-ember hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {saving === currency.code ? '...' : t('ບັນທຶກ', 'Save')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 text-ash text-xs leading-relaxed">
          {t(
            'ໝາຍເຫດ: ອັດຕາແລກປ່ຽນເຫຼົ່ານີ້ສະຫງວນໄວ້ສຳລັບການນຳໃຊ້ໃນອະນາຄົດ — ປະຈຸບັນລະບົບຮັບເງິນເປັນກີບເທົ່ານັ້ນ.',
            'Note: these rates are stored for future use — cash payments currently only accept Kip directly.'
          )}
        </div>
      </div>
    </div>
  )
}
