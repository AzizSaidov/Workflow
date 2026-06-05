import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToastStore from '../store/toastStore'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { favoritesApi } from '../api/favorites'
import { reviewsApi } from '../api/reviews'
import { bidsApi } from '../api/bids'
import { contractsApi } from '../api/contracts'
import { escrowApi } from '../api/escrow'
import { walletApi } from '../api/wallet'
import { profilesApi } from '../api/profiles'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Tag from '../components/Tag'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import BidCard from '../components/BidCard'
import Input from '../components/Input'
import ReportModal from '../components/ReportModal'
import AITextarea from '../components/AITextarea'
import { aiApi } from '../api/ai'
import { useSEO } from '../hooks/useSEO'

const TYPE_LABEL = { fixed: 'Фиксированная цена', hourly: 'Почасовая' }
const LEVEL_LABEL = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }

function deadlineInfo(deadline) {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  if (days < 0)  return { label: `Просрочен на ${Math.abs(days)} дн.`, color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: 'alarm' }
  if (days === 0) return { label: 'Сегодня!', color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: 'alarm' }
  if (days <= 3)  return { label: `${days} дн.`, color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', icon: 'clock-exclamation' }
  return { label: new Date(deadline).toLocaleDateString('ru-RU'), color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.1)', icon: 'calendar-event' }
}
const CONTRACT_STATUS_LABEL = { active: 'Активный', completed: 'Завершён', disputed: 'Оспаривается', cancelled: 'Отменён' }
const CONTRACT_STATUS_COLOR = { active: 'var(--accent-green)', completed: 'var(--accent)', disputed: '#F87171', cancelled: 'var(--text-muted)' }

const STATUS_STEPS = [
  { key: 'open', label: 'Открыт' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'delivered', label: 'На проверке' },
  { key: 'completed', label: 'Завершён' },
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
      <div style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.07)', border: '0.5px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F87171' }}>
        <i className={`ti ti-${status === 'cancelled' ? 'x' : 'alert-triangle'}`} style={{ fontSize: 15 }} />
        {status === 'cancelled' ? 'Проект отменён' : 'Открыт спор — ожидайте решения администратора'}
      </div>
    )
  }
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Track line */}
        <div style={{ position: 'absolute', top: 15, left: '6%', right: '6%', height: 2, background: 'var(--border)', zIndex: 0 }} />
        <div style={{
          position: 'absolute', top: 15, left: '6%', height: 2, zIndex: 0,
          background: 'linear-gradient(90deg, var(--accent-green), var(--accent))',
          transition: 'width 0.5s ease',
          width: current <= 0 ? '0%' : current >= 3 ? '88%' : `${(current / 3) * 88}%`,
        }} />
        {STATUS_STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13,
                background: done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'var(--bg)',
                border: `2px solid ${done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                color: done || active ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s',
                boxShadow: active ? '0 0 0 4px rgba(127,119,221,0.15)' : 'none',
              }}>
                {done ? <i className="ti ti-check" style={{ fontSize: 12 }} /> : i + 1}
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, fontWeight: active ? 700 : 400,
                color: active ? 'var(--text-primary)' : done ? 'var(--accent-green)' : 'var(--text-muted)',
                textAlign: 'center', whiteSpace: 'nowrap',
              }}>{step.label}</div>
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
  const toast = useToastStore(s => s.show)

  const [project, setProject] = useState(null)
  useSEO({
    title: project?.title || 'Проект',
    description: project?.description ? project.description.slice(0, 120) : undefined,
  })
  const [bids, setBids] = useState([])
  const [myBid, setMyBid] = useState(undefined)
  const [clientData, setClientData] = useState(null)
  const [assignedUser, setAssignedUser] = useState(null)
  const [projectFiles, setProjectFiles] = useState([])
  const [contract, setContract] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bids')

  const [bidForm, setBidForm] = useState({ price: '', cover_letter: '' })
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')

  const [aiRank, setAiRank] = useState(null)
  const [aiRankLoading, setAiRankLoading] = useState(false)
  const [aiRankedOrder, setAiRankedOrder] = useState(null)
  const [showAllBids, setShowAllBids] = useState(false)

  const [revisions, setRevisions] = useState([])
  const [showRevisionHistory, setShowRevisionHistory] = useState(false)

  const [deliveryForm, setDeliveryForm] = useState({ delivery_description: '', delivery_github_url: '', delivery_pr_url: '', delivery_demo_url: '' })
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionText, setRevisionText] = useState('')
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  const [myReview, setMyReview] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [commentFocused, setCommentFocused] = useState(false)

  const [freezeLoading, setFreezeLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)

  const [isFavorited, setIsFavorited] = useState(false)
  const [favHov, setFavHov] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false)
  const [disputeLoading, setDisputeLoading] = useState(false)

  const fileUploadRef = useRef(null)
  const [fileUploading, setFileUploading] = useState(false)

  const load = () => {
    setLoading(true)
    const filesFetch = user ? projectsApi.getFiles(id).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    Promise.all([
      projectsApi.getOne(id),
      bidsApi.getForProject(id).catch(() => ({ data: [] })),
      filesFetch,
      projectsApi.getRevisions(id).catch(() => ({ data: [] })),
    ]).then(([p, b, f, rev]) => {
      const proj = p.data
      setProject(proj)
      setBids(b.data || [])
      setProjectFiles(f.data || [])
      setRevisions(rev.data || [])
      if (proj?.client_id) client.get(`/users/${proj.client_id}`).then(r => setClientData(r.data)).catch(() => {})
      if (proj?.assigned_freelancer_id) client.get(`/users/${proj.assigned_freelancer_id}`).then(r => setAssignedUser(r.data)).catch(() => {})
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (!user) return
    favoritesApi.getAll()
      .then(r => setIsFavorited((r.data || []).some(f => f.project_id === id)))
      .catch(() => {})
  }, [id, user?.id])

  useEffect(() => {
    if (!user || !project) return
    if (project.status === 'completed') {
      reviewsApi.getMyReview(id)
        .then(r => { if (r.data) setMyReview(r.data) })
        .catch(() => {})
    }
  }, [id, project?.status, user?.id])

  const toggleFav = async () => {
    if (favLoading) return
    const removing = isFavorited
    setIsFavorited(!removing)
    setFavLoading(true)
    toast(removing ? 'Удалено из избранного' : 'Добавлено в избранное!', removing ? 'info' : 'success')
    try {
      removing ? await favoritesApi.removeProject(id) : await favoritesApi.addProject(id)
    } catch {
      setIsFavorited(removing)
      toast('Ошибка', 'error')
    } finally { setFavLoading(false) }
  }

  useEffect(() => {
    if (!user || user.role !== 'freelancer') { setMyBid(null); return }
    bidsApi.getMyBidForProject(id)
      .then(r => setMyBid(r.data ?? null))
      .catch(() => setMyBid(null))
  }, [id, user?.id])

  useEffect(() => {
    if (!project || !user) return
    contractsApi.getByProject(id).then(r => setContract(r.data)).catch(() => {})
  }, [project?.id, user?.id])

  useEffect(() => {
    if (!user) return
    walletApi.get().then(r => setWallet(r.data)).catch(() => {})
  }, [user?.id])

  // Switch to files tab when project is completed
  useEffect(() => {
    if (!project || !user) return
    if (project.status === 'completed') setActiveTab('files')
  }, [project?.status, project?.id])

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

  // ── Derived state ──
  const isOwner = user?.id === project.client_id
  const isFreelancer = user?.role === 'freelancer'
  const isAssignedFreelancer = isFreelancer && project.assigned_freelancer_id === user?.id
  const canBid = isFreelancer && project.status === 'open' && !isOwner && myBid === null
  const hasChatAccess = ['in_progress', 'delivered', 'completed'].includes(project.status) && (isOwner || isAssignedFreelancer)
  const canDispute = isOwner && ['in_progress', 'delivered'].includes(project.status)
  const acceptedBid = bids.find(b => b.status === 'accepted')
  const needsEscrow = isOwner && project.assigned_freelancer_id && project.status === 'open'
  const currentProgress = project.progress_percent ?? 0
  const hasDelivery = project.delivery_description || project.delivery_github_url || project.delivery_pr_url || project.delivery_demo_url
  const isRevision = project.status === 'in_progress' && !!project.client_feedback
  const canUploadFile = (isOwner && !['cancelled', 'disputed'].includes(project.status)) ||
    (isAssignedFreelancer && ['in_progress', 'delivered', 'completed'].includes(project.status))

  // ── Handlers ──
  const submitBid = async (e) => {
    e.preventDefault()
    if (!bidForm.price) { setBidError('Укажите стоимость'); return }
    if (parseFloat(bidForm.price) <= 0) { setBidError('Сумма должна быть больше нуля'); return }
    if (parseFloat(bidForm.price) < parseFloat(project.budget_min)) {
      setBidError(`Сумма не может быть ниже минимального бюджета ($${Number(project.budget_min).toLocaleString()})`)
      return
    }
    if (parseFloat(bidForm.price) > parseFloat(project.budget_max)) {
      setBidError(`Сумма не может превышать максимальный бюджет ($${Number(project.budget_max).toLocaleString()})`)
      return
    }
    setBidError(''); setBidLoading(true)
    try {
      await bidsApi.create(id, { price: parseFloat(bidForm.price), cover_letter: bidForm.cover_letter })
      setBidForm({ price: '', cover_letter: '' })
      toast('Заявка отправлена!', 'success')
      bidsApi.getMyBidForProject(id).then(r => setMyBid(r.data ?? null)).catch(() => {})
      load()
    } catch (err) {
      setBidError(err.response?.data?.detail || 'Ошибка подачи заявки')
    } finally {
      setBidLoading(false)
    }
  }

  const handleFreeze = async () => {
    setFreezeLoading(true)
    try {
      await escrowApi.freeze(id)
      toast('Эскроу пополнен! Проект запущен.', 'success')
      load()
      walletApi.get().then(r => setWallet(r.data)).catch(() => {})
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка запуска проекта', 'error')
    } finally {
      setFreezeLoading(false)
    }
  }

  const handleProgress = async (percent) => {
    setProgressLoading(true)
    try {
      await projectsApi.updateProgress(id, percent)
      toast(`Прогресс: ${percent}%`, 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setProgressLoading(false)
    }
  }

  const submitDelivery = async (e) => {
    e.preventDefault()
    if (!deliveryForm.delivery_description.trim()) { toast('Добавьте описание', 'error'); return }
    setDeliveryLoading(true)
    try {
      await projectsApi.deliver(id, {
        delivery_description: deliveryForm.delivery_description,
        delivery_github_url: deliveryForm.delivery_github_url || null,
        delivery_pr_url: deliveryForm.delivery_pr_url || null,
        delivery_demo_url: deliveryForm.delivery_demo_url || null,
      })
      toast('Работа сдана! Ожидайте проверки.', 'success')
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
      walletApi.get().then(r => setWallet(r.data)).catch(() => {})
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
      toast('Комментарий отправлен', 'success')
      setShowRevisionForm(false); setRevisionText('')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setRevisionLoading(false)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewRating) { toast('Выберите оценку', 'error'); return }
    if (!reviewComment.trim()) { toast('Напишите комментарий', 'error'); return }
    setReviewLoading(true)
    try {
      const revieweeId = isOwner ? project.assigned_freelancer_id : project.client_id
      const { data } = await reviewsApi.create({
        project_id: id,
        reviewee_id: revieweeId,
        rating: reviewRating,
        comment: reviewComment,
      })
      setMyReview(data)
      toast('Отзыв опубликован!', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleDispute = async () => {
    setDisputeLoading(true)
    try {
      await projectsApi.dispute(id)
      toast('Спор открыт. Администратор рассмотрит вашу заявку.', 'info')
      setShowDisputeConfirm(false)
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setDisputeLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileUploading(true)
    try {
      await projectsApi.uploadFile(id, file)
      toast('Файл загружен', 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.detail || 'Ошибка загрузки файла', 'error')
    } finally {
      setFileUploading(false)
      if (fileUploadRef.current) fileUploadRef.current.value = ''
    }
  }

  const tabs = [
    { key: 'bids', label: 'Заявки', icon: 'files', badge: isOwner && bids.length > 0 ? bids.length : null },
    ...(hasChatAccess ? [{ key: 'chat', label: 'Чат', icon: 'messages', badge: null }] : []),
    { key: 'files', label: 'Файлы', icon: 'paperclip', badge: projectFiles.length > 0 ? projectFiles.length : null },
  ]

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            <Link to="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Проекты</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 12, opacity: 0.5 }} />
            <span style={{ color: 'var(--text-secondary)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

            {/* ── MAIN COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── HERO CARD ── */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(127,119,221,0.14) 0%, rgba(13,13,24,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(59,91,219,0.08) 0%, var(--bg-card) 100%)',
                  padding: '22px 26px 20px',
                  borderBottom: '0.5px solid var(--border)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(127,119,221,0.06)', pointerEvents: 'none' }} />
                  {/* Status + dates row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <Tag status={project.status} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {project.deadline && (() => {
                        const dl = deadlineInfo(project.deadline)
                        return (
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                            padding: '3px 9px', borderRadius: 20,
                            color: dl.color, background: dl.bg,
                            border: `0.5px solid ${dl.color}40`,
                          }}>
                            <i className={`ti ti-${dl.icon}`} style={{ fontSize: 12 }} />
                            {dl.label}
                          </span>
                        )
                      })()}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-clock" style={{ fontSize: 12 }} />
                        {new Date(project.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  {/* Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text-primary)', lineHeight: 1.25, margin: 0, flex: 1 }}>
                      {project.title}
                    </h1>
                    {revisions.length > 0 && (
                      <span
                        onClick={() => setShowRevisionHistory(v => !v)}
                        title="История доработок"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, marginTop: 4,
                          background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.3)',
                          color: '#FBBF24', cursor: 'pointer',
                        }}
                      >
                        <i className="ti ti-history" style={{ fontSize: 12 }} />
                        Доработок: {revisions.length}
                      </span>
                    )}
                  </div>
                  {/* Budget + tags row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.2)', borderRadius: 10, padding: '6px 12px' }}>
                      <i className="ti ti-currency-dollar" style={{ fontSize: 14, color: 'var(--accent)', alignSelf: 'center' }} />
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {Number(project.budget_min).toLocaleString()}–{Number(project.budget_max).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
                        {TYPE_LABEL[project.project_type] || ''}
                      </span>
                    </div>
                    {project.experience_level && <Tag color="amber">{LEVEL_LABEL[project.experience_level]}</Tag>}
                    {project.category && <Tag color="green">{project.category}</Tag>}
                    {project.duration && <Tag color="muted">{project.duration}</Tag>}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                        <i className="ti ti-users" style={{ fontSize: 13 }} />{bids.length} заявок
                      </span>
                      {user && !isOwner && (
                        <button
                          onClick={() => setReportOpen(true)}
                          title="Пожаловаться на проект"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: 9,
                            background: 'none', border: '0.5px solid var(--border)',
                            cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <i className="ti ti-flag" style={{ fontSize: 15 }} />
                        </button>
                      )}
                      {user && (
                        <button
                          onClick={toggleFav}
                          disabled={favLoading}
                          onMouseEnter={() => { if (!favLoading) setFavHov(true) }}
                          onMouseLeave={() => setFavHov(false)}
                          title={isFavorited ? 'Убрать из избранного' : 'В избранное'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: isFavorited && favHov ? '6px 12px' : '6px 10px',
                            borderRadius: 9, cursor: favLoading ? 'not-allowed' : 'pointer',
                            border: isFavorited
                              ? `0.5px solid ${favHov ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.35)'}`
                              : '0.5px solid var(--border)',
                            background: isFavorited
                              ? (favHov ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.07)')
                              : (favHov ? 'rgba(251,191,36,0.07)' : 'transparent'),
                            color: isFavorited ? '#FBBF24' : favHov ? '#FBBF24' : 'var(--text-muted)',
                            fontSize: 12, fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 15, lineHeight: 1 }}>{isFavorited ? (favHov ? '☆' : '★') : '☆'}</span>
                          {isFavorited ? (favHov ? 'Убрать' : 'В избранном') : 'В избранное'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div style={{ padding: '18px 26px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>{project.description}</p>
                </div>
              </div>

              {/* Status Timeline */}
              <StatusTimeline status={project.status} />

              {/* ── КЛИЕНТ: Эскроу ── */}
              {needsEscrow && (
                <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(127,119,221,0.4)', borderRadius: 18, padding: 26, boxShadow: '0 0 40px rgba(127,119,221,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-lock" style={{ fontSize: 20, color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Шаг 2 — Запустить проект</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Заморозьте оплату в эскроу — фрилансер приступит к работе</div>
                    </div>
                  </div>
                  {assignedUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)', marginBottom: 14 }}>
                      <Avatar src={assignedUser.avatar_url} name={assignedUser.full_name} size={40} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{assignedUser.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>Выбранный исполнитель</div>
                      </div>
                      {acceptedBid && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent-green)' }}>${Number(acceptedBid.price).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>сумма контракта</div>
                        </div>
                      )}
                    </div>
                  )}
                  {wallet && acceptedBid && (() => {
                    const enough = Number(wallet.balance) >= Number(acceptedBid.price)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: enough ? 'rgba(29,158,117,0.07)' : 'rgba(248,113,113,0.07)', border: `0.5px solid ${enough ? 'rgba(29,158,117,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <i className={`ti ti-${enough ? 'circle-check' : 'alert-triangle'}`} style={{ fontSize: 15, color: enough ? 'var(--accent-green)' : '#F87171' }} />
                          <span style={{ fontSize: 13, color: enough ? 'var(--accent-teal)' : '#F87171', fontWeight: 500 }}>
                            {enough ? 'Средств достаточно' : 'Недостаточно средств'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Баланс: <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>${Number(wallet.balance).toLocaleString()}</span></div>
                          {!enough && <div style={{ fontSize: 11, color: '#F87171', marginTop: 2 }}>Не хватает: ${Math.max(0, Number(acceptedBid.price) - Number(wallet.balance)).toLocaleString()}</div>}
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Button variant="primary" icon="rocket" loading={freezeLoading} onClick={handleFreeze}>
                      {acceptedBid ? `Заморозить $${Number(acceptedBid.price).toLocaleString()} в эскроу и запустить` : 'Запустить проект'}
                    </Button>
                    {wallet && acceptedBid && Number(wallet.balance) < Number(acceptedBid.price) && (
                      <Link to="/wallet" style={{ textDecoration: 'none' }}>
                        <Button variant="outline" icon="wallet" style={{ width: '100%' }}>Пополнить кошелёк</Button>
                      </Link>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.55 }}>
                    Деньги выплачиваются фрилансеру только после вашего подтверждения. При разногласиях — откройте спор.
                  </p>
                </div>
              )}

              {/* ── ФРИЛАНСЕР: заявка принята, ждём эскроу ── */}
              {isAssignedFreelancer && project.status === 'open' && (
                <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(29,158,117,0.35)', borderRadius: 18, padding: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-circle-check" style={{ fontSize: 24, color: 'var(--accent-green)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--accent-green)', marginBottom: 3 }}>Заявка принята!</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ожидайте — заказчик должен запустить проект через эскроу.</div>
                    </div>
                  </div>
                  {myBid && (
                    <div style={{ display: 'flex', gap: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)' }}>
                      <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Ваша ставка</div><div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--accent-green)' }}>${Number(myBid.price).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Статус</div><Tag color="green">Принята</Tag></div>
                    </div>
                  )}
                  <div style={{ marginTop: 14, padding: '9px 13px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '0.5px solid rgba(251,191,36,0.2)', fontSize: 13, color: 'var(--text-muted)' }}>
                    <i className="ti ti-clock" style={{ marginRight: 7, color: '#FBBF24' }} />
                    После пополнения эскроу вы получите уведомление
                  </div>
                </div>
              )}

              {/* ── ПРОГРЕСС ── */}
              {project.status === 'in_progress' && (isOwner || isAssignedFreelancer) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-chart-line" style={{ fontSize: 17, color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Прогресс</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isAssignedFreelancer ? 'Обновляйте по мере выполнения' : 'Статус от исполнителя'}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: currentProgress >= 100 ? 'var(--accent-green)' : 'var(--accent)' }}>{currentProgress}%</div>
                  </div>
                  <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', marginBottom: isAssignedFreelancer ? 14 : 0 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: currentProgress >= 100 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent), var(--accent-teal))', width: `${currentProgress}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  {isAssignedFreelancer && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[25, 50, 75].map(pct => (
                        <button key={pct} onClick={() => handleProgress(pct)} disabled={progressLoading || currentProgress >= pct}
                          style={{ flex: 1, padding: '8px 6px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: `0.5px solid ${currentProgress >= pct ? 'rgba(29,158,117,0.4)' : 'var(--border)'}`, background: currentProgress >= pct ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.04)', color: currentProgress >= pct ? 'var(--accent-teal)' : 'var(--text-secondary)', cursor: currentProgress >= pct ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {currentProgress >= pct && <i className="ti ti-check" style={{ fontSize: 12 }} />}{pct}%
                        </button>
                      ))}
                      <button onClick={() => document.getElementById('delivery-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        style={{ flex: 1.5, padding: '8px 10px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'rgba(127,119,221,0.1)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(127,119,221,0.1)'}>
                        <i className="ti ti-package-export" style={{ fontSize: 14 }} />Сдать работу
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Комментарий на доработку ── */}
              {isRevision && (isOwner || isAssignedFreelancer) && (
                <div style={{ background: 'var(--bg-card)', border: '1.5px solid rgba(251,191,36,0.35)', borderRadius: 16, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-message-report" style={{ fontSize: 18, color: '#FBBF24' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#FBBF24' }}>Запрошена доработка</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {isAssignedFreelancer ? 'Исправьте замечания и сдайте работу заново' : 'Фрилансер получил уведомление'}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(251,191,36,0.05)', border: '0.5px solid rgba(251,191,36,0.18)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {project.client_feedback}
                  </div>
                </div>
              )}

              {/* ── Предыдущая сдача (ревизия) ── */}
              {isRevision && hasDelivery && (isOwner || isAssignedFreelancer) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22, opacity: 0.75 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-history" style={{ fontSize: 13 }} />Предыдущая сдача
                  </div>
                  {project.delivery_description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{project.delivery_description}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {project.delivery_github_url && <a href={project.delivery_github_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}><i className="ti ti-brand-github" style={{ fontSize: 14 }} />GitHub</a>}
                    {project.delivery_pr_url && <a href={project.delivery_pr_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}><i className="ti ti-git-pull-request" style={{ fontSize: 14 }} />Pull Request</a>}
                    {project.delivery_demo_url && <a href={project.delivery_demo_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}><i className="ti ti-world" style={{ fontSize: 14 }} />Демо</a>}
                  </div>
                </div>
              )}

              {/* ── История доработок ── */}
              {revisions.length > 0 && (isOwner || isAssignedFreelancer) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowRevisionHistory(v => !v)}
                    style={{
                      width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <i className="ti ti-history" style={{ fontSize: 16, color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      История доработок
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(127,119,221,0.15)', color: 'var(--accent)',
                    }}>
                      {revisions.length}
                    </span>
                    <i className={`ti ti-chevron-${showRevisionHistory ? 'up' : 'down'}`} style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                  </button>
                  {showRevisionHistory && (
                    <div style={{ borderTop: '0.5px solid var(--border)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {revisions.map((rev, i) => (
                        <div key={rev.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                            background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 800, color: '#FBBF24' }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                              {new Date(rev.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{rev.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ФРИЛАНСЕР: форма сдачи работы ── */}
              {isAssignedFreelancer && project.status === 'in_progress' && (
                <div id="delivery-form" style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-package-export" style={{ fontSize: 17, color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Сдать работу</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Опишите что сделано — заказчик получит уведомление</div>
                    </div>
                  </div>
                  <form onSubmit={submitDelivery} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <AITextarea label="Описание выполненной работы *" value={deliveryForm.delivery_description} onChange={e => setDeliveryForm(f => ({ ...f, delivery_description: e.target.value }))} placeholder="Что сделано, как проверить, особые замечания..." rows={4} aiContext={{ mode: 'deliver', projectTitle: project?.title || '', projectDescription: project?.description || '' }} />
                    <Input label="GitHub репозиторий" placeholder="https://github.com/..." value={deliveryForm.delivery_github_url} onChange={e => setDeliveryForm(f => ({ ...f, delivery_github_url: e.target.value }))} icon="brand-github" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Pull Request" placeholder="https://github.com/.../pull/..." value={deliveryForm.delivery_pr_url} onChange={e => setDeliveryForm(f => ({ ...f, delivery_pr_url: e.target.value }))} icon="git-pull-request" />
                      <Input label="Demo / Live URL" placeholder="https://..." value={deliveryForm.delivery_demo_url} onChange={e => setDeliveryForm(f => ({ ...f, delivery_demo_url: e.target.value }))} icon="world" />
                    </div>
                    <Button type="submit" variant="primary" icon="send" loading={deliveryLoading}>Отправить работу заказчику</Button>
                  </form>
                </div>
              )}

              {/* ── Сданная работа ── */}
              {['delivered', 'completed'].includes(project.status) && hasDelivery && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: 18, padding: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-package" style={{ fontSize: 17, color: 'var(--accent-green)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Сданная работа</h3>
                      {project.delivery_submitted_at && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(project.delivery_submitted_at).toLocaleString('ru-RU')}</div>}
                    </div>
                  </div>
                  {project.delivery_description && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 16 }}>{project.delivery_description}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {project.delivery_github_url && <a href={project.delivery_github_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}><i className="ti ti-brand-github" style={{ fontSize: 14 }} />GitHub</a>}
                    {project.delivery_pr_url && <a href={project.delivery_pr_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}><i className="ti ti-git-pull-request" style={{ fontSize: 14 }} />Pull Request</a>}
                    {project.delivery_demo_url && <a href={project.delivery_demo_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.3)', color: 'var(--accent-teal)', textDecoration: 'none' }}><i className="ti ti-world" style={{ fontSize: 14 }} />Демо</a>}
                  </div>
                  {project.client_feedback && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 9, background: 'rgba(251,191,36,0.06)', border: '0.5px solid rgba(251,191,36,0.22)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Комментарий заказчика</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{project.client_feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── КЛИЕНТ: принять / запросить доработку ── */}
              {isOwner && project.status === 'delivered' && (
                <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(29,158,117,0.35)', borderRadius: 18, padding: 26, boxShadow: '0 0 32px rgba(29,158,117,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-checklist" style={{ fontSize: 20, color: 'var(--accent-green)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Фрилансер сдал работу</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Проверьте результат — деньги из эскроу перейдут исполнителю</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: showRevisionForm ? 16 : 0 }}>
                    <Button variant="green" icon="circle-check" loading={acceptLoading} onClick={handleAccept}>Принять и выплатить</Button>
                    <Button variant="outline" icon="refresh" onClick={() => setShowRevisionForm(v => !v)} style={{ borderColor: 'rgba(251,191,36,0.35)', color: '#FBBF24' }}>Запросить доработку</Button>
                  </div>
                  {showRevisionForm && (
                    <form onSubmit={handleRevision} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <textarea value={revisionText} onChange={e => setRevisionText(e.target.value)} placeholder="Что нужно доработать? Опишите подробно..." rows={4}
                        style={{ width: '100%', resize: 'vertical', padding: '10px 13px', boxSizing: 'border-box', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="submit" variant="primary" loading={revisionLoading}>Отправить</Button>
                        <Button type="button" variant="outline" onClick={() => { setShowRevisionForm(false); setRevisionText('') }}>Отмена</Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ── Форма отзыва ── */}
              {project.status === 'completed' && (isOwner || isAssignedFreelancer) && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: myReview ? '0.5px solid rgba(239,159,39,0.35)' : '1px solid rgba(239,159,39,0.25)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: myReview ? '0 0 32px rgba(239,159,39,0.06)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* subtle bg glow */}
                  <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(239,159,39,0.04)', pointerEvents: 'none' }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, position: 'relative' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: myReview ? 'rgba(239,159,39,0.18)' : 'rgba(239,159,39,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: myReview ? '0 0 16px rgba(239,159,39,0.2)' : 'none',
                    }}>
                      <span style={{ fontSize: 22, color: '#EF9F27', lineHeight: 1 }}>{myReview ? '★' : '☆'}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                        {myReview ? 'Отзыв опубликован' : 'Оставить отзыв'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {isOwner
                          ? `Оцените работу фрилансера${assignedUser?.full_name ? ` — ${assignedUser.full_name}` : ''}`
                          : `Оцените сотрудничество с заказчиком${clientData?.full_name ? ` — ${clientData.full_name}` : ''}`}
                      </div>
                    </div>
                    {myReview && (
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,159,39,0.12)', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 10, padding: '6px 12px' }}>
                        <span style={{ fontSize: 15, color: '#EF9F27', lineHeight: 1 }}>★</span>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#EF9F27', letterSpacing: '-0.5px' }}>{myReview.rating}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 5</span>
                      </div>
                    )}
                  </div>

                  {myReview ? (
                    /* ── Опубликованный отзыв ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: 24, lineHeight: 1, color: s <= myReview.rating ? '#EF9F27' : 'rgba(255,255,255,0.12)' }}>★</span>
                        ))}
                        <span style={{ marginLeft: 8, fontSize: 13, color: '#EF9F27', fontWeight: 600 }}>
                          {['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично'][myReview.rating]}
                        </span>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,159,39,0.05)', border: '0.5px solid rgba(239,159,39,0.18)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {myReview.comment}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
                        <i className="ti ti-circle-check" style={{ fontSize: 15 }} />Отзыв успешно отправлен
                      </div>
                    </div>
                  ) : (
                    /* ── Форма ── */
                    <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      {/* Star picker */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Оценка</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {[1,2,3,4,5].map(star => {
                            const display = hoverRating > 0 ? hoverRating : reviewRating
                            const lit = star <= display
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', lineHeight: 1, fontSize: 36, color: lit ? '#EF9F27' : '#555', transition: 'color 0.1s' }}
                              >
                                {lit ? '★' : '☆'}
                              </button>
                            )
                          })}
                          {(() => {
                            const display = hoverRating > 0 ? hoverRating : reviewRating
                            return (
                              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, minWidth: 80,
                                color: display ? '#EF9F27' : 'var(--text-muted)' }}>
                                {display ? ['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично'][display] : 'не выбрано'}
                              </span>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Комментарий</div>
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          onFocus={() => setCommentFocused(true)}
                          onBlur={() => setCommentFocused(false)}
                          placeholder="Расскажите об опыте сотрудничества..."
                          rows={4}
                          style={{
                            width: '100%', resize: 'vertical',
                            padding: '13px 15px', boxSizing: 'border-box',
                            background: commentFocused ? 'rgba(239,159,39,0.04)' : 'var(--bg)',
                            border: `0.5px solid ${commentFocused ? 'rgba(239,159,39,0.45)' : 'var(--border)'}`,
                            borderRadius: 12,
                            fontSize: 14, color: 'var(--text-primary)',
                            fontFamily: 'DM Sans, sans-serif',
                            outline: 'none',
                            transition: 'border-color 0.18s, background 0.18s',
                            lineHeight: 1.6,
                          }}
                        />
                      </div>

                      <Button type="submit" variant="primary" icon="send" loading={reviewLoading} style={{ alignSelf: 'flex-start' }}>
                        Опубликовать отзыв
                      </Button>

                    </form>
                  )}
                </div>
              )}

              {/* ── TABS ── */}
              <div>
                {/* Tab bar — inline-flex, pill style */}
                <div style={{ display: 'inline-flex', gap: 4, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 13, padding: 4, marginBottom: 20 }}>
                  {tabs.map(tab => {
                    const active = activeTab === tab.key
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 18px', borderRadius: 9, fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        border: 'none', cursor: 'pointer',
                        background: active ? (isDark ? 'rgba(127,119,221,0.2)' : 'rgba(59,91,219,0.1)') : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}>
                        <i className={`ti ti-${tab.icon}`} style={{ fontSize: 14 }} />
                        {tab.label}
                        {tab.badge && (
                          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 7, background: active ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.07)', color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* ── ЗАЯВКИ TAB ── */}
                {activeTab === 'bids' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {!user && project.status === 'open' && (
                      <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 16, padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>Хотите подать заявку?</div>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Войдите или зарегистрируйтесь</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                          <Link to="/login"><Button variant="primary" icon="login">Войти</Button></Link>
                          <Link to="/role"><Button variant="outline">Регистрация</Button></Link>
                        </div>
                      </div>
                    )}

                    {isFreelancer && !isOwner && (
                      <>
                        {canBid && (
                          <div style={{ background: 'var(--bg-card)', border: `0.5px solid ${isDark ? 'rgba(127,119,221,0.25)' : 'rgba(59,91,219,0.2)'}`, borderRadius: 16, padding: 22 }}>
                            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>Подать заявку</h3>
                            <form onSubmit={submitBid} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <Input label={`Ваша стоимость ($${Number(project.budget_min).toLocaleString()} – $${Number(project.budget_max).toLocaleString()})`} type="number" placeholder={`${project.budget_min} – ${project.budget_max}`} min={project.budget_min} max={project.budget_max} value={bidForm.price} onChange={e => setBidForm(f => ({ ...f, price: e.target.value }))} icon="currency-dollar" required />
                              <AITextarea label="Cover letter" value={bidForm.cover_letter} onChange={e => setBidForm(f => ({ ...f, cover_letter: e.target.value }))} placeholder="Почему вы лучший кандидат для этого проекта?" rows={4} aiContext={{ mode: 'bid', projectTitle: project.title, projectDescription: project.description, skills: [] }} />
                              {bidError && <span style={{ fontSize: 13, color: '#F87171' }}>{bidError}</span>}
                              <Button type="submit" variant="primary" loading={bidLoading} icon="send">Отправить заявку</Button>
                            </form>
                          </div>
                        )}

                        {myBid && myBid.status === 'pending' && (
                          <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(251,191,36,0.3)', borderRadius: 14, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-clock" style={{ fontSize: 18, color: '#FBBF24' }} />
                              </div>
                              <div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Заявка на рассмотрении</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Заказчик ещё не принял решение</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 20, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)' }}>
                              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Ваша ставка</div><div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--accent)' }}>${Number(myBid.price).toLocaleString()}</div></div>
                              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Подана</div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(myBid.created_at).toLocaleDateString('ru-RU')}</div></div>
                            </div>
                          </div>
                        )}

                        {myBid && myBid.status === 'rejected' && (
                          <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(248,113,113,0.22)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="ti ti-x" style={{ fontSize: 18, color: '#F87171' }} />
                            </div>
                            <div>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Заявка отклонена</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Заказчик выбрал другого исполнителя</div>
                            </div>
                          </div>
                        )}

                        {isAssignedFreelancer && ['in_progress', 'delivered', 'completed'].includes(project.status) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 18px', borderRadius: 12, background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.2)' }}>
                            <i className="ti ti-rocket" style={{ fontSize: 20, color: 'var(--accent)' }} />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Вы исполнитель этого проекта</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {project.status === 'in_progress' && 'Форма сдачи работы — выше на этой странице'}
                                {project.status === 'delivered' && 'Работа сдана — ожидайте подтверждения'}
                                {project.status === 'completed' && 'Проект завершён — деньги выплачены'}
                              </div>
                            </div>
                          </div>
                        )}

                        {!canBid && !myBid && project.status !== 'open' && (
                          <div style={{ textAlign: 'center', padding: '52px 0', color: 'var(--text-muted)' }}>
                            <i className="ti ti-lock" style={{ fontSize: 34, display: 'block', marginBottom: 10, opacity: 0.22 }} />
                            <div style={{ fontSize: 14 }}>Приём заявок закрыт</div>
                          </div>
                        )}
                      </>
                    )}

                    {isOwner && (
                      <>
                        {bids.length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                                Заявки <span style={{ color: 'var(--accent)' }}>({bids.length})</span>
                              </h3>
                              {bids.length >= 2 && (
                                <button onClick={async () => {
                                  setAiRankLoading(true); setAiRank(null); setAiRankedOrder(null); setShowAllBids(false)
                                  try {
                                    // Fetch real profiles for all bidders in parallel
                                    const profileResults = await Promise.allSettled(
                                      bids.map(b => profilesApi.get(b.freelancer_id).catch(() => null))
                                    )
                                    const profiles = profileResults.map(r => r.status === 'fulfilled' ? r.value?.data : null)

                                    const bidsSummary = bids.map((b, i) => {
                                      const p = profiles[i]
                                      const skills = p?.skills?.map(s => s.name).join(', ') || 'не указаны'
                                      return `Bid #${i}: ${b.freelancer_name || 'Freelancer'} | Rating: ${p?.rating ?? b.rating ?? 'N/A'}/5 | Completed: ${p?.completed_count ?? '?'} projects | Rate: $${p?.hourly_rate ?? '?'}/hr | Skills: ${skills}\nProposal: ${b.cover_letter || '(no letter)'}`
                                    }).join('\n\n')

                                    const budget = `$${project.budget_min}–$${project.budget_max}`
                                    const { data } = await aiApi.rankBids(project.title, budget, project.description?.slice(0, 300) || '', bidsSummary)
                                    const text = data.text || ''
                                    const jsonMatch = text.match(/\{[\s\S]*\}/)
                                    if (jsonMatch) {
                                      const parsed = JSON.parse(jsonMatch[0])
                                      setAiRankedOrder({ order: parsed.order, reasons: parsed.reasons || {} })
                                    } else {
                                      setAiRank(text)
                                    }
                                  } catch (err) {
                                    setAiRank('Не удалось проанализировать заявки. Попробуйте ещё раз.')
                                  } finally { setAiRankLoading(false) }
                                }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: '0.5px solid rgba(127,119,221,0.35)', background: aiRankedOrder ? 'rgba(127,119,221,0.15)' : 'rgba(127,119,221,0.08)', color: 'var(--accent)', cursor: aiRankLoading ? 'not-allowed' : 'pointer' }}
                                  disabled={aiRankLoading}>
                                  {aiRankLoading ? <i className="ti ti-loader-2" style={{ fontSize: 12, animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-sparkles" style={{ fontSize: 12 }} />}
                                  {aiRankLoading ? 'Анализирую профили...' : aiRankedOrder ? '✨ ТОП-3 готов' : '✨ AI Rank'}
                                </button>
                              )}
                            </div>

                            {/* AI fallback text */}
                            {aiRank && !aiRankedOrder && (
                              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 11, background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.22)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}><i className="ti ti-sparkles" />AI Анализ</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiRank}</div>
                                <button onClick={() => setAiRank(null)} style={{ marginTop: 7, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Закрыть</button>
                              </div>
                            )}

                            {/* AI TOP-3 ranked list */}
                            {aiRankedOrder ? (() => {
                              const MEDALS = ['🥇', '🥈', '🥉']
                              const rankedBids = aiRankedOrder.order.map(idx => bids[idx]).filter(Boolean)
                              const top3 = rankedBids.slice(0, 3)
                              const rest = rankedBids.slice(3)
                              return (
                                <div>
                                  <div style={{ marginBottom: 12, padding: '8px 13px', borderRadius: 9, background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--accent)' }}>
                                    <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                                    AI отобрал лучших кандидатов на основе реальных профилей
                                    <button onClick={() => { setAiRankedOrder(null); setAiRank(null); setShowAllBids(false) }} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Сбросить</button>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {top3.map((bid, rankIdx) => {
                                      const originalIdx = aiRankedOrder.order[rankIdx]
                                      const reason = aiRankedOrder.reasons?.[String(originalIdx)]
                                      return (
                                        <div key={bid.id}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: 18 }}>{MEDALS[rankIdx]}</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: rankIdx === 0 ? '#EF9F27' : rankIdx === 1 ? '#9CA3AF' : '#CD7F32' }}>
                                              {rankIdx === 0 ? 'Лучший кандидат' : rankIdx === 1 ? 'Второй' : 'Третий'}
                                            </span>
                                            {reason && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>— {reason}</span>}
                                          </div>
                                          <BidCard bid={bid} isOwner={isOwner} onAccepted={load} />
                                        </div>
                                      )
                                    })}
                                  </div>
                                  {rest.length > 0 && (
                                    <div style={{ marginTop: 14 }}>
                                      {!showAllBids ? (
                                        <button onClick={() => setShowAllBids(true)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                          <i className="ti ti-chevron-down" style={{ fontSize: 14 }} />
                                          Показать остальных ({rest.length})
                                        </button>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>Остальные кандидаты</div>
                                          {rest.map(bid => <BidCard key={bid.id} bid={bid} isOwner={isOwner} onAccepted={load} />)}
                                          <button onClick={() => setShowAllBids(false)} style={{ width: '100%', padding: '8px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                                            Свернуть
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })() : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {bids.map(bid => <BidCard key={bid.id} bid={bid} isOwner={isOwner} onAccepted={load} />)}
                              </div>
                            )}
                          </div>
                        )}
                        {bids.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '52px 0' }}>
                            <i className="ti ti-inbox" style={{ fontSize: 44, color: 'var(--text-muted)', display: 'block', marginBottom: 12, opacity: 0.22 }} />
                            <div style={{ fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>
                              {project.status === 'open' ? 'Пока нет заявок' : 'Заявки не поступали'}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{project.status === 'open' && 'Поделитесь ссылкой на проект'}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── ЧАТ TAB ── */}
                {activeTab === 'chat' && (
                  <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 18, padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <i className="ti ti-messages" style={{ fontSize: 26, color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Чат с {isOwner ? 'фрилансером' : 'заказчиком'}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.6 }}>
                      Общайтесь, обменивайтесь файлами и уточняйте детали проекта
                    </p>
                    <Link to={`/chats?project=${id}`} style={{ textDecoration: 'none' }}>
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 11, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <i className="ti ti-messages" style={{ fontSize: 16 }} />
                        Открыть чат
                      </button>
                    </Link>
                  </div>
                )}

                {/* ── ФАЙЛЫ TAB ── */}
                {activeTab === 'files' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {canUploadFile && (
                      <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.2)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Загрузить файл</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Изображения, PDF, ZIP, видео — до 50 MB</div>
                        </div>
                        <input ref={fileUploadRef} type="file" hidden onChange={handleFileUpload} />
                        <Button variant="outline" icon={fileUploading ? 'loader-2' : 'upload'} loading={fileUploading} onClick={() => fileUploadRef.current?.click()} style={{ flexShrink: 0 }}>
                          {fileUploading ? 'Загружаю...' : 'Выбрать файл'}
                        </Button>
                      </div>
                    )}
                    {projectFiles.length > 0 ? (
                      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Файлы проекта</h3>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{projectFiles.length} файл{projectFiles.length !== 1 ? 'ов' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {projectFiles.map(f => (
                            <a key={f.id} href={`/api/media/${f.stored_name}`} target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'border-color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(127,119,221,0.4)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                              <i className={`ti ti-${getFileIcon(f.file_type)}`} style={{ fontSize: 17, color: 'var(--accent)', flexShrink: 0 }} />
                              <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                              <i className="ti ti-download" style={{ fontSize: 13, opacity: 0.35, flexShrink: 0 }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <i className="ti ti-files-off" style={{ fontSize: 44, color: 'var(--text-muted)', display: 'block', marginBottom: 12, opacity: 0.22 }} />
                        <div style={{ fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>Файлов нет</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{canUploadFile ? 'Загрузите первый файл кнопкой выше' : 'Файлы появятся после запуска проекта'}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 90 }}>

              {/* 1. Кнопка чата — только если есть доступ */}
              {hasChatAccess && (
                <Link to={`/chats?project=${id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    borderRadius: 16, cursor: 'pointer',
                    background: isDark ? 'rgba(127,119,221,0.15)' : 'rgba(59,91,219,0.1)',
                    border: '0.5px solid rgba(127,119,221,0.35)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.24)' : 'rgba(59,91,219,0.16)'; e.currentTarget.style.borderColor = 'rgba(127,119,221,0.6)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.15)' : 'rgba(59,91,219,0.1)'; e.currentTarget.style.borderColor = 'rgba(127,119,221,0.35)' }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-messages" style={{ fontSize: 19, color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Открыть чат</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        с {isOwner ? 'фрилансером' : 'заказчиком'}
                      </div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 15, color: 'var(--accent)', opacity: 0.7 }} />
                  </div>
                </Link>
              )}

              {/* 2. Участники */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  Участники
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Заказчик */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Заказчик</div>
                    <Link to={`/client/${project.client_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '6px 8px', borderRadius: 9, margin: '-6px -8px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(59,91,219,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar src={clientData?.avatar_url} name={clientData?.full_name || 'Client'} size={36} />
                        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', border: '1.5px solid var(--bg-card)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData?.full_name || '...'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Заказчик</div>
                      </div>
                    </Link>
                  </div>
                  {/* Исполнитель */}
                  {assignedUser && ['in_progress', 'delivered', 'completed'].includes(project.status) && (
                    <>
                      <div style={{ height: '0.5px', background: 'var(--border)' }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Исполнитель</div>
                        <Link to={`/profile/${project.assigned_freelancer_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '6px 8px', borderRadius: 9, margin: '-6px -8px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.07)' : 'rgba(59,91,219,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar src={assignedUser.avatar_url} name={assignedUser.full_name} size={36} />
                            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', border: '1.5px solid var(--bg-card)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignedUser.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1 }}>Фрилансер</div>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Баланс кошелька (только для заказчика) */}
              {isOwner && wallet && (
                <div style={{ background: isDark ? 'rgba(29,158,117,0.08)' : 'rgba(29,158,117,0.05)', border: '0.5px solid rgba(29,158,117,0.25)', borderRadius: 13, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-wallet" style={{ fontSize: 14, color: 'var(--accent-green)' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ваш баланс</span>
                  </div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>${Number(wallet.balance).toLocaleString()}</span>
                </div>
              )}

              {/* 4. Контракт */}
              {contract && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.18)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="ti ti-file-text" style={{ fontSize: 12, color: 'var(--accent)' }} />Контракт
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: CONTRACT_STATUS_COLOR[contract.status], background: `${CONTRACT_STATUS_COLOR[contract.status]}18`, padding: '2px 7px', borderRadius: 5 }}>{CONTRACT_STATUS_LABEL[contract.status]}</span>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Сумма</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--accent-green)', letterSpacing: '-0.5px' }}>${Number(contract.amount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Начат</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(contract.started_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {contract.deadline && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Дедлайн</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(contract.deadline).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Редактировать проект */}
              {isOwner && project.status === 'open' && (
                <Link to={`/projects/${id}/edit`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" icon="edit" style={{ width: '100%' }}>Редактировать проект</Button>
                </Link>
              )}

              {/* 6. Открыть спор */}
              {canDispute && !showDisputeConfirm && (
                <button onClick={() => setShowDisputeConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 11, fontSize: 13, fontWeight: 500, background: 'rgba(248,113,113,0.05)', border: '0.5px solid rgba(248,113,113,0.22)', color: '#F87171', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.22)' }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />Открыть спор
                </button>
              )}

              {canDispute && showDisputeConfirm && (
                <div style={{ background: 'rgba(248,113,113,0.05)', border: '0.5px solid rgba(248,113,113,0.28)', borderRadius: 13, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F87171', marginBottom: 5 }}><i className="ti ti-alert-triangle" style={{ marginRight: 5 }} />Подтвердить спор?</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Средства заморозятся. Администратор рассмотрит заявку.</p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={handleDispute} disabled={disputeLoading} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(248,113,113,0.14)', border: '0.5px solid rgba(248,113,113,0.38)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {disputeLoading && <i className="ti ti-loader-2" style={{ fontSize: 11, animation: 'spin 0.8s linear infinite' }} />}Да, открыть
                    </button>
                    <button onClick={() => setShowDisputeConfirm(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Отмена</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <Footer />
      {project && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={project.client_id}
          projectId={project.id}
          targetName={`проект "${project.title}"`}
        />
      )}
    </div>
  )
}
