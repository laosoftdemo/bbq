// lib/format.js

export function formatKip(amount) {
  return new Intl.NumberFormat('lo-LA').format(Math.round(amount)) + ' ກີບ'
}

export function formatKipCompact(amount) {
  return new Intl.NumberFormat('lo-LA').format(Math.round(amount))
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('lo-LA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function minutesAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '< 1 min'
  return `${mins} min`
}
