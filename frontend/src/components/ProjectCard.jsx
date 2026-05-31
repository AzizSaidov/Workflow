import { Link } from 'react-router-dom'
import Card from './Card'
import Tag from './Tag'

export default function ProjectCard({ project }) {
  const { id, title, description, budget_min, budget_max, status, category, created_at } = project

  return (
    <Link to={`/projects/${id}`} style={{ textDecoration: 'none' }}>
      <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
            {title}
          </h3>
          <Tag status={status || 'open'} />
        </div>

        {description && (
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
            {Number(budget_min).toLocaleString()} – {Number(budget_max).toLocaleString()} TJS
          </span>
          {category && <Tag color="purple">{category}</Tag>}
        </div>

        {created_at && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-clock" />
            {new Date(created_at).toLocaleDateString('ru-RU')}
          </div>
        )}
      </Card>
    </Link>
  )
}
