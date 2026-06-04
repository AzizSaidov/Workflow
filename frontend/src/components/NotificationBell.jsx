import { useEffect, useRef, useState } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { notificationsApi, createNotifWS } from '../api/notifications'
import AchievementToast from './AchievementToast'

const TYPE_CONFIG = {
  bid_received:      { icon: 'send',           color: '#7F77DD', bg: 'rgba(127,119,221,0.15)' },
  new_bid:           { icon: 'send',           color: '#7F77DD', bg: 'rgba(127,119,221,0.15)' },
  bid_accepted:      { icon: 'circle-check',   color: '#1D9E75', bg: 'rgba(29,158,117,0.15)'  },
  bid_rejected:      { icon: 'circle-x',       color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  payment_received:  { icon: 'wallet',         color: '#1D9E75', bg: 'rgba(29,158,117,0.15)'  },
  project_completed: { icon: 'trophy',         color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  project_disputed:  { icon: 'alert-triangle', color: '#F97316', bg: 'rgba(249,115,22,0.15)'  },
  project_delivered: { icon: 'package',        color: '#5DCAA5', bg: 'rgba(93,202,165,0.15)'  },
  achievement:       { icon: 'award',          color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
}

const DEFAULT_TYPE = { icon: 'bell', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.07)' }

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || DEFAULT_TYPE
}

function groupNotifs(list) {
  const now = new Date()
  const todayStr = now.toDateString()
  const yestStr = new Date(now - 86400000).toDateString()
  const groups = []
  const buckets = { today: [], yesterday: [], earlier: [] }

  list.forEach(n => {
    const d = new Date(n.created_at).toDateString()
    if (d === todayStr) buckets.today.push(n)
    else if (d === yestStr) buckets.yesterday.push(n)
    else buckets.earlier.push(n)
  })

  if (buckets.today.length)    groups.push({ label: 'Сегодня',  items: buckets.today })
  if (buckets.yesterday.length) groups.push({ label: 'Вчера',   items: buckets.yesterday })
  if (buckets.earlier.length)  groups.push({ label: 'Ранее',    items: buckets.earlier })
  return groups
}

function fmtTime(iso) {
  if (!iso) return 'только что'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'только что'
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1)  return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

function SkeletonItem() {
  return (
    <div style={{ padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0, animation: 'pulse 1.4s ease infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ height: 11, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease infinite' }} />
        <div style={{ height: 10, width: '85%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease infinite 0.2s' }} />
      </div>
    </div>
  )
}

export default function NotificationBell() {
  const { user, accessToken } = useAuthStore()
  const { isDark } = useThemeStore()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [achievementToast, setAchievementToast] = useState(null)
  const wsRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    notificationsApi.getAll().then(r => {
      const list = r.data || []
      setNotifs(list)
      setUnread(list.filter(n => !n.is_read).length)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => {
    if (!user?.id || !accessToken) return
    const ws = createNotifWS(user.id, accessToken)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const n = JSON.parse(e.data)
        if (!n.id) return  // skip control messages (init_done, etc.)
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

  const handleRead = async (n) => {
    if (n.is_read) return
    await notificationsApi.markRead(n.id)
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const groups = groupNotifs(notifs.slice(0, 30))

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {achievementToast && (
        <AchievementToast achievement={achievementToast} onClose={() => setAchievementToast(null)} />
      )}

      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
          color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = open ? 'var(--text-primary)' : 'var(--text-secondary)'}
      >
        <i className="ti ti-bell" style={{ fontSize: 20 }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#F87171', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: `2px solid var(--bg)`,
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0,
          width: 368,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 18,
          boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.14)',
          zIndex: 300, overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '0.5px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                Уведомления
              </span>
              {unread > 0 && (
                <span style={{
                  background: 'rgba(127,119,221,0.15)', color: 'var(--accent)',
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                  border: '0.5px solid rgba(127,119,221,0.25)',
                }}>
                  {unread} новых
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{
                fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                borderRadius: 7, transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className="ti ti-checks" style={{ fontSize: 13 }} />
                Прочитать все
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>

            {/* Skeleton */}
            {loading && (
              <>
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
              </>
            )}

            {/* Empty */}
            {!loading && notifs.length === 0 && (
              <div style={{ padding: '44px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="ti ti-bell-off" style={{ fontSize: 26, color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Пока тихо</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Здесь будут уведомления о заявках, оплатах и достижениях
                </div>
              </div>
            )}

            {/* Grouped list */}
            {!loading && groups.map(group => (
              <div key={group.label}>
                {/* Group label */}
                <div style={{
                  padding: '8px 18px 5px',
                  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.8,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderBottom: '0.5px solid var(--border)',
                }}>
                  {group.label}
                </div>

                {group.items.map(n => {
                  const cfg = getTypeConfig(n.type)
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleRead(n)}
                      style={{
                        padding: '11px 18px',
                        borderBottom: '0.5px solid var(--border)',
                        cursor: n.is_read ? 'default' : 'pointer',
                        background: n.is_read
                          ? 'transparent'
                          : isDark ? 'rgba(127,119,221,0.04)' : 'rgba(59,91,219,0.03)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.08)' : 'rgba(59,91,219,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : (isDark ? 'rgba(127,119,221,0.04)' : 'rgba(59,91,219,0.03)') }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: cfg.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`ti ti-${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: n.is_read ? 400 : 600,
                          color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                          marginBottom: 3, lineHeight: 1.3,
                        }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>
                          {fmtTime(n.created_at)}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!n.is_read && (
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: 'var(--accent)', flexShrink: 0, marginTop: 5,
                          boxShadow: '0 0 6px rgba(127,119,221,0.5)',
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
