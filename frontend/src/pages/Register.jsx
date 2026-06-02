import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { authApi } from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'
import Input from '../components/Input'
import Button from '../components/Button'
import Globe from '../components/Globe'

const DEMO_LOCATIONS = [
  { lat: 40.7, lng: -74.0, role: 'client' },
  { lat: 51.5, lng: -0.1, role: 'freelancer' },
  { lat: 48.8, lng: 2.3, role: 'client' },
  { lat: 35.6, lng: 139.6, role: 'freelancer' },
  { lat: -33.8, lng: 151.2, role: 'client' },
  { lat: 55.7, lng: 37.6, role: 'freelancer' },
  { lat: 1.3, lng: 103.8, role: 'client' },
  { lat: 41.0, lng: 28.9, role: 'freelancer' },
]

function AuthLeft({ isDark, role }) {
  const isClient = role === 'client'
  return (
    <div style={{
      width: '52%', minHeight: '100vh', position: 'relative',
      background: isDark
        ? 'linear-gradient(160deg, #0A0A18 0%, #0D0D22 50%, #080812 100%)'
        : 'linear-gradient(160deg, #1a1a3e 0%, #0f0f2d 50%, #080818 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${isClient ? 'rgba(127,119,221,0.18)' : 'rgba(29,158,117,0.18)'} 0%, transparent 70%)`, animation: 'pulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatUpDelay { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 36 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#fff' }}>
            work<span style={{ color: '#7F77DD' }}>flow</span>
          </span>
        </Link>
      </div>

      {/* Globe */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <Globe locations={DEMO_LOCATIONS} width={380} height={380} />
      </div>

      {/* Floating badges */}
      <div style={{ position: 'absolute', top: '18%', right: '8%', animation: 'floatUp 3.5s ease-in-out infinite', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-lock" style={{ fontSize: 15, color: '#7F77DD' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800, color: '#fff' }}>$2,400</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>в эскроу</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '30%', left: '5%', animation: 'floatUpDelay 4s ease-in-out infinite 0.8s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-circle-check" style={{ fontSize: 15, color: '#5DCAA5' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Работа сдана</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>только что</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '28%', left: '6%', animation: 'floatUp 3.8s ease-in-out infinite 1.2s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,159,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-star-filled" style={{ fontSize: 15, color: '#EF9F27' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800, color: '#fff' }}>4.9 / 5</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>средний рейтинг</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '22%', right: '6%', animation: 'floatUpDelay 4.2s ease-in-out infinite 0.4s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-robot" style={{ fontSize: 15, color: '#7F77DD' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>AI-ассистент</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>в каждом проекте</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 }}>
          Присоединяйся к тысячам специалистов
        </p>
      </div>
    </div>
  )
}

export default function Register() {
  const { isDark } = useThemeStore()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const defaultRole = location.state?.role || 'freelancer'

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', role: defaultRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return }
    if (form.password.length < 6) { setError('Минимум 6 символов'); return }
    setLoading(true)
    try {
      const { data } = await authApi.register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role })
      login(data.user, data.access_token, data.refresh_token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const isClient = form.role === 'client'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AuthLeft isDark={isDark} role={form.role} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative', overflowY: 'auto',
      }}>
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 8 }}>
              Создать аккаунт
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Присоединяйтесь к Workflow бесплатно
            </p>
          </div>

          {/* Role toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(80,72,213,0.06)', borderRadius: 12, padding: 4 }}>
            {[
              { value: 'client', icon: 'briefcase', label: 'Заказчик' },
              { value: 'freelancer', icon: 'code', label: 'Фрилансер' },
            ].map(({ value, icon, label }) => (
              <button key={value} type="button" onClick={() => setForm(f => ({ ...f, role: value }))} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, padding: '10px 0', borderRadius: 9, border: 'none',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                background: form.role === value ? 'var(--bg-card)' : 'transparent',
                color: form.role === value ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: form.role === value ? (isDark ? '0 2px 10px rgba(0,0,0,0.4)' : '0 2px 10px rgba(80,72,213,0.1)') : 'none',
                transition: 'all 0.2s',
              }}>
                <i className={`ti ti-${icon}`} style={{ fontSize: 15, color: form.role === value ? 'var(--accent)' : 'inherit' }} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Полное имя" placeholder="Азиз Саидов" icon="user" value={form.full_name} onChange={set('full_name')} required />
            <Input label="Email" type="email" placeholder="you@example.com" icon="mail" value={form.email} onChange={set('email')} required />
            <Input label="Пароль" type={showPwd ? 'text' : 'password'} placeholder="Минимум 6 символов" icon="lock" value={form.password} onChange={set('password')} required />
            <div>
              <Input label="Повторите пароль" type={showPwd ? 'text' : 'password'} placeholder="••••••••" icon="lock-check" value={form.confirm} onChange={set('confirm')} required />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', marginTop: 6, padding: 0 }}>
                {showPwd ? 'Скрыть пароли' : 'Показать пароли'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
              </div>
            )}

            <Button type="submit" variant={isClient ? 'primary' : 'green'} loading={loading} style={{ width: '100%', marginTop: 4, height: 46 }}>
              {isClient ? 'Зарегистрироваться как заказчик' : 'Зарегистрироваться как фрилансер'}
            </Button>
          </form>

          <div className="gradient-divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войти</Link>
          </p>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
