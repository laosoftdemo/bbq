'use client'
// components/cashier/CashierDashboard.js
import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { formatKip, formatTime } from '@/lib/format'
import StaffNav from '@/components/shared/StaffNav'
import BillModal from './BillModal'
import BCELPayModal from './BCELPayModal'
import CashPayModal from './CashPayModal'
import Receipt80mm from './Receipt80mm'
import TableTransferModal from './TableTransferModal'

export default function CashierDashboard() {
  const [tables, setTables] = useState([])
  const [billData, setBillData] = useState(null)   // { table, orders, total }
  const [paymentMethod, setPaymentMethod] = useState(null)  // { method: 'cash'|'bcel_onepay', total, table, items }
  const [receiptData, setReceiptData] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [transferTable, setTransferTable] = useState(null)  // table being moved/merged
  const [currentStaff, setCurrentStaff] = useState(null)
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
    // Load current staff for receipt attribution
    const supabase = getSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id, name')
        .eq('auth_user_id', user.id)
        .single()
      setCurrentStaff(staffRecord || null)
    })
    // Realtime table status updates
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

    // Aggregate items across all orders — used both in the bill view and the receipt
    const itemMap = {}
    for (const order of orders || []) {
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

    setBillData({ table, orders: orders || [], total, items: Object.values(itemMap) })
  }

  const confirmPayment = async ({ method, total, table, items, received = null, change = null }) => {
    setSubmittingPayment(true)
    const supabase = getSupabase()

    const { data: receiptNumber, error } = await supabase.rpc('record_payment_and_close_table', {
      p_table_number: table.table_number,
      p_payment_method: method,
      p_amount_total: total,
      p_amount_received: received,
      p_amount_change: change,
    })

    setSubmittingPayment(false)

    if (error) {
      alert(error.message || t('ເກີດຂໍ້ຜິດພາດ', 'Something went wrong'))
      return
    }

    setPaymentMethod(null)
    setReceiptData({
      receiptNumber,
      table,
      items,
      total,
      paymentMethod: method,
      amountReceived: received,
      amountChange: change,
      paidAt: new Date().toISOString(),
      staffName: currentStaff?.name,
    })
    fetchTables()
  }

  const closeTable = async (table) => {
    if (!confirm(t('ທ່ານແນ່ໃຈບໍ? ການປິດໂຕະຈະລຶບ session ນີ້ ໂດຍບໍ່ມີການບັນທຶກການຈ່າຍເງິນ', 'Close this table without recording a payment?'))) return
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
          onPay={(method, total, table) => {
            setPaymentMethod({ method, total, table, items: billData.items })
            setBillData(null)
          }}
        />
      )}

      {/* Cash Payment Modal */}
      {paymentMethod?.method === 'cash' && (
        <CashPayModal
          total={paymentMethod.total}
          lang={lang}
          submitting={submittingPayment}
          onClose={() => setPaymentMethod(null)}
          onConfirm={({ received, change }) => confirmPayment({
            method: 'cash',
            total: paymentMethod.total,
            table: paymentMethod.table,
            items: paymentMethod.items,
            received,
            change,
          })}
        />
      )}

      {/* BCEL Pay Modal */}
      {paymentMethod?.method === 'bcel_onepay' && (
        <BCELPayModal
          total={paymentMethod.total}
          tableNumber={paymentMethod.table.table_number}
          lang={lang}
          submitting={submittingPayment}
          onClose={() => setPaymentMethod(null)}
          onConfirm={() => confirmPayment({
            method: 'bcel_onepay',
            total: paymentMethod.total,
            table: paymentMethod.table,
            items: paymentMethod.items,
          })}
        />
      )}

      {/* Receipt — shown after successful payment */}
      {receiptData && (
        <Receipt80mm
          paymentData={receiptData}
          lang={lang}
          onClose={() => setReceiptData(null)}
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
