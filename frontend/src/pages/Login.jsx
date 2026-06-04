import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const isBlocked = searchParams.get('blocked') === '1'
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
    <div style={{ display: 'flex', minHeight: '100vh', background: isDark ? 'var(--bg)' : '#F5F8FF' }}>
      <AuthLeft isDark={isDark} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', overflowY: 'auto', background: isDark ? 'transparent' : 'linear-gradient(160deg, #F5F8FF 0%, #FEFCF5 100%)' }}>
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

          {isBlocked && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '14px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.3)',
            }}>
              <i className="ti ti-lock" style={{ color: '#F87171', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F87171', marginBottom: 2 }}>Аккаунт заблокирован</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Ваш аккаунт был заблокирован администратором. Свяжитесь с поддержкой для уточнения деталей.
                </div>
              </div>
            </div>
          )}

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
