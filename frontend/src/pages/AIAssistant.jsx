import { useState, useEffect, useRef } from 'react'
import useThemeStore from '../store/themeStore'
import { aiApi } from '../api/ai'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import Input from '../components/Input'

const TABS = [
  { key: 'chat', icon: 'message-chatbot', label: 'Помощник' },
  { key: 'project', icon: 'file-plus', label: 'Создать проект' },
  { key: 'bid', icon: 'send', label: 'Написать заявку' },
]

function formatText(text) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return null
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} style={{ margin: '3px 0', lineHeight: 1.65 }}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
      </p>
    )
  }).filter(Boolean)
}

function TypingIndicator({ isDark }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(127,119,221,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ti ti-robot" style={{ fontSize: 16, color: 'var(--accent)' }} />
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: '0.5px solid var(--border)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', display: 'inline-block',
            animation: 'bounce 1s ease infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const { isDark } = useThemeStore()
  const [tab, setTab] = useState('chat')

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Привет! Я AI-помощник платформы Workflow.\n\nПомогу написать заявку на проект, сформулировать описание задачи или разобраться как работает платформа.\n\nСпрашивай!',
  }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: '', budget: '' })
  const [projectResult, setProjectResult] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)

  const [bidForm, setBidForm] = useState({ projectTitle: '', projectDescription: '', skills: '' })
  const [bidResult, setBidResult] = useState('')
  const [bidLoading, setBidLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setChatLoading(true)
    try {
      const { data } = await aiApi.chat(text)
      setMessages(m => [...m, { role: 'assistant', text: data.text }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Извини, произошла ошибка. Попробуй ещё раз.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const generateProject = async () => {
    if (!projectForm.title.trim() || projectLoading) return
    setProjectLoading(true)
    setProjectResult('')
    try {
      const { data } = await aiApi.helpProject(
        projectForm.title,
        projectForm.description,
        projectForm.category,
        projectForm.budget,
      )
      setProjectResult(data.description)
    } catch {} finally {
      setProjectLoading(false)
    }
  }

  const generateBid = async () => {
    if (!bidForm.projectTitle.trim() || bidLoading) return
    setBidLoading(true)
    setBidResult('')
    try {
      const skills = bidForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const { data } = await aiApi.helpBid(bidForm.projectTitle, bidForm.projectDescription, skills)
      setBidResult(data.cover_letter)
    } catch {} finally {
      setBidLoading(false)
    }
  }

  const copyToClipboard = (text) => navigator.clipboard?.writeText(text).catch(() => {})

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 860 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'rgba(127,119,221,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-robot" style={{ fontSize: 24, color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text-primary)' }}>
                AI-ассистент
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Llama 3.3 70B · Groq</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24,
          }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'var(--accent)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                <i className={`ti ti-${t.icon}`} style={{ fontSize: 14 }} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Chat ── */}
          {tab === 'chat' && (
            <div style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 20, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', height: 580,
            }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, marginBottom: 16,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(127,119,221,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="ti ti-robot" style={{ fontSize: 16, color: 'var(--accent)' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '72%',
                      padding: '10px 16px',
                      borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: msg.role === 'user'
                        ? 'var(--accent)'
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: msg.role === 'user' ? 'none' : '0.5px solid var(--border)',
                      fontSize: 14,
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    }}>
                      {formatText(msg.text)}
                    </div>
                  </div>
                ))}
                {chatLoading && <TypingIndicator isDark={isDark} />}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 20px' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Спроси что-нибудь..."
                    disabled={chatLoading}
                    className="input"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
                      background: chatInput.trim() && !chatLoading ? 'var(--accent)' : 'var(--border)',
                      color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    <i className="ti ti-send" style={{ fontSize: 17 }} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Create Project ── */}
          {tab === 'project' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>
                  Данные проекта
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input
                    label="Название проекта"
                    placeholder="Разработка сайта для интернет-магазина"
                    value={projectForm.title}
                    onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Что нужно сделать (кратко)
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Нужен интернет-магазин с корзиной, оплатой и каталогом..."
                      rows={3}
                      className="input"
                      style={{ resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Input
                      label="Категория"
                      placeholder="Веб-разработка"
                      value={projectForm.category}
                      onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))}
                    />
                    <Input
                      label="Бюджет"
                      placeholder="$500 – $2000"
                      value={projectForm.budget}
                      onChange={e => setProjectForm(f => ({ ...f, budget: e.target.value }))}
                    />
                  </div>
                  <Button
                    variant="primary"
                    icon="sparkles"
                    loading={projectLoading}
                    onClick={generateProject}
                    disabled={!projectForm.title.trim()}
                  >
                    Сгенерировать описание
                  </Button>
                </div>
              </div>

              {(projectResult || projectLoading) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <i className="ti ti-sparkles" style={{ fontSize: 14 }} />
                    Готовое описание
                  </div>
                  {projectLoading ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
                      Генерирую описание...
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                        {formatText(projectResult)}
                      </div>
                      <button
                        onClick={() => copyToClipboard(projectResult)}
                        style={{
                          marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                          background: 'none', border: '0.5px solid var(--border)',
                          borderRadius: 8, padding: '6px 14px', fontSize: 12,
                          color: 'var(--text-muted)', cursor: 'pointer',
                        }}
                      >
                        <i className="ti ti-copy" style={{ fontSize: 13 }} /> Скопировать
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Write Bid ── */}
          {tab === 'bid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>
                  Данные для заявки
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input
                    label="Название проекта"
                    placeholder="Разработка мобильного приложения на Flutter"
                    value={bidForm.projectTitle}
                    onChange={e => setBidForm(f => ({ ...f, projectTitle: e.target.value }))}
                  />
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Описание проекта
                    </label>
                    <textarea
                      value={bidForm.projectDescription}
                      onChange={e => setBidForm(f => ({ ...f, projectDescription: e.target.value }))}
                      placeholder="Вставь описание из объявления заказчика..."
                      rows={4}
                      className="input"
                      style={{ resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                  <Input
                    label="Мои навыки / опыт"
                    placeholder="Flutter, Dart, Firebase — 4 года, 30+ приложений"
                    value={bidForm.skills}
                    onChange={e => setBidForm(f => ({ ...f, skills: e.target.value }))}
                  />
                  <Button
                    variant="primary"
                    icon="sparkles"
                    loading={bidLoading}
                    onClick={generateBid}
                    disabled={!bidForm.projectTitle.trim()}
                  >
                    Написать заявку
                  </Button>
                </div>
              </div>

              {(bidResult || bidLoading) && (
                <div style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 18, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <i className="ti ti-sparkles" style={{ fontSize: 14 }} />
                    Готовая заявка
                  </div>
                  {bidLoading ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
                      Пишу заявку...
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                        {formatText(bidResult)}
                      </div>
                      <button
                        onClick={() => copyToClipboard(bidResult)}
                        style={{
                          marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                          background: 'none', border: '0.5px solid var(--border)',
                          borderRadius: 8, padding: '6px 14px', fontSize: 12,
                          color: 'var(--text-muted)', cursor: 'pointer',
                        }}
                      >
                        <i className="ti ti-copy" style={{ fontSize: 13 }} /> Скопировать
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  )
}
