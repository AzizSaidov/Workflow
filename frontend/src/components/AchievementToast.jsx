import { useEffect, useState } from 'react'

export default function AchievementToast({ achievement, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    const t1 = setTimeout(() => setVisible(true), 10)
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 400)
    }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <>
      <style>{`
        @keyframes achievSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes achievSlideOut {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
        @keyframes achievProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9999,
        width: 320,
        borderRadius: 18,
        background: 'var(--bg-card)',
        border: '1px solid rgba(127,119,221,0.4)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(127,119,221,0.15)',
        overflow: 'hidden',
        animation: visible
          ? 'achievSlideIn 0.4s ease-out forwards'
          : 'achievSlideOut 0.4s ease-in forwards',
      }}>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif',
            }}>
              Достижение получено
            </span>
            <button
              onClick={() => { setVisible(false); setTimeout(onClose, 400) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
                padding: '0 2px', display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ×
            </button>
          </div>

          {/* Middle row: icon + text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: `${achievement.color}22`,
              border: `1.5px solid ${achievement.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`ti ti-${achievement.icon}`} style={{ fontSize: 22, color: achievement.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2,
              }}>
                {achievement.name}
              </div>
              <div style={{
                fontSize: 12, color: 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {achievement.description}
              </div>
            </div>
          </div>

          {/* Points row */}
          {achievement.points > 0 && (
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
              color: achievement.color,
            }}>
              +{achievement.points} очков
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%',
            background: achievement.color,
            animation: 'achievProgress 5s linear forwards',
          }} />
        </div>
      </div>
    </>
  )
}
