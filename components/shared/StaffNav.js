'use client'
// components/shared/StaffNav.js
import Link from 'next/link'
import { useStaffSession } from '@/hooks/useStaffSession'

export default function StaffNav({ title, lang, onToggleLang }) {
  const { staff, logout } = useStaffSession()

  return (
    <header className="bg-plate border-b border-rim px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-ash hover:text-white text-xl transition-colors">←</Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-white">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Staff links */}
        <Link href="/staff/kitchen" className="text-ash hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-700 transition-colors hidden sm:block">
          Kitchen
        </Link>
        <Link href="/staff/cashier" className="text-ash hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-700 transition-colors hidden sm:block">
          Cashier
        </Link>
        {staff?.role === 'admin' && (
          <>
            <Link href="/admin/staff" className="text-ash hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-700 transition-colors hidden sm:block">
              Staff
            </Link>
            <Link href="/admin/exchange-rates" className="text-ash hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-700 transition-colors hidden sm:block">
              Rates
            </Link>
          </>
        )}
        {/* Lang toggle */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full surface text-xs font-semibold hover:border-ember transition-colors"
        >
          <span className={lang === 'lo' ? 'text-ember' : 'text-ash'}>ລາວ</span>
          <span className="text-ash">/</span>
          <span className={lang === 'en' ? 'text-ember' : 'text-ash'}>EN</span>
        </button>
        {/* Current staff + logout */}
        {staff && (
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-rim">
            <div className="hidden sm:block text-right">
              <div className="text-white text-xs font-semibold leading-tight">{staff.name}</div>
              <div className="text-ash text-[10px] leading-tight capitalize">{staff.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-ash hover:text-red-400 text-xs px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors"
              title="Log out"
            >
              ⏻
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
