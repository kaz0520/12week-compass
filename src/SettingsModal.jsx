import { useRef, useState } from 'react'
import { exportBackup, importBackup } from './storage'

const MAX_TASKS = 6
const MIN_TASKS = 1

export default function SettingsModal({ settings, onSave, onClose, onImport }) {
  const [goal, setGoal] = useState(settings.goal)
  const [startDate, setStartDate] = useState(settings.startDate)
  const [tasks, setTasks] = useState([...settings.tasks])
  const [backupMsg, setBackupMsg] = useState('')
  const fileInputRef = useRef(null)

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

  const handleExport = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `12week-compass-backup-${startDate}.json`,
    })
    a.click()
    URL.revokeObjectURL(url)
    setBackupMsg('書き出しました')
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = importBackup(reader.result)
        onImport(data)
        setGoal(data.settings.goal)
        setStartDate(data.settings.startDate)
        setTasks([...data.settings.tasks])
        setBackupMsg('読み込みました')
      } catch {
        setBackupMsg('読み込みに失敗しました（ファイル形式を確認してください）')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: '#756E5F', marginBottom: 16 }}>設定</div>

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

        <div style={backupBox}>
          <label style={label}>バックアップ</label>
          <div style={{ fontSize: 11, color: '#8C8574', marginBottom: 8 }}>
            データはこの端末のブラウザ内にのみ保存されます。消失に備えて定期的にファイルへ書き出すことをおすすめします。
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={backupBtn} onClick={handleExport}>書き出す</button>
            <button style={backupBtn} onClick={() => fileInputRef.current?.click()}>読み込む</button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
          {backupMsg && <div style={{ fontSize: 11, color: '#756E5F', marginTop: 6 }}>{backupMsg}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={cancelBtn} onClick={onClose}>キャンセル</button>
          <button style={saveBtn} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(43,38,32,0.4)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
}
const panel = {
  width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: '16px 16px 0 0',
  padding: '22px 20px 26px', boxShadow: '0 -4px 24px rgba(43,38,32,0.15)',
}
const label = { display: 'block', fontSize: 12, color: '#8C8574', marginBottom: 6, marginTop: 14 }
const input = {
  width: '100%', background: '#FAF8F3', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#2B2620', fontSize: 15, padding: '10px 12px', fontFamily: 'inherit',
  marginBottom: 4, boxSizing: 'border-box', outline: 'none',
}
const smallBtn = {
  width: 40, background: '#FAF8F3', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#8C8574', fontSize: 16, cursor: 'pointer',
}
const addBtn = {
  width: '100%', background: 'transparent', border: '1px dashed #D8CFBB', borderRadius: 8,
  color: '#8C8574', fontSize: 13, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2,
}
const cancelBtn = {
  flex: 1, background: 'transparent', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#756E5F', fontSize: 15, padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
}
const saveBtn = {
  flex: 1, background: '#2B2620', border: 'none', borderRadius: 8,
  color: '#FFFFFF', fontSize: 15, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
}
const backupBox = { marginTop: 18, paddingTop: 14, borderTop: '1px solid #EDE7D9' }
const backupBtn = {
  flex: 1, background: 'transparent', border: '1px solid #E7E1D3', borderRadius: 8,
  color: '#5C5648', fontSize: 13, padding: '9px', cursor: 'pointer', fontFamily: 'inherit',
}
