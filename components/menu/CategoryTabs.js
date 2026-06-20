'use client'
// components/menu/CategoryTabs.js
import { useRef, useEffect } from 'react'
import { useLang } from '@/hooks/useLang'

export default function CategoryTabs({ categories, activeCategory, onSelect }) {
  const { lang } = useLang()
  const containerRef = useRef(null)

  // Scroll active tab into view
  useEffect(() => {
    const container = containerRef.current
    if (!container || !activeCategory) return
    const activeEl = container.querySelector(`[data-cat="${activeCategory}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeCategory])

  const handleSelect = (catId) => {
    onSelect(catId)
    // Scroll menu to category section
    setTimeout(() => {
      const el = document.getElementById(`cat-${catId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none border-b border-rim bg-coal sticky top-[112px] z-20"
      style={{ scrollbarWidth: 'none' }}
    >
      {categories.map(cat => (
        <button
          key={cat.id}
          data-cat={cat.id}
          onClick={() => handleSelect(cat.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
            activeCategory === cat.id
              ? 'bg-ember text-white'
              : 'surface text-ash hover:text-white'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{lang === 'lo' ? cat.name_lo : cat.name_en}</span>
        </button>
      ))}
    </div>
  )
}
