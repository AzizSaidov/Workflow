import { Link } from 'react-router-dom'
import Card from './Card'
import Avatar from './Avatar'
import Rating from './Rating'
import Tag from './Tag'

export default function FreelancerCard({ freelancer }) {
  const { user_id, full_name, avatar_url, title, rating, reviews_count, skills, hourly_rate } = freelancer

  return (
    <Link to={`/profile/${user_id}`} style={{ textDecoration: 'none' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={avatar_url} name={full_name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {full_name}
            </div>
            {title && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </div>
            )}
          </div>
        </div>

        {rating > 0 && <Rating value={rating} count={reviews_count} />}

        {skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skills.slice(0, 3).map((s) => (
              <Tag key={s} color="purple">{s}</Tag>
            ))}
            {skills.length > 3 && (
              <Tag color="muted">+{skills.length - 3}</Tag>
            )}
          </div>
        )}

        {hourly_rate && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-currency-dollar" style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--accent-green)' }}>
              {Number(hourly_rate).toLocaleString()}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>TJS/час</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
