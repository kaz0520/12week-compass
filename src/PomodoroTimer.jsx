import { useEffect, useRef, useState } from 'react'

// 『学び方の学び方』一：25分集中し、休み時間をつくる
const FOCUS_MIN = 25
const BREAK_MIN = 5
const SESSION_KEY = 'compass-pomodoro'
const BASE_TITLE = '12週間コンパス'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function PomodoroTimer({ tasks, todayCount, disabled, onFocusComplete }) {
  // session: { mode: 'focus' | 'break', endAt: number, taskIndex: number }
  // 終了時刻で管理するので、画面を閉じたりリロードしても続きから計測できる
  const [session, setSession] = useState(loadSession)
  const [now, setNow] = useState(Date.now)
  const [taskIndex, setTaskIndex] = useState(-1)
  const [message, setMessage] = useState('')
  const audioRef = useRef(null)
  const finishedRef = useRef(null)

  const startSession = (next) => {
    saveSession(next)
    setSession(next)
    setNow(Date.now())
  }

  const beep = () => {
    try {
      const ctx = audioRef.current
      if (ctx) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1.2)
      }
      navigator.vibrate?.([200, 100, 200])
    } catch {}
  }

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])

  useEffect(() => {
    if (!session || now < session.endAt) return
    if (finishedRef.current === session.endAt) return
    finishedRef.current = session.endAt
    beep()
    if (session.mode === 'focus') {
      onFocusComplete(tasks[session.taskIndex])
      // 集中のあとは自動で休憩に入る（離れていた場合は終了時刻から起算）
      startSession({ mode: 'break', endAt: session.endAt + BREAK_MIN * 60000, taskIndex: session.taskIndex })
      setMessage('お疲れさま。記録しました。休憩しましょう')
    } else {
      startSession(null)
      setMessage('休憩終了')
    }
  }, [session, now])

  useEffect(() => {
    document.title = session
      ? `${session.mode === 'focus' ? '集中' : '休憩'} ${formatRemaining(session.endAt - now)}`
      : BASE_TITLE
  }, [session, now])

  const start = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (Ctx && !audioRef.current) audioRef.current = new Ctx()
      audioRef.current?.resume()
    } catch {}
    setMessage('')
    startSession({ mode: 'focus', endAt: Date.now() + FOCUS_MIN * 60000, taskIndex })
  }

  const stop = () => {
    startSession(null)
    setMessage(session?.mode === 'focus' ? '中断しました（記録されません）' : '')
  }

  const remaining = session ? session.endAt - now : FOCUS_MIN * 60000
  const total = (session?.mode === 'break' ? BREAK_MIN : FOCUS_MIN) * 60000
  const progress = session ? 1 - remaining / total : 0
  const sessionTask = session && tasks[session.taskIndex]

  return (
    <section style={card}>
      <div style={titleRow}>
        <span style={cardTitle}>ポモドーロ</span>
        <span style={countText}>今日 <b style={{ color: '#2B2620' }}>{todayCount}</b> 回</span>
      </div>

      <div style={timerBox}>
        <div style={modeLabel}>
          {session ? (session.mode === 'focus' ? '集中' : '休憩') : `${FOCUS_MIN}分集中 → ${BREAK_MIN}分休憩`}
        </div>
        <div style={{ ...timerText, color: session?.mode === 'break' ? '#2E8B67' : '#2B2620' }}>
          {formatRemaining(remaining)}
        </div>
        <div style={progressTrack}>
          <div style={{ ...progressBar, width: `${Math.min(100, progress * 100)}%`, background: session?.mode === 'break' ? '#2E8B67' : '#2B2620' }} />
        </div>
        {sessionTask && session.mode === 'focus' && <div style={sessionTaskText}>{sessionTask}</div>}
      </div>

      {!session && (
        <select style={select} value={taskIndex} onChange={(e) => setTaskIndex(Number(e.target.value))}>
          <option value={-1}>（タスクを選ばない）</option>
          {tasks.map((t, i) => <option key={i} value={i}>{t}</option>)}
        </select>
      )}

      {session ? (
        <button style={secondaryBtn} onClick={stop}>{session.mode === 'focus' ? 'やめる' : '休憩を終える'}</button>
      ) : (
        <button style={{ ...primaryBtn, ...(disabled ? disabledBtn : {}) }} onClick={start} disabled={disabled}>
          集中をはじめる
        </button>
      )}

      {message && <div style={messageText}>{message}</div>}
      {!session && (
        <div style={hint}>集中中は他のことをしない。終わると「できた証拠」に自動で記録されます。</div>
      )}
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
const timerBox = { textAlign: 'center', padding: '4px 0 14px' }
const modeLabel = { fontSize: 12, color: '#8C8574', marginBottom: 4 }
const timerText = { fontSize: 48, fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }
const progressTrack = { height: 4, background: '#EDE7D9', borderRadius: 2, margin: '10px 0 0', overflow: 'hidden' }
const progressBar = { height: '100%', transition: 'width 1s linear' }
const sessionTaskText = { fontSize: 13, color: '#5C5648', marginTop: 8 }
const select = {
  width: '100%', background: '#FAF8F3', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#2B2620', fontSize: 14, padding: '9px 11px', fontFamily: 'inherit', marginBottom: 10, outline: 'none',
}
const primaryBtn = {
  width: '100%', background: '#2B2620', border: 'none', borderRadius: 8, color: '#FFFFFF',
  fontSize: 15, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
}
const disabledBtn = { opacity: 0.4, cursor: 'default' }
const secondaryBtn = {
  width: '100%', background: 'transparent', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#756E5F', fontSize: 14, padding: '11px', cursor: 'pointer', fontFamily: 'inherit',
}
const messageText = { fontSize: 12, color: '#2E8B67', textAlign: 'center', marginTop: 10 }
const hint = { fontSize: 11, color: '#A9A08D', marginTop: 10, lineHeight: 1.6 }
