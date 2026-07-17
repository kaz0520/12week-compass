import { useState } from 'react'

const MAX_TASKS = 6
const MIN_TASKS = 1

export default function SettingsModal({ settings, onSave, onClose }) {
  const [goal, setGoal] = useState(settings.goal)
  const [startDate, setStartDate] = useState(settings.startDate)
  const [tasks, setTasks] = useState([...settings.tasks])

  const updateTask = (i, value) => {
    const next = [...tasks]
    next[i] = value
    setTasks(next)
  }
  const addTask = () => tasks.length < MAX_TASKS && setTasks([...tasks, ''])
  const removeTask = (i) => tasks.length > MIN_TASKS && setTasks(tasks.filter((_, idx) => idx !== i))

  const save = () => {
    const cleanTasks = tasks.map((t) => t.trim()).filter(Boolean)
    onSave({
      goal: goal.trim() || settings.goal,
      startDate,
      tasks: cleanTasks.length ? cleanTasks : settings.tasks,
    })
  }

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: '#8A8377', marginBottom: 16 }}>設定</div>

        <label style={label}>12週間の目標</label>
        <input style={input} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例：子どもを見る目を鍛える" />

        <label style={label}>開始日</label>
        <input style={input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label style={label}>今日やること（タップして編集）</label>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={{ ...input, marginBottom: 0, flex: 1 }} value={t} onChange={(e) => updateTask(i, e.target.value)} />
            <button style={smallBtn} onClick={() => removeTask(i)} disabled={tasks.length <= MIN_TASKS}>×</button>
          </div>
        ))}
        {tasks.length < MAX_TASKS && (
          <button style={addBtn} onClick={addTask}>＋ タスクを追加</button>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={cancelBtn} onClick={onClose}>キャンセル</button>
          <button style={saveBtn} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
}
const panel = {
  width: '100%', maxWidth: 480, background: '#161412', borderRadius: '16px 16px 0 0',
  padding: '22px 20px 26px', boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
}
const label = { display: 'block', fontSize: 12, color: '#8A8377', marginBottom: 6, marginTop: 14 }
const input = {
  width: '100%', background: '#0D0D0D', border: '1px solid #2A2620', borderRadius: 8,
  color: '#EDE7DB', fontSize: 15, padding: '10px 12px', fontFamily: 'inherit',
  marginBottom: 4, boxSizing: 'border-box', outline: 'none',
}
const smallBtn = {
  width: 40, background: '#0D0D0D', border: '1px solid #2A2620', borderRadius: 8,
  color: '#8A8377', fontSize: 16, cursor: 'pointer',
}
const addBtn = {
  width: '100%', background: 'transparent', border: '1px dashed #3A352C', borderRadius: 8,
  color: '#8A8377', fontSize: 13, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2,
}
const cancelBtn = {
  flex: 1, background: 'transparent', border: '1px solid #2A2620', borderRadius: 8,
  color: '#8A8377', fontSize: 15, padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
}
const saveBtn = {
  flex: 1, background: '#E6E1D6', border: 'none', borderRadius: 8,
  color: '#0D0D0D', fontSize: 15, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
}
