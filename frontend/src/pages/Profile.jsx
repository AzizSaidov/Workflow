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
import { categoriesApi } from '../api/categories'
import useToastStore from '../store/toastStore'

const LEVEL_LABEL = { basic: 'Базовый', conversational: 'Разговорный', fluent: 'Свободный', native: 'Родной' }
const EMPTY_PORTFOLIO = { title: '', description: '', project_url: '', image_url: '' }
const EMPTY_CERT = { title: '', issuer: '', issue_date: '', credential_url: '' }

function SkillSelector({ selected = [], onAdd, onRemove }) {
  const [all, setAll] = useState([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  useEffect(() => { client.get('/skills/').then(r => setAll(r.data || [])).catch(() => {}) }, [])
  const available = all.filter(s => !selected.find(sel => sel.skill_id === s.id) && s.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {selected.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px 3px 12px', borderRadius: 20, fontSize: 12, background: 'rgba(127,119,221,0.12)', border: '0.5px solid rgba(127,119,221,0.25)', color: 'var(--text-primary)' }}>
              {s.name}
              <button onClick={() => onRemove(s.skill_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 9, fontSize: 12, border: '0.5px solid rgba(127,119,221,0.35)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
          <i className="ti ti-plus" style={{ fontSize: 12 }} /> Добавить навык
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoFocus className="input" placeholder="Поиск навыка..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
          <button onClick={() => { setOpen(false); setQuery('') }} style={{ padding: '0 12px', borderRadius: 9, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
      )}
      {open && available.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 10, borderRadius: 9, background: 'var(--bg)', border: '0.5px solid var(--border)', maxHeight: 120, overflowY: 'auto' }}>
          {available.slice(0, 20).map(s => (
            <button key={s.id} onClick={() => { onAdd(s.id); setQuery('') }} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)', color: 'var(--accent)', cursor: 'pointer' }}>
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GitHubButton({ url }) {
  const [hov, setHov] = useState(false)
  const handle = url.replace(/https?:\/\/(www\.)?github\.com\/?/, '').replace(/\/$/, '') || 'GitHub'

  return (
    <>
      <style>{`
        @keyframes ghShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ghPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'block',
          textDecoration: 'none',
          borderRadius: 16,
          padding: 1.5,
          background: hov
            ? 'linear-gradient(135deg, #6e40c9, #238636, #6e40c9)'
            : 'linear-gradient(135deg, rgba(110,64,201,0.5), rgba(35,134,54,0.5))',
          backgroundSize: '200% 200%',
          animation: hov ? 'ghShimmer 1.8s linear infinite' : 'none',
          transition: 'box-shadow 0.3s',
          boxShadow: hov
            ? '0 0 24px rgba(110,64,201,0.4), 0 0 48px rgba(35,134,54,0.15)'
            : '0 0 8px rgba(110,64,201,0.15)',
        }}
      >
        <div style={{
          background: hov ? '#161B22' : '#0D1117',
          borderRadius: 14.5,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'background 0.25s',
        }}>
          {/* Icon with pulse dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <i className="ti ti-brand-github" style={{ fontSize: 24, color: '#fff', display: 'block' }} />
            <div style={{
              position: 'absolute', bottom: 0, right: -1,
              width: 8, height: 8, borderRadius: '50%',
              background: '#238636',
              border: '1.5px solid #0D1117',
              animation: 'ghPulse 2s ease-in-out infinite',
            }} />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2, fontFamily: 'DM Sans, sans-serif' }}>
              GitHub профиль
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
              @{handle}
            </div>
          </div>

          {/* Arrow */}
          <i className="ti ti-arrow-up-right" style={{
            fontSize: 18,
            color: hov ? '#238636' : 'rgba(255,255,255,0.3)',
            flexShrink: 0,
            transition: 'color 0.2s, transform 0.2s',
            transform: hov ? 'translate(2px, -2px)' : 'none',
          }} />
        </div>
      </a>
    </>
  )
}

function CertFile({ url }) {
  if (!url) return null
  const isPdf = url.toLowerCase().includes('.pdf')
  const isImg = /\.(jpg|jpeg|png|gif|webp)/i.test(url)
  if (isImg) return <img src={url} alt="cert" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '0.5px solid var(--border)', flexShrink: 0 }} />
  if (isPdf) return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.25)', color: '#F87171', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
      <i className="ti ti-file-type-pdf" style={{ fontSize: 15 }} /> PDF
    </a>
  )
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(127,119,221,0.3)', color: 'var(--accent)', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
      <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Открыть
    </a>
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
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [favHov, setFavHov] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [clientProjects, setClientProjects] = useState([])
  const [activeTab, setActiveTab] = useState('about')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', title: '', experience_years: '', github_url: '', category_id: '' })
  const [categories, setCategories] = useState([])
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
  const [certFileUploading, setCertFileUploading] = useState(false)

  const load = () => {
    setLoading(true); setLoadError(false)
    Promise.all([
      client.get(`/users/${id}`),
      profilesApi.get(id).catch(() => ({ data: null })),
      portfolioApi.getByUser(id).catch(() => ({ data: [] })),
      reviewsApi.getByUser(id).catch(() => ({ data: [] })),
      achievementsApi.getForUser(id).catch(() => ({ data: [] })),
    ]).then(([u, p, po, rv, ua]) => {
      setUserData(u.data); setProfile(p.data)
      setPortfolio(po.data || []); setReviews(rv.data || [])
      setAchievements(ua.data || [])
      if (p.data) {
        setEditForm({ full_name: u.data?.full_name || '', bio: u.data?.bio || '', title: p.data.title || '', experience_years: p.data.experience_years || '', github_url: p.data.github_url || '', category_id: p.data.category_id || '' })
        certificationsApi.getByProfile(p.data.id).then(r => setCertifications(r.data || [])).catch(() => {})
      }
    }).catch(() => setLoadError(true)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {}) }, [])
  useEffect(() => {
    if (!me || me.id === id) return
    favoritesApi.getAll().then(r => setIsFavorited((r.data || []).some(f => f.freelancer_id === id))).catch(() => {})
  }, [id, me])
  useEffect(() => {
    profilesApi.getLikes(id)
      .then(r => { setLikesCount(r.data.likes_count); setIsLiked(r.data.liked) })
      .catch(() => {})
  }, [id, me?.id])
  useEffect(() => {
    if (!userData || userData.role !== 'client') return
    client.get(`/projects/?limit=20`).then(r => {
      const all = r.data?.items || r.data || []
      setClientProjects(all.filter(p => p.client_id === id))
    }).catch(() => {})
  }, [userData?.id])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const userUpdates = {}
      if (editForm.full_name && editForm.full_name !== userData?.full_name) userUpdates.full_name = editForm.full_name
      if (editForm.bio !== (userData?.bio || '')) userUpdates.bio = editForm.bio
      if (Object.keys(userUpdates).length) await client.put('/users/me', userUpdates)
      if (isFreelancer) await profilesApi.updateMe({ title: editForm.title || undefined, experience_years: parseInt(editForm.experience_years) || undefined, github_url: editForm.github_url || null, category_id: editForm.category_id || null })
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

  const handleAddSkill = async (skillId) => { try { await profilesApi.addSkill(skillId); load() } catch {} }
  const handleRemoveSkill = async (skillId) => { try { await profilesApi.removeSkill(skillId); load() } catch {} }
  const handleAddLanguage = async (langId, level) => { try { await profilesApi.addLanguage(langId, level); load() } catch {} }
  const handleRemoveLanguage = async (langId) => { try { await profilesApi.removeLanguage(langId); load() } catch {} }

  const handlePortfolioImageUpload = async (e, setter) => {
    const file = e.target.files[0]; if (!file) return
    setPortfolioImageUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await client.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data?.url) setter(f => ({ ...f, image_url: data.url }))
    } catch { toast('Ошибка загрузки', 'error') } finally { setPortfolioImageUploading(false) }
  }

  const handleCertFileUpload = async (e, setter) => {
    const file = e.target.files[0]; if (!file) return
    setCertFileUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await client.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data?.url) setter(f => ({ ...f, credential_url: data.url }))
      toast('Файл загружен', 'success')
    } catch { toast('Ошибка загрузки файла', 'error') } finally { setCertFileUploading(false) }
  }

  const handleAddPortfolio = async (e) => {
    e.preventDefault()
    if (!portfolioAddForm.title.trim()) { toast('Укажите название', 'error'); return }
    setPortfolioAddLoading(true)
    try {
      await portfolioApi.create({ title: portfolioAddForm.title, description: portfolioAddForm.description || null, project_url: portfolioAddForm.project_url || null, image_url: portfolioAddForm.image_url || null })
      toast('Работа добавлена!', 'success'); setShowPortfolioAdd(false); setPortfolioAddForm(EMPTY_PORTFOLIO); load()
    } catch (err) { toast(err.response?.data?.detail || 'Ошибка', 'error') } finally { setPortfolioAddLoading(false) }
  }
  const handleDeletePortfolio = async (itemId) => { try { await portfolioApi.delete(itemId); toast('Удалено', 'info'); load() } catch { toast('Ошибка', 'error') } }
  const handleSavePortfolio = async (e) => {
    e.preventDefault()
    try {
      await portfolioApi.update(editingPortfolioId, { title: editingPortfolioForm.title, description: editingPortfolioForm.description || null, project_url: editingPortfolioForm.project_url || null, image_url: editingPortfolioForm.image_url || null })
      toast('Сохранено', 'success'); setEditingPortfolioId(null); load()
    } catch { toast('Ошибка', 'error') }
  }
  const handleLike = async (item) => { try { if (item.liked_by_me) await portfolioApi.unlike(item.id); else await portfolioApi.like(item.id); load() } catch {} }

  const handleAddCert = async (e) => {
    e.preventDefault()
    if (!certAddForm.title.trim()) { toast('Укажите название', 'error'); return }
    setCertAddLoading(true)
    try {
      await certificationsApi.create({ profile_id: profile.id, title: certAddForm.title, issuer: certAddForm.issuer || null, issue_date: certAddForm.issue_date || null, credential_url: certAddForm.credential_url || null })
      toast('Сертификат добавлен!', 'success'); setShowCertAdd(false); setCertAddForm(EMPTY_CERT); load()
    } catch { toast('Ошибка', 'error') } finally { setCertAddLoading(false) }
  }
  const handleDeleteCert = async (certId) => { try { await certificationsApi.delete(certId); toast('Удалено', 'info'); load() } catch { toast('Ошибка', 'error') } }
  const handleSaveCert = async (e) => {
    e.preventDefault()
    try {
      await certificationsApi.update(editingCertId, { title: editingCertForm.title, issuer: editingCertForm.issuer || null, issue_date: editingCertForm.issue_date || null, credential_url: editingCertForm.credential_url || null })
      toast('Сохранено', 'success'); setEditingCertId(null); load()
    } catch { toast('Ошибка', 'error') }
  }

  const toggleFav = async () => {
    if (!me) { toast('Войдите чтобы добавить в избранное', 'info'); return }
    const removing = isFavorited
    setIsFavorited(!removing)
    toast(removing ? 'Удалено из избранного' : 'Добавлено в избранное!', removing ? 'info' : 'success')
    setFavLoading(true)
    try {
      removing ? await favoritesApi.removeFreelancer(id) : await favoritesApi.addFreelancer(id)
    } catch { setIsFavorited(removing); toast('Ошибка', 'error') } finally { setFavLoading(false) }
  }

  const toggleLike = async () => {
    if (!me) { toast('Войдите чтобы поставить лайк', 'info'); return }
    if (me.id === id) return
    setLikeLoading(true)
    try {
      const r = await profilesApi.toggleLike(id)
      setIsLiked(r.data.liked)
      setLikesCount(r.data.likes_count)
    } catch { toast('Ошибка', 'error') } finally { setLikeLoading(false) }
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

  const isFreelancer = userData?.role?.toLowerCase() === 'freelancer'
  const canFav = !isOwnProfile && me && ((isFreelancer && me?.role === 'client') || (!isFreelancer && me?.role === 'freelancer'))

  // Deduplicate by name (seed has python + python-web both named "Python")
  const uniqueSkills = profile?.skills
    ? profile.skills.filter((s, i, arr) => arr.findIndex(x => x.name === s.name) === i)
    : []

  // Deduplicate achievements by key
  const uniqueAchievements = achievements.filter((ua, i, arr) =>
    arr.findIndex(x => x.achievement?.key === ua.achievement?.key) === i
  )

  const tabs = isFreelancer
    ? [
        { key: 'about',     label: 'О себе',    icon: 'user',         count: null },
        { key: 'portfolio', label: 'Портфолио', icon: 'layout-grid',  count: portfolio.length || null },
        { key: 'reviews',   label: 'Отзывы',    icon: 'star',         count: reviews.length || null },
      ]
    : [
        { key: 'about',    label: 'О себе',  icon: 'user',     count: null },
        { key: 'projects', label: 'Проекты', icon: 'briefcase', count: clientProjects.length || null },
        { key: 'reviews',  label: 'Отзывы',  icon: 'star',     count: reviews.length || null },
      ]

  // ── Cert form block ──────────────────────────────────────────────────────────
  const CertForm = ({ form, setForm, onSubmit, loading: fl, onCancel }) => (
    <form onSubmit={onSubmit} style={{ padding: 18, borderRadius: 14, background: 'rgba(239,159,39,0.05)', border: '0.5px solid rgba(239,159,39,0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Название *" placeholder="AWS Developer, IELTS..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input label="Организация" placeholder="Amazon, Coursera..." value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} />
      </div>
      <Input label="Дата получения" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
      {/* File or URL */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Сертификат <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(ссылка или загрузить PDF/фото)</span>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="https://coursera.org/verify/..."
            value={form.credential_url}
            onChange={e => setForm(f => ({ ...f, credential_url: e.target.value }))}
            style={{ flex: 1, fontSize: 13 }}
          />
          <label style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 9, cursor: certFileUploading ? 'not-allowed' : 'pointer',
            background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Загрузить PDF или фото">
            {certFileUploading
              ? <i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 0.8s linear infinite', color: '#EF9F27' }} />
              : <i className="ti ti-upload" style={{ fontSize: 15, color: '#EF9F27' }} />}
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={certFileUploading} onChange={e => handleCertFileUpload(e, setForm)} />
          </label>
        </div>
        {form.credential_url && (
          <div style={{ marginTop: 8 }}>
            <CertFile url={form.credential_url} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" size="sm" icon="check" loading={fl}>Сохранить</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  )

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.25 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            <Link to="/freelancers" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              {isFreelancer ? 'Фрилансеры' : 'Заказчики'}
            </Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 11, opacity: 0.4 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{userData?.full_name || 'Профиль'}</span>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ══════════ LEFT SIDEBAR ══════════ */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Card: avatar + name + title */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(127,119,221,0.06)', pointerEvents: 'none' }} />

                {/* Avatar */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <Avatar src={userData?.avatar_url} name={userData?.full_name} size={96} />
                  {isOwnProfile && (
                    <>
                      <label htmlFor="avatar-input" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.background = avatarUploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)'}>
                        {avatarUploading ? <i className="ti ti-loader-2" style={{ color: '#fff', fontSize: 20, animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-camera" style={{ color: '#fff', fontSize: 20, opacity: 0 }} className="avatar-cam" />}
                      </label>
                      <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    </>
                  )}
                  {profile?.is_verified && (
                    <div style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-rosette-discount-check" style={{ fontSize: 18, color: 'var(--accent-green)' }} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 19, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 4 }}>
                  {userData?.full_name}
                </h1>
                {profile?.title && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{profile.title}</p>}
                <Tag color={isFreelancer ? 'purple' : 'green'} style={{ fontSize: 11 }}>{isFreelancer ? 'Фрилансер' : 'Заказчик'}</Tag>

                {/* Rating + likes row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, width: '100%' }}>
                  {profile?.rating > 0
                    ? <Rating value={profile.rating} count={profile.total_jobs} size={13} />
                    : <span />
                  }
                  {/* Likes counter */}
                  <button
                    onClick={me?.id !== id ? toggleLike : undefined}
                    disabled={likeLoading || me?.id === id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none',
                      cursor: me?.id === id ? 'default' : 'pointer',
                      padding: '3px 6px', borderRadius: 6,
                      color: isLiked ? '#F87171' : 'var(--text-muted)',
                      transition: 'color 0.15s',
                      fontSize: 12,
                    }}
                    onMouseEnter={e => { if (me?.id !== id) e.currentTarget.style.color = '#F87171' }}
                    onMouseLeave={e => { e.currentTarget.style.color = isLiked ? '#F87171' : 'var(--text-muted)' }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{isLiked ? '♥' : '♡'}</span>
                    {likesCount > 0 && <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{likesCount}</span>}
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 16 }}>
                  {isOwnProfile && !editMode && (
                    <button onClick={() => { setEditMode(true); setActiveTab('about') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', width: '100%', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                      <i className="ti ti-pencil" style={{ fontSize: 14 }} /> Редактировать
                    </button>
                  )}
                  {canFav && (
                    <button onClick={toggleFav} disabled={favLoading}
                      onMouseEnter={() => { if (!favLoading) setFavHov(true) }}
                      onMouseLeave={() => setFavHov(false)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 0', width: '100%', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: favLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', border: isFavorited ? '0.5px solid rgba(251,191,36,0.4)' : '0.5px solid var(--border)', background: isFavorited ? 'rgba(251,191,36,0.07)' : 'transparent', color: isFavorited ? '#FBBF24' : favHov ? '#FBBF24' : 'var(--text-secondary)' }}>
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{isFavorited ? (favHov ? '☆' : '★') : '☆'}</span>
                      {favLoading ? '...' : isFavorited ? (favHov ? 'Убрать' : 'В избранном') : 'В избранное'}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats card */}
              {isFreelancer && profile && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {profile.total_jobs > 0 && <MiniStat icon="circle-check" value={profile.total_jobs} label="Выполнено" color="var(--accent-green)" />}
                    {profile.experience_years > 0 && <MiniStat icon="clock" value={`${profile.experience_years} л.`} label="Опыт" color="var(--accent)" />}
                    {reviews.length > 0 && <MiniStat icon="message-star" value={reviews.length} label="Отзывов" color="#EF9F27" />}
                    {portfolio.length > 0 && <MiniStat icon="photo" value={portfolio.length} label="Портфолио" color="var(--accent-teal)" />}
                  </div>
                  {profile.hourly_rate && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ставка</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)' }}>${profile.hourly_rate}/час</span>
                    </div>
                  )}
                </div>
              )}

              {/* Skills */}
              {isFreelancer && uniqueSkills.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Навыки</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {uniqueSkills.map(s => <Tag key={s.id} color="purple" style={{ fontSize: 11 }}>{s.name}</Tag>)}
                  </div>
                </div>
              )}

              {/* Languages */}
              {isFreelancer && profile?.languages?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Языки</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {profile.languages.map(l => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{l.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{LEVEL_LABEL[l.level]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub */}
              {profile?.github_url && <GitHubButton url={profile.github_url} />}

              {/* Achievements count in sidebar */}
              {achievements.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <i className="ti ti-trophy" style={{ fontSize: 15, color: '#EF9F27' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Достижений</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#EF9F27' }}>{uniqueAchievements.length}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {uniqueAchievements.reduce((s, ua) => s + (ua.achievement?.points || 0), 0)} pts</span>
                  </div>
                </div>
              )}

            </div>

            {/* ══════════ RIGHT CONTENT ══════════ */}
            <div style={{ minWidth: 0 }}>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 20 }}>
                {tabs.map(tab => {
                  const active = activeTab === tab.key
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: active ? 600 : 400, border: 'none', cursor: 'pointer', background: active ? (isDark ? 'rgba(127,119,221,0.2)' : 'rgba(59,91,219,0.1)') : 'transparent', color: active ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                      <i className={`ti ti-${tab.icon}`} style={{ fontSize: 14 }} />
                      {tab.label}
                      {tab.count > 0 && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: active ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.07)', color: active ? 'var(--accent)' : 'var(--text-muted)' }}>{tab.count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* ── О СЕБЕ ── */}
              {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Edit form */}
                  {editMode && isOwnProfile ? (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Редактирование</h3>
                        <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                              <Input label="Опыт (лет)" type="number" value={editForm.experience_years} onChange={e => setEditForm(f => ({ ...f, experience_years: e.target.value }))} />
                              <Input label="GitHub URL" placeholder="https://github.com/username" value={editForm.github_url} onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))} icon="brand-github" />
                            </div>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Категория</label>
                              <select value={editForm.category_id} onChange={e => setEditForm(f => ({ ...f, category_id: e.target.value }))} className="input" style={{ fontSize: 13 }}>
                                <option value="">— не выбрана —</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                              </select>
                            </div>
                          </>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Button variant="green" size="sm" icon="check" loading={saving} onClick={handleSaveProfile}>Сохранить</Button>
                          <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Отмена</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    userData?.bio && (
                      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 22 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>О себе</div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 300 }}>{userData.bio}</p>
                      </div>
                    )
                  )}

                  {/* Skills editor (own profile) */}
                  {isFreelancer && isOwnProfile && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Навыки</div>
                      <SkillSelector selected={uniqueSkills} onAdd={handleAddSkill} onRemove={handleRemoveSkill} />
                    </div>
                  )}

                  {/* Languages editor (own profile) */}
                  {isFreelancer && isOwnProfile && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Языки</div>
                      <LanguageSelector selected={profile?.languages || []} onAdd={handleAddLanguage} onRemove={handleRemoveLanguage} />
                    </div>
                  )}

                  {/* Certifications */}
                  {isFreelancer && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ti ti-certificate" style={{ fontSize: 15, color: '#EF9F27' }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                            Сертификаты {certifications.length > 0 && <span style={{ color: 'var(--accent)', fontSize: 13 }}>({certifications.length})</span>}
                          </span>
                        </div>
                        {isOwnProfile && (
                          <button onClick={() => { setShowCertAdd(v => !v); setEditingCertId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '0.5px solid rgba(239,159,39,0.4)', background: showCertAdd ? 'rgba(239,159,39,0.1)' : 'transparent', color: '#EF9F27', cursor: 'pointer' }}>
                            <i className={`ti ti-${showCertAdd ? 'x' : 'plus'}`} style={{ fontSize: 12 }} />
                            {showCertAdd ? 'Отмена' : 'Добавить'}
                          </button>
                        )}
                      </div>

                      {showCertAdd && isOwnProfile && (
                        <div style={{ marginBottom: 16 }}>
                          <CertForm form={certAddForm} setForm={setCertAddForm} onSubmit={handleAddCert} loading={certAddLoading} onCancel={() => { setShowCertAdd(false); setCertAddForm(EMPTY_CERT) }} />
                        </div>
                      )}

                      {certifications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {certifications.map(cert => (
                            editingCertId === cert.id ? (
                              <CertForm key={cert.id} form={editingCertForm} setForm={setEditingCertForm} onSubmit={handleSaveCert} loading={false} onCancel={() => setEditingCertId(null)} />
                            ) : (
                              <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '0.5px solid var(--border)', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,159,39,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(239,159,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="ti ti-certificate" style={{ fontSize: 19, color: '#EF9F27' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{cert.title}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                                    {cert.issuer && <span>{cert.issuer}</span>}
                                    {cert.issue_date && <span>· {new Date(cert.issue_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  <CertFile url={cert.credential_url} />
                                  {isOwnProfile && (
                                    <div style={{ display: 'flex', gap: 2 }}>
                                      <button onClick={() => { setEditingCertId(cert.id); setEditingCertForm({ title: cert.title, issuer: cert.issuer || '', issue_date: cert.issue_date ? cert.issue_date.slice(0, 10) : '', credential_url: cert.credential_url || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><i className="ti ti-pencil" style={{ fontSize: 14 }} /></button>
                                      <button onClick={() => handleDeleteCert(cert.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = '#F87171'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      ) : !showCertAdd && (
                        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
                          <i className="ti ti-certificate" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.18 }} />
                          <div style={{ fontSize: 13 }}>{isOwnProfile ? 'Добавьте свои сертификаты' : 'Сертификатов нет'}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Achievements full list */}
                  {achievements.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ti ti-trophy" style={{ fontSize: 15, color: '#EF9F27' }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                            Достижения <span style={{ color: 'var(--accent)', fontSize: 13 }}>({achievements.length})</span>
                          </span>
                        </div>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#EF9F27' }}>
                          {achievements.reduce((s, ua) => s + (ua.achievement?.points || 0), 0)} pts
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {uniqueAchievements.map(ua => (
                          <AchievementBadge key={ua.id} achievement={ua.achievement} earned size="md" earnedAt={ua.earned_at} />
                        ))}
                      </div>
                      {isOwnProfile && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
                          <Link to="/achievements" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="ti ti-trophy" style={{ fontSize: 13 }} /> Все достижения платформы
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {!userData?.bio && !editMode && (
                    <div style={{ padding: '20px 22px', borderRadius: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isOwnProfile ? 'Добавьте описание через кнопку "Редактировать"' : 'Описание не добавлено'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── ПОРТФОЛИО ── */}
              {activeTab === 'portfolio' && isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {isOwnProfile && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowPortfolioAdd(v => !v); setEditingPortfolioId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, border: '0.5px solid rgba(127,119,221,0.4)', background: showPortfolioAdd ? 'rgba(127,119,221,0.12)' : 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
                        <i className={`ti ti-${showPortfolioAdd ? 'x' : 'plus'}`} style={{ fontSize: 13 }} />
                        {showPortfolioAdd ? 'Отмена' : 'Добавить работу'}
                      </button>
                    </div>
                  )}
                  {showPortfolioAdd && isOwnProfile && (
                    <form onSubmit={handleAddPortfolio} style={{ padding: 18, borderRadius: 14, background: 'rgba(127,119,221,0.05)', border: '0.5px solid rgba(127,119,221,0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Input label="Название *" placeholder="Мой проект" value={portfolioAddForm.title} onChange={e => setPortfolioAddForm(f => ({ ...f, title: e.target.value }))} />
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Описание</label>
                        <textarea value={portfolioAddForm.description} onChange={e => setPortfolioAddForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Что было сделано..." style={{ width: '100%', resize: 'vertical', padding: '10px 14px', boxSizing: 'border-box', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Input label="Ссылка на проект" placeholder="https://..." value={portfolioAddForm.project_url} onChange={e => setPortfolioAddForm(f => ({ ...f, project_url: e.target.value }))} icon="external-link" />
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Изображение</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" className="input" placeholder="URL или загрузить →" value={portfolioAddForm.image_url} onChange={e => setPortfolioAddForm(f => ({ ...f, image_url: e.target.value }))} style={{ flex: 1, fontSize: 13 }} />
                            <label style={{ width: 40, height: 40, borderRadius: 9, cursor: portfolioImageUploading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {portfolioImageUploading ? <i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} /> : <i className="ti ti-upload" style={{ fontSize: 14, color: 'var(--text-muted)' }} />}
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePortfolioImageUpload(e, setPortfolioAddForm)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      {portfolioAddForm.image_url && <img src={portfolioAddForm.image_url} alt="preview" style={{ width: '100%', maxHeight: 110, objectFit: 'cover', borderRadius: 8 }} />}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="submit" variant="primary" size="sm" icon="plus" loading={portfolioAddLoading}>Добавить</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowPortfolioAdd(false); setPortfolioAddForm(EMPTY_PORTFOLIO) }}>Отмена</Button>
                      </div>
                    </form>
                  )}
                  {portfolio.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      {portfolio.map(item => (
                        editingPortfolioId === item.id ? (
                          <form key={item.id} onSubmit={handleSavePortfolio} style={{ border: '0.5px solid rgba(127,119,221,0.35)', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(127,119,221,0.04)' }}>
                            <Input label="Название *" value={editingPortfolioForm.title} onChange={e => setEditingPortfolioForm(f => ({ ...f, title: e.target.value }))} />
                            <textarea value={editingPortfolioForm.description} onChange={e => setEditingPortfolioForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Описание" style={{ width: '100%', resize: 'vertical', padding: '8px 12px', boxSizing: 'border-box', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                            <Input label="Ссылка" placeholder="https://..." value={editingPortfolioForm.project_url} onChange={e => setEditingPortfolioForm(f => ({ ...f, project_url: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="input" placeholder="Image URL" value={editingPortfolioForm.image_url} onChange={e => setEditingPortfolioForm(f => ({ ...f, image_url: e.target.value }))} style={{ flex: 1, fontSize: 12 }} />
                              <label style={{ width: 36, height: 40, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-upload" style={{ fontSize: 13, color: 'var(--text-muted)' }} />
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePortfolioImageUpload(e, setEditingPortfolioForm)} />
                              </label>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button type="submit" variant="green" size="sm">Сохранить</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPortfolioId(null)}>Отмена</Button>
                            </div>
                          </form>
                        ) : (
                          <div key={item.id} style={{ border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                              : <div style={{ height: 80, background: isDark ? 'rgba(127,119,221,0.07)' : 'rgba(59,91,219,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-photo" style={{ fontSize: 28, color: 'rgba(127,119,221,0.22)' }} />
                              </div>}
                            <div style={{ padding: '12px 14px' }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                              {item.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{item.description}</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={() => handleLike(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: item.liked_by_me ? '#F87171' : 'var(--text-muted)' }}>
                                  <span style={{ lineHeight: 1 }}>{item.liked_by_me ? '♥' : '♡'}</span>{item.likes_count || 0}
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}><i className="ti ti-external-link" style={{ fontSize: 11 }} /> Открыть</a>}
                                  {isOwnProfile && (
                                    <div style={{ display: 'flex', gap: 2 }}>
                                      <button onClick={() => { setEditingPortfolioId(item.id); setEditingPortfolioForm({ title: item.title, description: item.description || '', project_url: item.project_url || '', image_url: item.image_url || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><i className="ti ti-pencil" style={{ fontSize: 13 }} /></button>
                                      <button onClick={() => handleDeletePortfolio(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#F87171'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><i className="ti ti-trash" style={{ fontSize: 13 }} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : !showPortfolioAdd && (
                    <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-photo-off" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }} />
                      <div style={{ fontSize: 14 }}>{isOwnProfile ? 'Добавьте свои работы' : 'Нет работ'}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ПРОЕКТЫ (клиент) ── */}
              {activeTab === 'projects' && !isFreelancer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clientProjects.length > 0 ? clientProjects.map(proj => (
                    <Link key={proj.id} to={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.title}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Tag status={proj.status} />{proj.category && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{proj.category}</span>}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)' }}>${Number(proj.budget_min).toLocaleString()} – ${Number(proj.budget_max).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(proj.created_at).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                      <i className="ti ti-briefcase" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.18 }} />
                      <div style={{ fontSize: 14 }}>Нет проектов</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ОТЗЫВЫ ── */}
              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, background: 'rgba(239,159,39,0.06)', border: '0.5px solid rgba(239,159,39,0.2)', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: '#EF9F27', letterSpacing: '-1px' }}>
                        {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                          {[1,2,3,4,5].map(s => {
                            const avg = reviews.reduce((a, rv) => a + Number(rv.rating), 0) / reviews.length
                            return <span key={s} style={{ fontSize: 16, lineHeight: 1, color: s <= Math.round(avg) ? '#EF9F27' : 'rgba(239,159,39,0.2)' }}>★</span>
                          })}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{reviews.length} отзыв{reviews.length === 1 ? '' : reviews.length < 5 ? 'а' : 'ов'}</div>
                      </div>
                    </div>
                  )}
                  {reviews.length > 0 ? reviews.map(r => (
                    <div key={r.id} style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                      {/* Header: avatar + name + stars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: r.comment ? 12 : 0 }}>
                        <Avatar src={r.reviewer_avatar_url} name={r.reviewer_name || 'Аноним'} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.reviewer_name || 'Пользователь'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                              {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ fontSize: 14, lineHeight: 1, color: s <= Number(r.rating) ? '#EF9F27' : 'rgba(239,159,39,0.2)' }}>★</span>
                              ))}
                              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#EF9F27', marginLeft: 5 }}>
                                {Number(r.rating).toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                          </div>
                        </div>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, paddingLeft: 52 }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.18, lineHeight: 1 }}>☆</span>
                      <div style={{ fontSize: 14 }}>Нет отзывов</div>
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

function MiniStat({ icon, value, label, color }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>
        {value}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 11, color }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  )
}
