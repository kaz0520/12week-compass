export const TOTAL_WEEKS = 12
export const TOTAL_DAYS = TOTAL_WEEKS * 7
export const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

export function toISODate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function diffDays(a, b) {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((da - db) / 86400000)
}

export function weekdayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return WEEKDAY_LABELS[(d.getDay() + 6) % 7]
}

export function formatMonthDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
