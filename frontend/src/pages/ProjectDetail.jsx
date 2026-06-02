import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToastStore from '../store/toastStore'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { bidsApi } from '../api/bids'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Tag from '../components/Tag'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import BidCard from '../components/BidCard'
import Input from '../components/Input'
import AITextarea from '../components/AITextarea'
import { aiApi } from '../api/ai'

const TYPE_LABEL = { fixed: 'Фиксированная цена', hourly: 'Почасовая' }
const LEVEL_LABEL = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }

const STATUS_STEPS = [
  { key: 'open', label: 'Открыт', icon: 'briefcase' },
  { key: 'in_progress', label: 'В работе', icon: 'clock' },
  { key: 'delivered', label: 'На проверке', icon: 'package' },
  { key: 'completed', label: 'Завершён', icon: 'circle-check' },
]
const STATUS_ORDER = { open: 0, in_progress: 1, delivered: 2, completed: 3 }

function getFileIcon(type) {
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return 'photo'
  if (type === 'pdf') return 'file-type-pdf'
  if (['doc', 'docx'].includes(type)) return 'file-type-doc'
  if (['zip', 'rar', '7z'].includes(type)) return 'file-zip'
  if (type === 'mp4') return 'video'
  if (['mp3', 'ogg', 'wav', 'm4a', 'webm'].includes(type)) return 'music'
  return 'file'
}

function StatusTimeline({ status }) {
  const current = STATUS_ORDER[status] ?? -1

  if (status === 'cancelled' || status === 'disputed') {
    return (
      <div style={{
        padding: '14px 20px', borderRadius: 12,
        background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.25)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F87171',
      }}>
        <i className={`ti ti-${status === 'cancelled' ? 'x' : 'alert-triangle'}`} />
        {status === 'cancelled' ? 'Проект отменён' : 'Проект оспаривается'}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '20px 28px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
        {/* background line */}
        <div style={{ position: 'absolute', top: 16, left: '12.5%', right: '12.5%', height: 2, background: 'var(--border)', zIndex: 0 }} />
        {/* progress line */}
        <div style={{
          position: 'absolute', top: 16, left: '12.5%', height: 2,
          background: 'linear-gradient(90deg, var(--accent-green), var(--accent))',
          zIndex: 0, transition: 'width 0.5s ease',
          width: current <= 0 ? '0%' : current >= 3 ? '75%' : `${(current / 3) * 75}%`,
        }} />

        {STATUS_STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'var(--bg)',
                border: `2px solid ${done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                color: done || active ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s',
                boxShadow: active ? '0 0 0 4px rgba(127,119,221,0.15)' : 'none',
              }}>
                {done
                  ? <i className="ti ti-check" style={{ fontSize: 13 }} />
                  : <i className={`ti ti-${step.icon}`} style={{ fontSize: 13 }} />}
              </div>
              <div style={{
                marginTop: 10, fontSize: 11.5,
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--text-primary)' : done ? 'var(--accent-green)' : 'var(--text-muted)',
                textAlign: 'center',
              }}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [bids, setBids] = useState([])
  const [clientData, setClientData] = useState(null)
  const [assignedUser, setAssignedUser] = useState(null)
  const [projectFiles, setProjectFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const [bidForm, setBidForm] = useState({ price: '', cover_letter: '' })
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSent, setBidSent] = useState(false)

  const [aiRank, setAiRank] = useState(null)
  const [aiRankLoading, setAiRankLoading] = useState(false)

  const [deliveryForm, setDeliveryForm] = useState({
    delivery_description: '',
    delivery_github_url: '',
    delivery_pr_url: '',
    delivery_demo_url: '',
  })
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionText, setRevisionText] = useState('')
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    const filesFetch = user
      ? projectsApi.getFiles(id).catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] })

    Promise.all([
      projectsApi.getOne(id),
      bidsApi.getForProject(id).catch(() => ({ data: [] })),
      filesFetch,
    ]).then(([p, b, f]) => {
      const proj = p.data
      setProject(proj)
      setBids(b.data || [])
      setProjectFiles(f.data || [])
      if (proj?.client_id) {
        client.get(`/users/${proj.client_id}`).then(r => setClientData(r.data)).catch(() => {})
      }
      if (proj?.assigned_freelancer_id) {
        client.get(`/users/${proj.assigned_freelancer_id}`).then(r => setAssignedUser(r.data)).catch(() => {})
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const isOwner = user?.id === project?.client_id
  const isFreelancer = user?.role === 'freelancer'
  const canBid = isFreelancer && project?.status === 'open' && !isOwner
  const alreadyBid = bids.some(b => b.freelancer_id === user?.id)
  const isAssignedFreelancer = isFreelancer && project?.assigned_freelancer_id === user?.id
  const hasChatAccess = ['in_progress', 'delivered', 'completed'].includes(project?.status) && (isOwner || isAssignedFreelancer)

  const submitBid = async (e) => {
    e.preventDefault()
    if (!bidForm.price) { setBidError('Укажите стоимость'); return }
    setBidError(''); setBidLoading(true)
    try {
      await bidsApi.create(id, { price: parseFloat(bidForm.price), cover_letter: bidForm.cover_letter })
      setBidSent(true)
      setBidForm({ price: '', cover_letter: '' })
      toast('Заявка успешно отправлена!', 'success')
      load()
    } catch (err) {
      setBidError(err.response?.data?.detail || 'Ошибка подачи заявки')
    } finally {
      setBidLoading(false)
    }
  }

  const submitDelivery = async (e) => {
    e.preventDefault()
    if (!deliveryForm.delivery_description.trim()) {
      toast('Добавьте описание выполненной работы', 'error'); return
    }
    setDeliveryLoading(true)
    try {
      await projectsApi.deliver(id, {
        delivery_description: deliveryForm.delivery_description,
        delivery_github_url: deliveryForm.delivery_github_url || null,
        delivery_pr_url: deliveryForm.delivery_pr_url || null,
        delivery_demo_url: deliveryForm.delivery_demo_url || null,
      })
      toast('Работа сдана! Ожидайте проверки заказчика.', 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка при сдаче работы', 'error')
    } finally {
      setDeliveryLoading(false)
    }
  }

  const handleAccept = async () => {
    setAcceptLoading(true)
    try {
      await projectsApi.acceptDelivery(id)
      toast('Работа принята! Средства перечислены фрилансеру.', 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setAcceptLoading(false)
    }
  }

  const handleRevision = async (e) => {
    e.preventDefault()
    if (!revisionText.trim()) { toast('Укажите что нужно доработать', 'error'); return }
    setRevisionLoading(true)
    try {
      await projectsApi.requestRevision(id, { client_feedback: revisionText })
      toast('Комментарий отправлен фрилансеру', 'success')
      setShowRevisionForm(false)
      setRevisionText('')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setRevisionLoading(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite', position: 'relative', zIndex: 2 }} />
    </div>
  )

  if (!project) return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 200, position: 'relative', zIndex: 2 }}>
        <p style={{ color: 'var(--text-muted)' }}>Проект не найден</p>
        <Button variant="outline" onClick={() => navigate('/projects')} style={{ marginTop: 16 }}>← Назад</Button>
      </div>
    </div>
  )

  const hasDelivery = project.delivery_description || project.delivery_github_url || project.delivery_pr_url || project.delivery_demo_url

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            <Link to="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >Проекты</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 12, opacity: 0.5 }} />
            <span style={{ color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.title}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

            {/* ── Main content ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Title card */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Tag status={project.status} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-clock" />
                    {new Date(project.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.2 }}>
                  {project.title}
                </h1>

                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 300 }}>
                  {project.description}
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                  {project.project_type && <Tag color="purple">{TYPE_LABEL[project.project_type]}</Tag>}
                  {project.experience_level && <Tag color="amber">{LEVEL_LABEL[project.experience_level]}</Tag>}
                  {project.category && <Tag color="green">{project.category}</Tag>}
                  {project.duration && <Tag color="muted">{project.duration}</Tag>}
                </div>
              </div>

              {/* Status Timeline */}
              <StatusTimeline status={project.status} />

              {/* ── Delivery form (assigned freelancer, in_progress) ── */}
              {isAssignedFreelancer && project.status === 'in_progress' && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-package-export" style={{ fontSize: 18, color: 'var(--accent)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Сдать работу
                    </h3>
                  </div>
                  <form onSubmit={submitDelivery} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <AITextarea
                      label="Описание выполненной работы *"
                      value={deliveryForm.delivery_description}
                      onChange={e => setDeliveryForm(f => ({ ...f, delivery_description: e.target.value }))}
                      placeholder="Опишите что сделано, как проверить результат, особые замечания..."
                      rows={4}
                      aiContext={{ mode: 'free' }}
                    />
                    <Input
                      label="GitHub репозиторий"
                      placeholder="https://github.com/..."
                      value={deliveryForm.delivery_github_url}
                      onChange={e => setDeliveryForm(f => ({ ...f, delivery_github_url: e.target.value }))}
                      icon="brand-github"
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input
                        label="Pull Request"
                        placeholder="https://github.com/.../pull/..."
                        value={deliveryForm.delivery_pr_url}
                        onChange={e => setDeliveryForm(f => ({ ...f, delivery_pr_url: e.target.value }))}
                        icon="git-pull-request"
                      />
                      <Input
                        label="Demo / Live URL"
                        placeholder="https://..."
                        value={deliveryForm.delivery_demo_url}
                        onChange={e => setDeliveryForm(f => ({ ...f, delivery_demo_url: e.target.value }))}
                        icon="world"
                      />
                    </div>
                    <Button type="submit" variant="primary" icon="send" loading={deliveryLoading}>
                      Сдать работу
                    </Button>
                  </form>
                </div>
              )}

              {/* ── Delivered work display (both parties, delivered / completed) ── */}
              {['delivered', 'completed'].includes(project.status) && hasDelivery && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: 18, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-package" style={{ fontSize: 18, color: 'var(--accent-green)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Сданная работа
                      </h3>
                      {project.delivery_submitted_at && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(project.delivery_submitted_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>

                  {project.delivery_description && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 18 }}>
                      {project.delivery_description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {project.delivery_github_url && (
                      <a href={project.delivery_github_url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9,
                        fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                      }}>
                        <i className="ti ti-brand-github" style={{ fontSize: 15 }} />
                        GitHub
                      </a>
                    )}
                    {project.delivery_pr_url && (
                      <a href={project.delivery_pr_url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9,
                        fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                      }}>
                        <i className="ti ti-git-pull-request" style={{ fontSize: 15 }} />
                        Pull Request
                      </a>
                    )}
                    {project.delivery_demo_url && (
                      <a href={project.delivery_demo_url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9,
                        fontSize: 13, background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.3)',
                        color: 'var(--accent-teal)', textDecoration: 'none',
                      }}>
                        <i className="ti ti-world" style={{ fontSize: 15 }} />
                        Демо
                      </a>
                    )}
                  </div>

                  {project.client_feedback && (
                    <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.07)', border: '0.5px solid rgba(251,191,36,0.25)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>
                        Комментарий заказчика
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {project.client_feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Client acceptance section (owner, delivered) ── */}
              {isOwner && project.status === 'delivered' && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 18, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-checklist" style={{ fontSize: 18, color: 'var(--accent)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Проверьте работу
                    </h3>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                    Фрилансер сдал работу. Проверьте результат — средства из эскроу будут перечислены после принятия.
                  </p>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: showRevisionForm ? 20 : 0 }}>
                    <Button variant="green" icon="circle-check" loading={acceptLoading} onClick={handleAccept}>
                      Принять работу
                    </Button>
                    <Button
                      variant="outline"
                      icon="refresh"
                      onClick={() => setShowRevisionForm(v => !v)}
                      style={{ borderColor: 'rgba(251,191,36,0.35)', color: '#FBBF24' }}
                    >
                      Запросить доработку
                    </Button>
                  </div>

                  {showRevisionForm && (
                    <form onSubmit={handleRevision} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <textarea
                        value={revisionText}
                        onChange={e => setRevisionText(e.target.value)}
                        placeholder="Что нужно доработать? Опишите подробно..."
                        rows={4}
                        style={{
                          width: '100%', resize: 'vertical', padding: '12px 14px', boxSizing: 'border-box',
                          background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10,
                          fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" variant="primary" loading={revisionLoading}>Отправить</Button>
                        <Button type="button" variant="outline" onClick={() => { setShowRevisionForm(false); setRevisionText('') }}>
                          Отмена
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Guest banner */}
              {!user && project.status === 'open' && (
                <div style={{
                  background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.25)',
                  borderRadius: 18, padding: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Хотите подать заявку?
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Войдите или зарегистрируйтесь, чтобы откликнуться на этот проект
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <Link to="/login" state={{ from: { pathname: window.location.pathname } }}>
                      <Button variant="primary" icon="login">Войти</Button>
                    </Link>
                    <Link to="/role">
                      <Button variant="outline">Регистрация</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Bid form for freelancers */}
              {canBid && (
                <div style={{ background: 'var(--bg-card)', border: `0.5px solid ${isDark ? 'rgba(127,119,221,0.25)' : 'rgba(80,72,213,0.2)'}`, borderRadius: 18, padding: 24 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
                    {bidSent || alreadyBid ? '✓ Заявка отправлена' : 'Подать заявку'}
                  </h3>
                  {bidSent || alreadyBid ? (
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ты уже подал заявку на этот проект. Ожидай ответа заказчика.</p>
                  ) : (
                    <form onSubmit={submitBid} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <Input
                        label="Ваша стоимость ($)"
                        type="number"
                        placeholder={`${project.budget_min} – ${project.budget_max}`}
                        value={bidForm.price}
                        onChange={e => setBidForm(f => ({ ...f, price: e.target.value }))}
                        icon="currency-dollar"
                        required
                      />
                      <AITextarea
                        label="Cover letter"
                        value={bidForm.cover_letter}
                        onChange={e => setBidForm(f => ({ ...f, cover_letter: e.target.value }))}
                        placeholder="Tell the client why you're the best fit for this project..."
                        rows={4}
                        aiContext={{
                          mode: 'bid',
                          projectTitle: project?.title,
                          projectDescription: project?.description,
                          skills: [],
                        }}
                      />
                      {bidError && <span style={{ fontSize: 13, color: '#F87171' }}>{bidError}</span>}
                      <Button type="submit" variant="primary" loading={bidLoading} icon="send">
                        Отправить заявку
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Bids list for owner */}
              {isOwner && bids.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Заявки <span style={{ color: 'var(--accent)' }}>({bids.length})</span>
                    </h3>
                    {bids.length >= 2 && (
                      <button
                        onClick={async () => {
                          setAiRankLoading(true)
                          setAiRank(null)
                          try {
                            const bidsSummary = bids.map((b, i) =>
                              `${i + 1}. ${b.freelancer_name} — $${b.price} — Rating: ${b.rating || 'N/A'}\nLetter: ${b.cover_letter || 'No letter'}`
                            ).join('\n\n')
                            const context = `Project: ${project.title}\nDescription: ${project.description}`
                            const { data } = await aiApi.chat(
                              `Rank these ${bids.length} freelancer bids for this project from best to worst. For each, give a 1-sentence reason. Be concise.\n\nBids:\n${bidsSummary}`,
                              context
                            )
                            setAiRank(data.text)
                          } catch {} finally { setAiRankLoading(false) }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 500,
                          border: '0.5px solid rgba(127,119,221,0.35)', background: 'rgba(127,119,221,0.08)',
                          color: 'var(--accent)', cursor: aiRankLoading ? 'not-allowed' : 'pointer',
                        }}
                        disabled={aiRankLoading}
                      >
                        {aiRankLoading
                          ? <i className="ti ti-loader-2" style={{ fontSize: 13, animation: 'spin 0.8s linear infinite' }} />
                          : <i className="ti ti-sparkles" style={{ fontSize: 13 }} />}
                        {aiRankLoading ? 'Анализирую...' : '✨ AI Rank'}
                      </button>
                    )}
                  </div>

                  {aiRank && (
                    <div style={{
                      marginBottom: 16, padding: '14px 16px', borderRadius: 12,
                      background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                        AI Анализ
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {aiRank}
                      </div>
                      <button onClick={() => setAiRank(null)} style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Закрыть
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bids.map(bid => (
                      <BidCard key={bid.id} bid={bid} isOwner={isOwner} onAccepted={load} />
                    ))}
                  </div>
                </div>
              )}

              {isOwner && bids.length === 0 && project.status === 'open' && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <i className="ti ti-inbox" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>Пока нет заявок</div>
                </div>
              )}

              {/* ── Project Files ── */}
              {user && projectFiles.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 28 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                    Файлы проекта
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {projectFiles.map(f => (
                      <a
                        key={f.id}
                        href={`/api/media/${f.stored_name}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)',
                          textDecoration: 'none', color: 'var(--text-secondary)', transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(127,119,221,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <i className={`ti ti-${getFileIcon(f.file_type)}`} style={{ fontSize: 18, color: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.original_name}
                        </span>
                        <i className="ti ti-download" style={{ fontSize: 14, opacity: 0.4, flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ── Sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 90 }}>

              {/* Budget */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Бюджет</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
                  ${Number(project.budget_min).toLocaleString()} – ${Number(project.budget_max).toLocaleString()}
                </div>
                {project.deadline && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <i className="ti ti-calendar-event" style={{ color: 'var(--accent-green)' }} />
                    Дедлайн: {new Date(project.deadline).toLocaleDateString('ru-RU')}
                  </div>
                )}
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <i className="ti ti-users" style={{ color: 'var(--accent)' }} />
                  {bids.length} заявок
                </div>
              </div>

              {/* Chat button */}
              {hasChatAccess && (
                <Link to={`/chats?project=${id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" icon="messages" style={{ width: '100%' }}>
                    Открыть чат
                  </Button>
                </Link>
              )}

              {/* Client info */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Заказчик</div>
                <Link to={`/profile/${project.client_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Avatar src={clientData?.avatar_url} name={clientData?.full_name || 'Client'} size={40} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{clientData?.full_name || '...'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Профиль заказчика</div>
                  </div>
                </Link>
              </div>

              {/* Assigned freelancer info */}
              {assignedUser && ['in_progress', 'delivered', 'completed'].includes(project.status) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Исполнитель</div>
                  <Link to={`/profile/${project.assigned_freelancer_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <Avatar src={assignedUser.avatar_url} name={assignedUser.full_name} size={40} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{assignedUser.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>Фрилансер</div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Edit button for owner */}
              {isOwner && (
                <Link to={`/projects/${id}/edit`}>
                  <Button variant="outline" icon="edit" style={{ width: '100%' }}>Редактировать</Button>
                </Link>
              )}

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
