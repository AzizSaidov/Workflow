import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import { useSEO } from '../hooks/useSEO'


const LEVEL_COLORS = {
  entry:        { color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.12)' },
  intermediate: { color: '#FBBF24',             bg: 'rgba(251,191,36,0.12)' },
  expert:       { color: 'var(--accent)',        bg: 'rgba(127,119,221,0.12)' },
}
const LEVEL_LABELS = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }

function PreviewCard({ form, skills, categories, isDark }) {
  const cat = categories.find(c => c.id === form.category_id)
  const hasTitle  = form.title.trim().length > 0
  const hasDesc   = form.description.trim().length > 0
  const hasBudget = form.budget_min && form.budget_max
  const lvl       = LEVEL_COLORS[form.experience_level] || LEVEL_COLORS.entry

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 }}>
        Так увидят фрилансеры
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {cat ? (
          <span style={{ fontSize: 11, color: 'var(--accent)', background: 'rgba(127,119,221,0.1)', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
            {cat.name}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Без категории</span>
        )}
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: lvl.bg, color: lvl.color, fontWeight: 500 }}>
          {LEVEL_LABELS[form.experience_level]}
        </span>
        {form.project_type === 'hourly' && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(93,202,165,0.1)', color: 'var(--accent-teal)', fontWeight: 500 }}>
            Почасовая
          </span>
        )}
      </div>

      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
        color: hasTitle ? 'var(--text-primary)' : 'var(--text-muted)',
        marginBottom: 8, lineHeight: 1.3,
        fontStyle: hasTitle ? 'normal' : 'italic',
      }}>
        {hasTitle ? form.title : 'Название проекта…'}
      </div>

      <div style={{
        fontSize: 12, color: hasDesc ? 'var(--text-secondary)' : 'var(--text-muted)',
        lineHeight: 1.6, marginBottom: 14,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontStyle: hasDesc ? 'normal' : 'italic',
      }}>
        {hasDesc ? form.description : 'Описание задачи появится здесь…'}
      </div>

      {skills.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {skills.slice(0, 4).map(s => (
            <span key={s.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(127,119,221,0.08)', border: '0.5px solid rgba(127,119,221,0.2)', color: 'var(--accent)' }}>
              {s.name}
            </span>
          ))}
          {skills.length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{skills.length - 4}</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
        <div>
          {hasBudget ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>
                {Number(form.budget_min).toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                — ${Number(form.budget_max).toLocaleString()}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Бюджет не указан</span>
          )}
        </div>
        {form.deadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 12 }} />
            {new Date(form.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
    </div>
  )
}

function TipCard({ icon, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 13, color: 'var(--accent)' }} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  )
}

export default function CreateProject() {
  useSEO({ title: 'Новый проект', description: 'Создайте проект и получите заявки от фрилансеров' })
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [categories,     setCategories]     = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const [form, setForm] = useState({
    title: '', description: '',
    category_id: '', category: '',
    budget_min: '', budget_max: '',
    project_type: 'fixed', experience_level: 'entry',
    deadline: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  const selectedCategory = categories.find(c => c.id === form.category_id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim())                      { setError('Введите название'); return }
    if (!form.budget_min || !form.budget_max)    { setError('Укажите бюджет'); return }
    if (Number(form.budget_min) > Number(form.budget_max)) { setError('Минимум не может быть больше максимума'); return }
    setError(''); setLoading(true)
    try {
      const payload = {
        title:            form.title,
        description:      form.description,
        category_id:      form.category_id || undefined,
        category:         selectedCategory?.name || form.category || undefined,
        budget_min:       parseFloat(form.budget_min),
        budget_max:       parseFloat(form.budget_max),
        project_type:     form.project_type,
        experience_level: form.experience_level,
        deadline:         form.deadline || undefined,
        skill_ids:        selectedSkills.map(s => s.id),
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
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div style={{ borderBottom: '0.5px solid var(--border)', padding: '28px 0', marginBottom: 0, background: isDark ? 'rgba(127,119,221,0.03)' : 'rgba(59,91,219,0.02)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
                Мои проекты
              </Link>
              <span style={{ color: 'var(--border)', fontSize: 16 }}>/</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-plus" style={{ fontSize: 14, color: 'var(--accent)' }} />
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Новый проект</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Заказчик: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.full_name}</span>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <Section num="1" title="Основное" icon="file-description">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Название проекта <span style={{ color: '#F87171' }}>*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Например: Разработка лендинга для SaaS-продукта"
                      value={form.title}
                      onChange={set('title')}
                      required
                      style={{ fontSize: 14, fontWeight: 500 }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                      {form.title.length}/100 символов
                    </div>
                  </div>
                  <AITextarea
                    label="Описание задачи"
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Опиши что нужно сделать, технологии, требования к исполнителю, ожидаемый результат…"
                    rows={6}
                    aiContext={{
                      mode: 'project',
                      projectTitle: form.title,
                      category: categories.find(c => c.id === form.category_id)?.name || '',
                      budget: form.budget_min && form.budget_max ? `$${form.budget_min}–$${form.budget_max}` : '',
                    }}
                  />
                </Section>

                <Section num="2" title="Категория и навыки" icon="tag">
                  <Select
                    label="Категория"
                    value={form.category_id}
                    onChange={set('category_id')}
                    placeholder="Выберите категорию"
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                  />
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Требуемые навыки
                    </label>
                    <SkillSelector
                      value={selectedSkills}
                      onChange={setSelectedSkills}
                      categorySlug={selectedCategory?.slug}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Укажи навыки — фрилансеры с нужным опытом увидят проект первыми
                    </div>
                  </div>
                </Section>

                <Section num="3" title="Бюджет" icon="wallet">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Input label="Минимум ($)" placeholder="500" value={form.budget_min} onChange={set('budget_min')} type="number" required />
                    <Input label="Максимум ($)" placeholder="5 000" value={form.budget_max} onChange={set('budget_max')} type="number" required />
                  </div>

                  {form.budget_min && form.budget_max && Number(form.budget_min) <= Number(form.budget_max) && (
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Диапазон бюджета</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>
                          ${Number(form.budget_min).toLocaleString()} — ${Number(form.budget_max).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Тип оплаты
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { val: 'fixed',  label: 'Фиксированная', icon: 'coin' },
                          { val: 'hourly', label: 'Почасовая',      icon: 'clock' },
                        ].map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, project_type: opt.val }))}
                            style={{
                              flex: 1, padding: '10px 8px', borderRadius: 10, border: '0.5px solid',
                              borderColor: form.project_type === opt.val ? 'var(--accent)' : 'var(--border)',
                              background: form.project_type === opt.val ? 'rgba(127,119,221,0.12)' : 'transparent',
                              color: form.project_type === opt.val ? 'var(--accent)' : 'var(--text-muted)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}
                          >
                            <i className={`ti ti-${opt.icon}`} style={{ fontSize: 13 }} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Уровень исполнителя
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { val: 'entry',        label: 'Джун',   color: 'var(--accent-green)' },
                          { val: 'intermediate', label: 'Мидл',   color: '#FBBF24' },
                          { val: 'expert',       label: 'Сеньор', color: 'var(--accent)' },
                        ].map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, experience_level: opt.val }))}
                            style={{
                              flex: 1, padding: '10px 4px', borderRadius: 10, border: '0.5px solid',
                              borderColor: form.experience_level === opt.val ? opt.color : 'var(--border)',
                              background: form.experience_level === opt.val ? `${opt.color}18` : 'transparent',
                              color: form.experience_level === opt.val ? opt.color : 'var(--text-muted)',
                              cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>

                <Section num="4" title="Сроки" icon="calendar">
                  <Input label="Дедлайн" type="date" value={form.deadline} onChange={set('deadline')} />
                  {form.deadline && (() => {
                    const days = Math.ceil((new Date(form.deadline) - new Date()) / 86400000)
                    const color = days < 0 ? '#F87171' : days <= 7 ? '#FBBF24' : 'var(--accent-green)'
                    const bg    = days < 0 ? 'rgba(248,113,113,0.08)' : days <= 7 ? 'rgba(251,191,36,0.08)' : 'rgba(29,158,117,0.06)'
                    const text  = days < 0 ? 'Дата уже прошла' : days === 0 ? 'Сегодня' : `${days} дн. с момента публикации`
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, background: bg, border: `0.5px solid ${color}33` }}>
                        <i className="ti ti-calendar-check" style={{ fontSize: 13, color }} />
                        <span style={{ fontSize: 12, color, fontWeight: 500 }}>{text}</span>
                      </div>
                    )
                  })()}
                </Section>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.25)' }}>
                    <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                    <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '13px 28px', borderRadius: 11,
                      background: loading ? 'rgba(127,119,221,0.4)' : 'var(--accent)',
                      border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {loading
                      ? <><i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 0.8s linear infinite' }} /> Публикуем…</>
                      : <><i className="ti ti-send" style={{ fontSize: 15 }} /> Опубликовать проект</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    style={{
                      padding: '13px 20px', borderRadius: 11, border: '0.5px solid var(--border)',
                      background: 'transparent', color: 'var(--text-muted)', fontSize: 14,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    Отмена
                  </button>
                </div>

              </div>
            </form>

            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>

              <PreviewCard
                form={form}
                skills={selectedSkills}
                categories={categories}
                isDark={isDark}
              />

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 }}>
                  Что будет дальше
                </div>
                {[
                  { icon: 'send',        text: 'Фрилансеры увидят проект и начнут подавать заявки' },
                  { icon: 'users',       text: 'Ты выбираешь лучшего кандидата из всех заявок' },
                  { icon: 'lock',        text: 'Бюджет замораживается в эскроу — деньги в безопасности' },
                  { icon: 'circle-check', text: 'Принимаешь работу → фрилансер получает оплату' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Syne', fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>{i + 1}</span>
                      </div>
                      {i < 3 && <div style={{ width: 1, height: 16, background: 'var(--border)', marginTop: 2 }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, paddingTop: 3 }}>{item.text}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 }}>
                  Советы
                </div>
                <TipCard icon="pencil"    text="Чёткое название и детальное описание привлекают в 3× больше заявок" />
                <TipCard icon="sparkles"  text="Используй ✨ AI для генерации описания — это экономит время" />
                <TipCard icon="coin"      text="Реалистичный бюджет помогает найти опытного исполнителя быстрее" />
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Section({ num, title, icon, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 14, color: 'var(--accent)' }} />
        </div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{num} / 4</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}
