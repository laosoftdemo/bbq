'use client'
// components/menu/MenuApp.js
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { LangProvider } from '@/hooks/useLang'
import { CartProvider } from '@/hooks/useCart'
import MenuHeader from './MenuHeader'
import CategoryTabs from './CategoryTabs'
import MenuItemCard from './MenuItemCard'
import CartSheet from './CartSheet'
import OrderHistory from './OrderHistory'
import CartFAB from './CartFAB'
import Toast from '@/components/shared/Toast'

const TABS = ['menu', 'orders']

export default function MenuApp() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table') || '1'

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [tableData, setTableData] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('menu')
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()

      // Load table
      const { data: table } = await supabase
        .from('tables')
        .select('*')
        .eq('table_number', tableNumber)
        .single()

      if (table) {
        // Use existing session or claim a fresh one via the safe RPC function.
        // (Direct UPDATEs to `tables` are now staff-only per RLS — customers
        // claim a vacant table through this narrow, audited function instead.)
        let sid = table.current_session_id
        if (!sid) {
          sid = crypto.randomUUID()
          const { error: claimError } = await supabase.rpc('start_table_session', {
            p_table_number: tableNumber,
            p_session_id: sid,
          })
          if (claimError) {
            console.error('Failed to claim table session:', claimError)
          }
        }
        setTableData({ ...table, current_session_id: sid })
        setSessionId(sid)
      }

      // Load categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')
      setCategories(cats || [])
      if (cats?.length) setActiveCategory(cats[0].id)

      // Load menu items
      const { data: items } = await supabase
        .from('menu_items')
        .select('*, categories(name_lo, name_en, icon)')
        .eq('is_available', true)
        .order('category_id')
      setMenuItems(items || [])

      setLoading(false)
    }

    init()
  }, [tableNumber])

  const itemsByCategory = useMemo(() => {
    const map = {}
    for (const item of menuItems) {
      if (!map[item.category_id]) map[item.category_id] = []
      map[item.category_id].push(item)
    }
    return map
  }, [menuItems])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔥</div>
          <p className="text-ash text-sm animate-pulse">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    )
  }

  return (
    <LangProvider defaultLang="lo">
      <CartProvider tableNumber={tableNumber} sessionId={sessionId}>
        <div className="min-h-screen bg-coal flex flex-col max-w-lg mx-auto relative">
          {/* Header */}
          <MenuHeader tableNumber={tableNumber} />

          {/* Tab Bar */}
          <div className="flex border-b border-rim sticky top-[64px] z-20 bg-coal">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab ? 'cat-tab-active' : 'text-ash'
                }`}
              >
                {tab === 'menu' ? '🍽 ເລືອກອາຫານ' : '📋 ອໍເດີຂອງຂ້ອຍ'}
              </button>
            ))}
          </div>

          {activeTab === 'menu' && (
            <>
              {/* Category Tabs */}
              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto pb-28 px-3 pt-3">
                {categories.map(cat => (
                  <div key={cat.id} id={`cat-${cat.id}`}>
                    {/* Category Header */}
                    <div className="flex items-center gap-2 px-1 py-3">
                      <span className="text-xl">{cat.icon}</span>
                      <h2 className="font-bold text-base text-white">
                        {cat.name_lo}
                      </h2>
                      <span className="text-ash text-sm">/ {cat.name_en}</span>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {(itemsByCategory[cat.id] || []).map(item => (
                        <MenuItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'orders' && tableData && sessionId && (
            <OrderHistory
              tableId={tableData.id}
              sessionId={sessionId}
            />
          )}

          {/* Floating Cart Button */}
          {activeTab === 'menu' && (
            <CartFAB onOpen={() => setCartOpen(true)} />
          )}

          {/* Cart Slide-up Sheet */}
          {cartOpen && (
            <CartSheet
              onClose={() => setCartOpen(false)}
              tableId={tableData?.id}
              sessionId={sessionId}
              onOrderSuccess={() => {
                setCartOpen(false)
                setActiveTab('orders')
                showToast('ສຳເລັດ! ອໍເດີຂອງທ່ານຖືກສົ່ງໄປຄົວແລ້ວ 🔥')
              }}
            />
          )}

          {/* Toast */}
          {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
      </CartProvider>
    </LangProvider>
  )
}
