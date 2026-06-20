'use client'
// components/menu/AddItemModal.js
import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { useCart } from '@/hooks/useCart'
import { formatKip } from '@/lib/format'

export default function AddItemModal({ item, onClose }) {
  const { lang, t } = useLang()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const name = lang === 'lo' ? item.name_lo : item.name_en
  const desc = lang === 'lo' ? item.description_lo : item.description_en

  const handleAdd = () => {
    addItem(item, quantity, notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-plate rounded-t-3xl p-5 pb-8 animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-rim rounded-full mx-auto mb-5" />

        {/* Item info */}
        <div className="flex gap-4 mb-5">
          <div className="w-20 h-20 rounded-xl bg-neutral-800 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              item.categories?.icon || '🍖'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base leading-snug">{name}</h3>
            {desc && <p className="text-ash text-xs mt-1 leading-relaxed line-clamp-3">{desc}</p>}
            <div className="text-gold font-bold text-sm mt-2">{formatKip(item.price)}</div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-ash text-xs block mb-1.5">{t('notes')}</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className="w-full bg-neutral-800 border border-rim rounded-xl px-3 py-2.5 text-sm text-white placeholder-ash focus:outline-none focus:border-ember transition-colors"
          />
        </div>

        {/* Quantity & Add */}
        <div className="flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 surface rounded-xl px-1 py-1">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-ash hover:text-white hover:bg-neutral-700 transition-colors text-lg font-bold"
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-ash hover:text-white hover:bg-neutral-700 transition-colors text-lg font-bold"
            >
              +
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            className="flex-1 bg-ember hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>{t('add')} •</span>
            <span>{formatKip(item.price * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
