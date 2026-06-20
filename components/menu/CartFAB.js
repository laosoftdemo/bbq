'use client'
// components/menu/CartFAB.js
import { useCart } from '@/hooks/useCart'
import { useLang } from '@/hooks/useLang'
import { formatKip } from '@/lib/format'

export default function CartFAB({ onOpen }) {
  const { totalItems, totalPrice } = useCart()
  const { t } = useLang()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
      <button
        onClick={onOpen}
        className="w-full bg-ember hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-between px-5 transition-colors"
        style={{ boxShadow: '0 8px 32px rgba(249,115,22,0.4)' }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-lg w-7 h-7 flex items-center justify-center text-sm font-black">
            {totalItems}
          </div>
          <span>{t('cart')}</span>
        </div>
        <span className="font-bold">{formatKip(totalPrice)}</span>
      </button>
    </div>
  )
}
