import { toISODate } from './utils'

const SETTINGS_KEY = 'compass-settings'
const DAYS_KEY = 'compass-days'

const DEFAULT_SETTINGS = {
  goal: '12週間の目標を設定してください',
  startDate: toISODate(),
  tasks: ['タスク1', 'タスク2', 'タスク3'],
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadDays() {
  try {
    const raw = localStorage.getItem(DAYS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveDays(days) {
  localStorage.setItem(DAYS_KEY, JSON.stringify(days))
}

export function getDayRecord(days, date, taskCount) {
  const record = days[date] || { checks: [], evidence: [] }
  const checks = Array.from({ length: taskCount }, (_, i) => record.checks[i] || false)
  return { checks, evidence: record.evidence || [] }
}

// ブラウザによる自動ストレージ削除を避けるため、永続化を要求する。
// 対応ブラウザでは付与されるとサイトデータが自動削除されにくくなる。
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist()
  } catch {}
}

export function exportBackup() {
  return JSON.stringify({ settings: loadSettings(), days: loadDays() }, null, 2)
}

export function importBackup(json) {
  const data = JSON.parse(json)
  if (!data.settings || !data.days) throw new Error('invalid backup file')
  saveSettings(data.settings)
  saveDays(data.days)
  return data
}
