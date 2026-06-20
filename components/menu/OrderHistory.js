'use client'
// components/menu/OrderHistory.js
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import { formatKip, formatTime } from '@/lib/format'

const STATUS_CONFIG = {
  pending:   { label_lo: 'ລໍຖ້າ',       label_en: 'Pending',    cls: 'badge-pending',   icon: '⏳' },
  preparing: { label_lo: 'ກຳລັງກຽມ',    label_en: 'Preparing',  cls: 'badge-preparing', icon: '🔥' },
  served:    { label_lo: 'ເສີຣ໌ແລ້ວ',    label_en: 'Served',     cls: 'badge-served',    icon: '✅' },
  cancelled: { label_lo: 'ຍົກເລີກ',      label_en: 'Cancelled',  cls: 'badge-cancelled', icon: '❌' },
}

export default function OrderHistory({ tableId, sessionId }) {
  const { lang, t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name_lo, name_en, price)
        )
      `)
      .eq('table_id', tableId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    // Real-time: listen for order status changes
    const supabase = getSupabase()
    const channel = supabase
      .channel(`order_history:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tableId, sessionId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-ash text-sm animate-pulse">{t('loading')}</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="font-semibold text-white">{t('noOrders')}</p>
        <p className="text-ash text-sm mt-1">{t('noOrdersSub')}</p>
      </div>
    )
  }

  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .flatMap(o => o.order_items)
    .reduce((sum, oi) => sum + oi.quantity * parseFloat(oi.menu_items?.price || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Summary bar */}
      <div className="mx-3 mt-3 surface rounded-2xl p-4 flex justify-between items-center">
        <div>
          <div className="text-ash text-xs">{t('total')}</div>
          <div className="text-gold font-black text-xl">{formatKip(totalSpent)}</div>
        </div>
        <div className="text-right">
          <div className="text-ash text-xs">{t('myOrders')}</div>
          <div className="text-white font-bold text-xl">{orders.length}</div>
        </div>
      </div>

      {/* Orders */}
      <div className="px-3 mt-3 space-y-3">
        {orders.map(order => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
          const orderTotal = order.order_items?.reduce(
            (sum, oi) => sum + oi.quantity * parseFloat(oi.menu_items?.price || 0), 0
          ) ?? 0

          return (
            <div key={order.id} className="surface rounded-2xl overflow-hidden">
              {/* Order header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-rim">
                <div className="flex items-center gap-2">
                  <span>{cfg.icon}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                    {lang === 'lo' ? cfg.label_lo : cfg.label_en}
                  </span>
                </div>
                <div className="text-ash text-xs">
                  {formatTime(order.created_at)}
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-rim/50">
                {order.order_items?.map(oi => {
                  const name = lang === 'lo' ? oi.menu_items?.name_lo : oi.menu_items?.name_en
                  return (
                    <div key={oi.id} className="px-4 py-2.5 flex justify-between items-start">
                      <div>
                        <span className="text-sm text-white">
                          <span className="text-ember font-bold">{oi.quantity}×</span> {name}
                        </span>
                        {oi.notes && <div className="text-ash text-xs mt-0.5">{oi.notes}</div>}
                      </div>
                      <span className="text-ash text-xs">
                        {formatKip(oi.quantity * parseFloat(oi.menu_items?.price || 0))}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Order total */}
              <div className="px-4 py-2.5 bg-neutral-800/50 flex justify-between items-center">
                <span className="text-ash text-xs">{t('total')}</span>
                <span className="text-gold font-bold text-sm">{formatKip(orderTotal)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
