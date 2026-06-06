import { Link, useNavigate } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useSEO } from '../hooks/useSEO'

function getQuickLinks(user) {
  const home = { to: '/', icon: 'home', label: 'Главная' }
  if (!user) {
    return [
      home,
      { to: '/projects',    icon: 'briefcase', label: 'Найти работу' },
      { to: '/freelancers', icon: 'users',     label: 'Найти таланты' },
    ]
  }
  if (user.is_admin || user.role === 'admin') {
    return [
      home,
      { to: '/admin',       icon: 'shield-lock', label: 'Панель' },
      { to: '/projects',    icon: 'briefcase',   label: 'Проекты' },
      { to: '/freelancers', icon: 'users',       label: 'Пользователи' },
    ]
  }
  if (user.role === 'client') {
    return [
      home,
      { to: '/freelancers', icon: 'users',            label: 'Найти таланты' },
      { to: '/dashboard',   icon: 'layout-dashboard', label: 'Мои проекты' },
      { to: '/chats',       icon: 'messages',         label: 'Чаты' },
    ]
  }
  return [
    home,
    { to: '/projects',  icon: 'briefcase',        label: 'Найти работу' },
    { to: '/dashboard', icon: 'layout-dashboard', label: 'Мои заявки' },
    { to: '/chats',     icon: 'messages',         label: 'Чаты' },
  ]
}

export default function NotFound() {
  useSEO({ title: 'Страница не найдена' })
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const quickLinks = getQuickLinks(user)

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StarBackground isDark={isDark} intensity="full" />
      <Navbar />

      <style>{`
        @keyframes nfFloat   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes nfRing    { from { transform: translate(-50%,-50%) rotate(-20deg); } to { transform: translate(-50%,-50%) rotate(340deg); } }
        @keyframes nfRise    { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nfTwinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
        @keyframes nfSunRays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nfSunGlow { 0%,100% { opacity: .8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
      `}</style>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2, padding: '120px 24px 80px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, animation: 'nfFloat 6s ease-in-out infinite' }}>
          <Digit>4</Digit>

          {isDark ? <Moon /> : <Sun />}

          <Digit>4</Digit>
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-1px',
          color: 'var(--text-primary)', marginTop: 40, marginBottom: 12,
          animation: 'nfRise 0.6s ease both 0.1s',
        }}>
          Эта страница улетела на другую орбиту
        </h1>
        <p style={{
          fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6,
          maxWidth: 440, marginBottom: 32, animation: 'nfRise 0.6s ease both 0.2s',
        }}>
          Мы обыскали всю галактику, но такой страницы не нашли.
          Возможно, ссылка устарела или вы ошиблись адресом.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', animation: 'nfRise 0.6s ease both 0.3s' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} /> Назад
          </button>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-home" style={{ fontSize: 16 }} /> На главную
            </button>
          </Link>
        </div>

        <div style={{ marginTop: 44, animation: 'nfRise 0.6s ease both 0.4s' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Или загляните сюда
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {quickLinks.map(l => (
              <Link key={l.to} to={l.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10,
                  background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                  fontSize: 13, color: 'var(--text-secondary)', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <i className={`ti ti-${l.icon}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
                  {l.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Moon() {
  return (
    <div style={{ position: 'relative', width: 150, height: 150, margin: '0 6px', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: -34, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.38) 0%, transparent 70%)', filter: 'blur(6px)', pointerEvents: 'none' }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 34% 30%, #B7AFFA 0%, #7F77DD 42%, #4A3F9E 100%)',
        boxShadow: 'inset -14px -14px 34px rgba(0,0,0,0.45), 0 0 46px rgba(127,119,221,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '28%', left: '26%', width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.17)' }} />
        <div style={{ position: 'absolute', top: '56%', left: '54%', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.14)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '63%', width: 12, height: 12, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
        <div style={{ position: 'absolute', top: '12%', left: '16%', width: 40, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', filter: 'blur(4px)' }} />
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 224, height: 64, transform: 'translate(-50%,-50%) rotate(-20deg)',
        borderRadius: '50%', border: '7px solid rgba(93,202,165,0.5)',
        borderTopColor: 'transparent', borderBottomColor: 'transparent',
        animation: 'nfRing 14s linear infinite', pointerEvents: 'none',
      }} />
    </div>
  )
}

function Sun() {
  return (
    <div style={{ position: 'relative', width: 150, height: 150, margin: '0 6px', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: -42, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,176,59,0.5) 0%, rgba(245,158,11,0.15) 45%, transparent 70%)',
        filter: 'blur(6px)', pointerEvents: 'none', animation: 'nfSunGlow 4s ease-in-out infinite',
      }} />

      <div style={{ position: 'absolute', inset: 0, animation: 'nfSunRays 26s linear infinite', pointerEvents: 'none' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: i % 2 ? 4 : 6, height: i % 2 ? 14 : 22, borderRadius: 4,
            background: 'linear-gradient(to top, rgba(251,176,59,0), rgba(253,186,75,0.95))',
            transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(-94px)`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 32%, #FFF6D6 0%, #FFD75E 36%, #F9A826 72%, #F2820D 100%)',
        boxShadow: 'inset -10px -10px 30px rgba(170,80,0,0.35), 0 0 52px rgba(251,176,59,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '54%', left: '30%', width: 20, height: 20, borderRadius: '50%', background: 'rgba(200,90,0,0.16)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '58%', width: 13, height: 13, borderRadius: '50%', background: 'rgba(200,90,0,0.13)' }} />
        <div style={{ position: 'absolute', top: '12%', left: '18%', width: 42, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(5px)' }} />
      </div>
    </div>
  )
}

function Digit({ children }) {
  return (
    <span style={{
      fontFamily: 'Syne, sans-serif', fontSize: 170, fontWeight: 800, lineHeight: 1,
      letterSpacing: '-4px',
      background: 'linear-gradient(150deg, #7F77DD 0%, #5DCAA5 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      userSelect: 'none',
    }}>
      {children}
    </span>
  )
}
