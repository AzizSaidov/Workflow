import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { bidsApi } from '../api/bids'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Rating from '../components/Rating'
import Button from '../components/Button'

const BID_TABS = [
  { key: '', label: 'Все', icon: 'list' },
  { key: 'pending', label: 'Ожидают', icon: 'clock' },
  { key: 'accepted', label: 'Принятые', icon: 'circle-check' },
  { key: 'rejected', label: 'Отклонённые', icon: 'circle-x' },
]

export default function DashboardFreelancer() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [bids, setBids] = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/users/me/stats').then(r => setStats(r.data)).catch(() => {})
    bidsApi.getMyBids().then(r => setBids(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = activeTab ? bids.filter(b => b.status === activeTab) : bids
  const activeProjects = bids.filter(b => b.status === 'accepted')

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container page-enter" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar src={user?.avatar_url} name={user?.full_name} size={56} online />
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Фрилансер</p>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </h1>
                {stats?.average_rating > 0 && (
                  <Rating value={stats.average_rating} size={13} style={{ marginTop: 4 }} />
                )}
              </div>
            </div>
            <Link to="/projects">
              <Button variant="primary" icon="search">Найти проекты</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { icon: 'send', label: 'Всего заявок', value: stats?.total_bids ?? bids.length, color: 'var(--accent)', sub: 'подано' },
              { icon: 'loader-2', label: 'В работе', value: stats?.active_projects ?? activeProjects.length, color: '#EF9F27', sub: 'активных проектов' },
              { icon: 'circle-check', label: 'Завершено', value: stats?.completed_projects, color: 'var(--accent-green)', sub: 'проектов' },
              { icon: 'coin', label: 'Заработано', value: stats?.total_earned ? Number(stats.total_earned).toLocaleString() + ' TJS' : '0 TJS', color: 'var(--accent-teal)', sub: 'за всё время' },
            ].map(({ icon, label, value, color, sub }) => (
              <div key={label} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}18`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                  {value ?? <span style={{ opacity: 0.3 }}>—</span>}
                </div>
                {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
            {/* Bids list */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 4 }}>
                  {BID_TABS.map(tab => {
                    const count = tab.key ? bids.filter(b => b.status === tab.key).length : bids.length
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 500,
                        border: 'none', cursor: 'pointer',
                        background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                        color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.2s',
                      }}>
                        <i className={`ti ti-${tab.icon}`} style={{ fontSize: 12 }} />
                        {tab.label}
                        {count > 0 && (
                          <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border)', fontSize: 10, borderRadius: 7, padding: '1px 5px', fontWeight: 700 }}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <Link to="/projects">
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 12.5, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.2)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>
                    <i className="ti ti-plus" style={{ fontSize: 13 }} />
                    Подать заявку
                  </button>
                </Link>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ borderRadius: 14, border: '0.5px solid var(--border)', padding: '16px 20px' }}>
                      <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: '80%' }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <i className="ti ti-inbox" style={{ fontSize: 44, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                    {activeTab ? 'Нет заявок в этом статусе' : 'Ты ещё не подавал заявки'}
                  </p>
                  <Link to="/projects"><Button variant="outline" icon="search">Найти проекты</Button></Link>
                </div>
              ) : (
                <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map(bid => <MyBidRow key={bid.id} bid={bid} />)}
                </div>
              )}
            </div>

            {/* Active projects sidebar */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                  Активные проекты ({activeProjects.length})
                </div>
                {activeProjects.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет активных проектов</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeProjects.map(bid => (
                      <Link key={bid.id} to={`/projects/${bid.project_id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          padding: '12px 14px', borderRadius: 12,
                          border: '0.5px solid var(--border)',
                          transition: 'border-color 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
                            {bid.project_title || 'Проект'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Tag color="amber">В работе</Tag>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
                              {Number(bid.price).toLocaleString()} TJS
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function MyBidRow({ bid }) {
  const STATUS = {
    pending: { color: 'amber', label: 'На рассмотрении' },
    accepted: { color: 'green', label: 'Принята' },
    rejected: { color: 'red', label: 'Отклонена' },
  }
  const st = STATUS[bid.status] || STATUS.pending

  return (
    <Link to={`/projects/${bid.project_id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        transition: 'border-color 0.2s, transform 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(3px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5 }}>
            {bid.project_title || `Проект #${bid.project_id?.slice(0, 8)}`}
          </div>
          {bid.cover_letter && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 400 }}>
              {bid.cover_letter}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
            {Number(bid.price).toLocaleString()} TJS
          </span>
          <Tag color={st.color}>{st.label}</Tag>
        </div>
      </div>
    </Link>
  )
}
