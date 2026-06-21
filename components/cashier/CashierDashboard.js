'use client'
// components/cashier/CashierDashboard.js
import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { formatKip, formatTime } from '@/lib/format'
import StaffNav from '@/components/shared/StaffNav'
import BillModal from './BillModal'
import BCELPayModal from './BCELPayModal'
import TableTransferModal from './TableTransferModal'

export default function CashierDashboard() {
  const [tables, setTables] = useState([])
  const [billData, setBillData] = useState(null)   // { table, orders, total }
  const [payData, setPayData] = useState(null)      // { total, tableNumber }
  const [transferTable, setTransferTable] = useState(null)  // table being moved/merged
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('lo')

  const t = (lo, en) => lang === 'lo' ? lo : en

  const fetchTables = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')

    setTables(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTables()
    // Realtime table status updates
    const supabase = getSupabase()
    const channel = supabase
      .channel('cashier:tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchTables)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchTables)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchTables])

  const openBill = async (table) => {
    const supabase = getSupabase()
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name_lo, name_en, price)
        )
      `)
      .eq('table_id', table.id)
      .eq('session_id', table.current_session_id)
      .neq('status', 'cancelled')
      .order('created_at')

    const total = (orders || []).flatMap(o => o.order_items).reduce(
      (sum, oi) => sum + oi.quantity * parseFloat(oi.menu_items?.price || 0), 0
    )
    setBillData({ table, orders: orders || [], total })
  }

  const closeTable = async (table) => {
    if (!confirm(t('ທ່ານແນ່ໃຈບໍ? ການປິດໂຕະຈະລຶບ session ນີ້', 'Close this table and clear the session?'))) return
    const supabase = getSupabase()
    await supabase
      .from('tables')
      .update({ status: 'vacant', current_session_id: null })
      .eq('id', table.id)
    fetchTables()
  }

  const activeTables = tables.filter(t => t.status === 'active')
  const vacantTables = tables.filter(t => t.status === 'vacant')

  return (
    <div className="min-h-screen bg-coal flex flex-col">
      <StaffNav title={t('ໜ້າຈໍເງິນ', 'Cashier')} lang={lang} onToggleLang={() => setLang(l => l === 'lo' ? 'en' : 'lo')} />

      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="surface rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-ember mb-1">{activeTables.length}</div>
            <div className="text-ash text-sm">{t('ໂຕະທີ່ໃຊ້ຢູ່', 'Active Tables')}</div>
          </div>
          <div className="surface rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-jade mb-1">{vacantTables.length}</div>
            <div className="text-ash text-sm">{t('ໂຕະວ່າງ', 'Vacant Tables')}</div>
          </div>
        </div>

        {/* Active tables */}
        {activeTables.length > 0 && (
          <section className="mb-6">
            <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-ember rounded-full"></span>
              {t('ໂຕະທີ່ໃຊ້ຢູ່', 'Active Tables')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeTables.map(table => (
                <div key={table.id} className="surface rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-white">
                      {t('ໂຕະ', 'T')}{table.table_number}
                    </div>
                    <span className="badge-pending text-xs px-2 py-1 rounded-full font-semibold">
                      {t('ກຳລັງໃຊ້', 'Active')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openBill(table)}
                      className="w-full bg-ember hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                    >
                      💰 {t('ເບິ່ງບິນ', 'View Bill')}
                    </button>
                    <button
                      onClick={() => setTransferTable(table)}
                      className="w-full surface hover:border-sky-400 text-ash hover:text-sky-400 text-sm py-2 rounded-xl transition-colors"
                    >
                      🔀 {t('ຍ້າຍ / ລວມໂຕະ', 'Move / Merge')}
                    </button>
                    <button
                      onClick={() => closeTable(table)}
                      className="w-full surface hover:border-red-500 text-ash hover:text-red-400 text-sm py-2 rounded-xl transition-colors"
                    >
                      {t('ປິດໂຕະ', 'Close Table')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vacant tables */}
        <section>
          <h2 className="text-ash font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-jade rounded-full"></span>
            {t('ໂຕະວ່າງ', 'Vacant Tables')}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
            {vacantTables.map(table => (
              <div key={table.id} className="surface rounded-xl p-3 text-center opacity-50">
                <div className="text-lg font-bold text-ash">
                  {t('ໂຕະ', 'T')}{table.table_number}
                </div>
                <div className="text-xs text-jade mt-0.5">{t('ວ່າງ', 'Vacant')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bill Modal */}
      {billData && (
        <BillModal
          data={billData}
          lang={lang}
          onClose={() => setBillData(null)}
          onPay={(total, tableNumber) => {
            setBillData(null)
            setPayData({ total, tableNumber })
          }}
        />
      )}

      {/* BCEL Pay Modal */}
      {payData && (
        <BCELPayModal
          total={payData.total}
          tableNumber={payData.tableNumber}
          onClose={() => setPayData(null)}
        />
      )}

      {/* Table Transfer / Merge Modal */}
      {transferTable && (
        <TableTransferModal
          sourceTable={transferTable}
          allTables={tables}
          lang={lang}
          onClose={() => setTransferTable(null)}
          onSuccess={() => {
            setTransferTable(null)
            fetchTables()
          }}
        />
      )}
    </div>
  )
}
