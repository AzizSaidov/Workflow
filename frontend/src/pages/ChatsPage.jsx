import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { chatsApi, createChatWS } from '../api/chats'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'

const STATUS_LABEL = {
  in_progress: { label: 'В работе', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  delivered:   { label: 'Сдан',     color: 'var(--accent)', bg: 'rgba(127,119,221,0.12)' },
  completed:   { label: 'Завершён', color: 'var(--accent-teal)', bg: 'rgba(93,202,165,0.12)' },
}

function mediaKind(fileUrl, fileType) {
  if (!fileUrl) return null
  if (fileType === 'audio') return 'audio'
  if (fileType === 'image') return 'image'
  const ext = (fileUrl.split('.').pop() || '').toLowerCase().split('?')[0]
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image'
  if (['mp3','ogg','webm','wav','m4a'].includes(ext)) return 'audio'
  return 'file'
}

function MessageBubble({ msg, isOwn, isDark, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.content)
  const menuRef = useRef(null)
  const kind = mediaKind(msg.file_url, msg.file_type)
  const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const submitEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== msg.content) onEdit(msg.id, trimmed)
    setEditing(false)
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 6, padding: '0 16px' }}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div style={{ maxWidth: '65%', position: 'relative' }}>
        {/* Three-dot menu for own messages */}
        {isOwn && !editing && (
          <div ref={menuRef} style={{ position: 'absolute', top: 6, left: -28, zIndex: 10 }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', opacity: menuOpen ? 1 : 0, transition: 'opacity 0.15s' }}
              className="msg-menu-btn"
            >
              <i className="ti ti-dots-vertical" style={{ fontSize: 14 }} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 22,
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 10, padding: '4px 0', minWidth: 130,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 20,
              }}>
                {!kind && (
                  <button onClick={() => { setEditing(true); setEditText(msg.content); setMenuOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 14 }} /> Изменить
                  </button>
                )}
                <button onClick={() => { onDelete(msg.id); setMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#F87171' }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 14 }} /> Удалить
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{
          background: isOwn
            ? (isDark ? 'rgba(127,119,221,0.22)' : 'rgba(80,72,213,0.13)')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
          border: `0.5px solid ${isOwn ? 'rgba(127,119,221,0.35)' : 'var(--border)'}`,
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: kind === 'image' ? '6px 6px 4px' : '10px 14px',
        }}>
          {kind === 'image' && (
            <a href={`http://localhost:8000${msg.file_url}`} target="_blank" rel="noopener noreferrer">
              <img src={`http://localhost:8000${msg.file_url}`} alt="img"
                style={{ display: 'block', maxWidth: '100%', maxHeight: 220, borderRadius: 10, objectFit: 'cover', cursor: 'zoom-in' }} />
            </a>
          )}
          {kind === 'audio' && (
            <audio controls style={{ display: 'block', width: '100%', minWidth: 220, height: 36 }}>
              <source src={`http://localhost:8000${msg.file_url}`} />
            </audio>
          )}
          {kind === 'file' && (
            <a href={`http://localhost:8000${msg.file_url}`} download
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}
            >
              <i className="ti ti-file-download" style={{ fontSize: 18, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.file_url.split('/').pop()}</span>
            </a>
          )}

          {editing ? (
            <div style={{ marginTop: kind ? 6 : 0 }}>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() } if (e.key === 'Escape') setEditing(false) }}
                autoFocus
                rows={2}
                className="input"
                style={{ width: '100%', resize: 'none', fontSize: 13, padding: '6px 10px', marginBottom: 6 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={submitEdit} style={{ flex: 1, padding: '5px 0', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Сохранить</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Отмена</button>
              </div>
            </div>
          ) : msg.content ? (
            <p style={{ margin: kind ? '6px 0 0' : 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
              {msg.content}
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
            {msg.edited_at && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>изменено</span>}
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{time}</span>
          </div>
        </div>
      </div>

      <style>{`.msg-menu-btn { opacity: 0 } div:hover > div > .msg-menu-btn { opacity: 1 }`}</style>
    </div>
  )
}

export default function ChatsPage() {
  const { isDark } = useThemeStore()
  const { user, accessToken } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [partner, setPartner] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)

  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const selected = projects.find(p => p.id === selectedId)
  const st = selected ? STATUS_LABEL[selected.status] : null

  // Load projects (excluding hidden)
  useEffect(() => {
    Promise.all([
      projectsApi.getMine().catch(() => ({ data: [] })),
      chatsApi.getHidden().catch(() => ({ data: [] })),
    ]).then(([projRes, hiddenRes]) => {
      const hiddenSet = new Set(hiddenRes.data || [])
      const active = (projRes.data || [])
        .filter(p => ['in_progress', 'delivered', 'completed'].includes(p.status))
        .filter(p => !hiddenSet.has(p.id))
      setProjects(active)
      if (active.length > 0) setSelectedId(active[0].id)
    }).finally(() => setLoading(false))
  }, [user?.id])

  // Load partner info
  useEffect(() => {
    if (!selectedId || !projects.length) return
    const proj = projects.find(p => p.id === selectedId)
    if (!proj) return
    const partnerId = user?.role === 'client' ? proj.assigned_freelancer_id : proj.client_id
    if (!partnerId) { setPartner(null); return }
    client.get(`/users/${partnerId}`).then(r => setPartner(r.data)).catch(() => setPartner(null))
  }, [selectedId, projects, user?.role])

  // WebSocket + history
  useEffect(() => {
    if (!selectedId || !accessToken) return
    setMessages([])
    chatsApi.getHistory(selectedId).then(r => setMessages(r.data || [])).catch(() => {})

    const ws = createChatWS(selectedId, accessToken)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'message_deleted') {
          setMessages(prev => prev.filter(m => String(m.id) !== String(msg.id)))
        } else if (msg.type === 'message_updated') {
          setMessages(prev => prev.map(m => String(m.id) === String(msg.id) ? { ...m, content: msg.content, edited_at: msg.edited_at } : m))
        } else {
          setMessages(prev => [...prev, msg])
        }
      } catch {}
    }
    return () => ws.close()
  }, [selectedId, accessToken])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendWS = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(payload))
  }, [])

  const handleSend = () => {
    const content = text.trim()
    if (!content) return
    sendWS({ content, file_url: null, file_type: null })
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDelete = async (messageId) => {
    await chatsApi.deleteMessage(selectedId, messageId).catch(() => {})
  }

  const handleEdit = async (messageId, content) => {
    await chatsApi.editMessage(selectedId, messageId, content).catch(() => {})
  }

  const handleHideChat = async (projectId) => {
    await chatsApi.hideChat(projectId).catch(() => {})
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (selectedId === projectId) setSelectedId(null)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const { data } = await chatsApi.uploadFile(file)
      const ext = file.name.split('.').pop().toLowerCase()
      const fileType = ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'file'
      sendWS({ content: '', file_url: data.url, file_type: fileType })
    } catch {}
    setUploading(false)
  }

  const handleVoice = async () => {
    if (recording) { recorderRef.current?.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mime })
        if (blob.size < 500) { setRecording(false); return }
        setUploading(true)
        try {
          const ext = mime.includes('webm') ? 'webm' : 'ogg'
          const form = new FormData()
          form.append('file', blob, `voice_${Date.now()}.${ext}`)
          const { data } = await client.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          sendWS({ content: '', file_url: data.url, file_type: 'audio' })
        } catch {}
        setUploading(false)
        setRecording(false)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch { setRecording(false) }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <StarBackground isDark={isDark} intensity="reduced" />
        <div className="glow-blob glow-1" style={{ opacity: 0.2 }} />
      </div>
      <Navbar />

      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', borderTop: '0.5px solid var(--border)' }}>

        {/* SIDEBAR */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(7,7,14,0.92)' : 'rgba(248,247,255,0.92)', backdropFilter: 'blur(16px)' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <i className="ti ti-messages" style={{ fontSize: 18, color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Чаты</span>
              {projects.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(127,119,221,0.14)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{projects.length}</span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '65%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 11, width: '45%' }} />
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <i className="ti ti-message-off" style={{ fontSize: 30, color: 'var(--text-muted)', opacity: 0.25, display: 'block', marginBottom: 10 }} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Нет активных чатов.<br />Чат открывается когда проект в работе.</div>
                <Link to={user?.role === 'client' ? '/projects/new' : '/projects'} style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 12 }}>
                    {user?.role === 'client' ? 'Создать проект' : 'Найти проекты'}
                  </button>
                </Link>
              </div>
            ) : projects.map(p => {
              const isActive = p.id === selectedId
              const s = STATUS_LABEL[p.status]
              return (
                <div key={p.id} style={{ position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}
                >
                  <button
                    onClick={() => setSelectedId(p.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 36px 12px 14px', background: isActive ? (isDark ? 'rgba(127,119,221,0.1)' : 'rgba(80,72,213,0.07)') : 'transparent', border: 'none', borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', display: 'flex', gap: 11, alignItems: 'center', transition: 'all 0.12s' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-message-circle" style={{ fontSize: 18, color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.title}</div>
                      {s && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>}
                    </div>
                  </button>
                  <button
                    className="del-btn"
                    onClick={() => handleHideChat(p.id)}
                    title="Удалить чат"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, opacity: 0, transition: 'opacity 0.15s' }}
                  >
                    <i className="ti ti-x" style={{ fontSize: 14 }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* CHAT WINDOW */}
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <i className="ti ti-message-2" style={{ fontSize: 44, color: 'var(--text-muted)', opacity: 0.18 }} />
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Выберите чат слева</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: isDark ? 'rgba(7,7,14,0.85)' : 'rgba(248,247,255,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
              {partner
                ? <Avatar src={partner.avatar_url} name={partner.full_name} size={36} />
                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-user" style={{ fontSize: 16, color: 'var(--accent)' }} /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{partner?.full_name || (user?.role === 'client' ? 'Фрилансер' : 'Заказчик')}</div>
                <Link to={`/projects/${selected.id}`} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', opacity: 0.8 }}>
                  <i className="ti ti-external-link" style={{ fontSize: 10, marginRight: 4 }} />{selected.title}
                </Link>
              </div>
              {st && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: st.bg, color: st.color, fontWeight: 500, flexShrink: 0 }}>{st.label}</span>}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 14, paddingBottom: 6 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <i className="ti ti-message-circle" style={{ fontSize: 30, display: 'block', marginBottom: 10, opacity: 0.22 }} />Начните переписку
                </div>
              ) : messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={String(msg.sender_id) === String(user?.id)}
                  isDark={isDark}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--border)', background: isDark ? 'rgba(7,7,14,0.85)' : 'rgba(248,247,255,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf,.docx,.txt,.zip,.mp4" onChange={handleFileSelect} />
              {recording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 13px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#F87171' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', animation: 'blink 1s infinite', display: 'inline-block' }} />
                  Запись... нажми <strong style={{ marginLeft: 3 }}>стоп</strong> чтобы отправить
                </div>
              )}
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                <textarea
                  value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Сообщение... (Enter — отправить)" disabled={recording} rows={1}
                  className="input"
                  style={{ flex: 1, resize: 'none', lineHeight: 1.5, minHeight: 40, maxHeight: 110, overflow: 'auto', paddingTop: 9, paddingBottom: 9, fontSize: 14 }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || recording} title="Прикрепить"
                  style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '0.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: uploading ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.13s' }}>
                  {uploading ? <i className="ti ti-loader-2" style={{ fontSize: 17, animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-paperclip" style={{ fontSize: 17 }} />}
                </button>
                <button type="button" onClick={handleVoice} disabled={uploading} title={recording ? 'Стоп' : 'Голосовое'}
                  style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: recording ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), border: `0.5px solid ${recording ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: recording ? '#F87171' : 'var(--text-muted)', transition: 'all 0.13s' }}>
                  <i className={`ti ${recording ? 'ti-player-stop-filled' : 'ti-microphone'}`} style={{ fontSize: 17 }} />
                </button>
                <button type="button" onClick={handleSend} disabled={!text.trim() || recording}
                  style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: text.trim() ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text.trim() ? '#fff' : 'var(--text-muted)', opacity: text.trim() ? 1 : 0.45, transition: 'all 0.13s' }}>
                  <i className="ti ti-send-2" style={{ fontSize: 17 }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
