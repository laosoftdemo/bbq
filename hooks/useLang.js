'use client'
// hooks/useLang.js
import { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '@/lib/i18n'

const LangContext = createContext(null)

export function LangProvider({ children, defaultLang = 'lo' }) {
  const [lang, setLang] = useState(defaultLang)

  const t = useCallback((key) => {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang] ?? entry['en'] ?? key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang(l => l === 'lo' ? 'en' : 'lo')
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
