'use client'
// hooks/useCart.js
// Shared cart synced across all devices at the same table via Supabase Realtime Broadcast

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'

const CartContext = createContext(null)

export function CartProvider({ children, tableNumber, sessionId }) {
  const [items, setItems] = useState([])       // [{ menuItem, quantity, notes, clientId }]
  const [syncing, setSyncing] = useState(false)
  const channelRef = useRef(null)
  const myClientId = useRef(
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('sindat_client_id') || (() => {
          const id = Math.random().toString(36).slice(2)
          sessionStorage.setItem('sindat_client_id', id)
          return id
        })())
      : 'server'
  )

  // Broadcast cart updates to everyone on the same table channel
  const broadcast = useCallback((newItems) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'cart_update',
      payload: { items: newItems, from: myClientId.current },
    })
  }, [])

  useEffect(() => {
    if (!tableNumber || !sessionId) return
    const supabase = getSupabase()
    const channel = supabase.channel(`cart:table:${tableNumber}:${sessionId}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'cart_update' }, ({ payload }) => {
        if (payload.from !== myClientId.current) {
          setItems(payload.items)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [tableNumber, sessionId])

  const addItem = useCallback((menuItem, quantity = 1, notes = '') => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.menuItem.id === menuItem.id && i.notes === notes)
      let updated
      if (existing >= 0) {
        updated = prev.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + quantity } : item
        )
      } else {
        updated = [...prev, { menuItem, quantity, notes, clientId: myClientId.current }]
      }
      broadcast(updated)
      return updated
    })
  }, [broadcast])

  const removeItem = useCallback((menuItemId, notes = '') => {
    setItems(prev => {
      const updated = prev.filter(i => !(i.menuItem.id === menuItemId && i.notes === notes))
      broadcast(updated)
      return updated
    })
  }, [broadcast])

  const updateQuantity = useCallback((menuItemId, notes, quantity) => {
    setItems(prev => {
      let updated
      if (quantity <= 0) {
        updated = prev.filter(i => !(i.menuItem.id === menuItemId && i.notes === notes))
      } else {
        updated = prev.map(i =>
          i.menuItem.id === menuItemId && i.notes === notes ? { ...i, quantity } : i
        )
      }
      broadcast(updated)
      return updated
    })
  }, [broadcast])

  const clearCart = useCallback(() => {
    setItems([])
    broadcast([])
  }, [broadcast])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * parseFloat(i.menuItem.price), 0)

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      syncing,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
