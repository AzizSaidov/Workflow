import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { authApi } from '../api/auth'
import StarBackground from '../components/StarBackground'
import ThemeToggle from '../components/ThemeToggle'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Register() {
  const { isDark } = useThemeStore()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const defaultRole = location.state?.role || 'freelancer'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm: '',
    role: defaultRole,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 6) {
      setError('Минимум 6 символов')
      return
    }
    setLoading(true)
    try {
      await authApi.register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role })
      const { data: tokens } = await authApi.login(form.email, form.password)
      const { data: me } = await authApi.getMe(tokens.access_token)
      login(me, tokens.access_token, tokens.refresh_token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const isClient = form.role === 'client'

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
        <Link to="/" style={{ textDecoration: 'none', marginBottom: 32 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            work<span style={{ color: 'var(--accent)' }}>flow</span>
          </span>
        </Link>

        <div style={{
          width: '100%', maxWidth: 440,
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 22, padding: '36px 32px',
          boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(80,72,213,0.1)',
        }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
            Создать аккаунт
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Присоединяйтесь к Workflow
          </p>

          {/* Role toggle */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 24,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(80,72,213,0.06)',
            borderRadius: 10, padding: 4,
          }}>
            {[
              { value: 'client', icon: 'briefcase', label: 'Заказчик' },
              { value: 'freelancer', icon: 'code', label: 'Фрилансер' },
            ].map(({ value, icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: value }))}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 7, padding: '9px 0', borderRadius: 7, border: 'none',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  background: form.role === value ? 'var(--bg-card)' : 'transparent',
                  color: form.role === value ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: form.role === value ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(80,72,213,0.1)') : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <i className={`ti ti-${icon}`} style={{ fontSize: 15, color: form.role === value ? 'var(--accent)' : 'inherit' }} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Полное имя"
              placeholder="Азиз Саидов"
              icon="user"
              value={form.full_name}
              onChange={set('full_name')}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon="mail"
              value={form.email}
              onChange={set('email')}
              required
            />
            <Input
              label="Пароль"
              type={showPwd ? 'text' : 'password'}
              placeholder="Минимум 6 символов"
              icon="lock"
              value={form.password}
              onChange={set('password')}
              required
            />
            <div>
              <Input
                label="Повторите пароль"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                icon="lock-check"
                value={form.confirm}
                onChange={set('confirm')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', marginTop: 6, padding: 0 }}
              >
                {showPwd ? 'Скрыть пароли' : 'Показать пароли'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                <i className="ti ti-alert-circle" style={{ color: '#F87171', fontSize: 15 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{error}</span>
              </div>
            )}

            <Button type="submit" variant={isClient ? 'primary' : 'green'} loading={loading} style={{ width: '100%', marginTop: 4 }}>
              {isClient ? 'Зарегистрироваться как заказчик' : 'Зарегистрироваться как фрилансер'}
            </Button>
          </form>

          <div className="gradient-divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
