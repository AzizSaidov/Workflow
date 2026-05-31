import { useEffect, useRef, useState } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { chatsApi, createChatWS } from '../api/chats'
import Avatar from './Avatar'

export default function ChatWidget({ projectId }) {
  const { user, accessToken } = useAuthStore()
  const { isDark } = useThemeStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    chatsApi.getHistory(projectId)
      .then(r => setMessages(r.data || []))
      .catch(() => {})
  }, [projectId])

  useEffect(() => {
    if (!accessToken || !projectId) return
    const ws = createChatWS(projectId, accessToken)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      } catch {}
    }

    return () => ws.close()
  }, [projectId, accessToken])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (e) => {
    e.preventDefault()
    if (!input.trim() || !connected) return
    wsRef.current?.send(input.trim())
    setInput('')
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="ti ti-message-circle" style={{ fontSize: 18, color: 'var(--accent)' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Чат по проекту</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: connected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--accent-green)' : 'var(--text-muted)', display: 'inline-block' }} />
          {connected ? 'Онлайн' : 'Подключение...'}
        </span>
      </div>

      {/* Messages */}
      <div style={{ height: 380, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ textAlign: 'center' }}>
              <i className="ti ti-message-dots" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.3 }} />
              Начните общение
            </div>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!isOwn && <Avatar name="?" size={28} />}
              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isOwn
                  ? isDark ? 'rgba(127,119,221,0.25)' : 'rgba(80,72,213,0.15)'
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: isOwn
                  ? `0.5px solid ${isDark ? 'rgba(127,119,221,0.3)' : 'rgba(80,72,213,0.2)'}`
                  : '0.5px solid var(--border)',
              }}>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={connected ? 'Написать сообщение...' : 'Ожидание подключения...'}
          disabled={!connected}
          autoComplete="off"
          className="input"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={!connected || !input.trim()} className="btn btn-primary btn-sm" style={{ flexShrink: 0, padding: '0 16px' }}>
          <i className="ti ti-send" style={{ fontSize: 16 }} />
        </button>
      </form>
    </div>
  )
}
