import { useEffect, useMemo, useState } from 'react'
import SettingsModal from './SettingsModal'
import { loadSettings, saveSettings, loadDays, saveDays, getDayRecord, requestPersistentStorage } from './storage'
import { TOTAL_DAYS, TOTAL_WEEKS, toISODate, addDays, diffDays, weekdayLabel, formatMonthDay } from './utils'

const TODAY = toISODate()

function DayDetail({ date, days, tasks }) {
  const record = getDayRecord(days, date, tasks.length)
  return (
    <div style={dayDetailBox}>
      <div style={dayDetailHeader}>{formatMonthDay(date)}（{weekdayLabel(date)}）</div>
      {tasks.map((t, i) => (
        <div key={i} style={dayDetailTaskRow}>
          <span style={{ color: record.checks[i] ? '#2A9D8F' : '#4A453D' }}>{record.checks[i] ? '✓' : '□'}</span>
          <span style={{ color: record.checks[i] ? '#C8C0B4' : '#5A544A' }}>{t}</span>
        </div>
      ))}
      {record.evidence.length > 0 ? (
        <ul style={dayDetailEvidenceList}>
          {record.evidence.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      ) : (
        <div style={dayDetailEmpty}>この日の記録はありません</div>
      )}
    </div>
  )
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [days, setDays] = useState(loadDays)
  const [showSettings, setShowSettings] = useState(false)
  const [evidenceInput, setEvidenceInput] = useState('')
  const [expandedDate, setExpandedDate] = useState(null)
  const [expandedWeek, setExpandedWeek] = useState(null)

  useEffect(() => { requestPersistentStorage() }, [])

  const taskCount = settings.tasks.length

  const elapsed = diffDays(TODAY, settings.startDate)
  const dayNumber = elapsed + 1
  const remainingDays = Math.max(0, Math.min(TOTAL_DAYS, TOTAL_DAYS - dayNumber))
  const notStarted = elapsed < 0
  const finished = elapsed >= TOTAL_DAYS

  const weekIndex = Math.min(Math.max(Math.floor(elapsed / 7), 0), TOTAL_WEEKS - 1)
  const weekStartDate = addDays(settings.startDate, weekIndex * 7)
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  )

  const todayRecord = getDayRecord(days, TODAY, taskCount)
  const checkedCount = todayRecord.checks.filter(Boolean).length
  const todayRate = taskCount ? Math.round((checkedCount / taskCount) * 100) : 0

  const persistDays = (next) => {
    setDays(next)
    saveDays(next)
  }

  const toggleCheck = (i) => {
    if (notStarted) return
    const record = getDayRecord(days, TODAY, taskCount)
    const checks = [...record.checks]
    checks[i] = !checks[i]
    persistDays({ ...days, [TODAY]: { ...record, checks } })
  }

  const addEvidence = () => {
    const text = evidenceInput.trim()
    if (!text) return
    const record = getDayRecord(days, TODAY, taskCount)
    persistDays({ ...days, [TODAY]: { ...record, evidence: [...record.evidence, text] } })
    setEvidenceInput('')
  }

  const removeEvidence = (i) => {
    const record = getDayRecord(days, TODAY, taskCount)
    persistDays({ ...days, [TODAY]: { ...record, evidence: record.evidence.filter((_, idx) => idx !== i) } })
  }

  const weekEvidenceTotal = weekDates.reduce((sum, d) => sum + (days[d]?.evidence?.length || 0), 0)

  const pastWeeksTotals = useMemo(() => {
    const list = []
    for (let w = 0; w < weekIndex; w++) {
      const start = addDays(settings.startDate, w * 7)
      const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i))
      const total = dates.reduce((sum, d) => sum + (days[d]?.evidence?.length || 0), 0)
      list.push({ week: w + 1, total, dates })
    }
    return list.reverse()
  }, [weekIndex, settings.startDate, days])

  let daysSoFarInWeek = 0
  let weekChecksSoFar = 0
  const weekDayStatus = weekDates.map((d) => {
    const isFuture = diffDays(d, TODAY) > 0
    const isBeforeStart = diffDays(d, settings.startDate) < 0
    if (isFuture || isBeforeStart) return { date: d, symbol: '・', isToday: d === TODAY, clickable: false }
    const record = getDayRecord(days, d, taskCount)
    const checked = record.checks.filter(Boolean).length
    daysSoFarInWeek += 1
    weekChecksSoFar += checked
    const symbol = taskCount === 0 ? '・' : checked === taskCount ? '○' : checked === 0 ? '×' : '△'
    return { date: d, symbol, isToday: d === TODAY, clickable: true }
  })
  const weekRate = daysSoFarInWeek && taskCount ? Math.round((weekChecksSoFar / (taskCount * daysSoFarInWeek)) * 100) : 0

  return (
    <div style={page}>
      {/* 1. ヘッダー */}
      <div style={header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={goalLabel}>12週間の目標</div>
          <div style={goalText}>{settings.goal}</div>
        </div>
        <button style={gearBtn} onClick={() => setShowSettings(true)}>⚙︎</button>
      </div>
      <div style={remainingRow}>
        {notStarted ? (
          <span style={remainingText}>開始まであと{-elapsed}日</span>
        ) : finished ? (
          <span style={remainingText}>12週間が終了しました</span>
        ) : (
          <span style={remainingText}>残り <b style={{ color: '#EDE7DB', fontSize: 20 }}>{remainingDays}</b> 日（{dayNumber}/{TOTAL_DAYS}日目）</span>
        )}
      </div>

      {/* 2. 今日やること */}
      <section style={card}>
        <div style={cardTitle}>今日やること</div>
        {settings.tasks.map((task, i) => (
          <label key={i} style={checkRow}>
            <input
              type="checkbox"
              checked={todayRecord.checks[i] || false}
              onChange={() => toggleCheck(i)}
              style={checkbox}
            />
            <span style={{ ...checkLabel, ...(todayRecord.checks[i] ? checkLabelDone : {}) }}>{task}</span>
          </label>
        ))}
      </section>

      {/* 3. できた証拠 */}
      <section style={card}>
        <div style={cardTitle}>できた証拠</div>
        <div style={evidenceInputRow}>
          <input
            style={evidenceInputStyle}
            value={evidenceInput}
            onChange={(e) => setEvidenceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvidence()}
            placeholder="今日できたことを追加"
          />
          <button style={addEvidenceBtn} onClick={addEvidence}>追加</button>
        </div>
        {todayRecord.evidence.length > 0 && (
          <ul style={evidenceList}>
            {todayRecord.evidence.map((text, i) => (
              <li key={i} style={evidenceItem}>
                <span style={{ flex: 1 }}>{text}</span>
                <button style={evidenceDelBtn} onClick={() => removeEvidence(i)}>×</button>
              </li>
            ))}
          </ul>
        )}

        <div style={bigTotalBox}>
          <div style={bigTotalLabel}>今週できたこと</div>
          <div style={bigTotalValue}>{weekEvidenceTotal}<span style={bigTotalUnit}>個</span></div>
        </div>

        {pastWeeksTotals.length > 0 && (
          <div style={pastWeeksBox}>
            <div style={pastWeeksTitle}>過去の週の合計（タップで内訳）</div>
            {pastWeeksTotals.map((w) => (
              <div key={w.week}>
                <div
                  style={pastWeekRow}
                  onClick={() => setExpandedWeek(expandedWeek === w.week ? null : w.week)}
                >
                  <span>{expandedWeek === w.week ? '▾' : '▸'} 第{w.week}週</span>
                  <span>{w.total}個</span>
                </div>
                {expandedWeek === w.week && (
                  <div style={pastWeekDetailBox}>
                    {w.dates
                      .filter((d) => diffDays(d, TODAY) <= 0)
                      .map((d) => (
                        <DayDetail key={d} date={d} days={days} tasks={settings.tasks} />
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. 実行率 */}
      <section style={card}>
        <div style={cardTitle}>実行率</div>

        <div style={rateRow}>
          <span style={rateLabel}>今日の実行率</span>
          <span style={rateValue}>{checkedCount}/{taskCount}（{todayRate}%）</span>
        </div>

        <div style={weekGrid}>
          {weekDayStatus.map((d) => (
            <div
              key={d.date}
              style={{
                ...weekCell,
                ...(d.isToday ? weekCellToday : {}),
                ...(d.clickable ? weekCellClickable : {}),
                ...(expandedDate === d.date ? weekCellSelected : {}),
              }}
              onClick={() => d.clickable && setExpandedDate(expandedDate === d.date ? null : d.date)}
            >
              <div style={weekCellDay}>{weekdayLabel(d.date)}</div>
              <div style={weekCellDate}>{formatMonthDay(d.date)}</div>
              <div style={weekCellSymbol}>{d.symbol}</div>
            </div>
          ))}
        </div>

        {expandedDate && weekDates.includes(expandedDate) && (
          <DayDetail date={expandedDate} days={days} tasks={settings.tasks} />
        )}

        <div style={rateRow}>
          <span style={rateLabel}>今週の実行率</span>
          <span style={rateValue}>{weekRate}%</span>
        </div>
      </section>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(next) => {
            setSettings(next)
            saveSettings(next)
            setShowSettings(false)
          }}
          onImport={(data) => {
            setSettings(data.settings)
            setDays(data.days)
          }}
        />
      )}
    </div>
  )
}

// ── styles ──────────────────────────────────────────────
const page = {
  minHeight: '100vh', maxWidth: 480, margin: '0 auto',
  padding: '20px 16px 60px', color: '#DDD5C8',
}
const header = { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }
const goalLabel = { fontSize: 11, color: '#6B6459', letterSpacing: 1, marginBottom: 4 }
const goalText = { fontSize: 19, fontWeight: 700, color: '#F0EBE0', lineHeight: 1.4 }
const gearBtn = {
  background: 'transparent', border: '1px solid #2A2620', borderRadius: 8,
  color: '#8A8377', fontSize: 16, width: 36, height: 36, cursor: 'pointer', flexShrink: 0,
}
const remainingRow = { marginBottom: 20 }
const remainingText = { fontSize: 13, color: '#8A8377' }

const card = {
  background: '#131210', border: '1px solid #211E19', borderRadius: 12,
  padding: '16px 16px 18px', marginBottom: 14,
}
const cardTitle = { fontSize: 12, color: '#6B6459', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }

const checkRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: 'pointer' }
const checkbox = { width: 20, height: 20, accentColor: '#E6E1D6', flexShrink: 0 }
const checkLabel = { fontSize: 15, color: '#DDD5C8' }
const checkLabelDone = { color: '#6B6459', textDecoration: 'line-through' }

const evidenceInputRow = { display: 'flex', gap: 8, marginBottom: 10 }
const evidenceInputStyle = {
  flex: 1, background: '#0D0D0D', border: '1px solid #2A2620', borderRadius: 8,
  color: '#EDE7DB', fontSize: 14, padding: '9px 11px', fontFamily: 'inherit', outline: 'none',
}
const addEvidenceBtn = {
  background: '#E6E1D6', border: 'none', borderRadius: 8, color: '#0D0D0D',
  fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: 'pointer', fontFamily: 'inherit',
}
const evidenceList = { listStyle: 'none', marginBottom: 14 }
const evidenceItem = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B8B0A2',
  padding: '6px 0', borderBottom: '1px solid #1A1815',
}
const evidenceDelBtn = { background: 'none', border: 'none', color: '#4A453D', fontSize: 15, cursor: 'pointer' }

const bigTotalBox = { textAlign: 'center', padding: '16px 0 6px' }
const bigTotalLabel = { fontSize: 12, color: '#8A8377', marginBottom: 4 }
const bigTotalValue = { fontSize: 44, fontWeight: 900, color: '#F0EBE0', lineHeight: 1 }
const bigTotalUnit = { fontSize: 18, fontWeight: 500, color: '#8A8377', marginLeft: 4 }

const pastWeeksBox = { marginTop: 14, paddingTop: 12, borderTop: '1px solid #1A1815' }
const pastWeeksTitle = { fontSize: 11, color: '#6B6459', marginBottom: 8 }
const pastWeekRow = {
  display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9B9488',
  padding: '7px 2px', cursor: 'pointer',
}
const pastWeekDetailBox = { marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }

const dayDetailBox = {
  background: '#0D0D0D', border: '1px solid #211E19', borderRadius: 8,
  padding: '10px 12px', marginTop: 8, marginBottom: 8,
}
const dayDetailHeader = { fontSize: 12, color: '#8A8377', marginBottom: 8, fontWeight: 700 }
const dayDetailTaskRow = { display: 'flex', gap: 8, fontSize: 13, padding: '3px 0' }
const dayDetailEvidenceList = {
  listStyle: 'none', marginTop: 8, paddingTop: 8, borderTop: '1px solid #1A1815',
  fontSize: 12, color: '#9B9488', display: 'flex', flexDirection: 'column', gap: 4,
}
const dayDetailEmpty = {
  marginTop: 8, paddingTop: 8, borderTop: '1px solid #1A1815', fontSize: 12, color: '#4A453D',
}

const rateRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }
const rateLabel = { fontSize: 13, color: '#8A8377' }
const rateValue = { fontSize: 15, fontWeight: 700, color: '#EDE7DB' }

const weekGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, margin: '10px 0' }
const weekCell = {
  background: '#0D0D0D', border: '1px solid #211E19', borderRadius: 8,
  textAlign: 'center', padding: '8px 2px',
}
const weekCellToday = { border: '1px solid #4A453D', background: '#17140F' }
const weekCellClickable = { cursor: 'pointer' }
const weekCellSelected = { border: '1px solid #6B6459', background: '#1C1812' }
const weekCellDay = { fontSize: 10, color: '#6B6459' }
const weekCellDate = { fontSize: 9, color: '#4A453D', marginBottom: 4 }
const weekCellSymbol = { fontSize: 16, fontWeight: 700, color: '#DDD5C8' }
