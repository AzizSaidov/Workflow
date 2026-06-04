import { useEffect, useRef, useState } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { notificationsApi, createNotifWS } from '../api/notifications'
import AchievementToast from './AchievementToast'

export default function NotificationBell() {
  const { user, accessToken } = useAuthStore()
  const { isDark } = useThemeStore()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [achievementToast, setAchievementToast] = useState(null)
  const wsRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!accessToken) return
    notificationsApi.getAll().then(r => {
      const list = r.data || []
      setNotifs(list)
      setUnread(list.filter(n => !n.is_read).length)
    }).catch(() => {})
  }, [accessToken])

  useEffect(() => {
    if (!user?.id || !accessToken) return
    const ws = createNotifWS(user.id, accessToken)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const n = JSON.parse(e.data)
        if (n.type === 'achievement' || n.notification_type === 'achievement') {
          setAchievementToast({
            name: n.title?.replace('Новое достижение: ', '') || n.title,
            description: n.message,
            icon: n.icon || 'trophy',
            color: n.color || '#7F77DD',
            points: n.points || 0,
          })
        }
        setNotifs(prev => {
          if (prev.find(x => x.id === n.id)) return prev
          return [n, ...prev]
        })
        if (!n.is_read) setUnread(c => c + 1)
      } catch {}
    }
    return () => ws.close()
  }, [user?.id, accessToken])

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleRead = async (id) => {
    await notificationsApi.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const TYPE_ICON = {
    bid_received: 'ti-send',
    bid_accepted: 'ti-circle-check',
    bid_rejected: 'ti-circle-x',
    project_delivered: 'ti-package',
    payment_received: 'ti-wallet',
    project_disputed: 'ti-alert-triangle',
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {achievementToast && (
        <AchievementToast
          achievement={achievementToast}
          onClose={() => setAchievementToast(null)}
        />
      )}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
          color: 'var(--text-secondary)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <i className="ti ti-bell" style={{ fontSize: 20 }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid var(--bg)`,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 340,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          zIndex: 300, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Уведомления</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Прочитать все
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="ti ti-bell-off" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>Уведомлений нет</div>
              </div>
            ) : (
              notifs.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleRead(n.id)}
                  style={{
                    padding: '12px 18px',
                    borderBottom: '0.5px solid var(--border)',
                    cursor: n.is_read ? 'default' : 'pointer',
                    background: n.is_read ? 'transparent' : (isDark ? 'rgba(127,119,221,0.05)' : 'rgba(80,72,213,0.04)'),
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.09)' : 'rgba(80,72,213,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : (isDark ? 'rgba(127,119,221,0.05)' : 'rgba(80,72,213,0.04)') }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${TYPE_ICON[n.type] || 'ti-bell'}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
