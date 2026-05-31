import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { isDark } = useThemeStore()

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />
      <Navbar />
      <div style={{ paddingTop: 96, minHeight: '80vh', position: 'relative', zIndex: 2 }}>
        <div className="container">
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
            Привет, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Роль: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{user?.role}</span>
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 12,
            background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.25)',
            color: '#5DCAA5', fontSize: 14,
          }}>
            <i className="ti ti-check" />
            Авторизация работает! Этап 3 ✓
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
