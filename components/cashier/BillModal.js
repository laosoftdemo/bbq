'use client'
// components/cashier/BillModal.js
import { formatKip, formatTime } from '@/lib/format'

const STATUS_LABELS = {
  pending:   { lo: 'ລໍຖ້າ',    en: 'Pending' },
  preparing: { lo: 'ກຳລັງກຽມ', en: 'Preparing' },
  served:    { lo: 'ເສີຣ໌ແລ້ວ', en: 'Served' },
  cancelled: { lo: 'ຍົກເລີກ',   en: 'Cancelled' },
}

export default function BillModal({ data, lang, onClose, onPay }) {
  const { table, orders, total } = data
  const t = (lo, en) => lang === 'lo' ? lo : en

  // Aggregate all items across orders
  const itemMap = {}
  for (const order of orders) {
    for (const oi of order.order_items || []) {
      const key = oi.menu_item_id
      if (!itemMap[key]) {
        itemMap[key] = {
          name_lo: oi.menu_items?.name_lo,
          name_en: oi.menu_items?.name_en,
          price: parseFloat(oi.menu_items?.price || 0),
          quantity: 0,
        }
      }
      itemMap[key].quantity += oi.quantity
    }
  }
  const aggregatedItems = Object.values(itemMap)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-plate rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="bg-neutral-800 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-black text-white text-xl">
              {t('ໂຕະ', 'Table')} {table.table_number}
            </h2>
            <p className="text-ash text-xs">{t('ລາຍລະອຽດບິນ', 'Bill Summary')} • {orders.length} {t('ອໍເດີ', 'orders')}</p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {/* Aggregated summary */}
          <div className="px-5 py-4 border-b border-rim">
            <div className="text-ash text-xs font-semibold uppercase tracking-wider mb-3">
              {t('ລວມລາຍການ', 'Item Summary')}
            </div>
            <div className="space-y-2">
              {aggregatedItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-ember text-sm font-bold">{item.quantity}×</span>
                    <span className="text-sm text-white">
                      {lang === 'lo' ? item.name_lo : item.name_en}
                    </span>
                  </div>
                  <span className="text-ash text-sm">{formatKip(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order breakdown */}
          <div className="px-5 py-4">
            <div className="text-ash text-xs font-semibold uppercase tracking-wider mb-3">
              {t('ລາຍລະອຽດອໍເດີ', 'Order Breakdown')}
            </div>
            {orders.map((order, idx) => (
              <div key={order.id} className="mb-3 surface rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-neutral-800/60 flex items-center justify-between">
                  <span className="text-xs text-ash">#{idx + 1} · {formatTime(order.created_at)}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full badge-${order.status}`}>
                    {STATUS_LABELS[order.status]?.[lang] || order.status}
                  </span>
                </div>
                {order.order_items?.map(oi => (
                  <div key={oi.id} className="px-3 py-2 flex justify-between text-xs">
                    <span className="text-white">
                      {oi.quantity}× {lang === 'lo' ? oi.menu_items?.name_lo : oi.menu_items?.name_en}
                    </span>
                    <span className="text-ash">{formatKip(oi.quantity * parseFloat(oi.menu_items?.price || 0))}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer total */}
        <div className="flex-shrink-0 border-t border-rim px-5 py-4 bg-neutral-900/60">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-bold text-lg">{t('ລວມທັງໝົດ', 'Total')}</span>
            <span className="text-gold font-black text-2xl">{formatKip(total)}</span>
          </div>
          <button
            onClick={() => onPay(total, table.table_number)}
            className="w-full bg-ember hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <span>📱</span>
            <span>{t('ຈ່າຍຜ່ານ BCEL OnePay', 'Pay via BCEL OnePay')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
