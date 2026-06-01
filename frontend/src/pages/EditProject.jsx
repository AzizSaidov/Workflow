import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function EditProject() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '',
    category_id: '',
    budget_min: '', budget_max: '',
    project_type: 'fixed', experience_level: 'entry',
    duration: '', deadline: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    Promise.all([
      projectsApi.getOne(id),
      categoriesApi.getAll().catch(() => ({ data: [] })),
    ]).then(([p, cats]) => {
      const proj = p.data
      if (!proj) { setNotFound(true); return }
      if (proj.client_id !== user?.id) { navigate(`/projects/${id}`); return }
      if (!['open', 'in_progress'].includes(proj.status)) {
        setError('Cannot edit a project in this status.')
        return
      }
      setCategories(cats.data || [])
      setForm({
        title: proj.title || '',
        description: proj.description || '',
        category_id: proj.category_id || '',
        budget_min: proj.budget_min || '',
        budget_max: proj.budget_max || '',
        project_type: proj.project_type || 'fixed',
        experience_level: proj.experience_level || 'entry',
        duration: proj.duration || '',
        deadline: proj.deadline ? proj.deadline.split('T')[0] : '',
      })
    }).catch(() => setNotFound(true)).finally(() => setLoading(false))
  }, [id, user?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Enter a project title'); return }
    if (!form.budget_min || !form.budget_max) { setError('Set the budget range'); return }
    setError(''); setSaving(true)
    try {
      const selectedCat = categories.find(c => c.id === form.category_id)
      await projectsApi.update(id, {
        title: form.title,
        description: form.description,
        category_id: form.category_id || undefined,
        category: selectedCat?.name || undefined,
        budget_min: parseFloat(form.budget_min),
        budget_max: parseFloat(form.budget_max),
        project_type: form.project_type,
        experience_level: form.experience_level,
        duration: form.duration || undefined,
        deadline: form.deadline || undefined,
        skill_ids: selectedSkills.map(s => s.id),
      })
      navigate(`/projects/${id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', position: 'relative', zIndex: 2 }} />
    </div>
  )

  if (notFound) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 200, position: 'relative', zIndex: 2 }}>
        <i className="ti ti-alert-circle" style={{ fontSize: 40, color: 'var(--text-muted)', display: 'block', marginBottom: 12, opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Project not found</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>← Back</Button>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ maxWidth: 780, paddingTop: 40, paddingBottom: 80 }}>

          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => navigate(`/projects/${id}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 20, padding: 0 }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back to project
            </button>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
              Edit Project
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Update the project details below
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', marginBottom: 24 }}>
              <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
              <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              <Section title="Basics">
                <Input
                  label="Project Title"
                  placeholder="E.g. Build a SaaS dashboard with React"
                  value={form.title}
                  onChange={set('title')}
                  required
                />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Describe requirements, tech stack, expectations..."
                    rows={5}
                    className="input"
                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
              </Section>

              <Section title="Category & Skills">
                <Select
                  label="Category"
                  value={form.category_id}
                  onChange={set('category_id')}
                  placeholder="Select a category"
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Required Skills</label>
                  <SkillSelector
                    value={selectedSkills}
                    onChange={setSelectedSkills}
                    categorySlug={categories.find(c => c.id === form.category_id)?.slug}
                  />
                </div>
              </Section>

              <Section title="Budget">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Min budget ($)" placeholder="500" value={form.budget_min} onChange={set('budget_min')} type="number" required />
                  <Input label="Max budget ($)" placeholder="2000" value={form.budget_max} onChange={set('budget_max')} type="number" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Payment type" value={form.project_type} onChange={set('project_type')}
                    options={[{ value: 'fixed', label: 'Fixed price' }, { value: 'hourly', label: 'Hourly rate' }]} />
                  <Select label="Freelancer level" value={form.experience_level} onChange={set('experience_level')}
                    options={[{ value: 'entry', label: 'Entry level' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'expert', label: 'Expert' }]} />
                </div>
              </Section>

              <Section title="Timeline">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Duration" value={form.duration} onChange={set('duration')} placeholder="Not specified"
                    options={[
                      { value: 'less_1_week', label: 'Less than a week' },
                      { value: '1_2_weeks', label: '1–2 weeks' },
                      { value: '1_month', label: '1 month' },
                      { value: '1_3_months', label: '1–3 months' },
                      { value: 'more_3_months', label: 'More than 3 months' },
                    ]}
                  />
                  <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
                </div>
              </Section>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="submit" variant="primary" loading={saving} icon="check">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(`/projects/${id}`)}>
                  Cancel
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
