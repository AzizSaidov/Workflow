import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { profilesApi, usersApi } from '../api/profiles'
import { categoriesApi } from '../api/categories'
import useToastStore from '../store/toastStore'
import { useSEO } from '../hooks/useSEO'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'

function FreelancerRow({ user, profile }) {
  return (
    <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px', borderRadius: 14,
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(3px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={user.avatar_url} name={user.full_name} size={48} />
          {profile?.is_verified && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderRadius: '50%',
              background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}>
              <i className="ti ti-check" style={{ fontSize: 8, color: '#fff' }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>
            {user.full_name}
          </div>
          {profile?.title && (
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 6 }}>
              {profile.title}
            </div>
          )}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {(profile?.categories || []).slice(0, 2).map(c => (
              <Tag key={c.id} color="green" style={{ fontSize: 10, padding: '1px 7px' }}>{c.name}</Tag>
            ))}
            {(profile?.skills || []).slice(0, 3).map(s => (
              <Tag key={s.id} color="purple" style={{ fontSize: 10, padding: '1px 7px' }}>{s.name}</Tag>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
          {profile?.hourly_rate && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)' }}>
                ${Number(profile.hourly_rate).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ час</div>
            </div>
          )}
          {profile?.total_jobs > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                {profile.total_jobs}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>работ</div>
            </div>
          )}
          {profile?.experience_years > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                {profile.experience_years}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {profile.experience_years === 1 ? 'год' : profile.experience_years < 5 ? 'года' : 'лет'}
              </div>
            </div>
          )}
        </div>

        <i className="ti ti-chevron-right" style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0, opacity: 0.4 }} />
      </div>
    </Link>
  )
}

export default function FreelancersPage() {
  useSEO({ title: 'Таланты', description: 'Лучшие фрилансеры на платформе Workflow. Фильтруй по категории, рейтингу и ставке.' })
  const { isDark } = useThemeStore()
  const { user }   = useAuthStore()
  const toast      = useToastStore(s => s.show)

  const [users,      setUsers]      = useState([])
  const [profiles,   setProfiles]   = useState({})
  const [categories, setCategories] = useState([])
  const [catFilter,  setCatFilter]  = useState('')
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      usersApi.list('freelancer'),
      profilesApi.getAll(catFilter || undefined),
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

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    if (u.is_banned) return false
    const p = profiles[u.id]
    if (catFilter && !p) return false
    if (search) {
      const q = search.toLowerCase()
      if (!u.full_name?.toLowerCase().includes(q) &&
          !u.bio?.toLowerCase().includes(q) &&
          !p?.title?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const activeCat = categories.find(c => c.slug === catFilter)

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>

        <div style={{
          padding: '48px 44px 36px',
          borderBottom: '0.5px solid var(--border)',
          background: isDark ? 'rgba(127,119,221,0.04)' : 'rgba(59,91,219,0.03)',
        }}>
          <div className="container" style={{ padding: 0 }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-users" style={{ fontSize: 16, color: 'var(--accent)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                  {filtered.length} специалистов
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.1 }}>
                Найди специалиста<br />
                <span style={{ color: 'var(--accent)' }}>
                  {activeCat ? `по ${activeCat.name.toLowerCase()}` : 'для своего проекта'}
                </span>
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6 }}>
                Профессионалы со всего мира — фильтруй по специализации и находи нужного.
              </p>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>

            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                  Поиск
                </div>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Имя, навык…"
                    className="input"
                    style={{ paddingLeft: 32, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                  Категория
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={() => setCatFilter('')}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                      background: !catFilter ? 'rgba(127,119,221,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      color: !catFilter ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: !catFilter ? 600 : 400, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <i className="ti ti-layout-list" style={{ fontSize: 13 }} />
                    Все специализации
                  </button>
                  {categories.map(cat => {
                    const active = catFilter === cat.slug
                    const iconClass = cat.icon?.startsWith('ti-') ? cat.icon : `ti-${cat.icon || 'briefcase'}`
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCatFilter(active ? '' : cat.slug)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                          background: active ? 'rgba(127,119,221,0.12)' : 'transparent',
                          border: 'none', cursor: 'pointer', fontSize: 13,
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                      >
                        <i className={`ti ${iconClass}`} style={{ fontSize: 13 }} />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загружаем специалистов…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-users-off" style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Никого не найдено</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Попробуй другую категорию или запрос</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(u => (
                    <FreelancerRow
                      key={u.id}
                      user={u}
                      profile={profiles[u.id]}
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
