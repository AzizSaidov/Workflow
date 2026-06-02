import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { profilesApi, usersApi } from '../api/profiles'
import { categoriesApi } from '../api/categories'
import { favoritesApi } from '../api/favorites'
import useToastStore from '../store/toastStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Rating from '../components/Rating'

const LEVEL_LABELS = { basic: 'Базовый', conversational: 'Разговорный', fluent: 'Свободно', native: 'Родной' }

function FreelancerBigCard({ user, profile, isFavorited, onFavoriteToggle }) {
  const skills = profile?.skills?.slice(0, 4) || []
  const langs = profile?.languages?.slice(0, 3) || []

  return (
    <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        display: 'flex', gap: 20, padding: '22px 24px',
        transition: 'transform 0.2s, border-color 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        {/* Avatar + verified */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={user.avatar_url} name={user.full_name} size={64} online={profile?.is_online ?? false} />
          {profile?.is_verified && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}>
              <i className="ti ti-check" style={{ fontSize: 10, color: '#fff' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {user.full_name}
              </div>
              {profile?.title && (
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{profile.title}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                {profile?.hourly_rate && (
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--accent-green)' }}>
                    {Number(profile.hourly_rate).toLocaleString()}
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>$/ч</span>
                  </div>
                )}
                {profile?.rating > 0 && (
                  <Rating value={profile.rating} size={11} style={{ marginTop: 4, justifyContent: 'flex-end' }} />
                )}
              </div>
              {onFavoriteToggle && (
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle() }}
                  title={isFavorited ? 'Убрать из избранного' : 'В избранное'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: isFavorited ? '#F87171' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                  onMouseLeave={e => e.currentTarget.style.color = isFavorited ? '#F87171' : 'var(--text-muted)'}
                >
                  <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 18 }} />
                </button>
              )}
            </div>
          </div>

          {user.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, fontWeight: 300,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {user.bio}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {skills.map(s => <Tag key={s.id} color="purple" style={{ fontSize: 11 }}>{s.name}</Tag>)}
            {langs.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color="muted" style={{ fontSize: 11 }}>{l.name}</Tag>
              </div>
            ))}
            {profile?.total_jobs > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                <i className="ti ti-briefcase" style={{ marginRight: 3, fontSize: 10 }} />
                {profile.total_jobs} работ
              </span>
            )}
            {profile?.experience_years > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <i className="ti ti-clock" style={{ marginRight: 3, fontSize: 10 }} />
                {profile.experience_years} {profile.experience_years === 1 ? 'год' : profile.experience_years < 5 ? 'года' : 'лет'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function FreelancersPage() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const toast = useToastStore(s => s.show)
  const [users, setUsers] = useState([])
  const [profiles, setProfiles] = useState({}) // keyed by user_id
  const [categories, setCategories] = useState([])
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState(new Set())

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      usersApi.list('freelancer'),
      profilesApi.getTop(catFilter || undefined),
    ]).then(([usersRes, profilesRes]) => {
      setUsers(usersRes.data || [])
      const profileMap = {}
      ;(profilesRes.data || []).forEach(p => { profileMap[p.user_id] = p })
      setProfiles(profileMap)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [catFilter])

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    favoritesApi.getAll()
      .then(r => setFavIds(new Set((r.data || []).filter(f => f.freelancer_id).map(f => f.freelancer_id))))
      .catch(() => {})
  }, [user?.id])

  const toggleFav = async (userId) => {
    if (favIds.has(userId)) {
      await favoritesApi.removeFreelancer(userId).catch(() => {})
      setFavIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      toast('Удалено из избранного', 'info')
    } else {
      await favoritesApi.addFreelancer(userId).catch(() => {})
      setFavIds(prev => new Set([...prev, userId]))
      toast('Добавлено в избранное!', 'success')
    }
  }

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      const p = profiles[u.id]
      if (!u.full_name?.toLowerCase().includes(q) &&
          !u.bio?.toLowerCase().includes(q) &&
          !p?.title?.toLowerCase().includes(q)) return false
    }
    return !u.is_banned
  })

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        {/* Hero */}
        <div style={{
          padding: '48px 44px 36px',
          borderBottom: '0.5px solid var(--border)',
          background: isDark ? 'rgba(127,119,221,0.04)' : 'rgba(80,72,213,0.03)',
        }}>
          <div className="container" style={{ padding: 0 }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-users" style={{ fontSize: 16, color: 'var(--accent)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                  {filtered.length} талантов найдено
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.1 }}>
                Найди своего<br />
                <span style={{ color: 'var(--accent)' }}>идеального исполнителя</span>
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6 }}>
                Проверенные специалисты со всего мира. Рейтинг, отзывы, портфолио.
              </p>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>

            {/* Sidebar filters */}
            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                  Поиск
                </div>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Имя, навык, специализация…"
                    className="input"
                    style={{ paddingLeft: 32, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                  Специализация
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => setCatFilter('')}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                      background: !catFilter ? 'rgba(127,119,221,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      color: !catFilter ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: !catFilter ? 500 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className="ti ti-list" style={{ marginRight: 8, fontSize: 13 }} />
                    Все категории
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCatFilter(cat.slug)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                        background: catFilter === cat.slug ? 'rgba(127,119,221,0.12)' : 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: 13,
                        color: catFilter === cat.slug ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: catFilter === cat.slug ? 500 : 400,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (catFilter !== cat.slug) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (catFilter !== cat.slug) e.currentTarget.style.background = 'transparent' }}
                    >
                      <i className={`ti ${cat.icon}`} style={{ marginRight: 8, fontSize: 13 }} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats badge */}
              <div style={{ background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
                  <i className="ti ti-star-filled" style={{ marginRight: 6 }} />
                  Топ специалисты
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Список отсортирован по рейтингу. Верифицированные исполнители прошли проверку команды Workflow.
                </div>
              </div>
            </div>

            {/* Main list */}
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загружаем специалистов…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-users-off" style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Никого не найдено</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Попробуй другую категорию или поисковый запрос</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map(u => (
                    <FreelancerBigCard
                      key={u.id}
                      user={u}
                      profile={profiles[u.id]}
                      isFavorited={favIds.has(u.id)}
                      onFavoriteToggle={user?.role === 'client' ? () => toggleFav(u.id) : undefined}
                    />
                  ))}
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
