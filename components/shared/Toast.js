'use client'
// components/shared/Toast.js
export default function Toast({ message, type = 'success' }) {
  const bg = type === 'success' ? 'bg-jade' : type === 'error' ? 'bg-red-500' : 'bg-ember'
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 toast ${bg} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-xs text-center`}>
      {message}
    </div>
  )
}
