import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import { usersApi } from '../api/profiles'
import { clientProfilesApi } from '../api/clientProfiles'
import { reviewsApi } from '../api/reviews'
import { favoritesApi } from '../api/favorites'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import ReportModal from '../components/ReportModal'
import { useSEO } from '../hooks/useSEO'

const STATUS_LABEL = { open: 'Открыт', in_progress: 'В работе', delivered: 'На проверке', completed: 'Завершён', cancelled: 'Отменён', disputed: 'Спор' }
const STATUS_COLOR = { open: 'var(--accent)', in_progress: '#FBBF24', delivered: '#5DCAA5', completed: 'var(--accent-green)', cancelled: '#6B7280', disputed: '#F87171' }

export default function ClientProfile() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user: me } = useAuthStore()
  const toast = useToastStore(s => s.show)

  const [userData, setUserData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')

  useSEO({
    title: userData?.full_name ? `${userData.full_name} — Заказчик` : 'Профиль заказчика',
  })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      usersApi.getById(id),
      clientProfilesApi.get(id).catch(() => ({ data: null })),
      clientProfilesApi.getProjects(id).catch(() => ({ data: [] })),
      reviewsApi.getByUser(id).catch(() => ({ data: [] })),
    ]).then(([userRes, profileRes, projectsRes, reviewsRes]) => {
      setUserData(userRes.data)
      setProfile(profileRes.data)
      setProjects(projectsRes.data || [])
      setReviews(reviewsRes.data || [])
    }).catch(() => toast('Ошибка загрузки', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!me) return
    favoritesApi.getAll().then(r => setIsFavorited((r.data || []).some(f => f.freelancer_id === id))).catch(() => {})
  }, [id, me])

  const toggleFav = async () => {
    if (!me) { toast('Войдите для добавления в избранное', 'info'); return }
    setFavLoading(true)
    try {
      if (isFavorited) {
        await favoritesApi.removeFreelancer(id)
        setIsFavorited(false)
        toast('Убрано из избранного', 'info')
      } else {
        await favoritesApi.addFreelancer(id)
        setIsFavorited(true)
        toast('Добавлено в избранное', 'success')
      }
    } catch { toast('Ошибка', 'error') }
    finally { setFavLoading(false) }
  }

  const completedProjects = projects.filter(p => p.status === 'completed')
  const activeProjects = projects.filter(p => ['open', 'in_progress', 'delivered'].includes(p.status))
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!userData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <i className="ti ti-user-off" style={{ fontSize: 48, color: 'var(--text-muted)', opacity: 0.3 }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Пользователь не найден</div>
        <Link to="/" style={{ color: 'var(--accent)', fontSize: 13 }}>На главную</Link>
      </div>
    )
  }

  const tabs = [
    { key: 'projects', label: 'Проекты', count: projects.length },
    { key: 'reviews', label: 'Отзывы', count: reviews.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px', display: 'flex', gap: 32, alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>

        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar src={userData.avatar_url} name={userData.full_name} size={88} />
              {profile?.is_verified && (
                <div style={{
                  position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2.5px solid var(--bg-card)',
                }}>
                  <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} />
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', width: '100%' }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                {userData.full_name}
              </h1>
              <Tag color="green" style={{ fontSize: 11 }}>Заказчик</Tag>
            </div>

            <div style={{ display: 'flex', gap: 0, width: '100%', borderTop: '0.5px solid var(--border)', paddingTop: 14, justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {completedProjects.length}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>завершено</div>
              </div>
              {avgRating && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#FBBF24', lineHeight: 1 }}>
                    {avgRating}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>рейтинг</div>
                </div>
              )}
              {profile?.total_spent > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>
                    ${Number(profile.total_spent).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>потрачено</div>
                </div>
              )}
            </div>

            {me && me.id !== id && (
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  onClick={toggleFav}
                  disabled={favLoading}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    cursor: favLoading ? 'not-allowed' : 'pointer',
                    background: isFavorited ? 'rgba(251,191,36,0.1)' : 'rgba(127,119,221,0.1)',
                    border: `0.5px solid ${isFavorited ? 'rgba(251,191,36,0.35)' : 'rgba(127,119,221,0.3)'}`,
                    color: isFavorited ? '#FBBF24' : 'var(--accent)',
                    transition: 'all 0.15s',
                  }}
                >
                  {isFavorited ? '★ В избранном' : '☆ В избранное'}
                </button>
                <button
                  onClick={() => setReportOpen(true)}
                  title="Пожаловаться"
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'none', border: '0.5px solid var(--border)',
                    cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <i className="ti ti-flag" style={{ fontSize: 15 }} />
                </button>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile?.company_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-building" style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile.company_name}</span>
              </div>
            )}
            {profile?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile.location}</span>
              </div>
            )}
            {profile?.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-world" style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-calendar" style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                На платформе с {new Date(userData.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {profile?.description && (
            <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>О себе</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{profile.description}</p>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(127,119,221,0.15)',
                    color: activeTab === tab.key ? '#fff' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                  <i className="ti ti-briefcase-off" style={{ fontSize: 40, opacity: 0.2, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 14 }}>Нет проектов</div>
                </div>
              ) : (
                <>
                  {activeProjects.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      Активные ({activeProjects.length})
                    </div>
                  )}
                  {activeProjects.map(p => <ProjectRow key={p.id} project={p} />)}

                  {completedProjects.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>
                      Завершённые ({completedProjects.length})
                    </div>
                  )}
                  {completedProjects.map(p => <ProjectRow key={p.id} project={p} />)}

                  {projects.filter(p => p.status === 'cancelled').map(p => <ProjectRow key={p.id} project={p} />)}
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.18, lineHeight: 1 }}>☆</span>
                  <div style={{ fontSize: 14 }}>Нет отзывов</div>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <img src={r.reviewer_avatar_url || `https://i.pravatar.cc/150?u=${r.reviewer_id}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.reviewer_name || 'Фрилансер'}</div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#FBBF24' : 'rgba(251,191,36,0.2)' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={id}
        targetName={userData?.full_name || ''}
      />
    </div>
  )
}

function ProjectRow({ project }) {
  const color = STATUS_COLOR[project.status] || 'var(--text-muted)'
  return (
    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(3px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date(project.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {project.budget_max && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--accent-green)' }}>
              ${Number(project.budget_max).toLocaleString()}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: '3px 9px', borderRadius: 20 }}>
            {STATUS_LABEL[project.status] || project.status}
          </span>
        </div>
      </div>
    </Link>
  )
}
