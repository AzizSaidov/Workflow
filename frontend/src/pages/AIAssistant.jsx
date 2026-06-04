import { useState, useEffect, useRef } from 'react'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { aiApi } from '../api/ai'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'

const MODES = [
  { key: 'chat',    icon: 'message-chatbot', label: 'Чат',    desc: 'Ответы на вопросы о платформе' },
  { key: 'project', icon: 'file-plus',       label: 'Проект', desc: 'Генерация описания проекта'    },
  { key: 'bid',     icon: 'send',             label: 'Заявка', desc: 'Cover letter для заявки'       },
]

const QUICK_PROMPTS = [
  { icon: 'help-circle',      text: 'Как подать заявку на проект?' },
  { icon: 'lock',             text: 'Что такое эскроу и как он работает?' },
  { icon: 'wallet',           text: 'Как пополнить кошелёк и запустить проект?' },
  { icon: 'package-export',   text: 'Как сдать работу заказчику?' },
  { icon: 'star',             text: 'Как повысить рейтинг на платформе?' },
  { icon: 'alert-triangle',   text: 'Как открыть спор с фрилансером?' },
  { icon: 'user-check',       text: 'Как заполнить профиль фрилансера?' },
  { icon: 'file-description', text: 'Как написать хороший cover letter?' },
]

function parseBold(text) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, j) =>
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
    } else if (/^###\s/.test(line)) {
      result.push(<div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginTop: 10, marginBottom: 3 }}>{parseBold(line.slice(4))}</div>)
    } else if (/^##?\s/.test(line)) {
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

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 7 }}>
      {children}
    </label>
  )
}

export default function AIAssistant() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const [mode, setMode] = useState('chat')

  const greeting = user?.role === 'client'
    ? 'Привет! Я AI-помощник **Workflow**.\n\nПомогу тебе:\n- Сформулировать описание проекта\n- Разобраться как работает эскроу\n- Выбрать фрилансера\n- Ответить на любой вопрос о платформе\n\nСпрашивай!'
    : 'Привет! Я AI-помощник **Workflow**.\n\nПомогу тебе:\n- Написать убедительный cover letter для заявки\n- Разобраться как работает платформа\n- Советы по оформлению профиля\n- Ответить на любой вопрос\n\nСпрашивай!'

  const [messages, setMessages] = useState([{ role: 'assistant', text: greeting }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: '', budget: '' })
  const [projectResult, setProjectResult] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)

  const [bidForm, setBidForm] = useState({ projectTitle: '', projectDescription: '', skills: '' })
  const [bidResult, setBidResult] = useState('')
  const [bidLoading, setBidLoading] = useState(false)

  const [copied, setCopied] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const sendMessage = async (text) => {
    const msg = (text || chatInput).trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setMessages(prev => {
      const history = prev.map(m => ({ role: m.role, content: m.text }))
      const next = [...prev, { role: 'user', text: msg }]
      setChatLoading(true)
      aiApi.chat(msg, history)
        .then(({ data }) => setMessages(m => [...m, { role: 'assistant', text: data.text }]))
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
      <div className="glow-blob glow-1" style={{ opacity: 0.25 }} />
      <Navbar />

      <div style={{
        paddingTop: 64,
        position: 'relative', zIndex: 2,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '268px 1fr',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderTop: '0.5px solid var(--border)',
        }}>

          {/* ══════════ SIDEBAR ══════════ */}
          <aside style={{
            borderRight: '0.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: isDark ? 'rgba(13,13,24,0.6)' : 'rgba(240,245,255,0.7)',
          }}>

            {/* Branding */}
            <div style={{ padding: '20px 20px 18px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(127,119,221,0.25) 0%, rgba(93,202,165,0.15) 100%)',
                  border: '0.5px solid rgba(127,119,221,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(127,119,221,0.1)',
                }}>
                  <i className="ti ti-robot" style={{ fontSize: 21, color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Workflow <span style={{ color: 'var(--accent)' }}>AI</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 6px rgba(29,158,117,0.5)' }} />
                    Llama 3.3 · 70B · Groq
                  </div>
                </div>
              </div>
            </div>

            {/* Mode tabs */}
            <div style={{ padding: '14px 12px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9, padding: '0 6px', marginBottom: 8 }}>
                Режим
              </div>
              {MODES.map(m => {
                const active = mode === m.key
                return (
                  <button key={m.key} onClick={() => setMode(m.key)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 10, marginBottom: 3,
                    border: active ? '0.5px solid rgba(127,119,221,0.35)' : '0.5px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                    background: active
                      ? isDark ? 'rgba(127,119,221,0.12)' : 'rgba(59,91,219,0.07)'
                      : 'transparent',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: active ? 'rgba(127,119,221,0.18)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}>
                      <i className={`ti ti-${m.icon}`} style={{ fontSize: 16, color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? 'var(--accent)' : 'var(--text-secondary)', lineHeight: 1.2 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Quick prompts — chat only */}
            {mode === 'chat' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9, padding: '0 6px', marginBottom: 10 }}>
                  Быстрые вопросы
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p.text)} disabled={chatLoading}
                      style={{
                        textAlign: 'left', padding: '7px 10px', borderRadius: 9, fontSize: 11.5,
                        border: '0.5px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: chatLoading ? 'not-allowed' : 'pointer',
                        lineHeight: 1.45, transition: 'all 0.15s',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}
                      onMouseEnter={e => { if (!chatLoading) { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.3)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(127,119,221,0.04)' } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <i className={`ti ti-${p.icon}`} style={{ fontSize: 12, flexShrink: 0, marginTop: 1, color: 'var(--accent)', opacity: 0.65 }} />
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info for forms */}
            {mode !== 'chat' && (
              <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {mode === 'project'
                    ? 'AI сгенерирует профессиональное техническое задание на основе ваших данных. Заполните форму и нажмите «Сгенерировать».'
                    : 'AI напишет убедительный cover letter, который выделит вас среди других кандидатов. Заполните поля и нажмите «Написать заявку».'}
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(127,119,221,0.07)', border: '0.5px solid rgba(127,119,221,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>
                    <i className="ti ti-bulb" style={{ fontSize: 12, marginRight: 5 }} />Совет
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {mode === 'project'
                      ? 'Чем подробнее вы опишете что нужно сделать — тем точнее будет результат.'
                      : 'Укажите конкретный опыт и навыки — AI подчеркнёт их в заявке.'}
                  </div>
                </div>
              </div>
            )}

            {/* Clear chat button */}
            {mode === 'chat' && messages.length > 1 && (
              <div style={{ padding: '12px 16px 18px', flexShrink: 0 }}>
                <button onClick={clearChat} style={{
                  width: '100%', padding: '8px 0', borderRadius: 9, fontSize: 12,
                  border: '0.5px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'; e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 13 }} /> Очистить чат
                </button>
              </div>
            )}
          </aside>

          {/* ══════════ CONTENT ══════════ */}
          <main style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>

            {/* ── CHAT MODE ── */}
            {mode === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px 16px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, marginBottom: 20,
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
                        maxWidth: '74%',
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
                        lineHeight: 1.6,
                      }}>
                        {msg.role === 'user' ? msg.text : formatMessage(msg.text)}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(127,119,221,0.22), rgba(93,202,165,0.12))', border: '0.5px solid rgba(127,119,221,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-robot" style={{ fontSize: 17, color: 'var(--accent)' }} />
                      </div>
                      <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '0.5px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0, 1, 2].map(n => (
                          <span key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'bounce 1s ease infinite', animationDelay: `${n * 0.15}s`, opacity: 0.7 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 40px 20px', flexShrink: 0 }}>
                  <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      ref={inputRef}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Спроси что угодно о платформе..."
                      disabled={chatLoading}
                      className="input"
                      style={{ flex: 1, margin: 0, height: 46 }}
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} style={{
                      width: 46, height: 46, borderRadius: 12, border: 'none', flexShrink: 0,
                      background: chatInput.trim() && !chatLoading ? 'var(--accent)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                      color: chatInput.trim() && !chatLoading ? '#fff' : 'var(--text-muted)',
                      cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      <i className="ti ti-send" style={{ fontSize: 18 }} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── PROJECT / BID MODE ── */}
            {(mode === 'project' || mode === 'bid') && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                    {mode === 'project' ? 'Создать описание проекта' : 'Написать заявку'}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {mode === 'project'
                      ? 'AI напишет профессиональное техническое задание на основе ваших данных'
                      : 'AI напишет убедительный cover letter который выделит вас среди других кандидатов'}
                  </p>
                </div>

                {/* Split layout — always 50/50 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 420 }}>

                  {/* ── Form card ── */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 18,
                    padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ti-${mode === 'project' ? 'file-plus' : 'send'}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {mode === 'project' ? 'Параметры проекта' : 'Данные для заявки'}
                      </span>
                    </div>

                    {mode === 'project' && (
                      <>
                        <div>
                          <FieldLabel>Название проекта *</FieldLabel>
                          <input
                            className="input" placeholder="Разработка сайта для интернет-магазина"
                            value={projectForm.title}
                            onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                            style={{ margin: 0 }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Что нужно сделать</FieldLabel>
                          <textarea
                            value={projectForm.description}
                            onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Нужен интернет-магазин с корзиной, оплатой и каталогом..."
                            rows={4} className="input" style={{ resize: 'vertical', lineHeight: 1.6 }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <FieldLabel>Категория</FieldLabel>
                            <input className="input" placeholder="Веб-разработка" value={projectForm.category} onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))} style={{ margin: 0 }} />
                          </div>
                          <div>
                            <FieldLabel>Бюджет</FieldLabel>
                            <input className="input" placeholder="$500 – $2000" value={projectForm.budget} onChange={e => setProjectForm(f => ({ ...f, budget: e.target.value }))} style={{ margin: 0 }} />
                          </div>
                        </div>
                        <button
                          onClick={generateProject}
                          disabled={!projectForm.title.trim() || projectLoading}
                          style={{
                            marginTop: 'auto', padding: '12px 0', borderRadius: 12, border: 'none',
                            background: projectForm.title.trim() && !projectLoading ? 'var(--accent)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                            color: projectForm.title.trim() && !projectLoading ? '#fff' : 'var(--text-muted)',
                            fontSize: 14, fontWeight: 600, cursor: projectForm.title.trim() && !projectLoading ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s',
                          }}
                        >
                          {projectLoading
                            ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }} /> Генерирую...</>
                            : <><i className="ti ti-sparkles" style={{ fontSize: 16 }} /> Сгенерировать описание</>
                          }
                        </button>
                      </>
                    )}

                    {mode === 'bid' && (
                      <>
                        <div>
                          <FieldLabel>Название проекта *</FieldLabel>
                          <input
                            className="input" placeholder="Разработка мобильного приложения на Flutter"
                            value={bidForm.projectTitle}
                            onChange={e => setBidForm(f => ({ ...f, projectTitle: e.target.value }))}
                            style={{ margin: 0 }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Описание проекта</FieldLabel>
                          <textarea
                            value={bidForm.projectDescription}
                            onChange={e => setBidForm(f => ({ ...f, projectDescription: e.target.value }))}
                            placeholder="Вставь описание из объявления заказчика..."
                            rows={4} className="input" style={{ resize: 'vertical', lineHeight: 1.6 }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Мои навыки / опыт</FieldLabel>
                          <input
                            className="input" placeholder="Flutter, Dart, Firebase — 4 года, 30+ приложений"
                            value={bidForm.skills}
                            onChange={e => setBidForm(f => ({ ...f, skills: e.target.value }))}
                            style={{ margin: 0 }}
                          />
                        </div>
                        <button
                          onClick={generateBid}
                          disabled={!bidForm.projectTitle.trim() || bidLoading}
                          style={{
                            marginTop: 'auto', padding: '12px 0', borderRadius: 12, border: 'none',
                            background: bidForm.projectTitle.trim() && !bidLoading ? 'var(--accent)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                            color: bidForm.projectTitle.trim() && !bidLoading ? '#fff' : 'var(--text-muted)',
                            fontSize: 14, fontWeight: 600, cursor: bidForm.projectTitle.trim() && !bidLoading ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s',
                          }}
                        >
                          {bidLoading
                            ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }} /> Пишу заявку...</>
                            : <><i className="ti ti-sparkles" style={{ fontSize: 16 }} /> Написать заявку</>
                          }
                        </button>
                      </>
                    )}
                  </div>

                  {/* ── Result card ── */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: `0.5px solid ${(mode === 'project' ? projectResult : bidResult) ? 'rgba(127,119,221,0.35)' : 'var(--border)'}`,
                    borderRadius: 18,
                    padding: 24,
                    display: 'flex', flexDirection: 'column',
                    transition: 'border-color 0.3s',
                  }}>

                    {/* Loading state */}
                    {(mode === 'project' ? projectLoading : bidLoading) && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: 16,
                          background: 'linear-gradient(135deg, rgba(127,119,221,0.2), rgba(93,202,165,0.1))',
                          border: '0.5px solid rgba(127,119,221,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ti ti-loader-2" style={{ fontSize: 26, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            {mode === 'project' ? 'Генерирую описание...' : 'Пишу заявку...'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>обычно 3–5 секунд</div>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[0, 1, 2].map(n => (
                            <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'bounce 1s ease infinite', animationDelay: `${n * 0.15}s`, opacity: 0.6 }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!(mode === 'project' ? projectLoading || projectResult : bidLoading || bidResult) && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                        <div style={{
                          width: 64, height: 64, borderRadius: 18,
                          background: 'linear-gradient(135deg, rgba(127,119,221,0.1), rgba(93,202,165,0.07))',
                          border: '0.5px solid rgba(127,119,221,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ti ti-sparkles" style={{ fontSize: 28, color: 'var(--accent)', opacity: 0.5 }} />
                        </div>
                        <div style={{ textAlign: 'center', maxWidth: 220 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Результат появится здесь
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Заполните форму слева и нажмите кнопку генерации
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result content */}
                    {(mode === 'project' ? projectResult && !projectLoading : bidResult && !bidLoading) && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ti ti-sparkles" style={{ fontSize: 14, color: 'var(--accent)' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {mode === 'project' ? 'Готовое описание' : 'Готовая заявка'}
                            </span>
                          </div>
                          <button
                            onClick={() => copyText(mode === 'project' ? projectResult : bidResult, mode)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: copied === mode ? 'rgba(29,158,117,0.1)' : 'none',
                              border: `0.5px solid ${copied === mode ? 'rgba(29,158,117,0.3)' : 'var(--border)'}`,
                              borderRadius: 8, padding: '5px 12px', fontSize: 12,
                              color: copied === mode ? 'var(--accent-green)' : 'var(--text-muted)',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                          >
                            <i className={`ti ti-${copied === mode ? 'check' : 'copy'}`} style={{ fontSize: 12 }} />
                            {copied === mode ? 'Скопировано!' : 'Копировать'}
                          </button>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.75, overflowY: 'auto', flex: 1 }}>
                          {formatMessage(mode === 'project' ? projectResult : bidResult)}
                        </div>
                        <button
                          onClick={() => mode === 'project' ? setProjectResult('') : setBidResult('')}
                          style={{
                            marginTop: 16, padding: '8px 0', borderRadius: 9, border: '0.5px solid var(--border)',
                            background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            flexShrink: 0, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.3)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <i className="ti ti-refresh" style={{ fontSize: 13 }} /> Сгенерировать снова
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
