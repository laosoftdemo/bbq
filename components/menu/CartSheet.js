'use client'
// components/menu/CartSheet.js
import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { useCart } from '@/hooks/useCart'
import { getSupabase } from '@/lib/supabase'
import { formatKip } from '@/lib/format'

export default function CartSheet({ onClose, tableId, sessionId, onOrderSuccess }) {
  const { lang, t } = useLang()
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleSubmit = async () => {
    if (!tableId || !sessionId || items.length === 0) return
    setSubmitting(true)

    try {
      const supabase = getSupabase()

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          session_id: sessionId,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(i => ({
        order_id: order.id,
        menu_item_id: i.menuItem.id,
        quantity: i.quantity,
        notes: i.notes || null,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      clearCart()
      onOrderSuccess?.()
    } catch (err) {
      console.error('Order submission failed:', err)
      alert(lang === 'lo' ? 'ສົ່ງອໍເດີບໍ່ສຳເລັດ. ລອງໃໝ່.' : 'Order failed. Please try again.')
    } finally {
      setSubmitting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-plate rounded-t-3xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-4 px-5 border-b border-rim">
          <div className="w-10 h-1 bg-rim rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white text-base">{t('cart')}</h2>
              <p className="text-ash text-xs">{t('sharedCartInfo')}</p>
            </div>
            <button onClick={onClose} className="text-ash hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
              ×
            </button>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-ash">{t('emptyCart')}</p>
              <p className="text-ash text-xs mt-1">{t('emptyCartSub')}</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const name = lang === 'lo' ? item.menuItem.name_lo : item.menuItem.name_en
              return (
                <div key={`${item.menuItem.id}-${item.notes}-${idx}`} className="flex items-center gap-3 surface rounded-xl p-3">
                  <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {item.menuItem.image_url
                      ? <img src={item.menuItem.image_url} alt={name} className="w-full h-full object-cover" />
                      : '🍖'
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white line-clamp-1">{name}</div>
                    {item.notes && (
                      <div className="text-ash text-xs line-clamp-1">{item.notes}</div>
                    )}
                    <div className="text-gold text-xs font-bold mt-0.5">
                      {formatKip(item.menuItem.price * item.quantity)}
                    </div>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.notes, item.quantity - 1)}
                      className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center text-white hover:bg-neutral-600 transition-colors text-sm font-bold"
                    >
                      {item.quantity === 1 ? '🗑' : '−'}
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.notes, item.quantity + 1)}
                      className="w-7 h-7 bg-neutral-700 rounded-lg flex items-center justify-center text-white hover:bg-neutral-600 transition-colors text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-rim">
            <div className="flex justify-between items-center mb-4">
              <span className="text-ash font-medium">{t('total')}</span>
              <span className="text-white font-black text-lg">{formatKip(totalPrice)}</span>
            </div>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full bg-ember hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-colors"
              >
                {t('placeOrder')} 🔥
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm text-ash">{t('confirmOrderText')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 surface py-3 rounded-xl font-semibold text-ash hover:text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-ember hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {submitting ? '...' : `✓ ${t('confirm')}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
