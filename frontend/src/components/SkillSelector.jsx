import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/categories'
import Tag from './Tag'

export default function SkillSelector({ value = [], onChange, categorySlug }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!categorySlug) { setSkills([]); return }
    setLoading(true)
    categoriesApi.getSkills(categorySlug)
      .then(r => setSkills(r.data || []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false))
  }, [categorySlug])

  const toggle = (skill) => {
    const exists = value.find(s => s.id === skill.id)
    onChange(exists ? value.filter(s => s.id !== skill.id) : [...value, skill])
  }

  if (!categorySlug) return (
    <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
      Сначала выберите категорию
    </p>
  )

  if (loading) return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ height: 24, width: 80, borderRadius: 20, background: 'var(--border)', opacity: 0.5 }} />
      ))}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {skills.map(skill => {
          const selected = !!value.find(s => s.id === skill.id)
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggle(skill)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
                cursor: 'pointer', border: 'none',
                background: selected
                  ? 'rgba(127,119,221,0.2)'
                  : 'rgba(127,119,221,0.06)',
                color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                outline: selected ? '1px solid rgba(127,119,221,0.4)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {selected && <i className="ti ti-check" style={{ fontSize: 11 }} />}
              {skill.name}
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Выбрано:</span>
          {value.map(s => (
            <Tag key={s.id} color="purple" style={{ cursor: 'pointer' }} onClick={() => toggle(s)}>
              {s.name} ×
            </Tag>
          ))}
        </div>
      )}
    </div>
  )
}
