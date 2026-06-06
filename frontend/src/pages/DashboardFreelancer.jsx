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
  const pendingCount = bids.filter(b => b.status === 'pending').length

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container page-enter" style={{ paddingTop: 36, paddingBottom: 80 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar src={user?.avatar_url} name={user?.full_name} size={56} online />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Кабинет фрилансера
                </p>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {user?.full_name}
                </h1>
                {stats?.average_rating > 0 && (
                  <Rating value={stats.average_rating} size={13} style={{ marginTop: 4 }} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/my-work">
                <Button variant="outline" icon="briefcase">Мои работы</Button>
              </Link>
              <Link to="/projects">
                <Button variant="primary" icon="search">Найти проекты</Button>
              </Link>
            </div>
          </div>

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { icon: 'send', label: 'Всего заявок', value: stats?.total_bids ?? bids.length, color: 'var(--accent)', sub: 'подано' },
              { icon: 'loader-2', label: 'В работе', value: stats?.active_projects ?? activeProjects.length, color: '#EF9F27', sub: 'активных' },
              { icon: 'circle-check', label: 'Завершено', value: stats?.completed_projects ?? 0, color: 'var(--accent-green)', sub: 'проектов' },
              { icon: 'coin', label: 'Заработано', value: stats?.total_earned ? '$' + Number(stats.total_earned).toLocaleString() : '$0', color: 'var(--accent-teal)', sub: 'за всё время' },
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
                <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map(bid => <MyBidRow key={bid.id} bid={bid} />)}
                </div>
              )}
            </div>

            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Активные проекты
                  </div>
                  {activeProjects.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,159,39,0.15)', color: '#EF9F27', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                      {activeProjects.length}
                    </span>
                  )}
                </div>
                {activeProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <i className="ti ti-briefcase" style={{ fontSize: 28, color: 'var(--text-muted)', display: 'block', marginBottom: 8, opacity: 0.3 }} />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет активных проектов</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeProjects.map(bid => (
                      <div key={bid.id} style={{
                        padding: '12px 14px', borderRadius: 11,
                        border: '0.5px solid var(--border)',
                        transition: 'border-color 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <Link to={`/projects/${bid.project_id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                            {bid.project_title || 'Проект'}
                          </div>
                        </Link>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
                            ${Number(bid.price).toLocaleString()}
                          </span>
                          <Link to={`/chats?project=${bid.project_id}`} style={{ textDecoration: 'none' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                              <i className="ti ti-messages" style={{ fontSize: 12 }} /> Чат
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeProjects.length > 0 && (
                <Link to="/my-work" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                    borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-briefcase" style={{ fontSize: 15, color: 'var(--accent-green)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Мои работы</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Трекер задач</div>
                      </div>
                    </div>
                    <i className="ti ti-arrow-right" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              )}

              <Link to="/ai" style={{ textDecoration: 'none' }}>
                <div style={{
                  borderRadius: 16, padding: '20px 18px', overflow: 'hidden', position: 'relative',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(127,119,221,0.18) 0%, rgba(93,202,165,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59,91,219,0.12) 0%, rgba(29,158,117,0.08) 100%)',
                  border: '0.5px solid rgba(127,119,221,0.25)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.25)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-sparkles" style={{ fontSize: 17, color: '#7F77DD' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Ассистент</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by Llama 3.3</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, position: 'relative' }}>
                    Помогу написать заявку, улучшить описание проекта или ответить на вопросы.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent)', position: 'relative' }}>
                    Открыть ассистента
                    <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                  </div>
                </div>
              </Link>

              {pendingCount > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pendingCount}</span> заявок ожидают рассмотрения
                    </span>
                  </div>
                </div>
              )}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            ${Number(bid.price).toLocaleString()}
          </span>
          <Tag color={st.color}>{st.label}</Tag>
        </div>
      </div>
    </Link>
  )
}
