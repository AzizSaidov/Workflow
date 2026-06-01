import { useEffect, useState } from 'react'
import useToastStore from '../store/toastStore'

const ICONS = {
  success: 'circle-check',
  error: 'circle-x',
  info: 'info-circle',
}

const COLORS = {
  success: { bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)', icon: '#1D9E75', text: '#5DCAA5' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '#F87171', text: '#F87171' },
  info:    { bg: 'rgba(127,119,221,0.12)', border: 'rgba(127,119,221,0.3)', icon: '#7F77DD', text: '#AFA9EC' },
}

function ToastItem({ toast, onHide }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const c = COLORS[toast.type] || COLORS.info

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10)
    const t2 = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onHide(toast.id), 300)
    }, 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px',
        background: c.bg,
        border: `0.5px solid ${c.border}`,
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        minWidth: 240, maxWidth: 340,
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(24px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => {
        setLeaving(true)
        setTimeout(() => onHide(toast.id), 300)
      }}
    >
      <i
        className={`ti ti-${ICONS[toast.type] || 'info-circle'}`}
        style={{ fontSize: 17, color: c.icon, flexShrink: 0 }}
      />
      <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </div>
  )
}

export default function Toast() {
  const { toasts, hide } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onHide={hide} />
        </div>
      ))}
    </div>
  )
}
