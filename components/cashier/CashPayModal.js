'use client'
// components/cashier/CashPayModal.js
import { useState } from 'react'
import { formatKip, formatKipCompact } from '@/lib/format'

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000]

export default function CashPayModal({ total, lang, onClose, onConfirm, submitting }) {
  const [received, setReceived] = useState('')
  const t = (lo, en) => lang === 'lo' ? lo : en

  const receivedNum = parseFloat(received.replace(/,/g, '')) || 0
  const change = receivedNum - total
  const isEnough = receivedNum >= total

  const appendDigit = (digit) => {
    setReceived(prev => prev + digit)
  }

  const clear = () => setReceived('')
  const backspace = () => setReceived(prev => prev.slice(0, -1))

  const setQuickAmount = (amt) => {
    setReceived(String(amt))
  }

  const setExact = () => {
    setReceived(String(Math.round(total)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-plate rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-jade/15 px-5 py-4 flex items-center justify-between border-b border-rim">
          <div>
            <h3 className="text-white font-bold text-base">💵 {t('ຮັບເງິນສົດ', 'Receive Cash')}</h3>
            <p className="text-ash text-xs">{t('ລວມທັງໝົດ', 'Total Due')}: {formatKip(total)}</p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
            ×
          </button>
        </div>

        <div className="p-5">
          {/* Amount received display */}
          <div className="mb-4">
            <label className="text-ash text-xs block mb-1.5">
              {t('ຈຳນວນເງິນທີ່ໄດ້ຮັບ', 'Amount Received')}
            </label>
            <div className="bg-neutral-800 border border-rim rounded-xl px-4 py-3 text-right">
              <span className="text-white font-black text-2xl">
                {received ? formatKipCompact(receivedNum) : '0'}
              </span>
              <span className="text-ash text-sm ml-2">{t('ກີບ', 'Kip')}</span>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setQuickAmount(amt)}
                className="surface hover:border-jade text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                {formatKipCompact(amt)}
              </button>
            ))}
          </div>
          <button
            onClick={setExact}
            className="w-full surface hover:border-jade text-jade text-xs font-semibold py-2 rounded-lg transition-colors mb-4"
          >
            {t('ຈຳນວນພໍດີ', 'Exact Amount')} ({formatKipCompact(total)})
          </button>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1','2','3','4','5','6','7','8','9'].map(d => (
              <button
                key={d}
                onClick={() => appendDigit(d)}
                className="surface hover:bg-neutral-700 text-white font-bold text-lg py-3.5 rounded-xl transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => appendDigit('000')}
              className="surface hover:bg-neutral-700 text-white font-bold text-lg py-3.5 rounded-xl transition-colors"
            >
              000
            </button>
            <button
              onClick={() => appendDigit('0')}
              className="surface hover:bg-neutral-700 text-white font-bold text-lg py-3.5 rounded-xl transition-colors"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="surface hover:bg-red-500/20 hover:text-red-400 text-white font-bold text-lg py-3.5 rounded-xl transition-colors"
            >
              ⌫
            </button>
          </div>

          {/* Change due */}
          <div className={`rounded-xl p-4 mb-4 text-center transition-colors ${
            !received ? 'bg-neutral-800' : isEnough ? 'bg-jade/15 border border-jade/30' : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {!received ? (
              <span className="text-ash text-sm">{t('ປ້ອນຈຳນວນເງິນ', 'Enter amount received')}</span>
            ) : isEnough ? (
              <>
                <div className="text-ash text-xs mb-1">{t('ເງິນທອນ', 'Change Due')}</div>
                <div className="text-jade font-black text-2xl">{formatKip(change)}</div>
              </>
            ) : (
              <>
                <div className="text-red-400 text-xs mb-1">{t('ເງິນບໍ່ພໍ', 'Insufficient Amount')}</div>
                <div className="text-red-400 font-black text-lg">{formatKip(Math.abs(change))} {t('ຍັງຂາດ', 'short')}</div>
              </>
            )}
          </div>

          {/* Confirm */}
          <button
            onClick={() => onConfirm({ received: receivedNum, change: isEnough ? change : 0 })}
            disabled={!isEnough || submitting}
            className="w-full bg-jade hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
          >
            {submitting ? '...' : `✓ ${t('ຢືນຢັນການຈ່າຍ', 'Confirm Payment')}`}
          </button>
        </div>
      </div>
    </div>
  )
}
