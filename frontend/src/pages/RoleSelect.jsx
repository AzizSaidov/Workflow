import { useNavigate, Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import StarBackground from '../components/StarBackground'
import ThemeToggle from '../components/ThemeToggle'

export default function RoleSelect() {
  const { isDark } = useThemeStore()
  const navigate = useNavigate()

  const choose = (role) => navigate('/register', { state: { role } })

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
        <Link to="/" style={{ textDecoration: 'none', marginBottom: 40 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            work<span style={{ color: 'var(--accent)' }}>flow</span>
          </span>
        </Link>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 12, padding: '6px 16px', borderRadius: 20, marginBottom: 16,
          fontWeight: 500,
          background: isDark ? 'rgba(127,119,221,0.08)' : 'rgba(80,72,213,0.08)',
          border: `0.5px solid ${isDark ? 'rgba(127,119,221,0.2)' : 'rgba(80,72,213,0.22)'}`,
          color: 'var(--accent)',
        }}>
          <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Добро пожаловать
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 44, fontWeight: 800, letterSpacing: '-1.8px', textAlign: 'center', lineHeight: 1.08, marginBottom: 12, color: 'var(--text-primary)' }}>
          Кто ты?
        </h1>
        <p style={{ fontSize: 16, textAlign: 'center', fontWeight: 300, marginBottom: 48, maxWidth: 360, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Выбери роль — это займёт меньше минуты. Можно сменить позже.
        </p>

        <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 620, marginBottom: 36 }}>
          <RoleCard
            isDark={isDark}
            variant="client"
            icon="briefcase"
            title="Заказчик"
            desc="Размещаю проекты и нанимаю лучших специалистов для своих задач."
            features={['Публикация проектов', 'Выбор из заявок фрилансеров', 'Безопасная эскроу-оплата', 'Отзывы и рейтинги']}
            btnLabel="Я заказчик"
            onChoose={() => choose('client')}
          />
          <RoleCard
            isDark={isDark}
            variant="freelancer"
            icon="code"
            title="Фрилансер"
            desc="Нахожу интересные проекты и зарабатываю на своих навыках."
            features={['Поиск и фильтрация проектов', 'Подача заявок (биддинг)', 'Портфолио и профиль', 'Гарантированная оплата']}
            btnLabel="Я фрилансер"
            onChoose={() => choose('freelancer')}
          />
        </div>

        <div className="gradient-divider" style={{ width: 340, marginBottom: 24 }} />
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Войти</Link>
        </p>
      </div>
    </div>
  )
}

function RoleCard({ isDark, variant, icon, title, desc, features, btnLabel, onChoose }) {
  const isClient = variant === 'client'
  const accent = isClient
    ? (isDark ? '#7F77DD' : '#5048D5')
    : (isDark ? '#5DCAA5' : '#0D9268')
  const borderBase = isClient
    ? (isDark ? 'rgba(127,119,221,0.15)' : 'rgba(80,72,213,0.18)')
    : (isDark ? 'rgba(93,202,165,0.15)' : 'rgba(13,146,104,0.18)')
  const borderHover = isClient
    ? (isDark ? 'rgba(127,119,221,0.55)' : 'rgba(80,72,213,0.5)')
    : (isDark ? 'rgba(93,202,165,0.5)' : 'rgba(13,146,104,0.45)')
  const shadowHover = isClient
    ? (isDark ? '0 0 40px rgba(127,119,221,0.12)' : '0 8px 40px rgba(80,72,213,0.13)')
    : (isDark ? '0 0 40px rgba(93,202,165,0.1)' : '0 8px 40px rgba(13,146,104,0.11)')

  return (
    <div
      onClick={onChoose}
      style={{
        flex: 1, borderRadius: 22, padding: '34px 26px', cursor: 'pointer',
        background: 'var(--bg-card)',
        border: `1px solid ${borderBase}`,
        transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-7px)'
        e.currentTarget.style.borderColor = borderHover
        e.currentTarget.style.boxShadow = shadowHover
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = borderBase
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ width: 58, height: 58, borderRadius: 15, background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 25, color: accent }} />
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 7, color: 'var(--text-primary)' }}>{title}</div>
      <p style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 22, fontWeight: 300, color: 'var(--text-secondary)' }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
        {features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            {f}
          </div>
        ))}
      </div>
      <button
        className="btn"
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 14,
          fontWeight: 600, fontFamily: 'Syne, sans-serif',
          background: accent, color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}
      >
        <i className="ti ti-arrow-right" />
        {btnLabel}
      </button>
    </div>
  )
}
