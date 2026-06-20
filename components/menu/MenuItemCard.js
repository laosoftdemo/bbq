'use client'
// components/menu/MenuItemCard.js
import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { useCart } from '@/hooks/useCart'
import { formatKip } from '@/lib/format'
import AddItemModal from './AddItemModal'

export default function MenuItemCard({ item }) {
  const { lang } = useLang()
  const { items: cartItems } = useCart()
  const [showModal, setShowModal] = useState(false)

  const name = lang === 'lo' ? item.name_lo : item.name_en
  const desc = lang === 'lo' ? item.description_lo : item.description_en

  // Count how many of this item are already in cart
  const cartQty = cartItems
    .filter(i => i.menuItem.id === item.id)
    .reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="surface rounded-2xl overflow-hidden text-left hover:border-ember transition-colors active:scale-95 transition-transform relative flex flex-col"
      >
        {/* Image / Placeholder */}
        <div className="aspect-square bg-neutral-800 relative overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-neutral-800 to-neutral-900">
              {item.categories?.icon || '🍖'}
            </div>
          )}

          {/* Cart badge */}
          {cartQty > 0 && (
            <div className="absolute top-2 right-2 bg-ember text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {cartQty}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 flex flex-col gap-1 flex-1">
          <div className="text-xs font-semibold text-white leading-snug line-clamp-2">
            {name}
          </div>
          {desc && (
            <div className="text-ash text-xs leading-snug line-clamp-2 hidden sm:block">
              {desc}
            </div>
          )}
          <div className="mt-auto pt-1 flex items-center justify-between">
            <span className="text-gold text-xs font-bold">
              {formatKip(item.price)}
            </span>
            <div className="w-6 h-6 bg-ember rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold leading-none">+</span>
            </div>
          </div>
        </div>
      </button>

      {showModal && (
        <AddItemModal
          item={item}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
