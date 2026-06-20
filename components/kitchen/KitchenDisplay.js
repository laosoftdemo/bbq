'use client'
// components/kitchen/KitchenDisplay.js
import { useEffect, useState, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { formatTime, minutesAgo } from '@/lib/format'
import StaffNav from '@/components/shared/StaffNav'

const STATUS_ORDER = ['pending', 'preparing', 'served']

const STATUS_CONFIG = {
  pending:   { label: 'Pending',    lo: 'ລໍຖ້າ',    cls: 'badge-pending',   next: 'preparing', nextLabel: 'Start Preparing 🔥', nextLo: 'ເລີ່ມກຽມ' },
  preparing: { label: 'Preparing',  lo: 'ກຳລັງກຽມ', cls: 'badge-preparing', next: 'served',    nextLabel: 'Mark Served ✓',     nextLo: 'ເສີຣ໌ແລ້ວ' },
  served:    { label: 'Served',     lo: 'ເສີຣ໌ແລ້ວ', cls: 'badge-served',    next: null,        nextLabel: null,                nextLo: null },
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active') // 'active' | 'pending' | 'preparing' | 'served'
  const [lang, setLang] = useState('lo')
  const [loading, setLoading] = useState(true)
  const alertRef = useRef(null)
  const knownIds = useRef(new Set())

  const playAlert = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      // Two-tone alert
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      playTone(880, ctx.currentTime, 0.2)
      playTone(1100, ctx.currentTime + 0.2, 0.2)
    } catch (_) {}
  }, [])

  const fetchOrders = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        tables (table_number),
        order_items (
          *,
          menu_items (name_lo, name_en)
        )
      `)
      .in('status', ['pending', 'preparing', 'served'])
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      // Detect new orders
      const incoming = data.filter(o => !knownIds.current.has(o.id) && o.status === 'pending')
      if (incoming.length > 0 && knownIds.current.size > 0) {
        playAlert()
      }
      data.forEach(o => knownIds.current.add(o.id))
      setOrders(data)
    }
    setLoading(false)
  }, [playAlert])

  useEffect(() => {
    fetchOrders()

    const supabase = getSupabase()
    const channel = supabase
      .channel('kitchen:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  const updateStatus = async (orderId, newStatus) => {
    const supabase = getSupabase()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  }

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return o.status === 'pending' || o.status === 'preparing'
    return o.status === filter
  })

  const counts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    served:    orders.filter(o => o.status === 'served').length,
  }

  const t = (lo, en) => lang === 'lo' ? lo : en

  return (
    <div className="min-h-screen bg-coal flex flex-col">
      <StaffNav title={t('ໜ້າຈໍຄົວ', 'Kitchen Display')} lang={lang} onToggleLang={() => setLang(l => l === 'lo' ? 'en' : 'lo')} />

      {/* Filter bar */}
      <div className="bg-plate border-b border-rim px-4 py-3 flex items-center gap-2 flex-wrap">
        {[
          { key: 'active',   lo: 'ທີ່ກຳລັງດຳເນີນ', en: 'Active', count: counts.pending + counts.preparing },
          { key: 'pending',  lo: 'ລໍຖ້າ',          en: 'Pending',   count: counts.pending },
          { key: 'preparing',lo: 'ກຳລັງກຽມ',       en: 'Preparing', count: counts.preparing },
          { key: 'served',   lo: 'ເສີຣ໌ແລ້ວ',       en: 'Served',    count: counts.served },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'bg-ember text-white'
                : 'surface text-ash hover:text-white'
            }`}
          >
            {t(f.lo, f.en)}
            {f.count > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-neutral-700 text-white'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto text-ash text-xs">
          {t('ອໍເດີທັງໝົດ', 'Total')}: {orders.length}
        </div>
      </div>

      {/* Orders grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-64 text-ash">
            {t('ກຳລັງໂຫລດ...', 'Loading...')}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">🍽</div>
            <p className="text-white font-semibold">{t('ບໍ່ມີອໍເດີ', 'No orders')}</p>
            <p className="text-ash text-sm mt-1">{t('ລໍຖ້າ...', 'Waiting for orders...')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            const isPending = order.status === 'pending'

            return (
              <div
                key={order.id}
                className={`surface rounded-2xl overflow-hidden animate-slide-in ${isPending ? 'glow-pending' : ''}`}
              >
                {/* Ticket header */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isPending ? 'bg-ember/20 border-b border-ember/30' : 'bg-neutral-800/60 border-b border-rim'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-black ${isPending ? 'text-ember' : 'text-white'}`}>
                      {t('ໂຕະ', 'T')}{order.tables?.table_number}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                      {t(cfg.lo, cfg.label)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-ash text-xs">{formatTime(order.created_at)}</div>
                    <div className="text-ash text-xs">{minutesAgo(order.created_at)} {t('ທີ່ຜ່ານມາ', 'ago')}</div>
                  </div>
                </div>

                {/* Items checklist */}
                <div className="divide-y divide-rim/40">
                  {order.order_items?.map(oi => (
                    <div key={oi.id} className="px-4 py-3 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        order.status === 'served' ? 'bg-jade/20 text-jade' : 'bg-ember/20 text-ember'
                      }`}>
                        {oi.quantity}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white leading-snug">
                          {lang === 'lo' ? oi.menu_items?.name_lo : oi.menu_items?.name_en}
                        </div>
                        {oi.notes && (
                          <div className="text-amber-400 text-xs mt-0.5 italic">
                            ⚠ {oi.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                {cfg.next && (
                  <div className="p-3 border-t border-rim">
                    <button
                      onClick={() => updateStatus(order.id, cfg.next)}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                        order.status === 'pending'
                          ? 'bg-ember hover:bg-orange-600 text-white'
                          : 'bg-jade/20 hover:bg-jade/30 text-jade border border-jade/30'
                      }`}
                    >
                      {t(cfg.nextLo, cfg.nextLabel)}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
