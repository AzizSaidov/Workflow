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

const MEDAL = {
  1: { color: '#F5C518', glow: 'rgba(245,197,24,0.25)', label: '1 место' },
  2: { color: '#B0B8C8', glow: 'rgba(176,184,200,0.2)', label: '2 место' },
  3: { color: '#CD8B5A', glow: 'rgba(205,139,90,0.2)', label: '3 место' },
}

// Podium card — top 3
function PodiumCard({ rank, user, profile, isFavorited, onFavoriteToggle, podiumOffset }) {
  const medal = MEDAL[rank]
  const isFirst = rank === 1

  return (
    <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${medal.color}55`,
          borderRadius: isFirst ? 22 : 18,
          padding: isFirst ? '32px 22px 24px' : '24px 18px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          marginTop: podiumOffset,
          position: 'relative',
          transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
          boxShadow: isFirst ? `0 8px 40px ${medal.glow}` : `0 4px 20px ${medal.glow}`,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = `${medal.color}99`
          e.currentTarget.style.boxShadow = `0 12px 50px ${medal.glow}`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = `${medal.color}55`
          e.currentTarget.style.boxShadow = isFirst ? `0 8px 40px ${medal.glow}` : `0 4px 20px ${medal.glow}`
        }}
      >
        {/* Crown for 1st */}
        {isFirst && (
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)' }}>
            <i className="ti ti-crown" style={{ fontSize: 24, color: medal.color }} />
          </div>
        )}

        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          minWidth: 28, height: 28, borderRadius: 14,
          background: medal.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13,
          color: '#0a0a0a',
          padding: '0 8px',
          boxShadow: `0 4px 14px ${medal.glow}`,
        }}>
          #{rank}
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <Avatar src={user.avatar_url} name={user.full_name} size={isFirst ? 76 : 62} online={profile?.is_online ?? false} />
          {profile?.is_verified && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
              background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}>
              <i className="ti ti-check" style={{ fontSize: 9, color: '#fff' }} />
            </div>
          )}
        </div>

        {/* Name & title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isFirst ? 16 : 14,
            color: 'var(--text-primary)', marginBottom: 3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
          }}>
            {user.full_name}
          </div>
          {profile?.title && (
            <div style={{ fontSize: 11, color: medal.color, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
              {profile.title}
            </div>
          )}
        </div>

        {/* Rating */}
        {profile?.rating > 0 && (
          <Rating value={profile.rating} size={10} />
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          {profile?.hourly_rate && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)' }}>
                ${Number(profile.hourly_rate).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ час</div>
            </div>
          )}
          {profile?.total_jobs > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                {profile.total_jobs}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>работ</div>
            </div>
          )}
          {profile?.review_count > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                {profile.review_count}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>отзывов</div>
            </div>
          )}
        </div>

        {/* Favorite button */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle() }}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: isFavorited ? '#F87171' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = isFavorited ? '#F87171' : 'var(--text-muted)'}
          >
            <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      {/* Podium step base */}
      <div style={{
        height: podiumOffset === 0 ? 56 : podiumOffset === 44 ? 36 : 18,
        background: `linear-gradient(180deg, ${medal.color}22 0%, transparent 100%)`,
        borderRadius: '0 0 12px 12px',
        border: `1px solid ${medal.color}22`,
        borderTop: 'none',
        marginTop: -2,
      }} />
    </Link>
  )
}

// Row for rank 4+
function RankRow({ rank, user, profile, isFavorited, onFavoriteToggle }) {
  const rankColor = rank <= 10 ? 'var(--accent)' : 'var(--text-muted)'

  return (
    <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderRadius: 14,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          transition: 'border-color 0.15s, transform 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(3px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
      >
        {/* Rank number */}
        <div style={{
          width: 36, textAlign: 'center', flexShrink: 0,
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
          color: rankColor, opacity: rank <= 10 ? 1 : 0.5,
        }}>
          {rank}
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={user.avatar_url} name={user.full_name} size={44} online={profile?.is_online ?? false} />
          {profile?.is_verified && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%',
              background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}>
              <i className="ti ti-check" style={{ fontSize: 7, color: '#fff' }} />
            </div>
          )}
        </div>

        {/* Name + title + skills */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{user.full_name}</span>
            {profile?.rating > 0 && <Rating value={profile.rating} size={10} />}
          </div>
          {profile?.title && (
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: 4 }}>{profile.title}</div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(profile?.skills || []).slice(0, 3).map(s => (
              <Tag key={s.id} color="purple" style={{ fontSize: 10, padding: '1px 7px' }}>{s.name}</Tag>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
          {profile?.total_jobs > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{profile.total_jobs}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>работ</div>
            </div>
          )}
          {profile?.hourly_rate && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)' }}>
                ${Number(profile.hourly_rate).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ час</div>
            </div>
          )}
          {profile?.experience_years > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{profile.experience_years}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {profile.experience_years === 1 ? 'год' : profile.experience_years < 5 ? 'года' : 'лет'}
              </div>
            </div>
          )}
        </div>

        {/* Favorite */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle() }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
              color: isFavorited ? '#F87171' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = isFavorited ? '#F87171' : 'var(--text-muted)'}
          >
            <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 16 }} />
          </button>
        )}
      </div>
    </Link>
  )
}

export default function FreelancersPage() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const toast = useToastStore(s => s.show)
  const [users, setUsers] = useState([])
  const [profiles, setProfiles] = useState({})
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
    try {
      if (favIds.has(userId)) {
        await favoritesApi.removeFreelancer(userId)
        setFavIds(prev => { const s = new Set(prev); s.delete(userId); return s })
        toast('Удалено из избранного', 'info')
      } else {
        await favoritesApi.addFreelancer(userId)
        setFavIds(prev => new Set([...prev, userId]))
        toast('Добавлено в избранное!', 'success')
      }
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
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

  const top3 = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  // Podium order: 2nd | 1st | 3rd (Olympic style)
  const podiumOrder = top3.length === 3
    ? [{ u: top3[1], rank: 2, offset: 44 }, { u: top3[0], rank: 1, offset: 0 }, { u: top3[2], rank: 3, offset: 80 }]
    : top3.map((u, i) => ({ u, rank: i + 1, offset: i * 44 }))

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
                  <i className="ti ti-trophy" style={{ fontSize: 16, color: 'var(--accent)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                  {filtered.length} специалистов в рейтинге
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.1 }}>
                Таблица лидеров<br />
                <span style={{ color: 'var(--accent)' }}>фрилансеров</span>
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6 }}>
                Рейтинг по оценкам заказчиков. Лучшие специалисты платформы.
              </p>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>

            {/* Sidebar */}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => setCatFilter('')}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                      background: !catFilter ? 'rgba(127,119,221,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      color: !catFilter ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: !catFilter ? 500 : 400, transition: 'all 0.15s',
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
                        fontWeight: catFilter === cat.slug ? 500 : 400, transition: 'all 0.15s',
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

              {/* Legend */}
              <div style={{ background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.15)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Награды</div>
                {[
                  { color: MEDAL[1].color, icon: 'ti-crown', text: '1 место — Золото' },
                  { color: MEDAL[2].color, icon: 'ti-medal', text: '2 место — Серебро' },
                  { color: MEDAL[3].color, icon: 'ti-medal', text: '3 место — Бронза' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: item.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main leaderboard */}
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загружаем рейтинг…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-users-off" style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Никого не найдено</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Попробуй другую категорию или запрос</div>
                </div>
              ) : (
                <>
                  {/* Podium top 3 */}
                  {top3.length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-podium" style={{ fontSize: 14, color: 'var(--accent)' }} />
                        Подиум
                      </div>

                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingTop: 30 }}>
                        {podiumOrder.map(({ u, rank, offset }) => (
                          <PodiumCard
                            key={u.id}
                            rank={rank}
                            user={u}
                            profile={profiles[u.id]}
                            isFavorited={favIds.has(u.id)}
                            onFavoriteToggle={user?.role === 'client' ? () => toggleFav(u.id) : undefined}
                            podiumOffset={offset}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ranked list 4+ */}
                  {rest.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-list-numbers" style={{ fontSize: 14, color: 'var(--accent)' }} />
                        Остальные участники
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rest.map((u, i) => (
                          <RankRow
                            key={u.id}
                            rank={i + 4}
                            user={u}
                            profile={profiles[u.id]}
                            isFavorited={favIds.has(u.id)}
                            onFavoriteToggle={user?.role === 'client' ? () => toggleFav(u.id) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
