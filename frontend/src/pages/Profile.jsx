import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { profilesApi } from '../api/profiles'
import { portfolioApi } from '../api/portfolio'
import { reviewsApi } from '../api/reviews'
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

const LEVEL_LABEL = { basic: 'Базовый', conversational: 'Разговорный', fluent: 'Свободный', native: 'Родной' }

export default function Profile() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user: me } = useAuthStore()
  const isOwnProfile = me?.id === id

  const [userData, setUserData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', hourly_rate: '', experience_years: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      client.get(`/users/${id}`),
      profilesApi.get(id).catch(() => ({ data: null })),
      portfolioApi.getByUser(id).catch(() => ({ data: [] })),
      reviewsApi.getByUser(id).catch(() => ({ data: [] })),
    ]).then(([u, p, po, rv]) => {
      setUserData(u.data)
      setProfile(p.data)
      setPortfolio(po.data || [])
      setReviews(rv.data || [])
      if (p.data) setEditForm({ title: p.data.title || '', hourly_rate: p.data.hourly_rate || '', experience_years: p.data.experience_years || '' })
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await profilesApi.updateMe({ title: editForm.title, hourly_rate: parseFloat(editForm.hourly_rate) || undefined, experience_years: parseInt(editForm.experience_years) || undefined })
      setEditMode(false)
      load()
    } finally { setSaving(false) }
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

  const isFreelancer = userData?.role === 'freelancer'

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

            {/* Main */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Header card */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                  <Avatar src={userData?.avatar_url} name={userData?.full_name} size={72} />
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
                  {isOwnProfile && (
                    <Button variant={editMode ? 'green' : 'outline'} size="sm" icon={editMode ? 'check' : 'edit'}
                      loading={saving}
                      onClick={editMode ? handleSaveProfile : () => setEditMode(true)}>
                      {editMode ? 'Сохранить' : 'Редактировать'}
                    </Button>
                  )}
                </div>

                {editMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, paddingTop: 16, borderTop: '0.5px solid var(--border)' }}>
                    <Input label="Заголовок" placeholder="Senior React Developer" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    <Input label="Ставка (TJS/час)" type="number" value={editForm.hourly_rate} onChange={e => setEditForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                    <Input label="Опыт (лет)" type="number" value={editForm.experience_years} onChange={e => setEditForm(f => ({ ...f, experience_years: e.target.value }))} />
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

              {!isOwnProfile && (
                <Button variant="outline" icon="heart" style={{ width: '100%' }}>В избранное</Button>
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
