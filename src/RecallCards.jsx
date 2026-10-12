import { useState } from 'react'
import { addDays, diffDays, formatMonthDay } from './utils'

// 『学び方の学び方』三・五：想起練習を、間隔を空けて繰り返す
// level = 連続で思い出せた回数。次の出題までの日数
const INTERVALS = [1, 3, 7, 14, 30, 60]

function nextDue(today, level) {
  return addDays(today, INTERVALS[Math.min(level, INTERVALS.length - 1)])
}

export default function RecallCards({ cards, today, todayReviews, onChange, onReviewed }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showList, setShowList] = useState(false)

  const dueCards = cards
    .filter((c) => diffDays(c.due, today) <= 0)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
  const current = dueCards[0]

  const addCard = () => {
    const q = question.trim()
    const a = answer.trim()
    if (!q || !a) return
    const card = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, q, a, level: 0, due: nextDue(today, 0), created: today }
    onChange([...cards, card])
    setQuestion('')
    setAnswer('')
  }

  const grade = (remembered) => {
    const level = remembered ? current.level + 1 : 0
    onChange(cards.map((c) => (c.id === current.id ? { ...c, level, due: nextDue(today, level) } : c)))
    onReviewed()
    setRevealed(false)
  }

  const removeCard = (id) => onChange(cards.filter((c) => c.id !== id))

  return (
    <section style={card}>
      <div style={titleRow}>
        <span style={cardTitle}>想起テスト</span>
        <span style={countText}>今日 <b style={{ color: '#2B2620' }}>{todayReviews}</b> 枚</span>
      </div>

      {current ? (
        <div style={quizBox}>
          <div style={remainingText}>残り {dueCards.length} 枚</div>
          <div style={questionText}>{current.q}</div>
          {revealed ? (
            <>
              <div style={answerText}>{current.a}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={failBtn} onClick={() => grade(false)}>思い出せなかった</button>
                <button style={okBtn} onClick={() => grade(true)}>思い出せた</button>
              </div>
            </>
          ) : (
            <>
              <div style={recallHint}>答えを見る前に、頭の中で思い出してみる</div>
              <button style={revealBtn} onClick={() => setRevealed(true)}>答えを見る</button>
            </>
          )}
        </div>
      ) : (
        <div style={emptyText}>
          {cards.length === 0 ? '学んだことを1問1答で登録すると、間隔を空けて出題されます' : '今日の想起テストは完了です'}
        </div>
      )}

      <div style={toggleRow} onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? '▾' : '▸'} カードを追加
      </div>
      {showAdd && (
        <div style={addBox}>
          <textarea style={textarea} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="問い（例：ポモドーロの集中時間は？）" />
          <textarea style={textarea} rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="答え（例：25分）" />
          <button style={addBtn} onClick={addCard} disabled={!question.trim() || !answer.trim()}>追加</button>
        </div>
      )}

      {cards.length > 0 && (
        <>
          <div style={toggleRow} onClick={() => setShowList(!showList)}>
            {showList ? '▾' : '▸'} 登録済み {cards.length} 枚
          </div>
          {showList && (
            <ul style={list}>
              {[...cards].sort((a, b) => (a.due < b.due ? -1 : 1)).map((c) => (
                <li key={c.id} style={listItem}>
                  <span style={{ flex: 1, minWidth: 0 }}>{c.q}</span>
                  <span style={dueText}>次回 {formatMonthDay(c.due)}</span>
                  <button style={delBtn} onClick={() => removeCard(c.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div style={hint}>出題間隔：1日 → 3日 → 7日 → 14日 → 30日 → 60日。思い出せなかったら翌日から。</div>
    </section>
  )
}

// ── styles ──────────────────────────────────────────────
const card = {
  background: '#FFFFFF', border: '1px solid #E7E1D3', borderRadius: 12,
  padding: '16px 16px 18px', marginBottom: 14,
}
const titleRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }
const cardTitle = { fontSize: 12, color: '#8C8574', letterSpacing: 1 }
const countText = { fontSize: 12, color: '#8C8574' }
const quizBox = {
  background: '#FAF8F3', border: '1px solid #E7E1D3', borderRadius: 10, padding: '14px 14px 12px', marginBottom: 6,
}
const remainingText = { fontSize: 11, color: '#A9A08D', marginBottom: 6 }
const questionText = { fontSize: 16, fontWeight: 700, color: '#2B2620', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }
const answerText = {
  fontSize: 15, color: '#2B2620', lineHeight: 1.5, padding: '10px 0 12px', marginBottom: 10,
  borderTop: '1px dashed #D8CFBB', whiteSpace: 'pre-wrap',
}
const recallHint = { fontSize: 11, color: '#A9A08D', marginBottom: 8 }
const baseBtn = { flex: 1, borderRadius: 8, fontSize: 14, padding: '11px', cursor: 'pointer', fontFamily: 'inherit' }
const revealBtn = { ...baseBtn, width: '100%', background: '#2B2620', border: 'none', color: '#FFFFFF', fontWeight: 700 }
const okBtn = { ...baseBtn, background: '#2E8B67', border: 'none', color: '#FFFFFF', fontWeight: 700 }
const failBtn = { ...baseBtn, background: 'transparent', border: '1px solid #E7E1D3', color: '#B23B3B' }
const emptyText = { fontSize: 13, color: '#8C8574', textAlign: 'center', padding: '10px 0 8px', lineHeight: 1.6 }
const toggleRow = { fontSize: 13, color: '#5C5648', padding: '8px 2px', cursor: 'pointer', marginTop: 4 }
const addBox = { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }
const textarea = {
  width: '100%', background: '#FAF8F3', border: '1px solid #E7E1D3', borderRadius: 8, resize: 'vertical',
  color: '#2B2620', fontSize: 14, padding: '9px 11px', fontFamily: 'inherit', outline: 'none',
}
const addBtn = {
  background: '#2B2620', border: 'none', borderRadius: 8, color: '#FFFFFF',
  fontSize: 13, fontWeight: 700, padding: '10px', cursor: 'pointer', fontFamily: 'inherit',
}
const list = { listStyle: 'none', marginBottom: 6 }
const listItem = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A4438',
  padding: '6px 0', borderBottom: '1px solid #EDE7D9',
}
const dueText = { fontSize: 11, color: '#A9A08D', flexShrink: 0 }
const delBtn = { background: 'none', border: 'none', color: '#B8AF9C', fontSize: 15, cursor: 'pointer' }
const hint = { fontSize: 11, color: '#A9A08D', marginTop: 10, lineHeight: 1.6 }
