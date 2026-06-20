'use client'
// components/menu/MenuHeader.js
import { useLang } from '@/hooks/useLang'

export default function MenuHeader({ tableNumber }) {
  const { lang, toggleLang } = useLang()

  return (
    <header className="sticky top-0 z-30 bg-coal border-b border-rim px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="font-bold text-sm leading-tight">ຊິ້ນດາດ BBQ</div>
          <div className="text-ash text-xs">
            {lang === 'lo' ? 'ໂຕະ' : 'Table'} {tableNumber}
          </div>
        </div>
      </div>

      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full surface text-xs font-semibold hover:border-ember transition-colors"
        aria-label="Toggle language"
      >
        <span className={lang === 'lo' ? 'text-ember' : 'text-ash'}>ລາວ</span>
        <span className="text-ash">/</span>
        <span className={lang === 'en' ? 'text-ember' : 'text-ash'}>EN</span>
      </button>
    </header>
  )
}
