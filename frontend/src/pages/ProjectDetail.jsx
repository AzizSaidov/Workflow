import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useToastStore from '../store/toastStore'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { bidsApi } from '../api/bids'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Tag from '../components/Tag'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import BidCard from '../components/BidCard'
import ChatWidget from '../components/ChatWidget'
import Input from '../components/Input'
import AITextarea from '../components/AITextarea'
import { aiApi } from '../api/ai'

const TYPE_LABEL = { fixed: 'Фиксированная цена', hourly: 'Почасовая' }
const LEVEL_LABEL = { entry: 'Начинающий', intermediate: 'Средний', expert: 'Эксперт' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [bidForm, setBidForm] = useState({ price: '', cover_letter: '' })
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSent, setBidSent] = useState(false)
  const [aiRank, setAiRank] = useState(null)
  const [aiRankLoading, setAiRankLoading] = useState(false)
  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    Promise.all([
      projectsApi.getOne(id),
      bidsApi.getForProject(id).catch(() => ({ data: [] })),
    ]).then(([p, b]) => {
      setProject(p.data)
      setBids(b.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const isOwner = user?.id === project?.client_id
  const isFreelancer = user?.role === 'freelancer'
  const canBid = isFreelancer && project?.status === 'open' && !isOwner
  const alreadyBid = bids.some(b => b.freelancer_id === user?.id)

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

            {/* Main content */}
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

                {/* Meta tags */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                  {project.project_type && <Tag color="purple">{TYPE_LABEL[project.project_type]}</Tag>}
                  {project.experience_level && <Tag color="amber">{LEVEL_LABEL[project.experience_level]}</Tag>}
                  {project.category && <Tag color="green">{project.category}</Tag>}
                  {project.duration && <Tag color="muted">{project.duration}</Tag>}
                </div>
              </div>

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
                      Bids <span style={{ color: 'var(--accent)' }}>({bids.length})</span>
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
                          border: '0.5px solid rgba(127,119,221,0.35)',
                          background: 'rgba(127,119,221,0.08)',
                          color: 'var(--accent)', cursor: aiRankLoading ? 'not-allowed' : 'pointer',
                        }}
                        disabled={aiRankLoading}
                      >
                        {aiRankLoading
                          ? <i className="ti ti-loader-2" style={{ fontSize: 13, animation: 'spin 0.8s linear infinite' }} />
                          : <i className="ti ti-sparkles" style={{ fontSize: 13 }} />}
                        {aiRankLoading ? 'Analysing...' : '✨ AI Rank Bids'}
                      </button>
                    )}
                  </div>

                  {/* AI ranking result */}
                  {aiRank && (
                    <div style={{
                      marginBottom: 16, padding: '14px 16px', borderRadius: 12,
                      background: 'rgba(127,119,221,0.06)',
                      border: '0.5px solid rgba(127,119,221,0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                        AI Analysis
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {aiRank}
                      </div>
                      <button onClick={() => setAiRank(null)} style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Dismiss
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

              {/* Chat — shown when project is in_progress */}
              {['in_progress', 'delivered'].includes(project.status) && (
                <ChatWidget projectId={id} />
              )}

              {isOwner && bids.length === 0 && project.status === 'open' && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <i className="ti ti-inbox" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>Пока нет заявок</div>
                </div>
              )}
            </div>

            {/* Sidebar */}
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

              {/* Client info */}
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Заказчик</div>
                <Link to={`/profile/${project.client_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Avatar name="Заказчик" size={40} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Посмотреть профиль</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <i className="ti ti-arrow-right" style={{ fontSize: 11 }} /> Открыть
                    </div>
                  </div>
                </Link>
              </div>

              {/* Actions for owner */}
              {isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {project.status === 'delivered' && (
                    <Button variant="green" icon="check" onClick={async () => { await projectsApi.acceptDelivery(id); load() }}>
                      Принять работу
                    </Button>
                  )}
                  <Link to={`/projects/${id}/edit`}>
                    <Button variant="outline" icon="edit" style={{ width: '100%' }}>Редактировать</Button>
                  </Link>
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
