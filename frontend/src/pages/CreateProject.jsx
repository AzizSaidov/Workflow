import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { categoriesApi } from '../api/categories'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import SkillSelector from '../components/SkillSelector'
import AITextarea from '../components/AITextarea'

export default function CreateProject() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '',
    category_id: '', category: '',
    budget_min: '', budget_max: '',
    project_type: 'fixed', experience_level: 'entry',
    duration: '', deadline: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  const selectedCategory = categories.find(c => c.id === form.category_id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Введите название'); return }
    if (!form.budget_min || !form.budget_max) { setError('Укажите бюджет'); return }
    setError(''); setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category_id: form.category_id || undefined,
        category: selectedCategory?.name || form.category || undefined,
        budget_min: parseFloat(form.budget_min),
        budget_max: parseFloat(form.budget_max),
        project_type: form.project_type,
        experience_level: form.experience_level,
        duration: form.duration || undefined,
        deadline: form.deadline || undefined,
        skill_ids: selectedSkills.map(s => s.id),
      }
      const { data } = await projectsApi.create(payload)
      navigate(`/projects/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка создания проекта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ maxWidth: 780, paddingTop: 40, paddingBottom: 80 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
              Новый проект
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Опиши задачу — фрилансеры подадут заявки
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Basic info */}
              <Section title="Основное">
                <Input label="Название проекта" placeholder="Разработка сайта для интернет-магазина" value={form.title} onChange={set('title')} required />
                <AITextarea
                  label="Description"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Describe requirements, tech stack, expectations... or let AI generate it."
                  rows={5}
                  aiContext={{
                    mode: 'project',
                    projectTitle: form.title,
                    category: categories.find(c => c.id === form.category_id)?.name || '',
                    budget: form.budget_min && form.budget_max ? `$${form.budget_min}–$${form.budget_max}` : '',
                  }}
                />
              </Section>

              {/* Category & Skills */}
              <Section title="Категория и навыки">
                <Select
                  label="Категория"
                  value={form.category_id}
                  onChange={set('category_id')}
                  placeholder="Выберите категорию"
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Навыки</label>
                  <SkillSelector
                    value={selectedSkills}
                    onChange={setSelectedSkills}
                    categorySlug={selectedCategory?.slug}
                  />
                </div>
              </Section>

              {/* Budget */}
              <Section title="Бюджет">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Минимум ($)" placeholder="500" value={form.budget_min} onChange={set('budget_min')} type="number" required />
                  <Input label="Максимум ($)" placeholder="5000" value={form.budget_max} onChange={set('budget_max')} type="number" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Тип оплаты" value={form.project_type} onChange={set('project_type')}
                    options={[{ value: 'fixed', label: 'Фиксированная цена' }, { value: 'hourly', label: 'Почасовая' }]} />
                  <Select label="Уровень исполнителя" value={form.experience_level} onChange={set('experience_level')}
                    options={[{ value: 'entry', label: 'Начинающий' }, { value: 'intermediate', label: 'Средний' }, { value: 'expert', label: 'Эксперт' }]} />
                </div>
              </Section>

              {/* Timeline */}
              <Section title="Сроки">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Длительность" value={form.duration} onChange={set('duration')} placeholder="Не указано"
                    options={[
                      { value: 'less_1_week', label: 'Меньше недели' },
                      { value: '1_2_weeks', label: '1–2 недели' },
                      { value: '1_month', label: '1 месяц' },
                      { value: '1_3_months', label: '1–3 месяца' },
                      { value: 'more_3_months', label: 'Более 3 месяцев' },
                    ]}
                  />
                  <Input label="Дедлайн" type="date" value={form.deadline} onChange={set('deadline')} />
                </div>
              </Section>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                  <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                  <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="submit" variant="primary" loading={loading} icon="send">
                  Опубликовать проект
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                  Отмена
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}
