import { useState, useEffect, useRef } from 'react'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { aiApi } from '../api/ai'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'

const MODES = [
  { key: 'chat',    icon: 'message-chatbot', label: 'Чат-помощник',    desc: 'Путеводитель по платформе' },
  { key: 'project', icon: 'file-plus',       label: 'Создать проект',  desc: 'Генерация описания'        },
  { key: 'bid',     icon: 'send',             label: 'Написать заявку', desc: 'Cover letter для заявки'   },
]

const QUICK_PROMPTS = [
  { icon: 'help-circle',     text: 'Как подать заявку на проект?' },
  { icon: 'lock',            text: 'Что такое эскроу и как он работает?' },
  { icon: 'wallet',          text: 'Как пополнить кошелёк и запустить проект?' },
  { icon: 'package-export',  text: 'Как сдать работу заказчику?' },
  { icon: 'star',            text: 'Как повысить рейтинг на платформе?' },
  { icon: 'alert-triangle',  text: 'Как открыть спор с фрилансером?' },
  { icon: 'user-check',      text: 'Как заполнить профиль фрилансера?' },
  { icon: 'file-description',text: 'Как написать хороший cover letter?' },
]

function parseBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, j) =>
    j % 2 === 1
      ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part}</strong>
      : part
  )
}

function formatMessage(text) {
  const lines = text.split('\n')
  const result = []
  lines.forEach((line, i) => {
    if (!line.trim()) {
      result.push(<div key={i} style={{ height: 5 }} />)
    } else if (line.startsWith('### ')) {
      result.push(<div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginTop: 10, marginBottom: 3 }}>{parseBold(line.slice(4))}</div>)
    } else if (line.startsWith('## ') || line.startsWith('# ')) {
      const lvl = line.startsWith('## ') ? 3 : 4
      result.push(<div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginTop: 12, marginBottom: 5 }}>{parseBold(line.replace(/^#+\s/, ''))}</div>)
    } else if (/^[-•*]\s/.test(line)) {
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>{parseBold(line.replace(/^[-•*]\s/, ''))}</span>
        </div>
      )
    } else if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)/)
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'Syne, sans-serif', flexShrink: 0, minWidth: 20 }}>{m[1]}.</span>
          <span style={{ color: 'var(--text-secondary)' }}>{parseBold(m[2])}</span>
        </div>
      )
    } else {
      result.push(<p key={i} style={{ margin: '0 0 5px', lineHeight: 1.65, color: 'var(--text-secondary)' }}>{parseBold(line)}</p>)
    }
  })
  return result
}

export default function AIAssistant() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [mode, setMode] = useState('chat')

  // Chat
  const greeting = user?.role === 'client'
    ? 'Привет! Я AI-помощник **Workflow**.\n\nПомогу тебе:\n- Сформулировать описание проекта\n- Разобраться как работает эскроу\n- Выбрать фрилансера\n- Ответить на любой вопрос о платформе\n\nСпрашивай!'
    : 'Привет! Я AI-помощник **Workflow**.\n\nПомогу тебе:\n- Написать убедительный cover letter для заявки\n- Разобраться как работает платформа\n- Советы по оформлению профиля\n- Ответить на любой вопрос\n\nСпрашивай!'

  const [messages, setMessages] = useState([{ role: 'assistant', text: greeting }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Project
  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: '', budget: '' })
  const [projectResult, setProjectResult] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)

  // Bid
  const [bidForm, setBidForm] = useState({ projectTitle: '', projectDescription: '', skills: '' })
  const [bidResult, setBidResult] = useState('')
  const [bidLoading, setBidLoading] = useState(false)

  // Copy feedback
  const [copied, setCopied] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const sendMessage = async (text) => {
    const msg = (text || chatInput).trim()
    if (!msg || chatLoading) return
    setChatInput('')

    // snapshot history BEFORE adding new user message
    setMessages(prev => {
      const history = prev.map(m => ({ role: m.role, content: m.text }))
      const next = [...prev, { role: 'user', text: msg }]

      setChatLoading(true)
      aiApi.chat(msg, history)
        .then(({ data }) => {
          setMessages(m => [...m, { role: 'assistant', text: data.text }])
        })
        .catch(err => {
          const detail = err.response?.data?.detail
          setMessages(m => [...m, {
            role: 'assistant',
            text: detail === 'AI service not configured — set GROQ_API_KEY'
              ? 'AI-сервис не настроен. Добавьте GROQ_API_KEY в backend/.env'
              : 'Ошибка соединения с AI. Попробуй ещё раз.',
            isError: true,
          }])
        })
        .finally(() => setChatLoading(false))

      return next
    })
  }

  const generateProject = async () => {
    if (!projectForm.title.trim() || projectLoading) return
    setProjectLoading(true); setProjectResult('')
    try {
      const { data } = await aiApi.helpProject(projectForm.title, projectForm.description, projectForm.category, projectForm.budget)
      setProjectResult(data.description)
    } catch (err) {
      setProjectResult(err.response?.data?.detail === 'AI service not configured — set GROQ_API_KEY'
        ? 'AI-сервис не настроен. Добавьте GROQ_API_KEY в backend/.env'
        : 'Ошибка генерации. Попробуйте ещё раз.')
    } finally { setProjectLoading(false) }
  }

  const generateBid = async () => {
    if (!bidForm.projectTitle.trim() || bidLoading) return
    setBidLoading(true); setBidResult('')
    try {
      const skills = bidForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const { data } = await aiApi.helpBid(bidForm.projectTitle, bidForm.projectDescription, skills)
      setBidResult(data.cover_letter)
    } catch (err) {
      setBidResult(err.response?.data?.detail === 'AI service not configured — set GROQ_API_KEY'
        ? 'AI-сервис не настроен. Добавьте GROQ_API_KEY в backend/.env'
        : 'Ошибка генерации. Попробуйте ещё раз.')
    } finally { setBidLoading(false) }
  }

  const copyText = async (text, key) => {
    await navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const clearChat = () => setMessages([{ role: 'assistant', text: greeting }])

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '252px 1fr',
          flex: 1,
          minHeight: 0,
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
        }}>

          {/* ══════════ SIDEBAR ══════════ */}
          <div style={{
            borderRight: '0.5px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', height: '100%',
          }}>

            {/* Branding */}
            <div style={{ padding: '24px 20px 20px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(127,119,221,0.3) 0%, rgba(93,202,165,0.2) 100%)',
                  border: '0.5px solid rgba(127,119,221,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(127,119,221,0.12)',
                }}>
                  <i className="ti ti-robot" style={{ fontSize: 20, color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Workflow AI</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
                    Llama 3.3 70B · Groq
                  </div>
                </div>
              </div>
            </div>

            {/* Mode switcher */}
            <div style={{ padding: '16px 12px 12px', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9, padding: '0 8px', marginBottom: 8 }}>Режим</div>
              {MODES.map(m => {
                const active = mode === m.key
                return (
                  <button key={m.key} onClick={() => setMode(m.key)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 10, marginBottom: 3,
                    border: active ? '0.5px solid rgba(127,119,221,0.3)' : '0.5px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                    background: active
                      ? isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.07)'
                      : 'transparent',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: active ? 'rgba(127,119,221,0.2)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}>
                      <i className={`ti ti-${m.icon}`} style={{ fontSize: 16, color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--accent)' : 'var(--text-secondary)', lineHeight: 1.2 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Quick prompts — chat mode only */}
            {mode === 'chat' && (
              <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
                <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9, padding: '0 8px', marginBottom: 10 }}>Быстрые вопросы</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {QUICK_PROMPTS.map((p, i) => (
                      <button key={i} onClick={() => sendMessage(p.text)} disabled={chatLoading}
                        style={{
                          textAlign: 'left', padding: '7px 10px', borderRadius: 8, fontSize: 11.5,
                          border: '0.5px solid var(--border)', background: 'transparent',
                          color: 'var(--text-muted)', cursor: chatLoading ? 'not-allowed' : 'pointer',
                          lineHeight: 1.45, transition: 'all 0.15s',
                          display: 'flex', alignItems: 'flex-start', gap: 7,
                        }}
                        onMouseEnter={e => { if (!chatLoading) { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.35)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(127,119,221,0.04)' } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                      >
                        <i className={`ti ti-${p.icon}`} style={{ fontSize: 12, flexShrink: 0, marginTop: 1, color: 'var(--accent)', opacity: 0.7 }} />
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Clear chat */}
            {mode === 'chat' && messages.length > 1 && (
              <div style={{ padding: '12px 20px 20px', flexShrink: 0 }}>
                <button onClick={clearChat} style={{
                  width: '100%', padding: '7px 0', borderRadius: 9, fontSize: 12,
                  border: '0.5px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'; e.currentTarget.style.color = '#F87171' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 13 }} /> Очистить чат
                </button>
              </div>
            )}
          </div>

          {/* ══════════ CONTENT ══════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>

            {/* ── CHAT MODE ── */}
            {mode === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 16px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, marginBottom: 18,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}>
                      {msg.role === 'assistant' && (
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(127,119,221,0.22) 0%, rgba(93,202,165,0.12) 100%)',
                          border: '0.5px solid rgba(127,119,221,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ti ti-robot" style={{ fontSize: 17, color: 'var(--accent)' }} />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '76%',
                        padding: '11px 16px',
                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: msg.role === 'user'
                          ? 'var(--accent)'
                          : msg.isError
                            ? 'rgba(248,113,113,0.07)'
                            : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: msg.role === 'user'
                          ? 'none'
                          : msg.isError
                            ? '0.5px solid rgba(248,113,113,0.3)'
                            : '0.5px solid var(--border)',
                        fontSize: 14,
                        color: msg.role === 'user' ? '#fff' : msg.isError ? '#F87171' : 'var(--text-primary)',
                      }}>
                        {msg.role === 'user' ? msg.text : formatMessage(msg.text)}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(127,119,221,0.22), rgba(93,202,165,0.12))', border: '0.5px solid rgba(127,119,221,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-robot" style={{ fontSize: 17, color: 'var(--accent)' }} />
                      </div>
                      <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '0.5px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0, 1, 2].map(n => <span key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'bounce 1s ease infinite', animationDelay: `${n * 0.15}s` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 36px 20px', flexShrink: 0 }}>
                  <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: 10 }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Спроси что угодно о платформе..."
                      disabled={chatLoading}
                      className="input"
                      style={{ flex: 1, margin: 0, height: 46 }}
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} style={{
                      width: 46, height: 46, borderRadius: 12, border: 'none', flexShrink: 0,
                      background: chatInput.trim() && !chatLoading ? 'var(--accent)' : 'var(--border)',
                      color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}>
                      <i className="ti ti-send" style={{ fontSize: 18 }} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── PROJECT MODE ── */}
            {mode === 'project' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>Создать описание проекта</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI напишет профессиональное техническое задание на основе ваших данных</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: projectResult || projectLoading ? '1fr 1fr' : 'minmax(0, 560px)', gap: 24 }}>
                  {/* Form */}
                  <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input label="Название проекта *" placeholder="Разработка сайта для интернет-магазина" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} />
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Что нужно сделать</label>
                      <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} placeholder="Нужен интернет-магазин с корзиной, оплатой и каталогом..." rows={4} className="input" style={{ resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Категория" placeholder="Веб-разработка" value={projectForm.category} onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))} />
                      <Input label="Бюджет" placeholder="$500 – $2000" value={projectForm.budget} onChange={e => setProjectForm(f => ({ ...f, budget: e.target.value }))} />
                    </div>
                    <Button variant="primary" icon="sparkles" loading={projectLoading} onClick={generateProject} disabled={!projectForm.title.trim()}>
                      Сгенерировать описание
                    </Button>
                  </div>

                  {/* Result or loading */}
                  {projectLoading && !projectResult && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.2)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 200 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-loader-2" style={{ fontSize: 26, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>Генерирую описание...<br /><span style={{ fontSize: 12 }}>обычно 3–5 секунд</span></div>
                    </div>
                  )}

                  {projectResult && !projectLoading && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          <i className="ti ti-sparkles" style={{ fontSize: 14 }} />Готовое описание
                        </div>
                        <button onClick={() => copyText(projectResult, 'project')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied === 'project' ? 'rgba(29,158,117,0.1)' : 'none', border: `0.5px solid ${copied === 'project' ? 'rgba(29,158,117,0.3)' : 'var(--border)'}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: copied === 'project' ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <i className={`ti ti-${copied === 'project' ? 'check' : 'copy'}`} style={{ fontSize: 12 }} />
                          {copied === 'project' ? 'Скопировано!' : 'Копировать'}
                        </button>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.75, overflowY: 'auto', flex: 1 }}>
                        {formatMessage(projectResult)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── BID MODE ── */}
            {mode === 'bid' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>Написать заявку</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI напишет убедительный cover letter который выделит вас среди других кандидатов</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: bidResult || bidLoading ? '1fr 1fr' : 'minmax(0, 560px)', gap: 24 }}>
                  {/* Form */}
                  <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input label="Название проекта *" placeholder="Разработка мобильного приложения на Flutter" value={bidForm.projectTitle} onChange={e => setBidForm(f => ({ ...f, projectTitle: e.target.value }))} />
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Описание проекта</label>
                      <textarea value={bidForm.projectDescription} onChange={e => setBidForm(f => ({ ...f, projectDescription: e.target.value }))} placeholder="Вставь описание из объявления заказчика..." rows={4} className="input" style={{ resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                    <Input label="Мои навыки / опыт" placeholder="Flutter, Dart, Firebase — 4 года, 30+ приложений" value={bidForm.skills} onChange={e => setBidForm(f => ({ ...f, skills: e.target.value }))} />
                    <Button variant="primary" icon="sparkles" loading={bidLoading} onClick={generateBid} disabled={!bidForm.projectTitle.trim()}>
                      Написать заявку
                    </Button>
                  </div>

                  {/* Loading */}
                  {bidLoading && !bidResult && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.2)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 200 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-loader-2" style={{ fontSize: 26, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>Пишу заявку...<br /><span style={{ fontSize: 12 }}>обычно 3–5 секунд</span></div>
                    </div>
                  )}

                  {/* Result */}
                  {bidResult && !bidLoading && (
                    <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          <i className="ti ti-sparkles" style={{ fontSize: 14 }} />Готовая заявка
                        </div>
                        <button onClick={() => copyText(bidResult, 'bid')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied === 'bid' ? 'rgba(29,158,117,0.1)' : 'none', border: `0.5px solid ${copied === 'bid' ? 'rgba(29,158,117,0.3)' : 'var(--border)'}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: copied === 'bid' ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <i className={`ti ti-${copied === 'bid' ? 'check' : 'copy'}`} style={{ fontSize: 12 }} />
                          {copied === 'bid' ? 'Скопировано!' : 'Копировать'}
                        </button>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.75, overflowY: 'auto', flex: 1 }}>
                        {formatMessage(bidResult)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
