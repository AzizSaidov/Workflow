import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { profilesApi } from '../api/profiles'
import { portfolioApi } from '../api/portfolio'
import { reviewsApi } from '../api/reviews'
import { achievementsApi } from '../api/achievements'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Rating from '../components/Rating'
import Tag from '../components/Tag'
import Button from '../components/Button'
import Input from '../components/Input'
import LanguageSelector from '../components/LanguageSelector'
import AchievementBadge from '../components/AchievementBadge'
import { certificationsApi } from '../api/certifications'
import { favoritesApi } from '../api/favorites'
import useToastStore from '../store/toastStore'

const LEVEL_LABEL = { basic: 'Базовый', conversational: 'Разговорный', fluent: 'Свободный', native: 'Родной' }

export default function Profile() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user: me, setUser } = useAuthStore()
  const isOwnProfile = me?.id === id

  const [userData, setUserData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [reviews, setReviews] = useState([])
  const [achievements, setAchievements] = useState([])
  const [allAchievements, setAllAchievements] = useState([])
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const toast = useToastStore(s => s.show)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', title: '', hourly_rate: '', experience_years: '' })
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const load = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([
      client.get(`/users/${id}`),
      profilesApi.get(id).catch(() => ({ data: null })),
      portfolioApi.getByUser(id).catch(() => ({ data: [] })),
      reviewsApi.getByUser(id).catch(() => ({ data: [] })),
      achievementsApi.getForUser(id).catch(() => ({ data: [] })),
      achievementsApi.getAll().catch(() => ({ data: [] })),
    ]).then(([u, p, po, rv, ua, aa]) => {
      setUserData(u.data)
      setProfile(p.data)
      setPortfolio(po.data || [])
      setReviews(rv.data || [])
      setAchievements(ua.data || [])
      setAllAchievements(aa.data || [])
      if (p.data) {
        setEditForm({
          full_name: u.data?.full_name || '',
          bio: u.data?.bio || '',
          title: p.data.title || '',
          hourly_rate: p.data.hourly_rate || '',
          experience_years: p.data.experience_years || '',
        })
        certificationsApi.getByProfile(p.data.id).then(r => setCertifications(r.data || [])).catch(() => {})
      }
    }).catch(() => setLoadError(true)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (!me || me.id === id) return
    favoritesApi.getAll()
      .then(r => setIsFavorited((r.data || []).some(f => f.freelancer_id === id)))
      .catch(() => {})
  }, [id, me])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Update user data (bio, full_name)
      const userUpdates = {}
      if (editForm.full_name && editForm.full_name !== userData?.full_name) userUpdates.full_name = editForm.full_name
      if (editForm.bio !== (userData?.bio || '')) userUpdates.bio = editForm.bio
      if (Object.keys(userUpdates).length) await client.put('/users/me', userUpdates)

      // Update freelancer profile if applicable
      if (isFreelancer) {
        await profilesApi.updateMe({
          title: editForm.title || undefined,
          hourly_rate: parseFloat(editForm.hourly_rate) || undefined,
          experience_years: parseInt(editForm.experience_years) || undefined,
        })
      }
      setEditMode(false)
      toast('Профиль сохранён', 'success')
      load()
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await client.post('/media/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data?.url && me) setUser({ ...me, avatar_url: data.url })
      toast('Аватарка обновлена!', 'success')
      load()
    } catch {} finally { setAvatarUploading(false) }
  }

  const handleLike = async (item) => {
    try {
      if (item.liked_by_me) await portfolioApi.unlike(item.id)
      else await portfolioApi.like(item.id)
      load()
    } catch {}
  }

  const handleRemoveSkill = async (skillId) => {
    try { await profilesApi.removeSkill(skillId); load() } catch {}
  }

  const handleAddLanguage = async (langId, level) => {
    try { await profilesApi.addLanguage(langId, level); load() } catch {}
  }

  const handleRemoveLanguage = async (langId) => {
    try { await profilesApi.removeLanguage(langId); load() } catch {}
  }

  if (loading) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', position: 'relative', zIndex: 2 }} />
    </div>
  )

  if (loadError || !userData) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <i className="ti ti-user-x" style={{ fontSize: 48, color: 'var(--text-muted)', position: 'relative', zIndex: 2 }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, position: 'relative', zIndex: 2 }}>Не удалось загрузить профиль</p>
      <button onClick={load} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontSize: 14, position: 'relative', zIndex: 2 }}>
        Попробовать снова
      </button>
    </div>
  )

  const isFreelancer = userData?.role === 'freelancer'

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            <Link to="/freelancers" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >Фрилансеры</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 12, opacity: 0.5 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {userData?.full_name || 'Профиль'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

            {/* Main */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Header card */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                  {/* Avatar — clickable to upload if own profile */}
                  <div style={{ position: 'relative', flexShrink: 0, cursor: isOwnProfile ? 'pointer' : 'default' }}>
                    <Avatar src={userData?.avatar_url} name={userData?.full_name} size={72} />
                    {isOwnProfile && (
                      <>
                        <label htmlFor="avatar-input" style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: avatarUploading ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                          onMouseLeave={e => e.currentTarget.style.background = avatarUploading ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)'}
                        >
                          {avatarUploading
                            ? <i className="ti ti-loader-2" style={{ color: '#fff', fontSize: 18, animation: 'spin 0.8s linear infinite' }} />
                            : <i className="ti ti-camera avatar-cam" style={{ color: '#fff', fontSize: 18, opacity: 0 }} />
                          }
                        </label>
                        <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {userData?.full_name}
                      </h1>
                      {profile?.is_verified && (
                        <i className="ti ti-rosette-discount-check" style={{ fontSize: 20, color: 'var(--accent-green)' }} title="Верифицирован" />
                      )}
                    </div>
                    {profile?.title && (
                      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>{profile.title}</p>
                    )}
                    {profile?.rating > 0 && <Rating value={profile.rating} count={profile.total_jobs} size={14} />}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <Tag color={isFreelancer ? 'purple' : 'green'}>{isFreelancer ? 'Фрилансер' : 'Заказчик'}</Tag>
                      {userData?.bio && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{userData.bio}</span>}
                    </div>
                  </div>
                  {isOwnProfile && !editMode && (
                    <Button variant="outline" size="sm" icon="edit" onClick={() => setEditMode(true)}>
                      Редактировать
                    </Button>
                  )}
                </div>

                {editMode && (
                  <div style={{ paddingTop: 16, borderTop: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Input label="Имя" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                      {isFreelancer && <Input label="Заголовок" placeholder="Senior React Developer" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />}
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>О себе</label>
                      <textarea
                        value={editForm.bio}
                        onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                        rows={3} className="input" placeholder="Расскажи о себе..."
                        style={{ resize: 'vertical', lineHeight: 1.6 }}
                      />
                    </div>
                    {isFreelancer && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Input label="Ставка (TJS/час)" type="number" value={editForm.hourly_rate} onChange={e => setEditForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                        <Input label="Опыт (лет)" type="number" value={editForm.experience_years} onChange={e => setEditForm(f => ({ ...f, experience_years: e.target.value }))} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button variant="green" size="sm" icon="check" loading={saving} onClick={handleSaveProfile}>Сохранить</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Отмена</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              {isFreelancer && (
                <Section title="Навыки">
                  {profile?.skills?.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {profile.skills.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Tag color="purple">{s.name}</Tag>
                          {isOwnProfile && (
                            <button onClick={() => handleRemoveSkill(s.skill_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '0 2px' }}>×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Навыки не добавлены</p>
                  )}
                </Section>
              )}

              {/* Languages */}
              {isFreelancer && (
                <Section title="Языки">
                  {isOwnProfile ? (
                    <LanguageSelector
                      selected={profile?.languages || []}
                      onAdd={handleAddLanguage}
                      onRemove={handleRemoveLanguage}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {profile?.languages?.length > 0 ? profile.languages.map(l => (
                        <span key={l.id} style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 13,
                          background: 'rgba(93,202,165,0.1)',
                          color: 'var(--accent-teal)',
                          border: '0.5px solid rgba(93,202,165,0.2)',
                        }}>
                          {l.name} · <span style={{ opacity: 0.7, fontSize: 11 }}>{LEVEL_LABEL[l.level]}</span>
                        </span>
                      )) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Не указано</p>}
                    </div>
                  )}
                </Section>
              )}

              {/* Certifications */}
              {isFreelancer && certifications.length > 0 && (
                <Section title={`Сертификаты (${certifications.length})`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {certifications.map(cert => (
                      <div key={cert.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderRadius: 12,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(80,72,213,0.03)',
                        border: '0.5px solid var(--border)',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ti ti-certificate" style={{ fontSize: 18, color: '#EF9F27' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{cert.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {cert.issuer} · {new Date(cert.issue_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        {cert.credential_url && (
                          <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{
                            fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
                            textDecoration: 'none', flexShrink: 0,
                          }}>
                            <i className="ti ti-external-link" style={{ fontSize: 13 }} />
                            Открыть
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Portfolio */}
              {isFreelancer && portfolio.length > 0 && (
                <Section title={`Портфолио (${portfolio.length})`}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {portfolio.map(item => (
                      <div key={item.id} style={{
                        border: '0.5px solid var(--border)', borderRadius: 14, overflow: 'hidden',
                        transition: 'border-color 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                        )}
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                          {item.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                            <button onClick={() => handleLike(item)} style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 13, color: item.liked_by_me ? '#F87171' : 'var(--text-muted)',
                            }}>
                              <i className={`ti ti-heart${item.liked_by_me ? '-filled' : ''}`} />
                              {item.likes_count || 0}
                            </button>
                            {item.project_url && (
                              <a href={item.project_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="ti ti-external-link" style={{ fontSize: 12 }} /> Открыть
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Achievements */}
              {(achievements.length > 0 || allAchievements.length > 0) && (
                <Section title={`Достижения · ${achievements.length} получено`}>
                  <div style={{ marginBottom: achievements.length > 0 ? 16 : 0 }}>
                    {/* Earned achievements */}
                    {achievements.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Получены</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {achievements.map(ua => (
                            <AchievementBadge
                              key={ua.id}
                              achievement={ua.achievement}
                              earned={true}
                              earnedAt={ua.earned_at}
                              size="md"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Locked achievements (shown only on own profile) */}
                    {isOwnProfile && allAchievements.length > achievements.length && (
                      <div style={{ marginTop: achievements.length > 0 ? 20 : 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Заблокированы</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {allAchievements
                            .filter(a => !achievements.some(ua => ua.achievement.key === a.key))
                            .slice(0, 8)
                            .map(a => (
                              <AchievementBadge key={a.id} achievement={a} earned={false} size="md" />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Total points */}
                  {achievements.length > 0 && (
                    <div style={{
                      marginTop: 16, padding: '12px 16px', borderRadius: 10,
                      background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        <i className="ti ti-stars" style={{ marginRight: 6, color: '#EF9F27' }} />
                        Всего очков
                      </div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>
                        {achievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0)}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <Section title={`Отзывы (${reviews.length})`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(80,72,213,0.03)', border: '0.5px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={r.reviewer_name || 'Аноним'} size={32} />
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{r.reviewer_name || 'Пользователь'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF9F27', fontSize: 13 }}>
                            <i className="ti ti-star-filled" />
                            <span style={{ fontWeight: 600 }}>{r.rating}</span>
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 90 }}>
              {isFreelancer && profile && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                  {[
                    { icon: 'currency-dollar', label: 'Ставка', value: profile.hourly_rate ? `${Number(profile.hourly_rate).toLocaleString()} TJS/час` : 'Не указана', color: 'var(--accent-green)' },
                    { icon: 'briefcase', label: 'Выполнено работ', value: profile.total_jobs, color: 'var(--accent)' },
                    { icon: 'clock', label: 'Опыт', value: profile.experience_years ? `${profile.experience_years} лет` : '—', color: '#EF9F27' },
                    { icon: 'bolt', label: 'Отклик', value: profile.response_time || 'Быстро', color: 'var(--accent-teal)' },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <i className={`ti ti-${icon}`} style={{ color, fontSize: 15 }} />
                        {label}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                  {isOwnProfile && (
                    <div style={{ paddingTop: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Коннекты</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                        {profile.connects_balance}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isOwnProfile && me && (
                <button
                  onClick={async () => {
                    setFavLoading(true)
                    try {
                      if (isFavorited) {
                        await favoritesApi.removeFreelancer(id)
                        setIsFavorited(false)
                        toast('Удалено из избранного', 'info')
                      } else {
                        await favoritesApi.addFreelancer(id)
                        setIsFavorited(true)
                        toast('Добавлено в избранное!', 'success')
                      }
                    } catch {} finally { setFavLoading(false) }
                  }}
                  disabled={favLoading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                    cursor: favLoading ? 'not-allowed' : 'pointer',
                    border: isFavorited ? '0.5px solid rgba(248,113,113,0.4)' : '0.5px solid var(--border)',
                    background: isFavorited ? 'rgba(248,113,113,0.08)' : 'transparent',
                    color: isFavorited ? '#F87171' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 16 }} />
                  {favLoading ? '...' : isFavorited ? 'Saved' : 'Save freelancer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  )
}
