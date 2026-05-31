import useThemeStore from './store/themeStore'
import StarBackground from './components/StarBackground'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const { isDark } = useThemeStore()

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="full" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />
      <div className="glow-blob glow-3" />

      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '60px 24px',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: '-0.5px',
          marginBottom: 40,
          color: 'var(--text-primary)',
        }}>
          work<span style={{ color: 'var(--accent)' }}>flow</span>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 12,
          padding: '6px 16px',
          borderRadius: 20,
          marginBottom: 16,
          fontWeight: 500,
          background: isDark ? 'rgba(127,119,221,0.08)' : 'rgba(80,70,200,0.08)',
          border: isDark ? '0.5px solid rgba(127,119,221,0.2)' : '0.5px solid rgba(80,70,200,0.22)',
          color: isDark ? '#AFA9EC' : '#4038B2',
        }}>
          <span className="blink" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isDark ? '#7F77DD' : '#4038B2',
            display: 'inline-block',
          }} />
          Добро пожаловать
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: '-1.8px',
          textAlign: 'center',
          lineHeight: 1.08,
          marginBottom: 12,
          color: 'var(--text-primary)',
        }}>
          Кто ты?
        </h1>
        <p style={{
          fontSize: 16,
          textAlign: 'center',
          fontWeight: 300,
          marginBottom: 48,
          maxWidth: 360,
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}>
          Выбери роль — это займёт меньше минуты. Можно сменить позже.
        </p>

        {/* Role cards */}
        <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 620, marginBottom: 36 }}>
          {/* Client */}
          <div style={{
            flex: 1,
            borderRadius: 22,
            padding: '34px 26px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            border: isDark ? '1px solid rgba(127,119,221,0.15)' : '1px solid rgba(80,70,200,0.18)',
            transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-7px)'
              e.currentTarget.style.borderColor = isDark ? 'rgba(127,119,221,0.55)' : 'rgba(80,70,200,0.5)'
              e.currentTarget.style.boxShadow = isDark ? '0 0 40px rgba(127,119,221,0.12)' : '0 8px 40px rgba(80,70,200,0.13)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = isDark ? 'rgba(127,119,221,0.15)' : 'rgba(80,70,200,0.18)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 58, height: 58, borderRadius: 15,
              background: isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,70,200,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <i className="ti ti-briefcase" style={{ fontSize: 25, color: isDark ? '#7F77DD' : '#4038B2' }} />
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 7, color: 'var(--text-primary)' }}>
              Заказчик
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 22, fontWeight: 300, color: 'var(--text-secondary)' }}>
              Размещаю проекты и нанимаю лучших специалистов для своих задач.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
              {['Публикация проектов', 'Выбор из заявок фрилансеров', 'Безопасная эскроу-оплата', 'Отзывы и рейтинги'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: isDark ? '#7F77DD' : '#4038B2', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>
              <i className="ti ti-arrow-right" /> Я заказчик
            </button>
          </div>

          {/* Freelancer */}
          <div style={{
            flex: 1,
            borderRadius: 22,
            padding: '34px 26px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            border: isDark ? '1px solid rgba(93,202,165,0.15)' : '1px solid rgba(16,140,103,0.18)',
            transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-7px)'
              e.currentTarget.style.borderColor = isDark ? 'rgba(93,202,165,0.5)' : 'rgba(16,140,103,0.45)'
              e.currentTarget.style.boxShadow = isDark ? '0 0 40px rgba(93,202,165,0.1)' : '0 8px 40px rgba(16,140,103,0.11)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = isDark ? 'rgba(93,202,165,0.15)' : 'rgba(16,140,103,0.18)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 58, height: 58, borderRadius: 15,
              background: isDark ? 'rgba(93,202,165,0.12)' : 'rgba(16,140,103,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <i className="ti ti-code" style={{ fontSize: 25, color: isDark ? '#5DCAA5' : '#108C67' }} />
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 7, color: 'var(--text-primary)' }}>
              Фрилансер
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 22, fontWeight: 300, color: 'var(--text-secondary)' }}>
              Нахожу интересные проекты и зарабатываю на своих навыках.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
              {['Поиск и фильтрация проектов', 'Подача заявок (биддинг)', 'Портфолио и профиль', 'Гарантированная оплата'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: isDark ? '#5DCAA5' : '#108C67', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            <button className="btn btn-green" style={{ width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>
              <i className="ti ti-arrow-right" /> Я фрилансер
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="gradient-divider" style={{ width: 340, marginBottom: 26 }} />
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Уже есть аккаунт?{' '}
          <a href="#" style={{ color: 'var(--accent)', fontWeight: 500 }}>Войти</a>
        </p>
      </div>
    </div>
  )
}
