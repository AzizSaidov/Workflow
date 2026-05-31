import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import ThemeToggle from './ThemeToggle'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { isDark } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 44px',
      height: 64,
      background: scrolled
        ? isDark ? 'rgba(7,7,14,0.92)' : 'rgba(248,247,255,0.92)'
        : isDark ? 'rgba(7,7,14,0.6)' : 'rgba(248,247,255,0.7)',
      borderBottom: scrolled
        ? isDark ? '0.5px solid rgba(255,255,255,0.07)' : '0.5px solid rgba(80,72,213,0.12)'
        : '0.5px solid transparent',
      backdropFilter: 'blur(16px)',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22,
          letterSpacing: '-0.5px', color: 'var(--text-primary)',
        }}>
          work<span style={{ color: 'var(--accent)' }}>flow</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {[
          { to: '/projects', label: 'Проекты' },
          { to: '/freelancers', label: 'Таланты' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{
            fontSize: 14, fontWeight: isActive(to) ? 500 : 400,
            color: isActive(to) ? 'var(--text-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />

        {isAuthenticated() ? (
          <>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="btn btn-outline btn-sm">
                <i className="ti ti-layout-dashboard" />
                Кабинет
              </button>
            </Link>
            <div
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Avatar src={user?.avatar_url} name={user?.full_name} size={36} online />
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 46, right: 0,
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 12, padding: '6px 0',
                  minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  zIndex: 200,
                }}>
                  <div style={{ padding: '10px 16px 8px', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {user?.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.email}
                    </div>
                  </div>
                  {[
                    { to: `/profile/${user?.id}`, icon: 'user', label: 'Профиль' },
                    { to: '/wallet', icon: 'wallet', label: 'Кошелёк' },
                    { to: '/dashboard', icon: 'layout-dashboard', label: 'Дашборд' },
                  ].map(({ to, icon, label }) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', fontSize: 14,
                      color: 'var(--text-secondary)', textDecoration: 'none',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <i className={`ti ti-${icon}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '0.5px solid var(--border)', marginTop: 4 }} />
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 16px', fontSize: 14,
                    color: '#F87171', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="ti ti-logout" style={{ fontSize: 15 }} />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-outline btn-sm">Войти</button>
            </Link>
            <Link to="/role">
              <button className="btn btn-primary btn-sm">Начать</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
