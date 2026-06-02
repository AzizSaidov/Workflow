import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import Rating from './Rating'

export default function FreelancerCard({ freelancer, isFavorited, onFavoriteToggle }) {
  const { user_id, full_name, avatar_url, title, rating, reviews_count, skills, hourly_rate, total_jobs } = freelancer

  return (
    <Link to={`/profile/${user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 18,
        padding: '22px',
        display: 'flex', flexDirection: 'column', gap: 16,
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        position: 'relative',
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
        {/* Heart button */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle() }}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: isFavorited ? '#F87171' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
              zIndex: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = isFavorited ? '#F87171' : 'var(--text-muted)'}
          >
            <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 17 }} />
          </button>
        )}

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar src={avatar_url} name={full_name} size={52} online={freelancer.is_online ?? false} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
              color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginBottom: 3,
            }}>
              {full_name}
            </div>
            {title && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <i key={i} className={`ti ti-star${i < Math.round(rating) ? '-filled' : ''}`}
                  style={{ fontSize: 13, color: i < Math.round(rating) ? '#FBBF24' : 'var(--border)' }} />
              ))}
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {Number(rating).toFixed(1)}
            </span>
            {reviews_count > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({reviews_count} отзывов)</span>
            )}
          </div>
        )}

        {/* Skills */}
        {skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skills.slice(0, 3).map(s => (
              <span key={s} style={{
                fontSize: 11.5, fontWeight: 500, color: 'var(--accent)',
                background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.2)',
                padding: '3px 10px', borderRadius: 20,
              }}>
                {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span style={{
                fontSize: 11.5, color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
                padding: '3px 10px', borderRadius: 20,
              }}>
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'var(--border)' }} />

        {/* Rate + jobs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {hourly_rate ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', lineHeight: 1 }}>
                {Number(hourly_rate).toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/час</span>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ставка не указана</span>
          )}

          {total_jobs > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-briefcase" style={{ fontSize: 12 }} />
              {total_jobs} работ
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
