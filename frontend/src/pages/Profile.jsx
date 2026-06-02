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
const EMPTY_PORTFOLIO = { title: '', description: '', project_url: '', image_url: '' }
const EMPTY_CERT = { title: '', issuer: '', issue_date: '', credential_url: '' }

function GitHubButton({ url }) {
  const username = url.replace(/https?:\/\/(www\.)?github\.com\/?/, '').replace(/\/$/, '') || url
  return (
    <a
      href={url} target="_blank" rel="noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', borderRadius: 16,
        background: '#161B22',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', textDecoration: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        transition: 'all 0.22s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = '1px solid rgba(127,119,221,0.55)'
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(127,119,221,0.2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ti ti-brand-github" style={{ fontSize: 24, color: '#161B22' }} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>GitHub</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{username}
        </div>
      </div>
      <i className="ti ti-arrow-right" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
    </a>
  )
}

function SkillSelector({ selected = [], onAdd, onRemove }) {
  const [all, setAll] = useState([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    client.get('/skills/').then(r => setAll(r.data || [])).catch(() => {})
  }, [])

  const available = all.filter(s =>
    !selected.find(sel => sel.skill_id === s.id) &&
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selected.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px 4px 12px', borderRadius: 20, fontSize: 13,
              background: 'rgba(127,119,221,0.12)', border: '0.5px solid rgba(127,119,221,0.25)',
              color: 'var(--text-primary)',
            }}>
              {s.name}
              <button onClick={() => onRemove(s.skill_id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2,
              }}>×</button>
            </div>
          ))}
        </div>
      )}
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          padding: '6px 14px', borderRadius: 10, fontSize: 13,
          border: '0.5px solid rgba(127,119,221,0.35)', background: 'transparent',
          color: 'var(--accent)', cursor: 'pointer',
        }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Добавить навык
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            className="input"
            placeholder="Поиск навыка..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={() => { setOpen(false); setQuery('') }} style={{
            padding: '0 12px', borderRadius: 10, border: '0.5px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          }}>✕</button>
        </div>
      )}
      {open && query.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: 12, borderRadius: 10, background: 'var(--bg)',
          border: '0.5px solid var(--border)', maxHeight: 120, overflowY: 'auto',
        }}>
          {available.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ничего не найдено</span>}
          {available.map(s => (
            <button key={s.id} onClick={() => { onAdd(s.id); setQuery(''); setOpen(false) }} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12,
              background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)',
              color: 'var(--accent)', cursor: 'pointer',
            }}>
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user: me, setUser } = useAuthStore()
  const isOwnProfile = me?.id === id
  const toast = useToastStore(s => s.show)

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

  const [activeTab, setActiveTab] = useState('about')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', title: '', hourly_rate: '', experience_years: '', github_url: '' })
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Portfolio CRUD
  const [showPortfolioAdd, setShowPortfolioAdd] = useState(false)
  const [portfolioAddForm, setPortfolioAddForm] = useState(EMPTY_PORTFOLIO)
  const [portfolioAddLoading, setPortfolioAddLoading] = useState(false)
  const [editingPortfolioId, setEditingPortfolioId] = useState(null)
  const [editingPortfolioForm, setEditingPortfolioForm] = useState(EMPTY_PORTFOLIO)
  const [portfolioImageUploading, setPortfolioImageUploading] = useState(false)

  // Certification CRUD
  const [showCertAdd, setShowCertAdd] = useState(false)
  const [certAddForm, setCertAddForm] = useState(EMPTY_CERT)
  const [certAddLoading, setCertAddLoading] = useState(false)
  const [editingCertId, setEditingCertId] = useState(null)
  const [editingCertForm, setEditingCertForm] = useState(EMPTY_CERT)

  const load = () => {
    setLoading(true); setLoadError(false)
    Promise.all([
      client.get(`/users/${id}`),
      profilesApi.get(id).catch(() => ({ data: null })),
      portfolioApi.getByUser(id).catch(() => ({ data: [] })),
      reviewsApi.getByUser(id).catch(() => ({ data: [] })),
      achievementsApi.getForUser(id).catch(() => ({ data: [] })),
      achievementsApi.getAll().catch(() => ({ data: [] })),
    ]).then(([u, p, po, rv, ua, aa]) => {
      setUserData(u.data); setProfile(p.data)
      setPortfolio(po.data || []); setReviews(rv.data || [])
      setAchievements(ua.data || []); setAllAchievements(aa.data || [])
      if (p.data) {
        setEditForm({
          full_name: u.data?.full_name || '',
          bio: u.data?.bio || '',
          title: p.data.title || '',
          hourly_rate: p.data.hourly_rate || '',
          experience_years: p.data.experience_years || '',
          github_url: p.data.github_url || '',
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
      const userUpdates = {}
      if (editForm.full_name && editForm.full_name !== userData?.full_name) userUpdates.full_name = editForm.full_name
      if (editForm.bio !== (userData?.bio || '')) userUpdates.bio = editForm.bio
      if (Object.keys(userUpdates).length) await client.put('/users/me', userUpdates)
      if (isFreelancer) {
        await profilesApi.updateMe({
          title: editForm.title || undefined,
          hourly_rate: parseFloat(editForm.hourly_rate) || undefined,
          experience_years: parseInt(editForm.experience_years) || undefined,
          github_url: editForm.github_url || null,
        })
      }
      setEditMode(false); toast('Профиль сохранён', 'success'); load()
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await client.post('/media/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data?.url && me) setUser({ ...me, avatar_url: data.url })
      toast('Аватарка обновлена!', 'success'); load()
    } catch {} finally { setAvatarUploading(false) }
  }

  const handleAddSkill = async (skillId) => {
    try { await profilesApi.addSkill(skillId); load() } catch {}
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

  // Portfolio
  const handlePortfolioImageUpload = async (e, setter) => {
    const file = e.target.files[0]; if (!file) return
    setPortfolioImageUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await client.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data?.url) setter(f => ({ ...f, image_url: data.url }))
    } catch { toast('Ошибка загрузки', 'error') }
    finally { setPortfolioImageUploading(false) }
  }
  const handleAddPortfolio = async (e) => {
    e.preventDefault()
    if (!portfolioAddForm.title.trim()) { toast('Укажите название', 'error'); return }
    setPortfolioAddLoading(true)
    try {
      await portfolioApi.create({ title: portfolioAddForm.title, description: portfolioAddForm.description || null, project_url: portfolioAddForm.project_url || null, image_url: portfolioAddForm.image_url || null })
      toast('Работа добавлена!', 'success'); setShowPortfolioAdd(false); setPortfolioAddForm(EMPTY_PORTFOLIO); load()
    } catch (err) { toast(err.response?.data?.detail || 'Ошибка', 'error') }
    finally { setPortfolioAddLoading(false) }
  }
  const handleDeletePortfolio = async (itemId) => {
    try { await portfolioApi.delete(itemId); toast('Удалено', 'info'); load() } catch { toast('Ошибка', 'error') }
  }
  const handleSavePortfolio = async (e) => {
    e.preventDefault()
    if (!editingPortfolioForm.title.trim()) { toast('Укажите название', 'error'); return }
    try {
      await portfolioApi.update(editingPortfolioId, { title: editingPortfolioForm.title, description: editingPortfolioForm.description || null, project_url: editingPortfolioForm.project_url || null, image_url: editingPortfolioForm.image_url || null })
      toast('Сохранено', 'success'); setEditingPortfolioId(null); load()
    } catch { toast('Ошибка', 'error') }
  }
  const handleLike = async (item) => {
    try { if (item.liked_by_me) await portfolioApi.unlike(item.id); else await portfolioApi.like(item.id); load() } catch {}
  }

  // Certifications
  const handleAddCert = async (e) => {
    e.preventDefault()
    if (!certAddForm.title.trim()) { toast('Укажите название', 'error'); return }
    setCertAddLoading(true)
    try {
      await certificationsApi.create({ profile_id: profile.id, title: certAddForm.title, issuer: certAddForm.issuer || null, issue_date: certAddForm.issue_date || null, credential_url: certAddForm.credential_url || null })
      toast('Сертификат добавлен!', 'success'); setShowCertAdd(false); setCertAddForm(EMPTY_CERT); load()
    } catch { toast('Ошибка', 'error') }
    finally { setCertAddLoading(false) }
  }
  const handleDeleteCert = async (certId) => {
    try { await certificationsApi.delete(certId); toast('Удалено', 'info'); load() } catch { toast('Ошибка', 'error') }
  }
  const handleSaveCert = async (e) => {
    e.preventDefault()
    try {
      await certificationsApi.update(editingCertId, { title: editingCertForm.title, issuer: editingCertForm.issuer || null, issue_date: editingCertForm.issue_date || null, credential_url: editingCertForm.credential_url || null })
      toast('Сохранено', 'success'); setEditingCertId(null); load()
    } catch { toast('Ошибка', 'error') }
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
      <button onClick={load} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontSize: 14, position: 'relative', zIndex: 2 }}>Попробовать снова</button>
    </div>
  )

  const isFreelancer = userData?.role === 'freelancer'

  const tabs = [
    { key: 'about', label: 'О себе', icon: 'user' },
    ...(isFreelancer ? [
      { key: 'portfolio', label: 'Портфолио', icon: 'layout-grid', count: portfolio.length },
      { key: 'certs', label: 'Сертификаты', icon: 'certificate', count: certifications.length },
    ] : []),
    { key: 'reviews', label: 'Отзывы', icon: 'star', count: reviews.length },
    { key: 'achievements', label: 'Достижения', icon: 'trophy', count: achievements.length },
  ]

  const statItems = isFreelancer && profile ? [
    { icon: 'currency-dollar', label: 'Ставка', value: profile.hourly_rate ? `$${Number(profile.hourly_rate).toLocaleString()}/hr` : '—', color: 'var(--accent-green)' },
    { icon: 'briefcase', label: 'Выполнено', value: profile.total_jobs || 0, color: 'var(--accent)' },
    { icon: 'clock', label: 'Опыт', value: profile.experience_years ? `${profile.experience_years} лет` : '—', color: '#EF9F27' },
    { icon: 'bolt', label: 'Отклик', value: profile.response_time || 'Быстро', color: 'var(--accent-teal)' },
  ] : []

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            <Link to="/freelancers" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >Фрилансеры</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 11, opacity: 0.4 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{userData?.full_name || 'Профиль'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 28, alignItems: 'start' }}>

            {/* ── LEFT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 90 }}>

              {/* Profile card */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '28px 22px', textAlign: 'center' }}>

                {/* Avatar */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar src={userData?.avatar_url} name={userData?.full_name} size={88} />
                    {isOwnProfile && (
                      <>
                        <label htmlFor="avatar-input" style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: avatarUploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                          onMouseLeave={e => e.currentTarget.style.background = avatarUploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)'}
                        >
                          {avatarUploading
                            ? <i className="ti ti-loader-2" style={{ color: '#fff', fontSize: 20, animation: 'spin 0.8s linear infinite' }} />
                            : <i className="ti ti-camera" style={{ color: '#fff', fontSize: 20 }} />}
                        </label>
                        <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                      </>
                    )}
                  </div>
                  {profile?.is_verified && (
                    <div style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 0 2px var(--bg-card)',
                    }}>
                      <i className="ti ti-rosette-discount-check" style={{ fontSize: 18, color: 'var(--accent-green)' }} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                  {userData?.full_name}
                </h1>

                {/* Title */}
                {profile?.title && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{profile.title}</p>
                )}

                {/* Rating */}
                {profile?.rating > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <Rating value={profile.rating} count={profile.total_jobs} size={13} />
                  </div>
                )}

                {/* Role tag */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
                  <Tag color={isFreelancer ? 'purple' : 'green'}>{isFreelancer ? 'Фрилансер' : 'Заказчик'}</Tag>
                </div>

                {/* Actions */}
                {isOwnProfile && !editMode && (
                  <button onClick={() => { setEditMode(true); setActiveTab('about') }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: '0.5px solid var(--border)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 14 }} />
                    Редактировать
                  </button>
                )}

                {!isOwnProfile && me && (
                  <button
                    onClick={async () => {
                      setFavLoading(true)
                      try {
                        if (isFavorited) { await favoritesApi.removeFreelancer(id); setIsFavorited(false); toast('Удалено из избранного', 'info') }
                        else { await favoritesApi.addFreelancer(id); setIsFavorited(true); toast('Добавлено в избранное!', 'success') }
                      } catch {} finally { setFavLoading(false) }
                    }}
                    disabled={favLoading}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                      cursor: favLoading ? 'not-allowed' : 'pointer',
                      border: isFavorited ? '0.5px solid rgba(248,113,113,0.4)' : '0.5px solid var(--border)',
                      background: isFavorited ? 'rgba(248,113,113,0.08)' : 'transparent',
                      color: isFavorited ? '#F87171' : 'var(--text-secondary)',
                    }}
                  >
                    <i className={`ti ti-heart${isFavorited ? '-filled' : ''}`} style={{ fontSize: 15 }} />
                    {favLoading ? '...' : isFavorited ? 'В избранном' : 'В избранное'}
                  </button>
                )}
              </div>

              {/* GitHub button */}
              {profile?.github_url && <GitHubButton url={profile.github_url} />}

              {/* Stats card */}
              {isFreelancer && profile && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '6px 0' }}>
                  {statItems.map(({ icon, label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: '0.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <i className={`ti ti-${icon}`} style={{ color, fontSize: 15 }} />
                        {label}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{value}</span>
                    </div>
                  ))}
                  {isOwnProfile && (
                    <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <i className="ti ti-antenna" style={{ color: 'var(--accent-light)', fontSize: 15 }} />
                        Коннекты
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}>
                        {profile.connects_balance}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>

              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
                {tabs.map(tab => {
                  const active = activeTab === tab.key
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                      padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                      marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 7,
                      transition: 'color 0.15s',
                    }}>
                      {tab.label}
                      {tab.count > 0 && (
                        <span style={{
                          fontSize: 11, padding: '1px 7px', borderRadius: 10,
                          background: active ? 'rgba(127,119,221,0.15)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                        }}>{tab.count}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* ── О себе ── */}
              {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {editMode ? (
                    /* Edit form */
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Редактирование профиля
                        </h3>
                        <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <Input label="Имя" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                          {isFreelancer && <Input label="Заголовок" placeholder="Senior React Developer" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />}
                        </div>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>О себе</label>
                          <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={4} className="input" placeholder="Расскажи о себе..." style={{ resize: 'vertical', lineHeight: 1.6 }} />
                        </div>
                        {isFreelancer && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                              <Input label="Hourly rate ($/hr)" type="number" value={editForm.hourly_rate} onChange={e => setEditForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                              <Input label="Опыт (лет)" type="number" value={editForm.experience_years} onChange={e => setEditForm(f => ({ ...f, experience_years: e.target.value }))} />
                            </div>
                            <Input label="GitHub URL" placeholder="https://github.com/username" value={editForm.github_url} onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))} icon="brand-github" />
                          </>
                        )}
                        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                          <Button variant="green" size="sm" icon="check" loading={saving} onClick={handleSaveProfile}>Сохранить</Button>
                          <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Отмена</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Bio display */
                    userData?.bio && (
                      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 24 }}>
                        <SectionTitle>О себе</SectionTitle>
                        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 300 }}>{userData.bio}</p>
                      </div>
                    )
                  )}

                  {/* Skills */}
                  {isFreelancer && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
                      <SectionTitle>Навыки</SectionTitle>
                      {isOwnProfile ? (
                        <SkillSelector selected={profile?.skills || []} onAdd={handleAddSkill} onRemove={handleRemoveSkill} />
                      ) : (
                        profile?.skills?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {profile.skills.map(s => <Tag key={s.id} color="purple">{s.name}</Tag>)}
                          </div>
                        ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Навыки не добавлены</p>
                      )}
                    </div>
                  )}

                  {/* Languages */}
                  {isFreelancer && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
                      <SectionTitle>Языки</SectionTitle>
                      {isOwnProfile ? (
                        <LanguageSelector selected={profile?.languages || []} onAdd={handleAddLanguage} onRemove={handleRemoveLanguage} />
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {profile?.languages?.length > 0 ? profile.languages.map(l => (
                            <span key={l.id} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, background: 'rgba(93,202,165,0.1)', color: 'var(--accent-teal)', border: '0.5px solid rgba(93,202,165,0.2)' }}>
                              {l.name} · <span style={{ opacity: 0.7, fontSize: 11 }}>{LEVEL_LABEL[l.level]}</span>
                            </span>
                          )) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Не указано</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {!userData?.bio && !isFreelancer && !editMode && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-user-circle" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.25 }} />
                      <div style={{ fontSize: 14 }}>Профиль пуст</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Портфолио ── */}
              {activeTab === 'portfolio' && isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {isOwnProfile && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowPortfolioAdd(v => !v); setEditingPortfolioId(null) }} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, fontSize: 13,
                        border: '0.5px solid rgba(127,119,221,0.4)', background: showPortfolioAdd ? 'rgba(127,119,221,0.12)' : 'transparent',
                        color: 'var(--accent)', cursor: 'pointer',
                      }}>
                        <i className={`ti ti-${showPortfolioAdd ? 'x' : 'plus'}`} style={{ fontSize: 13 }} />
                        {showPortfolioAdd ? 'Отмена' : 'Добавить работу'}
                      </button>
                    </div>
                  )}

                  {showPortfolioAdd && isOwnProfile && (
                    <form onSubmit={handleAddPortfolio} style={{ padding: 20, borderRadius: 16, background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Input label="Название *" placeholder="Мой проект" value={portfolioAddForm.title} onChange={e => setPortfolioAddForm(f => ({ ...f, title: e.target.value }))} />
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Описание</label>
                        <textarea value={portfolioAddForm.description} onChange={e => setPortfolioAddForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Что было сделано..." style={{ width: '100%', resize: 'vertical', padding: '10px 14px', boxSizing: 'border-box', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Input label="Ссылка на проект" placeholder="https://..." value={portfolioAddForm.project_url} onChange={e => setPortfolioAddForm(f => ({ ...f, project_url: e.target.value }))} icon="external-link" />
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Изображение</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="input" placeholder="URL или загрузить →" value={portfolioAddForm.image_url} onChange={e => setPortfolioAddForm(f => ({ ...f, image_url: e.target.value }))} style={{ flex: 1, fontSize: 13 }} />
                            <label style={{ padding: '0 12px', borderRadius: 10, cursor: portfolioImageUploading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
                              {portfolioImageUploading ? <i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} /> : <i className="ti ti-upload" style={{ fontSize: 15, color: 'var(--text-muted)' }} />}
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePortfolioImageUpload(e, setPortfolioAddForm)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      {portfolioAddForm.image_url && <img src={portfolioAddForm.image_url} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" variant="primary" size="sm" icon="plus" loading={portfolioAddLoading}>Добавить</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowPortfolioAdd(false); setPortfolioAddForm(EMPTY_PORTFOLIO) }}>Отмена</Button>
                      </div>
                    </form>
                  )}

                  {portfolio.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      {portfolio.map(item => (
                        editingPortfolioId === item.id ? (
                          <form key={item.id} onSubmit={handleSavePortfolio} style={{ border: '0.5px solid rgba(127,119,221,0.35)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(127,119,221,0.05)' }}>
                            <Input label="Название *" value={editingPortfolioForm.title} onChange={e => setEditingPortfolioForm(f => ({ ...f, title: e.target.value }))} />
                            <textarea value={editingPortfolioForm.description} onChange={e => setEditingPortfolioForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Описание" style={{ width: '100%', resize: 'vertical', padding: '8px 12px', boxSizing: 'border-box', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                            <Input label="Ссылка" placeholder="https://..." value={editingPortfolioForm.project_url} onChange={e => setEditingPortfolioForm(f => ({ ...f, project_url: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="input" placeholder="Image URL" value={editingPortfolioForm.image_url} onChange={e => setEditingPortfolioForm(f => ({ ...f, image_url: e.target.value }))} style={{ flex: 1, fontSize: 12 }} />
                              <label style={{ padding: '0 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', height: 40 }}>
                                <i className="ti ti-upload" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePortfolioImageUpload(e, setEditingPortfolioForm)} />
                              </label>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button type="submit" variant="green" size="sm">Сохранить</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPortfolioId(null)}>Отмена</Button>
                            </div>
                          </form>
                        ) : (
                          <div key={item.id} style={{ border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)', position: 'relative' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            {item.image_url
                              ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                              : <div style={{ height: 90, background: isDark ? 'rgba(127,119,221,0.07)' : 'rgba(80,72,213,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-photo" style={{ fontSize: 30, color: 'rgba(127,119,221,0.25)' }} />
                              </div>}
                            <div style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                              {item.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{item.description}</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={() => handleLike(item)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: item.liked_by_me ? '#F87171' : 'var(--text-muted)' }}>
                                  <i className={`ti ti-heart${item.liked_by_me ? '-filled' : ''}`} />
                                  {item.likes_count || 0}
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {item.project_url && (
                                    <a href={item.project_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                      <i className="ti ti-external-link" style={{ fontSize: 12 }} /> Открыть
                                    </a>
                                  )}
                                  {isOwnProfile && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button onClick={() => { setEditingPortfolioId(item.id); setEditingPortfolioForm({ title: item.title, description: item.description || '', project_url: item.project_url || '', image_url: item.image_url || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                      ><i className="ti ti-pencil" style={{ fontSize: 14 }} /></button>
                                      <button onClick={() => handleDeletePortfolio(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                      ><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    !showPortfolioAdd && (
                      <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                        <i className="ti ti-photo-off" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.25 }} />
                        <div style={{ fontSize: 14 }}>{isOwnProfile ? 'Добавьте свои работы' : 'Нет работ'}</div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ── Сертификаты ── */}
              {activeTab === 'certs' && isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {isOwnProfile && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowCertAdd(v => !v); setEditingCertId(null) }} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, fontSize: 13,
                        border: '0.5px solid rgba(239,159,39,0.4)', background: showCertAdd ? 'rgba(239,159,39,0.1)' : 'transparent',
                        color: '#EF9F27', cursor: 'pointer',
                      }}>
                        <i className={`ti ti-${showCertAdd ? 'x' : 'plus'}`} style={{ fontSize: 13 }} />
                        {showCertAdd ? 'Отмена' : 'Добавить сертификат'}
                      </button>
                    </div>
                  )}

                  {showCertAdd && isOwnProfile && (
                    <form onSubmit={handleAddCert} style={{ padding: 20, borderRadius: 16, background: 'rgba(239,159,39,0.05)', border: '0.5px solid rgba(239,159,39,0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Input label="Название *" placeholder="AWS Certified Developer" value={certAddForm.title} onChange={e => setCertAddForm(f => ({ ...f, title: e.target.value }))} />
                        <Input label="Организация" placeholder="Amazon, Coursera..." value={certAddForm.issuer} onChange={e => setCertAddForm(f => ({ ...f, issuer: e.target.value }))} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Input label="Дата получения" type="date" value={certAddForm.issue_date} onChange={e => setCertAddForm(f => ({ ...f, issue_date: e.target.value }))} />
                        <Input label="Ссылка на диплом" placeholder="https://..." value={certAddForm.credential_url} onChange={e => setCertAddForm(f => ({ ...f, credential_url: e.target.value }))} icon="external-link" />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" variant="primary" size="sm" icon="plus" loading={certAddLoading}>Добавить</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowCertAdd(false); setCertAddForm(EMPTY_CERT) }}>Отмена</Button>
                      </div>
                    </form>
                  )}

                  {certifications.length > 0 ? certifications.map(cert => (
                    editingCertId === cert.id ? (
                      <form key={cert.id} onSubmit={handleSaveCert} style={{ padding: 18, borderRadius: 14, border: '0.5px solid rgba(239,159,39,0.3)', background: 'rgba(239,159,39,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Input label="Название *" value={editingCertForm.title} onChange={e => setEditingCertForm(f => ({ ...f, title: e.target.value }))} />
                          <Input label="Организация" value={editingCertForm.issuer} onChange={e => setEditingCertForm(f => ({ ...f, issuer: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Input label="Дата" type="date" value={editingCertForm.issue_date} onChange={e => setEditingCertForm(f => ({ ...f, issue_date: e.target.value }))} />
                          <Input label="Ссылка" value={editingCertForm.credential_url} onChange={e => setEditingCertForm(f => ({ ...f, credential_url: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button type="submit" variant="green" size="sm">Сохранить</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingCertId(null)}>Отмена</Button>
                        </div>
                      </form>
                    ) : (
                      <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,159,39,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-certificate" style={{ fontSize: 22, color: '#EF9F27' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{cert.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                            {cert.issuer && <span>{cert.issuer}</span>}
                            {cert.issue_date && <span>· {new Date(cert.issue_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          {cert.credential_url && (
                            <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(127,119,221,0.3)' }}>
                              <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Открыть
                            </a>
                          )}
                          {isOwnProfile && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => { setEditingCertId(cert.id); setEditingCertForm({ title: cert.title, issuer: cert.issuer || '', issue_date: cert.issue_date ? cert.issue_date.slice(0, 10) : '', credential_url: cert.credential_url || '' }) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6 }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              ><i className="ti ti-pencil" style={{ fontSize: 15 }} /></button>
                              <button onClick={() => handleDeleteCert(cert.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              ><i className="ti ti-trash" style={{ fontSize: 15 }} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )) : (
                    !showCertAdd && (
                      <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                        <i className="ti ti-certificate" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }} />
                        <div style={{ fontSize: 14 }}>{isOwnProfile ? 'Добавьте сертификаты' : 'Нет сертификатов'}</div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ── Отзывы ── */}
              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.length > 0 ? reviews.map(r => (
                    <div key={r.id} style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={r.reviewer_name || 'Аноним'} size={36} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.reviewer_name || 'Пользователь'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF9F27', background: 'rgba(239,159,39,0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 13 }}>
                          <i className="ti ti-star-filled" />
                          <span style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{r.rating}</span>
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{r.comment}</p>}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-star-off" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }} />
                      <div style={{ fontSize: 14 }}>Нет отзывов</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Достижения ── */}
              {activeTab === 'achievements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {achievements.length > 0 && (
                    <div>
                      <SectionTitle>Получены</SectionTitle>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                        {achievements.map(ua => (
                          <AchievementBadge key={ua.id} achievement={ua.achievement} earned={true} earnedAt={ua.earned_at} size="md" />
                        ))}
                      </div>
                      <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <i className="ti ti-stars" style={{ color: '#EF9F27', fontSize: 16 }} />
                          Всего очков
                        </div>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
                          {achievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0)}
                        </span>
                      </div>
                    </div>
                  )}
                  {isOwnProfile && allAchievements.length > achievements.length && (
                    <div>
                      <SectionTitle>Заблокированы</SectionTitle>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                        {allAchievements.filter(a => !achievements.some(ua => ua.achievement.key === a.key)).slice(0, 8).map(a => (
                          <AchievementBadge key={a.id} achievement={a} earned={false} size="md" />
                        ))}
                      </div>
                    </div>
                  )}
                  {achievements.length === 0 && !isOwnProfile && (
                    <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-trophy" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }} />
                      <div style={{ fontSize: 14 }}>Нет достижений</div>
                    </div>
                  )}
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

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  )
}
