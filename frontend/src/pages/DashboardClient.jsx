import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProjectCard from '../components/ProjectCard'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

const STATUS_TABS = [
  { key: '', label: 'Все', icon: 'list' },
  { key: 'open', label: 'Открытые', icon: 'circle-dot' },
  { key: 'in_progress', label: 'В работе', icon: 'loader-2' },
  { key: 'delivered', label: 'Сданные', icon: 'package' },
  { key: 'completed', label: 'Завершённые', icon: 'circle-check' },
]

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}18`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1 }}>
        {value ?? <span style={{ opacity: 0.3 }}>—</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function DashboardClient() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/users/me/stats').then(r => setStats(r.data)).catch(() => {})
    projectsApi.getMine().then(r => {
      setProjects(r.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = activeTab ? projects.filter(p => p.status === activeTab) : projects
  const tabCounts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key ? projects.filter(p => p.status === t.key).length : projects.length
    return acc
  }, {})

  const needsAttention = projects.filter(p => p.status === 'delivered')
  const openWithBids = projects.filter(p => p.status === 'open' && (p.bids_count || 0) > 0)
  const alertCount = needsAttention.length + openWithBids.length

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container page-enter" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={user?.avatar_url} name={user?.full_name} size={52} online />
                {alertCount > 0 && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#EF9F27', color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg)',
                  }}>
                    {alertCount}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Кабинет заказчика
                </p>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {user?.full_name}
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/freelancers">
                <Button variant="outline" icon="users">Найти таланты</Button>
              </Link>
              <Link to="/projects/new">
                <Button variant="primary" icon="plus">Новый проект</Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            <StatCard icon="briefcase" label="Всего проектов" value={stats?.total_projects ?? projects.length} color="var(--accent)" />
            <StatCard icon="loader-2" label="В работе" value={stats?.active_projects ?? projects.filter(p => p.status === 'in_progress').length} color="#EF9F27" sub="активных" />
            <StatCard icon="circle-check" label="Завершено" value={stats?.completed_projects ?? projects.filter(p => p.status === 'completed').length} color="var(--accent-green)" />
            <StatCard icon="wallet" label="Вложено ($)" value={stats?.total_spent ? '$' + Number(stats.total_spent).toLocaleString() : '$0'} color="var(--accent-teal)" sub="выплачено исполнителям" />
          </div>

          {/* Requires attention — delivered projects */}
          {needsAttention.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF9F27', boxShadow: '0 0 8px #EF9F27', animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Требует внимания
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,159,39,0.15)', color: '#EF9F27', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                  {needsAttention.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {needsAttention.map(p => (
                  <div key={p.id} style={{
                    background: isDark ? 'rgba(239,159,39,0.04)' : 'rgba(239,159,39,0.03)',
                    border: '0.5px solid rgba(239,159,39,0.22)',
                    borderRadius: 12, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-package" style={{ fontSize: 17, color: '#EF9F27' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(239,159,39,0.7)' }}>
                          Фрилансер сдал работу — проверьте и примите
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '6px 13px', borderRadius: 8, background: 'rgba(239,159,39,0.12)', border: '0.5px solid rgba(239,159,39,0.28)', color: '#EF9F27', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-eye" style={{ fontSize: 12 }} /> Проверить
                        </button>
                      </Link>
                      <Link to={`/chats?project=${p.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '6px 13px', borderRadius: 8, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.22)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-messages" style={{ fontSize: 12 }} /> Чат
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open with bids to review */}
          {openWithBids.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Новые заявки
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(127,119,221,0.15)', color: 'var(--accent)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                  {openWithBids.reduce((sum, p) => sum + (p.bids_count || 0), 0)} заявок
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {openWithBids.map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 13px', borderRadius: 10,
                      background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.18)',
                      transition: 'border-color 0.2s, transform 0.2s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <i className="ti ti-send" style={{ fontSize: 13, color: 'var(--accent)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{p.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '1px 7px' }}>
                        {p.bids_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {projects.length === 0 && !loading && (
            <div style={{
              borderRadius: 20, padding: 32, marginBottom: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: isDark
                ? 'linear-gradient(135deg, rgba(127,119,221,0.08) 0%, rgba(29,158,117,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59,91,219,0.06) 0%, rgba(13,146,104,0.04) 100%)',
              border: '0.5px solid rgba(127,119,221,0.15)',
            }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Опубликуй первый проект
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400 }}>
                  Тысячи фрилансеров готовы взяться за твою задачу. Опишите проект — получи заявки уже сегодня.
                </p>
              </div>
              <Link to="/projects/new">
                <Button variant="primary" icon="plus" style={{ fontSize: 15, padding: '12px 28px' }}>Создать проект</Button>
              </Link>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 4 }}>
              {STATUS_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  <i className={`ti ti-${tab.icon}`} style={{ fontSize: 13 }} />
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border)', fontSize: 11, borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>
                      {tabCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filtered.length} проект{filtered.length !== 1 ? 'ов' : ''}
            </span>
          </div>

          {/* Projects grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 16, border: '0.5px solid var(--border)', padding: 22 }}>
                  <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 18, width: '75%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 12, width: '55%', marginBottom: 20 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="skeleton" style={{ height: 22, width: 65, borderRadius: 20 }} />
                    <div className="skeleton" style={{ height: 22, width: 50, borderRadius: 20 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <i className="ti ti-briefcase-off" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16, opacity: 0.25 }} />
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 }}>
                {activeTab ? 'Нет проектов в этом статусе' : 'У тебя пока нет проектов'}
              </p>
              {!activeTab && (
                <Link to="/projects/new">
                  <Button variant="primary" icon="plus">Создать первый проект</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
