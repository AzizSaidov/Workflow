import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { authApi } from '../api/auth'
import StarBackground from '../components/StarBackground'
import ThemeToggle from '../components/ThemeToggle'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const { isDark } = useThemeStore()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

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
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="full" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />

      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '60px 24px',
      }}>
        <Link to="/" style={{ textDecoration: 'none', marginBottom: 36 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            work<span style={{ color: 'var(--accent)' }}>flow</span>
          </span>
        </Link>

        <div style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 22, padding: '36px 32px',
          boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(80,72,213,0.1)',
        }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
            Добро пожаловать
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            Войдите в свой аккаунт
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon="mail"
              value={form.email}
              onChange={set('email')}
              required
            />
            <div>
              <Input
                label="Пароль"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                icon="lock"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', marginTop: 6, padding: 0 }}
              >
                {showPwd ? 'Скрыть пароль' : 'Показать пароль'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: 4 }}>
              Войти
            </Button>
          </form>

          <div className="gradient-divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Нет аккаунта?{' '}
            <Link to="/role" style={{ color: 'var(--accent)', fontWeight: 500 }}>Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
