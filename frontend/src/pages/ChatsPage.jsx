import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import { chatsApi, createChatWS } from '../api/chats'
import client from '../api/client'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'

const STATUS_LABEL = {
  in_progress: { label: 'В работе',  color: '#FBBF24',             bg: 'rgba(251,191,36,0.12)' },
  delivered:   { label: 'Сдан',      color: 'var(--accent)',        bg: 'rgba(127,119,221,0.12)' },
  completed:   { label: 'Завершён',  color: 'var(--accent-teal)',   bg: 'rgba(93,202,165,0.12)' },
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

function ConfirmModal({ onConfirm, onCancel, isDark }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: isDark ? '#0D0D18' : '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 18, padding: '28px 32px', width: 340,
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <i className="ti ti-trash" style={{ fontSize: 22, color: '#F87171' }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>Удалить переписку?</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Все сообщения будут удалены без возможности восстановления.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Отмена</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '0.5px solid rgba(239,68,68,0.4)', color: '#F87171', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isOwn, isDark, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
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

  if (msg.deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 4, padding: '0 16px' }}>
        <div style={{
          padding: '6px 12px', borderRadius: 12,
          border: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className="ti ti-trash" style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.55 }}>Сообщение удалено</span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 6, padding: '0 16px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
    >
      <div style={{ maxWidth: '65%', position: 'relative' }}>
        {isOwn && !editing && (
          <div ref={menuRef} style={{ position: 'absolute', top: 6, left: -28, zIndex: 10 }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', opacity: (hovered || menuOpen) ? 1 : 0, transition: 'opacity 0.15s' }}
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
            ? (isDark ? 'rgba(127,119,221,0.22)' : 'rgba(59,91,219,0.13)')
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
            <audio key={msg.file_url} controls src={`http://localhost:8000${msg.file_url}`}
              style={{ display: 'block', width: '100%', minWidth: 220, height: 36 }} />
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
                autoFocus rows={2} className="input"
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
    </div>
  )
}

export default function ChatsPage() {
  const { isDark } = useThemeStore()
  const { user, accessToken } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [partners, setPartners] = useState({})
  const [lastMessages, setLastMessages] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const selected = projects.find(p => p.id === selectedId)
  const st = selected ? STATUS_LABEL[selected.status] : null
  const partner = selected ? (partners[selected.id] || null) : null

  useEffect(() => {
    Promise.all([
      projectsApi.getMine().catch(() => ({ data: [] })),
      chatsApi.getHidden().catch(() => ({ data: [] })),
    ]).then(async ([projRes, hiddenRes]) => {
      const hiddenSet = new Set(hiddenRes.data || [])
      const active = (projRes.data || [])
        .filter(p => ['in_progress', 'delivered', 'completed'].includes(p.status))
        .filter(p => !hiddenSet.has(p.id))
      setProjects(active)
      const projectParam = searchParams.get('project')
      const initial = active.find(p => p.id === projectParam) || active[0]
      if (initial) setSelectedId(initial.id)

      const results = await Promise.allSettled(
        active.map(async (proj) => {
          const partnerId = user?.role === 'client' ? proj.assigned_freelancer_id : proj.client_id
          const [partnerRes, histRes] = await Promise.allSettled([
            partnerId ? client.get(`/users/${partnerId}`) : Promise.reject(),
            chatsApi.getHistory(proj.id),
          ])
          return {
            projectId: proj.id,
            partner: partnerRes.status === 'fulfilled' ? partnerRes.value.data : null,
            lastMsg: histRes.status === 'fulfilled' ? (histRes.value.data || []).at(-1) : null,
          }
        })
      )
      const pMap = {}, lMap = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          pMap[r.value.projectId] = r.value.partner
          lMap[r.value.projectId] = r.value.lastMsg
        }
      })
      setPartners(pMap)
      setLastMessages(lMap)
    }).finally(() => setLoading(false))
  }, [user?.id])

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
          setMessages(prev => prev.map(m => String(m.id) === String(msg.id) ? { ...m, deleted: true } : m))
        } else if (msg.type === 'message_updated') {
          setMessages(prev => prev.map(m => String(m.id) === String(msg.id) ? { ...m, content: msg.content, edited_at: msg.edited_at } : m))
        } else {
          setMessages(prev => [...prev, msg])
          setLastMessages(prev => ({ ...prev, [selectedId]: msg }))
        }
      } catch {}
    }
    return () => ws.close()
  }, [selectedId, accessToken])

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

  const handleDeleteMessage = async (messageId) => {
    await chatsApi.deleteMessage(selectedId, messageId).catch(() => {})
  }

  const handleEditMessage = async (messageId, content) => {
    await chatsApi.editMessage(selectedId, messageId, content).catch(() => {})
  }

  const handleDeleteChat = async () => {
    if (!confirmDeleteId) return
    await chatsApi.deleteChat(confirmDeleteId).catch(() => {})
    setProjects(prev => {
      const remaining = prev.filter(p => p.id !== confirmDeleteId)
      if (selectedId === confirmDeleteId) setSelectedId(remaining[0]?.id || null)
      return remaining
    })
    setMessages([])
    setConfirmDeleteId(null)
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
      const mime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus' :
        'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const ext = mime.includes('webm') ? 'webm' : 'ogg'
        const blob = new Blob(chunksRef.current, { type: mime })
        if (blob.size < 500) { setRecording(false); return }
        setUploading(true)
        try {
          const form = new FormData()
          form.append('file', blob, `voice_${Date.now()}.${ext}`)
          const { data } = await client.post('/media/upload', form, { headers: { 'Content-Type': undefined } })
          sendWS({ content: '', file_url: data.url, file_type: 'audio' })
        } catch (err) { console.error('Voice upload failed:', err) }
        setUploading(false)
        setRecording(false)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch { setRecording(false) }
  }

  const lastMsgPreview = (p) => {
    const m = lastMessages[p.id]
    if (!m) return p.title
    if (m.file_type === 'audio') return '🎤 Голосовое'
    if (m.file_type === 'image') return '🖼 Фото'
    if (m.file_url) return '📎 Файл'
    return m.content || ''
  }

  return (
    <>
      {confirmDeleteId && (
        <ConfirmModal
          isDark={isDark}
          onConfirm={handleDeleteChat}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <StarBackground isDark={isDark} intensity="reduced" />
        <div className="glow-blob glow-1" style={{ opacity: 0.2 }} />
      </div>
      <Navbar />

      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', borderTop: '0.5px solid var(--border)' }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          background: isDark ? 'rgba(7,7,14,0.95)' : 'rgba(240,245,255,0.95)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <i className="ti ti-messages" style={{ fontSize: 18, color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Чаты</span>
              {projects.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(127,119,221,0.14)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                  {projects.length}
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '60%', marginBottom: 8, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 6 }} />
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div style={{ padding: '52px 20px', textAlign: 'center' }}>
                <i className="ti ti-message-off" style={{ fontSize: 34, color: 'var(--text-muted)', opacity: 0.2, display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Нет активных чатов</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                  Чат появляется когда клиент принимает заявку и проект переходит в статус «В работе»
                </div>
                <Link to={user?.role === 'client' ? '/projects/new' : '/projects'} style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 18px' }}>
                    {user?.role === 'client' ? 'Создать проект' : 'Найти проекты'}
                  </button>
                </Link>
              </div>
            ) : projects.map(p => {
              const isActive = p.id === selectedId
              const preview = lastMsgPreview(p)
              const lastTime = lastMessages[p.id]
                ? new Date(lastMessages[p.id].created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : null
              const partnerName = partners[p.id]?.full_name || (user?.role === 'client' ? 'Фрилансер' : 'Заказчик')
              return (
                <div key={p.id} style={{ position: 'relative' }}
                  onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '1' }}
                  onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '0' }}
                >
                  <button
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '12px 40px 12px 14px',
                      background: isActive ? (isDark ? 'rgba(127,119,221,0.1)' : 'rgba(59,91,219,0.07)') : 'transparent',
                      border: 'none',
                      borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                      cursor: 'pointer', display: 'flex', gap: 11, alignItems: 'center',
                      transition: 'background 0.12s',
                    }}
                  >
                    <Avatar src={partners[p.id]?.avatar_url} name={partnerName} size={44} style={{ flexShrink: 0, borderRadius: 13 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {partnerName}
                        </span>
                        {lastTime && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 6 }}>{lastTime}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview}
                      </div>
                    </div>
                  </button>
                  <button
                    className="del-btn"
                    onClick={() => setConfirmDeleteId(p.id)}
                    title="Удалить переписку"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 7, opacity: 0, transition: 'opacity 0.15s' }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 15 }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CHAT WINDOW ── */}
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <i className="ti ti-message-2" style={{ fontSize: 48, color: 'var(--text-muted)', opacity: 0.15 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', opacity: 0.5 }}>Выберите чат</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.35 }}>Чаты по активным проектам слева</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{
              padding: '12px 20px', borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12,
              background: isDark ? 'rgba(7,7,14,0.88)' : 'rgba(240,245,255,0.88)',
              backdropFilter: 'blur(12px)', flexShrink: 0,
            }}>
              {partner
                ? <Avatar src={partner.avatar_url} name={partner.full_name} size={38} />
                : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(127,119,221,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-user" style={{ fontSize: 17, color: 'var(--accent)' }} />
                  </div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, fontFamily: 'Syne, sans-serif' }}>
                  {partner?.full_name || (user?.role === 'client' ? 'Фрилансер' : 'Заказчик')}
                </div>
                <Link to={`/projects/${selected.id}`} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', opacity: 0.75, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-external-link" style={{ fontSize: 10 }} />
                  {selected.title}
                </Link>
              </div>
              {st && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: st.bg, color: st.color, fontWeight: 600, flexShrink: 0 }}>
                  {st.label}
                </span>
              )}
              <button
                onClick={() => setConfirmDeleteId(selected.id)}
                title="Удалить переписку"
                style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: '0.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0, transition: 'all 0.13s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#F87171' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <i className="ti ti-trash" style={{ fontSize: 15 }} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingBottom: 8 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  <i className="ti ti-message-circle" style={{ fontSize: 32, display: 'block', marginBottom: 12, opacity: 0.2 }} />
                  <div style={{ fontSize: 13, opacity: 0.5 }}>Начните переписку</div>
                </div>
              ) : messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={String(msg.sender_id) === String(user?.id)}
                  isDark={isDark}
                  onDelete={handleDeleteMessage}
                  onEdit={handleEditMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 14px', borderTop: '0.5px solid var(--border)',
              background: isDark ? 'rgba(7,7,14,0.88)' : 'rgba(240,245,255,0.88)',
              backdropFilter: 'blur(12px)', flexShrink: 0,
            }}>
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
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || recording} title="Прикрепить файл"
                  style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '0.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: uploading ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.13s' }}>
                  {uploading ? <i className="ti ti-loader-2" style={{ fontSize: 17, animation: 'spin 0.8s linear infinite' }} /> : <i className="ti ti-paperclip" style={{ fontSize: 17 }} />}
                </button>
                <button type="button" onClick={handleVoice} disabled={uploading} title={recording ? 'Остановить запись' : 'Голосовое сообщение'}
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
