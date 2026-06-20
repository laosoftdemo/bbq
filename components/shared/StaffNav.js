'use client'
// components/shared/StaffNav.js
import Link from 'next/link'

export default function StaffNav({ title, lang, onToggleLang }) {
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
        {/* Lang toggle */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full surface text-xs font-semibold hover:border-ember transition-colors"
        >
          <span className={lang === 'lo' ? 'text-ember' : 'text-ash'}>ລາວ</span>
          <span className="text-ash">/</span>
          <span className={lang === 'en' ? 'text-ember' : 'text-ash'}>EN</span>
        </button>
      </div>
    </header>
  )
}
