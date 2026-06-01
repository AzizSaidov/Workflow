import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { chatsApi } from '../api/chats'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'

const STATUS_LABEL = {
  in_progress: { label: 'В работе', color: 'amber' },
  delivered: { label: 'Сдан', color: 'purple' },
}

function ChatRoomCard({ project, user, lastMessages }) {
  const isClient = project.client_id === user?.id
  const lastMsg = lastMessages[project.id]
  const st = STATUS_LABEL[project.status] || { label: project.status, color: 'muted' }

  return (
    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 16,
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(4px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
      >
        {/* Icon */}
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: 'rgba(127,119,221,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <i className="ti ti-message-circle" style={{ fontSize: 22, color: 'var(--accent)' }} />
          {/* Online indicator */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 12, height: 12, borderRadius: '50%',
            background: 'var(--accent-green)',
            border: '2px solid var(--bg)',
          }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {project.title}
            </div>
            {lastMsg && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(lastMsg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
              {lastMsg ? (
                <>
                  <span style={{ color: lastMsg.sender_id === user?.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {lastMsg.sender_id === user?.id ? 'Вы' : isClient ? 'Исполнитель' : 'Заказчик'}:
                  </span>
                  {' '}{lastMsg.content}
                </>
              ) : (
                <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Сообщений пока нет</span>
              )}
            </div>
            <Tag color={st.color} style={{ flexShrink: 0 }}>{st.label}</Tag>
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <i className="ti ti-currency-dollar" style={{ fontSize: 11, marginRight: 4 }} />
            {Number(project.budget_min).toLocaleString()} – {Number(project.budget_max).toLocaleString()} TJS
            <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
            <i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 4 }} />
            {new Date(project.created_at).toLocaleDateString('ru-RU')}
          </div>
        </div>

        {/* Arrow */}
        <i className="ti ti-chevron-right" style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>
    </Link>
  )
}

export default function ChatsPage() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [lastMessages, setLastMessages] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.getMine()
      .then(async r => {
        const all = r.data || []
        const active = all.filter(p => ['in_progress', 'delivered'].includes(p.status))
        setProjects(active)

        // Load last message for each
        const msgs = {}
        await Promise.all(active.map(async p => {
          try {
            const hist = await chatsApi.getHistory(p.id)
            const history = hist.data || []
            if (history.length > 0) {
              msgs[p.id] = history[history.length - 1]
            }
          } catch {}
        }))
        setLastMessages(msgs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container page-enter" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'rgba(127,119,221,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-messages" style={{ fontSize: 22, color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                Чаты
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Переписка по активным проектам
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{
                padding: '6px 14px', borderRadius: 10,
                background: projects.length > 0 ? 'rgba(127,119,221,0.1)' : 'transparent',
                border: `0.5px solid ${projects.length > 0 ? 'rgba(127,119,221,0.25)' : 'var(--border)'}`,
                fontSize: 13, color: 'var(--accent)', fontWeight: 600,
              }}>
                {projects.length} активных
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 16, border: '0.5px solid var(--border)', padding: '16px 20px', display: 'flex', gap: 16 }}>
                  <div className="skeleton" style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 12, width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(127,119,221,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <i className="ti ti-message-off" style={{ fontSize: 36, color: 'var(--text-muted)', opacity: 0.4 }} />
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Нет активных чатов
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                Чаты открываются когда проект переходит в статус «В работе». Прими заявку или подай её на интересный проект.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {user?.role === 'client' ? (
                  <Link to="/projects/new">
                    <button className="btn btn-primary">
                      <i className="ti ti-plus" style={{ fontSize: 14 }} />
                      Создать проект
                    </button>
                  </Link>
                ) : (
                  <Link to="/projects">
                    <button className="btn btn-primary">
                      <i className="ti ti-search" style={{ fontSize: 14 }} />
                      Найти проекты
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => (
                <ChatRoomCard
                  key={p.id}
                  project={p}
                  user={user}
                  lastMessages={lastMessages}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
