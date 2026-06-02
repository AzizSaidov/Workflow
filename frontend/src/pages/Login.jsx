import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { authApi } from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'
import Input from '../components/Input'
import Button from '../components/Button'
import Globe from '../components/Globe'

function requestGeolocation(userId, onSaved) {
  if (!navigator.geolocation) return
  const key = `geo-asked-${userId}`
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, '1')
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      authApi.updateLocation(coords.latitude, coords.longitude)
        .then(() => onSaved(coords.latitude, coords.longitude))
        .catch(() => {})
    },
    () => {}
  )
}

const DEMO_LOCATIONS = [
  { lat: 40.7, lng: -74.0, role: 'client' },
  { lat: 51.5, lng: -0.1, role: 'freelancer' },
  { lat: 48.8, lng: 2.3, role: 'client' },
  { lat: 35.6, lng: 139.6, role: 'freelancer' },
  { lat: -33.8, lng: 151.2, role: 'client' },
  { lat: 55.7, lng: 37.6, role: 'freelancer' },
  { lat: 1.3, lng: 103.8, role: 'client' },
  { lat: 41.0, lng: 28.9, role: 'freelancer' },
  { lat: 19.0, lng: 72.8, role: 'client' },
  { lat: 37.5, lng: 127.0, role: 'freelancer' },
]

function AuthLeft({ isDark }) {
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
      {/* Animated glow orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.14) 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '55%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 0.8s', pointerEvents: 'none' }} />

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
            <i className="ti ti-shield-check" style={{ fontSize: 15, color: '#5DCAA5' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Эскроу</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>100% защита</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '28%', left: '5%', animation: 'floatUpDelay 4s ease-in-out infinite 0.8s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-robot" style={{ fontSize: 15, color: '#5DCAA5' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>AI-ассистент</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Llama 3.3 70B</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '28%', left: '6%', animation: 'floatUp 3.8s ease-in-out infinite 1.2s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-users" style={{ fontSize: 15, color: '#7F77DD' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>1,200+</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>фрилансеров</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '22%', right: '6%', animation: 'floatUpDelay 4.2s ease-in-out infinite 0.4s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.85)', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,159,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-bolt" style={{ fontSize: 15, color: '#EF9F27' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Быстрый старт</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>За 5 минут</div>
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 }}>
          Фриланс-платформа нового поколения
        </p>
      </div>
    </div>
  )
}

export default function Login() {
  const { isDark } = useThemeStore()
  const { login, setUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(form.email, form.password)
      login(data.user, data.access_token, data.refresh_token)
      requestGeolocation(data.user.id, (lat, lng) => {
        setUser({ ...data.user, latitude: lat, longitude: lng })
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left panel */}
      <AuthLeft isDark={isDark} />

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative', overflowY: 'auto',
      }}>
        {/* Theme toggle */}
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 8 }}>
              Добро пожаловать
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Войдите в свой аккаунт Workflow
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Email" type="email" placeholder="you@example.com" icon="mail" value={form.email} onChange={set('email')} required />

            <div>
              <Input label="Пароль" type={showPwd ? 'text' : 'password'} placeholder="••••••••" icon="lock" value={form.password} onChange={set('password')} required />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', marginTop: 6, padding: 0 }}>
                {showPwd ? 'Скрыть' : 'Показать пароль'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: 4, height: 46 }}>
              Войти
            </Button>
          </form>

          <div className="gradient-divider" style={{ margin: '28px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Нет аккаунта?{' '}
            <Link to="/role" style={{ color: 'var(--accent)', fontWeight: 600 }}>Зарегистрироваться</Link>
          </p>

          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
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
