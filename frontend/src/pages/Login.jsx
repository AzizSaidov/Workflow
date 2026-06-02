import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { authApi } from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'
import Input from '../components/Input'
import Button from '../components/Button'
import AuthLeft from '../components/AuthLeft'

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
      <AuthLeft isDark={isDark} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 8 }}>
              Добро пожаловать
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Войдите в свой аккаунт Workflow
            </p>
          </div>

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
