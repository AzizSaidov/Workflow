import { Link } from 'react-router-dom'
import Tag from './Tag'

const TYPE_LABELS = { fixed: 'Фиксированная', hourly: 'Почасовая' }
const LEVEL_LABELS = { entry: 'Начальный', intermediate: 'Средний', expert: 'Эксперт' }

export default function ProjectCard({ project }) {
  const { id, title, description, budget_min, budget_max, status, category, created_at, project_type, experience_level, deadline } = project

  const daysAgo = created_at
    ? Math.floor((Date.now() - new Date(created_at)) / 86400000)
    : null

  const timeLabel = daysAgo === 0 ? 'Сегодня' : daysAgo === 1 ? 'Вчера' : daysAgo !== null ? `${daysAgo} дн. назад` : ''

  return (
    <Link to={`/projects/${id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 18,
        padding: '22px 22px 18px',
        height: '100%',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(127,119,221,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {category && <Tag color="purple">{category}</Tag>}
            {experience_level && <Tag color="muted">{LEVEL_LABELS[experience_level] || experience_level}</Tag>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Tag status={status || 'open'} />
          </div>
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
          color: 'var(--text-primary)', lineHeight: 1.35, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h3>

        {description && (
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontWeight: 300,
          }}>
            {description}
          </p>
        )}

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 -2px' }} />

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Бюджет
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text-primary)', lineHeight: 1 }}>
                {Number(budget_min).toLocaleString()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                {' – $'}{Number(budget_max).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {project_type && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-tag" style={{ fontSize: 11 }} />
                {TYPE_LABELS[project_type] || project_type}
              </span>
            )}
            {timeLabel && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-clock" style={{ fontSize: 11 }} />
                {timeLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
