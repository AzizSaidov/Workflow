import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import { projectsApi } from '../api/projects'
import { categoriesApi } from '../api/categories'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProjectCard from '../components/ProjectCard'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'

export default function ProjectsFeed() {
  const { isDark } = useThemeStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category') || '',
    project_type: '',
    experience_level: '',
    budget_min: '',
    budget_max: '',
  })

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.project_type) params.project_type = filters.project_type
    if (filters.experience_level) params.experience_level = filters.experience_level
    if (filters.budget_min) params.budget_min = filters.budget_min
    if (filters.budget_max) params.budget_max = filters.budget_max

    projectsApi.getAll(params)
      .then(r => setProjects(r.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.5 }} />
      <Navbar />

      <div style={{ paddingTop: 80, minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
                Биржа проектов
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {loading ? 'Загрузка...' : `${projects.length} проектов найдено`}
              </p>
            </div>
            <Link to="/projects/new">
              <Button variant="primary" icon="plus">Новый проект</Button>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
            {/* Filters sidebar */}
            <div style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 16, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 20,
              position: 'sticky', top: 90,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Фильтры
              </div>

              <Input
                label="Поиск"
                placeholder="Название проекта..."
                icon="search"
                value={filters.search}
                onChange={setFilter('search')}
              />

              <Select
                label="Категория"
                value={filters.category_id}
                onChange={setFilter('category_id')}
                placeholder="Все категории"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />

              <Select
                label="Тип проекта"
                value={filters.project_type}
                onChange={setFilter('project_type')}
                placeholder="Любой тип"
                options={[
                  { value: 'fixed', label: 'Фиксированная цена' },
                  { value: 'hourly', label: 'Почасовая оплата' },
                ]}
              />

              <Select
                label="Уровень"
                value={filters.experience_level}
                onChange={setFilter('experience_level')}
                placeholder="Любой уровень"
                options={[
                  { value: 'entry', label: 'Начинающий' },
                  { value: 'intermediate', label: 'Средний' },
                  { value: 'expert', label: 'Эксперт' },
                ]}
              />

              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Бюджет (TJS)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input placeholder="От" value={filters.budget_min} onChange={setFilter('budget_min')} inputStyle={{ padding: '10px 12px' }} />
                  <Input placeholder="До" value={filters.budget_max} onChange={setFilter('budget_max')} inputStyle={{ padding: '10px 12px' }} />
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setFilters({ search: '', category_id: '', project_type: '', experience_level: '', budget_min: '', budget_max: '' })}>
                Сбросить фильтры
              </Button>
            </div>

            {/* Projects grid */}
            <div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ height: 180, borderRadius: 16, background: 'var(--bg-card)', border: '0.5px solid var(--border)', opacity: 0.6 }} />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  <i className="ti ti-search-off" style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.4 }} />
                  <div style={{ fontSize: 16, marginBottom: 8 }}>Проекты не найдены</div>
                  <div style={{ fontSize: 13 }}>Попробуй изменить фильтры</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
                  {projects.map(p => <ProjectCard key={p.id} project={p} />)}
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
