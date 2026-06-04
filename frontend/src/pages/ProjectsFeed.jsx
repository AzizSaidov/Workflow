import { useEffect, useState, useCallback } from 'react'
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

const TYPE_LABEL  = { fixed: 'Фикс. цена', hourly: 'Почасовая' }
const LEVEL_LABEL = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }
const LEVEL_COLOR = { entry: '#1D9E75', intermediate: '#FBBF24', expert: '#F87171' }
const PAGE_SIZE   = 12

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

function ProjectRow({ project, userId }) {
  const { id, title, description, budget_min, budget_max, status, project_type, experience_level, category, created_at, client_id, assigned_freelancer_id } = project
  const isMyChat = status === 'in_progress' && (String(client_id) === String(userId) || String(assigned_freelancer_id) === String(userId))
  const statusConfig = {
    open:        { label: 'Открыт',   color: '#1D9E75',       bg: 'rgba(29,158,117,0.1)' },
    in_progress: { label: 'В работе', color: '#FBBF24',       bg: 'rgba(251,191,36,0.1)' },
    delivered:   { label: 'Сдан',     color: 'var(--accent)', bg: 'rgba(127,119,221,0.1)' },
    completed:   { label: 'Завершён', color: '#5DCAA5',       bg: 'rgba(93,202,165,0.1)' },
    cancelled:   { label: 'Отменён',  color: '#F87171',       bg: 'rgba(248,113,113,0.1)' },
  }
  const s = statusConfig[status] || statusConfig.open

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '18px 20px', transition: 'border-color 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, flexShrink: 0, marginTop: 2 }}>
          {s.label}
        </span>
        <Link to={`/projects/${id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, fontFamily: 'Syne, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >{title}</div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--accent-green)' }}>
            ${Number(budget_min).toLocaleString()}{budget_max && budget_max !== budget_min ? `–$${Number(budget_max).toLocaleString()}` : ''}
          </span>
        </div>
      </div>

      {description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {category && <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(127,119,221,0.1)', color: 'var(--accent)', border: '0.5px solid rgba(127,119,221,0.2)' }}>{category}</span>}
        {project_type && <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{TYPE_LABEL[project_type] || project_type}</span>}
        {experience_level && <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, background: `${LEVEL_COLOR[experience_level]}12`, color: LEVEL_COLOR[experience_level], border: `0.5px solid ${LEVEL_COLOR[experience_level]}30` }}>{LEVEL_LABEL[experience_level]}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {created_at && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-clock" style={{ fontSize: 11 }} />{timeAgo(created_at)}</span>}
          {isMyChat && (
            <Link to={`/chats?project=${id}`} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(127,119,221,0.12)', border: '0.5px solid rgba(127,119,221,0.35)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                <i className="ti ti-messages" style={{ fontSize: 13 }} /> Чат
              </button>
            </Link>
          )}
          <Link to={`/projects/${id}`} style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 13px', borderRadius: 8, background: status === 'open' ? 'var(--accent)' : 'transparent', border: status === 'open' ? 'none' : '0.5px solid var(--border)', color: status === 'open' ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {status === 'open' ? 'Подать заявку' : 'Открыть'} <i className="ti ti-arrow-right" style={{ fontSize: 12 }} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsFeed() {
  const { isDark } = useThemeStore()
  const { user }   = useAuthStore()
  const toast      = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()

  const [allProjects, setAllProjects] = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)

  // filters — synced with URL
  const [search,          setSearch]         = useState(searchParams.get('search')          || '')
  const [catFilter,       setCatFilter]      = useState(searchParams.get('category_id')     || '')
  const [typeFilter,      setTypeFilter]     = useState(searchParams.get('project_type')    || '')
  const [levelFilter,     setLevelFilter]    = useState(searchParams.get('experience_level')|| '')
  const [budgetMin,       setBudgetMin]      = useState(searchParams.get('budget_min')      || '')
  const [budgetMax,       setBudgetMax]      = useState(searchParams.get('budget_max')      || '')

  // applied = what was last searched
  const [applied, setApplied] = useState({
    search:           searchParams.get('search')           || '',
    category_id:      searchParams.get('category_id')      || '',
    project_type:     searchParams.get('project_type')     || '',
    experience_level: searchParams.get('experience_level') || '',
    budget_min:       searchParams.get('budget_min')       || '',
    budget_max:       searchParams.get('budget_max')       || '',
  })

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    const params = {}
    if (applied.search)           params.search           = applied.search
    if (applied.category_id)      params.category_id      = applied.category_id
    if (applied.project_type)     params.project_type     = applied.project_type
    if (applied.experience_level) params.experience_level = applied.experience_level
    if (applied.budget_min)       params.budget_min       = applied.budget_min
    if (applied.budget_max)       params.budget_max       = applied.budget_max

    // sync URL
    const sp = {}
    if (applied.search)           sp.search           = applied.search
    if (applied.category_id)      sp.category_id      = applied.category_id
    if (applied.project_type)     sp.project_type     = applied.project_type
    if (applied.experience_level) sp.experience_level = applied.experience_level
    if (applied.budget_min)       sp.budget_min       = applied.budget_min
    if (applied.budget_max)       sp.budget_max       = applied.budget_max
    setSearchParams(sp, { replace: true })

    projectsApi.getAll(params)
      .then(r => setAllProjects(r.data || []))
      .catch(() => setAllProjects([]))
      .finally(() => setLoading(false))
  }, [applied])

  const applyFilters = useCallback(() => {
    setApplied({ search, category_id: catFilter, project_type: typeFilter, experience_level: levelFilter, budget_min: budgetMin, budget_max: budgetMax })
  }, [search, catFilter, typeFilter, levelFilter, budgetMin, budgetMax])

  const resetAll = () => {
    setSearch(''); setCatFilter(''); setTypeFilter(''); setLevelFilter(''); setBudgetMin(''); setBudgetMax('')
    setApplied({ search: '', category_id: '', project_type: '', experience_level: '', budget_min: '', budget_max: '' })
  }

  const hasFilters = applied.search || applied.category_id || applied.project_type || applied.experience_level || applied.budget_min || applied.budget_max
  const visible    = allProjects.slice(0, page * PAGE_SIZE)
  const hasMore    = visible.length < allProjects.length

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>

        {/* ── Hero ── */}
        <div style={{ padding: '40px 44px 32px', borderBottom: '0.5px solid var(--border)', background: isDark ? 'rgba(127,119,221,0.04)' : 'rgba(59,91,219,0.02)' }}>
          <div className="container" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-briefcase" style={{ fontSize: 16, color: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                    {loading ? '...' : `${allProjects.length} проектов`}
                  </span>
                </div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.1 }}>
                  Биржа проектов
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 300 }}>
                  Находи интересные задачи и подавай заявки прямо сейчас
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
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>

            {/* ── Sidebar ── */}
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Search */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Поиск</div>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                    placeholder="Название, описание…"
                    className="input"
                    style={{ paddingLeft: 30, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Category */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Категория</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[{ id: '', name: 'Все категории', icon: 'ti-layout-list' }, ...categories.map(c => ({ ...c, icon: c.icon?.startsWith('ti-') ? c.icon : `ti-${c.icon || 'briefcase'}` }))].map(c => {
                    const active = catFilter === c.id
                    return (
                      <button key={c.id} onClick={() => setCatFilter(c.id === catFilter ? '' : c.id)}
                        style={{ width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 8, background: active ? 'rgba(127,119,221,0.12)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: active ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.12s' }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                      >
                        <i className={`ti ${c.icon}`} style={{ fontSize: 13 }} />
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Type + Level */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Тип</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[['', 'Любой'], ['fixed', 'Фикс. цена'], ['hourly', 'Почасовая']].map(([v, l]) => (
                      <button key={v} onClick={() => setTypeFilter(v)}
                        style={{ textAlign: 'left', padding: '6px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: typeFilter === v ? 'rgba(127,119,221,0.12)' : 'transparent', color: typeFilter === v ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: typeFilter === v ? 600 : 400, transition: 'all 0.12s' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Уровень</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[['', 'Любой'], ['entry', 'Начинающий'], ['intermediate', 'Средний'], ['expert', 'Эксперт']].map(([v, l]) => (
                      <button key={v} onClick={() => setLevelFilter(v)}
                        style={{ textAlign: 'left', padding: '6px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: levelFilter === v ? 'rgba(127,119,221,0.12)' : 'transparent', color: levelFilter === v ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: levelFilter === v ? 600 : 400, transition: 'all 0.12s' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Бюджет ($)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={budgetMin} onChange={e => setBudgetMin(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="от" className="input" style={{ fontSize: 13, flex: 1 }} />
                  <input value={budgetMax} onChange={e => setBudgetMax(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="до" className="input" style={{ fontSize: 13, flex: 1 }} />
                </div>
              </div>

              {/* Apply / Reset */}
              <button onClick={applyFilters} style={{ width: '100%', padding: '10px', borderRadius: 11, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Применить фильтры
              </button>
              {hasFilters && (
                <button onClick={resetAll} style={{ width: '100%', padding: '9px', borderRadius: 11, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <i className="ti ti-x" style={{ fontSize: 12 }} /> Сбросить
                </button>
              )}
            </div>

            {/* ── Main content ── */}
            <div>
              {/* Active filter chips */}
              {hasFilters && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {applied.search && <FilterChip label={`«${applied.search}»`} icon="search" onRemove={() => { setSearch(''); setApplied(p => ({ ...p, search: '' })) }} />}
                  {applied.category_id && <FilterChip label={categories.find(c => String(c.id) === String(applied.category_id))?.name} icon="tag" onRemove={() => { setCatFilter(''); setApplied(p => ({ ...p, category_id: '' })) }} />}
                  {applied.project_type && <FilterChip label={TYPE_LABEL[applied.project_type]} icon="adjustments" onRemove={() => { setTypeFilter(''); setApplied(p => ({ ...p, project_type: '' })) }} />}
                  {applied.experience_level && <FilterChip label={LEVEL_LABEL[applied.experience_level]} icon="star" onRemove={() => { setLevelFilter(''); setApplied(p => ({ ...p, experience_level: '' })) }} />}
                  {(applied.budget_min || applied.budget_max) && <FilterChip label={`$${applied.budget_min || '0'} – $${applied.budget_max || '∞'}`} icon="currency-dollar" onRemove={() => { setBudgetMin(''); setBudgetMax(''); setApplied(p => ({ ...p, budget_min: '', budget_max: '' })) }} />}
                </div>
              )}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ borderRadius: 14, border: '0.5px solid var(--border)', padding: '18px 20px', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 20 }} />
                        <div className="skeleton" style={{ height: 20, width: '40%', borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 6, marginLeft: 'auto' }} />
                      </div>
                      <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 7, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 13, width: '60%', borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : allProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="ti ti-search-off" style={{ fontSize: 48, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.25 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>Проекты не найдены</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{hasFilters ? 'Попробуй изменить фильтры' : 'Пока нет ни одного проекта'}</div>
                  {hasFilters && <button onClick={resetAll} className="btn btn-outline">Сбросить фильтры</button>}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Показано <b style={{ color: 'var(--text-primary)' }}>{visible.length}</b> из <b style={{ color: 'var(--text-primary)' }}>{allProjects.length}</b>
                  </div>
                  <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {visible.map(p => (
                      <ProjectRow
                        key={p.id}
                        project={p}
                        userId={user?.id}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: 28 }}>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '11px 32px', borderRadius: 11, background: 'var(--bg-card)', border: '0.5px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <i className="ti ti-chevrons-down" style={{ fontSize: 16, color: 'var(--accent)' }} />
                        Загрузить ещё ({allProjects.length - visible.length})
                      </button>
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

function FilterChip({ label, icon, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', fontSize: 12, color: 'var(--accent)' }}>
      <i className={`ti ti-${icon}`} style={{ fontSize: 11 }} /> {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, display: 'flex', marginLeft: 2 }}>
        <i className="ti ti-x" style={{ fontSize: 11 }} />
      </button>
    </span>
  )
}
