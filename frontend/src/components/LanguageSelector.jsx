import { useEffect, useState } from 'react'
import client from '../api/client'

const LEVELS = [
  { value: 'basic', label: 'Базовый' },
  { value: 'conversational', label: 'Разговорный' },
  { value: 'fluent', label: 'Свободный' },
  { value: 'native', label: 'Родной' },
]

export default function LanguageSelector({ selected = [], onAdd, onRemove }) {
  const [languages, setLanguages] = useState([])
  const [langId, setLangId] = useState('')
  const [level, setLevel] = useState('conversational')

  useEffect(() => {
    client.get('/languages/').then(r => setLanguages(r.data || [])).catch(() => {})
  }, [])

  const availableLanguages = languages.filter(l => !selected.find(s => s.language_id === l.id))

  const handleAdd = () => {
    if (!langId) return
    onAdd(langId, level)
    setLangId('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {selected.map(l => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(127,119,221,0.12)',
              border: '0.5px solid rgba(127,119,221,0.25)',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-primary)' }}>{l.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {LEVELS.find(lv => lv.value === l.level)?.label}</span>
              <button onClick={() => onRemove(l.language_id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 13, lineHeight: 1, padding: 0,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={langId}
          onChange={e => setLangId(e.target.value)}
          className="input"
          style={{ flex: 1, appearance: 'none' }}
        >
          <option value="">Выберите язык</option>
          {availableLanguages.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="input"
          style={{ width: 140, appearance: 'none' }}
        >
          {LEVELS.map(lv => (
            <option key={lv.value} value={lv.value}>{lv.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!langId}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
        >
          Добавить
        </button>
      </div>
    </div>
  )
}
