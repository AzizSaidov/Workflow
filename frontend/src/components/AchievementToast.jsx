import { useEffect, useState } from 'react'

const CARD_HEIGHT = 92
const GAP = 10
const DURATION = 5500

export default function AchievementToast({ achievement, index, onClose }) {
  const [phase, setPhase] = useState('enter') // enter | visible | exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 20)
    const t2 = setTimeout(() => setPhase('exit'), DURATION)
    const t3 = setTimeout(onClose, DURATION + 420)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const bottom = 28 + index * (CARD_HEIGHT + GAP)

  const slideStyle = phase === 'enter'
    ? { transform: 'translateX(120%)', opacity: 0 }
    : phase === 'exit'
      ? { transform: 'translateX(120%)', opacity: 0 }
      : { transform: 'translateX(0)', opacity: 1 }

  const color = achievement.color || '#7F77DD'

  return (
    <>
      <style>{`
        @keyframes ach-shine {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          50%  { opacity: 0.5; }
          100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
        }
        @keyframes ach-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div
        onClick={() => { setPhase('exit'); setTimeout(onClose, 420) }}
        style={{
          position: 'fixed',
          bottom,
          right: 28,
          zIndex: 99999,
          width: 320,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #111120 0%, #18182c 100%)',
          border: `1px solid ${color}44`,
          boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${color}22, 0 0 24px ${color}18`,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s cubic-bezier(0.22,1,0.36,1), bottom 0.3s ease',
          ...slideStyle,
        }}
      >
        {/* Top color border */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }} />

        {/* Shine sweep */}
        {phase === 'visible' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
              background: `linear-gradient(90deg, transparent, ${color}18, transparent)`,
              animation: 'ach-shine 0.7s ease-out 0.1s both',
            }} />
          </div>
        )}

        <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Icon badge */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `${color}18`,
            border: `1.5px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${color}30`,
          }}>
            <i className={`ti ti-${achievement.icon || 'trophy'}`} style={{ fontSize: 24, color }} />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: color,
              letterSpacing: '1.2px', textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 3,
            }}>
              Достижение получено
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
              color: '#fff', lineHeight: 1.2, marginBottom: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {achievement.name}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.5)',
              fontFamily: 'DM Sans, sans-serif', lineHeight: 1.35,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {achievement.description}
            </div>
          </div>

          {/* Points badge */}
          {achievement.points > 0 && (
            <div style={{
              flexShrink: 0,
              background: `${color}22`,
              border: `1px solid ${color}44`,
              borderRadius: 8,
              padding: '4px 8px',
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13,
              color,
            }}>
              +{achievement.points}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ margin: '10px 14px 0', height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1 }}>
          {phase === 'visible' && (
            <div style={{
              height: '100%', borderRadius: 1,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              animation: `ach-progress ${DURATION}ms linear forwards`,
            }} />
          )}
        </div>
        <div style={{ height: 10 }} />
      </div>
    </>
  )
}
