import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { categoriesApi } from '../api/categories'
import { favoritesApi } from '../api/favorites'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useToastStore from '../store/toastStore'

const TYPE_LABEL = { fixed: 'Фикс. цена', hourly: 'Почасовая' }
const LEVEL_LABEL = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }
const LEVEL_COLOR = { entry: '#1D9E75', intermediate: '#FBBF24', expert: '#F87171' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} дн назад`
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

function StarToggleBtn({ isFavorited, onToggle }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={isFavorited ? 'Убрать из избранного' : 'В избранное'}
      style={{
        background: isFavorited && hov ? 'rgba(251,191,36,0.1)' : 'none',
        border: isFavorited && hov ? '0.5px solid rgba(251,191,36,0.3)' : 'none',
        borderRadius: 8, cursor: 'pointer',
        padding: isFavorited && hov ? '3px 8px' : '4px',
        color: isFavorited ? '#FBBF24' : hov ? '#FBBF24' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      <i className={`ti ti-${isFavorited ? (hov ? 'star-off' : 'star-filled') : 'star'}`} style={{ fontSize: 17 }} />
      {isFavorited && hov && <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Убрать</span>}
    </button>
  )
}

function ProjectRow({ project, isFavorited, onFavoriteToggle, userId }) {
  const {
    id, title, description, budget_min, budget_max,
    status, project_type, experience_level, category,
    created_at, client_id, assigned_freelancer_id,
  } = project

  const isMyChat = status === 'in_progress' && (
    String(client_id) === String(userId) ||
    String(assigned_freelancer_id) === String(userId)
  )

  const statusConfig = {
    open:        { label: 'Открыт',    color: '#1D9E75',       bg: 'rgba(29,158,117,0.1)' },
    in_progress: { label: 'В работе',  color: '#FBBF24',       bg: 'rgba(251,191,36,0.1)' },
    delivered:   { label: 'Сдан',      color: 'var(--accent)', bg: 'rgba(127,119,221,0.1)' },
    completed:   { label: 'Завершён',  color: '#5DCAA5',       bg: 'rgba(93,202,165,0.1)' },
    cancelled:   { label: 'Отменён',   color: '#F87171',       bg: 'rgba(248,113,113,0.1)' },
  }
  const s = statusConfig[status] || statusConfig.open

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 14,
      padding: '20px 22px',
      transition: 'border-color 0.18s, transform 0.18s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Top row: status + title + budget + fav */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, flexShrink: 0, marginTop: 2 }}>
          {s.label}
        </span>

        <Link to={`/projects/${id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, fontFamily: 'Syne, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            {title}
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--accent-green)' }}>
            ${Number(budget_min).toLocaleString()}
            {budget_max && budget_max !== budget_min ? ` – $${Number(budget_max).toLocaleString()}` : ''}
          </span>
          {onFavoriteToggle && (
            <StarToggleBtn isFavorited={isFavorited} onToggle={onFavoriteToggle} />
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}

      {/* Tags + meta + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {category && (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(127,119,221,0.1)', color: 'var(--accent)', border: '0.5px solid rgba(127,119,221,0.2)' }}>
            {category}
          </span>
        )}
        {project_type && (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
            {TYPE_LABEL[project_type] || project_type}
          </span>
        )}
        {experience_level && (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: `${LEVEL_COLOR[experience_level]}12`, color: LEVEL_COLOR[experience_level], border: `0.5px solid ${LEVEL_COLOR[experience_level]}30` }}>
            {LEVEL_LABEL[experience_level]}
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {created_at && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-clock" style={{ fontSize: 12 }} />
              {timeAgo(created_at)}
            </span>
          )}

          {isMyChat && (
            <Link to={`/chats?project=${id}`} style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 9,
                background: 'rgba(127,119,221,0.12)',
                border: '0.5px solid rgba(127,119,221,0.35)',
                color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(127,119,221,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(127,119,221,0.12)' }}
              >
                <i className="ti ti-messages" style={{ fontSize: 14 }} /> Открыть чат
              </button>
            </Link>
          )}

          <Link to={`/projects/${id}`} style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 9,
              background: status === 'open' ? 'var(--accent)' : 'transparent',
              border: status === 'open' ? 'none' : '0.5px solid var(--border)',
              color: status === 'open' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12.5, cursor: 'pointer', fontWeight: 600,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {status === 'open' ? 'Подать заявку' : 'Открыть'}
              <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsFeed() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const toast = useToastStore(s => s.show)
  const [searchParams] = useSearchParams()

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState(new Set())

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    project_type: '',
    experience_level: '',
    budget_min: '',
    budget_max: '',
  })
  const [applied, setApplied] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    project_type: '',
    experience_level: '',
    budget_min: '',
    budget_max: '',
  })

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    favoritesApi.getAll()
      .then(r => setFavIds(new Set((r.data || []).filter(f => f.project_id).map(f => f.project_id))))
      .catch(() => {})
  }, [user?.id])

  const toggleFav = async (projectId) => {
    const removing = favIds.has(projectId)
    setFavIds(prev => { const s = new Set(prev); removing ? s.delete(projectId) : s.add(projectId); return s })
    toast(removing ? 'Удалено из избранного' : 'Добавлено в избранное!', removing ? 'info' : 'success')
    try {
      removing ? await favoritesApi.removeProject(projectId) : await favoritesApi.addProject(projectId)
    } catch {
      setFavIds(prev => { const s = new Set(prev); removing ? s.add(projectId) : s.delete(projectId); return s })
      toast('Ошибка', 'error')
    }
  }

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (applied.search) params.search = applied.search
    if (applied.category_id) params.category_id = applied.category_id
    if (applied.project_type) params.project_type = applied.project_type
    if (applied.experience_level) params.experience_level = applied.experience_level
    if (applied.budget_min) params.budget_min = applied.budget_min
    if (applied.budget_max) params.budget_max = applied.budget_max
    projectsApi.getAll(params)
      .then(r => setProjects(r.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [applied])

  const applyFilters = () => setApplied({ search, ...filters })
  const resetAll = () => {
    const empty = { search: '', category_id: '', project_type: '', experience_level: '', budget_min: '', budget_max: '' }
    setSearch('')
    setFilters({ category_id: '', project_type: '', experience_level: '', budget_min: '', budget_max: '' })
    setApplied(empty)
  }

  const hasFilters = applied.search || applied.category_id || applied.project_type || applied.experience_level || applied.budget_min || applied.budget_max

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 5 }}>
                Биржа проектов
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                {loading ? 'Загрузка...' : `${projects.length} ${projects.length === 1 ? 'проект' : 'проектов'} найдено`}
              </p>
            </div>
            {user?.role === 'client' && (
              <Link to="/projects/new" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-plus" style={{ fontSize: 15 }} /> Новый проект
                </button>
              </Link>
            )}
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                placeholder="Поиск проектов по названию или описанию..."
                style={{
                  width: '100%', paddingLeft: 42, paddingRight: 16, height: 44,
                  background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                  borderRadius: 11, fontSize: 14, color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button onClick={applyFilters} style={{
              padding: '0 22px', height: 44, borderRadius: 11,
              background: 'var(--accent)', border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}>
              <i className="ti ti-search" style={{ fontSize: 14 }} /> Найти
            </button>
          </div>

          {/* Filter chips row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
            <select
              value={filters.category_id}
              onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
              style={{ height: 36, padding: '0 12px', borderRadius: 9, background: filters.category_id ? 'rgba(127,119,221,0.12)' : 'var(--bg-card)', border: `0.5px solid ${filters.category_id ? 'rgba(127,119,221,0.4)' : 'var(--border)'}`, color: filters.category_id ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Все категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={filters.project_type}
              onChange={e => setFilters(f => ({ ...f, project_type: e.target.value }))}
              style={{ height: 36, padding: '0 12px', borderRadius: 9, background: filters.project_type ? 'rgba(127,119,221,0.12)' : 'var(--bg-card)', border: `0.5px solid ${filters.project_type ? 'rgba(127,119,221,0.4)' : 'var(--border)'}`, color: filters.project_type ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Тип проекта</option>
              <option value="fixed">Фиксированная цена</option>
              <option value="hourly">Почасовая оплата</option>
            </select>

            <select
              value={filters.experience_level}
              onChange={e => setFilters(f => ({ ...f, experience_level: e.target.value }))}
              style={{ height: 36, padding: '0 12px', borderRadius: 9, background: filters.experience_level ? 'rgba(127,119,221,0.12)' : 'var(--bg-card)', border: `0.5px solid ${filters.experience_level ? 'rgba(127,119,221,0.4)' : 'var(--border)'}`, color: filters.experience_level ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Уровень опыта</option>
              <option value="entry">Начинающий</option>
              <option value="intermediate">Средний</option>
              <option value="expert">Эксперт</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 9, padding: '0 10px', height: 36 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>$</span>
              <input
                value={filters.budget_min}
                onChange={e => setFilters(f => ({ ...f, budget_min: e.target.value }))}
                placeholder="от"
                style={{ width: 52, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>–</span>
              <input
                value={filters.budget_max}
                onChange={e => setFilters(f => ({ ...f, budget_max: e.target.value }))}
                placeholder="до"
                style={{ width: 52, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>

            <button onClick={applyFilters} style={{ height: 36, padding: '0 14px', borderRadius: 9, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Применить
            </button>

            {hasFilters && (
              <button onClick={resetAll} style={{ height: 36, padding: '0 14px', borderRadius: 9, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-x" style={{ fontSize: 12 }} /> Сбросить
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {applied.search && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', fontSize: 12, color: 'var(--accent)' }}>
                  <i className="ti ti-search" style={{ fontSize: 11 }} /> «{applied.search}»
                  <button onClick={() => { setSearch(''); setApplied(p => ({ ...p, search: '' })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, display: 'flex' }}><i className="ti ti-x" style={{ fontSize: 11 }} /></button>
                </span>
              )}
              {applied.category_id && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', fontSize: 12, color: 'var(--accent)' }}>
                  {categories.find(c => String(c.id) === String(applied.category_id))?.name}
                  <button onClick={() => { setFilters(f => ({ ...f, category_id: '' })); setApplied(p => ({ ...p, category_id: '' })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, display: 'flex' }}><i className="ti ti-x" style={{ fontSize: 11 }} /></button>
                </span>
              )}
            </div>
          )}

          {/* Project list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 14, border: '0.5px solid var(--border)', padding: '20px 22px', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div className="skeleton" style={{ height: 22, width: 72, borderRadius: 20 }} />
                    <div className="skeleton" style={{ height: 22, width: '45%', borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 6, marginLeft: 'auto' }} />
                  </div>
                  <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: 8, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <i className="ti ti-search-off" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16, opacity: 0.25 }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>
                Проекты не найдены
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                {hasFilters ? 'Попробуй изменить фильтры или сбросить поиск' : 'Пока нет ни одного проекта'}
              </div>
              {hasFilters && (
                <button onClick={resetAll} className="btn btn-outline">
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map(p => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  isFavorited={favIds.has(p.id)}
                  onFavoriteToggle={user ? () => toggleFav(p.id) : undefined}
                  userId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
