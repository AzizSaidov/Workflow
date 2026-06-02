import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../api/ai'
import useThemeStore from '../store/themeStore'

function typeText(text, setter, onDone, speed = 8) {
  let i = 0
  let current = ''
  setter('')
  const tick = () => {
    if (i >= text.length) { onDone?.(); return }
    const chunk = Math.min(4, text.length - i)
    current += text.slice(i, i + chunk)
    setter(current)
    i += chunk
    setTimeout(tick, speed)
  }
  tick()
}

export default function AITextarea({
  value, onChange, placeholder, rows = 4,
  aiContext,   // { mode: 'bid'|'project'|'free', projectTitle, projectDescription, category, budget, skills }
  label,
  style,
}) {
  const { isDark } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runAI = async (action) => {
    setMenuOpen(false)
    setLoading(true)
    try {
      let result = ''

      if (action === 'generate' && aiContext?.mode === 'bid') {
        const { data } = await aiApi.helpBid(
          aiContext.projectTitle || '',
          aiContext.projectDescription || '',
          aiContext.skills || []
        )
        result = data.cover_letter

      } else if (action === 'generate' && aiContext?.mode === 'project') {
        const { data } = await aiApi.helpProject(
          aiContext.projectTitle || '',
          value || '',
          aiContext.category || '',
          aiContext.budget || ''
        )
        result = data.description

      } else if (action === 'improve') {
        const { data } = await aiApi.chat(
          `Исправь грамматику и стиль текста, НЕ меняя смысл, факты, числа и намерение автора. Верни только исправленный текст без пояснений:\n\n${value}`
        )
        result = data.text

      } else if (action === 'shorten') {
        const { data } = await aiApi.chat(
          `Сократи этот текст вдвое, сохранив всю ключевую информацию, числа и факты. Не добавляй ничего нового. Верни только сокращённый текст без комментариев:\n\n${value}`
        )
        result = data.text

      } else if (action === 'translate') {
        const { data } = await aiApi.chat(
          `Переведи этот текст на английский язык. Верни только перевод без комментариев:\n\n${value}`
        )
        result = data.text
      }

      if (result) {
        setTyping(true)
        typeText(result, (v) => onChange({ target: { value: v } }), () => setTyping(false))
      }
    } catch (err) {
      console.error('AI error:', err)
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = aiContext?.mode === 'bid' || aiContext?.mode === 'project'
  const canEdit = value && value.trim().length > 10

  const menuItems = [
    canGenerate && { action: 'generate', icon: 'sparkles', label: aiContext?.mode === 'bid' ? 'Generate cover letter' : 'Generate description', highlight: true },
    canEdit && { action: 'improve', icon: 'wand', label: 'Improve text' },
    canEdit && { action: 'shorten', icon: 'arrows-minimize', label: 'Shorten' },
    canEdit && { action: 'translate', icon: 'language', label: 'Translate to English' },
  ].filter(Boolean)

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={loading}
          className="input"
          style={{
            resize: 'vertical', lineHeight: 1.6,
            paddingRight: 44,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s',
            border: typing ? '0.5px solid rgba(127,119,221,0.5)' : undefined,
            ...style,
          }}
        />

        {/* ✨ button */}
        <div ref={menuRef} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            disabled={loading || typing}
            title="AI Assistant"
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: menuOpen
                ? '0.5px solid rgba(127,119,221,0.6)'
                : '0.5px solid rgba(127,119,221,0.25)',
              background: menuOpen
                ? 'rgba(127,119,221,0.18)'
                : isDark ? 'rgba(127,119,221,0.08)' : 'rgba(127,119,221,0.06)',
              cursor: loading || typing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              color: 'var(--accent)',
              flexShrink: 0,
            }}
          >
            {loading ? (
              <i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
            )}
          </button>

          {/* Dropdown menu */}
          {menuOpen && !loading && (
            <div style={{
              position: 'absolute', top: 34, right: 0,
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '5px 0',
              minWidth: 210,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 200,
            }}>
              <div style={{ padding: '6px 12px 8px', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '0.5px solid var(--border)', marginBottom: 4 }}>
                <i className="ti ti-sparkles" style={{ marginRight: 4 }} />
                AI Assistant
              </div>
              {menuItems.length === 0 ? (
                <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                  Type something first to use AI editing
                </div>
              ) : menuItems.map(item => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => runAI(item.action)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '8px 14px', fontSize: 13,
                    background: item.highlight ? 'rgba(127,119,221,0.07)' : 'none',
                    border: 'none', cursor: 'pointer',
                    color: item.highlight ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.1)' : 'rgba(127,119,221,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = item.highlight ? 'rgba(127,119,221,0.07)' : 'none'}
                >
                  <i className={`ti ti-${item.icon}`} style={{ fontSize: 15, flexShrink: 0, color: item.highlight ? 'var(--accent)' : 'inherit' }} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Typing indicator */}
      {typing && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(127,119,221,0.08)',
          border: '0.5px solid rgba(127,119,221,0.2)',
          fontSize: 12, color: 'var(--accent)',
          width: 'fit-content',
        }}>
          <span style={{ display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)',
                animation: 'bounce 1s ease infinite',
                animationDelay: `${i * 0.15}s`,
                display: 'inline-block',
              }} />
            ))}
          </span>
          <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
          AI is writing...
        </div>
      )}
    </div>
  )
}
