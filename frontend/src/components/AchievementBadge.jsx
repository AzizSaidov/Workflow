import { useState } from 'react'

export default function AchievementBadge({ achievement, earned = false, earnedAt = null, size = 'md' }) {
  const [hovered, setHovered] = useState(false)
  const { name, description, icon, color, points } = achievement

  const dim = size === 'sm' ? 40 : size === 'lg' ? 64 : 52
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: dim, height: dim, borderRadius: '50%',
        background: earned
          ? `radial-gradient(circle at 35% 35%, ${color}33, ${color}15)`
          : 'rgba(255,255,255,0.04)',
        border: `2px solid ${earned ? color : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hovered && earned ? `0 0 16px ${color}44` : 'none',
        opacity: earned ? 1 : 0.35,
        filter: earned ? 'none' : 'grayscale(1)',
        position: 'relative',
      }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: iconSize, color: earned ? color : 'var(--text-muted)' }} />

        {earned && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: color, color: '#fff',
            fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif',
            borderRadius: 8, padding: '1px 5px',
            border: '1.5px solid var(--bg)',
            whiteSpace: 'nowrap',
          }}>
            +{points}
          </div>
        )}
      </div>

      {hovered && (
        <div style={{
          position: 'absolute', bottom: dim + 10, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)',
          border: `0.5px solid ${earned ? color + '44' : 'var(--border)'}`,
          borderRadius: 10, padding: '10px 12px',
          minWidth: 160, maxWidth: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 50,
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: earned ? color : 'var(--text-muted)', marginBottom: 4 }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {description}
          </div>
          {earnedAt && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, opacity: 0.7 }}>
              {new Date(earnedAt).toLocaleDateString('ru-RU')}
            </div>
          )}
          {!earned && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, opacity: 0.5 }}>
              Не получена
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            width: 8, height: 8, background: 'var(--bg-card)',
            border: `0.5px solid ${earned ? color + '44' : 'var(--border)'}`,
            borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />
        </div>
      )}
    </div>
  )
}
