'use client'
// components/cashier/TableTransferModal.js
import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

const MODES = {
  relocate: {
    lo: { title: 'ຍ້າຍໂຕະ', desc: 'ຍ້າຍລູກຄ້າໄປໂຕະອື່ນ (ໂຕະຕ້ອງວ່າງ)', action: 'ຍ້າຍໄປໂຕະ' },
    en: { title: 'Move Table', desc: 'Relocate customers to a different (vacant) table', action: 'Move to Table' },
  },
  merge: {
    lo: { title: 'ລວມບິນ', desc: 'ລວມບິນກັບໂຕະທີ່ມີລູກຄ້າຢູ່ແລ້ວ (ສຳລັບໝູ່ທີ່ຈະຈ່າຍນຳກັນ)', action: 'ລວມເຂົ້າກັບໂຕະ' },
    en: { title: 'Merge Bills', desc: 'Combine bills with another occupied table (for groups paying together)', action: 'Merge into Table' },
  },
}

// Known Postgres RAISE EXCEPTION messages from the transfer/merge SQL functions,
// translated for display since Postgres always returns the raw English text.
const KNOWN_ERRORS = {
  'Not authorized to merge tables': { lo: 'ທ່ານບໍ່ມີສິດລວມໂຕະ', en: 'You are not authorized to merge tables' },
  'Not authorized to relocate tables': { lo: 'ທ່ານບໍ່ມີສິດຍ້າຍໂຕະ', en: 'You are not authorized to relocate tables' },
  'Source table has no active session': { lo: 'ໂຕະນີ້ບໍ່ມີລູກຄ້າຢູ່', en: 'This table has no active session' },
  'Target table has no active session to merge into': { lo: 'ໂຕະປາຍທາງບໍ່ມີລູກຄ້າຢູ່', en: 'Target table has no active session' },
  'Target table is not vacant — use merge instead': { lo: 'ໂຕະປາຍທາງບໍ່ວ່າງ — ກະລຸນາໃຊ້ "ລວມບິນ" ແທນ', en: 'Target table is occupied — use Merge instead' },
}

function translateRpcError(message, lang) {
  const known = KNOWN_ERRORS[message]
  if (known) return known[lang]
  return message // fallback: show raw message rather than hiding the error entirely
}

export default function TableTransferModal({ sourceTable, allTables, lang, onClose, onSuccess }) {
  const [mode, setMode] = useState('relocate') // 'relocate' | 'merge'
  const [targetTableNumber, setTargetTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = (lo, en) => lang === 'lo' ? lo : en

  // Relocate only allows vacant tables as targets; merge only allows other active tables
  const eligibleTargets = allTables.filter(tbl => {
    if (tbl.id === sourceTable.id) return false
    return mode === 'relocate' ? tbl.status === 'vacant' : tbl.status === 'active'
  })

  const handleSubmit = async () => {
    if (!targetTableNumber) return
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabase()
      const fnName = mode === 'relocate' ? 'relocate_table_session' : 'merge_table_session'

      const { error: rpcError } = await supabase.rpc(fnName, {
        p_source_table_number: sourceTable.table_number,
        p_target_table_number: targetTableNumber,
      })

      if (rpcError) {
        setError(translateRpcError(rpcError.message, lang))
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err) {
      console.error(err)
      setError(t('ເກີດຂໍ້ຜິດພາດ. ລອງໃໝ່.', 'Something went wrong. Please try again.'))
      setLoading(false)
    }
  }

  const copy = MODES[mode][lang]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-plate rounded-t-3xl sm:rounded-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-base">
            {t('ໂຕະ', 'Table')} {sourceTable.table_number}
          </h3>
          <button onClick={onClose} className="text-ash hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
            ×
          </button>
        </div>
        <p className="text-ash text-xs mb-5">
          {t('ເລືອກການດຳເນີນການ', 'Choose an action')}
        </p>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {Object.keys(MODES).map(key => (
            <button
              key={key}
              onClick={() => { setMode(key); setTargetTableNumber('') }}
              className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                mode === key ? 'bg-ember text-white' : 'surface text-ash hover:text-white'
              }`}
            >
              {MODES[key][lang].title}
            </button>
          ))}
        </div>

        <p className="text-ash text-xs mb-4 leading-relaxed">
          {copy.desc}
        </p>

        {/* Target table picker */}
        <div className="mb-5">
          <label className="text-ash text-xs block mb-2">
            {mode === 'relocate' ? t('ໂຕະທີ່ວ່າງ', 'Vacant Tables') : t('ໂຕະທີ່ໃຊ້ຢູ່', 'Active Tables')}
          </label>

          {eligibleTargets.length === 0 ? (
            <div className="surface rounded-xl p-4 text-center text-ash text-sm">
              {mode === 'relocate'
                ? t('ບໍ່ມີໂຕະວ່າງ', 'No vacant tables available')
                : t('ບໍ່ມີໂຕະອື່ນທີ່ໃຊ້ຢູ່', 'No other active tables available')}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {eligibleTargets.map(tbl => (
                <button
                  key={tbl.id}
                  onClick={() => setTargetTableNumber(tbl.table_number)}
                  className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                    targetTableNumber === tbl.table_number
                      ? 'bg-ember text-white'
                      : 'surface text-white hover:border-ember'
                  }`}
                >
                  {tbl.table_number}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={!targetTableNumber || loading}
          className="w-full bg-ember hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {loading
            ? '...'
            : targetTableNumber
              ? `${copy.action} ${targetTableNumber}`
              : copy.action}
        </button>
      </div>
    </div>
  )
}
